import { describe, it, expect } from 'vitest';
import { computePeaks, isAudioFile, formatClock, clamp01 } from './audioSource';

describe('computePeaks', () => {
  it('vacío cuando no hay muestras', () => {
    expect(computePeaks([], 10)).toEqual([]);
    expect(computePeaks([1, 2, 3], 0)).toEqual([]);
  });
  it('normaliza el pico máximo a 1', () => {
    const pk = computePeaks([0, 0.5, -1, 0.25], 4);
    expect(Math.max(...pk)).toBeCloseTo(1, 5);
    expect(pk.every((v) => v >= 0 && v <= 1)).toBe(true);
  });
  it('toma el máximo absoluto por bucket (rectifica negativos)', () => {
    // 4 muestras, 2 buckets → bucket0=max(|0|,|-0.8|)=0.8, bucket1=max(|0.4|,|0.2|)=0.4
    const pk = computePeaks([0, -0.8, 0.4, 0.2], 2);
    expect(pk).toEqual([1, 0.5]); // normalizado por 0.8
  });
  it('devuelve exactamente n picos', () => {
    expect(computePeaks(new Array(1000).fill(0.3), 260)).toHaveLength(260);
  });
});

describe('isAudioFile', () => {
  it('acepta por MIME', () => {
    expect(isAudioFile({ type: 'audio/mpeg', name: 'x' })).toBe(true);
    expect(isAudioFile({ type: 'audio/wav' })).toBe(true);
  });
  it('acepta por extensión cuando no hay MIME', () => {
    expect(isAudioFile({ type: '', name: 'locucion.mp3' })).toBe(true);
    expect(isAudioFile({ name: 'voz.WAV' })).toBe(true);
  });
  it('rechaza no-audio', () => {
    expect(isAudioFile({ type: 'video/mp4', name: 'clip.mp4' })).toBe(false);
    expect(isAudioFile({ type: '', name: 'foto.png' })).toBe(false);
    expect(isAudioFile({})).toBe(false);
  });
});

describe('formatClock', () => {
  it('formatea m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(8)).toBe('0:08');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(125.9)).toBe('2:05');
  });
  it('negativos/NaN → 0:00', () => {
    expect(formatClock(-3)).toBe('0:00');
    expect(formatClock(NaN)).toBe('0:00');
  });
});

describe('clamp01', () => {
  it('acota a 0..1', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(0.3)).toBe(0.3);
  });
});
