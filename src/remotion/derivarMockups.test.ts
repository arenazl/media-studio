import { describe, expect, it } from 'vitest';
import { derivarMockups, formatearCifra } from './derivarMockups';
import type { PlanMockup } from '../lib/montajePlan';

const plan: PlanMockup = {
  width: 1080, height: 1920, fps: 30,
  escenas: [
    { n: 1, tipo: 'titulo', durSec: 3, titulo: 'Tu gestión, en números.', resaltar: 'en números' },
    { n: 2, tipo: 'pantalla', durSec: 4.5, titulo: 'Todo en una pantalla', badge: 'Dashboard', captura: { src: 'p/dash.png', alto: false } },
  ],
  placa: { linea1: 'Pedí una demo', linea2: 'munify.com.ar', durSec: 3.2, logoSrc: '/api/media-kit/k/file/logo.svg' },
  marca: { nombre: 'Munify', logoSrc: 'https://app.munify.com.ar/brand/Munify.svg', sitio: 'munify.com.ar', estilo: { primario: '#18a24d', acento: '#F59E0B', fondo: '#0B0A14', texto: '#fff' } },
};

describe('derivarMockups', () => {
  it('escenas consecutivas en cuadros, placa solapada 6 cuadros, URLs resueltas', () => {
    const r = derivarMockups(plan, 'http://localhost:5301');
    expect(r.escenas.map((e) => [e.from, e.dur])).toEqual([[0, 90], [90, 135]]);
    expect(r.escenas[1].captura?.src).toBe('http://localhost:5301/api/storage/p/dash.png');
    expect(r.placa).toMatchObject({ from: 225 - 6, dur: 6 + 96, logoSrc: 'http://localhost:5301/api/media-kit/k/file/logo.svg' });
    expect(r.totalFrames).toBe(225 - 6 + 6 + 96);
    expect(r.marca.logoSrc).toBe('https://app.munify.com.ar/brand/Munify.svg');
  });
  it('sin placa termina con la última escena; sin escenas, un cuadro', () => {
    expect(derivarMockups({ ...plan, placa: undefined }).totalFrames).toBe(225);
    expect(derivarMockups({ ...plan, escenas: [], placa: undefined }).totalFrames).toBe(1);
  });
});

describe('formatearCifra', () => {
  it('cuenta con el formato del texto original', () => {
    expect(formatearCifra('1.229', 0)).toBe('0');
    expect(formatearCifra('1.229', 1)).toBe('1.229');
    expect(formatearCifra('4.280.000', 0.5)).toBe('2.140.000');
    expect(formatearCifra('87%', 0.5)).toBe('44%');
    expect(formatearCifra('12', 1)).toBe('12');
  });
});
