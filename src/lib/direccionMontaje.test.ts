import { describe, expect, it } from 'vitest';
import { aplicarDireccionMontaje, nivelAutomatizacion } from './direccionMontaje';
import type { MontajePlan } from './montajePlan';

const plan = (): MontajePlan => ({
  width: 1080, height: 1920, fps: 30,
  scenes: [
    { escenaN: 1, src: 'a.mp4', in: 0, out: 3, audio: 'keep', transition: 'cut' },
    { escenaN: 2, src: 'b.mp4', in: 0, out: 4, audio: 'keep', transition: 'cut' },
    { escenaN: 3, src: 'c.mp4', in: 0, out: 3, audio: 'mute' },
  ], silences: [], texts: [], music: { src: 'music.mp3', gain: 0.28, duck: true },
});
describe('director de montaje ejecutable', () => {
  it('sin puntos no altera el sonido legacy', () => expect(nivelAutomatizacion(10)).toBe(1));
  it('calcula silencio y regreso con rampas', () => {
    const r = aplicarDireccionMontaje(plan(), { diagnostico: '', decisiones: [{ escenaN: 2, recurso: 'pausa_musical', durSec: 0.4, motivo: 'reacción' }] });
    const ps = r.plan.music!.automation!;
    expect(r.aplicadas).toHaveLength(1);
    expect(nivelAutomatizacion(2.99, ps)).toBe(0);
    expect(nivelAutomatizacion(3.1, ps)).toBe(0);
    expect(nivelAutomatizacion(3.6, ps)).toBe(1);
  });
  it('no muta el plan original, conserva pistas y descarta referencias falsas', () => {
    const b = plan();
    const r = aplicarDireccionMontaje(b, { diagnostico: '', decisiones: [
      { escenaN: 1, recurso: 'fundido', motivo: 'continuidad' },
      { escenaN: 999, recurso: 'corte_seco', motivo: 'inexistente' },
    ] });
    expect(r.plan.scenes[0].transition).toBe('crossfade');
    expect(b.scenes[0].transition).toBe('cut');
    expect(r.descartadas).toHaveLength(1);
  });
  it('sin pista de música no inventa una', () => {
    const b = { ...plan(), music: undefined };
    const r = aplicarDireccionMontaje(b, { diagnostico: '', decisiones: [{ escenaN: 2, recurso: 'pausa_musical', motivo: 'aire' }] });
    expect(r.aplicadas).toHaveLength(0);
    expect(r.plan.music).toBeUndefined();
  });
});
