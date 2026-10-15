// Director creativo: tres caminos elegidos POR la IA desde el negocio, sin exigir al usuario
// que comprenda los 7 enfoques × 5 tratamientos. Se conserva el contrato JSON de concept.
export function buildConceptPromptDirector({ name, brief, perfil, tipo, bloquePieza, bloqueKit, bloqueTecnica, cierreMarca }) {
  if (!name?.trim() || !brief?.trim()) throw new Error('Necesito el brief real del producto antes de proponer anuncios.');
  return `Sos director creativo de una agencia publicitaria. Primero ESTUDIÁ el producto y después presentá exactamente TRES PROPUESTAS para un spot corto. No le preguntes al dueño qué enfoque o tratamiento elegir: esa es TU tarea y queda registrada en el JSON para los pasos posteriores.

MARCA: ${name}
OBJETIVO DE LA PIEZA: ${perfil || 'comunicar un beneficio comprobable'}
TÉCNICA: ${tipo}
HECHOS DEL NEGOCIO (única fuente de verdad):
${brief}
${bloquePieza || ''}
${bloqueKit || 'Sin capturas ni media kit: no inventes pantallas, botones ni funciones.'}
${bloqueTecnica || ''}
CIERRE: ${cierreMarca || 'Usar marca y CTA auténtico del brief, si existe.'}

TAREA:
- Identificá cuál es el beneficio, quién compra o usa y qué problema verificable resuelve.
- Devolvé TRES caminos VERDADERAMENTE DISTINTOS, con título, público, mensaje, qué verá el espectador y una idea concreta de 40-60 palabras.
- Mostrá alternativas relevantes para ESTE producto, no categorías genéricas ("Marca y visión", "Aspiracional" no son títulos útiles).
- Si el negocio abarca varias etapas o audiencias, detectá cuáles merecen piezas separadas; NO supongas un solo módulo.
- Cada propuesta debe caber en el formato de la pieza y estar sustentada en el brief, no en promesas, testimonios ni resultados inventados.
- No fuerces humor: evitá proponerlo salvo que el brief/objetivo lo pida expresamente; el humor mal ejecutado perjudica el spot.
- Internamente clasificá enfoque = caso|producto|dos-lados|antes-despues|testimonio|institucional|humor y tratamiento = natural|sobrio|calido|aspiracional|humor. Esos IDs los consume el motor, NO se muestran como decisiones previas al usuario.
- No escribas guion, casting ni storyboard; éstos se generan únicamente cuando se elige una propuesta.
- Para filmado/híbrido se pueden usar actores y pantallas reales del kit. Para animado no inventes rodaje filmado.
- Español rioplatense claro, sin clichés; no menciones detalles técnicos al dueño.

Respuesta SOLO JSON válido:
{"conceptos":[
{"id":"c1","topico":"título específico","tipoGancho":"recurso narrativo","idea":"historia concreta","tono":"registro actoral","estetica":"qué se ve","referencia":"formato publicitario general","porQueFunciona":"beneficio verificable","audiencia":"para quién","mensaje":"mensaje único","seVe":"secuencia visual esperada","enfoque":"caso","tratamiento":"natural"},
{"id":"c2","topico":"","tipoGancho":"","idea":"","tono":"","estetica":"","referencia":"","porQueFunciona":"","audiencia":"","mensaje":"","seVe":"","enfoque":"producto","tratamiento":"sobrio"},
{"id":"c3","topico":"","tipoGancho":"","idea":"","tono":"","estetica":"","referencia":"","porQueFunciona":"","audiencia":"","mensaje":"","seVe":"","enfoque":"dos-lados","tratamiento":"calido"}
]}
Los IDs de ejemplo son ilustrativos: elegí para cada propuesta la clasificación que corresponda realmente a su historia.`;
}
