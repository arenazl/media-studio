import { describe, it, expect } from 'vitest';
import { addCut, removeCut, segmentsFromCuts, cutsFromSegments, segDur, slicePeaks } from './audioSlice';

describe('addCut', () => {
  it('inserta un corte válido y ordena', () => {
    expect(addCut([], 5, 10)).toEqual([5]);
    expect(addCut([6], 3, 10)).toEqual([3, 6]);
  });
  it('rechaza cortes fuera de (0,dur)', () => {
    expect(addCut([], 0, 10)).toEqual([]);
    expect(addCut([], 10, 10)).toEqual([]);
    expect(addCut([], 9.95, 10)).toEqual([]); // pegado al borde (minGap)
  });
  it('rechaza cortes pegados a otro (minGap)', () => {
    expect(addCut([5], 5.1, 10)).toEqual([5]);
    expect(addCut([5], 5.2, 10)).toEqual([5, 5.2]);
  });
  it('es inmutable', () => {
    const c = [4];
    addCut(c, 7, 10);
    expect(c).toEqual([4]);
  });
});

describe('removeCut', () => {
  it('saca el corte i', () => {
    expect(removeCut([2, 5, 8], 1)).toEqual([2, 8]);
  });
});

describe('segmentsFromCuts', () => {
  it('sin cortes → 1 segmento de 0..dur', () => {
    expect(segmentsFromCuts([], 10)).toEqual([
      { id: 'seg-0', label: 'Parte 1', startSec: 0, endSec: 10 },
    ]);
  });
  it('2 cortes → 3 segmentos contiguos', () => {
    const segs = segmentsFromCuts([3, 7], 10);
    expect(segs.map((s) => [s.startSec, s.endSec])).toEqual([[0, 3], [3, 7], [7, 10]]);
    expect(segs.map((s) => s.label)).toEqual(['Parte 1', 'Parte 2', 'Parte 3']);
  });
  it('respeta nombres por índice', () => {
    const segs = segmentsFromCuts([5], 10, { 0: 'Hook', 1: 'CTA' });
    expect(segs.map((s) => s.label)).toEqual(['Hook', 'CTA']);
  });
  it('descarta cortes fuera de rango y desordenados', () => {
    const segs = segmentsFromCuts([7, -1, 3, 99], 10);
    expect(segs.map((s) => [s.startSec, s.endSec])).toEqual([[0, 3], [3, 7], [7, 10]]);
  });
  it('dur inválida → vacío', () => {
    expect(segmentsFromCuts([3], 0)).toEqual([]);
  });
});

describe('cutsFromSegments (inverso)', () => {
  it('recupera los cortes internos', () => {
    const segs = segmentsFromCuts([3, 7], 10);
    expect(cutsFromSegments(segs)).toEqual([3, 7]);
  });
  it('un solo segmento → sin cortes', () => {
    expect(cutsFromSegments(segmentsFromCuts([], 10))).toEqual([]);
  });
});

describe('segDur', () => {
  it('duración del segmento (no negativa)', () => {
    expect(segDur({ startSec: 2, endSec: 6.5 })).toBe(4.5);
    expect(segDur({ startSec: 5, endSec: 1 })).toBe(0);
  });
});

describe('slicePeaks', () => {
  const peaks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]; // 10 picos, dur 10s

  it('recorta la mitad central', () => {
    expect(slicePeaks(peaks, 10, 2.5, 7.5)).toEqual([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
  });
  it('primer cuarto', () => {
    expect(slicePeaks(peaks, 10, 0, 2.5)).toEqual([0, 0.1, 0.2]);
  });
  it('siempre devuelve al menos 1 pico', () => {
    expect(slicePeaks(peaks, 10, 5, 5).length).toBeGreaterThanOrEqual(1);
  });
  it('vacío si no hay peaks o dur inválida', () => {
    expect(slicePeaks([], 10, 0, 5)).toEqual([]);
    expect(slicePeaks(peaks, 0, 0, 5)).toEqual([]);
  });
});
