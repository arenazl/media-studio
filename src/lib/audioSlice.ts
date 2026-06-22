// Corte del audio real en SEGMENTOS. Lógica PURA (cortes → segmentos contiguos),
// testeable. El audio NO se recorta físicamente: los segmentos son metadata
// {startSec,endSec} y el editor los reproduce con offset (montageAudio ya soporta offset).
import type { AudioSegment } from './projects';

export const MIN_SEG_GAP = 0.15; // s — no permitir cortes pegados a otro corte o al borde

// Inserta un punto de corte (en segundos) si es válido: dentro de (0,dur) y separado de
// los cortes existentes. Inmutable; devuelve el array ordenado.
export function addCut(cuts: number[], t: number, dur: number, minGap = MIN_SEG_GAP): number[] {
  if (!(t > minGap) || !(t < dur - minGap)) return cuts;
  if (cuts.some((c) => Math.abs(c - t) < minGap)) return cuts;
  return [...cuts, t].sort((a, b) => a - b);
}

// Saca el corte i (inmutable).
export function removeCut(cuts: number[], i: number): number[] {
  return cuts.filter((_, idx) => idx !== i);
}

// Deriva los segmentos contiguos a partir de los cortes: 0 → c1 → … → dur.
// `names` permite renombrar por índice; default "Parte N".
export function segmentsFromCuts(cuts: number[], dur: number, names: Record<number, string> = {}): AudioSegment[] {
  if (!(dur > 0)) return [];
  const inner = [...cuts].filter((c) => c > 0 && c < dur).sort((a, b) => a - b);
  const bounds = [0, ...inner, dur];
  const segs: AudioSegment[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    segs.push({ id: `seg-${i}`, label: names[i] || `Parte ${i + 1}`, startSec: bounds[i], endSec: bounds[i + 1] });
  }
  return segs;
}

// Cortes internos (boundaries) de una lista de segmentos — el inverso de segmentsFromCuts.
export function cutsFromSegments(segments: AudioSegment[]): number[] {
  return segments.slice(1).map((s) => s.startSec);
}

export const segDur = (s: { startSec: number; endSec: number }): number => Math.max(0, s.endSec - s.startSec);
