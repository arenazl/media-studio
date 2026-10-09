// RUNNERS de las funciones del proceso guiado (lado backend = la "receta").
// El front manda { functionId, context, options, regenerate } a /api/run-function; acá se ARMA
// el prompt (con el molde correspondiente) y se PARSEA la respuesta de la IA. La llamada a la IA
// (runAI, Claude headless) la hace index.mjs: este módulo es PURO (sin red), así se puede testear
// sin gastar tokens. El molde de cada función NO se persiste por negocio: es la misma receta para
// todos, y la IA la aplica on-demand al KB de cada app.

import { scriptToText, scriptNarrations } from './scriptToText.mjs';
import { buildProjectFacts, factsText } from './projectFacts.mjs';
import { compileFlowPack, promptTraduccion, parseTraduccion } from './flowCompiler.mjs';
import { lintCommercial } from './lintCommercial.mjs';
import { PROMPT_VERSIONS, presupuestoLista, maxNarrationWords, esTalkingHead, WPS } from './prompting.mjs';

// extrae el primer objeto JSON de un texto (la IA a veces mete markdown o texto/explicación alrededor).
export function extractJson(text) {
  const str = text || '';
  const s = str.indexOf('{');
  if (s === -1) throw new Error('la IA no devolvió JSON');
  // intento 1: del primer { al último } (rápido, caso común: solo el objeto)
  const last = str.lastIndexOf('}');
  if (last > s) { try { return JSON.parse(str.slice(s, last + 1)); } catch { /* hay texto extra, sigo */ } }
  // intento 2: primer objeto BALANCEADO (cuenta llaves respetando strings/escapes) — corta la basura posterior
  let depth = 0, inStr = false, esc = false;
  for (let i = s; i < str.length; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return JSON.parse(str.slice(s, i + 1)); }
  }
  throw new Error('la IA no devolvió un JSON válido');
}

// ── VEO: secuencia de prompts para un reel (human reel: hook humano → b-roll → cierre humano) ──
// Molde destilado del playbook Flow (docs/05-prompting-video/01-playbook-flow.md, battle-tested). Genera la secuencia para CUALQUIER
// negocio a partir de su contexto (nombre, marca fonética, guion, pantallas, brief).
const VEO_RULES = `REGLAS DE CADA prompt (battle-tested; van en INGLES salvo el dialogo, que va en español rioplatense):
- Realismo que NO cante a IA: "photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive face, not over-rendered and not CGI-perfect".
- POSICIONAMIENTO DE LOGO Y MARCA:
  * En la escena de CIERRE/CTA: "The uploaded brand logo 'logo.png' from assets is displayed clearly and prominently centered in the upper third of the 9:16 vertical frame".
  * En talking heads y b-rolls: "Keep the top center area of the frame uncluttered for top-centered brand logo overlay".
- Persona ATRACTIVA, de belleza convencional/hegemonica pero creible (no cara de IA): "a striking, conventionally beautiful and charismatic [Argentine ...] in her late 20s to early 30s, polished and camera-ready, with long sleek hair, defined attractive features and a confident, magnetic presence". Vestida y ambientada SEGUN el rubro del negocio (ej. blazer en una oficina), nunca fuera de contexto.
- TALKING HEAD (hook y cierre = los "videos iniciales") — reglas DURAS:
  * Plano MEDIO, de la cintura para arriba, camara a distancia conversacional (~2m): "medium shot, waist-up framing, she fills a good portion of the frame with strong, dominant presence". NUNCA wide full-body desde lejos, NUNCA la persona chica en el cuadro.
  * Entorno real del negocio en soft-focus de fondo (ej. oficina moderna y luminosa con escritorios y colegas), adaptado al rubro.
  * Camara QUIETA o con un push-IN MUY sutil: "the camera holds steady or does a very subtle slow push-in as she speaks". PROHIBIDO alejar: nada de "zoom out / pull back / dolly back" (achica al sujeto y mata la presencia).
  * EXPRESIVIDAD de venta: "warm, confident and charming tone, realistic expressive face".
  * Dialogo LARGO que COMENTA el producto y LLENA el clip (NO un gancho suelto): el talking head dura 8s (MINIMO 8s, el maximo de Flow), asi que decí una frase ENTERA de ~24-30 palabras que engancha Y explica el beneficio concreto del producto, fluida: "speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: '<frase larga que engancha y comenta el producto, con una pausa actuada en el ...>'". Marca fonetica SIEMPRE la fonetica que te paso (nunca el nombre escrito).
  * SIN silencio de relleno: la persona habla durante TODO el clip. PROHIBIDO "stays quiet until the end".
  * La MISMA persona en hook y cierre: en el flujo con Personajes por imagen la identidad la fija la IMAGEN de referencia; en cada prompt se la nombra por su NOMBRE + "Argentine" + una descripcion CORTA (ropa, edad aproximada). NUNCA se repite la descripcion fisica larga (fisicoEn).
- B-roll: "No spoken dialogue, ambient sound only" y "one single continuous take, same background, no cut". Si se ve una pantalla de app: "screen not clearly legible".
- Sin texto en pantalla dentro del prompt (el overlay se agrega en edicion).`;

// extrae del context los campos comunes que usan los moldes (project + piece).
function ctx(context) {
  const project = (context && context.project) || {};
  const piece = (context && context.piece) || {};
  // WO-2: el formato de la pieza (aspecto/plataforma/durDefault) parametriza los moldes. Sin formato
  // (proyectos viejos) → defaults idénticos a los hardcodeos anteriores (retrocompat byte-idéntica).
  const formato = piece.formato || {};
  return {
    name: project.name || 'el producto',
    phonetic: project.phonetic || project.name || '',
    // Fase 2 (P0.1): la FICHA de hechos por secciones; antes era el brief cortado a 2.500. `brief` es el
    // resumen corto (negocio + mensajes + oferta) para los moldes legacy; `facts` es la ficha entera y
    // cada molde pide las secciones que necesita (Regla 3 del Prompt Engine: input por función).
    brief: factsText(buildProjectFacts(project), ['negocio', 'mensajes', 'oferta']),
    facts: buildProjectFacts(project),
    // 1.2: las screens son METADATA (kind/headline/components/data), no URLs. Las describo para el molde.
    screens: Array.isArray(project.screens)
      ? project.screens.map((s) => (typeof s === 'string' ? s : [s.label, s.kind && `(${s.kind})`, s.headline].filter(Boolean).join(' '))).join(' · ')
      : '',
    // P0.2: antes sólo entendía el array legacy; con { blocks } quedaba vacío y publish/qa caían al brief.
    guion: scriptNarrations(piece.guion).join(' · '),
    angulo: piece.angulo || piece.angle || '',
    objetivo: piece.objetivo || piece.objective || '',
    aspecto: formato.aspecto || '9:16',
    plataforma: formato.plataforma || 'Instagram / TikTok',
    durationSec: Number(piece.durationSec) || Number(formato.durDefault) || 18,
  };
}

// ── Helpers de los moldes NUEVOS del rework (concept/cast/storyboard/flowpack) ──
// Estos moldes reciben los artefactos previos por `context.piece.<artefacto>` SIN aplanar (a
// diferencia de `ctx()`, que aplana `piece.guion` con join). Origen: docs/07-rework/02-fase-1.

// El guion de la pieza puede venir estructurado (Fase 2: { blocks:[{role,narration,visual}] }) o
// legacy (string[]). Devuelve texto plano legible para inyectar en el prompt.
function pieceGuionText(piece = {}) {
  return scriptToText(piece.guion, { roles: true });
}

// Describe las pantallas del KB 1.2 para el molde animado. Además de label/kind/headline suma la
// metadata RICA (components/flow) cuando el KB la trae — es lo que le permite al storyboard animado
// recrear la pantalla de verdad, no solo nombrarla. Retrocompat: una pantalla sin esos campos (o un
// screen legacy en string) produce EXACTAMENTE el mismo texto que antes.
function screensText(project = {}) {
  if (!Array.isArray(project.screens)) return '';
  return project.screens.map((s) => {
    if (typeof s === 'string') return s;
    const cab = [s.label, s.kind && `(${s.kind})`, s.headline].filter(Boolean).join(' ');
    const comps = Array.isArray(s.components) ? s.components.filter(Boolean).join(', ') : (s.components || '');
    const extra = [
      comps && `componentes: ${comps}`,
      s.layout && `layout: ${s.layout}`,
      s.flow && `flujo: ${s.flow}`,
    ].filter(Boolean).join(' — ');
    return extra ? `${cab} — ${extra}` : cab;
  }).join(' · ');
}

