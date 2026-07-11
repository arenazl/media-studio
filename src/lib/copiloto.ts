// Copiloto del pipeline — CONTENIDO puro por paso + cálculo del progreso dinámico. Sin React, sin
// red: la guía que el panel muestra (qué es · qué hizo la IA · qué tenés que hacer · tip) vive acá
// como datos, y `copilotoDinamico` deriva del `Comercial` real cuántos ítems están cumplidos, cuál
// es el próximo a resaltar y el contador (Pack Flow "X/N copiados"). Testeable directo.
//
// Origen: docs/10-copiloto/01-spec.md (el texto base lo redactó Fable; acá se pule, no se reinventa).
import { packProgress, type Comercial, type PasoId } from './comercial';

export interface CopilotoStep {
  queEs: string;            // una línea: qué es el paso
  hizoIA?: string;          // qué generó la IA — se muestra sólo si el paso ya tiene contenido
  hace: string[];           // lo que tenés que hacer vos, numerado (acá está el valor)
  tip?: string;             // 1 consejo de calidad (docs/reportes/02 — mejores prácticas)
  nota?: string;            // aclaración honesta puntual (ej. el logo final se quema en el Montaje)
}

// Progreso derivado del estado real: cuántos ítems de `hace` están cumplidos (contados desde arriba,
// monotónico → el panel tilda 0..avance-1 y resalta `nextItem`), + un contador cuando aplica.
export interface CopilotoDinamico {
  hasContent: boolean;                                   // el paso ya generó → mostrar `hizoIA`
  aprobado: boolean;                                     // paso cerrado (estado 'aprobado')
  avance: number;                                        // ítems cumplidos (0..hace.length)
  nextItem: number;                                      // índice a resaltar (-1 si no queda pendiente)
  progreso?: { label: string; done: number; total: number };   // contador (pack / rodaje)
}

// ── Contenido por paso ────────────────────────────────────────────────────────
export const COPILOTO: Record<PasoId, CopilotoStep> = {
  negocio: {
    queEs: 'Los hechos del negocio: la materia prima de todo el comercial.',
    hace: [
      'Revisá que el brief tenga la propuesta completa y la marca fonética (cómo se pronuncia).',
      'Cuanto más concreto el brief, mejor sale todo lo que viene después.',
    ],
    tip: 'Si el brief es flojo, las piezas salen genéricas. Es el insumo que más pesa.',
  },
  concepto: {
    queEs: 'La idea del comercial: 2-3 propuestas con tono, estética y referencia.',
    hizoIA: 'Propuso ideas con su tono, su estética y a qué anuncio conocido se parecen.',
    hace: [
      'Generá las propuestas con IA si todavía está vacío.',
      'Compará las 2-3 ideas entre sí.',
      'Elegí una — es TU decisión creativa, la IA no elige por vos.',
      'Definí si el comercial va a ser Filmado o Animado.',
    ],
    tip: 'Si las propuestas se parecen demasiado, regenerá hasta que una te enganche.',
  },
  guion: {
    queEs: 'El guion por bloques: hook, desarrollo, remate y CTA.',
    hizoIA: 'Escribió la narración calibrada para que entre justo en el tiempo de cada bloque.',
    hace: [
      'Generá el guion si está vacío.',
      'Leé cada bloque EN VOZ ALTA — así se detecta lo que no suena natural.',
      'Editá lo que no te cierre (se guarda solo mientras tipeás).',
      'Regenerá un bloque suelto si no te convence.',
    ],
    tip: 'El hook son los primeros 2 segundos: sin logo, algo que enganche de una.',
  },
  cast: {
    queEs: 'Los personajes y la locación, con su descripción física exacta.',
    hizoIA: 'Definió cada personaje con su ficha física — se pega igual en todos los prompts, así el actor tiene la misma cara en cada clip.',
    hace: [
      'Generá el cast.',
      'Revisá que cada descripción sea específica y con sentido para el rubro.',
      'Pulila una vez, con detalle: es lo que garantiza la consistencia.',
    ],
    tip: '"Una mujer joven" no alcanza. Cuanto más exacta la ficha, más consistente el actor.',
  },
  storyboard: {
    queEs: 'Las escenas numeradas, con su diálogo, su plano y sus tiempos.',
    hizoIA: 'Armó el plano, la duración, el diálogo y la continuidad de cada escena.',
    hace: [
      'Generá el storyboard.',
      'Revisá que los diálogos entren en el tiempo de su escena.',
      'Regenerá una escena puntual si hace falta.',
    ],
    tip: 'Los talking heads son de 8s mínimo: una frase entera se dice en 8 segundos.',
  },
  pack: {
    queEs: 'Los prompts para pegar en Google Flow (Veo 3) y generar los videos.',
    hizoIA: 'Armó 1 prompt MAESTRO + 1 prompt por clip, con los personajes consistentes entre escenas.',
    hace: [
      'Copiá el MASTER y pegalo UNA sola vez en Google Flow: define el estilo y los personajes.',
      'Copiá el clip #1, pegalo en Flow, generá 2-3 tomas, elegí la mejor y bajá el mp4.',
      'Repetí con cada clip (#2, #3, #4…): un video por escena.',
      'Con los clips bajados, pasá a Rodaje e importá cada uno.',
    ],
    tip: 'No edites los prompts a mano en Flow. Si querés otra idea visual, usá el botón Regenerar del clip: mantiene la cara del actor.',
    nota: 'Descargá el logo (bloque Marca) si querés subirlo a Flow como referencia. Ojo: el logo FINAL se quema en el Montaje —el render lo sobreimprime en el mp4—, así que no dependas de que Flow lo dibuje exacto.',
  },
  render: {
    queEs: 'La app renderiza el storyboard animado a un mp4 (comercial animado).',
    hizoIA: 'Animó las pantallas reales del producto según el storyboard.',
    hace: [
      'Generá el render desde el storyboard.',
      'Miralo entero y regenerá si algún momento no cierra.',
    ],
    tip: 'El render anima las pantallas del KB: cuanto mejor el storyboard, mejor el resultado.',
  },
  rodaje: {
    queEs: 'Importás acá los clips que bajaste de Flow, escena por escena.',
    hace: [
      'En cada escena, importá su clip.',
      'Mirá el aviso si un clip quedó más corto que la escena.',
      'Elegí la mejor toma cuando subas varias.',
    ],
    tip: 'En escenas con diálogo, el audio del clip es el audio del comercial: elegí la toma con voz más limpia.',
  },
  montaje: {
    queEs: 'Se arma el comercial completo y se exporta el mp4 final.',
    hizoIA: 'Ordenó las escenas, puso la música según el mood, el silencio antes del remate y el ducking.',
    hace: [
      'Armá el comercial desde el storyboard.',
      'Sumá la voz en off (o usá la voz grabada) y elegí la música.',
      'Chequeá calidad ANTES de exportar: apuntá a 38+.',
      'Exportá el mp4.',
    ],
    tip: 'El export se bloquea si falta un clip: completá el rodaje primero.',
  },
  publicar: {
    queEs: 'El paquete para postear: caption, hashtags, CTA y hook en pantalla.',
    hizoIA: 'Armó el copy de publicación adaptado a la plataforma.',
    hace: [
      'Generá el paquete de publicación.',
      'Copiá cada bloque y llevalo a la red.',
    ],
    tip: 'La primera línea del caption es el gancho: que no sea "mirá este video".',
  },
};

