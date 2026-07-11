// Línea de estado/contexto del PIE del panel de cada paso (Workspace W1): una frase corta derivada
// del estado REAL del comercial (persistido), no del happy path. Es lo que el dueño pedía como
// "información de contexto": en Concepto "1 propuesta · elegiste una", en Pack "2/4 copiados · 1
// importado", etc. Puro (sin React, sin red) → testeable directo. Origen: docs/11-workspace/01-spec.md.
import { packProgress, type Comercial, type PasoId } from './comercial';
import { totalDuration, type MontajeState } from './montajePlan';

// suma de duraciones (bloques de guion o escenas de storyboard) — durSec opcional en guion.
const sumDur = (arr: ReadonlyArray<{ durSec?: number }>): number =>
  arr.reduce((s, x) => s + (x.durSec ?? 0), 0);

// Una frase por paso. `negocio` vive en el PROYECTO (no en el comercial) → lo arma ProjectInfo con su
// propia data; acá devuelve '' para que el pie no muestre estado vacío.
export function estadoDelPaso(paso: PasoId, c: Comercial | undefined): string {
  switch (paso) {
    case 'concepto': {
      if (c?.concepto) return '1 propuesta · elegiste una';
      const est = c?.estados?.concepto ?? 'pendiente';
      if (est !== 'pendiente') return 'Propuestas generadas · falta elegir una';
      return 'Generá 2-3 propuestas para arrancar';
    }
    case 'guion': {
      const blocks = c?.guion?.blocks ?? [];
      if (!blocks.length) return 'Generá el guion por bloques';
      const s = Math.round(sumDur(blocks));
      return s > 0 ? `${blocks.length} bloques · ~${s}s totales` : `${blocks.length} bloques`;
    }
    case 'cast': {
      const pers = c?.cast?.personajes ?? [];
      if (!pers.length) return 'Generá los personajes y la locación';
      const loc = c?.cast?.lugar?.nombre ? 'locación definida' : 'sin locación';
      return `${pers.length} ${pers.length === 1 ? 'personaje' : 'personajes'} · ${loc}`;
    }
    case 'storyboard': {
      const sb = c?.storyboard ?? [];
      if (!sb.length) return 'Generá las escenas del comercial';
      const s = Math.round(sumDur(sb));
      return s > 0 ? `${sb.length} escenas · ~${s}s totales` : `${sb.length} escenas`;
    }
    case 'pack': {
      const escenas = c?.packFlow?.escenas ?? [];
      if (!escenas.length) return 'Generá el pack de prompts para Flow';
      const pr = packProgress(c?.packFlow);
      return `${pr.copiados}/${pr.total} copiados · ${pr.importados} importados`;
    }
    case 'render': {
      return c?.renderRef ? 'Reel animado renderizado' : 'Generá el render desde el storyboard';
    }
    case 'rodaje': {
      const rodaje = c?.rodaje ?? [];
      if (!rodaje.length) return 'Importá los clips que bajaste de Flow';
      const escenas = c?.storyboard?.length ?? 0;
      const conClip = new Set(rodaje.map((t) => t.escenaN)).size;
      return `${conClip}/${escenas} escenas con clip`;
    }
    case 'montaje': {
      const m = c?.montaje as MontajeState | undefined;
      if (!m?.plan) return 'Armá el montaje desde el storyboard';
      const scenes = m.plan.scenes ?? [];
      const dur = Math.round(totalDuration(m.plan));
      const musica = m.plan.music ? 'con música' : 'sin música';
      const voz = m.plan.voice ? 'con voz' : 'sin voz';
      const qa = c?.qa ? ` · QA ${c.qa.score}/50` : '';
      return `${scenes.length} escenas · ~${dur}s · ${musica} · ${voz}${qa}`;
    }
    case 'publicar': {
      const pub = c?.publicacion;
      if (!pub) return 'Generá el paquete de publicación';
      return `Paquete listo · ${pub.hashtags?.length ?? 0} hashtags`;
    }
    default:
      return '';   // negocio: la línea la arma ProjectInfo (data del proyecto, no del comercial)
  }
}