// ── MEDIA KIT (WO-K4) — las piezas REALES de la app como insumo de los moldes ──────────────────
// El front manda `context.piece.mediaKit` = { pantallas[], momentos[], cta } (src/lib/mediaKit.ts
// ::mediaKitParaMolde). RETROCOMPAT DURA: sin kit devuelve '' y los prompts quedan byte-idénticos.
function mediaKitText(piece = {}) {
  const mk = piece.mediaKit;
  if (!mk) return '';
  const pantallas = Array.isArray(mk.pantallas) ? mk.pantallas : [];
  const momentos = Array.isArray(mk.momentos) ? mk.momentos : [];
  const L = [];
  if (pantallas.length) {
    L.push('CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:');
    for (const p of pantallas) {
      L.push(`- ${p.nombre}${p.queDemuestra ? `: ${p.queDemuestra}` : ''}${p.microAnimacion ? ` — micro-animación: ${p.microAnimacion}` : ''}`);
    }
  }
  if (momentos.length) {
    L.push('MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):');
    for (const m of momentos) {
      const pant = Array.isArray(m.pantallas) && m.pantallas.length ? ` [${m.pantallas.join(' → ')}]` : '';
      L.push(`- ${m.nombre || 'momento'}: ${m.historia || ''}${m.remate ? ` — remate: ${m.remate}` : ''}${pant}`);
    }
  }
  if (mk.cta && (mk.cta.principal || mk.cta.url)) {
    L.push(`CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): ${[mk.cta.principal, mk.cta.url].filter(Boolean).join(' · ')}`);
  }
  return L.length ? `${L.join('\n')}\n` : '';
}

