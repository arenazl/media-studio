/**
 * Media Studio — molde Concepto v3.0
 * Node.js ESM. Archivo de datos requerido en la misma carpeta:
 * ./media-studio-enfoques-v3.json
 *
 * Adaptar la exportación buildConceptPromptV3 al molde "concept" en server/functions.mjs.
 * No realiza llamadas al modelo: sólo construye el prompt y valida su salida.
 */
import { readFileSync } from 'node:fs';

export const CATALOGO_CONCEPTO_V3 = JSON.parse(
  readFileSync(new URL('./media-studio-enfoques-v3.json', import.meta.url), 'utf8')
);

const PERFILES = {
  campana: 'Desarrollar el mensaje principal fijado por la estrategia; usar varias funciones sólo si demuestran la misma idea. Debe quedar claro qué es el producto.',
  'campaña': 'Desarrollar el mensaje principal fijado por la estrategia; usar varias funciones sólo si demuestran la misma idea. Debe quedar claro qué es el producto.',
  awareness: 'Alguien que no conoce la marca debe entender qué necesidad atiende y por qué importa.',
  demo: 'El espectador debe entender una operación real del producto y cómo produce un beneficio.',
  conversion: 'Dar una razón concreta para solicitar una demo, probar o consultar, sin inventar CTA, oferta o URL.'
};

/**
 * @param {object} args
 * @param {string} args.name - Marca
 * @param {string} args.brief - Ficha real del negocio (obligatoria)
 * @param {string} [args.perfil] - campana / campaña / awareness / demo / conversion
 * @param {string} [args.perfilTxt] - Objetivo de negocio que puede provenir de Estrategia
 * @param {string} [args.enfoqueId] - uno de los 7 enfoques
 * @param {string} [args.tratamientoId] - natural / sobrio / calido / aspiracional / humor
 * @param {string} [args.intensidadHumor] - sutil / media / alta
 * @param {string} [args.recursoHumorId] - auto o id de herramientasHumor
 * @param {string} [args.tipo] - filmado / animado
 * @param {string} [args.bloquePieza] - Ángulo, dirección creativa, mensaje de Estrategia
 * @param {string} [args.bloqueTecnica] - Límites de producción (video animado, etc.)
 * @param {string} [args.bloqueKit] - Capturas verificadas y media kit disponibles
 * @param {string} [args.cierreMarca] - Claim o cierre aprobado por el dueño, opcional
 */
