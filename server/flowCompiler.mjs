// Compilador del Pack Flow (reingeniería 2026-10-07, Fase 5 / §4.6). Antes el pack entero lo
// escribía Opus: 47 a 52 s y USD 0,12 a 0,17 por pieza para TRADUCIR un storyboard a inglés con
// reglas fijas. Acá el pack sale de código: estilo global, un retrato por personaje y un prompt por
// escena, con la MISMA estructura que pedía el prompt viejo. La única parte que necesita un modelo
// es traducir al inglés la `accion` de cada escena (una llamada chica, sin pensamiento), y si esa
// llamada falla el pack igual sale, con la acción en español y el hueco MARCADO (nunca en silencio).
//
// Las reglas técnicas de Veo viven acá (VEO_REGLAS_EN) y en ningún otro lado (doc §4.6: "las reglas
// técnicas de Veo viven en UN módulo versionado"). `VEO_RULES` de functions.mjs queda para los
// moldes que todavía piden texto a la IA (videoprompt, regen de una escena).

export const FLOW_COMPILER_VERSION = 'flowpack/3.2-compilado';
// 3.2 (2026-10-12, estudio curado): se fue "si se ve una pantalla, que no sea legible", que chocaba con "toda pantalla de
// espaldas a cámara" en el mismo pedido, y el chat visible del gancho (una regla mía del 11/10). Queda una sola regla: la
// pantalla nunca a cámara; lo que muestra lo cuenta el inserto con la captura real.
// 3.0 (2026-10-11, Lucas: "si le pedís lente, ángulo y luz pero le decís 'poné cara de boludo y mirá la cámara', no cambia
// el contenido; eso es culpa del prompt"): el pedido arranca por el CONTENIDO — quién, en SU lugar, qué hace en los 8
// segundos y cómo dice la frase — con la acción que escribe el storyboard en inglés (accionEn). Se fueron la receta fija
// de cara a cámara para toda escena con frase, el "sigue hablando todo el clip" (lo hacía improvisar palabras), el lugar
// cortado a la primera oración (la electricista caía en "la casa con ventana" de la vecina) y la escena que perdía a su
// persona y su frase porque la había vaciado el normalizador.

// El aspecto viene del FORMATO de la pieza (9:16 por defecto; 16:9 para YouTube/TV). Es lo único
// del estilo que cambia por pieza.
export const estiloPara = (aspecto = '9:16') => `Photorealistic, professional cinematic ${aspecto === '16:9' ? 'horizontal 16:9' : `vertical ${aspecto || '9:16'}`}, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.`;
export const ESTILO_GLOBAL = estiloPara('9:16');

export const VEO_REGLAS_EN = {
  logoCierre: "The uploaded brand logo 'logo.png' from assets is displayed clearly and prominently centered in the upper third of the frame.",
  // 2026-10-11: nombrar "logo" hacía que Veo dibujara uno (los clips de RepareHoy traen un "CR" arriba al centro): sólo aire arriba
  logoLibre: 'Leave some empty headroom at the top of the frame; nothing drawn or written there.',
  talkingHead: 'Medium shot, waist-up framing, the person fills a good portion of the frame with strong, dominant presence. The camera holds steady or does a very subtle slow push-in while speaking.',
  habla: 'speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words:',
  sinSilencio: 'The person keeps talking for the whole clip, warm, confident and charming tone, realistic expressive face.',
  // 3.0: la frase va dentro de la escena (no "a cámara" por defecto: el storyboard dice hacia dónde) y no se rellena
  dice: 'starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else:',
  despues: 'After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound.',
  sinSubtitulos: 'No subtitles, no captions.',
  broll: 'No spoken dialogue, ambient sound only. One single continuous take, same background, no cut.',
  pantalla: 'If an app screen is visible, the screen is not clearly legible.',
  sinInterfaz: 'Never show or recreate an app interface: any phone or computer screen faces away from the camera.',
  // 3.2: el gancho de "nadie me contesta" necesita verse; un chat genérico (no la app de la marca) se puede mostrar sin texto legible
  sinInterfazSalvoChat: 'Never recreate the brand app interface. A generic messaging chat may be visible on the phone (sent bubbles with no replies) but its text is never legible.',
  sinTexto: 'No on-screen text.',
};

const ENTREGA_POR_ROL = {
  hook: 'Energetic, hooking delivery that grabs attention from the first word.',
  desarrollo: 'Warm and assured delivery, explaining with confidence.',
  giro: 'Clear, assured delivery: this is the moment the benefit becomes visible.',
  gag: 'Playful, sharp delivery that lands the punchline.',   // piezas viejas o tratamiento humor
  cta: 'Euphoric, inviting closing delivery.',
};

