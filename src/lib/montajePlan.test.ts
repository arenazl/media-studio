import { describe, it, expect } from 'vitest';
import {
  storyboardToMontaje, sceneStarts, totalDuration, duckRanges, silenceRanges, pickMusic,
  transitionDur, escenasToSlides, type MontajePlan,
} from './montajePlan';
import { nuevoComercial, type Comercial, type Escena, type Toma } from './comercial';

function comercialCon(escenas: Escena[], tomas: Toma[], mood?: string): Comercial {
  const c = nuevoComercial('demo', 'filmado');
  return { ...c, storyboard: escenas, rodaje: tomas, guion: { blocks: [], music: mood ? { mood } : undefined } };
}
const esc = (n: number, rol: Escena['rol'], durSec: number, dialogo = ''): Escena => ({
  n, rol, durSec, plano: '', angulo: '', personajes: [], accion: '', dialogo, continuidad: '',
});
const toma = (escenaN: number, durSec: number): Toma => ({ id: `t${escenaN}`, escenaN, fileRef: `ref-${escenaN}.mp4`, durSec });

describe('storyboardToMontaje', () => {
  it('setea audio keep en escenas con diálogo y mute en b-roll', () => {
    const c = comercialCon([esc(1, 'hook', 8, 'Hola'), esc(2, 'desarrollo', 6, '')], [toma(1, 8), toma(2, 6)]);
    const plan = storyboardToMontaje(c);
    expect(plan.scenes[0].audio).toBe('keep');
    expect(plan.scenes[1].audio).toBe('mute');
  });

  it('out = min(durSec de la escena, durSec real de la toma)', () => {
    const c = comercialCon([esc(1, 'hook', 8, 'Hola')], [toma(1, 5.2)]);
    expect(storyboardToMontaje(c).scenes[0].out).toBeCloseTo(5.2);
  });

  it('transición fade hacia el CTA, cut en el resto', () => {
    const c = comercialCon([esc(1, 'hook', 8, 'a'), esc(2, 'cta', 8, 'b')], [toma(1, 8), toma(2, 8)]);
    const plan = storyboardToMontaje(c);
    expect(plan.scenes[0].transition).toBe('fade');   // la 1 va hacia el cta
    expect(plan.scenes[1].transition).toBe('cut');
  });

  it('sugiere un silencio de 0.8s antes del gag', () => {
    const c = comercialCon([esc(1, 'hook', 8, 'a'), esc(2, 'gag', 5, ''), esc(3, 'cta', 8, 'c')], []);
    expect(storyboardToMontaje(c).silences).toEqual([{ antesDeEscena: 2, durSec: 0.8 }]);
  });

  it('usa el fileRef de la toma activa (la última importada)', () => {
    const c = comercialCon([esc(1, 'hook', 8, 'a')], [toma(1, 8), { id: 't1b', escenaN: 1, fileRef: 'nueva.mp4', durSec: 7 }]);
    expect(storyboardToMontaje(c).scenes[0].src).toBe('nueva.mp4');
  });
});

describe('derivación de tiempos', () => {
  const plan: MontajePlan = {
    width: 1080, height: 1920, fps: 30, silences: [], texts: [],
    scenes: [
      { escenaN: 1, src: 'a', in: 0, out: 8, audio: 'keep', dialogo: 'x', transition: 'cut' },
      { escenaN: 2, src: 'b', in: 0, out: 6, audio: 'mute', transition: 'fade' },
      { escenaN: 3, src: 'c', in: 0, out: 8, audio: 'keep', dialogo: 'y', transition: 'cut' },
    ],
  };

  it('sceneStarts acumula dur menos la transición', () => {
    const st = sceneStarts(plan);
    expect(st[0]).toBe(0);
    expect(st[1]).toBeCloseTo(8 - transitionDur('cut'));            // 8 - 0.03
    expect(st[2]).toBeCloseTo(8 - 0.03 + 6 - transitionDur('fade')); // + 6 - 0.4
  });

  it('totalDuration = suma de dur menos las transiciones internas', () => {
    expect(totalDuration(plan)).toBeCloseTo(8 + 6 + 8 - 0.03 - 0.4);
  });

  it('duckRanges cubre las escenas con diálogo (keep)', () => {
    const st = sceneStarts(plan);
    const ranges = duckRanges(plan);
    expect(ranges).toContainEqual([st[0], st[0] + 8]);   // escena 1 (diálogo)
    expect(ranges).toContainEqual([st[2], st[2] + 8]);   // escena 3 (diálogo)
    // la escena 2 (mute, sin diálogo) NO genera ducking
    expect(ranges.some((r) => Math.abs(r[0] - st[1]) < 0.001)).toBe(false);
  });

  it('duckRanges suma la voz en off (con su duración medida)', () => {
    const conVoz: MontajePlan = { ...plan, voice: { src: 'v', at: 2 } };
    const ranges = duckRanges(conVoz, 3);   // voz de 3s desde t=2 → [2,5]
    expect(ranges.some((r) => r[0] <= 2 && r[1] >= 5)).toBe(true);
  });

  it('silenceRanges deriva from/to del silencio antes de una escena', () => {
    const conSil: MontajePlan = { ...plan, silences: [{ antesDeEscena: 3, durSec: 0.8 }] };
    const st = sceneStarts(conSil);
    expect(silenceRanges(conSil)).toEqual([[st[2] - 0.8, st[2]]]);
  });
});

describe('animado', () => {
  const escAnim = (n: number, screen: string, title: string, resaltar: string, durSec = 4): Escena => ({
    n, rol: 'desarrollo', durSec, plano: '', angulo: '', personajes: [], accion: title, dialogo: '', continuidad: resaltar, screen,
  });

  it('escenasToSlides mapea screen/accion/continuidad → badge/title/accent', () => {
    const c = { ...nuevoComercial('a', 'animado'), storyboard: [escAnim(1, 'Trámites', 'Todo en el celu', 'celu', 5)] };
    expect(escenasToSlides(c)).toEqual([{ badge: 'Trámites', title: 'Todo en el celu', accent: 'celu', durSec: 5 }]);
  });

  it('storyboardToMontaje (animado) usa el renderRef como única escena, muteada', () => {
    const c = { ...nuevoComercial('a', 'animado'), renderRef: 'reel.mp4', storyboard: [escAnim(1, 'a', 't', 'x', 4), escAnim(2, 'b', 't2', 'y', 5)] };
    const plan = storyboardToMontaje(c);
    expect(plan.scenes).toHaveLength(1);
    expect(plan.scenes[0].src).toBe('reel.mp4');
    expect(plan.scenes[0].audio).toBe('mute');
    expect(plan.scenes[0].out).toBe(9);   // suma de durSec del storyboard
  });

  it('storyboardToMontaje (animado) sin renderRef aún → sin escenas', () => {
    const c = { ...nuevoComercial('a', 'animado'), storyboard: [escAnim(1, 'a', 't', 'x')] };
    expect(storyboardToMontaje(c).scenes).toHaveLength(0);
  });
});

describe('pickMusic', () => {
  it('mapea el mood a una categoría y devuelve un track', () => {
    expect(pickMusic('algo enérgico y divertido')).toBeTruthy();
    expect(pickMusic('épica y cinematográfica')).toBeTruthy();
    expect(pickMusic('tranquila y cálida')).toBeTruthy();
  });
  it('devuelve undefined si no hay mood o no matchea', () => {
    expect(pickMusic(undefined)).toBeUndefined();
    expect(pickMusic('xyzzy qwerty')).toBeUndefined();
  });
});
