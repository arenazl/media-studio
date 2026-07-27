// RUNNERS de las funciones del proceso guiado (lado backend = la "receta").
// El front manda { functionId, context, options, regenerate } a /api/run-function; acá se ARMA
// el prompt (con el molde correspondiente) y se PARSEA la respuesta de la IA. La llamada a la IA
// (runAI, Claude headless) la hace index.mjs: este módulo es PURO (sin red), así se puede testear
// sin gastar tokens. El molde de cada función NO se persiste por negocio: es la misma receta para
// todos, y la IA la aplica on-demand al KB de cada app.

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
- Persona ATRACTIVA, de belleza convencional/hegemonica pero creible (no cara de IA): "a striking, conventionally beautiful and charismatic [Argentine ...] in her late 20s to early 30s, polished and camera-ready, with long sleek hair, defined attractive features and a confident, magnetic presence". Vestida y ambientada SEGUN el rubro del negocio (ej. blazer en una oficina), nunca fuera de contexto.
- TALKING HEAD (hook y cierre = los "videos iniciales") — reglas DURAS:
  * Plano MEDIO, de la cintura para arriba, camara a distancia conversacional (~2m): "medium shot, waist-up framing, she fills a good portion of the frame with strong, dominant presence". NUNCA wide full-body desde lejos, NUNCA la persona chica en el cuadro.
  * Entorno real del negocio en soft-focus de fondo (ej. oficina moderna y luminosa con escritorios y colegas), adaptado al rubro.
  * Camara QUIETA o con un push-IN MUY sutil: "the camera holds steady or does a very subtle slow push-in as she speaks". PROHIBIDO alejar: nada de "zoom out / pull back / dolly back" (achica al sujeto y mata la presencia).
  * EXPRESIVIDAD de venta: "warm, confident and charming tone, realistic expressive face".
  * Dialogo LARGO que COMENTA el producto y LLENA el clip (NO un gancho suelto): el talking head dura 8s (MINIMO 8s, el maximo de Flow), asi que decí una frase ENTERA de ~24-30 palabras que engancha Y explica el beneficio concreto del producto, fluida: "speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: '<frase larga que engancha y comenta el producto, con una pausa actuada en el ...>'". Marca fonetica SIEMPRE la fonetica que te paso (nunca el nombre escrito).
  * SIN silencio de relleno: la persona habla durante TODO el clip. PROHIBIDO "stays quiet until the end".
  * La MISMA persona en hook y cierre: misma descripcion fisica EXACTA (edad, pelo, ropa, color).
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
    brief: (project.brief || '').slice(0, 2500),
    // 1.2: las screens son METADATA (kind/headline/components/data), no URLs. Las describo para el molde.
    screens: Array.isArray(project.screens)
      ? project.screens.map((s) => (typeof s === 'string' ? s : [s.label, s.kind && `(${s.kind})`, s.headline].filter(Boolean).join(' '))).join(' · ')
      : '',
    guion: Array.isArray(piece.guion) && piece.guion.length ? piece.guion.join(' · ') : '',
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
  const g = piece.guion;
  if (g && Array.isArray(g.blocks)) {
    return g.blocks.map((b) => `[${b.role || ''}] ${b.narration || ''}${b.visual ? ` (visual: ${b.visual})` : ''}`).join(' · ');
  }
  if (Array.isArray(g) && g.length) return g.join(' · ');
  return '';
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