const S = (v) => String(v ?? '').trim();
// Primera oración, con tope de palabras: si hay que cortar, se corta en la última coma ANTES del
// tope (nunca a mitad de frase: "worn linoleum, a" era lo que salía).
const primeraOracion = (t, maxPalabras = 22) => {
  const s = S(t).split(/(?<=[.!?])\s+/)[0] || '';
  const w = s.split(/\s+/);
  if (w.length <= maxPalabras) return s.replace(/[.,;:]+$/, '');
  const corte = w.slice(0, maxPalabras).join(' ');
  const coma = corte.lastIndexOf(',');
  return (coma > corte.length / 2 ? corte.slice(0, coma) : corte).replace(/[.,;:]+$/, '').replace(/\s+(a|an|the|with|and|of)$/i, '');
};
const sinArgentine = (t) => S(t).replace(/^(an?\s+|the\s+)?argentin(e|ian)\s+/i, '').replace(/[.;:,\s]+$/, '');
const pronombre = (p) => {
  const t = `${S(p?.fisicoEn)} ${S(p?.fisicoEs)} ${S(p?.rol)}`.toLowerCase();
  if (/\b(woman|female|girl|lady|mujer|chica|señora)\b/.test(t)) return 'She';
  if (/\b(man|male|guy|boy|hombre|chico|señor)\b/.test(t)) return 'He';
  return 'They';
};
const mencionaPantalla = (t) => /\b(pantalla|celular|tel[eé]fono|app|screen|phone|notebook|laptop|monitor|tablet)\b/i.test(S(t));

// Descripción CORTA del personaje para la escena: nombre + "Argentine" + lo esencial del fisicoEn.
// NUNCA el fisicoEn largo (la imagen de referencia fija la cara; repetirlo rompía Flow).
export function personajeCorto(p) {
  const nombre = S(p?.nombre) || S(p?.id) || 'the person';
  const base = sinArgentine(primeraOracion(p?.fisicoEn, 18)).replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase());
  return `${nombre}, an Argentine ${base || 'adult'}`.replace(/\s+/g, ' ').trim();
}
// 3.1: el vestuario viaja en cada escena (Flow genera cada clip por separado: sin esto cambiaba la ropa entre tomas)
const vestuarioEn = (p) => {
  if (S(p?.vestuarioEn)) return `wearing ${S(p.vestuarioEn).replace(/^wearing\s+/i, '').replace(/[.,;\s]+$/, '')}`;
  const m = /\b(wearing [^.;]+)/i.exec(S(p?.fisicoEn));
  return m ? m[1].replace(/[.,;\s]+$/, '') : '';
};

export function promptImagen(p, lugar) {
  const fisico = sinArgentine(S(p?.fisicoEn) || S(p?.fisicoEs) || 'adult');
  const fondo = lugar?.descripcionEn ? `, neutral background with a hint of ${primeraOracion(lugar.descripcionEn, 14).toLowerCase()}` : ', neutral background';
  return `Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine ${fisico}, standing and looking at the camera, natural pose${fondo}. A still photo, no action, no dialogue.`;
}

// El encuadre del storyboard en palabras del generador. Sin plano, uno medio corto (no el plano medio fijo de antes).
const PLANOS_EN = {
  'close-up': 'Close-up on the face and hands', 'medium close-up': 'Medium close-up, chest up', 'medium shot': 'Medium shot, waist up',
  'over-the-shoulder': 'Over-the-shoulder shot', 'low angle': 'Low-angle shot', 'high angle': 'High-angle shot',
  'handheld follow': 'Handheld camera following the movement', 'wide shot': 'Wide shot that shows the whole place',
};
function encuadre(e) {
  const plano = S(e?.plano).toLowerCase();
  const base = PLANOS_EN[plano] || (plano ? S(e.plano).replace(/^./, (c) => c.toUpperCase()) : 'Medium close-up');
  // el ángulo del storyboard viene en castellano y mezclaba idiomas en el pedido: el plano alcanza
  return `${base}, natural handheld feel, shallow depth of field.`;
}
// El lugar de una persona: el suyo (lugarEn del cast), entero; sin eso, la locación general entera (antes se cortaba en
// la primera oración y "dos lugares conectados" quedaba en el primero).
const hasta = (t, maxPalabras) => {
  const w = S(t).split(/\s+/).filter(Boolean);
  return (w.length <= maxPalabras ? S(t) : w.slice(0, maxPalabras).join(' ')).replace(/[.;:,\s]+$/, '');
};
function lugarDe(p, lugar) {
  if (S(p?.lugarEn)) return hasta(p.lugarEn, 45);
  return lugar?.descripcionEn ? hasta(lugar.descripcionEn, 45) : 'a real-world location that matches the business';
}

