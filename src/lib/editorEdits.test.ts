import { describe, it, expect } from 'vitest';
import {
  deleteClip, duplicateClip, splitClip, canSplit, findClipTrackId, dropLibItem,
  initHistory, pushHistory, undoHistory, redoHistory,
} from './editorEdits';
import type { EditorTrack } from './editorTracks';

function tracks(): EditorTrack[] {
  return [
    {
      id: 'video', name: 'Video', clips: [
        { id: 'v1', label: 'Escena 1', startSec: 0, durSec: 2, color: '#fff' },
        { id: 'v2', label: 'Escena 2', startSec: 2, durSec: 3, color: '#fff' },
        { id: 'v3', label: 'Escena 3', startSec: 5, durSec: 1.5, color: '#fff' },
      ],
    },
    { id: 'texto', name: 'Texto', clips: [{ id: 't1', label: 'hola', startSec: 0, durSec: 1, color: '#fff' }] },
  ];
}

describe('findClipTrackId', () => {
  it('encuentra la pista de un clip', () => {
    expect(findClipTrackId(tracks(), 'v2')).toBe('video');
    expect(findClipTrackId(tracks(), 't1')).toBe('texto');
  });
  it('undefined si no existe', () => {
    expect(findClipTrackId(tracks(), 'no-existe')).toBeUndefined();
  });
});

describe('deleteClip', () => {
  it('saca el clip y corre hacia atrás los que venían después (ripple)', () => {
    const out = deleteClip(tracks(), 'v2');
    const video = out.find((t) => t.id === 'video')!;
    expect(video.clips.map((c) => c.id)).toEqual(['v1', 'v3']);
    expect(video.clips.find((c) => c.id === 'v3')!.startSec).toBe(2);   // 5 - 3 (la duración del que se fue)
  });
  it('no toca otras pistas', () => {
    const out = deleteClip(tracks(), 'v1');
    expect(out.find((t) => t.id === 'texto')!.clips).toEqual(tracks()[1].clips);
  });
  it('id inexistente → devuelve las pistas sin cambios', () => {
    const input = tracks();
    expect(deleteClip(input, 'no-existe')).toBe(input);
  });
});

