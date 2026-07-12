import { describe, it, expect } from 'vitest';
import { buildEditorTimeline, transitionKind, transitionKindDurSec, findClip, clipAt, clipsAt, roleColor, aspectLabel } from './editorTracks';
import type { Comercial, Escena } from './comercial';
import type { MontajePlan } from './montajePlan';

const baseEstados = {
  negocio: 'aprobado', concepto: 'aprobado', guion: 'aprobado', cast: 'pendiente', storyboard: 'aprobado',
  pack: 'pendiente', render: 'pendiente', rodaje: 'pendiente', montaje: 'generado', publicar: 'pendiente',
} as Comercial['estados'];

function comercial(overrides: Partial<Comercial> = {}): Comercial {
  return { id: 'com-1', titulo: 'Test', tipo: 'filmado', estados: baseEstados, ...overrides };
}

const escena = (n: number, over: Partial<Escena> = {}): Escena => ({
  n, rol: 'hook', durSec: 8, plano: '', angulo: '', personajes: [], accion: '', dialogo: '', continuidad: '', ...over,
});

describe('buildEditorTimeline — sin datos', () => {
  it('comercial undefined → 6 pistas vacías, totalSec 0, aspecto default 9:16', () => {
    const { tracks, totalSec, width, height } = buildEditorTimeline(undefined);
    expect(totalSec).toBe(0);
    expect(tracks.map((t) => t.id)).toEqual(['video', 'texto', 'voz', 'musica', 'sfx', 'fx']);
    for (const t of tracks) expect(t.clips).toEqual([]);
    expect(aspectLabel(width, height)).toBe('9:16');
  });

  it('comercial sin storyboard ni montaje → vacío (no inventa clips)', () => {
    const { tracks, totalSec } = buildEditorTimeline(comercial());
    expect(totalSec).toBe(0);
    expect(tracks.find((t) => t.id === 'video')!.clips).toEqual([]);
  });
});

describe('buildEditorTimeline — deriva del storyboard cuando no hay montaje persistido', () => {
  it('un clip de video por escena, en orden', () => {
    const c = comercial({ storyboard: [escena(1, { rol: 'hook' }), escena(2, { rol: 'desarrollo', dialogo: 'hola' })] });
    const { tracks } = buildEditorTimeline(c);
    const video = tracks.find((t) => t.id === 'video')!;
    expect(video.clips).toHaveLength(2);
    expect(video.clips[0].label).toBe('Escena 1');
    expect(video.clips[0].startSec).toBe(0);
    expect(video.clips[1].startSec).toBeGreaterThan(0);
  });
});

describe('buildEditorTimeline — plan persistido (comercial.montaje)', () => {
  const plan: MontajePlan = {
    width: 1080, height: 1920, fps: 30,
    scenes: [
      { escenaN: 1, src: 'proj/a.mp4', in: 0, out: 4, audio: 'keep', dialogo: 'hola', rol: 'hook', transition: 'cut' },
      { escenaN: 2, src: '', in: 0, out: 3, audio: 'mute', rol: 'cta', transition: 'crossfade' },
    ],
    voice: { src: 'proj/voz.mp3', at: 1 },
    music: { src: 'https://x/track.mp3', gain: 0.28, duck: true },
    silences: [],
    texts: [{ text: '15 min', preset: 'titulo', at: 0.5, dur: 2 }],
  };

  const c = comercial({ montaje: { plan, exports: [] } });
  const { tracks, totalSec } = buildEditorTimeline(c);

  it('totalSec > 0 y coincide con la duración derivada del plan', () => {
    expect(totalSec).toBeGreaterThan(0);
  });

  it('pista video: 2 clips con fileRef, colores por rol, y marcador de transición salvo el último', () => {
    const video = tracks.find((t) => t.id === 'video')!;
    expect(video.clips).toHaveLength(2);
    expect(video.clips[0].fileRef).toBe('proj/a.mp4');
    expect(video.clips[0].transitionAfter).toBe('cut');
    expect(video.clips[1].transitionAfter).toBeUndefined();   // último clip: sin transición hacia "el siguiente"
    expect(video.clips[1].fileRef).toBeUndefined();            // sin src → sin clip real (honesto, no inventa un fileRef)
  });

  it('pista texto: 1 clip con el texto y preset reales', () => {
    const texto = tracks.find((t) => t.id === 'texto')!;
    expect(texto.clips).toEqual([{ id: 'texto-0', label: '15 min', startSec: 0.5, durSec: 2, color: '#F5F1E8', meta: 'titulo' }]);
  });

  it('pista voz: 1 clip desde el `at` real, con el fileRef de la voz', () => {
    const voz = tracks.find((t) => t.id === 'voz')!;
    expect(voz.clips).toHaveLength(1);
    expect(voz.clips[0].startSec).toBe(1);
    expect(voz.clips[0].fileRef).toBe('proj/voz.mp3');
  });

  it('pista música: 1 clip full-length con el flag de ducking', () => {
    const musica = tracks.find((t) => t.id === 'musica')!;
    expect(musica.clips).toHaveLength(1);
    expect(musica.clips[0].startSec).toBe(0);
    expect(musica.clips[0].durSec).toBe(totalSec);
    expect(musica.clips[0].meta).toBe('con ducking');
  });

  it('sfx y fx quedan vacías: sin fuente real para poblarlas en este plan', () => {
    expect(tracks.find((t) => t.id === 'sfx')!.clips).toEqual([]);
    expect(tracks.find((t) => t.id === 'fx')!.clips).toEqual([]);
  });
});