// Prompt de UNA escena. `accionEn` es la acción ya traducida (o null → se usa la española y se marca). Con `e.accionEn`
// (storyboard/3.0) se usa esa: la escribe el mismo modelo que pensó la escena, con el género y el lugar correctos.
export function promptEscena(e, { cast, lugar, phonetic, accionEn, aspecto = '9:16' }) {
  const rol = S(e?.rol) || 'desarrollo';
  // quien está en cuadro: sus personajes, o los que el modelo había puesto si un paso intermedio los vació
  const ids = Array.isArray(e?.personajes) && e.personajes.length ? e.personajes : (Array.isArray(e?.personajesModelo) ? e.personajesModelo : []);
  const personas = ids.map((id) => (cast?.personajes || []).find((p) => p.id === id)).filter(Boolean);
  const dialogo = S(e?.dialogo);
  const accion = S(e?.accionEn) || (accionEn != null ? S(accionEn) : S(e?.accion));
  const p = personas[0];
  const L = [estiloPara(aspecto)];
  if (p) {
    const otros = personas.length > 1 ? ` and ${personas.slice(1).map(personajeCorto).join(' and ')}` : '';
    const ropa = vestuarioEn(p);
    // con la acción del storyboard (accionEn) el lugar y la actuación ya vienen ahí, escritos para ESTA escena: el lugar del
    // cast se repetía con otro estado (la cocina "sin luz" en la escena donde volvía la luz) y la entrega fija por rol
    // contradecía la actuación ("enérgica" sobre "cansada")
    const conAccion = !!S(e?.accionEn);
    L.push(`${personajeCorto(p)}${ropa && !/wearing/i.test(personajeCorto(p)) ? `, ${ropa}` : ''}${otros}${conAccion ? '.' : `, in ${lugarDe(p, lugar)}.`}`);
    if (accion) L.push(/[.!?]$/.test(accion) ? accion : `${accion}.`);
    if (dialogo) {
      L.push(`${pronombre(p)} ${VEO_REGLAS_EN.dice} '${dialogo}'`);
      L.push(`${conAccion ? '' : `${ENTREGA_POR_ROL[rol] || ENTREGA_POR_ROL.desarrollo} `}Realistic, expressive face, nothing staged. ${VEO_REGLAS_EN.despues}`);
    } else {
      L.push('No dialogue: ambient sound only.');
    }
    L.push(encuadre(e));
  } else {
    L.push(`Location: ${lugar?.descripcionEn ? hasta(lugar.descripcionEn, 45) : 'a real-world location that matches the business'}.`);
    if (accion) L.push(/[.!?]$/.test(accion) ? accion : `${accion}.`);
    L.push(VEO_REGLAS_EN.broll);
  }
  // 2026-10-10: nunca se le pide a Veo que dibuje el logo ("logo.png" lo escribía literal en la imagen, Lucas lo pagó en
  // créditos). El logo y la placa de cierre los pone el montaje; a Flow sólo se le pide dejar libre el tercio superior.
  L.push(VEO_REGLAS_EN.logoLibre);
  L.push(VEO_REGLAS_EN.sinInterfaz);
  L.push(`${VEO_REGLAS_EN.sinTexto} ${VEO_REGLAS_EN.sinSubtitulos}`);
  return L.join(' ').replace(/\.\./g, '.').replace(/\s+/g, ' ').trim();
}

// La PRESENTADORA del cierre (2026-10-13, Lucas: "metela junto con los demás clips; vos tenés que preparar el prompt"): una
// escena más del pack que dice la frase de cierre a cámara. Es el personaje "Presentadora" del proyecto de Flow (la modelo
// que Lucas carga ahí con ese nombre); si no existe, Flow la crea desde este retrato. El montaje la usa en el cierre
// "Presentadora".
export const ESCENA_PRESENTADORA = 90;
export const PRESENTADORA = { id: 'presentadora', nombre: 'Presentadora', fisicoEn: 'a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face', vestuarioEn: 'smart casual clothes' };
export function promptPresentadora(frase, aspecto = '9:16', nombre = PRESENTADORA.nombre) {
  return [
    estiloPara(aspecto),
    `${nombre}, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background.`,
    `She looks straight into the camera, smiles and ${VEO_REGLAS_EN.dice} '${S(frase)}'`,
    `Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. ${VEO_REGLAS_EN.despues}`,
    'Medium close-up, chest up, eye level, static camera with a very subtle slow push-in.',
    VEO_REGLAS_EN.logoLibre, VEO_REGLAS_EN.sinInterfaz, `${VEO_REGLAS_EN.sinTexto} ${VEO_REGLAS_EN.sinSubtitulos}`,
  ].join(' ').replace(/\s+/g, ' ').trim();
}