// Normaliza un label para matchear PANTALLA ↔ ESCENA. ESPEJO de src/lib/mediaKit.ts::normLabel (el
// server no importa TS): si tocás las reglas allá, tocalas ACÁ. Mismo patrón de garantía duplicada
// con referencia cruzada que comercial.escenasAPrompts ↔ flowpack.
const normLabel = (s) => String(s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\.[a-z0-9]+$/, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// Reparte un texto en `cantidad` tramos contiguos, cortando por ORACIONES (nunca a mitad de palabra).
// Con menos oraciones que tramos, los sobrantes quedan vacíos: preferimos una escena sin voz antes
// que repetir la misma frase dos veces (el TTS la diría dos veces).
function repartirTexto(texto, cantidad) {
  const t = String(texto || '').trim();
  if (!t) return [];
  if (cantidad <= 1) return [t];
  const oraciones = t.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  if (oraciones.length <= 1) return [t, ...Array(cantidad - 1).fill('')];
  if (oraciones.length <= cantidad) {
    return Array.from({ length: cantidad }, (_, i) => oraciones[i] || '');
  }
  const base = Math.floor(oraciones.length / cantidad);
  const resto = oraciones.length % cantidad;
  const out = [];
  let i = 0;
  for (let k = 0; k < cantidad; k++) {
    const n = base + (k < resto ? 1 : 0);
    out.push(oraciones.slice(i, i + n).join(' '));
    i += n;
  }
  return out;
}

// FIX CRÍTICO (WO-K4, independiente del kit): el molde `storyboard` animado devolvía `dialogo: ""`
// en TODAS las escenas → el render quedaba MUDO (montajePlan.ts sólo genera voz donde hay diálogo).
// La narración YA existe en el guion: acá se PROPAGA de forma DETERMINÍSTICA (no se le pide a la IA
// que la copie, que es justo lo que no hacía). Regla: por ROL, el texto de los bloques de ese rol se
// reparte entre las escenas de ese mismo rol. NUNCA pisa un diálogo ya escrito (filmado intacto).
function propagarNarracion(escenas, guion) {
  const blocks = Array.isArray(guion?.blocks) ? guion.blocks : [];
  if (!blocks.length) return escenas;
  const textoPorRol = new Map();
  for (const b of blocks) {
    const rol = b?.role || 'desarrollo';
    const txt = String(b?.narration || '').trim();
    if (!txt) continue;
    textoPorRol.set(rol, [...(textoPorRol.get(rol) || []), txt]);
  }
  const mudasPorRol = new Map();
  escenas.forEach((e, i) => {
    if (String(e?.dialogo || '').trim()) return;
    mudasPorRol.set(e.rol, [...(mudasPorRol.get(e.rol) || []), i]);
  });
  const out = escenas.slice();
  for (const [rol, idxs] of mudasPorRol) {
    const texto = (textoPorRol.get(rol) || []).join(' ');
    if (!texto) continue;
    const tramos = repartirTexto(texto, idxs.length);
    idxs.forEach((idx, k) => {
      const t = String(tramos[k] || '').trim();
      if (t) out[idx] = { ...out[idx], dialogo: t };
    });
  }
  return out;
}

// Duraciones por REGLA, no por lo que diga el modelo (2026-10-07, medido: Sonnet ponía 8s a todas las
// escenas y la pieza de 20s salía de 48s; la reparación por prompt no lo corregía). Filmado:
//   talking head (hay personajes y diálogo) → 8s, la regla dura de Flow;
//   b-roll con voz en off (diálogo sin personajes) → lo que dura su texto a 2,7 palabras/seg, de 4 a 8s;
//   b-roll mudo → 4s (o lo que dijo el modelo si está entre 4 y 6).
export function normalizarDuraciones(escenas) {
  const palabras = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
  const MAX_VO = Math.floor(8 * WPS);   // 21 palabras: lo que entra en un b-roll de 8s con voz en off
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const vistos = [];
  const out = [];
  for (const e0 of escenas) {
    let e = e0;
    const t = norm(e.dialogo);
    if (t && t.split(' ').length >= 4) {
      if (vistos.includes(t)) continue;                                   // mismo diálogo que otra escena: se saca
      if (vistos.some((v) => v.includes(t))) e = { ...e, dialogo: '', dialogoModelo: e0.dialogo, personajes: [], dialogoRepetido: true };   // parte de una anterior: b-roll mudo
      else vistos.push(t);
    }
    const w = palabras(e.dialogo), d = Number(e.durSec) || 0;
    let th = esTalkingHead(e);
    let extra = {};
    // Un talking head de 8s con menos de 12 palabras es aire (medido: el modelo los deja y la reparación
    // no los junta). Regla del dueño: "lo demás va como b-roll con voz en off" → se convierte acá.
    if (th && w < 12) { th = false; extra = { personajes: [], personajesModelo: e.personajes, plano: e.plano || 'insert', talkingHeadConvertido: true }; }
    if (th) { out.push(d === 8 ? e : { ...e, durSec: 8, durSecModelo: d }); continue; }
    if (!w) { const durSec = d >= 4 && d <= 6 ? d : 4; out.push(durSec === d ? e : { ...e, durSec, durSecModelo: d }); continue; }
    // b-roll con voz en off: dura lo que dura su texto; si no entra en 8s, se divide en dos por oraciones
    if (w > MAX_VO) {
      const oraciones = String(e.dialogo).trim().split(/(?<=[.!?…])\s+/).filter(Boolean);
      let a = [], b = [];
      for (const o of oraciones) ((palabras(a.join(' ') + ' ' + o) <= MAX_VO && !b.length) ? a : b).push(o);
      if (!a.length || !b.length) { const ws = String(e.dialogo).trim().split(/\s+/); a = ws.slice(0, Math.ceil(ws.length / 2)); b = ws.slice(Math.ceil(ws.length / 2)); }
      const mitad = (txt, k) => ({ ...e, ...extra, dialogo: Array.isArray(txt) ? txt.join(' ') : txt, durSec: Math.min(8, Math.max(4, Math.ceil(palabras(Array.isArray(txt) ? txt.join(' ') : txt) / WPS))), dividido: k, durSecModelo: d });
      out.push(mitad(a, 1), mitad(b, 2));
      continue;
    }
    const durSec = Math.min(8, Math.max(4, Math.ceil(w / WPS)));
    out.push(durSec === d && !Object.keys(extra).length ? e : { ...e, ...extra, durSec, ...(durSec !== d ? { durSecModelo: d } : {}) });
  }
  // numeración consecutiva (la reparación saca escenas del medio; la división agrega)
  return out.map((e, i) => (Number(e.n) === i + 1 && !e.dividido ? e : { ...e, n: i + 1, nModelo: e.n }));
}

// Cada escena → la CAPTURA real del kit que le toca (`archivoCaptura` = relpath). Match por el label
// de pantalla que devolvió la IA (`screen`) contra el `nombre` de las capturas. Sin kit: no toca nada.

function asignarCapturas(escenas, context = {}, piece = {}) {
  const project = context.project || {};
  const mkScreens = Array.isArray(piece.mediaKit?.pantallas) ? piece.mediaKit.pantallas : [];
  const projScreens = Array.isArray(project.screens) ? project.screens : [];
  const pantallas = mkScreens.length ? mkScreens : projScreens;

  if (!pantallas.length) return escenas;
  return escenas.map((e, idx) => {
    if (e.archivoCaptura) return e;
    const label = normLabel(e.screen);
    let p = label
      ? pantallas.find((x) => normLabel(x.nombre || x.label) === label)
        || pantallas.find((x) => normLabel(x.nombre || x.label).includes(label) || label.includes(normLabel(x.nombre || x.label)))
      : null;
    if (!p) p = pantallas[idx % pantallas.length];
    const cap = p?.archivo || p?.url || p?.fileRef || p?.image || '';
    return cap ? { ...e, archivoCaptura: cap } : e;
  });
}

const RUNNERS = {

  // ── ESTRATEGIA (nivel proyecto) — del brief: posicionamiento + público + plan de piezas ──
  strategy: {
    build({ context, options = {} }) {
      const x = ctx(context);
      const perfil = options.perfil || 'campaña';
      let cuantas = '6 a 7';
      let perfilInstruccion = '';

      if (perfil === 'campaña') {
        cuantas = '6 a 7';
        perfilInstruccion = `CAMPAÑA COMPLETA:
Generá exactamente 7 piezas con funciones distintas dentro del embudo:
1. Awareness / Gancho: instala el problema principal y presenta la solución.
2. Demo de Producto: muestra el funcionamiento del producto.
3. Beneficios & Valor: muestra el impacto práctico para el usuario.
4. Prueba / Confianza: construye credibilidad usando sólo pruebas disponibles en el BRIEF.
5. Conversión Directa: empuja al CTA real disponible.
6. Mockups Animados: vende visualmente el producto mediante sus pantallas.
7. Retargeting / Objeción: responde una objeción relevante del BRIEF.`;
      } else if (perfil === 'awareness') {
        cuantas = '3';
        perfilInstruccion = `AWARENESS: Generá 3 piezas enfocadas en llamar la atención, empatizar con el dolor del cliente y generar curiosidad inicial.`;
      } else if (perfil === 'demo') {
        cuantas = '3';
        perfilInstruccion = `DEMO DE PRODUCTO: Generá 3 piezas enfocadas en mostrar la interfaz, el flujo de uso y las funcionalidades clave.`;
      } else if (perfil === 'conversion') {
        cuantas = '3';
        perfilInstruccion = `CONVERSIÓN: Generá 3 piezas enfocadas en la oferta, la confianza/garantía y el llamado a la acción concreto.`;
      } else if (perfil === 'solo-mockups') {
        cuantas = '3';
        perfilInstruccion = `SOLO MOCKUPS: Generá 3 piezas de bocetos visuales 3D mostrando pantallas de la interfaz.`;
      }

      const pf = (context && context.project && context.project.formato) || null;
      const fmtEjemplo = pf ? `${pf.aspecto} para ${pf.plataforma}` : 'reel 9:16';
      const durEjemplo = pf && Number(pf.durDefault) ? Number(pf.durDefault) : 20;

      return { prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: diseñá la ESTRATEGIA de campaña. No escribas guiones, escenas ni casting. Usá únicamente los hechos del BRIEF; si un dato no está, no lo inventes.

Actuás como social-marketing-strategist. Armá una campaña de video para Instagram/Facebook.

${perfilInstruccion}

REGLA DE CAMPAÑA:
La CAMPAÑA completa debe cubrir la propuesta de valor de ${x.name}.
Cada PIEZA, en cambio, tiene UN mensaje principal y UN ángulo claro, y usa sólo los elementos de la propuesta que necesita para demostrarlo (pueden ser varias funciones si sirven a una misma idea). No vuelvas a enumerar toda la plataforma en cada reel.
Excepción explícita: una pieza con messageScope "brand-global" (institucional / overview) SÍ cuenta el sistema integral.
Aunque tenga foco propio, cada pieza debe dejar claro qué es ${x.name} y cómo ese ángulo se conecta con su propuesta.

DIVERSIDAD:
- Los ángulos deben ser semánticamente distintos.
- No cambies sólo el título manteniendo la misma idea.
- Repartí problemas, beneficios, demostración, prueba, objeciones y conversión entre las piezas.

CAMPOS:
- positioning: 1-2 frases.
- audiences: sólo segmentos respaldados por el BRIEF; pain y language concretos.
- angle: 2 a 4 palabras.
- messageScope: uno de brand-global | problem | demo | benefit | proof | objection | conversion.
- primaryMessage: UNA frase: el mensaje principal de esta pieza.
- supportingFacts: 1 a 4 hechos del BRIEF (textuales o resumidos) que esta pieza usa para demostrar su mensaje. Nada que no esté en el BRIEF.
- creativeBrief: 2 a 3 frases. Define qué cuenta ESTA pieza, cuál es su mensaje principal y qué parte de la propuesta prueba.
- durationSec: ${durEjemplo}.
- format: "${fmtEjemplo}".

NO ASUMIR:
- clientes, reseñas, garantías, cifras, precios o resultados que el BRIEF no confirme;
- una prueba social si no existe evidencia en el BRIEF;
- beneficios genéricos de marketing que no estén respaldados por el producto.

Devolvé SOLO JSON:
{
  "positioning": "",
  "audiences": [{ "label": "", "pain": "", "language": "" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "", "messageScope": "problem", "primaryMessage": "", "supportingFacts": [""], "format": "${fmtEjemplo}", "durationSec": ${durEjemplo}, "creativeBrief": "" }]
}

NEGOCIO: ${x.name}
BRIEF (única fuente de hechos):
${factsText(x.facts)}` };
    },
    parse(text) { const o = extractJson(text); if (!Array.isArray(o.pieces) || !o.pieces.length) throw new Error('la estrategia no trajo piezas'); return o; },
  },

  // ── GUION (nivel pieza) — guion por bloques, narración calibrada para TTS ──
  // ── GUION (nivel pieza) — adaptado al rework: GuionEstructurado (hook|desarrollo|gag|cta + durSec) ──
  // Lee `context.piece.concepto` (el elegido) como dirección creativa. Conserva: regla GLOBAL,
  // calibración TTS ~2.7 pal/seg, regen por bloque, music.mood. El shape lo consume PasoGuion (Fase 2).
  script: {
    build({ context, options = {}, regenerate }) {
      const x = ctx(context);
      const piece = (context && context.piece) || {};
      const concepto = piece.concepto ? JSON.stringify(piece.concepto) : '';
      const tono = options.tono || 'cercano';
      const dur = options.duracion || x.durationSec;
      // WO-2/D4: con formato interpolamos aspecto+plataforma; SIN formato dejamos "un reel 9:16"
      // verbatim (retrocompat byte-idéntica — no cambiar el prompt de proyectos viejos). Incluye el
      // artículo para que la frase quede gramatical con cualquier formato ("para una pieza …").
      const piezaDesc = piece.formato ? `una pieza ${x.aspecto} para ${x.plataforma}` : 'un reel 9:16';
      // La TÉCNICA de la pieza también manda sobre el GUION (mismo criterio y misma retrocompat DURA
      // que los moldes concept/storyboard): sin esto el guion de una pieza ANIMADA describía "visual"
      // con actores, planos y locaciones que el pipeline animado no puede producir. Sin `tipo` —o con
      // 'filmado'— el bloque queda vacío y el prompt es byte-idéntico al anterior.
      const tipo = piece.tipo || 'filmado';
      const bloqueTecnica = tipo === 'animado'
        ? `TÉCNICA — VIDEO ANIMADO (regla DURA): no hay actores, ni personas a cámara, ni locaciones. Lo que se VE son las PANTALLAS/UI REALES del producto EN MOVIMIENTO (recorrido entre pantallas, elementos que entran, datos que se completan, zoom/paneo sobre la interfaz, texto en pantalla) y la narración va en OFF. El campo "visual" de cada bloque describe la PANTALLA y su movimiento — JAMÁS una persona, un plano de cámara ni una locación.
`
        : '';
      if (regenerate && regenerate.index != null) {
        const cur = (regenerate.blocks || [])[regenerate.index] || {};
        return { mode: 'item', prompt: `Actuás como promo-director. Rehacé SOLO ESTE bloque del guion (tono ${tono}), con una propuesta DISTINTA y mejor. Mantené su rol.
Devolvé SOLO el JSON del bloque: { "role": "${cur.role || 'hook'}", "narration": "lo que se DICE (voz - SÚPER CORTO, máximo 1-2 oraciones)", "visual": "lo que se VE (breve, 1 línea)", "durSec": <segundos estimados a ~2.7 palabras/seg> }
NEGOCIO: ${x.name} · BLOQUE ACTUAL (hacelo distinto): ${JSON.stringify(cur)}
Rioplatense, sin emojis, no inventes datos. Sé estricto con la brevedad.` };
      }
      // WO-K4: con media kit, las capturas/momentos REALES entran como insumo del prompt.
      // Sin kit el bloque queda vacío → prompt byte-idéntico al anterior.
      const bloqueKit = mediaKitText(piece);
      const regenPrompt = regenerate ? 'IMPORTANTE: Generá una propuesta NARRATIVA completamente NUEVA y variante distinta a la anterior.\n' : '';
      // Doctrina (dueño, 2026-10-07): la pieza tiene UN mensaje principal; sólo brand-global cuenta todo.
      // Si la estrategia definió el foco, viaja acá y el guion no adivina qué entra.
      const scope = piece.messageScope || '';
      const focoPieza = (piece.primaryMessage || (Array.isArray(piece.supportingFacts) && piece.supportingFacts.length))
        ? `FOCO DE ESTA PIEZA (lo definió la estrategia; es lo que se cuenta):${scope ? `\n- alcance: ${scope}` : ''}${piece.primaryMessage ? `\n- mensaje principal: ${piece.primaryMessage}` : ''}${Array.isArray(piece.supportingFacts) && piece.supportingFacts.length ? `\n- hechos que lo sostienen: ${piece.supportingFacts.join(' · ')}` : ''}\n`
        : '';
      const objetivoScope = scope === 'brand-global'
        ? '- Esta pieza es brand-global (institucional / overview): acá SÍ se cuenta el sistema integral, ordenado alrededor de una idea.'
        : '- El espectador debe entender qué resuelve ${x.name} y por qué importa, pero el video NO tiene que enumerar toda la plataforma.\n- Elegí del BRIEF sólo los hechos y beneficios que sostienen este concepto (pueden ser varias funciones si sirven a una misma idea). No intentes meter todos los módulos ni todos los mensajes clave.';
      return { mode: 'set', prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: escribí el GUION. No adelantes casting, planos ni decisiones técnicas del storyboard. Usá únicamente los hechos provistos; si un dato no está, no lo inventes.

Actuás como promo-director. Convertí el CONCEPTO ELEGIDO en un comercial de ${dur}s para ${piezaDesc}, tono ${tono}${x.angulo ? ` (ángulo: "${x.angulo}")` : ''}.
${regenPrompt}${concepto ? `CONCEPTO ELEGIDO (es la dirección creativa; no lo reemplaces por otra idea): ${concepto}\n` : ''}${bloqueTecnica}${bloqueKit}
${focoPieza}OBJETIVO NARRATIVO:
- Mantené UNA idea central de principio a fin.
${objetivoScope.replace('${x.name}', x.name)}
- El gag/remate tiene que nacer de la misma situación del concepto y va antes del CTA.

ESTRUCTURA EXACTA:
hook -> desarrollo -> gag -> cta

PRESUPUESTO HABLADO (contá palabras):
${presupuestoLista(dur)}
Usá esos durSec; sólo podés mover 1 segundo entre bloques si la suma final sigue siendo ${dur}s.

CADA BLOQUE:
- narration: sólo lo que se DICE. No describas actuación ni cámara.
- visual: una sola frase breve con lo que se VE; tiene que apoyar esa narración, no repetirla.
- durSec: duración del bloque.

NO ASUMIR:
- datos, cifras, precios, integraciones, clientes o resultados que no estén en el BRIEF;
- funciones que no estén mencionadas;
- un CTA distinto del disponible en el BRIEF.

Devolvé SOLO JSON:
{ "blocks": [{ "role": "hook|desarrollo|gag|cta", "narration": "", "visual": "", "durSec": <segundos> }], "music": { "mood": "2-3 palabras" } }

NEGOCIO: ${x.name}
BRIEF (única fuente de hechos):
${factsText(x.facts, ['negocio', 'mensajes', 'ofrece', 'oferta', 'evitar'])}` };
    },
    parse(text) {
      const o = extractJson(text);
      if (o && o.narration && !Array.isArray(o.blocks)) return { item: o };
      if (!Array.isArray(o.blocks) || !o.blocks.length) throw new Error('el guion no trajo bloques');
      return o;
    },
  },

  // ── PUBLICACIÓN (nivel pieza) — el copy del posteo para la red elegida ──
  publish: {
    build({ context, options = {} }) {
      const x = ctx(context);
      const red = options.red || 'instagram';
      // La red ahora puede venir del FORMATO de la pieza ("Instagram / TikTok", "Meta Ads", "YouTube",
      // "TV") además de los valores viejos ('instagram'|'facebook'|'ambas'). Se compara en minúsculas
      // por inclusión: los 3 valores viejos caen EXACTAMENTE en la misma rama que antes (retrocompat
      // byte-idéntica) y los nuevos dejan de recibir specs de Reels.
      const redLc = String(red).toLowerCase();
      const specs = redLc.includes('facebook') ? 'Facebook: caption puede ser un poco más largo, menos hashtags (2-3).'
        : redLc === 'ambas' ? 'Para Instagram Reels y Facebook: caption que sirva a las dos, 3-6 hashtags.'
        : redLc.includes('youtube') ? 'YouTube Shorts: título corto y buscable al principio, descripción de 1-2 líneas con la idea principal, 3-5 hashtags.'
        : redLc.includes('tiktok') ? 'Instagram Reels y TikTok: caption con gancho en la 1ª línea, texto MUY corto, 3-6 hashtags relevantes.'
        : redLc.includes('meta') ? 'Meta Ads (feed): el caption tiene que funcionar SIN sonido y sin depender del video, 2-3 hashtags como mucho.'
        : redLc === 'tv' ? 'Spot de TV: sin hashtags — un copy corto de acompañamiento para el posteo de la marca.'
        : 'Instagram Reels: caption con gancho en la 1ª línea, 3-6 hashtags relevantes.';
      return { prompt: `Actuás como social-platform-specialist. Dame el paquete de PUBLICACIÓN para ${red}. ${specs}
Devolvé SOLO JSON: { "hookOnScreen": "texto en pantalla los primeros 2s, <=6 palabras", "caption": "el copy del posteo, 2-4 líneas", "hashtags": ["#sin-espacios", "..."], "cta": "el llamado a la acción" }
Sin emojis, rioplatense, sin jerga de marketing vacía (revolucionario, increíble). No inventes datos.
NEGOCIO: ${x.name}
GUION: ${x.guion || x.brief}` };
    },
    parse(text) { const o = extractJson(text); if (!o.caption && !o.cta) throw new Error('publicación incompleta'); return o; },
  },

  // ── CRÍTICA / QA (nivel pieza) — rúbrica de 10 ejes → nota /50 + qué ajustar ──
  qa: {
    build({ context, options = {} }) {
      const x = ctx(context);
      const piece = (context && context.piece) || {};
      const focos = { todo: 'los 10 ejes', hook: 'sobre todo el hook (primeros 2s)', claridad: 'sobre todo la claridad (una sola idea)', cta: 'sobre todo el CTA' };
      // rework: si viene el comercial COMPLETO (concepto/guion/cast/storyboard/pack), QA holístico.
      const holistico = !!(piece.storyboard || piece.cast || piece.concepto || piece.packFlow);
      const material = holistico
        ? `COMERCIAL COMPLETO A EVALUAR:
CONCEPTO: ${piece.concepto ? JSON.stringify(piece.concepto) : '(sin concepto)'}
GUION: ${pieceGuionText(piece) || '(sin guion)'}
CAST: ${piece.cast ? JSON.stringify(piece.cast) : '(sin cast — puede ser animado)'}
STORYBOARD: ${piece.storyboard ? JSON.stringify(piece.storyboard) : '(sin storyboard)'}
PACK ESTILO: ${piece.packFlow?.estilo || piece.packFlow?.master || '(sin pack)'}`
        : `GUION DE LA PIEZA: ${x.guion || x.brief}`;
      const extra = holistico
        ? ` Para el comercial entero, pesá MUY fuerte estos criterios profesionales DENTRO de los ejes: CONTINUIDAD (flujo nuevo de Flow: la consistencia del actor la fija la IMAGEN de referencia del personaje; los prompts de escena lo llaman por NOMBRE + "Argentine", NO repiten el fisicoEn; entre escenas cierra ropa/luz/lugar), ARCO (hook ≤2s de gancho, gag/remate ANTES del CTA; respeta el messageScope y el primaryMessage de la pieza: una pieza focalizada desarrolla UNA idea sin dispersarse, y sólo una pieza brand-global debe cubrir explícitamente la propuesta integral), TÉCNICA (talking heads ≥8s, diálogos de ~24-30 palabras, marca fonética en TODO lo hablado).`
        : '';
      return { prompt: `Actuás como promo-critic. Evaluá ${holistico ? 'el COMERCIAL entero' : 'la pieza'} con tu rúbrica de 10 ejes (gancho, claridad, una idea, CTA, formato, marca, duración, ritmo, prueba, originalidad), 0-5 cada uno = total /50. NO lo juzgues por un solo aspecto: puntuá los 10 y sumá.${extra} Mirá ${focos[options.foco] || focos.todo}.
Devolvé SOLO JSON: { "score": <0-50>, "verdict": "LISTO PARA PRODUCIR|AJUSTAR|REHACER", "issues": [{ "severity": "alta|media|baja", "note": "el problema + el fix concreto" }] }
LISTO PARA PRODUCIR si score >= 38. Español rioplatense, sin emojis.
OBJETIVO: ${x.objetivo || '(inferilo)'} · NEGOCIO: ${x.name}${piece.messageScope ? ` · ALCANCE DE LA PIEZA: ${piece.messageScope}` : ''}${piece.primaryMessage ? ` · MENSAJE PRINCIPAL: ${piece.primaryMessage}` : ''}
${material}` };
    },
    // Fase 7 (doc §4.8): dos capas. A) lintCommercial, sin IA, los errores técnicos (roles, duración,
    // ids, fonética, no-decir, talking heads, pack). B) el juicio creativo del modelo. Los técnicos van
    // PRIMERO en la lista y nunca los tapa una buena nota: si hay errores altos, el veredicto baja a AJUSTAR.
    parse(text, body) {
      const o = extractJson(text); if (typeof o.score !== 'number') throw new Error('el QA no trajo score');
      const piece = (body && body.context && body.context.piece) || {};
      const project = (body && body.context && body.context.project) || {};
      const lint = lintCommercial({ ...piece, name: project.name, phonetic: project.phonetic, screens: project.screens }, { facts: buildProjectFacts(project) });
      const tecnicos = lint.issues.map((i) => ({ severity: i.severity, note: `[técnico] ${i.note}`, code: i.code }));
      o.issues = [...tecnicos, ...(Array.isArray(o.issues) ? o.issues : [])];
      o.lint = { version: lint.version, ok: lint.ok, errores: lint.errores, avisos: lint.avisos };
      if (!lint.ok && o.verdict === 'LISTO PARA PRODUCIR') o.verdict = 'AJUSTAR';
      return o;
    },
  },

  // ══ MOLDES DEL REWORK (storyboard-driven) ═══════════════════════════════════════════════════
  // Contrato: reciben los artefactos previos por `context.piece.<artefacto>` SIN aplanar.

  concept: {
    build({ context = {}, options = {} }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const brief = factsText(buildProjectFacts(project));   // Fase 2 (P0.1): la ficha entera, nunca cortada
      const angulo = piece.angulo || piece.angle || '';
      const creativeBrief = piece.creativeBrief || '';
      const perfil = options.perfil || 'campaña';
      // La TÉCNICA de la pieza manda sobre el concepto (mismo criterio que el molde storyboard, que
      // bifurca por `piece.tipo`): sin esto la IA proponía comerciales FILMADOS (actriz, cocina real)
      // para una pieza ANIMADA. Retrocompat DURA: sin `tipo` —o con 'filmado'— el bloque queda vacío
      // y el prompt es byte-idéntico al anterior; el texto extra SOLO aparece en animado.
      const tipo = piece.tipo || 'filmado';
      const bloqueTecnica = tipo === 'animado'
        ? `TÉCNICA — VIDEO ANIMADO (regla DURA, no la rompas): la pieza se produce como motion graphics sobre las PANTALLAS/UI REALES del producto. NO hay actores, ni personas a cámara, ni locaciones, ni nada filmado: JAMÁS propongas una escena grabada con gente (nada de "una mujer en su cocina"). Cada IDEA tiene que funcionar mostrando la interfaz EN MOVIMIENTO (recorrido entre pantallas, elementos que entran, datos que se completan, zoom/paneo sobre la UI, texto en pantalla, voz en off). La ESTÉTICA describe la DIRECCIÓN DE MOTION/UI (ritmo, tipo de transiciones, tipografía, paleta, cómo se encuadran las pantallas), NO fotografía, luz de set ni casting. La REFERENCIA es a un video de producto/app animado, no a un comercial filmado.
PANTALLAS DEL PRODUCTO: ${screensText(project) || '(sin pantallas en el KB: proponé pantallas recreadas y marcalas [demo])'}
`
        : '';
      // WO-K4: con media kit, las capturas/momentos REALES entran como insumo del prompt.
      // Sin kit el bloque queda vacío → prompt byte-idéntico al anterior.
      const bloqueKit = mediaKitText(piece);
      // Perfil de campaña → qué tiene que lograr el video (el modelo no lo adivina del nombre).
      const perfilTxt = {
        'campaña': 'desarrollar el mensaje principal de esta pieza (lo fijó la estrategia); puede usar varias funciones si demuestran esa misma idea; tiene que quedar claro qué es el negocio, sin enumerar toda la plataforma',
        awareness: 'que el que nunca oyó hablar del negocio entienda en 20 segundos qué problema resuelve',
        demo: 'mostrar el producto funcionando: el espectador tiene que VER cómo se usa',
        conversion: 'empujar a una acción concreta (probar, pedir una demo, entrar al sitio) con una razón clara',
      }[perfil] || perfil;
      const bloquePieza = [
        angulo && `ÁNGULO DE ESTA PIEZA (la estrategia ya lo decidió, respetalo): ${angulo}`,
        creativeBrief && `DIRECCIÓN CREATIVA DE ESTA PIEZA: ${creativeBrief}`,
        piece.primaryMessage && `MENSAJE PRINCIPAL DE ESTA PIEZA (la estrategia lo fijó; los tres conceptos lo demuestran de formas distintas): ${piece.primaryMessage}${piece.messageScope === 'brand-global' ? ' (pieza brand-global: acá sí se cuenta el sistema integral)' : ''}`,
      ].filter(Boolean).join('\n');
      return { prompt: `QUÉ ES ESTO
Sos director creativo de reels verticales de 20 a 30 segundos. Tenés que proponer TRES CONCEPTOS de comercial para que el dueño del negocio elija uno. Un concepto es UNA idea contada en pocas líneas, no un guion: las escenas, los planos y los tiempos se escriben en otro paso, después. Si escribís un guion acá, el trabajo no sirve.

FICHA DEL NEGOCIO (lo único que es verdad; no está acá = no existe)
NEGOCIO: ${name}
OBJETIVO DEL VIDEO (perfil "${perfil}"): ${perfilTxt}
BRIEF:
${brief || '(sin brief: proponé sobre el nombre y marcá cada supuesto con [supuesto])'}
${bloquePieza ? bloquePieza + '\n' : ''}${bloqueTecnica}${bloqueKit}
NO ASUMIR
- Funciones, cifras, clientes, premios o resultados que no estén en el brief.
- Que el negocio ya es conocido: el espectador lo ve por primera vez.
- Que el problema es dramático: el brief dice cuánto duele, no vos.

QUÉ TIENE QUE TENER CADA CONCEPTO
- UNA sola idea, vista desde una situación concreta de la persona que sufre el problema o usa el producto.
- ${piece.messageScope === 'brand-global' ? `Esta pieza es brand-global: acá sí se cuenta el sistema integral de ${name}, ordenado alrededor de una idea.` : `Una sola idea bien desarrollada: queda claro qué es ${name} y qué resuelve en esta pieza, sin enumerar toda la plataforma (varias funciones sólo si demuestran la misma idea).`}
- Un remate antes del llamado a la acción: humor, ironía o un contraste fuerte entre el antes y el después.
- Los tres conceptos tienen que ser DISTINTOS en tipo de gancho; tres variantes de la misma idea no sirven.

LO QUE NO VA
- Presentador sonriendo a cámara, locución institucional, "somos líderes", "la solución integral", "transformá tu negocio".
- Escenas con segundos, planos o montajes: eso es del storyboard.
- Chistes que humillan al cliente o a su gente: la gracia está en el problema, no en la persona.

LARGOS (se cumplen en palabras, contá)
- topico: 2 a 4 palabras. Título pegadizo que resume la idea.
- tipoGancho: 2 a 4 palabras en mayúsculas. Ejemplos de tipos: HUMOR, POV, ANTES Y DESPUÉS, PARODIA, PROBLEMA EXTREMO, CÁMARA OCULTA.
- idea: 40 a 60 palabras. Tres partes seguidas: qué se ve en los primeros 2 segundos, el giro, el remate. Sin tiempos ni planos.
- tono: hasta 12 palabras. Cómo actúan y cómo hablan.
- estetica: hasta 25 palabras. ${tipo === 'animado' ? 'Ritmo, transiciones, tipografía, paleta y cómo se encuadran las pantallas.' : 'Encuadre, luz, paleta y ritmo.'}
- referencia: hasta 12 palabras. Un FORMATO conocido al que se parece (tipo de sketch, formato viral de redes). Nada de premios ni comerciales que no sepas con certeza que existen.
- porQueFunciona: una oración, hasta 20 palabras: por qué esta idea hace que el espectador quiera probarlo.

Español rioplatense natural, sin clichés publicitarios.
Devolvé SOLO este JSON, sin texto antes ni después, sin markdown:
{
  "conceptos": [
    { "id": "c1", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c2", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c3", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" }
  ]
}` };
    },
    parse(text) {
      const o = extractJson(text);
      if (!Array.isArray(o.conceptos) || !o.conceptos.length) throw new Error('el molde concept no trajo conceptos');
      return o;
    },
  },

  // ── CAST (nivel pieza) — personajes con descripción física EXACTA reutilizable + locación ──
  cast: {
    build({ context = {}, options = {}, regenerate }) {
      const x = ctx(context);
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const concepto = piece.concepto ? JSON.stringify(piece.concepto) : '(sin concepto elegido: inferilo del guion)';
      const guion = pieceGuionText(piece);
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      const regenNote = regenerate ? 'IMPORTANTE: Proponé una alternativa TOTALMENTE DISTINTA de personaje/género/locación a las anteriores.' : '';

      // P0.3: `x.industry` no existía y caía al BRIEF ENTERO adentro de un paréntesis. El rubro viene
      // del KB (kbToProjectInput → project.type = business.industry); sin rubro, el nombre.
      const rubroNegocio = project.industry || project.type || name;
      return { prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: definí el CAST y la LOCACIÓN necesarios para producir el concepto y el guion. No agregues personajes decorativos ni reescribas la historia.
${regenNote ? regenNote + '\n' : ''}
Sos casting director + location scout de un comercial ${asp}.

CRITERIO:
- Usá 1 personaje si alcanza; usá 2 sólo si el guion necesita dos roles reales.
- Cada personaje debe tener una función narrativa identificable.
- La locación debe ser el entorno físico natural del negocio y de la acción del guion. Evitá locaciones genéricas que podrían pertenecer a cualquier rubro.

POR PERSONAJE:
- id: p1, p2.
- nombre: breve.
- rol: función en el comercial.
- fisicoEn: 25 a 45 palabras en INGLÉS. Descripción visual consistente para generación de imagen/video: edad aproximada, pelo, tono de piel, rasgos, vestuario y presencia. Sólo características visibles.
- fisicoEs: máximo 18 palabras en español para la UI.
- vestuario: máximo 10 palabras.
- personalidad: 1 a 3 palabras.

LOCACIÓN:
- nombre: corto y específico.
- descripcionEn: 25 a 50 palabras en INGLÉS. Espacio, mobiliario relevante, atmósfera y luz coherentes con el negocio y el guion.
- luz: máximo 8 palabras.

NO ASUMIR:
- profesiones, jerarquías o rasgos que el concepto no necesite;
- objetos, tecnología o instalaciones que impliquen funciones no mencionadas;
- cambios de personaje para distintas escenas: la identidad definida acá debe poder mantenerse en todo el comercial.

Devolvé SOLO JSON:
{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }

NEGOCIO: ${name}
RUBRO: ${rubroNegocio}
CONCEPTO: ${concepto}
GUION: ${guion || '(usá el brief del negocio)'}` };
    },
    parse(text) {
      const o = extractJson(text);
      if (!o.personajes?.length || !o.personajes[0].fisicoEn || !o.lugar?.descripcionEn) {
        throw new Error('el molde cast vino incompleto (falta personajes[].fisicoEn o lugar.descripcionEn)');
      }
      return o;
    },
  },

  // ── STORYBOARD (nivel pieza) — escenas numeradas; bifurca por tipo (filmado vs animado) ──
  storyboard: {
    build({ context = {} }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const phonetic = project.phonetic || name;
      const tipo = piece.tipo || 'filmado';
      const durationSec = Number(piece.durationSec) || 20;
      const guion = pieceGuionText(piece);
      // WO-2/D4: aspecto del formato; sin formato queda '9:16' (byte-idéntico al hardcodeo anterior).
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      // WO-K4: con media kit, las escenas se arman sobre las CAPTURAS reales (el `screen` de cada
      // escena tiene que ser el nombre EXACTO de una captura → así el parse le asigna archivoCaptura).
      // Sin kit el bloque queda vacío y los dos prompts son byte-idénticos a los de antes.
      const bloqueKit = mediaKitText(piece);
      if (tipo === 'animado') {
        return { prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: convertí el GUION en un STORYBOARD ANIMADO sobre las pantallas del producto. No inventes funciones ni pantallas.

Sos director de un reel ANIMADO ${asp}, sin personas filmadas. La narración viene del GUION; el storyboard decide qué pantalla real muestra cada momento.
${bloqueKit}
PRINCIPIO:
Una escena = un momento visual claro. Usá sólo las escenas necesarias para contar el guion. Cada escena debe apoyar un bloque narrativo y usar una pantalla concreta del KB.

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook|desarrollo|gag|cta.
- durSec: 3 a 5s.
- screen: nombre EXACTO de una pantalla de PANTALLAS DEL KB. Si ninguna pantalla real corresponde, usá "[demo]" en vez de inventar un nombre.
- accion: título visible de máximo 8 palabras que vende ese momento.
- dialogo: siempre "".
- continuidad: UNA palabra del título que se va a resaltar.
- plano: "".
- angulo: "".
- personajes: [].

DURACIÓN:
La suma debe quedar cerca de ${durationSec}s. Ajustá cantidad de escenas antes que crear escenas redundantes.

NO ASUMIR:
- pantallas que no estén en el KB;
- funciones que el GUION no menciona;
- textos o cifras no verificadas.

Devolvé SOLO JSON:
{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 4, "screen": "...", "plano": "", "angulo": "", "personajes": [], "accion": "", "dialogo": "", "continuidad": "" }] }

NEGOCIO: ${name}
PANTALLAS DEL KB: ${screensText(project) || '(sin pantallas: proponé pantallas recreadas y marcalas [demo])'}
GUION: ${guion || '(usá el brief del negocio)'}` };
      }
      const cast = piece.cast ? JSON.stringify(piece.cast) : '(sin cast todavía: usá ids p1/p2 y descripciones genéricas)';
      return { prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: convertí el GUION en un STORYBOARD FILMADO producible. No reescribas el concepto ni agregues mensajes comerciales nuevos. Usá únicamente el CAST y el GUION provistos.

Sos director de un comercial FILMADO ${asp}.
${bloqueKit}
PRINCIPIO:
Cada escena tiene una función visual concreta. No agregues escenas por variedad. Si dos escenas cuentan lo mismo, dejá una sola.

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook|desarrollo|gag|cta.
- durSec: talking head mínimo 8s; b-roll entre 4 y 8s. Un b-roll CON voz en off dura lo que dura su texto a 2,7 palabras por segundo (10 palabras = 4s), nunca más; sin voz, 4 a 6s.
- plano: para talking head, medium shot waist-up; evitá sujetos lejanos.
- angulo: breve.
- personajes: sólo ids existentes en CAST; [] si no aparece nadie.
- accion: máximo 14 palabras; describe una sola acción visible.
- dialogo: "" si nadie habla a cámara. Si hay talking head, usá texto del GUION sin inventar claims y respetá máximo 2,7 palabras por segundo (8s = ${maxNarrationWords(8)} palabras).
- continuidad: máximo 8 palabras; sólo lo que debe mantenerse respecto de la escena anterior.

DURACIÓN Y TALKING HEADS (regla dura, medible):
- Un talking head dura 8s y necesita ${maxNarrationWords(8) - 4} a ${maxNarrationWords(8)} palabras de diálogo: JUNTÁ bloques consecutivos del guion en un mismo talking head (por ejemplo hook + desarrollo) en vez de hacer un talking head por bloque. Un talking head con menos de ${Math.round((maxNarrationWords(8) - 4) * 0.7)} palabras es aire y no sirve.
- Pieza de hasta 24s: como máximo ${durationSec <= 24 ? 'DOS' : 'TRES'} talking heads. Lo demás va como b-roll de 4 a 8s con la voz en off (dialogo con el texto del guion y personajes []).
- Con UN solo talking head la pieza queda en ${durationSec}s (máximo ${Math.round(durationSec * 1.25)}s); con dos, pasa a 24 a 30s: no comprimas, extendé.
El gag/remate ocurre antes del CTA.

CONTINUIDAD:
Usá siempre los mismos ids para el mismo personaje. No cambies ropa, edad, lugar o luz sin que el GUION lo justifique.

NO ASUMIR:
- personajes fuera del CAST;
- funciones, precios o resultados no presentes en el GUION;
- locaciones o acciones que contradigan el concepto.

Devolvé SOLO JSON:
{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "..." }] }

NEGOCIO: ${name}
MARCA FONÉTICA para cualquier diálogo: ${phonetic}
CAST: ${cast}
GUION: ${guion || '(usá el brief del negocio)'}` };
    },
    // `body` (contrato extendido) trae el guion y el media kit de la pieza: el parse los usa para
    // (1) PROPAGAR la narración a `dialogo` — la fuga que dejaba los renders mudos — y (2) asignar
    // `archivoCaptura` con la captura real que le toca a cada escena.
    parse(text, body) {
      const o = extractJson(text);
      if (!Array.isArray(o.escenas) || !o.escenas.length) throw new Error('el molde storyboard no trajo escenas');
      const ROLES = new Set(['hook', 'desarrollo', 'gag', 'cta']);
      const piece = (body && body.context && body.context.piece) || {};
      let escenas = o.escenas.map((e) => {
        if (!ROLES.has(e.rol)) throw new Error(`rol de escena inválido: ${e.rol}`);
        const rawDur = Number(e.durSec) || 0;
        // talking head (la IA le escribió diálogo) < 8s → 8 (regla dura de Flow). Se evalúa ANTES de
        // propagar: en ANIMADO las escenas duran 3-5s y no son talking heads — la voz en off que se
        // propaga abajo NO puede inflarlas a 8s (rompería la duración total de la pieza).
        // definición ÚNICA (prompting.esTalkingHead): diálogo + personajes en cámara. Un b-roll con voz
        // en off NO se sube a 8s (antes sí: cualquier escena con diálogo). Las duraciones finales las
        // fija normalizarDuraciones, abajo.
        const durSec = (esTalkingHead(e) && rawDur < 8) ? 8 : rawDur;
        return { ...e, durSec };
      });
      escenas = propagarNarracion(escenas, piece.guion);
      if ((piece.tipo || 'filmado') === 'filmado') escenas = normalizarDuraciones(escenas);
      // La firma es (escenas, context, piece): pasar `piece` como context dejaba el kit afuera y
      // ninguna escena recibía su captura (test 'matchea el screen...' en rojo desde el WIP).
      o.escenas = asignarCapturas(escenas, (body && body.context) || {}, piece);
      return o;
    },
  },

  // ── FLOWPACK (nivel pieza) — FLUJO NUEVO de Google Flow (Veo 3.1, imagen-first) ──
  // Flow ahora modela Personajes (entidad con IMAGEN de referencia vía Nano Banana) y Escenas (se
  // animan llamando al personaje por NOMBRE). La consistencia la fija la imagen, NO el texto verbatim
  // (repetir el fisicoEn en cada prompt hacía que Flow devolviera una imagen estática). El molde deja
  // de dar { master, clips } y produce 3 piezas: { estilo, personajes[], escenas[] }. Reusa VEO_RULES
  // (idioma/cadencia/talking head battle-tested) — solo cambia la ESTRUCTURA. Origen: docs/12-flow-nuevo.
  flowpack: {
    build({ context = {}, regenerate }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const phonetic = project.phonetic || name;
      const brand = project.brand || project.brandKit || '';
      const brandTxt = brand ? ` · MARCA: ${typeof brand === 'string' ? brand : JSON.stringify(brand)}` : '';
      const storyboard = Array.isArray(piece.storyboard) ? piece.storyboard : [];
      const castJson = piece.cast ? JSON.stringify(piece.cast) : '(sin cast: b-roll/pantallas — usá la locación)';
      // WO-2/D4: aspecto del formato; sin formato queda '9:16' (byte-idéntico). VEO_RULES y las specs
      // de estilo/imagen del cuerpo del prompt (calibradas) NO se tocan — solo el marco del pedido.
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      if (regenerate && regenerate.escenaN != null) {
        const escena = storyboard.find((e) => Number(e.n) === Number(regenerate.escenaN)) || {};
        return { mode: 'escena', prompt: `Sos el prompt-writer de Google Flow (Veo 3.1, flujo nuevo con Personajes por imagen). Rehacé SOLO el prompt de la ESCENA ${regenerate.escenaN} de un comercial ${asp}, con OTRA idea visual/encuadre.
En el flujo nuevo los personajes YA tienen su IMAGEN de referencia: referílos por su NOMBRE del cast + nacionalidad "Argentine" (ej. "Ana, an Argentine woman in her late 20s") — CORTO, NUNCA pegues el fisicoEn largo. El diálogo va LITERAL en español rioplatense entre comillas; el resto del prompt en INGLÉS.
${VEO_RULES}
CAST (para tomar nombres de personajes y la locación — NO copies el fisicoEn en el prompt): ${castJson}
ESCENA A REHACER: ${JSON.stringify(escena)}
MARCA FONÉTICA: ${phonetic}
Devolvé SOLO JSON: { "escena": { "escenaN": ${regenerate.escenaN}, "prompt": "el prompt en inglés, con el diálogo en español rioplatense entre comillas y la marca fonética" } }` };
      }
      // Fase 5 (doc §4.6): el pack se COMPILA sin IA (server/flowCompiler.mjs) con la misma estructura
      // que pedía este prompt. Lo único que se le pide al modelo es traducir las acciones al inglés
      // (una línea por escena). Si no hay acciones, el prompt va vacío y run-function no llama a la IA.
      // Medido antes: 47 a 52 s y USD 0,12 a 0,17 por pack con Opus/Sonnet; ahora la traducción sola.
      void brandTxt;
      return { mode: 'pack', prompt: promptTraduccion(storyboard), compilado: true };
    },
    // parse recibe el `body` (contrato extendido) para leer el storyboard y enriquecer las escenas
    // con su `rol` (autoridad = el storyboard, no la IA) + el estado inicial 'pendiente'.
    parse(text, body) {
      // regen de UNA escena: sigue siendo IA (otra idea visual) y devuelve JSON.
      if (body && body.regenerate && body.regenerate.escenaN != null) {
        const o = extractJson(text);
        if (o && o.escena && o.escena.prompt) return { escena: { escenaN: Number(o.escena.escenaN), prompt: o.escena.prompt } };
        throw new Error('la regeneración de la escena no trajo prompt');
      }
      // Fase 5: pack compilado. `text` es la traducción de las acciones (o vacío).
      const piece = (body && body.context && body.context.piece) || {};
      const project = (body && body.context && body.context.project) || {};
      const storyboard = Array.isArray(piece.storyboard) ? piece.storyboard : [];
      if (!storyboard.length) throw new Error('el pack necesita un storyboard con escenas');
      const traducciones = parseTraduccion(text);
      const aspecto = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      const pack = compileFlowPack({ storyboard, cast: piece.cast, phonetic: project.phonetic || project.name || '', traducciones, aspecto });
      if (pack.huecos.length) console.warn(`[media-studio] flowpack: ${pack.huecos.length} escena(s) con la acción sin traducir (quedó en español): ${pack.huecos.join(', ')}`);
      return { estilo: pack.estilo, personajes: pack.personajes, escenas: pack.escenas, huecos: pack.huecos, version: pack.version };
    },
  },

  // ── VIDEOPROMPT (standalone, WO-6c/D9) — el ÚNICO molde de IA nuevo de la ronda ──
  // Genera UN prompt de Google Flow (Veo 3.1) suelto, fuera de un proyecto: descripción libre del
  // usuario + modo (talking-head | b-roll) + VEO_RULES verbatim (idioma/cadencia battle-tested).
  // Devuelve texto plano (no JSON) — listo para pegar en Flow.
  videoprompt: {
    build({ options = {} }) {
      const brief = String(options.brief || '').trim();
      if (!brief) throw new Error('falta la descripción del video (options.brief)');
      const modo = options.modo === 'b-roll' ? 'b-roll' : 'talking-head';
      const guia = modo === 'talking-head'
        ? 'Es un TALKING HEAD: una persona a cámara con lip-sync, diálogo LARGO en español rioplatense (voseo) que engancha y comenta, plano medio waist-up. Seguí las reglas DURAS de talking head.'
        : 'Es B-ROLL cinematográfico: sin diálogo ("No spoken dialogue, ambient sound only"), una sola toma continua, mismo fondo, sin cortes. Si se ve una pantalla de app: "screen not clearly legible".';
      return { prompt: `Sos el prompt-writer de Google Flow (Veo 3.1). Escribí UN prompt final, listo para pegar en Flow, para el video que describe el usuario. TODO el prompt va en INGLÉS salvo el diálogo (si hay), que va en español rioplatense entre comillas.
${guia}
${VEO_RULES}
DESCRIPCIÓN DEL USUARIO: ${brief}
Devolvé SOLO el prompt (texto plano, sin JSON, sin markdown, sin comillas envolventes, sin explicaciones).` };
    },
    parse(text) {
      const t = String(text || '').trim();
      if (!t) throw new Error('el molde videoprompt no devolvió prompt');
      return { prompt: t };
    },
  },

  // ── BRIEFTOKB (nuevo KSP por texto) — cura un texto libre al shape del KnowledgeBase (KSP) ──
  // Segunda fuente de entrada además de "Integraciones": el usuario pega un texto describiendo el
  // negocio (naming, marca, qué ofrece, pantallas si las menciona) y esto lo convierte al MISMO shape
  // que ya consume kbToProjectInput (src/lib/knowledgeBase.ts) — de ahí en adelante el sistema funciona
  // idéntico a cuando el KB viene de una app real. NO inventa datos que el texto no traiga: los campos
  // opcionales quedan vacíos/ausentes en vez de rellenarse con algo plausible.
  briefToKb: {
    build({ options = {} }) {
      const brief = String(options.brief || '').trim();
      if (!brief) throw new Error('falta el texto del negocio (options.brief)');
      return { prompt: `Sos un curador de datos. Convertí el siguiente texto libre sobre un negocio al shape EXACTO de un Knowledge Base (KSP). NO inventes nada que el texto no diga: si un campo no está en el texto, omitilo (no lo rellenes con algo plausible).

Devolvé SOLO JSON con este shape:
{
  "contract_version": "1.2",
  "business": { "name": "...", "tagline": "...", "description": "...", "value_story": "...", "industry": "...", "target_audience": "...", "website": "..." },
  "key_messages": ["..."],
  "offerings": [{ "name": "...", "description": "...", "key_features": ["..."] }],
  "differentiators": ["..."],
  "objections": [{ "objection": "...", "response": "..." }],
  "faq": [{ "question": "...", "answer": "..." }],
  "pricing": { "summary": "...", "promotions": ["..."] },
  "do_not_say": ["..."],
  "brand": { "colors": { "primary": "#...", "accent": "#..." }, "phonetic": "...", "tone": "..." },
  "screens": [{ "label": "...", "kind": "list|dashboard|form|wizard|timeline|detail|map|feed", "headline": "...", "nav": ["..."], "components": ["..."], "layout": "...", "flow": "..." }]
}
Reglas: "business.name" y "business.description" son OBLIGATORIOS (si el texto no da un nombre claro, usá el nombre del producto/servicio que sí mencione). "offerings" es un array (puede tener 1 solo ítem) — SIEMPRE presente aunque sea corto. Los demás campos: solo si el texto los menciona; si no, omitilos del JSON (no pongas array vacío ni string vacío). Sin emojis, español rioplatense donde el texto ya venga en español.
TEXTO DEL USUARIO:
${brief}` };
    },
    parse(text) {
      const o = extractJson(text);
      if (!o?.business?.name || !o?.business?.description) throw new Error('el texto no trajo un negocio identificable (falta nombre o descripción)');
      if (!Array.isArray(o.offerings)) o.offerings = [];
      o.contract_version = o.contract_version || '1.2';
      return o;
    },
  },

  // ── MOCKUPSTEXTO (línea animada, 2026-10-09) — el dueño describe el reel con sus palabras y de ahí salen
  // las escenas del storyboard animado sobre las pantallas REALES del kit. Atajo directo a Render: la
  // descripción manda el orden y qué se destaca; el molde sólo estructura, no inventa pantallas ni datos.
  // El storyboard decide si una escena es de pantalla (`screen` = nombre exacto del kit) o de título ("").
  mockupsTexto: {
    build({ context = {}, options = {} }) {
      const descripcion = String(options.descripcion || '').trim();
      if (!descripcion) throw new Error('falta la descripción del reel (options.descripcion)');
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      const bloqueKit = mediaKitText(piece);
      const cta = piece.mediaKit?.cta;
      const ctaTxt = cta && (cta.principal || cta.url) ? [cta.principal, cta.url].filter(Boolean).join(' · ') : '(no hay CTA verificado: el título de cierre sale de la descripción)';
      return { prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: convertí la DESCRIPCIÓN DEL DUEÑO en las ESCENAS de un reel ANIMADO de mockups sobre las pantallas reales del producto. No inventes funciones ni pantallas.

Sos director de un reel ANIMADO ${asp}, sin personas filmadas: cada escena es o una PANTALLA real del producto con un título corto, o un TÍTULO solo (sin pantalla) para abrir, cerrar o decir una idea.
${bloqueKit}
PRINCIPIO:
La descripción del dueño manda: el orden, qué se muestra y qué se destaca salen de ahí, con sus palabras. Una escena = un momento visual claro. Usá sólo las escenas necesarias para contar lo que describió: mínimo 3, máximo 8.

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook (la primera), desarrollo, gag (opcional, el remate), cta (la última, siempre).
- screen: si la escena muestra una pantalla o función que está en CAPTURAS REALES, el nombre EXACTO de esa captura. Si es una apertura, un cierre o una idea sin pantalla, "".
- durSec: entre 3 y 5 (número).
- accion: el título visible, de 2 a 6 palabras, en español rioplatense (voseo), sin markdown.
- continuidad: la palabra o par de palabras del título que se resalta; tiene que estar escrita IGUAL dentro de accion. Una por escena.
- dialogo: UNA frase de narración de 6 a 14 palabras que explica ese momento con las palabras del dueño; "" si el dueño no dijo nada de ese momento. En la escena cta, dialogo = "" (la placa final ya muestra el CTA y el dominio; no repitas la URL en ningún texto).
- plano: "". angulo: "". personajes: [].

NO ASUMIR:
- pantallas que no estén en CAPTURAS REALES: si el dueño pide una que no existe, hacé esa escena de título (screen "");
- funciones, cifras o resultados que el dueño no mencionó;
- datos "plausibles": si no está en la descripción ni en las capturas, no va.

Devolvé SOLO JSON:
{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 3, "screen": "", "plano": "", "angulo": "", "personajes": [], "accion": "...", "dialogo": "...", "continuidad": "..." }] }

NEGOCIO: ${name}
CTA DEL CIERRE: ${ctaTxt}
DESCRIPCIÓN DEL DUEÑO:
${descripcion}` };
    },
    parse(text, body) {
      const o = extractJson(text);
      const piece = (body && body.context && body.context.piece) || {};
      const pantallas = Array.isArray(piece.mediaKit?.pantallas) ? piece.mediaKit.pantallas : [];
      return { escenas: escenasMockupDesdeTexto(o?.escenas, pantallas) };
    },
  },
};

