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

export const FLOW_COMPILER_VERSION = 'flowpack/2.0-compilado';

// El aspecto viene del FORMATO de la pieza (9:16 por defecto; 16:9 para YouTube/TV). Es lo único
// del estilo que cambia por pieza.
export const estiloPara = (aspecto = '9:16') => `Photorealistic, professional cinematic ${aspecto === '16:9' ? 'horizontal 16:9' : `vertical ${aspecto || '9:16'}`}, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.`;
export const ESTILO_GLOBAL = estiloPara('9:16');

export const VEO_REGLAS_EN = {
  logoCierre: "The uploaded brand logo 'logo.png' from assets is displayed clearly and prominently centered in the upper third of the frame.",
  logoLibre: 'Keep the top center area of the frame uncluttered for top-centered brand logo overlay.',
  talkingHead: 'Medium shot, waist-up framing, the person fills a good portion of the frame with strong, dominant presence. The camera holds steady or does a very subtle slow push-in while speaking.',
  habla: 'speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words:',
  sinSilencio: 'The person keeps talking for the whole clip, warm, confident and charming tone, realistic expressive face.',
  broll: 'No spoken dialogue, ambient sound only. One single continuous take, same background, no cut.',
  pantalla: 'If an app screen is visible, the screen is not clearly legible.',
  sinTexto: 'No on-screen text.',
};

const ENTREGA_POR_ROL = {
  hook: 'Energetic, hooking delivery that grabs attention from the first word.',
  desarrollo: 'Warm and assured delivery, explaining with confidence.',
  gag: 'Playful, sharp delivery that lands the punchline.',
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
  const base = sinArgentine(primeraOracion(p?.fisicoEn, 18));
  return `${nombre}, an Argentine ${base || 'adult'}`.replace(/\s+/g, ' ').trim();
}

export function promptImagen(p, lugar) {
  const fisico = sinArgentine(S(p?.fisicoEn) || S(p?.fisicoEs) || 'adult');
  const fondo = lugar?.descripcionEn ? `, neutral background with a hint of ${primeraOracion(lugar.descripcionEn, 14).toLowerCase()}` : ', neutral background';
  return `Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine ${fisico}, standing and looking at the camera, natural pose${fondo}. A still photo, no action, no dialogue.`;
}

// Prompt de UNA escena. `accionEn` es la acción ya traducida (o null → se usa la española y se marca).
export function promptEscena(e, { cast, lugar, phonetic, accionEn, aspecto = '9:16' }) {
  const rol = S(e?.rol) || 'desarrollo';
  const ids = Array.isArray(e?.personajes) ? e.personajes : [];
  const personas = ids.map((id) => (cast?.personajes || []).find((p) => p.id === id)).filter(Boolean);
  const locacion = lugar?.descripcionEn ? primeraOracion(lugar.descripcionEn, 24) : 'a real-world location that matches the business';
  const dialogo = S(e?.dialogo);
  const accion = accionEn != null ? S(accionEn) : S(e?.accion);
  const L = [estiloPara(aspecto), `Location: ${locacion}.`];
  if (personas.length && dialogo) {
    const p = personas[0];
    L.push(`${personajeCorto(p)}.`);
    // el plano del storyboard sólo si agrega algo a la regla fija (un "medium shot" la repetiría)
    const plano = /medium/i.test(S(e?.plano)) ? '' : S(e?.plano);
    L.push(plano ? `${plano}${S(e?.angulo) ? `, ${S(e.angulo)}` : ''}. ${VEO_REGLAS_EN.talkingHead}` : VEO_REGLAS_EN.talkingHead);
    if (accion) L.push(`Action: ${accion}.`);
    L.push(`${pronombre(p)} ${VEO_REGLAS_EN.habla} '${dialogo}'`);
    L.push(`${ENTREGA_POR_ROL[rol] || ENTREGA_POR_ROL.desarrollo} ${VEO_REGLAS_EN.sinSilencio}`);
  } else {
    if (personas.length) L.push(`${personas.map(personajeCorto).join(' and ')} in the scene, no dialogue.`);
    if (accion) L.push(`${accion}.`);
    L.push(VEO_REGLAS_EN.broll);
    if (mencionaPantalla(e?.accion) || mencionaPantalla(e?.screen)) L.push(VEO_REGLAS_EN.pantalla);
  }
  L.push(rol === 'cta' ? VEO_REGLAS_EN.logoCierre : VEO_REGLAS_EN.logoLibre);
  L.push(VEO_REGLAS_EN.sinTexto);
  let out = L.join(' ');
  if (phonetic && S(e?.dialogo)) out = out.replace(/\s+/g, ' ');
  return out.replace(/\.\./g, '.').trim();
}

// El pack entero, sin IA. `traducciones` = { [n]: accionEn } (lo que devolvió el paso de traducción,
// puede venir vacío). Devuelve también `huecos`: escenas cuya acción quedó en español.
export function compileFlowPack({ storyboard = [], cast, phonetic = '', traducciones = {}, aspecto = '9:16' } = {}) {
  const lugar = cast?.lugar;
  const personajes = (cast?.personajes || []).map((p) => ({ id: p.id, nombre: S(p.nombre) || p.id, promptImagen: promptImagen(p, lugar) }));
  const huecos = [];
  const escenas = (Array.isArray(storyboard) ? storyboard : []).map((e) => {
    const n = Number(e.n);
    const accionEn = traducciones[n] != null && S(traducciones[n]) ? S(traducciones[n]) : null;
    if (accionEn == null && S(e.accion)) huecos.push(n);
    return { escenaN: n, rol: S(e.rol) || 'desarrollo', prompt: promptEscena(e, { cast, lugar, phonetic, accionEn, aspecto }), estado: 'pendiente' };
  });
  return { estilo: estiloPara(aspecto), personajes, escenas, huecos, version: FLOW_COMPILER_VERSION };
}

// Lo ÚNICO que se le pide al modelo: traducir las acciones. Una línea por escena, mismo orden.
export function promptTraduccion(storyboard = []) {
  const lineas = (Array.isArray(storyboard) ? storyboard : []).filter((e) => S(e.accion)).map((e) => `${Number(e.n)}| ${S(e.accion)}`);
  if (!lineas.length) return '';
  return `Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.\n${lineas.join('\n')}`;
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
