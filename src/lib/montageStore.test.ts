import { describe, it, expect } from 'vitest';
import { buildSnapshot, isEmptySnapshot, type MontageTracks } from './montageStore';

const empty: MontageTracks = {
  slideTrack: [], audioTrack: [], musicTrack: [], videoTrack: [], transitionTrack: [], effectTrack: [], textTrack: [],
};

describe('buildSnapshot', () => {
  it('mapea cada track a su array del snapshot', () => {
    const snap = buildSnapshot({
      ...empty,
      slideTrack: [{ s: 0, x: 0, w: 200 }],
      audioTrack: [{ p: 1, x: 200, w: 120 }],
      textTrack: [{ id: 't1', preset: 'cta', text: 'Probá', x: 0, w: 240 }],
    });
    expect(snap.slides).toEqual([{ s: 0, x: 0, w: 200 }]);
    expect(snap.audios).toEqual([{ p: 1, x: 200, w: 120 }]);
    expect(snap.texts[0]).toMatchObject({ id: 't1', preset: 'cta', text: 'Probá' });
  });
  it('redondea x/w (saca el ruido sub-píxel del drag)', () => {
    const snap = buildSnapshot({ ...empty, musicTrack: [{ id: 'funk', x: 12.7, w: 803.2 }] });
    expect(snap.music[0]).toEqual({ id: 'funk', x: 13, w: 803 });
  });
  it('no muta los tracks de entrada', () => {
    const slideTrack = [{ s: 0, x: 1.4, w: 80.6 }];
    buildSnapshot({ ...empty, slideTrack });
    expect(slideTrack[0]).toEqual({ s: 0, x: 1.4, w: 80.6 });
  });
});

describe('isEmptySnapshot', () => {
  it('true cuando todos los canales están vacíos', () => {
    expect(isEmptySnapshot(buildSnapshot(empty))).toBe(true);
  });
  it('false si hay aunque sea un clip', () => {
    expect(isEmptySnapshot(buildSnapshot({ ...empty, effectTrack: [{ id: 'bw', x: 0, w: 320 }] }))).toBe(false);
  });
});
