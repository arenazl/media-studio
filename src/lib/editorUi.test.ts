import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEditorPanels, setEditorPanels, getPlayhead, setPlayhead,
  BIN_W_MIN, BIN_W_MAX, INSP_W_MIN, INSP_W_MAX, TL_H_MIN, TL_H_MAX,
} from './editorUi';

// entorno vitest = node puro (sin jsdom): no hay `localStorage` global — mismo patrón que settings.test.ts.
function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => { m.clear(); },
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  };
}

beforeEach(() => { vi.stubGlobal('localStorage', fakeStorage()); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('getEditorPanels', () => {
  it('default: los 3 paneles abiertos con los anchos de fábrica', () => {
    expect(getEditorPanels()).toEqual({ binW: 240, inspW: 288, tlH: 224, binOpen: true, inspOpen: true, tlOpen: true });
  });
  it('tolera la ausencia de localStorage (no rompe, cae al default)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getEditorPanels().binOpen).toBe(true);
  });
  it('ignora JSON corrupto y cae al default', () => {
    localStorage.setItem('ms.editor.panels.v1', '{not json');
    expect(getEditorPanels()).toEqual({ binW: 240, inspW: 288, tlH: 224, binOpen: true, inspOpen: true, tlOpen: true });
  });
});

describe('setEditorPanels', () => {
  it('persiste un patch parcial mergeado sobre lo existente', () => {
    setEditorPanels({ binW: 300 });
    setEditorPanels({ inspOpen: false });
    expect(getEditorPanels()).toEqual({ binW: 300, inspW: 288, tlH: 224, binOpen: true, inspOpen: false, tlOpen: true });
  });
  it('clampea binW/inspW/tlH a sus límites de arrastre', () => {
    expect(setEditorPanels({ binW: 10 }).binW).toBe(BIN_W_MIN);
    expect(setEditorPanels({ binW: 9999 }).binW).toBe(BIN_W_MAX);
    expect(setEditorPanels({ inspW: 1 }).inspW).toBe(INSP_W_MIN);
    expect(setEditorPanels({ inspW: 9999 }).inspW).toBe(INSP_W_MAX);
    expect(setEditorPanels({ tlH: 1 }).tlH).toBe(TL_H_MIN);
    expect(setEditorPanels({ tlH: 9999 }).tlH).toBe(TL_H_MAX);
  });
  it('tolera la ausencia de localStorage (no rompe)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => setEditorPanels({ binOpen: false })).not.toThrow();
  });
});

describe('playhead por proyecto', () => {
  it('default 0 para un proyecto sin posición guardada', () => {
    expect(getPlayhead('proj-1')).toBe(0);
  });
  it('sin projectId → 0, no rompe', () => {
    expect(getPlayhead(undefined)).toBe(0);
  });
  it('persiste y separa la posición por proyecto', () => {
    setPlayhead('proj-1', 4.5);
    setPlayhead('proj-2', 9);
    expect(getPlayhead('proj-1')).toBe(4.5);
    expect(getPlayhead('proj-2')).toBe(9);
  });
  it('no permite negativos', () => {
    setPlayhead('proj-1', -3);
    expect(getPlayhead('proj-1')).toBe(0);
  });
  it('setPlayhead sin projectId no rompe ni escribe', () => {
    expect(() => setPlayhead(undefined, 5)).not.toThrow();
  });
  it('tolera la ausencia de localStorage (no rompe)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getPlayhead('proj-1')).toBe(0);
    expect(() => setPlayhead('proj-1', 3)).not.toThrow();
  });
});
