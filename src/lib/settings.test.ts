import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAiModel, setAiModel, effectiveModel } from './settings';

// entorno vitest = node puro (sin jsdom): no hay `localStorage` global — se stubea acá,
// mismo patrón que el resto de src/lib (kits.ts/audioSource.ts usan localStorage sin mock
// porque nunca se testeaba esa rama; acá sí, así que hace falta un Storage en memoria).
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

describe('getAiModel', () => {
  it('default "auto" sin ajuste guardado (usuario nuevo)', () => {
    expect(getAiModel()).toBe('auto');
  });
  it('devuelve el valor persistido', () => {
    setAiModel('sonnet');
    expect(getAiModel()).toBe('sonnet');
  });
  it('ignora basura en el storage y cae a "auto"', () => {
    localStorage.setItem('ms.settings.aiModel', 'gpt-5');
    expect(getAiModel()).toBe('auto');
  });
  it('tolera la ausencia de localStorage (no rompe)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getAiModel()).toBe('auto');
  });
});

describe('setAiModel', () => {
  it('persiste cada tier válido', () => {
    for (const v of ['auto', 'opus', 'sonnet', 'haiku'] as const) {
      setAiModel(v);
      expect(getAiModel()).toBe(v);
    }
  });
  it('tolera la ausencia de localStorage (no rompe)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => setAiModel('opus')).not.toThrow();
  });
});

describe('effectiveModel', () => {
  it('en "auto" devuelve el tier del catálogo de la función', () => {
    setAiModel('auto');
    expect(effectiveModel('publish')).toBe('haiku');   // catálogo: publish → haiku
    expect(effectiveModel('script')).toBe('opus');     // catálogo: script → opus
    expect(effectiveModel('qa')).toBe('sonnet');       // catálogo: qa → sonnet
  });
  it('forzado, ignora el catálogo y devuelve siempre el tier elegido', () => {
    setAiModel('sonnet');
    expect(effectiveModel('publish')).toBe('sonnet');
    expect(effectiveModel('script')).toBe('sonnet');
  });
  it('función inexistente en "auto" → undefined (el server usa el default del CLI)', () => {
    setAiModel('auto');
    expect(effectiveModel('no-existe')).toBeUndefined();
  });
});