export function buildConceptPromptV3({
  name,
  brief,
  perfil = 'campana',
  perfilTxt,
  enfoqueId = 'caso',
  tratamientoId = 'natural',
  intensidadHumor = 'sutil',
  recursoHumorId = 'auto',
  tipo = 'filmado',
  bloquePieza = '',
  bloqueTecnica = '',
  bloqueKit = '',
  cierreMarca = ''
}) {
  if (!name?.trim()) throw new Error('Concepto v3 requiere name.');
  if (!brief?.trim()) throw new Error('Concepto v3 requiere ficha/brief del negocio. No se crean capacidades a partir de un nombre.');
  if (!['filmado', 'animado'].includes(tipo)) throw new Error(`Tipo de pieza desconocido: ${tipo}`);

  const enfoque = CATALOGO_CONCEPTO_V3.enfoques.find(e => e.id === enfoqueId);
  const tratamiento = CATALOGO_CONCEPTO_V3.tratamientos.find(t => t.id === tratamientoId);
  if (!enfoque) throw new Error(`Enfoque desconocido: ${enfoqueId}`);
  if (!tratamiento) throw new Error(`Tratamiento desconocido: ${tratamientoId}`);

  const esHumor = enfoqueId === 'humor' || tratamientoId === 'humor';
  const intensidades = CATALOGO_CONCEPTO_V3.intensidadHumor;
  if (esHumor && !Object.hasOwn(intensidades, intensidadHumor)) {
    throw new Error(`Intensidad de humor desconocida: ${intensidadHumor}`);
  }

  const objetivo = perfilTxt?.trim() || PERFILES[perfil] || PERFILES.campana;
  const recursoForzado = CATALOGO_CONCEPTO_V3.herramientasHumor.find(h => h.id === recursoHumorId);
  if (esHumor && recursoHumorId !== 'auto' && !recursoForzado) {
    throw new Error(`Mecanismo de humor desconocido: ${recursoHumorId}`);
  }
  const indicacionHumor = esHumor ? `
SALA DE GUIONISTAS — HUMOR ACTIVADO
Intensidad: ${intensidadHumor}. ${intensidades[intensidadHumor]}
Selección de mecanismo: ${recursoForzado ? `PRIORIZAR ${recursoForzado.nombre}. Generá tres situaciones bien distintas usando ese mecanismo; no estás obligado a cambiar el mecanismo entre propuestas.` : 'AUTO. Elegí tres mecanismos distintos que mejor encajen en la ficha.'}
Herramientas disponibles (elegí una DOMINANTE por idea, no las acumules):
${CATALOGO_CONCEPTO_V3.herramientasHumor.map(h => `- ${h.nombre}: ${h.comoFunciona} EVITÁ: ${h.evitar}.`).join('\n')}
Proceso interno: pensá primero al menos 6 premisas diferentes basadas en tensiones reales de la ficha; filtrá las que dependen de alguien torpe, de un objeto parlante, de lo absurdo sin motivo o de una función inventada. Elegí tres que tengan ${recursoForzado ? "situaciones realmente distintas" : "mecanismos distintos"}, resulten claras sin explicación y conserven el beneficio comercial incluso si no hacen reír.
La gracia puede estar al principio, en el desarrollo o en el cierre: NO se exige un remate de sketch. NO repitas un chiste conocido de redes ni una caricatura genérica. No cites este proceso interno en el JSON.
` : `
HUMOR NO SOLICITADO
No fuerces chistes, ironía, parodia, personajes ridículos ni giros cómicos. Podés usar sorpresa, tensión humana o contraste si ayudan a entender el producto.
`;

  return `ROL
Sos la dupla director/a creativo/a + estratega de una agencia de publicidad. Diseñás spots de marca verticales 9:16, de aproximadamente 20 a 30 segundos. Tu tarea es proponer EXACTAMENTE TRES CONCEPTOS DISTINTOS para que el dueño elija uno. No escribas guiones ni listas de escenas: el concepto es la idea publicitaria que después desarrollarán Guion, Cast, Storyboard y Rodaje.

OBJETIVO COMERCIAL
Marca: ${name}
Perfil: ${perfil}
Meta de esta pieza: ${objetivo}
Tipo de producción: ${tipo}
${bloquePieza ? `Instrucciones del proyecto / Estrategia:\n${bloquePieza}\n` : ''}
FICHA REAL DEL NEGOCIO — ÚNICA FUENTE DE VERDAD FACTUAL
${brief}

${bloqueKit ? `MEDIA KIT / CAPTURAS REALES VERIFICADAS\n${bloqueKit}\n` : 'MEDIA KIT: no provisto. No describas interfaces específicas ni pantallas supuestamente reales.\n'}
${bloqueTecnica ? `CONDICIONES TÉCNICAS NO NEGOCIABLES\n${bloqueTecnica}\n` : ''}
${tipo === 'animado' ? 'PRODUCCIÓN ANIMADA: representar personas como grafismos o recursos visuales cuando sea apropiado; no pedir actores filmados ni fingir capturas del producto.\n' : ''}

DECISIONES CREATIVAS ELEGIDAS POR EL DUEÑO
ENFOQUE (la estructura del relato): ${enfoque.label} [${enfoque.id}]
FICHA COMPLETA DEL ENFOQUE:
${JSON.stringify(enfoque.ficha, null, 2)}
TRATAMIENTO (el registro del spot): ${tratamiento.label} [${tratamiento.id}]
${tratamiento.instruccion}
${cierreMarca?.trim() ? `CIERRE DE MARCA APROBADO: ${cierreMarca.trim()} (respetá las palabras; podés variar su presentación).` : 'CIERRE DE MARCA: si no hay claim aprobado, proponé una firma simple sin hacerla pasar por eslogan oficial.'}
IMPORTANTE: El campo "recorrido" del enfoque es una guía semántica de opciones, NO una lista obligatoria de escenas ni un orden fijo. Conservá libertad narrativa.
${indicacionHumor}

REGLAS DE PUBLICIDAD Y VERACIDAD
1. Toda historia debe conectar una NECESIDAD específica, una capacidad VERIFICABLE del negocio y un BENEFICIO entendible para la audiencia. Debe construir marca, no sólo entretenimiento.
2. Diferenciá las tres propuestas por situación, personaje, función o beneficio, y tensión dramática/creativa. Si hay humor, además diferenciá el mecanismo cómico. No entregues la misma idea con otro título.
3. Nunca inventes funciones, flujos, automatizaciones, integraciones, métricas, tiempos, premios, clientes, testimonios, cargos reales, avales, municipios clientes, ni resultados garantizados.
4. Un personaje de ficción puede vivir una situación simulada. NO lo presentes como testimonio comprobado. Si se menciona una localidad, no impliques que ya contrató el producto salvo prueba explícita en la ficha.
5. Si hay media kit, las pantallas descritas deben existir en él. Sin kit, mantené la referencia al producto conceptual y no atribuyas diseño, botones, notificaciones literales ni textos de UI.
6. La propuesta debe ser filmable o producible en 20 a 30 segundos. Evitá demasiados personajes, locaciones o subtramas; sin indicar segundos, planos, cortes, movimientos de cámara o desglose de escenas en "idea".
7. Presentador/a a cámara, narración, firma con logo, explicación, demostración y CTA SON recursos válidos cuando corresponden. No los prohíbas por prejuicio de formato.
8. Nunca hagas al municipio, sus trabajadores, vecinos o compradores objeto de burla, ni presupongas negligencia. La situación debe ser verosímil, especialmente en contextos públicos.
9. Español rioplatense natural, concreto, sin solemnidad vacía y sin clichés como «solución integral», «somos líderes», «transformá la gestión».

CONTROL DE CALIDAD INTERNO ANTES DE RESPONDER
Para cada propuesta: ¿es un spot de esta marca y no un contenido genérico?, ¿qué beneficio se entiende?, ¿cuál es la prueba o acción real?, ¿cumple enfoque y tratamiento?, ¿se puede producir?, ¿hay alguna afirmación inventada? Descartá las que fallen. Si hay humor: ¿la observación es humana?, ¿el quiebre es claro?, ¿se entiende sin explicar el chiste?, ¿la marca es necesaria para la historia?

CAMPOS Y LONGITUDES — CONTÁ LAS PALABRAS
- topico: de 2 a 4 palabras; título concreto.
- tipoGancho: de 2 a 4 palabras MAYÚSCULAS. Es el RECURSO NARRATIVO (por ejemplo «SITUACIÓN COTIDIANA», «DOBLE PERSPECTIVA», «DEMOSTRACIÓN DIRECTA», «HUMOR OBSERVACIONAL», «CONTRASTE VISUAL»). No se obliga a usar chistes ni ganchos distintos a costa del enfoque.
- idea: de 40 a 60 palabras. Planteá situación, desarrollo del beneficio y cierre conceptual en un párrafo. No agregues tiempos, planos, montaje ni lista de tomas.
- tono: hasta 12 palabras; forma de hablar y actuar.
- estetica: hasta 25 palabras; clima y lenguaje visual, NO storyboard.
- referencia: hasta 12 palabras; formato publicitario general, no campañas concretas ni referencias inventadas.
- porQueFunciona: hasta 20 palabras; por qué esta idea comunica el beneficio e invita a avanzar.

FORMATO DE SALIDA
Devolvé ÚNICAMENTE un objeto JSON válido. Conservá las claves existentes para no romper el parser:
{
  "conceptos": [
    { "id": "c1", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c2", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c3", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" }
  ]
}`;
}

