import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAiModel, setAiModel, effectiveModel, getCopilotOpen, setCopilotOpen } from './settings';

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

describe('getAiModel (preset de IA)', () => {
  it('default "intermedio" sin ajuste guardado (usuario nuevo)', () => {
    expect(getAiModel()).toBe('intermedio');
  });
  it('devuelve el preset persistido', () => {
    setAiModel('economico');
    expect(getAiModel()).toBe('economico');
  });
  it('ignora basura en el storage y cae a "intermedio"', () => {
    localStorage.setItem('ms.settings.aiPreset', 'gpt-5');
    expect(getAiModel()).toBe('intermedio');
  });
  it('NO lee la clave vieja (auto/opus/sonnet/haiku): nadie queda con "haiku" forzado sin saberlo', () => {
    localStorage.setItem('ms.settings.aiModel', 'haiku');
    expect(getAiModel()).toBe('intermedio');
  });
  it('tolera la ausencia de localStorage (no rompe)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getAiModel()).toBe('intermedio');
  });
});

describe('setAiModel', () => {
  it('persiste cada preset válido', () => {
    for (const v of ['economico', 'intermedio', 'performante'] as const) {
      setAiModel(v);
      expect(getAiModel()).toBe(v);
    }
  });
  it('tolera la ausencia de localStorage (no rompe)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => setAiModel('performante')).not.toThrow();
  });
});

describe('effectiveModel = preset × clase del molde (tabla acordada con el dueño, 2026-10-07)', () => {
  it('intermedio: Opus sólo en lo creativo, Sonnet en lo demás', () => {
    setAiModel('intermedio');
    expect(effectiveModel('concept')).toBe('opus');
    expect(effectiveModel('script')).toBe('opus');
    expect(effectiveModel('strategy')).toBe('opus');
    expect(effectiveModel('cast')).toBe('sonnet');
    expect(effectiveModel('storyboard')).toBe('sonnet');
    expect(effectiveModel('qa')).toBe('sonnet');
    expect(effectiveModel('flowpack')).toBe('sonnet');
    expect(effectiveModel('publish')).toBe('sonnet');
  });
  it('económico: Sonnet en todo', () => {
    setAiModel('economico');
    for (const id of ['strategy', 'concept', 'script', 'cast', 'storyboard', 'qa', 'flowpack', 'publish', 'briefToKb', 'videoprompt']) {
      expect(effectiveModel(id), id).toBe('sonnet');
    }
  });
  it('performante: Opus también en cast, storyboard y QA; transformación sigue en Sonnet', () => {
    setAiModel('performante');
    expect(effectiveModel('cast')).toBe('opus');
    expect(effectiveModel('storyboard')).toBe('opus');
    expect(effectiveModel('qa')).toBe('opus');
    expect(effectiveModel('flowpack')).toBe('sonnet');
    expect(effectiveModel('publish')).toBe('sonnet');
  });
  it('ningún preset usa Haiku (medido: más lento y peor)', () => {
    for (const p of ['economico', 'intermedio', 'performante'] as const) {
      setAiModel(p);
      for (const id of ['strategy', 'concept', 'script', 'cast', 'storyboard', 'qa', 'flowpack', 'publish', 'briefToKb', 'videoprompt']) {
        expect(effectiveModel(id), `${p}/${id}`).not.toBe('haiku');
      }
    }
  });
  it('función inexistente → undefined (el server usa su política por clase)', () => {
    expect(effectiveModel('no-existe')).toBeUndefined();
  });
});

describe('copiloto abierto/cerrado', () => {
  it('default abierto (usuario nuevo, sin ajuste)', () => {
    expect(getCopilotOpen()).toBe(true);
  });
  it('persiste cerrado y abierto', () => {
    setCopilotOpen(false);
    expect(getCopilotOpen()).toBe(false);
    setCopilotOpen(true);
    expect(getCopilotOpen()).toBe(true);
  });
  it('tolera la ausencia de localStorage (no rompe, cae a abierto)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getCopilotOpen()).toBe(true);
    expect(() => setCopilotOpen(false)).not.toThrow();
  });
});
