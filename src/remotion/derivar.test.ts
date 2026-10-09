import { describe, expect, it } from 'vitest';
import { derivarRender, paginarSubtitulos, resolverSrc } from './derivar';
import type { MontajePlan } from '../lib/montajePlan';

const plan: MontajePlan = {
  width: 1080, height: 1920, fps: 30, silences: [], texts: [],
  music: { src: 'https://cdn/x.mp3', gain: 0.28, duck: true },
  logo: { src: '/api/media-kit/k/file/logo.svg' },
  endCard: { linea1: 'Armá tu evento', linea2: 'sinvueltasya.com.ar', durSec: 3.2, logoSrc: '/api/media-kit/k/file/logo.svg' },
  scenes: [
    { escenaN: 1, src: 'p/a.mp4', in: 0.3, out: 8.7, audio: 'keep', transition: 'cut', rol: 'hook', dialogo: 'x', punchFrom: 1, punchTo: 1.03,
      words: [{ text: 'Le', start: 0.66, end: 0.74 }, { text: 'transferí', start: 0.78, end: 1.18 }, { text: 'la', start: 1.22, end: 1.3 }, { text: 'seña.', start: 1.4, end: 1.76 }, { text: 'fuera', start: 9.0, end: 9.4 }] },
    { escenaN: 2, src: 'p/b.mp4', in: 0.15, out: 9.75, audio: 'keep', transition: 'cut', rol: 'desarrollo', dialogo: 'x', punchFrom: 1.06,
      inserts: [{ atSec: 3.8, durSec: 2.8, src: '/api/media-kit/k/file/screens/02.png', nombre: 'Perfil' }],
      words: [{ text: 'Ahora', start: 0.42, end: 0.7 }, { text: 'uso', start: 0.78, end: 0.96 }] },
  ],
};

describe('resolverSrc', () => {
  it('deja absolutas y data URLs, prefija rutas de API y manda los fileRef al storage', () => {
    expect(resolverSrc('http://localhost:5301', 'https://cdn/x.mp3')).toBe('https://cdn/x.mp3');
    expect(resolverSrc('http://localhost:5301', '/api/media-kit/k/file/logo.svg')).toBe('http://localhost:5301/api/media-kit/k/file/logo.svg');
    expect(resolverSrc('', 'media-studio/p/a b.mp4')).toBe('/api/storage/media-studio/p/a%20b.mp4');
    expect(resolverSrc('', '')).toBe('');
  });
});

describe('derivarRender', () => {
  it('segmentos en cuadros con los recortes y las escalas del plan', () => {
    const r = derivarRender(plan, 'http://localhost:5301');
    expect(r.fps).toBe(30);
    expect(r.segments.length).toBe(2);
    expect(r.segments[0]).toMatchObject({ from: 0, dur: 252, startFrom: 9, scaleFrom: 1, scaleTo: 1.03, audio: 'keep' });
    // el corte seco resta 0.03 s (1 cuadro) como en la cadena xfade, igual que el editor
    expect(r.segments[1].from).toBe(Math.round((8.4 - 0.03) * 30));
    expect(r.segments[1]).toMatchObject({ dur: 288, startFrom: 5, scaleFrom: 1.06, scaleTo: 1.06 });
    expect(r.segments[0].src).toBe('http://localhost:5301/api/storage/p/a.mp4');
  });
  it('palabras fuera del recorte no entran; las páginas no pisan el corte', () => {
    const r = derivarRender(plan);
    const textos = r.captions.map((p) => p.words.map((w) => w.text).join(' '));
    expect(textos).toEqual(['Le transferí la seña.', 'Ahora uso']);
    // aunque la última palabra de un clip y la primera del siguiente estén pegadas, no se juntan en una página
    const pegado = derivarRender({ ...plan, scenes: [
      { ...plan.scenes[0], words: [{ text: 'el', start: 8.1, end: 8.2 }, { text: 'DJ', start: 8.3, end: 8.6 }] },
      { ...plan.scenes[1], words: [{ text: 'Ahora', start: 0.2, end: 0.5 }] },
    ] });
    expect(pegado.captions.map((p) => p.words.map((w) => w.text).join(' '))).toEqual(['el DJ', 'Ahora']);
    expect(r.captions[0].startMs).toBe(Math.round((0.66 - 0.3) * 1000) - 80);
    const finSeg1 = Math.round((r.segments[0].from + r.segments[0].dur) / 30 * 1000);
    expect(r.captions[0].endMs).toBeLessThanOrEqual(finSeg1);
    expect(r.captions[1].startMs).toBeGreaterThanOrEqual(Math.round(r.segments[1].from / 30 * 1000) - 80);
  });
  it('insertos y placa final en cuadros absolutos; el total incluye la placa', () => {
    const r = derivarRender(plan);
    expect(r.inserts[0]).toMatchObject({ from: r.segments[1].from + Math.round((3.8 - 0.15) * 30), dur: 84, nombre: 'Perfil' });
    const finClips = Math.round((8.4 + 9.6 - 0.03) * 30);
    expect(r.endCard).toMatchObject({ from: finClips - 6, dur: 6 + 96, linea1: 'Armá tu evento' });
    expect(r.totalFrames).toBe(finClips - 6 + 6 + 96);
    expect(r.music?.duckFrames.length).toBe(1);
    expect(r.logo?.src).toBe('/api/media-kit/k/file/logo.svg');
  });
  it('sin placa, el total es el fin de los clips; sin escenas ni placa, un cuadro', () => {
    const r = derivarRender({ ...plan, endCard: undefined });
    expect(r.totalFrames).toBe(Math.round((8.4 + 9.6 - 0.03) * 30));
    expect(derivarRender({ ...plan, scenes: [], endCard: undefined }).totalFrames).toBe(1);
    expect(derivarRender({ ...plan, scenes: [] }).totalFrames).toBe(6 + 96);   // sólo la placa
  });
});

describe('paginarSubtitulos', () => {
  it('cada página empieza 80 ms antes de su primera palabra y termina antes de la siguiente', () => {
    const pags = paginarSubtitulos([
      { text: 'Hola.', startMs: 1000, endMs: 1300 },
      { text: 'Chau', startMs: 1500, endMs: 1800 },
    ]);
    expect(pags.length).toBe(2);
    expect(pags[0]).toMatchObject({ startMs: 920, endMs: 1420 });
    expect(pags[1]).toMatchObject({ startMs: 1420, endMs: 2150 });
  });
});
