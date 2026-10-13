import { describe, expect, it } from 'vitest';
import { derivarRender, volumenMusica } from './derivar';
import type { MontajePlan } from '../lib/montajePlan';

const base = (): MontajePlan => ({
  width: 1080, height: 1920, fps: 30,
  scenes: [
    { escenaN: 1, src: 'a.mp4', in: 0, out: 3, audio: 'mute', transition: 'cut' },
    { escenaN: 2, src: 'b.mp4', in: 0, out: 3, audio: 'mute' },
  ], silences: [], texts: [],
  music: { src: 'music.mp3', gain: 0.28, duck: false, fadeIn: 0, fadeOut: 0 },
});
describe('mezcla musical única en preview y Remotion', () => {
  it('reproduce montajes anteriores sin automatización', () => {
    const r = derivarRender(base());
    expect(volumenMusica(30, r)).toBeCloseTo(0.28, 4);
  });
  it('un drop de música llega al render', () => {
    const p = base();
    p.music!.automation = [
      { atSec: 0.8, gain: 0, rampSec: 0.2 },
      { atSec: 1.3, gain: 1, rampSec: 0.2 },
    ];
    const r = derivarRender(p);
    expect(volumenMusica(30, r)).toBe(0);
    expect(volumenMusica(45, r)).toBeCloseTo(0.28, 4);
  });
  it('los silencios anclados a escena SÍ silencian la música', () => {
    const p = base();
    p.silences = [{ antesDeEscena: 2, durSec: 0.5 }];
    const r = derivarRender(p);
    expect(volumenMusica(80, r)).toBe(0);
    expect(volumenMusica(105, r)).toBeCloseTo(0.28, 4);
  });
});