// El pack entero, sin IA. `traducciones` = { [n]: accionEn } (lo que devolvió el paso de traducción,
// puede venir vacío). Devuelve también `huecos`: escenas cuya acción quedó en español.
export function compileFlowPack({ storyboard = [], cast, phonetic = '', traducciones = {}, aspecto = '9:16', presentadora = null } = {}) {
  const lugar = cast?.lugar;
  const personajes = (cast?.personajes || []).map((p) => ({ id: p.id, nombre: S(p.nombre) || p.id, promptImagen: promptImagen(p, lugar) }));
  const huecos = [];
  // la escena cta SIN persona es la placa de cierre: la dibuja el motor de montaje con los datos de marca, no se filma en Flow
  // 2026-10-11 (curación 02): un inserto de pantalla tampoco va a Flow; lo arma el motor con el mockup real de la app
  // 3.0: lo que decide es si hay alguien en cuadro. Una persona que dice el cierre, o que mira su teléfono en una escena a la
  // que el modelo le puso un nombre de pantalla, se filma igual (así se perdió el "ya tenía los presupuestos" de RepareHoy).
  const hayPersona = (e) => (Array.isArray(e.personajes) && e.personajes.length > 0) || (Array.isArray(e.personajesModelo) && e.personajesModelo.length > 0 && !e.dialogoRepetido);
  const escenas = (Array.isArray(storyboard) ? storyboard : []).filter((e) => hayPersona(e) || (S(e.rol) !== 'cta' && !S(e.pantalla))).map((e) => {
    const n = Number(e.n);
    const accionEn = traducciones[n] != null && S(traducciones[n]) ? S(traducciones[n]) : null;
    if (accionEn == null && S(e.accion) && !S(e.accionEn)) huecos.push(n);
    return { escenaN: n, rol: S(e.rol) || 'desarrollo', prompt: promptEscena(e, { cast, lugar, phonetic, accionEn, aspecto }), estado: 'pendiente' };
  });
  // la presentadora del cierre, al final del pack (con su frase, que también se verifica al bajar el clip)
  if (S(presentadora?.frase)) {
    // con la modelo de Lucas (server/presentadora.json): su nombre en Flow y su proyecto, donde se genera esta escena;
    // nunca se crea otra en su lugar (noCrear)
    const nombre = S(presentadora.nombre) || PRESENTADORA.nombre;
    const suyo = S(presentadora.flowProjectUrl) ? { flowProjectUrl: S(presentadora.flowProjectUrl) } : {};
    personajes.push({ id: PRESENTADORA.id, nombre, promptImagen: promptImagen(PRESENTADORA, null), ...(suyo.flowProjectUrl ? { noCrear: true, ...suyo } : {}) });
    escenas.push({ escenaN: ESCENA_PRESENTADORA, rol: 'cierre', prompt: promptPresentadora(presentadora.frase, aspecto, nombre), dialogo: S(presentadora.frase), estado: 'pendiente', ...suyo });
  }
  return { estilo: estiloPara(aspecto), personajes, escenas, huecos, version: FLOW_COMPILER_VERSION };
}

// Lo ÚNICO que se le pide al modelo: traducir las acciones. Una línea por escena, mismo orden.
export function promptTraduccion(storyboard = [], cast) {
  // 3.0: las escenas que ya traen accionEn no se traducen; las demás van con quién está en cuadro y su género
  // ("Electrician checks his phone" salía de traducir la acción sin saber que la electricista es mujer).
  const quien = (e) => {
    const ids = Array.isArray(e?.personajes) && e.personajes.length ? e.personajes : (e?.personajesModelo || []);
    const p = (cast?.personajes || []).find((x) => x.id === ids[0]);
    if (!p) return '';
    const g = pronombre(p) === 'She' ? 'mujer' : pronombre(p) === 'He' ? 'hombre' : '';
    return ` (en cuadro: ${S(p.nombre)}${g ? `, ${g}` : ''})`;
  };
  const lineas = (Array.isArray(storyboard) ? storyboard : []).filter((e) => S(e.accion) && !S(e.accionEn)).map((e) => `${Number(e.n)}| ${S(e.accion)}${quien(e)}`);
  if (!lineas.length) return '';
  return `Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.\n${lineas.join('\n')}`;
}

// Parsea "n| texto" por línea; lo que no matchea se ignora (queda como hueco, no rompe).
export function parseTraduccion(text) {
  const out = {};
  for (const raw of String(text || '').split(/\r?\n/)) {
    const m = /^\s*(\d+)\s*\|\s*(.+?)\s*$/.exec(raw);
    if (m) out[Number(m[1])] = m[2];
  }
  return out;
}