describe('duplicateClip', () => {
  it('inserta la copia justo después y corre lo que viene más adelante', () => {
    const out = duplicateClip(tracks(), 'v1');
    const video = out.find((t) => t.id === 'video')!;
    expect(video.clips.map((c) => c.label)).toEqual(['Escena 1', 'Escena 1 (copia)', 'Escena 2', 'Escena 3']);
    // v1 dura 2s: la copia arranca en 2, y v2/v3 se corren +2
    expect(video.clips.find((c) => c.label === 'Escena 1 (copia)')!.startSec).toBe(2);
    expect(video.clips.find((c) => c.id === 'v2')!.startSec).toBe(4);
    expect(video.clips.find((c) => c.id === 'v3')!.startSec).toBe(7);
  });
  it('ids únicos si se duplica dos veces', () => {
    const once = duplicateClip(tracks(), 'v1');
    const twice = duplicateClip(once, 'v1');
    const ids = twice.find((t) => t.id === 'video')!.clips.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('splitClip / canSplit', () => {
  it('parte un clip en dos sin mover a los vecinos', () => {
    const out = splitClip(tracks(), 'v2', 3.5);   // v2: 2..5, parte en 3.5
    const video = out.find((t) => t.id === 'video')!;
    expect(video.clips.map((c) => c.id)).toEqual(['v1', 'v2-a', 'v2-b', 'v3']);
    const a = video.clips.find((c) => c.id === 'v2-a')!;
    const b = video.clips.find((c) => c.id === 'v2-b')!;
    expect(a.startSec).toBe(2); expect(a.durSec).toBeCloseTo(1.5);
    expect(b.startSec).toBe(3.5); expect(b.durSec).toBeCloseTo(1.5);
    expect(video.clips.find((c) => c.id === 'v3')!.startSec).toBe(5);   // sin cambios
  });
  it('no parte pegado a un borde (canSplit → false, splitClip no-op)', () => {
    const input = tracks();
    expect(canSplit(input, 'v2', 2.01)).toBe(false);   // pegado al inicio
    expect(canSplit(input, 'v2', 4.99)).toBe(false);   // pegado al final
    expect(canSplit(input, 'v2', 3.5)).toBe(true);
    expect(splitClip(input, 'v2', 2.01)).toBe(input);
  });
  it('canSplit: sin clip seleccionado → false', () => {
    expect(canSplit(tracks(), null, 1)).toBe(false);
  });

  it('WO-4: la parte B corre su srcIn lo que dura A (no repite el mismo frame)', () => {
    // un clip de video con srcIn 10 (arranca en el segundo 10 del archivo), 0..4 en el timeline.
    const t: EditorTrack[] = [{ id: 'video', name: 'Video', clips: [{ id: 'v1', label: 'E1', startSec: 0, durSec: 4, color: '#fff', srcIn: 10 }] }];
    const out = splitClip(t, 'v1', 1.5);   // parte en 1.5 (A dura 1.5)
    const clips = out.find((x) => x.id === 'video')!.clips;
    const a = clips.find((c) => c.id === 'v1-a')!;
    const b = clips.find((c) => c.id === 'v1-b')!;
    expect(a.srcIn).toBe(10);               // A conserva el origen
    expect(b.srcIn).toBeCloseTo(11.5);      // B = 10 + 1.5 (lo que duró A)
  });
});

describe('dropLibItem (WO-6a)', () => {
  const base = (): EditorTrack[] => [
    { id: 'video', name: 'Video', clips: [{ id: 'v1', label: 'E1', startSec: 0, durSec: 4, color: '#fff', escenaN: 1 }] },
    { id: 'voz', name: 'Voz', clips: [] },
    { id: 'musica', name: 'Música', clips: [] },
    { id: 'texto', name: 'Texto', clips: [] },
  ];

  it('clip → append a la pista video con escenaN = max+1 y srcIn 0', () => {
    const out = dropLibItem(base(), { id: 'clip-x', label: 'Nuevo', color: '#fff', fileRef: 'x.mp4', durSec: 5, tab: 'clips' }, 0);
    const video = out.find((t) => t.id === 'video')!;
    expect(video.clips).toHaveLength(2);
    const nuevo = video.clips[1];
    expect(nuevo.startSec).toBe(4);   // arranca donde terminaba el anterior
    expect(nuevo.durSec).toBe(5);
    expect(nuevo.escenaN).toBe(2);
    expect(nuevo.srcIn).toBe(0);
    expect(nuevo.fileRef).toBe('x.mp4');
  });

  it('voz → reemplaza el clip de la pista voz', () => {
    const out = dropLibItem(base(), { id: 'audio-voz', label: 'Voz', color: '#fff', fileRef: 'voz.mp3', tab: 'audio' }, 0);
    const voz = out.find((t) => t.id === 'voz')!;
    expect(voz.clips).toHaveLength(1);
    expect(voz.clips[0].fileRef).toBe('voz.mp3');
  });

  it('música → reemplaza el clip de la pista música', () => {
    const out = dropLibItem(base(), { id: 'audio-track1', label: 'Track', color: '#fff', fileRef: 'm.mp3', tab: 'audio' }, 0);
    const mus = out.find((t) => t.id === 'musica')!;
    expect(mus.clips).toHaveLength(1);
    expect(mus.clips[0].fileRef).toBe('m.mp3');
  });

  it('texto → instancia en el playhead con el label del preset', () => {
    const out = dropLibItem(base(), { id: 'preset-titulo', label: 'Título grande', color: '#fff', tab: 'texto', meta: 'titulo' }, 2.5);
    const txt = out.find((t) => t.id === 'texto')!;
    expect(txt.clips).toHaveLength(1);
    expect(txt.clips[0].startSec).toBe(2.5);
    expect(txt.clips[0].label).toBe('Título grande');
    expect(txt.clips[0].meta).toBe('titulo');
  });

  it('item no droppable (efectos/marca) → no-op', () => {
    const input = base();
    expect(dropLibItem(input, { id: 'fx-x', label: 'FX', color: '#fff', tab: 'efectos' }, 0)).toBe(input);
  });
});

describe('historial deshacer/rehacer', () => {
  it('push acumula en past y limpia future', () => {
    let h = initHistory(0);
    h = pushHistory(h, 1);
    h = pushHistory(h, 2);
    expect(h).toEqual({ past: [0, 1], present: 2, future: [] });
  });
  it('undo retrocede y guarda en future; redo lo trae de vuelta', () => {
    let h = initHistory('a');
    h = pushHistory(h, 'b');
    h = pushHistory(h, 'c');
    h = undoHistory(h);
    expect(h).toEqual({ past: ['a'], present: 'b', future: ['c'] });
    h = undoHistory(h);
    expect(h).toEqual({ past: [], present: 'a', future: ['b', 'c'] });
    h = redoHistory(h);
    expect(h).toEqual({ past: ['a'], present: 'b', future: ['c'] });
  });
  it('undo sin historial pasado → no-op', () => {
    const h = initHistory('a');
    expect(undoHistory(h)).toBe(h);
  });
  it('redo sin futuro → no-op', () => {
    const h = initHistory('a');
    expect(redoHistory(h)).toBe(h);
  });
  it('un push nuevo después de un undo descarta el future viejo (rama nueva)', () => {
    let h = initHistory(0);
    h = pushHistory(h, 1);
    h = pushHistory(h, 2);
    h = undoHistory(h);           // present=1, future=[2]
    h = pushHistory(h, 99);       // nueva rama: descarta el 2
    expect(h).toEqual({ past: [0, 1], present: 99, future: [] });
  });
});
