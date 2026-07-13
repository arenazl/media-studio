// WO-5: auto-armado determinístico. Puro: mismos insumos → mismo plan. NO inventa texto (solo hook/
// CTA reales de publicacion); sin esos datos → sin textos.
import { describe, it, expect } from 'vitest';
import { autoArmarPlan } from './autoArmar';
import { nuevoComercial, type Comercial, type Escena, type PublishPack, type Toma } from './comercial';
import type { ProjectReel } from './projects';

const esc = (n: number, rol: Escena['rol'], durSec: number, dialogo = ''): Escena => ({
  n, rol, durSec, plano: '', angulo: '', personajes: [], accion: '', dialogo, continuidad: '',
});
const toma = (escenaN: number, durSec: number): Toma => ({ id: `t${escenaN}`, escenaN, fileRef: `ref-${escenaN}.mp4`, durSec });

function comFilmado(pub?: PublishPack): Comercial {
  return {
    ...nuevoComercial('demo', 'filmado'),
    storyboard: [esc(1, 'hook', 8, 'Hola'), esc(2, 'cta', 6, 'Sumate')],
    rodaje: [toma(1, 8), toma(2, 6)],
    guion: { blocks: [], music: { mood: 'energética' } },
    publicacion: pub,
  };
}
const reelConVoz = (audioRef?: string): ProjectReel => ({
  id: 'r1', nombre: 'r', frases: 0, guion: [],
  voiceConfig: audioRef ? { voice_id: 'v', stability: 0.4, similarity: 0.8, style: 0.5, speed: 1, model: 'eleven_v3', audioRef } : undefined,
});

describe('autoArmarPlan — voz', () => {
  it('con voz grabada → voice apunta al audioRef, at 0', () => {
    const plan = autoArmarPlan(comFilmado(), reelConVoz('proj/voz.mp3'));
    expect(plan.voice).toEqual({ src: 'proj/voz.mp3', at: 0 });
  });
  it('sin voz → sin voice (o el de base)', () => {
    const plan = autoArmarPlan(comFilmado(), reelConVoz(undefined));
    expect(plan.voice).toBeUndefined();
  });
});

describe('autoArmarPlan — textos SOLO de datos reales', () => {
  const pub: PublishPack = { hookOnScreen: 'El caos se acabó', caption: 'c', hashtags: [], cta: 'Descargá la app' };
  it('con publicacion → hook en escena 1 + CTA en la escena cta', () => {
    const plan = autoArmarPlan(comFilmado(pub));
    const hook = plan.texts.find((t) => t.preset === 'titulo');
    const cta = plan.texts.find((t) => t.preset === 'cta');
    expect(hook?.text).toBe('El caos se acabó');
    expect(hook?.at).toBe(0.3);
    expect(cta?.text).toBe('Descargá la app');
  });
  it('el TEXTO nunca se inventa: sin publicacion → sin textos', () => {
    const plan = autoArmarPlan(comFilmado(undefined));
    expect(plan.texts).toEqual([]);
  });
});

describe('autoArmarPlan — tipos y estructura', () => {
  it('filmado: arma escenas con clips del rodaje', () => {
    const plan = autoArmarPlan(comFilmado());
    expect(plan.scenes.length).toBe(2);
    expect(plan.scenes[0].src).toBe('ref-1.mp4');
  });
  it('animado: usa el renderRef como única escena', () => {
    const c: Comercial = { ...nuevoComercial('a', 'animado'), storyboard: [esc(1, 'hook', 4, '')], renderRef: 'r.mp4' };
    const plan = autoArmarPlan(c);
    expect(plan.scenes).toHaveLength(1);
    expect(plan.scenes[0].src).toBe('r.mp4');
  });
});

describe('autoArmarPlan — idempotencia', () => {
  it('correrlo dos veces da el MISMO plan', () => {
    const pub: PublishPack = { hookOnScreen: 'Hook', caption: '', hashtags: [], cta: 'CTA' };
    const c = comFilmado(pub);
    const r = reelConVoz('v.mp3');
    expect(autoArmarPlan(c, r)).toEqual(autoArmarPlan(c, r));
  });
});