/** Validador sintáctico/de longitud. La veracidad y diversidad semántica requieren revisión adicional. */
export function validateConceptResponseV3(value) {
  const errors = [];
  let data;
  try { data = typeof value === 'string' ? JSON.parse(value) : value; }
  catch (e) { return { ok: false, errors: [`JSON inválido: ${e.message}`], data: null }; }
  if (!data || !Array.isArray(data.conceptos) || data.conceptos.length !== 3) {
    return { ok: false, errors: ['Se requieren exactamente tres conceptos.'], data };
  }
  const count = s => String(s || '').trim().split(/\s+/u).filter(Boolean).length;
  const bounds = {topico:[2,4], tipoGancho:[2,4], idea:[40,60], tono:[1,12], estetica:[1,25], referencia:[1,12], porQueFunciona:[1,20]};
  const ids = new Set();
  for (const [i, c] of data.conceptos.entries()) {
    const path = `conceptos[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${path}: no es objeto.`); continue; }
    if (c.id !== `c${i+1}`) errors.push(`${path}.id debe ser c${i+1}.`);
    ids.add(c.id);
    for (const [key, [min,max]] of Object.entries(bounds)) {
      if (typeof c[key] !== 'string') { errors.push(`${path}.${key} debe ser texto.`); continue; }
      const n = count(c[key]);
      if (n < min || n > max) errors.push(`${path}.${key}: ${n} palabras (se requieren ${min} a ${max}).`);
    }
    if (typeof c.tipoGancho === 'string' && c.tipoGancho !== c.tipoGancho.toLocaleUpperCase('es-AR')) errors.push(`${path}.tipoGancho debe estar en mayúsculas.`);
    if (typeof c.idea === 'string' && /\b(?:\d+\s*(?:s|seg(?:undo)?s?)|planos?|travellings?|montaje|corte\s+a)\b/iu.test(c.idea)) errors.push(`${path}.idea contiene segundos o instrucciones de storyboard.`);
  }
  if (ids.size !== 3) errors.push('Los ids deben ser únicos.');
  return { ok: errors.length === 0, errors, data };
}
