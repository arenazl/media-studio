import { describe, expect, it } from 'vitest';
import { aplicarPropuestaMontaje, factorMusica, intervalosMusica, validarPropuestaMontaje } from './direccionMontaje';
import { derivarRender, volumenMusica } from '../remotion/derivar';
import type { MontajePlan } from './montajePlan';
import { nuevoComercial } from './comercial';
import { buildEditorTimeline } from './editorTracks';
import { tracksToMontaje } from './montajeFromTracks';

function base(): MontajePlan {
  return {
    width: 1080, height: 1920, fps: 30, motor: 'remotion',
    scenes: [
      { escenaN: 1, src: 'intro.mp4', in: 0, out: 3, audio: 'keep', dialogo: 'Probamos un ejemplo', inserts: [{ atSec: 1, durSec: 1.1, src: 'pantalla.png' }], transition: 'cut' },
      { escenaN: 2, src: 'giro.mp4', in: 0, out: 3, audio: 'mute', transition: 'cut' },
      { escenaN: 3, src: 'fin.mp4', in: 0, out: 2, audio: 'keep', dialogo: 'El cierre', transition: 'cut' },
    ],
    music: { src: 'musica.mp3', gain: 0.28, duck: true },
    silences: [], texts: [],
    sfx: [{ src: 'whoosh.mp3', at: 3.05, durSec: 0.3, nombre: 'Whoosh', gain: 0.5 }],
  };
}

describe('Director de montaje: decisiones ejecutables', () => {
  it('rechaza decisiones fuera del vocabulario', () => {
    expect(validarPropuestaMontaje({ diagnostico: 'A', decisiones: [{ recurso: 'inventar_escena', escenaN: 2, cuando: 'inicio', durSec: 0.3, motivo: 'Nada' }] })).toContain('decisiones[0].recurso no admitido');
  });
  it('aplica una pausa musical, corta una transición y permite revelar la cara', () => {
    const original = base();
    const result = aplicarPropuestaMontaje(original, {
      diagnostico: 'Pausa antes de la revelación',
      decisiones: [
        { recurso: 'music_drop', escenaN: 2, cuando: 'antes', durSec: 0.45, motivo: 'La escena siguiente revela el cambio' },
        { recurso: 'dissolve', escenaN: 2, cuando: 'inicio', durSec: 0, motivo: 'Cambio de lugar' },
        { recurso: 'show_face', escenaN: 1, cuando: 'inicio', durSec: 0, motivo: 'La expresión comunica' },
      ],
    });
    expect(result.aplicadas).toHaveLength(3);
    expect(result.plan.musicCues).toEqual([{ escenaN: 2, cuando: 'antes', durSec: 0.45, nivel: 0, motivo: 'La escena siguiente revela el cambio' }]);
    expect(result.plan.scenes[0].transition).toBe('crossfade');
    expect(result.plan.scenes[0].inserts).toBeUndefined();
    expect(original.scenes[0].inserts).toHaveLength(1);
    expect(original.musicCues).toBeUndefined();
  });
  it('no inventa material ni música faltante', () => {
    const original = base();
    original.music = undefined;
    const result = aplicarPropuestaMontaje(original, {
      diagnostico: 'Sin música',
      decisiones: [
        { recurso: 'music_drop', escenaN: 2, cuando: 'inicio', durSec: 0.5, motivo: 'Pausa' },
        { recurso: 'cut', escenaN: 999, cuando: 'inicio', durSec: 0, motivo: 'No existe' },
      ],
    });
    expect(result.aplicadas).toHaveLength(0);
    expect(result.rechazadas).toHaveLength(2);
  });
  it('la pausa está anclada a escenaN cuando cambian las duraciones', () => {
    const p = base();
    p.musicCues = [{ escenaN: 2, cuando: 'antes', durSec: 0.4, nivel: 0 }];
    const x = intervalosMusica(p)[0];
    const update = { ...p, scenes: p.scenes.map((s, i) => i === 0 ? { ...s, out: 4 } : s) };
    expect(intervalosMusica(update)[0].desde - x.desde).toBeCloseTo(1, 2);
  });
  it('las pausas legacy ahora también se ejecutan en Remotion', () => {
    const p = base();
    p.silences = [{ antesDeEscena: 2, durSec: 0.5 }];
    const r = derivarRender(p);
    expect(r.music?.cues).toHaveLength(1);
    const cue = r.music!.cues[0];
    const f = Math.round(((cue.desde + cue.hasta) / 2) * r.fps);
    expect(volumenMusica(f, r)).toBeLessThan(0.005);
  });
  it('el ducking entra y sale con rampas, sin saltos a cuadro', () => {
    const a = factorMusica(0.001, [], [[1, 2]], true);
    const b = factorMusica(0.95, [], [[1, 2]], true);
    const c = factorMusica(1.5, [], [[1, 2]], true);
    const d = factorMusica(2.1, [], [[1, 2]], true);
    expect(a).toBeCloseTo(1, 2);
    expect(b).toBeGreaterThan(c);
    expect(c).toBeCloseTo(0.35, 2);
    expect(d).toBeGreaterThan(c);
  });
  it('el editor multipista conserva la automatización de la IA al guardar las pistas', () => {
    const p = base();
    p.musicCues = [{ escenaN: 2, cuando: 'antes', durSec: 0.4, nivel: 0, motivo: 'reacción real' }];
    const comercial = { ...nuevoComercial('test', 'filmado'), montaje: { plan: p, exports: [] } };
    const tracks = buildEditorTimeline(comercial).tracks;
    const roundTrip = tracksToMontaje(tracks, p);
    expect(roundTrip.musicCues).toEqual(p.musicCues);
  });

  it('reduce o elimina música, no la voz del clip', () => {
    const p = base();
    p.musicCues = [{ escenaN: 2, cuando: 'inicio', durSec: 0.5, nivel: 0 }];
    const r = derivarRender(p);
    expect(r.segments[0].audio).toBe('keep');
    const cue = r.music!.cues[0];
    const midpointFrame = Math.round((cue.desde + cue.hasta) * 0.5 * r.fps);
    expect(volumenMusica(midpointFrame, r)).toBeLessThan(0.005);
  });
});
