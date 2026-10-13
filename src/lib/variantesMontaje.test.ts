// Las versiones del montaje (Lucas, 2026-10-12) y que el efecto soltado en el multipista llegue al plan que se renderiza.
import { describe, it, expect } from 'vitest';
import { aplicarVariante, variantesDisponibles } from './variantesMontaje';
import { buildEditorTimeline } from './editorTracks';
import { tracksToMontaje } from './montajeFromTracks';
import { dropLibItem } from './editorEdits';
import { derivarRender } from '../remotion/derivar';
import type { MontajePlan } from './montajePlan';

const mk = [
  { nombre: 'Contar el problema', fileRef: 'mk/contar.mp4', durSec: 6 },
  { nombre: 'Pagar la seña', fileRef: 'mk/sena.mp4', durSec: 6 },
];
const base = (): MontajePlan => ({
  width: 1080, height: 1920, fps: 30, silences: [], texts: [],
  scenes: [
    { escenaN: 1, src: 'p1.mp4', in: 0, out: 3, audio: 'keep', transition: 'cut', rol: 'hook' },
    { escenaN: 2, src: 'mk/contar.mp4', in: 0, out: 4, audio: 'mute', transition: 'crossfade', rol: 'desarrollo' },
    { escenaN: 3, src: 'p3.mp4', in: 0, out: 5, audio: 'keep', transition: 'cut', rol: 'giro', inserts: [{ atSec: 1, durSec: 2, src: 'mk/x.png' }] },
  ],
  music: { src: 'musica/a.mp3', gain: 0.28, duck: true, generada: true, durSec: 20 },
});

describe('versiones del montaje', () => {
  it('Ritmo: cortes secos, flash donde cambia el material y la música más arriba', () => {
    const p = aplicarVariante(base(), 'ritmo', mk);
    expect(p.scenes.slice(0, 2).map((s) => s.transition)).toEqual(['cut', 'cut']);
    expect(p.scenes.map((s) => s.effect)).toEqual([undefined, 'flash', 'flash']);
    expect(p.music?.gain).toBe(0.36);
  });
  it('Voz al frente: sin pantallas encima de la persona y la música bien abajo', () => {
    const p = aplicarVariante(base(), 'voz', mk);
    expect(p.scenes.every((s) => !s.inserts)).toBe(true);
    expect(p.music?.gain).toBe(0.16);
  });
  it('Más app: suma las pantallas que sobran entre las tomas, nunca antes del gancho; sólo si sobran', () => {
    const p = aplicarVariante(base(), 'app', mk);
    expect(p.scenes[0].src).toBe('p1.mp4');
    expect(p.scenes.some((s) => s.src === 'mk/sena.mp4')).toBe(true);
    expect(variantesDisponibles(base(), mk).map((v) => v.id)).toContain('app');
    expect(variantesDisponibles(base(), mk.slice(0, 1)).map((v) => v.id)).not.toContain('app');
  });
  it('la del montajista (o ninguna) deja el plan como está', () => {
    expect(aplicarVariante(base(), 'montajista', mk)).toEqual(base());
    expect(aplicarVariante(base(), undefined, mk)).toEqual(base());
  });
});

describe('efectos: del multipista al render', () => {
  it('un efecto soltado en la escena del cabezal llega al plan y al render', () => {
    const comercial = { montaje: { plan: base(), exports: [] } } as never;
    const tracks = buildEditorTimeline(comercial).tracks;
    const con = dropLibItem(tracks, { id: 'fx-zoom', label: 'Zoom rápido', color: '#fff' }, 0.5);
    const plan = tracksToMontaje(con, base());
    expect(plan.scenes[0].effect).toBe('zoom');
    expect(derivarRender(plan).segments[0].efecto).toBe('zoom');
    // y si se borra el clip del efecto, la escena queda sin efecto
    const sin = con.map((t) => (t.id === 'fx' ? { ...t, clips: t.clips.filter((c) => !c.id.startsWith('fx-')) } : t));
    expect(tracksToMontaje(sin, plan).scenes[0].effect).toBeUndefined();
  });
});