// ── ¿el paso ya tiene su artefacto generado? ─────────────────────────────────
function tieneContenido(paso: PasoId, c: Comercial | undefined): boolean {
  if (!c) return false;
  switch (paso) {
    case 'concepto': return !!c.concepto;
    case 'guion': return !!c.guion?.blocks?.length;
    case 'cast': return !!c.cast?.personajes?.length;
    case 'storyboard': return !!c.storyboard?.length;
    case 'pack': return !!c.packFlow?.escenas?.length;
    case 'render': return !!c.renderRef;
    case 'rodaje': return !!c.rodaje?.length;
    case 'montaje': return !!c.montaje;
    case 'publicar': return !!c.publicacion;
    default: return false;   // negocio: el brief vive en el proyecto, no hay "IA generó"
  }
}

// cuántas escenas del storyboard ya tienen al menos un clip importado (rodaje).
function escenasConClip(c: Comercial | undefined): number {
  const conClip = new Set((c?.rodaje ?? []).map((t) => t.escenaN));
  return conClip.size;
}

// ── Progreso dinámico del paso ────────────────────────────────────────────────
// Deriva `avance` (ítems cumplidos desde arriba) del estado REAL. Para pack/rodaje usa los
// contadores concretos; para el resto: generado = arrancaste (avance 1), aprobado = terminaste.
export function copilotoDinamico(paso: PasoId, c: Comercial | undefined): CopilotoDinamico {
  const total = COPILOTO[paso].hace.length;
  const estado = c?.estados?.[paso] ?? 'pendiente';
  const aprobado = estado === 'aprobado';
  const hasContent = tieneContenido(paso, c);
  let avance = 0;
  let progreso: CopilotoDinamico['progreso'];

  if (paso === 'pack') {
    const pr = packProgress(c?.packFlow);
    progreso = { label: 'clips copiados', done: pr.copiados, total: pr.total };
    if (!hasContent) avance = 0;                                   // sin pack: generalo primero (CTA del header)
    else if (pr.copiados === 0) avance = 1;                        // pack listo → copiá el MASTER
    else if (pr.copiados < pr.total) avance = 2;                   // copiando clips
    else if (pr.importados < pr.total) avance = 3;                 // todos copiados → seguí importando en Rodaje
    else avance = total;                                           // todo importado
  } else if (paso === 'rodaje') {
    const conClip = escenasConClip(c);
    const escenas = c?.storyboard?.length ?? 0;
    progreso = { label: 'escenas con clip', done: conClip, total: escenas };
    if (conClip === 0) avance = 0;
    else if (conClip < escenas) avance = 1;
    else avance = aprobado ? total : 2;
  } else if (paso === 'concepto') {
    // generá(0) · compará(1) · elegí(2) · definí tipo(3). Elegir un concepto implica que comparaste.
    if (c?.concepto) avance = 3;
    else if (estado !== 'pendiente') avance = 1;
  } else if (paso === 'montaje') {
    if (c?.montaje) avance = c?.qa ? 3 : 2;                        // armado → chequeá calidad → exportá
  } else {
    // pasos "generar y revisar": generado = arrancaste (avance 1), lo demás lo cierra el aprobado.
    if (hasContent || estado !== 'pendiente') avance = 1;
  }

  // paso cerrado → todo cumplido. EXCEPTO pack/rodaje: ahí manda el contador real (un pack aprobado
  // pero con clips sin copiar debe seguir mostrando el próximo paso, no tildar todo contra 0/N).
  if (aprobado && paso !== 'pack' && paso !== 'rodaje') avance = total;
  const nextItem = avance < total ? avance : -1;
  return { hasContent, aprobado, avance, nextItem, progreso };
}
