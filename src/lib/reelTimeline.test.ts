import { describe, it, expect } from 'vitest';
import {
  masterSecOf, rulerTicks, appendX, reflow, buildPlan, secToPx, pxToSec,
  effectAtPx, effectClass, presetLabel, TRANSITIONS, EFFECTS,
  textsAtPx, textPresetClass, TEXT_PRESETS,
  PX_PER_SEC, GAP, MIN_W, MUSIC_GAIN,
  type PhraseClip, type RefClip, type TrackKind,
} from './reelTimeline';

describe('secToPx / pxToSec', () => {
  it('escala 1s = 80px', () => { expect(secToPx(1)).toBe(80); expect(pxToSec(80)).toBe(1); });
  it('respeta el ancho mínimo', () => { expect(secToPx(0.01)).toBe(MIN_W); });
  it('son inversas para valores normales', () => { expect(pxToSec(secToPx(2.5))).toBeCloseTo(2.5); });
});

describe('masterSecOf', () => {
  it('tracks vacíos → mínimo (1px)', () => { expect(masterSecOf([[]])).toBeCloseTo(1 / PX_PER_SEC); });
  it('toma el fin del clip más a la derecha de cualquier track', () => {
    expect(masterSecOf([[{ x: 0, w: 80 }], [{ x: 160, w: 80 }]])).toBeCloseTo(3); // 240px / 80
  });
  it('ignora clips más cortos en otros tracks', () => {
    expect(masterSecOf([[{ x: 0, w: 400 }], [{ x: 0, w: 80 }]])).toBeCloseTo(5); // 400/80
  });
});

describe('rulerTicks', () => {
  it('step 1 para montajes cortos (≤8s)', () => { expect(rulerTicks(5)).toEqual([0, 1, 2, 3, 4, 5]); });
  it('step 2 para 8–20s', () => { expect(rulerTicks(12)).toEqual([0, 2, 4, 6, 8, 10, 12]); });
  it('step 5 para 20–45s', () => { expect(rulerTicks(30)).toEqual([0, 5, 10, 15, 20, 25, 30]); });
  it('step 10 para >45s', () => { expect(rulerTicks(60)).toEqual([0, 10, 20, 30, 40, 50, 60]); });
  it('siempre arranca en 0', () => { expect(rulerTicks(3)[0]).toBe(0); });
});

describe('appendX', () => {
  it('track vacío → 0', () => { expect(appendX([])).toBe(0); });
  it('después del último + GAP', () => { expect(appendX([{ x: 0, w: 80 }])).toBe(80 + GAP); });
  it('usa el clip que termina más a la derecha', () => {
    expect(appendX([{ x: 200, w: 50 }, { x: 0, w: 80 }])).toBe(250 + GAP);
  });
});

describe('reflow', () => {
  it('secuencia los clips por duración real, ordenados por x', () => {
    const out = reflow([{ p: 0, x: 50, w: 10 }, { p: 1, x: 0, w: 10 }] as PhraseClip[], () => 1);
    expect(out.map((c) => c.p)).toEqual([1, 0]);   // ordena por x: p1 (x0) primero
    expect(out[0].x).toBe(0);
    expect(out[0].w).toBe(80);                       // dur 1s → 80px
    expect(out[1].x).toBe(80 + GAP);
  });
  it('no muta la entrada', () => {
    const input = [{ p: 0, x: 99, w: 5 }] as PhraseClip[];
    reflow(input, () => 2);
    expect(input[0]).toEqual({ p: 0, x: 99, w: 5 });
  });
});

