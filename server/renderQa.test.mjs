import { describe, expect, it } from 'vitest';
import { parseAudioQa, parseVideoQa } from './renderQa.mjs';

describe('QA técnico de MP4', () => {
  it('extrae loudness y true peak del resumen final y silencios de ffmpeg', () => {
    const log = 'silence_start: 0.25\nsilence_end: 1.65 | silence_duration: 1.4\nIntegrated loudness:\n I: -14.1 LUFS\nThreshold: -24 LUFS\nTrue peak:\n Peak: -1.8 dBFS\n';
    expect(parseAudioQa(log)).toMatchObject({ integratedLufs: -14.1, truePeakDbfs: -1.8, silencios: [{ desde: 0.25, hasta: 1.65 }] });
  });
  it('marca detecciones negras como observaciones y no confunde un video sin negro', () => {
    expect(parseVideoQa('foo black_start:1.3 black_end:2.1 black_duration:0.8 bar')).toEqual([{ desde: 1.3, hasta: 2.1, durSec: 0.8 }]);
    expect(parseVideoQa('sin blackdetect')).toEqual([]);
  });
});
