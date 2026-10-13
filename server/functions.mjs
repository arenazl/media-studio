// RUNNERS de las funciones del proceso guiado (lado backend = la "receta").
// El front manda { functionId, context, options, regenerate } a /api/run-function; acá se ARMA
// el prompt (con el molde correspondiente) y se PARSEA la respuesta de la IA. La llamada a la IA
// (runAI, Claude headless) la hace index.mjs: este módulo es PURO (sin red), así se puede testear
// sin gastar tokens. El molde de cada función NO se persiste por negocio: es la misma receta para
// todos, y la IA la aplica on-demand al KB de cada app.

import { scriptToText, scriptNarrations } from './scriptToText.mjs';
import { buildProjectFacts, factsText } from './projectFacts.mjs';
import { compileFlowPack, promptTraduccion, parseTraduccion, promptEscena } from './flowCompiler.mjs';
import { lintCommercial } from './lintCommercial.mjs';
import { PROMPT_VERSIONS, presupuestoLista, maxNarrationWords, esTalkingHead, WPS } from './prompting.mjs';
import { buildConceptPromptV3, CATALOGO_CONCEPTO_V3 } from './media-studio-concept-v3.mjs';
import fs from 'node:fs';
import path from 'node:path';

const PATRONES_MONTAJE = JSON.parse(fs.readFileSync(new URL('./montaje-patrones.json', import.meta.url), 'utf8'));

// la modelo de Lucas como presentadora del cierre (server/presentadora.json): su proyecto de Flow y su nombre ahí
function leerPresentadora() {
  try { const j = JSON.parse(fs.readFileSync(path.resolve('server/presentadora.json'), 'utf8')); return { flowProjectUrl: String(j.flowProjectUrl || '').trim(), nombre: String(j.nombre || '').trim() }; } catch { return { flowProjectUrl: '', nombre: '' }; }
}

// Herencia de concept/3.0 a guion, cast y storyboard (LEEME de la curación): viaja la MISMA ficha del enfoque y el
// tratamiento elegidos, con la regla de cada etapa. Sin enfoque en la pieza el bloque queda vacío (prompts viejos intactos).
function bloqueEnfoque(piece = {}, etapa = 'guion') {
  const enfoque = CATALOGO_CONCEPTO_V3.enfoques.find((e) => e.id === piece.enfoque);
  if (!enfoque) return '';
  const trat = CATALOGO_CONCEPTO_V3.tratamientos.find((t) => t.id === piece.tratamiento);
  const regla = {
    guion: 'Conservá el beneficio, el registro y, si lo hubo, el mecanismo cómico del concepto elegido; no inventes funciones.',
    cast: 'Elegí sólo los personajes y roles que la historia elegida necesita: "quienesAparecen" es una lista de opciones, no un reparto obligatorio.',
    storyboard: 'Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.',
  }[etapa] || '';
  return `ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: ${enfoque.label} [${enfoque.id}]
${enfoque.fichaTexto || JSON.stringify(enfoque.ficha, null, 2)}
${trat ? `TRATAMIENTO: ${trat.label} [${trat.id}]. ${trat.instruccion}\n` : ''}${regla}
`;
}

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
- LOGO: nunca se le pide un logo ni un texto al generador (lo dibujaba). El logo y la placa los pone el montaje; en cada prompt: "Leave some empty headroom at the top of the frame; nothing drawn or written there".
- La PERSONA sale del pedido: quién es, su edad, su ropa y su lugar los decide la historia que se cuenta, nunca un tipo fijo. Creíble, no cara de IA.
- TALKING HEAD (hook y cierre = los "videos iniciales") — reglas DURAS:
  * Plano MEDIO, de la cintura para arriba, camara a distancia conversacional (~2m): "medium shot, waist-up framing, she fills a good portion of the frame with strong, dominant presence". NUNCA wide full-body desde lejos, NUNCA la persona chica en el cuadro.
  * El lugar de la historia, en soft-focus de fondo.
  * Camara QUIETA o con un push-IN MUY sutil: "the camera holds steady or does a very subtle slow push-in as she speaks". PROHIBIDO alejar: nada de "zoom out / pull back / dolly back" (achica al sujeto y mata la presencia).
  * EXPRESIVIDAD de venta: "warm, confident and charming tone, realistic expressive face".
  * Dialogo LARGO que COMENTA el producto y LLENA el clip (NO un gancho suelto): el talking head dura 8s (MINIMO 8s, el maximo de Flow), asi que decí una frase ENTERA de ~24-30 palabras que engancha Y explica el beneficio concreto del producto, fluida: "speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: '<frase larga que engancha y comenta el producto, con una pausa actuada en el ...>'". Marca fonetica SIEMPRE la fonetica que te paso (nunca el nombre escrito).
  * SIN silencio de relleno: la persona habla durante TODO el clip. PROHIBIDO "stays quiet until the end".
  * La MISMA persona en hook y cierre: en el flujo con Personajes por imagen la identidad la fija la IMAGEN de referencia; en cada prompt se la nombra por su NOMBRE + "Argentine" + una descripcion CORTA (ropa, edad aproximada). NUNCA se repite la descripcion fisica larga (fisicoEn).