describe('buildPlan', () => {
  const base = {
    musicUrlOf: (id: string) => `m:${id}`,
    videoUrlOf: (id: string) => `v:${id}`,
    muted: new Set<TrackKind>(),
  };

  it('agenda voz SOLO para frases con audio generado', () => {
    const plan = buildPlan({
      ...base,
      audioTrack: [{ p: 0, x: 0, w: 160 }, { p: 1, x: 200, w: 80 }] as PhraseClip[],
      phraseAudio: { 0: { url: 'u0', dur: 1, peaks: [] } },   // la frase 1 todavía no tiene audio
      musicTrack: [], videoTrack: [],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ url: 'u0', kind: 'voice', at: 0, offset: 0 });
    expect(plan[0].dur).toBeCloseTo(1);   // min(160px→2s, dur 1s) = 1
  });

  it('el ancho del clip recorta la duración del audio', () => {
    const plan = buildPlan({
      ...base,
      audioTrack: [{ p: 0, x: 80, w: 40 }] as PhraseClip[],   // 40px → 0.5s
      phraseAudio: { 0: { url: 'u', dur: 3, peaks: [] } },
      musicTrack: [], videoTrack: [],
    });
    expect(plan[0].at).toBeCloseTo(1);    // x80 → 1s
    expect(plan[0].dur).toBeCloseTo(0.5); // recortado por el ancho
  });

  it('música: loop + ducking + gain bajo', () => {
    const plan = buildPlan({
      ...base, audioTrack: [], phraseAudio: {},
      musicTrack: [{ id: 'funk', x: 0, w: 800 }] as RefClip[], videoTrack: [],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ kind: 'music', url: 'm:funk', loop: true, duck: true, gain: MUSIC_GAIN });
  });

  it('respeta los canales muteados', () => {
    const plan = buildPlan({
      ...base, muted: new Set<TrackKind>(['audio']),
      audioTrack: [{ p: 0, x: 0, w: 80 }] as PhraseClip[], phraseAudio: { 0: { url: 'u', dur: 1, peaks: [] } },
      musicTrack: [{ id: 'x', x: 0, w: 80 }] as RefClip[], videoTrack: [],
    });
    expect(plan.find((c) => c.kind === 'voice')).toBeUndefined();
    expect(plan.find((c) => c.kind === 'music')).toBeDefined();
  });

  it('omite fuentes sin url resoluble', () => {
    const plan = buildPlan({
      ...base, videoUrlOf: () => undefined,
      audioTrack: [], phraseAudio: {}, musicTrack: [],
      videoTrack: [{ id: 'ghost', x: 0, w: 80 }] as RefClip[],
    });
    expect(plan).toHaveLength(0);
  });
});

describe('presets de transiciones / efectos', () => {
  it('tienen ids únicos y no están vacíos', () => {
    expect(TRANSITIONS.length).toBeGreaterThan(0);
    expect(EFFECTS.length).toBeGreaterThan(0);
    expect(new Set(TRANSITIONS.map((t) => t.id)).size).toBe(TRANSITIONS.length);
    expect(new Set(EFFECTS.map((e) => e.id)).size).toBe(EFFECTS.length);
  });
  it('presetLabel resuelve la etiqueta o cae al id', () => {
    expect(presetLabel(EFFECTS, 'bw')).toBe('B&N');
    expect(presetLabel(EFFECTS, 'desconocido')).toBe('desconocido');
  });
});

describe('effectAtPx', () => {
  const clips = [{ id: 'bw', x: 0, w: 160 }, { id: 'vignette', x: 80, w: 160 }];   // se solapan en [80,160)
  it('sin clips → null', () => { expect(effectAtPx([], 50)).toBeNull(); });
  it('toma el clip que cubre el playhead', () => { expect(effectAtPx(clips, 20)).toBe('bw'); });
  it('en el solapamiento gana el que arranca más a la derecha', () => { expect(effectAtPx(clips, 120)).toBe('vignette'); });
  it('en un gap → null', () => { expect(effectAtPx(clips, 400)).toBeNull(); });
});

describe('effectClass', () => {
  it('mapea un efecto conocido a su clase', () => { expect(effectClass('bw')).toBe('rt-fx--bw'); });
  it('null o desconocido → vacío', () => { expect(effectClass(null)).toBe(''); expect(effectClass('xxx')).toBe(''); });
});

describe('textos', () => {
  const clips = [
    { id: 't1', preset: 'title', text: 'Hola', x: 0, w: 160 },
    { id: 't2', preset: 'cta', text: 'Probá', x: 80, w: 240 },
  ];
  it('TEXT_PRESETS no vacío con ids únicos', () => {
    expect(TEXT_PRESETS.length).toBeGreaterThan(0);
    expect(new Set(TEXT_PRESETS.map((p) => p.id)).size).toBe(TEXT_PRESETS.length);
  });
  it('textsAtPx devuelve TODOS los textos activos en el playhead', () => {
    expect(textsAtPx(clips, 20).map((c) => c.id)).toEqual(['t1']);
    expect(textsAtPx(clips, 120).map((c) => c.id)).toEqual(['t1', 't2']);   // superpuestos
    expect(textsAtPx(clips, 500)).toEqual([]);
  });
  it('textPresetClass mapea el preset, con fallback a título', () => {
    expect(textPresetClass('cta')).toBe('rt-txt--cta');
    expect(textPresetClass('xxx')).toBe('rt-txt--title');
  });
});
