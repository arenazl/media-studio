// Orquestador (2026-10-10, pedido de Lucas mirando el motor de 9 capas de Habláh): el prompt de cualquier molde,
// armado para una pieza SIN llamar al modelo, partido en CAPAS con su naturaleza (estático / preset / dinámico) y de
// dónde sale cada una ("para cambiar algo acá: ..."). Los moldes ya ensamblan por concatenación determinística y
// escriben cada bloque con un encabezado en MAYÚSCULAS: acá se parte por esos encabezados sin tocar los prompts
// (los curados se aplican tal cual). La pantalla Orquestador lo muestra como tarjetas; el objetivo es ver el prompt
// entero, entender qué lo cambia y comparar orquestaciones hasta dar con el algoritmo de creación.
import { buildFunctionPrompt } from './functions.mjs';

// Un encabezado es una línea corta en mayúsculas (admite acentos, Ñ, números, signos), sin minúsculas; puede llevar
// una aclaración entre paréntesis en minúsculas ("ENFOQUE Y TRATAMIENTO ELEGIDOS (vienen del concepto; respetalos)").
const ES_ENCABEZADO = /^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 ,.:;\-—·/"'¿?¡!]{2,90}$/; // 'ROL' también es encabezado
const tieneMinusculas = (s) => /[a-záéíóúüñ]/.test(s);
const cabeza = (linea) => linea.replace(/\s*\(.*$/, '').replace(/[:：]\s*$/, '').trim();
// Encabezados de PRIMER nivel de los moldes. Cualquier otro encabezado en mayúsculas (los de la ficha del negocio:
// QUÉ OFRECE, POR QUÉ ES DISTINTO, NO DECIR...; o "FICHA COMPLETA DEL ENFOQUE" dentro de las decisiones) es una
// subsección y se queda adentro de la capa anterior.
const PRIMER_NIVEL = /^(ROL|QUÉ ES ESTO|QUE ES ESTO|OBJETIVO|FICHA (REAL )?DEL NEGOCIO|BRIEF|MEDIA KIT|CAPTURAS|PANTALLAS DEL PRODUCTO|CONDICIONES TÉCNICAS|TÉCNICA|PRODUCCIÓN ANIMADA|DECISIONES CREATIVAS|ENFOQUE Y TRATAMIENTO|SALA DE GUIONISTAS|HUMOR|REGLAS|CONTROL DE CALIDAD|CAMPOS|LARGOS|FORMATO DE SALIDA|DEVOLVÉ|DEVOLVE|ESTRUCTURA|PRESUPUESTO|CADA BLOQUE|NO ASUMIR|LO QUE NO VA|PRINCIPIO|POR ESCENA|CONTINUIDAD|DURACIÓN|CAST|GUION|STORYBOARD|CONCEPTO|NEGOCIO|RUBRO|ESTILO|PERSONAJES|ESCENAS)\b/;

// Naturaleza y origen por encabezado (regex sobre el encabezado). Orden: la primera que matchea gana.
const CLASIFICACION = [
  { re: /^(ROL|QUÉ ES ESTO|QUE ES ESTO)/, naturaleza: 'estatico', origen: 'el texto fijo del molde (server/functions.mjs o la curación en server/media-studio-concept-v3.mjs)' },
  { re: /^(REGLAS|NO ASUMIR|LO QUE NO VA|CONTROL DE CALIDAD|CONTINUIDAD|CADA BLOQUE|POR ESCENA|PRINCIPIO)/, naturaleza: 'estatico', origen: 'reglas fijas del molde; se cambian con una curación (base-compartida/36)' },
  { re: /^(CAMPOS|LARGOS|FORMATO DE SALIDA|DEVOLVÉ|DEVOLVE)/, naturaleza: 'estatico', origen: 'el contrato de salida del molde: lo lee el parser y el validador (server/prompting.mjs)' },
  { re: /^OBJETIVO COMERCIAL/, naturaleza: 'preset', origen: 'perfil de campaña (Tipo de campaña en el asistente) y formato de la pieza' },
  { re: /^DECISIONES CREATIVAS/, naturaleza: 'preset', origen: 'Enfoque y Tratamiento elegidos en Concepto; la ficha sale del catálogo server/media-studio-enfoques-v3.json' },
  { re: /^ENFOQUE Y TRATAMIENTO/, naturaleza: 'preset', origen: 'heredado del Concepto: enfoque y tratamiento de la pieza (catálogo de enfoques)' },
  { re: /^(SALA DE GUIONISTAS|HUMOR)/, naturaleza: 'preset', origen: 'intensidad y mecanismo de humor (sólo si enfoque o tratamiento es humor)' },
  { re: /^(CONDICIONES TÉCNICAS|TÉCNICA|PRODUCCIÓN ANIMADA|DURACIÓN|PRESUPUESTO|ESTRUCTURA)/, naturaleza: 'preset', origen: 'formato de la pieza (src/lib/formato.ts) y presupuesto de palabras por duración (server/prompting.mjs)' },
  { re: /^(FICHA|BRIEF|NEGOCIO)/, naturaleza: 'dinamico', origen: 'la ficha del negocio: el KB de la integración o el media kit de la app (y la tesis arriba del brief)' },
  { re: /^MEDIA KIT|^CAPTURAS|^PANTALLAS/, naturaleza: 'dinamico', origen: 'el media kit de la app (pantallas reales, momentos, CTA)' },
  { re: /^(CONCEPTO|GUION|CAST|STORYBOARD|ÁNGULO|ANGULO|DIRECCIÓN CREATIVA|MENSAJE PRINCIPAL)/, naturaleza: 'dinamico', origen: 'lo que se eligió o generó en el paso anterior de la pieza' },
];
const clasificar = (titulo) => CLASIFICACION.find((c) => c.re.test(titulo)) || { naturaleza: 'dinamico', origen: 'lo que trae la pieza' };

// Parte el prompt por encabezados. Lo que hay antes del primer encabezado es la capa 0 ("apertura").
export function partirEnCapas(prompt) {
  const lineas = String(prompt || '').split('\n');
  const capas = [];
  let actual = { titulo: 'APERTURA', lineas: [] };
  for (const l of lineas) {
    const t = l.trim();
    const h = cabeza(t);
    const esEncabezado = !!h && ES_ENCABEZADO.test(h) && !tieneMinusculas(h) && h.length <= 90 && PRIMER_NIVEL.test(h);
    if (esEncabezado) {
      if (actual.lineas.join('').trim()) capas.push(actual);
      actual = { titulo: h, lineas: [] };
    } else {
      actual.lineas.push(l);
    }
  }
  if (actual.lineas.join('').trim()) capas.push(actual);
  return capas.map((c, i) => {
    const texto = c.lineas.join('\n').replace(/^\n+|\n+$/g, '');
    const { naturaleza, origen } = clasificar(c.titulo);
    return { n: i + 1, titulo: c.titulo, naturaleza, origen, texto, palabras: texto.split(/\s+/).filter(Boolean).length };
  });
}

// Arma el prompt del molde con el mismo cuerpo que manda el front a /api/run-function y lo devuelve por capas.
export function capasDe(body) {
  const { prompt, mode, promptVersion, compilado } = buildFunctionPrompt(body);
  const capas = partirEnCapas(prompt);
  const chips = decisiones(body);
  return { functionId: body.functionId, promptVersion, mode, compilado: !!compilado && !prompt, prompt, capas, chips, totalPalabras: String(prompt || '').split(/\s+/).filter(Boolean).length };
}

// Lo resuelto que se muestra arriba, como los chips de Habláh (edad, nivel, tópico): acá perfil, enfoque, tratamiento...
function decisiones(body) {
  const o = body.options || {}, p = body.context?.piece || {}, pr = body.context?.project || {};
  const chips = [];
  const add = (k, v) => { if (v !== undefined && v !== null && v !== '') chips.push({ k, v: String(v) }); };
  add('app', pr.name);
  add('tipo', p.tipo);
  add('formato', p.formato ? `${p.formato.aspecto} · ${p.formato.plataforma}` : undefined);
  add('duración', p.durationSec ? `${p.durationSec} s` : undefined);
  add('perfil', o.perfil);
  add('enfoque', o.enfoque || p.enfoque);
  add('tratamiento', o.tratamiento || p.tratamiento);
  if ((o.enfoque || p.enfoque) === 'humor' || (o.tratamiento || p.tratamiento) === 'humor') { add('humor', o.intensidadHumor || p.intensidadHumor); add('mecanismo', o.recursoHumorId || p.recursoHumorId); }
  add('tono', o.tono);
  add('modelo', body.model);
  return chips;
}
