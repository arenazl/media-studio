// Ediciones del DRAFT local del editor multipista: partir/duplicar/eliminar un clip dentro de su
// pista + un historial deshacer/rehacer sobre snapshots. Puro y mecánico (mueve clips en el tiempo,
// no decide nada de mezcla/render) — la app opera sobre una copia en memoria seedeada desde el
// MontajePlan real (editorTracks.ts); estos cambios NO se persisten al comercial todavía.
// TODO(modelo-superior): mapear estas ediciones de vuelta a un MontajePlan persistible + al render
// (server/renderComercial.mjs) — es la "composición final" que REGLAS-IMPLEMENTACION.md pide no inventar.
import type { EditorClip, EditorTrack } from './editorTracks';

const MIN_SPLIT_GAP = 0.15;   // s — no partir pegado al borde del clip (mismo criterio que audioSlice.MIN_SEG_GAP)

function mapTrack(tracks: EditorTrack[], trackId: string, fn: (clips: EditorClip[]) => EditorClip[]): EditorTrack[] {
  return tracks.map((t) => (t.id === trackId ? { ...t, clips: fn(t.clips) } : t));
}

export function findClipTrackId(tracks: EditorTrack[], clipId: string): string | undefined {
  return tracks.find((t) => t.clips.some((c) => c.id === clipId))?.id;
}

// Elimina un clip (ripple: lo que viene DESPUÉS en la misma pista se corre hacia atrás su duración).
export function deleteClip(tracks: EditorTrack[], clipId: string): EditorTrack[] {
  const trackId = findClipTrackId(tracks, clipId);
  if (!trackId) return tracks;
  return mapTrack(tracks, trackId, (clips) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return clips;
    return clips
      .filter((c) => c.id !== clipId)
      .map((c) => (c.startSec > clip.startSec ? { ...c, startSec: c.startSec - clip.durSec } : c));
  });
}

// Duplica un clip justo después de sí mismo, corriendo lo que viene después. El sufijo incluye un
// contador para no chocar ids si se duplica el mismo clip varias veces en la misma sesión.
let dupCounter = 0;
export function duplicateClip(tracks: EditorTrack[], clipId: string): EditorTrack[] {
  const trackId = findClipTrackId(tracks, clipId);
  if (!trackId) return tracks;
  return mapTrack(tracks, trackId, (clips) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return clips;
    dupCounter += 1;
    const copyStart = clip.startSec + clip.durSec;
    const copy: EditorClip = { ...clip, id: `${clip.id}-dup${dupCounter}`, startSec: copyStart, label: `${clip.label} (copia)` };
    const shifted = clips.map((c) => (c.startSec >= copyStart ? { ...c, startSec: c.startSec + clip.durSec } : c));
    return [...shifted, copy].sort((a, b) => a.startSec - b.startSec);
  });
}

// Parte un clip en dos a un instante ABSOLUTO dentro de su rango (no pegado a ningún borde). La
// duración total ocupada no cambia — no hace falta correr los clips vecinos. No-op (misma referencia
// de `tracks`) si el clip no existe o el instante cae pegado a un borde.
export function splitClip(tracks: EditorTrack[], clipId: string, atSec: number): EditorTrack[] {
  if (!canSplit(tracks, clipId, atSec)) return tracks;
  const trackId = findClipTrackId(tracks, clipId)!;
  return mapTrack(tracks, trackId, (clips) => {
    const idx = clips.findIndex((c) => c.id === clipId);
    const clip = clips[idx];
    const end = clip.startSec + clip.durSec;
    const a: EditorClip = { ...clip, id: `${clip.id}-a`, durSec: atSec - clip.startSec, label: `${clip.label} (A)`, transitionAfter: 'cut' };
    const b: EditorClip = { ...clip, id: `${clip.id}-b`, startSec: atSec, durSec: end - atSec, label: `${clip.label} (B)` };
    return [...clips.slice(0, idx), a, b, ...clips.slice(idx + 1)];
  });
}

// puede partirse: existe, y el instante cae estrictamente adentro (no pegado a un borde).
export function canSplit(tracks: EditorTrack[], clipId: string | null, atSec: number): boolean {
  if (!clipId) return false;
  const trackId = findClipTrackId(tracks, clipId);
  if (!trackId) return false;
  const clip = tracks.find((t) => t.id === trackId)!.clips.find((c) => c.id === clipId)!;
  const end = clip.startSec + clip.durSec;
  return atSec > clip.startSec + MIN_SPLIT_GAP && atSec < end - MIN_SPLIT_GAP;
}

// ── Historial deshacer/rehacer ────────────────────────────────────────────────
// Genérico sobre snapshots (acá, EditorTrack[][]) — sin acoplar a React ni al shape del editor.
export interface EditHistory<T> { past: T[]; present: T; future: T[] }

export function initHistory<T>(present: T): EditHistory<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(h: EditHistory<T>, next: T): EditHistory<T> {
  return { past: [...h.past, h.present], present: next, future: [] };
}

export function undoHistory<T>(h: EditHistory<T>): EditHistory<T> {
  if (!h.past.length) return h;
  const previous = h.past[h.past.length - 1];
  return { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] };
}

export function redoHistory<T>(h: EditHistory<T>): EditHistory<T> {
  if (!h.future.length) return h;
  const [next, ...rest] = h.future;
  return { past: [...h.past, h.present], present: next, future: rest };
}
