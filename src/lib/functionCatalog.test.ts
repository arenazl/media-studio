import { describe, it, expect } from 'vitest';
import { FUNCTION_CATALOG, projectFunctions, pieceFunctions, getFunction, PRESETS, modelForPreset, type TaskClass } from './functionCatalog';

const CLASES: TaskClass[] = ['creativo', 'estructurado', 'transformacion'];

describe('FUNCTION_CATALOG integridad', () => {
  it('los ids de función son únicos', () => {
    const ids = FUNCTION_CATALOG.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada función tiene nivel y clase de tarea válidos', () => {
    for (const f of FUNCTION_CATALOG) {
      expect(['project', 'piece']).toContain(f.level);
      expect(CLASES).toContain(f.taskClass);
      expect(f.label).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.icon).toBeTruthy();
    }
  });

  it('las opciones "choice" tienen choices y un default que existe entre ellas', () => {
    for (const f of FUNCTION_CATALOG) {
      const ids = f.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);                 // ids de opción únicos por función
      for (const o of f.options) {
        if (o.type === 'choice') {
          expect(o.choices?.length).toBeGreaterThan(0);
          if (o.default !== undefined) {
            expect(o.choices!.map((c) => c.value)).toContain(o.default);
          }
        }
      }
    }
  });

  it('separa funciones de proyecto y de pieza', () => {
    expect(projectFunctions().every((f) => f.level === 'project')).toBe(true);
    expect(pieceFunctions().every((f) => f.level === 'piece')).toBe(true);
    expect(projectFunctions().length + pieceFunctions().length).toBe(FUNCTION_CATALOG.length);
  });

  it('getFunction encuentra por id y devuelve undefined si no existe', () => {
    expect(getFunction('script')?.label).toBe('Guion');
    expect(getFunction('no-existe')).toBeUndefined();
  });

  it('tiene al menos la estrategia (proyecto) y el guion (pieza)', () => {
    expect(getFunction('strategy')?.level).toBe('project');
    expect(getFunction('script')?.level).toBe('piece');
  });
});

describe('moldes del rework (concept/cast/storyboard/flowpack)', () => {
  const NUEVOS = ['concept', 'cast', 'storyboard', 'flowpack'] as const;

  it('los 4 moldes existen y son de nivel pieza', () => {
    for (const id of NUEVOS) {
      const f = getFunction(id);
      expect(f, `falta el molde ${id}`).toBeDefined();
      expect(f!.level, `${id} debe ser nivel pieza`).toBe('piece');
    }
  });

  it('usan íconos lucide (sin emojis) y descripción en una línea', () => {
    const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const id of NUEVOS) {
      const f = getFunction(id)!;
      expect(f.icon).toMatch(/^[A-Z][A-Za-z]+$/);      // nombre de componente lucide
      expect(f.description).toBeTruthy();
      expect(f.description).not.toMatch(EMOJI);
      expect(f.label).not.toMatch(EMOJI);
    }
  });

  it('concept tiene la opción de perfil; cast/storyboard/flowpack no piden opciones', () => {
    expect(getFunction('concept')!.options.map((o) => o.id)).toContain('perfil');
    for (const id of ['cast', 'storyboard', 'flowpack'] as const) {
      expect(getFunction(id)!.options).toHaveLength(0);
    }
  });
});

describe('presets de IA (económico / intermedio / performante)', () => {
  it('cada preset resuelve las tres clases a un modelo, y nunca a haiku', () => {
    for (const preset of Object.keys(PRESETS) as (keyof typeof PRESETS)[]) {
      for (const clase of CLASES) {
        expect(['opus', 'sonnet']).toContain(PRESETS[preset][clase]);
      }
    }
  });
  it('las clases del catálogo son las acordadas: creativo decide, estructurado convierte, transformación empaqueta', () => {
    expect(getFunction('strategy')!.taskClass).toBe('creativo');
    expect(getFunction('concept')!.taskClass).toBe('creativo');
    expect(getFunction('script')!.taskClass).toBe('creativo');
    expect(getFunction('cast')!.taskClass).toBe('estructurado');
    expect(getFunction('storyboard')!.taskClass).toBe('estructurado');
    expect(getFunction('qa')!.taskClass).toBe('estructurado');
    expect(getFunction('flowpack')!.taskClass).toBe('transformacion');
    expect(getFunction('publish')!.taskClass).toBe('transformacion');
  });
  it('modelForPreset: intermedio pone Opus en el guion y Sonnet en el storyboard; inexistente → undefined', () => {
    expect(modelForPreset('intermedio', 'script')).toBe('opus');
    expect(modelForPreset('intermedio', 'storyboard')).toBe('sonnet');
    expect(modelForPreset('economico', 'script')).toBe('sonnet');
    expect(modelForPreset('performante', 'storyboard')).toBe('opus');
    expect(modelForPreset('intermedio', 'no-existe')).toBeUndefined();
  });
});