// Valida y normaliza las escenas del molde mockupsTexto. A diferencia de `asignarCapturas`, acá NO se
// reparte una captura "por turno" a las escenas sin pantalla: sin coincidencia, la escena es de título.
export function escenasMockupDesdeTexto(escenas, pantallas = []) {
  if (!Array.isArray(escenas) || escenas.length < 1) throw new Error('la descripción no alcanzó para armar escenas');
  const ROLES = new Set(['hook', 'desarrollo', 'gag', 'cta']);
  const limpiar = (s) => String(s || '').replace(/[*_`#]+/g, '').replace(/\s+/g, ' ').trim();
  const out = escenas.slice(0, 8).map((e, i) => {
    const accion = limpiar(e.accion);
    if (!accion) throw new Error(`la escena ${i + 1} vino sin título`);
    const rol = ROLES.has(e.rol) ? e.rol : (i === 0 ? 'hook' : 'desarrollo');
    const durSec = Math.min(5, Math.max(3, Number(e.durSec) || 4));
    const pedido = normLabel(e.screen);
    const p = pedido
      ? pantallas.find((x) => normLabel(x.nombre) === pedido)
        || pantallas.find((x) => normLabel(x.nombre).includes(pedido) || pedido.includes(normLabel(x.nombre)))
      : null;
    const resaltar = limpiar(e.continuidad);
    const continuidad = resaltar && accion.toLowerCase().includes(resaltar.toLowerCase()) ? resaltar : '';
    // sin URLs ni separadores sueltos (el modelo tiende a pegar el CTA con su dominio en la narración del cierre)
    const dialogo = limpiar(e.dialogo).replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/\s*[·|•-]+\s*$/, '').trim().split(' ').filter(Boolean).slice(0, 20).join(' ');
    return {
      n: i + 1, rol, durSec, plano: '', angulo: '', personajes: [],
      accion, dialogo, continuidad,
      ...(p ? { screen: p.nombre, archivoCaptura: p.archivo } : {}),
    };
  });
  if (out[out.length - 1].rol !== 'cta') out[out.length - 1] = { ...out[out.length - 1], rol: 'cta' };
  return out.map((e) => (e.rol === 'cta' ? { ...e, dialogo: '' } : e));   // la placa ya dice el CTA
}

export function buildFunctionPrompt({ functionId, context, options, regenerate }) {
  const runner = RUNNERS[functionId];
  if (!runner) throw new Error(`función no implementada en el backend: ${functionId}`);
  // Regla 2 del Prompt Engine: cada pedido lleva la versión de su prompt (viaja al log y al resultado).
  return { ...runner.build({ context, options, regenerate }), promptVersion: PROMPT_VERSIONS[functionId] || `${functionId}/0` };
}

// `body` = { functionId, context, options, regenerate } — lo usa `flowpack` para la garantía de
// consistencia (leer context.piece.storyboard/cast en el parse). Los moldes legacy ignoran el 3er arg.
export function parseFunctionResult(functionId, text, body) {
  const runner = RUNNERS[functionId];
  if (!runner) throw new Error(`función no implementada en el backend: ${functionId}`);
  return runner.parse(text, body);
}

export const IMPLEMENTED_FUNCTIONS = Object.keys(RUNNERS);
