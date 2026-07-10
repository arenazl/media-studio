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

const VEO_OUTPUT = `Devolvé SOLO este JSON (sin texto ni markdown alrededor):
{
  "clips": [
    { "id": "clip-1", "role": "hook", "tStart": 0, "tEnd": 8, "durationSec": 8, "label": "que se ve, 1 linea en español", "prompt": "el prompt COMPLETO para Flow (segun las reglas, talking head de 8s con frase entera)" }
  ],
  "music": { "mood": "mood de la musica, 1 frase" },
  "narration": ["3 variantes de voz en off para el medio, ~30 palabras c/u, rioplatense, sin emojis, una sola idea"]
}`;

function veoFocus(tipo) {
  if (tipo === 'talking-head') return 'Priorizá planos de la persona hablando; el b-roll es secundario.';
  if (tipo === 'broll') return 'Priorizá b-roll; minimo el hook y el cierre con la persona a camara.';
  return 'Mezclá talking head (hook + cierre) con b-roll en el medio.';
}

function veoSequencePrompt({ name, phonetic, durationSec, tipo, guion, screens, brief }) {
  return `Sos un director de reels verticales 9:16 que escribe prompts para Google Flow (modelo Veo 3).
Armá la SECUENCIA de clips de un "human reel" de ${durationSec}s para el negocio de abajo.

FORMATO: persona a camara (HOOK que roba la atencion Y comenta el producto) -> b-roll en secuencia con voz en off -> CIERRE con la MISMA persona (remate). Flow/Veo genera clips de hasta 8s. El HOOK y el CIERRE (talking head) duran 8s CADA UNO — MINIMO 8s, es lo que tarda en decirse una frase entera del producto; NUNCA los recortes por debajo. El b-roll del medio, 4-8s por clip. Sumá lo que haga falta (la duracion total puede pasar de ${durationSec}s antes que recortar el talking head). Encuadre de plano: ${veoFocus(tipo)}

${VEO_RULES}

NEGOCIO: ${name}
MARCA FONETICA (como la lee el TTS/Veo, NUNCA escribas el nombre de marca en el dialogo, usá esto): ${phonetic}
GUION DE LA PIEZA (de aca sale el hook, el arco y la frase de cierre): ${guion}
PANTALLAS DISPONIBLES (para los planos de la app): ${screens || '(sin pantallas)'}
BRIEF (contexto del negocio): ${brief || '(sin brief)'}

${VEO_OUTPUT}
Reglas duras: español rioplatense, sin emojis, NO inventes datos/numeros/precios como reales.
IMPORTANTE: las reglas y ejemplos son DISPARADORES, no un molde a copiar. Generá una VARIANTE propia y DISTINTA (otra persona, otro encuadre dentro de las reglas, otra locacion del rubro, otra frase de venta). Si te piden regenerar, devolvé algo CLARAMENTE diferente a lo anterior.`;
}

function veoRegenClipPrompt({ name, phonetic, tipo, sequence, clipId }) {
  const clip = (sequence?.clips || []).find((c) => c.id === clipId) || {};
  const isHead = clip.role === 'hook' || clip.role === 'close';
  const dur = isHead ? Math.max(8, Number(clip.durationSec) || 8) : (Number(clip.durationSec) || 4);
  const tStart = Number(clip.tStart) || 0;
  return `Sos un director de reels 9:16 (Flow / Veo 3). Te paso una secuencia ya hecha y UN clip a REHACER.
Devolvé SOLO ese clip como JSON: { "id": "${clipId}", "role": "${clip.role || 'broll'}", "tStart": ${tStart}, "tEnd": ${tStart + dur}, "durationSec": ${dur}, "label": "...", "prompt": "..." }
${isHead ? 'Es un TALKING HEAD: dura 8s MINIMO (nunca menos) y la persona dice una frase ENTERA de ~24-30 palabras que comenta el producto. ' : ''}Mantené su ROL, pero proponé algo DISTINTO (otra idea visual) que siga encajando en la secuencia. Encuadre: ${veoFocus(tipo)}

${VEO_RULES}

NEGOCIO: ${name} · MARCA FONETICA: ${phonetic}
SECUENCIA ACTUAL (para que el nuevo clip pegue con los demas): ${JSON.stringify(sequence?.clips || [])}
CLIP A REHACER: ${clipId}
Reglas: español rioplatense, sin emojis. Devolvé SOLO el JSON del clip, nada mas.`;
}

