import { describe, it, expect, beforeEach } from 'vitest';
import {
  FORMATOS_DEF, DIMS_POR_ASPECTO, FORMATO_DEFAULT_ID,
  getFormato, tipoDesdeFormato, type Formato, type TecnicaProduccion,
} from './formato';
import { nuevoComercial } from './comercial';

describe('tipoDesdeFormato (mapeo D2)', () => {
  const casos: Array<[TecnicaProduccion, 'filmado' | 'animado']> = [
    ['filmado', 'filmado'],
    ['animado', 'animado'],
    ['mixto', 'filmado'],       // el 1:1 recorta el reel filmado
    ['slideshow', 'animado'],   // piezas fijas sin rodaje
    ['3D', 'filmado'],          // default conservador
  ];
  for (const [tecnica, tipo] of casos) {
    it(`${tecnica} → ${tipo}`, () => {
      const f = { tecnicaProduccion: tecnica } as Formato;
      expect(tipoDesdeFormato(f)).toBe(tipo);
    });
  }
  it('sin formato → filmado (proyectos viejos)', () => {
    expect(tipoDesdeFormato(undefined)).toBe('filmado');
  });
});

describe('dims por aspecto', () => {
  it('cada aspecto tiene sus dimensiones canónicas', () => {
    expect(DIMS_POR_ASPECTO['9:16']).toEqual({ width: 1080, height: 1920 });
    expect(DIMS_POR_ASPECTO['1:1']).toEqual({ width: 1080, height: 1080 });
    expect(DIMS_POR_ASPECTO['4:5']).toEqual({ width: 1080, height: 1350 });
    expect(DIMS_POR_ASPECTO['16:9']).toEqual({ width: 1920, height: 1080 });
  });
  it('las dims de cada formato del catálogo matchean su aspecto', () => {
    for (const f of FORMATOS_DEF) {
      expect(f.dims).toEqual(DIMS_POR_ASPECTO[f.aspecto]);
    }
  });
});

describe('getFormato', () => {
  it('resuelve un id existente', () => {
    const f = getFormato(FORMATO_DEFAULT_ID);
    expect(f?.id).toBe('reel-9-16');
    expect(f?.aspecto).toBe('9:16');
    expect(f?.tecnicaProduccion).toBe('filmado');
  });
  it('id inexistente → undefined', () => {
    expect(getFormato('no-existe')).toBeUndefined();
  });
  it('id vacío/undefined → undefined', () => {
    expect(getFormato(undefined)).toBeUndefined();
    expect(getFormato('')).toBeUndefined();
  });
});

describe('catálogo FORMATOS_DEF', () => {
  it('tiene los 6 formatos con ids únicos y fps 30', () => {
    expect(FORMATOS_DEF).toHaveLength(6);
    const ids = FORMATOS_DEF.map((f) => f.id);
    expect(new Set(ids).size).toBe(6);
    for (const f of FORMATOS_DEF) expect(f.fps).toBe(30);
  });
  it('el spot de TV tiene default 25 (rango 20–30); el resto default 20', () => {
    const tv = getFormato('spot-tv-16-9')!;
    expect(tv.duracion).toEqual({ min: 20, max: 30, default: 25 });
    for (const f of FORMATOS_DEF.filter((x) => x.id !== 'spot-tv-16-9')) {
      expect(f.duracion.default).toBe(20);
      expect(f.duracion).toEqual({ min: 15, max: 30, default: 20 });
    }
  });
});

describe('round-trip de formatoId en el comercial', () => {
  it('sobrevive el spread + serialización JSON (viaja dentro de reels[])', () => {
    const com = { ...nuevoComercial('Pieza animada', tipoDesdeFormato(getFormato('reel-animado-9-16'))), formatoId: 'reel-animado-9-16' };
    expect(com.tipo).toBe('animado');
    const roundtrip = JSON.parse(JSON.stringify(com));
    expect(roundtrip.formatoId).toBe('reel-animado-9-16');
    expect(roundtrip.tipo).toBe('animado');
  });
});

// Round-trip de formatoId a nivel Project por saveProject: sin DOM en el entorno node, se stubea
// localStorage mínimo. Verifica el punto crítico del plan (hecho 2): el builder incluye el campo.
describe('round-trip de formatoId en el Project (saveProject)', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    // @ts-expect-error stub mínimo de localStorage para el entorno node
    globalThis.localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => store.clear(),
    };
    // fetch no-op para el dual-write al server (no bloquea ni rompe si no hay server).
    // @ts-expect-error stub de fetch
    globalThis.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });

  it('guarda y recupera el formatoId del proyecto', async () => {
    const { saveProject, getProject } = await import('./projects');
    const saved = saveProject({ id: 'test-fmt', name: 'Proyecto formato', formatoId: 'spot-yt-16-9', reels: [] });
    expect(saved.formatoId).toBe('spot-yt-16-9');
    expect(getProject('test-fmt')?.formatoId).toBe('spot-yt-16-9');
  });

  it('preserva el formatoId cuando un guardado posterior no lo pasa (?? existing)', async () => {
    const { saveProject, getProject } = await import('./projects');
    saveProject({ id: 'test-preserva', name: 'Preserva', formatoId: 'meta-feed-1-1', reels: [] });
    saveProject({ id: 'test-preserva', name: 'Preserva editado', reels: [] });   // sin formatoId
    expect(getProject('test-preserva')?.formatoId).toBe('meta-feed-1-1');
  });
});