// Cada escena → la CAPTURA real del kit que le toca (`archivoCaptura` = relpath). Match por el label
// de pantalla que devolvió la IA (`screen`) contra el `nombre` de las capturas. Sin kit: no toca nada.
function asignarCapturas(escenas, piece = {}) {
  const pantallas = Array.isArray(piece.mediaKit?.pantallas) ? piece.mediaKit.pantallas : [];
  if (!pantallas.length) return escenas;
  return escenas.map((e) => {
    if (e.archivoCaptura) return e;
    const label = normLabel(e.screen);
    if (!label) return e;
    const p = pantallas.find((x) => normLabel(x.nombre) === label)
      || pantallas.find((x) => normLabel(x.nombre).includes(label) || label.includes(normLabel(x.nombre)));
    return p && p.archivo ? { ...e, archivoCaptura: p.archivo } : e;
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
        perfilInstruccion = `CAMPAÑA COMPLETA: Generá exactamente entre 6 y 7 piezas (reels) cubriendo el embudo de marketing completo:
1. Reel 1 (Awareness / Gancho): El dolor principal y la solución con alto gancho inicial.
2. Reel 2 (Demo de Producto): Recorrido dinámico por la app y sus funciones clave.
3. Reel 3 (Beneficios & Valor): El impacto real y los beneficios cotidianos para el usuario.
4. Reel 4 (Prueba Social / Confianza): Reseñas, verificación, garantía y tranquilidad.
5. Reel 5 (Conversión Directa): Llamado a la acción directo con oferta/beneficio concreto.
6. Reel 6 (Solo Mockups Animados): Showcase visual de pantallas UI en movimiento.
7. Reel 7 (Cierre / Retargeting): Explicación directa superando la objeción principal.`;
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

      return { prompt: `Actuás como social-marketing-strategist. Del BRIEF, armá la estrategia de campaña de video para redes (Instagram/Facebook).

${perfilInstruccion}

ENFOQUE GLOBAL: Cada pieza cuenta TODA la propuesta de valor del negocio en UN solo video con un ÁNGULO/approach DISTINTO.
Generá ${cuantas} piezas, todas GLOBALES, con sus respectivos ángulos.

Devolvé SOLO JSON (sin texto ni markdown alrededor):
{
  "positioning": "1-2 frases: qué es, para quién y por qué es distinto",
  "audiences": [{ "label": "segmento", "pain": "su dolor concreto", "language": "palabras que usa ese segmento" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "el approach de ESTA versión (MÁXIMO 3-4 PALABRAS, ej: 'Problema-Solución' o 'Demo en vivo')", "format": "${fmtEjemplo}", "durationSec": ${durEjemplo}, "creativeBrief": "qué cuenta (TODA la propuesta, global) y con qué tono/approach, detallado en 2-3 frases" }]
}
Reglas: español rioplatense, sin emojis, NO inventes datos/precios/cifras como reales. IMPORTANTE: El campo 'angle' debe ser un título muy corto (máximo 3-4 palabras).
NEGOCIO: ${x.name}
BRIEF (los hechos): ${x.brief}` };
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
      return { mode: 'set', prompt: `Actuás como promo-director. Escribí el guion de un comercial de ${dur}s para ${piezaDesc}, tono ${tono}${x.angulo ? ` (ángulo: "${x.angulo}")` : ''}.
${concepto ? `CONCEPTO ELEGIDO (respetalo, es la dirección creativa del comercial): ${concepto}\n` : ''}${bloqueTecnica}${bloqueKit}ENFOQUE GLOBAL (clave): contá TODA la propuesta del negocio en ESTE video — no un solo módulo/producto. Enganchá explicando el funcionamiento, CONECTÁ los puntos fuertes en un hilo, reforzá con la prueba y cerrá con el CTA.
Estructura NARRATIVA por bloques con estos roles EXACTOS: hook (primeros 2s, roba la atención, sin logo ni "somos X") -> desarrollo (cómo funciona / la propuesta en vivo) -> gag (el REMATE: el momento más fuerte — humor si el concepto es humorístico, si no la prueba/beneficio contundente) -> cta (llamado a la acción claro). El gag va SIEMPRE ANTES del cta.
Narración calibrada para TTS a ~2.7 palabras/seg (que entre en ${dur}s); estimá el durSec de cada bloque.
IMPORTANTE: SÉ MUY CONCISO. Los bloques de narración deben ser cortos y al pie (máximo 1-2 oraciones por bloque).
Devolvé SOLO JSON: { "blocks": [{ "role": "hook|desarrollo|gag|cta", "narration": "lo que se DICE (voz - súper breve)", "visual": "lo que se VE en pantalla (1 frase)", "durSec": <segundos> }], "music": { "mood": "el mood de la música en 2-3 palabras" } }
NEGOCIO: ${x.name}
BRIEF: ${x.brief}
No inventes precios/cifras/integraciones como reales. Es GLOBAL: cuenta TODO el negocio.` };
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
        ? ` Para el comercial entero, pesá MUY fuerte estos criterios profesionales DENTRO de los ejes: CONTINUIDAD (flujo nuevo de Flow: la consistencia del actor la fija la IMAGEN de referencia del personaje; los prompts de escena lo llaman por NOMBRE + "Argentine", NO repiten el fisicoEn; entre escenas cierra ropa/luz/lugar), ARCO (hook ≤2s de gancho, gag/remate ANTES del CTA, cuenta TODA la propuesta — regla GLOBAL, jamás un solo módulo), TÉCNICA (talking heads ≥8s, diálogos de ~24-30 palabras, marca fonética en TODO lo hablado).`
        : '';
      return { prompt: `Actuás como promo-critic. Evaluá ${holistico ? 'el COMERCIAL entero' : 'la pieza'} con tu rúbrica de 10 ejes (gancho, claridad, una idea, CTA, formato, marca, duración, ritmo, prueba, originalidad), 0-5 cada uno = total /50. NO lo juzgues por un solo aspecto: puntuá los 10 y sumá.${extra} Mirá ${focos[options.foco] || focos.todo}.
Devolvé SOLO JSON: { "score": <0-50>, "verdict": "LISTO PARA PRODUCIR|AJUSTAR|REHACER", "issues": [{ "severity": "alta|media|baja", "note": "el problema + el fix concreto" }] }
LISTO PARA PRODUCIR si score >= 38. Español rioplatense, sin emojis.
OBJETIVO: ${x.objetivo || '(inferilo)'} · NEGOCIO: ${x.name}
${material}` };
    },
    parse(text) { const o = extractJson(text); if (typeof o.score !== 'number') throw new Error('el QA no trajo score'); return o; },
  },

  // ══ MOLDES DEL REWORK (storyboard-driven) ═══════════════════════════════════════════════════
  // Contrato: reciben los artefactos previos por `context.piece.<artefacto>` SIN aplanar.

  concept: {
    build({ context = {}, options = {} }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const brief = (project.brief || '').slice(0, 2500);
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
      return { prompt: `Sos director creativo de publicidad. Del BRIEF, proponé 2-3 CONCEPTOS de comercial de ~20-30s para redes que desarrollen ESTE approach: ${angulo || '(inferí un ángulo del brief)'} — ${creativeBrief || '(sin brief creativo: usá el brief del negocio)'}.
${bloqueTecnica}${bloqueKit}Cada concepto: la IDEA (situación/gancho en máximo 2-3 oraciones, directo al grano), TONO (2-3 palabras, ej: Cercano y dinámico), ESTÉTICA (dirección visual corta, máximo 2 oraciones), REFERENCIA (a qué anuncio conocido se parece, breve), POR QUÉ FUNCIONA (1 frase).
ENFOQUE GLOBAL (obligatorio): cada concepto cuenta TODA la propuesta, JAMÁS un solo módulo.
Devolvé SOLO JSON (sin texto ni markdown): { "conceptos": [{ "id": "c1", "idea": "...", "tono": "...", "estetica": "...", "referencia": "...", "porQueFunciona": "..." }] }
Reglas: español rioplatense, sin emojis, NO inventes datos/precios como reales. Sé súper CONCISO.
NEGOCIO: ${name} (perfil de campaña: ${perfil})
BRIEF (los hechos): ${brief}` };
    },
    parse(text) {
      const o = extractJson(text);
      if (!Array.isArray(o.conceptos) || !o.conceptos.length) throw new Error('el molde concept no trajo conceptos');
      return o;
    },
  },

  // ── CAST (nivel pieza) — personajes con descripción física EXACTA reutilizable + locación ──
  cast: {
    build({ context = {} }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const concepto = piece.concepto ? JSON.stringify(piece.concepto) : '(sin concepto elegido: inferilo del guion)';
      const guion = pieceGuionText(piece);
      // WO-2/D4: el aspecto sale del formato de la pieza (mismo patrón que storyboard). Con 9:16
      // hardcodeado, un Spot 16:9 casteaba encuadres verticales. Sin formato → '9:16' byte-idéntico.
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      return { prompt: `Sos casting director + location scout de un comercial ${asp}. Del CONCEPTO y el GUION, definí los PERSONAJES (1-2, los que el guion necesita) y la LOCACIÓN.
Por personaje:
- "fisicoEn" = descripción física EXACTA en INGLÉS para pegar VERBATIM en prompts de video (edad, pelo con corte y color, rasgos de la cara, tono de piel, contextura, vestuario completo con colores). Reglas de casting: "a striking, conventionally beautiful and charismatic person in their late 20s to early 30s, polished and camera-ready, with defined attractive features and a confident, magnetic presence", vestido/a SEGÚN el rubro del negocio (nunca fuera de contexto). Sé ESPECÍFICO: nada de "a woman" genérica — la MISMA descripción se pega en TODOS los clips.
- "fisicoEs" = resumen MUY BREVE en español para la UI (1 línea). Sumá "nombre", "rol" (su papel en el comercial), "vestuario" (corto), "personalidad" (1-2 palabras).
La LOCACIÓN: "descripcionEn" igual de exacta en inglés (ambiente, mobiliario, luz, hora del día), más "nombre" y "luz" (corto, ej: Cálida natural).
Devolvé SOLO JSON: { "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
Reglas: sin emojis, no inventes datos. El diálogo del negocio es rioplatense, pero fisicoEn/descripcionEn van en INGLÉS.
NEGOCIO: ${name}
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
        return { prompt: `Sos director de un reel ANIMADO ${asp} (se recrean las PANTALLAS del producto, sin personas). Convertí el guion en un STORYBOARD de escenas numeradas, una por PANTALLA.
${bloqueKit}Por escena: n (número), rol (hook|desarrollo|gag|cta), durSec (3-5s), screen (label de la pantalla del KB), accion (un título corto de <=8 palabras que vende ese momento), dialogo "" (vacío), continuidad (la palabra a RESALTAR del título). Dejá plano/angulo vacíos y personajes [].
La suma de durSec ≈ ${durationSec}s.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 4, "screen": "...", "plano": "", "angulo": "", "personajes": [], "accion": "título corto", "dialogo": "", "continuidad": "palabra a resaltar" }] }
Reglas: español rioplatense, sin emojis, no inventes datos. Marca fonética (nunca el nombre escrito): ${phonetic}.
NEGOCIO: ${name}
PANTALLAS DEL KB: ${screensText(project) || '(sin pantallas: proponé pantallas recreadas y marcalas [demo])'}
GUION: ${guion || '(usá el brief del negocio)'}` };
      }
      const cast = piece.cast ? JSON.stringify(piece.cast) : '(sin cast todavía: usá ids p1/p2 y descripciones genéricas)';
      return { prompt: `Sos director de un comercial FILMADO ${asp}. Convertí el guion en un STORYBOARD de escenas numeradas.
${bloqueKit}Por escena: n, rol (hook|desarrollo|gag|cta), durSec (talking head = 8 MÍNIMO, jamás menos; b-roll 4-8), plano (medium shot waist-up para talking heads — NUNCA wide lejano), angulo (eye-level, etc.), personajes (ids del CAST — USÁ SIEMPRE los mismos), accion (descripción CORTA, máximo 1 oración), dialogo (rioplatense, frase de ~24-30 palabras si es talking head; marca fonética: ${phonetic}), continuidad (qué debe matchear con la escena anterior, MUY corto, ej: "misma ropa, misma luz").
La suma de durSec ≈ ${durationSec}s (puede pasarse antes que recortar un talking head). El gag/remate va ANTES del CTA. Sé conciso.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "..." }] }
Reglas: sin emojis, no inventes datos/precios como reales.
NEGOCIO: ${name}
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
        const durSec = (e.dialogo && String(e.dialogo).trim() && rawDur < 8) ? 8 : rawDur;
        return { ...e, durSec };
      });
      escenas = propagarNarracion(escenas, piece.guion);
      o.escenas = asignarCapturas(escenas, piece);
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
      return { mode: 'pack', prompt: `Sos el prompt-writer de Google Flow (Veo 3.1) en su FLUJO NUEVO: los personajes se crean como ENTIDAD con una IMAGEN de referencia (Nano Banana / Gemini Image) y las escenas se animan llamando al personaje por su NOMBRE. La consistencia la fija la IMAGEN — NO se repite la descripción física en cada prompt (mezclar personaje+estilo+acción en un solo prompt hace que Flow devuelva una imagen estática).
Armá el PACK de un comercial ${asp} desde el STORYBOARD y el CAST, en TRES piezas separadas:

(1) "estilo": UN bloque MUY corto en INGLÉS con el estilo global (máximo 1-2 oraciones) — "photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic, not over-rendered and not CGI-perfect". SOLO estética/formato: SIN personajes y SIN acción.

(2) "personajes": por CADA personaje del CAST, un objeto { id, nombre, promptImagen }. Copiá el "id" y el "nombre" del cast. El "promptImagen" es el prompt para GENERAR LA IMAGEN de referencia en la sección Personaje de Flow: un RETRATO de CUERPO ENTERO (full-body portrait) 9:16, fotorrealista, de UNA persona argentina, construido del "fisicoEn" + "vestuario" del cast, con fondo neutro o contextual del rubro. Es una FOTO fija del personaje mirando a cámara — NO una escena, SIN diálogo, SIN acción. Empezá SIEMPRE con "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine ...".

(3) "escenas": por CADA escena del STORYBOARD, un objeto { escenaN, prompt }. El "prompt" es lo que se ANIMA en Flow. TODO el prompt va en INGLÉS salvo el diálogo. Estructura EXACTA (mapeá los datos de la escena):
   [estilo/formato] + [locación de la escena, del "descripcionEn" RESUMIDO] + [el personaje CORTO por su NOMBRE + nacionalidad "Argentine" — ej. "Ana, a relatable young Argentine woman in her late 20s with long loose hair and casual clothes" — SIN el fisicoEn largo, la imagen ya fija la cara] + [cámara/plano de la escena] + She/He speaks clearly: '<el diálogo de la escena en español rioplatense, con la marca fonética ${phonetic}>' + [dirección de ENTREGA vocal en inglés según el rol: hook = enérgico que engancha, cta = eufórico de cierre, resto = cálido y seguro] + [cierre].
   Referí a los personajes por su NOMBRE (NUNCA pegues el fisicoEn: es lo que rompía Flow). Nombrar "Argentine" en la descripción corta es OBLIGATORIO — sin eso la voz sale en inglés.
   Escenas SIN personajes (b-roll/pantalla): el prompt lleva la locación, "No spoken dialogue, ambient sound only", "one single continuous take, same background, no cut"; si se ve una pantalla de app: "screen not clearly legible". Sin diálogo. Sin texto en pantalla (el overlay va en edición).

${VEO_RULES}

Devolvé SOLO JSON: { "estilo": "...", "personajes": [{ "id": "p1", "nombre": "...", "promptImagen": "..." }], "escenas": [{ "escenaN": 1, "prompt": "..." }] }
STORYBOARD: ${JSON.stringify(storyboard)}
CAST: ${castJson}
NEGOCIO: ${name}${brandTxt}` };
    },
    // parse recibe el `body` (contrato extendido) para leer el storyboard y enriquecer las escenas
    // con su `rol` (autoridad = el storyboard, no la IA) + el estado inicial 'pendiente'.
    parse(text, body) {
      const o = extractJson(text);
      // regen: una escena suelta (flujo nuevo: sin garantía verbatim — la imagen fija la consistencia).
      if (o && o.escena && o.escena.prompt) {
        return { escena: { escenaN: Number(o.escena.escenaN), prompt: o.escena.prompt } };
      }
      if (!o.estilo || !Array.isArray(o.personajes) || !Array.isArray(o.escenas) || !o.escenas.length) {
        throw new Error('el molde flowpack no trajo estilo/personajes/escenas');
      }
      const piece = (body && body.context && body.context.piece) || {};
      const storyboard = Array.isArray(piece.storyboard) ? piece.storyboard : [];
      const rolPorN = new Map(storyboard.map((e) => [Number(e.n), e.rol]));
      const personajes = o.personajes.map((p) => ({ id: p.id, nombre: p.nombre, promptImagen: p.promptImagen }));
      const escenas = o.escenas.map((e) => ({
        escenaN: Number(e.escenaN),
        rol: rolPorN.get(Number(e.escenaN)) || e.rol || 'desarrollo',
        prompt: e.prompt,
        estado: 'pendiente',
      }));
      return { estilo: o.estilo, personajes, escenas };
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
};

export function buildFunctionPrompt({ functionId, context, options, regenerate }) {
  const runner = RUNNERS[functionId];
  if (!runner) throw new Error(`función no implementada en el backend: ${functionId}`);
  return runner.build({ context, options, regenerate });
}

// `body` = { functionId, context, options, regenerate } — lo usa `flowpack` para la garantía de
// consistencia (leer context.piece.storyboard/cast en el parse). Los moldes legacy ignoran el 3er arg.
export function parseFunctionResult(functionId, text, body) {
  const runner = RUNNERS[functionId];
  if (!runner) throw new Error(`función no implementada en el backend: ${functionId}`);
  return runner.parse(text, body);
}

export const IMPLEMENTED_FUNCTIONS = Object.keys(RUNNERS);