// extrae del context los campos comunes que usan los moldes (project + piece).
function ctx(context) {
  const project = (context && context.project) || {};
  const piece = (context && context.piece) || {};
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
    durationSec: Number(piece.durationSec) || 18,
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

// Describe las pantallas del KB 1.2 (metadata: label/kind/headline) para el molde animado.
function screensText(project = {}) {
  return Array.isArray(project.screens)
    ? project.screens.map((s) => (typeof s === 'string' ? s : [s.label, s.kind && `(${s.kind})`, s.headline].filter(Boolean).join(' '))).join(' · ')
    : '';
}

// GARANTÍA MECÁNICA DE CONSISTENCIA del molde `flowpack` (helper LOCAL — functions.mjs NO puede
// importar el TS del front, así que se duplica acá la lógica de `escenasAPrompts`, anotado a
// conciencia). Para cada clip, según su Escena:
//   - si la escena tiene personajes → el prompt DEBE contener el `fisicoEn` (verbatim) de cada uno;
//   - si NO tiene personajes (b-roll/pantalla) → DEBE contener la `descripcionEn` de la locación.
// Si falla → throw con mensaje claro para reintentar (la IA resumió la hoja y rompió la consistencia).
function verificarConsistenciaFlowpack(clips, storyboard, cast) {
  const escenaPorN = new Map((storyboard || []).map((e) => [Number(e.n), e]));
  const persPorId = new Map(((cast && cast.personajes) || []).map((p) => [p.id, p]));
  const lugarEn = cast && cast.lugar && cast.lugar.descripcionEn;
  for (const clip of clips) {
    const escena = escenaPorN.get(Number(clip.escenaN));
    if (!escena) continue;   // clip sin escena de referencia: no hay contra qué validar
    const prompt = String(clip.prompt || '');
    const ids = Array.isArray(escena.personajes) ? escena.personajes : [];
    if (ids.length > 0) {
      for (const id of ids) {
        const p = persPorId.get(id);
        if (p && p.fisicoEn && !prompt.includes(p.fisicoEn)) {
          throw new Error(`la IA resumió la hoja de personaje (${id}) en el clip de la escena ${clip.escenaN} — el fisicoEn debe ir VERBATIM`);
        }
      }
    } else if (lugarEn && !prompt.includes(lugarEn)) {
      throw new Error(`el clip de la escena ${clip.escenaN} (sin personajes) no incluye la locación VERBATIM (descripcionEn)`);
    }
  }
}

const RUNNERS = {
  veo: {
    build({ context = {}, options = {}, regenerate }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const phonetic = project.phonetic || name;
      const durationSec = Number(piece.durationSec) || 17;
      const tipo = options.tipo || 'mixto';
      const guion = Array.isArray(piece.guion) && piece.guion.length ? piece.guion.join(' · ') : '(usá el brief para inferir el arco)';
      const screens = Array.isArray(project.screens) ? project.screens.map((s) => s.label || s).join(', ') : '';
      const brief = (project.brief || '').slice(0, 2500);

      if (regenerate && regenerate.clipId && regenerate.sequence) {
        return { prompt: veoRegenClipPrompt({ name, phonetic, tipo, sequence: regenerate.sequence, clipId: regenerate.clipId }), mode: 'clip' };
      }
      return { prompt: veoSequencePrompt({ name, phonetic, durationSec, tipo, guion, screens, brief }), mode: 'sequence' };
    },
    parse(text) {
      const obj = extractJson(text);
      // regenerar-clip devuelve el clip suelto; secuencia devuelve { clips, ... }
      if (obj && obj.prompt && obj.id && !obj.clips) return { clip: obj };
      if (!Array.isArray(obj.clips) || !obj.clips.length) throw new Error('la secuencia no trajo clips');
      return obj;
    },
  },

  // ── ESTRATEGIA (nivel proyecto) — del brief: posicionamiento + público + plan de piezas ──
  strategy: {
    build({ context, options = {} }) {
      const x = ctx(context);
      const perfil = options.perfil || 'campaña';
      const cuantas = perfil === 'campaña' ? '3' : '2 a 3';
      return { prompt: `Actuás como social-marketing-strategist. Del BRIEF, armá la estrategia de campaña de video para redes (Instagram/Facebook).

ENFOQUE GLOBAL (regla CENTRAL, no la rompas): cada pieza cuenta TODA la propuesta de valor del negocio en UN solo video — los puntos fuertes y cómo se conectan entre sí. NUNCA fragmentes por producto/módulo (NO una pieza de "trámites" y otra de "reclamos"): CADA pieza dice TODO, con un ÁNGULO/approach DISTINTO.
Generá ${cuantas} versiones, todas GLOBALES, con approaches distintos (ej.: problema→solución, mostrar el funcionamiento en vivo, el beneficio emocional). Si el negocio le sirve a dos lados (ej. usuario final y quien decide/compra), que el mensaje sea atractivo para ambos.
Cada pieza, por dentro: (1) engancha y explica el funcionamiento de forma dinámica, (2) refuerza con la prueba/beneficio, (3) cierra reforzando la idea de la campaña.

Devolvé SOLO JSON (sin texto ni markdown alrededor):
{
  "positioning": "1-2 frases: qué es, para quién y por qué es distinto",
  "audiences": [{ "label": "segmento", "pain": "su dolor concreto", "language": "palabras que usa ese segmento" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "el approach de ESTA versión (pocas palabras)", "format": "reel 9:16", "durationSec": 20, "creativeBrief": "qué cuenta (TODA la propuesta, global) y con qué tono/approach, 1-2 frases" }]
}
Reglas: español rioplatense, sin emojis, NO inventes datos/precios/cifras como reales. Cada pieza es GLOBAL (cuenta todo el negocio), JAMÁS un solo módulo.
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
      if (regenerate && regenerate.index != null) {
        const cur = (regenerate.blocks || [])[regenerate.index] || {};
        return { mode: 'item', prompt: `Actuás como promo-director. Rehacé SOLO ESTE bloque del guion (tono ${tono}), con una propuesta DISTINTA y mejor. Mantené su rol.
Devolvé SOLO el JSON del bloque: { "role": "${cur.role || 'hook'}", "narration": "lo que se DICE", "visual": "lo que se VE", "durSec": <segundos estimados a ~2.7 palabras/seg> }
NEGOCIO: ${x.name} · BLOQUE ACTUAL (hacelo distinto): ${JSON.stringify(cur)}
Rioplatense, sin emojis, no inventes datos.` };
      }
      return { mode: 'set', prompt: `Actuás como promo-director. Escribí el guion de un comercial de ${dur}s para un reel 9:16, tono ${tono}${x.angulo ? ` (ángulo: "${x.angulo}")` : ''}.
${concepto ? `CONCEPTO ELEGIDO (respetalo, es la dirección creativa del comercial): ${concepto}\n` : ''}ENFOQUE GLOBAL (clave): contá TODA la propuesta del negocio en ESTE video — no un solo módulo/producto. Enganchá explicando el funcionamiento, CONECTÁ los puntos fuertes en un hilo, reforzá con la prueba y cerrá con el CTA.
Estructura NARRATIVA por bloques con estos roles EXACTOS: hook (primeros 2s, roba la atención, sin logo ni "somos X") -> desarrollo (cómo funciona / la propuesta en vivo) -> gag (el REMATE: el momento más fuerte — humor si el concepto es humorístico, si no la prueba/beneficio contundente) -> cta (llamado a la acción claro). El gag va SIEMPRE ANTES del cta.
Narración calibrada para TTS a ~2.7 palabras/seg (que entre en ${dur}s); estimá el durSec de cada bloque.
Devolvé SOLO JSON: { "blocks": [{ "role": "hook|desarrollo|gag|cta", "narration": "lo que se DICE (voz)", "visual": "lo que se VE en pantalla", "durSec": <segundos> }], "music": { "mood": "el mood de la música en 1 frase" } }
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

  // ── MOCKUPS (nivel pieza) — planos a partir de las pantallas reales del producto ──
  mockup: {
    build({ context, options = {}, regenerate }) {
      const x = ctx(context);
      if (regenerate && regenerate.index != null) {
        const cur = (regenerate.slides || [])[regenerate.index] || {};
        return { mode: 'item', prompt: `Actuás como mockup-designer. Rehacé SOLO ESTE slide con una propuesta DISTINTA (otro encuadre, highlight o copy), para un reel 9:16.
Devolvé SOLO el JSON del slide: { "screen": "qué pantalla", "framing": "device|full|detalle", "highlight": "qué se resalta", "copy": "<=5 palabras", "motion": "la micro-animación" }
PANTALLAS DISPONIBLES: ${x.screens}
SLIDE ACTUAL (hacelo claramente distinto): ${JSON.stringify(cur)}
Español rioplatense, sin emojis.` };
      }
      return { mode: 'set', prompt: `Actuás como mockup-designer. Armá los PLANOS (slides) de la pieza usando las pantallas reales del producto, para un reel 9:16.
Cada slide: una pantalla, un encuadre, UN highlight (no sobrecargar), copy corto y una micro-animación.
Encuadre pedido por defecto: ${options.encuadre || 'device'} (device = en el celular · full = pantalla completa · detalle = zoom a una parte).${options.pantalla ? ` Priorizá la pantalla: ${options.pantalla}.` : ''}
Devolvé SOLO JSON: { "slides": [{ "screen": "qué pantalla", "framing": "device|full|detalle", "highlight": "qué se resalta", "copy": "<=5 palabras", "motion": "la micro-animación" }] }
PANTALLAS DISPONIBLES: ${x.screens || '(sin pantallas en el KB: proponé pantallas recreadas y marcalas [demo])'}
GUION DE LA PIEZA: ${x.guion || x.brief}
Español rioplatense, sin emojis.` };
    },
    parse(text) {
      const o = extractJson(text);
      if (o && (o.screen || o.framing || o.copy) && !Array.isArray(o.slides)) return { item: o };
      if (!Array.isArray(o.slides)) throw new Error('no trajo slides');
      return o;
    },
  },

  // ── PUBLICACIÓN (nivel pieza) — el copy del posteo para la red elegida ──
  publish: {
    build({ context, options = {} }) {
      const x = ctx(context);
      const red = options.red || 'instagram';
      const specs = red === 'facebook' ? 'Facebook: caption puede ser un poco más largo, menos hashtags (2-3).'
        : red === 'ambas' ? 'Para Instagram Reels y Facebook: caption que sirva a las dos, 3-6 hashtags.'
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
PACK MASTER: ${piece.packFlow?.master || '(sin pack)'}`
        : `GUION DE LA PIEZA: ${x.guion || x.brief}`;
      const extra = holistico
        ? ` Para el comercial entero, pesá MUY fuerte estos criterios profesionales DENTRO de los ejes: CONTINUIDAD (el fisicoEn del cast va VERBATIM en todos los prompts del pack; la continuidad entre escenas cierra: ropa/luz/lugar), ARCO (hook ≤2s de gancho, gag/remate ANTES del CTA, cuenta TODA la propuesta — regla GLOBAL, jamás un solo módulo), TÉCNICA (talking heads ≥8s, diálogos de ~24-30 palabras, marca fonética en TODO lo hablado).`
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

  // ── CONCEPTO (nivel pieza — 1 vez por comercial) — 2-3 conceptos para el ángulo de la pieza ──
  concept: {
    build({ context = {}, options = {} }) {
      const project = context.project || {};
      const piece = context.piece || {};
      const name = project.name || 'el producto';
      const brief = (project.brief || '').slice(0, 2500);
      const angulo = piece.angulo || piece.angle || '';
      const creativeBrief = piece.creativeBrief || '';
      const perfil = options.perfil || 'campaña';
      return { prompt: `Sos director creativo de publicidad. Del BRIEF, proponé 2-3 CONCEPTOS de comercial de ~20-30s para redes que desarrollen ESTE approach: ${angulo || '(inferí un ángulo del brief)'} — ${creativeBrief || '(sin brief creativo: usá el brief del negocio)'}.
Cada concepto: la IDEA (una situación/gancho concreto — puede ser humor, problema-solución, día-en-la-vida), TONO, ESTÉTICA (dirección visual: luz, paleta, estilo de fotografía, coherente con la marca), REFERENCIA (a qué tipo de anuncio conocido se parece), POR QUÉ FUNCIONA (1 frase).
ENFOQUE GLOBAL (obligatorio): cada concepto cuenta TODA la propuesta, JAMÁS un solo módulo.
Devolvé SOLO JSON (sin texto ni markdown): { "conceptos": [{ "id": "c1", "idea": "...", "tono": "...", "estetica": "...", "referencia": "...", "porQueFunciona": "..." }] }
Reglas: español rioplatense, sin emojis, NO inventes datos/precios como reales.
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
      return { prompt: `Sos casting director + location scout de un comercial 9:16. Del CONCEPTO y el GUION, definí los PERSONAJES (1-2, los que el guion necesita) y la LOCACIÓN.
Por personaje:
- "fisicoEn" = descripción física EXACTA en INGLÉS para pegar VERBATIM en prompts de video (edad, pelo con corte y color, rasgos de la cara, tono de piel, contextura, vestuario completo con colores). Reglas de casting: "a striking, conventionally beautiful and charismatic person in their late 20s to early 30s, polished and camera-ready, with defined attractive features and a confident, magnetic presence", vestido/a SEGÚN el rubro del negocio (nunca fuera de contexto). Sé ESPECÍFICO: nada de "a woman" genérica — la MISMA descripción se pega en TODOS los clips.
- "fisicoEs" = resumen en español para la UI. Sumá "nombre", "rol" (su papel en el comercial), "vestuario", "personalidad".
La LOCACIÓN: "descripcionEn" igual de exacta en inglés (ambiente, mobiliario, luz, hora del día), más "nombre" y "luz".
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
      if (tipo === 'animado') {
        return { prompt: `Sos director de un reel ANIMADO 9:16 (se recrean las PANTALLAS del producto, sin personas). Convertí el guion en un STORYBOARD de escenas numeradas, una por PANTALLA.
Por escena: n (número), rol (hook|desarrollo|gag|cta), durSec (3-5s), screen (label de la pantalla del KB), accion (un título corto de <=8 palabras que vende ese momento), dialogo "" (vacío), continuidad (la palabra a RESALTAR del título). Dejá plano/angulo vacíos y personajes [].
La suma de durSec ≈ ${durationSec}s.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 4, "screen": "...", "plano": "", "angulo": "", "personajes": [], "accion": "título corto", "dialogo": "", "continuidad": "palabra a resaltar" }] }
Reglas: español rioplatense, sin emojis, no inventes datos. Marca fonética (nunca el nombre escrito): ${phonetic}.
NEGOCIO: ${name}
PANTALLAS DEL KB: ${screensText(project) || '(sin pantallas: proponé pantallas recreadas y marcalas [demo])'}
GUION: ${guion || '(usá el brief del negocio)'}` };
      }
      const cast = piece.cast ? JSON.stringify(piece.cast) : '(sin cast todavía: usá ids p1/p2 y descripciones genéricas)';
      return { prompt: `Sos director de un comercial FILMADO 9:16. Convertí el guion en un STORYBOARD de escenas numeradas.
Por escena: n, rol (hook|desarrollo|gag|cta), durSec (talking head = 8 MÍNIMO, jamás menos; b-roll 4-8), plano (medium shot waist-up para talking heads — NUNCA wide lejano), angulo (eye-level, etc.), personajes (ids del CAST — USÁ SIEMPRE los mismos), accion, dialogo (rioplatense, frase ENTERA de ~24-30 palabras si es talking head, que COMENTA el producto; marca SIEMPRE fonética: ${phonetic}), continuidad (qué debe matchear con la escena anterior: ropa, luz, posición).
La suma de durSec ≈ ${durationSec}s (puede pasarse antes que recortar un talking head). El gag/remate va ANTES del CTA.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "..." }] }
Reglas: sin emojis, no inventes datos/precios como reales.
NEGOCIO: ${name}
CAST: ${cast}
GUION: ${guion || '(usá el brief del negocio)'}` };
    },
    parse(text) {
      const o = extractJson(text);
      if (!Array.isArray(o.escenas) || !o.escenas.length) throw new Error('el molde storyboard no trajo escenas');
      const ROLES = new Set(['hook', 'desarrollo', 'gag', 'cta']);
      o.escenas = o.escenas.map((e) => {
        if (!ROLES.has(e.rol)) throw new Error(`rol de escena inválido: ${e.rol}`);
        const rawDur = Number(e.durSec) || 0;
        // talking head (tiene diálogo) < 8s → corregir a 8 (regla dura), no throw
        const durSec = (e.dialogo && String(e.dialogo).trim() && rawDur < 8) ? 8 : rawDur;
        return { ...e, durSec };
      });
      return o;
    },
  },

  // ── FLOWPACK (nivel pieza) — prompt maestro + prompt por clip para Google Flow (Veo 3) ──
  // REEMPLAZA a `veo`: mismos principios (VEO_RULES), pero con consistencia GARANTIZADA (cast verbatim).
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
      if (regenerate && regenerate.escenaN != null) {
        const escena = storyboard.find((e) => Number(e.n) === Number(regenerate.escenaN)) || {};
        return { mode: 'clip', prompt: `Sos el prompt-writer de Google Flow (Veo 3). Rehacé SOLO el prompt de la ESCENA ${regenerate.escenaN} de un comercial 9:16.
Variá la idea visual/el encuadre dentro de las reglas, pero JAMÁS el personaje ni la locación (van con la MISMA descripción exacta, VERBATIM).
${VEO_RULES}
CAST (personajes y locación — van VERBATIM en el prompt): ${castJson}
ESCENA A REHACER: ${JSON.stringify(escena)}
MARCA FONÉTICA: ${phonetic}
Devolvé SOLO JSON: { "clip": { "escenaN": ${regenerate.escenaN}, "prompt": "el prompt COMPLETO en inglés, con el diálogo en español rioplatense entre comillas y la marca fonética" } }` };
      }
      return { mode: 'pack', prompt: `Sos el prompt-writer de Google Flow (Veo 3). Armá el PACK de generación de un comercial 9:16 desde el STORYBOARD y el CAST.
(1) MASTER: un bloque de estilo global en INGLÉS que consolida: reglas de realismo ("photorealistic, not over-rendered and not CGI-perfect, natural light, clean and well-lit, cinematic vertical 9:16") + los PERSONAJES VERBATIM (el "fisicoEn" TAL CUAL, sin resumir) + la LOCACIÓN VERBATIM (el "descripcionEn" tal cual).
(2) Por cada ESCENA del storyboard: un prompt AUTOCONTENIDO en inglés. CADA prompt de clip EMPIEZA copiando el bloque MASTER COMPLETO TAL CUAL (con las descripciones de personajes y locación palabra por palabra, sin resumir NI acortar NI parafrasear), y RECIÉN DESPUÉS agrega la escena (plano, ángulo, acción, diálogo en español rioplatense entre comillas con la marca fonética "${phonetic}", duración). Repetir el MASTER entero al inicio de cada clip es OBLIGATORIO y correcto — así cada clip es autocontenido y la persona/locación quedan idénticas en TODOS los clips.
Talking heads: medium shot waist-up, camera holds steady or subtle slow push-in, NUNCA pull back/zoom out, la persona habla TODO el clip (sin silencio de relleno). B-roll: no spoken dialogue, ambient sound only, one single continuous take. Pantallas de app: screen not clearly legible. Sin texto en pantalla (el overlay va en edición).
REGLA DE CONSISTENCIA (dura): en CADA prompt el "fisicoEn" de cada personaje de la escena y el "descripcionEn" de la locación van copiados EXACTOS, palabra por palabra — NUNCA los resumas, acortes ni varíes. Un clip que resuma una hoja de personaje se rechaza.
${VEO_RULES}
Devolvé SOLO JSON: { "master": "...", "clips": [{ "escenaN": 1, "prompt": "..." }] }
STORYBOARD: ${JSON.stringify(storyboard)}
CAST: ${castJson}
NEGOCIO: ${name}${brandTxt}` };
    },
    // parse recibe el `body` (contrato extendido) para acceder al storyboard/cast y GARANTIZAR consistencia.
    parse(text, body) {
      const o = extractJson(text);
      // regen: clip suelto — PASA POR LA GARANTÍA (antes se retornaba temprano y bypaseaba la
      // consistencia: un prompt regenerado que resumía la hoja de personaje entraba sin rechazo).
      if (o && o.clip && o.clip.prompt) {
        const piece = (body && body.context && body.context.piece) || {};
        const clip = { escenaN: Number(o.clip.escenaN), prompt: o.clip.prompt };
        verificarConsistenciaFlowpack([clip], Array.isArray(piece.storyboard) ? piece.storyboard : [], piece.cast || null);
        return { clip };
      }
      if (!o.master || !Array.isArray(o.clips) || !o.clips.length) throw new Error('el molde flowpack no trajo master/clips');
      const piece = (body && body.context && body.context.piece) || {};
      const storyboard = Array.isArray(piece.storyboard) ? piece.storyboard : [];
      const cast = piece.cast || null;
      verificarConsistenciaFlowpack(o.clips, storyboard, cast);   // throw si la IA resumió una hoja
      // el estado inicial lo inyecta el parse (la IA no lo devuelve)
      o.clips = o.clips.map((c) => ({ escenaN: Number(c.escenaN), prompt: c.prompt, estado: 'pendiente' }));
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
