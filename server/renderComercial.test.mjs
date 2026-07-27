import { describe, it, expect } from 'vitest';
import {
  renderComercial, sceneStarts, totalDuration, duckRanges, escDrawText,
} from './renderComercial.mjs';
import fs from 'node:fs';

describe('renderComercial — WO-K5 (Render v1.5)', () => {
  it('escDrawText mecha correctamente apóstrofes y caracteres especiales de ffmpeg', () => {
    expect(escDrawText("probá 'sin vueltas' ¡ya!")).toBe("probá '\\''sin vueltas'\\'' ¡ya!");
  });

  it('sceneStarts y totalDuration calculan correctamente duraciones con transiciones', () => {
    const scenes = [
      { escenaN: 1, in: 0, out: 5, transition: 'cut' },
      { escenaN: 2, in: 0, out: 4, transition: 'fade' },
      { escenaN: 3, in: 0, out: 3, transition: 'cut' },
    ];
    const starts = sceneStarts(scenes);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBeCloseTo(4.97); // 5 - 0.03
    expect(starts[2]).toBeCloseTo(8.57); // 4.97 + 4 - 0.4
    expect(totalDuration(scenes)).toBeCloseTo(11.57); // 4.97 + 3.6 + 3
  });

  it('duckRanges detecta correctamente diálogos', () => {
    const scenes = [
      { escenaN: 1, in: 0, out: 5, audio: 'keep', dialogo: 'Vení a cotizar' },
      { escenaN: 2, in: 0, out: 4, audio: 'mute', dialogo: '' },
    ];
    const starts = sceneStarts(scenes);
    const ducks = duckRanges(scenes, starts, null, 0);
    expect(ducks).toHaveLength(1);
    expect(ducks[0]).toEqual([0, 5]);
  });

  it('renderComercial arma filter_complex con zoompan, copy y loudnorm', async () => {
    let executedArgs = [];
    const runFfmpegMock = async (args) => {
      executedArgs = args;
      const outFile = args[args.length - 1];
      fs.writeFileSync(outFile, Buffer.from('mock mp4 content'));
    };

    const mockPlan = {
      width: 1080,
      height: 1920,
      fps: 30,
      mediaKitId: 'eventmarker',
      scenes: [
        {
          escenaN: 1,
          archivoCaptura: 'screens/01-home.png',
          in: 0,
          out: 4,
          dialogo: 'Conocé las mejores opciones para tu fiesta.',
          zonaClave: 'tercio superior',
          audio: 'keep',
          transition: 'cut',
        },
      ],
      music: { src: 'music.mp3', gain: 0.2, duck: true },
    };

    const result = await renderComercial(mockPlan, {
      runFfmpeg: runFfmpegMock,
      storageDir: 'D:/Code/media-studio/server/storage',
      probeDuration: async () => 3.5,
    });

    expect(result).toBeDefined();
    const filterComplexStr = executedArgs[executedArgs.indexOf('-filter_complex') + 1];

    // 1. Debe incluir zoompan para la captura del kit
    expect(filterComplexStr).toContain('zoompan=z=');

    // 2. Debe usar dialogo (copy) en drawtext
    expect(filterComplexStr).toContain('drawtext=');
    expect(filterComplexStr).toContain('Conocé las mejores opciones');

    // 3. Debe incluir normalización de audio loudnorm
    expect(filterComplexStr).toContain('loudnorm=I=-16');
  });

  it('retrocompatibilidad: renderiza planos legacy con clips sin romper', async () => {
    let executedArgs = [];
    const runFfmpegMock = async (args) => {
      executedArgs = args;
      const outFile = args[args.length - 1];
      fs.writeFileSync(outFile, Buffer.from('mock mp4 content'));
    };

    const tmpDir = fs.mkdtempSync('test-clip-');
    const dummyClip = `${tmpDir}/clip1.mp4`;
    fs.writeFileSync(dummyClip, Buffer.from('video data'));

    try {
      const mockPlanLegacy = {
        width: 1080,
        height: 1920,
        fps: 30,
        scenes: [
          {
            escenaN: 1,
            src: dummyClip,
            in: 0,
            out: 5,
            audio: 'keep',
            transition: 'cut',
          },
        ],
      };

      const result = await renderComercial(mockPlanLegacy, {
        runFfmpeg: runFfmpegMock,
        storageDir: process.cwd(),
        probeDuration: async () => 5.0,
      });

      expect(result).toBeDefined();
      const filterComplexStr = executedArgs[executedArgs.indexOf('-filter_complex') + 1];
      expect(filterComplexStr).toContain('scale=1080:1920');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
