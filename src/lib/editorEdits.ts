// Ediciones del DRAFT local del editor multipista: partir/duplicar/eliminar un clip dentro de su
// pista + un historial deshacer/rehacer sobre snapshots. Puro y mecánico (mueve clips en el tiempo,
// no decide nada de mezcla/render) — la app opera sobre una copia en memoria seedeada desde el
// MontajePlan real (editorTracks.ts). WO-4: el draft ahora se INVIERTE a un MontajePlan persistible
// (montajeFromTracks.ts) y se guarda vía el dueño único (App.updateProject).
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
    // WO-4 (hecho 8): la parte B arranca MÁS ADENTRO del archivo — su srcIn se corre lo que dura A.
    // Sin esto ambas mitades apuntarían al mismo `in` del clip crudo (mostrarían el mismo frame).
    const b: EditorClip = {
      ...clip, id: `${clip.id}-b`, startSec: atSec, durSec: end - atSec, label: `${clip.label} (B)`,
      srcIn: (clip.srcIn ?? 0) + (atSec - clip.startSec),
    };
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

// WO-6a: soltar un item de la biblioteca en la timeline. Función PURA (no toca el DOM) — el drag/drop
// del DOM sólo la invoca con el item soltado. v1 acotado y honesto:
//   clips  → append al final de la pista video (escenaN = max+1, srcIn 0, durSec del item)
//   voz    → reemplaza el único clip de voz
//   música → reemplaza el único clip de música
//   texto  → instancia en el playhead (dur 2.5, contenido = label del preset, editable en el inspector)
// La "posición exacta del drop con ripple" se difiere: append es predecible y no depende de coordenadas
// del DOM. Efectos/Marca NO son droppables (el render no ejecuta efectos por clip; el logo ya viene del
// brandKit) — el DOM ni los marca draggable.
export interface DropItem { id: string; label: string; color: string; fileRef?: string; durSec?: number; tab?: string; meta?: string }

const TEXT_DROP_DUR = 2.5;
let dropCounter = 0;

export function dropLibItem(tracks: EditorTrack[], item: DropItem, playheadSec: number): EditorTrack[] {
  dropCounter += 1;
  const uid = `drop-${dropCounter}`;
  if (item.tab === 'clips' && item.fileRef) {
    return mapTrack(tracks, 'video', (clips) => {
      const end = clips.reduce((m, c) => Math.max(m, c.startSec + c.durSec), 0);
      const maxEscena = clips.reduce((m, c) => Math.max(m, c.escenaN ?? 0), 0);
      const dur = item.durSec && item.durSec > 0 ? item.durSec : 4;
      const nuevo: EditorClip = {
        id: `video-${uid}`, label: item.label, startSec: end, durSec: dur, color: item.color,
        fileRef: item.fileRef, srcIn: 0, escenaN: maxEscena + 1, audio: 'mute', transitionAfter: 'cut',
      };
      // el clip anterior deja de ser el último → le ponemos una transición hacia el nuevo.
      const conTrans = clips.map((c, i) => (i === clips.length - 1 ? { ...c, transitionAfter: c.transitionAfter ?? 'cut' } : c));
      return [...conTrans, nuevo];
    });
  }
  if (item.tab === 'audio' && item.fileRef) {
    // la voz grabada (id audio-voz) va a la pista voz; el resto (música) a la pista música. Reemplaza.
    const esVoz = item.id === 'audio-voz';
    const trackId = esVoz ? 'voz' : 'musica';
    return mapTrack(tracks, trackId, () => [{
      id: `${trackId}-${uid}`, label: item.label, startSec: 0, durSec: 0.1, color: item.color, fileRef: item.fileRef,
      meta: esVoz ? undefined : 'con ducking',
    }]);
  }
  if (item.tab === 'texto') {
    return mapTrack(tracks, 'texto', (clips) => [...clips, {
      id: `texto-${uid}`, label: item.label, startSec: playheadSec, durSec: TEXT_DROP_DUR, color: item.color,
      meta: item.meta || 'titulo',
    }]);
  }
  return tracks;   // efectos/marca u otros → no-op (no droppables v1)
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