- B-roll: "No spoken dialogue, ambient sound only" y "one single continuous take, same background, no cut". Ninguna pantalla de app mira a cámara.
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
function mediaKitText(piece = {}, { uso = 'creativo' } = {}) {
  const mk = piece.mediaKit;
  if (!mk) return '';
  const pantallas = Array.isArray(mk.pantallas) ? mk.pantallas : [];
  const momentos = Array.isArray(mk.momentos) ? mk.momentos : [];
  const L = [];
  // 2026-10-12 (Lucas: "las capturas son simplemente una referencia del flujo de la pantalla"): en los pasos creativos el
  // kit entra como el RECORRIDO de la app — qué pantallas hay, qué hace la persona en cada una y cómo la usa cada lado —
  // sin la micro-animación, que describía el caso de la demo ("se elige 'Humedad y filtraciones'…") y el modelo lo tomaba
  // como el caso a contar. El molde de mockups (uso 'mockups') sí necesita la animación y sigue igual.
  if (uso !== 'mockups') {
    if (pantallas.length) {
      L.push('RECORRIDO DE PANTALLAS DE LA APP: las capturas son la referencia del flujo de la app (qué pantallas existen, en qué orden se usan y qué hace la persona en cada una). En el video entran como insertos del montaje. Para nombrar una pantalla usá su NOMBRE EXACTO de esta lista:');
      for (const p of pantallas) L.push(`- ${p.nombre}${p.queDemuestra ? `: ${p.queDemuestra}` : ''}`);
    }
    if (momentos.length) {
      L.push('CÓMO USA LA APP CADA LADO (el flujo, paso a paso):');
      for (const m of momentos) {
        const pant = Array.isArray(m.pantallas) && m.pantallas.length ? ` [${m.pantallas.join(' → ')}]` : '';
        L.push(`- ${m.nombre || 'flujo'}: ${m.historia || ''}${m.remate ? ` — lo que gana: ${m.remate}` : ''}${pant}`);
      }
    }
    if (mk.cta && (mk.cta.principal || mk.cta.url)) {
      L.push(`CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): ${[mk.cta.principal, mk.cta.url].filter(Boolean).join(' · ')}`);
    }
    return L.length ? `${L.join('\n')}\n` : '';
  }
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

// De dónde sale cada cosa, por paso (2026-10-12, Lucas: "todo lo que es la generación de la campaña tiene que surgir de…
// y le decís qué parámetros"). En vez de prohibir usar algo, cada pedido dice qué fuente alimenta qué.
function deDondeSale(etapa) {
  const t = {
    concept: `DE DÓNDE SALE CADA COSA
- La idea sale del mensaje y la dirección de esta pieza (los fijó la estrategia), del enfoque y el tratamiento elegidos, y de lo que la FICHA DEL NEGOCIO dice que resuelve, para quién y con qué dolores.
- La situación, las personas y el lugar de la historia los creás vos a partir de eso: tienen que ser de la vida del público de la ficha.
- El recorrido de pantallas de la app es la referencia de lo que el producto puede mostrar y del flujo que sigue la persona.
- Los barrios y las características de los productos que figuran en la ficha y en las referencias del kit de la app son a modo de ejemplo y no deben replicarse en la historia, los personajes ni las escenas.`,
    script: `DE DÓNDE SALE CADA COSA
- La historia (la situación, quiénes son, qué les pasa, dónde y en qué orden se cuenta) sale del CONCEPTO ELEGIDO, con el enfoque y el tratamiento.
- Lo que el negocio hace y promete sale de la FICHA DEL NEGOCIO (el BRIEF de abajo).
- El recorrido de pantallas de la app dice qué pantalla puede probar cada momento del flujo.
- Los barrios y las características de los productos que figuran en la ficha y en las referencias del kit de la app son a modo de ejemplo y no deben replicarse en la historia, los personajes ni las escenas.`,
    cast: `DE DÓNDE SALE CADA COSA
- Las personas, su edad, su ropa y el lugar salen del CONCEPTO y del GUION: son las de esa historia.
- El rubro y el público de la ficha sirven para que sean creíbles.
- Los barrios y las características de los productos que figuran en la ficha y en las referencias del kit de la app son a modo de ejemplo y no deben replicarse en la historia, los personajes ni las escenas.`,
    storyboard: `DE DÓNDE SALE CADA COSA
- Las escenas, lo que pasa en cada una y quién habla salen del GUION; las personas y sus lugares, del CAST.
- Las pantallas salen del recorrido de pantallas de la app: se nombran tal cual y entran como insertos.
- Los barrios y las características de los productos que figuran en la ficha y en las referencias del kit de la app son a modo de ejemplo y no deben replicarse en la historia, los personajes ni las escenas.`,
  }[etapa];
  return t ? `${t}\n` : '';
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
//   escena con persona y frase → lo que tarda la frase a 2,7 palabras/seg + 1s de acción, de 3 a 7s (2026-10-11: antes
//     era 8s fijo y una frase corta "era aire" y se convertía en b-roll sin la persona; el gancho de RepareHoy llegó a Flow
//     sin la vecina y "sin diálogo". Flow igual genera 8s; el montajista corta en la frase);
//   inserto de pantalla → 2 a 3s y sin frase (la frase la dice la persona en su escena; muda más tiempo parece tildada);
//   b-roll con voz en off (diálogo sin personajes, sólo con locutor) → lo que dura su texto, de 4 a 8s;
//   b-roll mudo → 4s (o lo que dijo el modelo si está entre 3 y 6).
// El storyboard dura lo que dura el GUION (estudio curado, 2026-10-12: "la duración final del storyboard debe coincidir con
// el guion aprobado"). El modelo le pone 8 s a cada toma filmada (confunde los 8 s que genera Flow con los segundos de
// edición): en la campaña del 12/10 las piezas de 26 s salían de 34 a 49 s. Si el storyboard se pasa más de un 5%, cada
// escena se achica en proporción, sin bajar de lo que tarda su frase (2,7 palabras por segundo + medio segundo) ni de
// 1,5 s una escena sin frase. Los segundos van de a medio.
export function ajustarAlGuion(escenas, guion) {
  const total = (Array.isArray(guion?.blocks) ? guion.blocks : []).reduce((a, b) => a + (Number(b?.durSec) || 0), 0);
  const suma = (escenas || []).reduce((a, e) => a + (Number(e.durSec) || 0), 0);
  if (!total || !suma || suma <= total * 1.05) return escenas;
  const palabras = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
  const pisos = escenas.map((e) => { const w = palabras(e.dialogo); return w ? Math.ceil((w / WPS) * 2) / 2 + 0.5 : 1.5; });
  let ds = escenas.map((e, i) => Math.max(pisos[i], Number(e.durSec) || 0));
  for (let k = 0; k < 6 && ds.reduce((a, b) => a + b, 0) > total * 1.05; k++) {
    const fijas = ds.reduce((a, d, i) => a + (d <= pisos[i] ? d : 0), 0);
    const libres = ds.reduce((a, d, i) => a + (d > pisos[i] ? d : 0), 0);
    if (!libres) break;
    const f = Math.max(0, (total - fijas) / libres);
    ds = ds.map((d, i) => (d > pisos[i] ? Math.max(pisos[i], Math.round(d * f * 2) / 2) : d));
  }
  return escenas.map((e, i) => (ds[i] === Number(e.durSec) ? e : { ...e, durSec: ds[i], durSecModelo: e.durSecModelo ?? e.durSec }));
}

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
    // inserto de pantalla: sin frase y de 2 a 3s (si el modelo le puso una, nadie la iba a decir)
    if (String(e.pantalla || '').trim() && !(e.personajes || []).length) {
      const durSec = Number(e.durSec) > 0 ? Number(e.durSec) : 3;
      const limpio = String(e.dialogo || '').trim() ? { ...e, dialogo: '', dialogoModelo: e.dialogo } : e;
      out.push(durSec === Number(e.durSec) ? limpio : { ...limpio, durSec, durSecModelo: e.durSec });
      continue;
    }
    const w = palabras(e.dialogo), d = Number(e.durSec) || 0;
    const th = esTalkingHead(e);
    const extra = {};
    // storyboard/3.8 (2026-10-12, estudio curado): la duración es la del guion, que el storyboard copia; no se recalcula por
    // palabras. Sólo se completa si el modelo no la puso.
    if (th) { const durSec = d > 0 ? d : Math.min(7, Math.max(3, Math.ceil(w / WPS) + 1)); out.push(durSec === d ? e : { ...e, durSec, durSecModelo: d }); continue; }
    if (!w) { const durSec = d > 0 ? d : 4; out.push(durSec === d ? e : { ...e, durSec, durSecModelo: d }); continue; }
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

export function asignarCapturas(escenas, context = {}, piece = {}) {
  const project = context.project || {};
  const mkScreens = Array.isArray(piece.mediaKit?.pantallas) ? piece.mediaKit.pantallas : [];
  const projScreens = Array.isArray(project.screens) ? project.screens : [];
  const pantallas = mkScreens.length ? mkScreens : projScreens;

  if (!pantallas.length) return escenas;
  const buscar = (txt) => {
    const label = normLabel(txt);
    if (!label) return null;
    return pantallas.find((x) => normLabel(x.nombre || x.label) === label)
      || pantallas.find((x) => label.startsWith(normLabel(x.nombre || x.label)))   // el modelo copia "nombre: descripción…"
      || pantallas.find((x) => normLabel(x.nombre || x.label).includes(label) || label.includes(normLabel(x.nombre || x.label)));
  };
  return escenas.map((e, idx) => {
    // inserto de pantalla (storyboard/2.1): "pantalla" queda con el NOMBRE exacto de la captura del kit y su archivo
    if (String(e.pantalla || '').trim()) {
      const p = buscar(e.pantalla);
      if (p) e = { ...e, pantalla: p.nombre || p.label, archivoCaptura: e.archivoCaptura || p.archivo || p.url || p.fileRef || p.image || '' };
    }
    if (e.archivoCaptura) return e;
    const label = normLabel(e.screen);
    let p = label
      ? pantallas.find((x) => normLabel(x.nombre || x.label) === label)
        || pantallas.find((x) => normLabel(x.nombre || x.label).includes(label) || label.includes(normLabel(x.nombre || x.label)))
      : null;
    // sin coincidencia NO se reparte una captura por turno: la escena queda sin captura (el montajista y los mockups
    // la tratan como escena sin pantalla). El reparto por turno metía la tesorería en la escena de la cuadrilla.
    const cap = p?.archivo || p?.url || p?.fileRef || p?.image || '';
    return cap ? { ...e, archivoCaptura: cap } : e;
  });
}

const RUNNERS = {

  // ── ESTRATEGIA (nivel proyecto) — del brief: posicionamiento + público + plan de piezas ──
  // El director no inventa una película ni reescribe el guion: elige operaciones de montaje CONCRETAS.
  // Compilador puro src/lib/direccionMontaje.ts valida cada acción antes de modificar el plan.
  montageDirection: {
    build({ context = {} }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const escenas = Array.isArray(piece.escenas) ? piece.escenas.slice(0, 30) : [];
      if (!escenas.length) throw new Error('Director de montaje: todavía no hay escenas.');
      const tieneMusica = !!piece.tieneMusica;
      const tieneSfx = !!piece.tieneSfx;
      const patrones = PATRONES_MONTAJE.patrones.filter((p) =>
        p.aplica?.enfoques?.includes(piece.enfoque) || p.aplica?.tratamientos?.includes(piece.tratamiento));
      return { prompt: `ROL: Director/a de montaje publicitario y mezclador/a de sonido. Recibís un spot YA FILMADO/COMPUESTO. Proponé decisiones precisas para el montaje INICIAL, sin modificar el guion ni inventar tomas. La creatividad es elegir muy pocos momentos significativos, NO aplicar todos los efectos.

OBJETIVO: ${piece.objetivo || 'comunicar el beneficio de la marca'}
PIEZA: ${piece.titulo || ''}
MARCA: ${project.name || ''}
RUBRO: ${project.type || 'no declarado'}
FICHA DEL NEGOCIO (sólo datos de contexto, no suponer resultados): ${String(project.brief || '').slice(0, 3500)}
ENFOQUE NARRATIVO: ${piece.enfoque || 'caso'}
TRATAMIENTO: ${piece.tratamiento || 'natural'}
CONCEPTO: ${JSON.stringify(piece.concepto || {})}
GUION: ${JSON.stringify(piece.guion || {})}
FORMATO FINAL: ${piece.cierreTipo || 'logo'}
MÚSICA DISPONIBLE: ${tieneMusica ? 'sí' : 'NO: no propongas music_*'}
SFX DISPONIBLES: ${tieneSfx ? 'sí' : 'NO: no propongas sfx_off'}
ESCENAS DISPONIBLES (material real; sólo estos números):
${JSON.stringify(escenas)}

PATRONES EDITORIALES PERTINENTES (heurísticas, NO escenas ni pausas obligatorias):
${JSON.stringify(patrones.length ? patrones : PATRONES_MONTAJE.patrones.slice(0, 1))}

GRAMÁTICA DE RECURSOS REALES:
- music_drop: cortar la música brevemente para una revelación, reacción o remate. NO corta las voces.
- music_dip: bajar un poco la música en un instante expresivo.
- music_lift: enfatizar un momento visual sin voz (la voz sigue mandando por ducking).
- cut: corte seco entre escenas.
- dissolve: transición suave entre escenas.
- show_face: retirar insertos de esa escena para permitir ver reacción/cara; sólo si tiene insertos.
- sfx_off: suprimir efectos dentro de esa escena; sólo si hay efectos.

REGLAS DE DIRECCIÓN:
1. Elegí entre 0 y 5 decisiones; preferí ninguna a una arbitraria. Un spot institucional normalmente evita bromas y music drops. Un spot gracioso PUEDE usar un vacío sonoro si existe un momento con reacción verdadera; el humor no implica necesariamente pausa. Una demo prioriza inteligibilidad y visibilidad de la interfaz.
2. CADA decisión debe citar un escenaN que tenga clip real. La elección \"cuando\" puede ser \"antes\", \"inicio\" o \"final\"; para cut/dissolve se modifica el corte adyacente.
3. durSec va de 0 a 1.5; para music_* usar preferentemente 0.2 a 1.0. Nunca inventes silbidos ni pistas. No inventes otros efectos que no existan aquí.
4. Una decisión sólo existe si aporta propósito verificable: el motivo dice qué gesto, palabra o cambio del material real la justifica. No tomes el papel de música por encima de diálogo audible.
5. Respeta los tres modos de cierre (logo con locutor, pantalla, presentadora). No propongas dos voces de cierre.
6. Evitá whoosh sistemático, fundidos a cada corte y pausas vacías. La marca debe tener un final claro.
7. La categoría del producto condiciona la estética, pero NO obliga efectos; el enfoque, la escena y la audiencia mandan.

Devolvé SOLO JSON con este shape exacto:
{ "diagnostico": "una frase concreta sobre el spot", "decisiones": [{ "recurso": "music_drop|music_dip|music_lift|cut|dissolve|show_face|sfx_off", "escenaN": 2, "cuando": "antes|inicio|final", "durSec": 0.4, "motivo": "qué momento observable lo justifica" }] }
No agregues operaciones fuera del vocabulario. Nunca agregues escenas ni assets.` };
    },
    parse(text) {
      const o = extractJson(text);
      if (!o || typeof o.diagnostico !== 'string' || !Array.isArray(o.decisiones)) throw new Error('montageDirection: JSON sin diagnostico o decisiones');
      return o;
    },
  },
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

JERARQUÍA DE LA PIEZA

Cada pieza debe tener:
1. Un mensaje principal.
2. Una necesidad concreta.
3. Una prueba o capacidad directamente vinculada al mensaje.
4. Un beneficio observable.
5. Un CTA consistente.

Los supportingFacts no son una lista de todo lo verdadero.
Incluí sólo hechos necesarios para demostrar el mensaje.

No incorpores datos comerciales secundarios sólo porque
estén disponibles en el brief.

Distinguí siempre "hasta N" de "N garantizados".
No conviertas capacidades posibles en resultados asegurados.

La campaña puede cubrir múltiples beneficios.
La pieza individual no debe intentar cubrirlos todos.

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
      // 2026-10-12: el front manda siempre "cercano"; con tratamiento elegido manda el tratamiento (un sobrio salía cercano)
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
        return { mode: 'item', prompt: `Actuás como promo-director. Rehacé SOLO ESTE bloque del guion (${piece.tratamiento ? 'con el tono del TRATAMIENTO elegido' : `tono ${tono}`}), con una propuesta DISTINTA y mejor. Mantené su rol.
Devolvé SOLO el JSON del bloque: { "role": "${cur.role || 'hook'}", "narration": "lo que se DICE (voz - SÚPER CORTO, máximo 1-2 oraciones)", "visual": "lo que se VE (breve, 1 línea)", "durSec": <segundos estimados a ~2.7 palabras/seg> }
${bloqueEnfoque(piece, 'guion')}NEGOCIO: ${x.name} · BLOQUE ACTUAL (hacelo distinto): ${JSON.stringify(cur)}
Rioplatense, sin emojis, no inventes datos. Sé estricto con la brevedad. Si el rol es "giro" o "gag": es el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor.` };
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
      // script/3.0 (2026-10-11, Lucas: "materia prima = buenos personajes, buen guion, buen storyboard"): en una pieza
      // FILMADA no hay locutor: cada palabra la dice en cámara un personaje, y el guion tiene que decir quién. Antes el
      // guion no lo decía, el storyboard adivinaba (le dio a la vecina una frase de la electricista) y las frases sin
      // dueño terminaban como "voz en off" que nadie grababa.
      const filmado = tipo !== 'animado';
      // script/3.7 (2026-10-12): de lo agregado el 11/10 queda sólo lo técnico (sin locutor, una persona por bloque). El
      // criterio narrativo es el del estudio curado (docs/17-orquestador/radiografias/nuevoestudio.md), con sus palabras.
      const bloqueQuien = filmado ? `
QUIÉN DICE CADA COSA (técnico: en esta pieza no hay locutor ni voz en off; sólo se oye lo que dicen las personas en cámara)
- "quien" = la persona de la historia que dice esa frase en cámara, siempre con el mismo nombre en toda la pieza. El cierre lo muestra la PLACA del montaje: "quien" = "placa".
- Una sola persona por bloque. Si hablan dos, son dos bloques.
- Un bloque puede no tener voz (narration "") si la imagen cuenta sola ese momento; entonces "quien" es "".
` : '';
      const bloqueCalidad = filmado ? `
CALIDAD DRAMÁTICA Y NATURALIDAD

Antes de escribir el diálogo, identificá internamente qué quiere cada personaje en ese momento, qué acaba de suceder y qué provoca su siguiente reacción.

Los personajes no son portavoces del negocio. Son personas viviendo una situación concreta.

REGLAS
- Ningún personaje debe pronunciar una frase que parezca extraída de la ficha comercial.
- El diálogo debe responder a algo que ocurre o que otro personaje acaba de decir.
- Permití interrupciones, preguntas genuinas, respuestas breves, pequeños malentendidos y reacciones inesperadas cuando resulten naturales.
- No fuerces a los personajes a explicar el problema y la solución verbalmente. El espectador puede comprender una parte por lo que ve.
- Una frase breve puede ser mejor que una explicación completa.
- El humor puede surgir de una observación cotidiana, sin necesidad de construir un chiste.
- No obligues a todos los personajes a hablar ni a realizar acciones continuamente.
- Respetá el tono y el mecanismo del concepto elegido.

CONTROL OBLIGATORIO
Leé cada intervención como si fuera una conversación real entre esas personas, sin cámaras presentes.

Si suena a publicidad, reformulala.

Si una línea no revela carácter, no provoca una reacción, no aporta información necesaria ni hace avanzar la situación, eliminala.

Evaluá internamente al menos dos formulaciones distintas de las intervenciones principales y conservá la más natural. No muestres alternativas en el JSON final.
` : '';
      const bloqueVisualFilmado = filmado ? `- quien: la persona que lo dice en cámara ("" si el bloque no tiene voz; "placa" en el cierre).` : '';
      return { mode: 'set', prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: escribí el GUION. No adelantes casting, planos ni decisiones técnicas del storyboard. Usá únicamente los hechos provistos; si un dato no está, no lo inventes.

Actuás como promo-director. Convertí el CONCEPTO ELEGIDO en un comercial de ${dur}s para ${piezaDesc}, ${piece.tratamiento ? 'con el tono del TRATAMIENTO elegido' : `tono ${tono}`}${x.angulo ? ` (ángulo: "${x.angulo}")` : ''}.
${regenPrompt}${tipo !== 'animado' ? deDondeSale('script') : ''}${concepto ? `CONCEPTO ELEGIDO (es la dirección creativa; no lo reemplaces por otra idea): ${concepto}\n` : ''}${bloqueEnfoque(piece, 'guion')}${bloqueTecnica}${bloqueKit}
${focoPieza}OBJETIVO NARRATIVO:
- Mantené UNA idea central de principio a fin.
${objetivoScope.replace('${x.name}', x.name)}
- El GIRO es el momento en que el beneficio se ve; nace de la misma situación del concepto y va antes del CTA. Es un remate gracioso SÓLO si el tratamiento elegido es humor: sin humor pedido, nada de chistes, ironía ni parodia.

ESTRUCTURA EXACTA:
hook -> desarrollo -> giro -> cta
${filmado ? `- El orden en que se cuenta lo decide el CONCEPTO ELEGIDO: si empieza por la consecuencia o vuelve atrás, se respeta, siempre que respete los hechos del producto y se entienda la historia.
- hook: el estímulo más interesante para el espectador; puede ser una pregunta, un contraste, una consecuencia, un problema o una revelación.
- Se prohíbe el lenguaje de folleto, no el significado comercial: una persona puede contar lo que le pasó, siempre que suene a su forma de hablar.
- Una escena dramatizada no es un resultado garantizado: no digas cantidades ni tiempos que el BRIEF no garantiza ("hasta tres" no es "tres"; que lleguen no es que lleguen ya).
- cta: lo muestra la PLACA final del montaje (no se filma): "quien" = "placa" y "narration" = el CTA del BRIEF, tal cual.
` : ''}${bloqueQuien}${bloqueCalidad}
PRESUPUESTO HABLADO (contá palabras):
${presupuestoLista(dur)}
Esos durSec son una referencia: podés redistribuirlos entre bloques siempre que la suma final sea ${dur}s.

CADA BLOQUE:
- narration: sólo lo que se DICE. No describas actuación ni cámara.
- visual: una sola frase breve con lo que se VE; tiene que apoyar esa narración, no repetirla.
${bloqueVisualFilmado ? `${bloqueVisualFilmado}\n` : ''}- durSec: duración del bloque.

PRINCIPIO DE GUION PUBLICITARIO

Escribí para ser escuchado, no para ser leído.

El guion debe convertir las funciones del producto en
acciones y consecuencias comprensibles.

No hagas que un personaje explique especificaciones,
categorías, pantallas o atributos de marketing si puede
demostrarlos visualmente.

DIÁLOGOS
- Usar expresiones naturales según personaje y situación.
- Evitar repeticiones de la ficha comercial.
- No convertir cada frase en un claim.
- Priorizar un pensamiento claro por intervención.
- Evitar narraciones que repitan exactamente lo visible.

RELACIÓN AUDIO / IMAGEN
La imagen puede demostrar una funcionalidad mientras
la voz expresa la consecuencia humana.

No describir acciones sobre pantallas como si tuvieran
que ser generadas por un modelo de video.

TIEMPO
Los bloques indican tiempo de montaje, no duración
obligatoria de los clips de generación.

Calcular duración estimada del texto hablado.
Reservar margen para pausas, respiración y transición.
No ajustar el guion solamente al máximo teórico de
palabras por segundo.

RESULTADO
No mostrar una consecuencia posterior que la historia
no haya justificado.

CTA
Usar la marca fonética sólo en la pista hablada.
En overlays, títulos, mockups y URL utilizar la
representación gráfica oficial.

NO ASUMIR:
- datos, cifras, precios, integraciones, clientes o resultados que no estén en el BRIEF;
- funciones que no estén mencionadas;
- un CTA distinto del disponible en el BRIEF.

Devolvé SOLO JSON:
{ "blocks": [{ "role": "hook|desarrollo|giro|cta", ${filmado ? '"quien": "", ' : ''}"narration": "", "visual": "", "durSec": <segundos> }], "music": { "mood": "2-3 palabras" } }

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
        tipo !== 'animado' && deDondeSale('concept').trim(),
      ].filter(Boolean).join('\n');
      // concept/3.0 (curación externa del 2026-10-10, guardada en base-compartida/mediastudio/curaciones/01-concepto-con-enfoque):
      // el dueño elige el ENFOQUE (cómo se organiza la historia) y el TRATAMIENTO (cómo se siente); el humor sólo entra si
      // lo pide. El prompt y su catálogo viven en media-studio-concept-v3.mjs tal como vinieron. El 2.0 queda abajo para
      // comparar o volver (options.molde === 'v2'). Sin brief el 3.0 corta a propósito: no inventa capacidades desde el nombre.
      if (options.molde !== 'v2') {
        const sel = (k, def) => String(options[k] || piece[k] || def);
        return { prompt: buildConceptPromptV3({
          name, brief, perfil, tipo, bloquePieza, bloqueTecnica, bloqueKit,
          enfoqueId: sel('enfoque', 'caso'), tratamientoId: sel('tratamiento', 'natural'),
          intensidadHumor: sel('intensidadHumor', 'sutil'), recursoHumorId: sel('recursoHumorId', 'auto'),
          cierreMarca: String(piece.cierreMarca || ''),
        }) };
      }
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
${deDondeSale('cast')}
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
- vestuarioEn: la misma ropa en INGLÉS, máximo 12 palabras (viaja en cada pedido al generador para que no cambie entre tomas).
- personalidad: 1 a 3 palabras.
- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a esta persona en el comercial, concreto y creíble, con la luz. Si el concepto junta a los personajes en un mismo lugar, es el mismo lugar para todos. Evitá decoraciones, acciones o biografías inventadas que no mejoren la escena.
- quien: el nombre con el que el GUION la nombra en "dice:" (para unir cada frase con su persona).

LOCACIÓN (la general, para el retrato de referencia):
- nombre: corto y específico.
- descripcionEn: 25 a 50 palabras en INGLÉS. Espacio, mobiliario relevante, atmósfera y luz coherentes con el negocio y el guion.
- luz: máximo 8 palabras.

NO ASUMIR:
- profesiones, jerarquías o rasgos que el concepto no necesite;
- objetos, tecnología o instalaciones que impliquen funciones no mencionadas;
- cambios de personaje para distintas escenas: la identidad definida acá debe poder mantenerse en todo el comercial.

Devolvé SOLO JSON:
{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "vestuarioEn": "...", "personalidad": "...", "lugarEn": "...", "quien": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }

${bloqueEnfoque(piece, 'cast')}NEGOCIO: ${name}
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
- rol: hook|desarrollo|giro|cta (giro = el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor).
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
${deDondeSale('storyboard')}${bloqueKit}
PRINCIPIO:
Cada escena tiene una función visual concreta. No agregues escenas por variedad. Si dos escenas cuentan lo mismo, dejá una sola.

${bloqueKit ? 'PANTALLAS (regla dura): nunca se filma una pantalla. Si un momento del guion tiene que mostrar la app, esa escena es un INSERTO: poné en "pantalla" el nombre EXACTO de una de las capturas de arriba, "personajes": [] y en "accion" qué se ve en esa pantalla; la arma el motor con el mockup real, no Flow. En las escenas filmadas, un teléfono o una computadora nunca muestran la interfaz: se ve la persona, su gesto y lo que le pasa.' : 'PANTALLAS (regla dura): nunca se filma una pantalla. Sin capturas de la app, ninguna escena muestra la interfaz: se ve la persona, su gesto y lo que le pasa. "pantalla" va siempre "".'}

QUIÉN HABLA (técnico: en esta pieza no hay locutor ni voz en off)
- Cada frase del GUION la dice EN CÁMARA la persona que figura en "dice:". Una escena filmada por cada bloque con voz:
  "dialogo" = la frase de ese bloque, TAL CUAL; "personajes" = el id de quien la dice (el personaje del CAST cuyo "quien"
  coincide).
- Ninguna frase se repite en dos escenas.
- Un bloque del guion sin voz que muestra a una persona haciendo algo es una escena filmada sin frase, no un inserto.

DIRECCIÓN NARRATIVA DE ESCENAS

Antes de definir plano, iluminación o movimiento, identificá el propósito dramático de cada escena.

Cada escena debe tener:
- Una situación reconocible.
- Una intención humana concreta.
- Una acción o interacción que tenga sentido dentro de esa situación.
- Un pequeño cambio, descubrimiento o reacción, cuando la escena lo requiera.

No agregues gestos sólo para evitar que el personaje esté quieto.

Una conversación puede ser visualmente interesante sin que los personajes estén abriendo puertas, levantando objetos o caminando permanentemente.

El entorno y los objetos deben apoyar la situación narrativa, no competir con ella.

CONTROL OBLIGATORIO
Antes de aprobar cada escena filmada, preguntate:

«Si elimino la descripción de cámara, iluminación y vestuario, ¿todavía queda una situación humana interesante?»

Si no, la escena necesita una acción, un conflicto o una interacción mejor. No más detalles cinematográficos.

DIRECCIÓN ACTORAL (es lo que lee el generador de video: va en "accionEn")

La prioridad de un prompt audiovisual debe ser:
1. Qué está sucediendo entre los personajes.
2. Qué quiere conseguir o expresar cada personaje.
3. Cómo reacciona naturalmente ante la situación.
4. Qué acción física concreta acompaña esa situación.
5. Cómo se filma: cámara, luz, ambiente y estilo.

Mantené todas las restricciones técnicas necesarias para continuidad, identidad visual, duración, diálogos exactos y pantallas verificadas.

No conviertas la actuación en una secuencia mecánica de microgestos.

Evitá instrucciones excesivamente coreografiadas como mover la cabeza, levantar una ceja, girar el teléfono, sonreír y volver a mirar, salvo que sean indispensables para la historia.

Describí la intención actoral y la relación entre los personajes para que el generador tenga libertad de producir una interpretación natural.

CONTROL OBLIGATORIO
Un clip de ocho segundos debe contener un momento humano reconocible y realizable.

La fotografía puede embellecer ese momento, pero nunca reemplazarlo.

LO QUE EL GENERADOR DE VIDEO NO PUEDE HACER (técnico)
- Nada de acciones finas de manos en plano cercano mientras alguien habla (tipear, enchufar, atornillar): el video
  generado deforma los dedos.
- La persona empieza a hablar en el primer segundo de la toma.
- Una toma de video dura como máximo ocho segundos: una frase que tarda más (a 2,7 palabras por segundo) se reparte en dos
  escenas seguidas de la misma persona.
- Si alguien le muestra el teléfono a otro, la pantalla mira al otro y nunca a cámara: lo que muestra lo cuenta el inserto
  con la captura real.

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook|desarrollo|giro|cta (giro = el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor).
- personajes: el id de quien está en cuadro ([] en un inserto de pantalla).
- dialogo: la frase del guion que dice esa persona; "" si en esa escena nadie habla.
- accion: en español, máximo 14 palabras; describe una sola acción visible (es lo que lee el dueño).
- accionEn: en INGLÉS, de 35 a 70 palabras, para el generador de video, en el orden de la DIRECCIÓN ACTORAL: qué está
  sucediendo, qué quiere la persona y a quién le habla (a alguien de la escena, a cámara o para sí); después la acción
  física y el lugar (del CAST). Pronombres con el género correcto del personaje. Sin la frase (va aparte), sin marcas de
  cámara ni lentes, sin texto en pantalla.
- plano: close-up | medium close-up | medium shot | over-the-shoulder | low angle | high angle | handheld follow | wide shot.
- angulo: breve.
- continuidad: máximo 8 palabras; sólo lo que debe mantenerse respecto de la escena anterior.
- pantalla: "" en las escenas filmadas; el nombre EXACTO de la captura en un inserto de pantalla.
- durSec: la del bloque del GUION que cuenta esa escena (si un bloque se reparte entre una escena filmada y un inserto, se
  reparte su duración).

DURACIÓN
La duración final del storyboard coincide con la del GUION aprobado (${durationSec}s): no la recalcules libremente. Los
ocho segundos que genera el video por toma no son los segundos que se usan en la edición.
El giro (el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor) ocurre antes del CTA.
El CTA es la PLACA del montaje: una escena con rol "cta", sin personajes, sin frase y sin pantalla, con el texto de la
placa en "accion". No se filma.

CONTINUIDAD:
Usá siempre los mismos ids para el mismo personaje. No cambies ropa, edad, lugar o luz sin que el GUION lo justifique.

NO ASUMIR:
- personajes fuera del CAST;
- funciones, precios o resultados no presentes en el GUION;
- locaciones o acciones que contradigan el concepto.

Devolvé SOLO JSON:
{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 5, "plano": "...", "angulo": "...", "personajes": ["p1"], "accion": "...", "accionEn": "...", "dialogo": "...", "continuidad": "...", "pantalla": "" }] }

NEGOCIO: ${name}
MARCA FONÉTICA para cualquier diálogo: ${phonetic}
${bloqueEnfoque(piece, 'storyboard')}CAST: ${cast}
GUION: ${guion || '(usá el brief del negocio)'}` };
    },
    // `body` (contrato extendido) trae el guion y el media kit de la pieza: el parse los usa para
    // (1) PROPAGAR la narración a `dialogo` — la fuga que dejaba los renders mudos — y (2) asignar
    // `archivoCaptura` con la captura real que le toca a cada escena.
    parse(text, body) {
      const o = extractJson(text);
      if (!Array.isArray(o.escenas) || !o.escenas.length) throw new Error('el molde storyboard no trajo escenas');
      const ROLES = new Set(['hook', 'desarrollo', 'giro', 'gag', 'cta']);   // 'gag' sólo por compatibilidad con piezas viejas
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
      // la narración se reparte entre escenas mudas SÓLO en el animado (voz en off). En una pieza filmada cada frase la dice
      // un personaje en su escena: repartir el sobrante le daba frases a los insertos de pantalla que nadie iba a decir.
      if ((piece.tipo || 'filmado') === 'animado') escenas = propagarNarracion(escenas, piece.guion);
      if ((piece.tipo || 'filmado') === 'filmado') escenas = ajustarAlGuion(normalizarDuraciones(escenas), piece.guion);
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
        // 2026-10-12: la regeneración pide sólo otra ACCIÓN (accionEn) con la dirección actoral del estudio curado y el
        // pedido se compila igual que el pack (promptEscena). Antes reescribía el prompt entero con las reglas viejas de
        // Veo: casting fijo, la frase del logo que Flow dibujaba y la cara hablando a cámara.
        return { mode: 'escena', prompt: `Sos director de escena de un comercial filmado ${asp}. Rehacé SOLO la acción de la ESCENA ${regenerate.escenaN} para el generador de video, con otra puesta: la misma persona, la misma frase, el mismo lugar y el mismo momento de la historia.

DIRECCIÓN ACTORAL
La prioridad es:
1. Qué está sucediendo entre los personajes.
2. Qué quiere conseguir o expresar cada personaje.
3. Cómo reacciona naturalmente ante la situación.
4. Qué acción física concreta acompaña esa situación.
5. Cómo se filma: cámara, luz, ambiente y estilo.
No conviertas la actuación en una secuencia mecánica de microgestos. Describí la intención actoral y la relación entre los personajes. Un clip de ocho segundos debe contener un momento humano reconocible y realizable.

LA ACCIÓN (accionEn): en INGLÉS, de 35 a 70 palabras, en ese orden. Pronombres con el género correcto del personaje. Sin la frase (va aparte), sin marcas de cámara ni lentes, sin texto en pantalla. Nada de acciones finas de manos mientras habla. Si alguien le muestra el teléfono a otro, la pantalla mira al otro y nunca a cámara.

CAST: ${castJson}
ESCENA ACTUAL: ${JSON.stringify(escena)}
Devolvé SOLO JSON: { "escena": { "escenaN": ${regenerate.escenaN}, "accionEn": "..." } }` };
      }
      // Fase 5 (doc §4.6): el pack se COMPILA sin IA (server/flowCompiler.mjs) con la misma estructura
      // que pedía este prompt. Lo único que se le pide al modelo es traducir las acciones al inglés
      // (una línea por escena). Si no hay acciones, el prompt va vacío y run-function no llama a la IA.
      // Medido antes: 47 a 52 s y USD 0,12 a 0,17 por pack con Opus/Sonnet; ahora la traducción sola.
      void brandTxt;
      return { mode: 'pack', prompt: promptTraduccion(storyboard, piece.cast), compilado: true };
    },
    // parse recibe el `body` (contrato extendido) para leer el storyboard y enriquecer las escenas
    // con su `rol` (autoridad = el storyboard, no la IA) + el estado inicial 'pendiente'.
    parse(text, body) {
      // regen de UNA escena: sigue siendo IA (otra idea visual) y devuelve JSON.
      if (body && body.regenerate && body.regenerate.escenaN != null) {
        const o = extractJson(text);
        const piezaR = (body.context && body.context.piece) || {};
        const sbR = Array.isArray(piezaR.storyboard) ? piezaR.storyboard : [];
        const escR = sbR.find((e) => Number(e.n) === Number(body.regenerate.escenaN));
        if (o && o.escena && o.escena.accionEn && escR) {
          const proyR = (body.context && body.context.project) || {};
          const aspR = piezaR.formato ? (piezaR.formato.aspecto || '9:16') : '9:16';
          const prompt = promptEscena({ ...escR, accionEn: String(o.escena.accionEn).trim() }, { cast: piezaR.cast, lugar: piezaR.cast && piezaR.cast.lugar, phonetic: proyR.phonetic || proyR.name || '', aspecto: aspR });
          return { escena: { escenaN: Number(body.regenerate.escenaN), prompt } };
        }
        if (o && o.escena && o.escena.prompt) return { escena: { escenaN: Number(o.escena.escenaN), prompt: o.escena.prompt } };
        throw new Error('la regeneración de la escena no trajo la acción');
      }
      // Fase 5: pack compilado. `text` es la traducción de las acciones (o vacío).
      const piece = (body && body.context && body.context.piece) || {};
      const project = (body && body.context && body.context.project) || {};
      const storyboard = Array.isArray(piece.storyboard) ? piece.storyboard : [];
      if (!storyboard.length) throw new Error('el pack necesita un storyboard con escenas');
      const traducciones = parseTraduccion(text);
      const aspecto = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      // la presentadora del cierre va con los demás clips (no en las animadas): dice la frase del locutor si ya hay una, si
      // no la firma de la marca, si no la marca y el cierre del guion
      const ctaGuion = ((piece.guion && piece.guion.blocks) || []).find((b) => b.role === 'cta');
      const marca = (project.marcaKit && project.marcaKit.nombreExacto) || project.name || '';
      const frase = (piece.cierre && piece.cierre.locutor && piece.cierre.locutor.texto) || piece.cierreMarca || [marca && `${marca}.`, ctaGuion && ctaGuion.narration].filter(Boolean).join(' ');
      // agnóstico (Lucas, 2026-10-13: "tiene que ser todo medio ambiguo"): cada proyecto puede tener SU presentadora
      // (project.presentadora = { flowProjectUrl, nombre }); sin ella, la de server/presentadora.json
      const presDelProyecto = project.presentadora && String(project.presentadora.flowProjectUrl || '').trim() ? { flowProjectUrl: String(project.presentadora.flowProjectUrl).trim(), nombre: String(project.presentadora.nombre || '').trim() } : null;
      const presentadora = piece.tipo !== 'animado' && String(frase || '').trim() ? { frase, ...(presDelProyecto || leerPresentadora()) } : null;
      const pack = compileFlowPack({ storyboard, cast: piece.cast, phonetic: project.phonetic || project.name || '', traducciones, aspecto, presentadora });
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
      const bloqueKit = mediaKitText(piece, { uso: 'mockups' });
      const cta = piece.mediaKit?.cta;
      const ctaTxt = cta && (cta.principal || cta.url) ? [cta.principal, cta.url].filter(Boolean).join(' · ') : '(no hay CTA verificado: el título de cierre sale de la descripción)';
      return { prompt: `Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: convertí la DESCRIPCIÓN DEL DUEÑO en las ESCENAS de un reel ANIMADO de mockups sobre las pantallas reales del producto. No inventes funciones ni pantallas.

Sos director de un reel ANIMADO ${asp}, sin personas filmadas: cada escena es o una PANTALLA real del producto con un título corto, o un TÍTULO solo (sin pantalla) para abrir, cerrar o decir una idea.
${bloqueKit}
PRINCIPIO:
La descripción del dueño manda: el orden, qué se muestra y qué se destaca salen de ahí, con sus palabras. Una escena = un momento visual claro. Usá sólo las escenas necesarias para contar lo que describió: mínimo 3, máximo 8.

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook (la primera), desarrollo, giro (opcional, el momento en que se ve el beneficio), cta (la última, siempre).
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
  const ROLES = new Set(['hook', 'desarrollo', 'giro', 'gag', 'cta']);   // 'gag' sólo por compatibilidad con piezas viejas
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
