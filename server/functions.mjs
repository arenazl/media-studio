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

// Describe las pantallas del KB 1.2 (metadata: label/kind/headline) para el molde animado.
function screensText(project = {}) {
  return Array.isArray(project.screens)
    ? project.screens.map((s) => (typeof s === 'string' ? s : [s.label, s.kind && `(${s.kind})`, s.headline].filter(Boolean).join(' '))).join(' · ')
    : '';
}

const RUNNERS = {

  // ── ESTRATEGIA (nivel proyecto) — del brief: posicionamiento + público + plan de piezas ──
  strategy: {
    build({ context, options = {} }) {
      const x = ctx(context);
      const perfil = options.perfil || 'campaña';
      const cuantas = perfil === 'campaña' ? '3' : '2 a 3';
      // WO-2/D3: si el proyecto tiene formato, el ejemplo del shape lo refleja; sin formato queda
      // "reel 9:16"/20 (byte-idéntico). strategy es nivel proyecto → lee project.formato, no piece.
      const pf = (context && context.project && context.project.formato) || null;
      const fmtEjemplo = pf ? `${pf.aspecto} para ${pf.plataforma}` : 'reel 9:16';
      const durEjemplo = pf && Number(pf.durDefault) ? Number(pf.durDefault) : 20;
      return { prompt: `Actuás como social-marketing-strategist. Del BRIEF, armá la estrategia de campaña de video para redes (Instagram/Facebook).

ENFOQUE GLOBAL (regla CENTRAL, no la rompas): cada pieza cuenta TODA la propuesta de valor del negocio en UN solo video — los puntos fuertes y cómo se conectan entre sí. NUNCA fragmentes por producto/módulo (NO una pieza de "trámites" y otra de "reclamos"): CADA pieza dice TODO, con un ÁNGULO/approach DISTINTO.
Generá ${cuantas} versiones, todas GLOBALES, con approaches distintos (ej.: problema→solución, mostrar el funcionamiento en vivo, el beneficio emocional). Si el negocio le sirve a dos lados (ej. usuario final y quien decide/compra), que el mensaje sea atractivo para ambos.
Cada pieza, por dentro: (1) engancha y explica el funcionamiento de forma dinámica, (2) refuerza con la prueba/beneficio, (3) cierra reforzando la idea de la campaña.

Devolvé SOLO JSON (sin texto ni markdown alrededor):
{
  "positioning": "1-2 frases: qué es, para quién y por qué es distinto",
  "audiences": [{ "label": "segmento", "pain": "su dolor concreto", "language": "palabras que usa ese segmento" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "el approach de ESTA versión (pocas palabras)", "format": "${fmtEjemplo}", "durationSec": ${durEjemplo}, "creativeBrief": "qué cuenta (TODA la propuesta, global) y con qué tono/approach, 1-2 frases" }]
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
Devolvé SOLO el JSON del bloque: { "role": "${cur.role || 'hook'}", "narration": "lo que se DICE", "visual": "lo que se VE", "durSec": <segundos estimados a ~2.7 palabras/seg> }
NEGOCIO: ${x.name} · BLOQUE ACTUAL (hacelo distinto): ${JSON.stringify(cur)}
Rioplatense, sin emojis, no inventes datos.` };
      }
      return { mode: 'set', prompt: `Actuás como promo-director. Escribí el guion de un comercial de ${dur}s para ${piezaDesc}, tono ${tono}${x.angulo ? ` (ángulo: "${x.angulo}")` : ''}.
${concepto ? `CONCEPTO ELEGIDO (respetalo, es la dirección creativa del comercial): ${concepto}\n` : ''}${bloqueTecnica}ENFOQUE GLOBAL (clave): contá TODA la propuesta del negocio en ESTE video — no un solo módulo/producto. Enganchá explicando el funcionamiento, CONECTÁ los puntos fuertes en un hilo, reforzá con la prueba y cerrá con el CTA.
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
      return { prompt: `Sos director creativo de publicidad. Del BRIEF, proponé 2-3 CONCEPTOS de comercial de ~20-30s para redes que desarrollen ESTE approach: ${angulo || '(inferí un ángulo del brief)'} — ${creativeBrief || '(sin brief creativo: usá el brief del negocio)'}.
${bloqueTecnica}Cada concepto: la IDEA (una situación/gancho concreto — puede ser humor, problema-solución, día-en-la-vida), TONO, ESTÉTICA (dirección visual: luz, paleta, estilo de fotografía, coherente con la marca), REFERENCIA (a qué tipo de anuncio conocido se parece), POR QUÉ FUNCIONA (1 frase).
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
      // WO-2/D4: el aspecto sale del formato de la pieza (mismo patrón que storyboard). Con 9:16
      // hardcodeado, un Spot 16:9 casteaba encuadres verticales. Sin formato → '9:16' byte-idéntico.
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      return { prompt: `Sos casting director + location scout de un comercial ${asp}. Del CONCEPTO y el GUION, definí los PERSONAJES (1-2, los que el guion necesita) y la LOCACIÓN.
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
      // WO-2/D4: aspecto del formato; sin formato queda '9:16' (byte-idéntico al hardcodeo anterior).
      const asp = piece.formato ? (piece.formato.aspecto || '9:16') : '9:16';
      if (tipo === 'animado') {
        return { prompt: `Sos director de un reel ANIMADO ${asp} (se recrean las PANTALLAS del producto, sin personas). Convertí el guion en un STORYBOARD de escenas numeradas, una por PANTALLA.
Por escena: n (número), rol (hook|desarrollo|gag|cta), durSec (3-5s), screen (label de la pantalla del KB), accion (un título corto de <=8 palabras que vende ese momento), dialogo "" (vacío), continuidad (la palabra a RESALTAR del título). Dejá plano/angulo vacíos y personajes [].
La suma de durSec ≈ ${durationSec}s.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 4, "screen": "...", "plano": "", "angulo": "", "personajes": [], "accion": "título corto", "dialogo": "", "continuidad": "palabra a resaltar" }] }
Reglas: español rioplatense, sin emojis, no inventes datos. Marca fonética (nunca el nombre escrito): ${phonetic}.
NEGOCIO: ${name}
PANTALLAS DEL KB: ${screensText(project) || '(sin pantallas: proponé pantallas recreadas y marcalas [demo])'}
GUION: ${guion || '(usá el brief del negocio)'}` };
      }
      const cast = piece.cast ? JSON.stringify(piece.cast) : '(sin cast todavía: usá ids p1/p2 y descripciones genéricas)';
      return { prompt: `Sos director de un comercial FILMADO ${asp}. Convertí el guion en un STORYBOARD de escenas numeradas.
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

(1) "estilo": UN bloque corto en INGLÉS con el estilo global — "photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic, not over-rendered and not CGI-perfect". SOLO estética/formato: SIN personajes y SIN acción.

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