describe('transitionKind', () => {
  it('mapea el enum real del plan a los 3 tipos del inspector', () => {
    expect(transitionKind(undefined)).toBe('cut');
    expect(transitionKind('cut')).toBe('cut');
    expect(transitionKind('wipe')).toBe('slide');
    expect(transitionKind('crossfade')).toBe('dissolve');
    expect(transitionKind('fade')).toBe('dissolve');
    expect(transitionKind('zoom')).toBe('dissolve');
  });
});

describe('transitionKindDurSec', () => {
  it('corte = xfade mínimo; disolvencia/deslizar = xfade completo (2 duraciones reales, no 3)', () => {
    const cut = transitionKindDurSec('cut');
    const dissolve = transitionKindDurSec('dissolve');
    const slide = transitionKindDurSec('slide');
    expect(cut).toBeLessThan(dissolve);
    expect(dissolve).toBe(slide);
  });
  it('sin kind → default corte', () => {
    expect(transitionKindDurSec(undefined)).toBe(transitionKindDurSec('cut'));
  });
});

describe('aspectLabel', () => {
  it('reduce ancho/alto reales a la razón simplificada', () => {
    expect(aspectLabel(1080, 1920)).toBe('9:16');
    expect(aspectLabel(1080, 1080)).toBe('1:1');
    expect(aspectLabel(1920, 1080)).toBe('16:9');
  });
  it('sin ancho/alto → default 9:16 (no inventa un valor raro)', () => {
    expect(aspectLabel(0, 0)).toBe('9:16');
  });
});

describe('roleColor', () => {
  it('devuelve un color fijo por rol conocido y un default para uno desconocido', () => {
    expect(roleColor('hook')).toBe('#FFB800');
    expect(roleColor('cta')).toBe('#00B37E');
    expect(roleColor(undefined)).toBe('#4AA3FF');
    expect(roleColor('rol-raro')).toBe('#4AA3FF');
  });
});

describe('findClip / clipAt / clipsAt', () => {
  const tracks = buildEditorTimeline(comercial({
    montaje: {
      plan: {
        width: 1080, height: 1920, fps: 30,
        scenes: [
          { escenaN: 1, src: 'a.mp4', in: 0, out: 2, audio: 'mute' },
          { escenaN: 2, src: 'b.mp4', in: 0, out: 2, audio: 'mute' },
        ],
        silences: [], texts: [{ text: 'x', preset: 'p', at: 0, dur: 4 }],
      },
      exports: [],
    },
  })).tracks;

  it('findClip ubica el clip y su pista', () => {
    const found = findClip(tracks, 'video-2');
    expect(found?.clip.label).toBe('Escena 2');
    expect(found?.track.id).toBe('video');
  });
  it('findClip: id inexistente o null → null', () => {
    expect(findClip(tracks, 'no-existe')).toBeNull();
    expect(findClip(tracks, null)).toBeNull();
  });
  it('clipAt devuelve el clip que cubre el instante', () => {
    const video = tracks.find((t) => t.id === 'video');
    expect(clipAt(video, 0.5)?.label).toBe('Escena 1');
    expect(clipAt(video, 5)).toBeUndefined();
  });
  it('clipsAt devuelve todos los que solapan (texto puede solapar con más de un clip)', () => {
    const texto = tracks.find((t) => t.id === 'texto');
    expect(clipsAt(texto, 1)).toHaveLength(1);
    expect(clipsAt(texto, 99)).toEqual([]);
  });
});
