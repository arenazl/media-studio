import { describe, it, expect } from 'vitest';
import { COPILOTO, copilotoDinamico } from './copiloto';
import { nuevoComercial, pasosVisibles, type Comercial, type PackFlow } from './comercial';

describe('COPILOTO (contenido)', () => {
  it('cubre TODOS los pasos del pipeline (filmado + animado)', () => {
    const todos = new Set([...pasosVisibles('filmado'), ...pasosVisibles('animado')]);
    for (const p of todos) {
      expect(COPILOTO[p], `falta contenido de ${p}`).toBeTruthy();
      expect(COPILOTO[p].queEs.length).toBeGreaterThan(0);
      expect(COPILOTO[p].hace.length).toBeGreaterThan(0);
    }
  });

  it('sólo el paso pack lleva la nota del logo (se quema en el Montaje)', () => {
    expect(COPILOTO.pack.nota).toMatch(/Montaje/);
    expect(COPILOTO.concepto.nota).toBeUndefined();
  });
});

describe('copilotoDinamico — pasos "generar y revisar"', () => {
  it('sin comercial: nada cumplido, próximo = ítem 0', () => {
    const d = copilotoDinamico('guion', undefined);
    expect(d.hasContent).toBe(false);
    expect(d.avance).toBe(0);
    expect(d.nextItem).toBe(0);
    expect(d.aprobado).toBe(false);
  });

  it('generado pero sin aprobar: avance 1 (arrancaste), resalta el siguiente', () => {
    const c: Comercial = { ...nuevoComercial('x', 'filmado'), estados: { ...nuevoComercial('x', 'filmado').estados, guion: 'generado' } };
    const d = copilotoDinamico('guion', c);
    expect(d.avance).toBe(1);
    expect(d.nextItem).toBe(1);
  });

  it('aprobado: todo cumplido, sin próximo', () => {
    const base = nuevoComercial('x', 'filmado');
    const c: Comercial = { ...base, estados: { ...base.estados, guion: 'aprobado' } };
    const d = copilotoDinamico('guion', c);
    expect(d.avance).toBe(COPILOTO.guion.hace.length);
    expect(d.nextItem).toBe(-1);
    expect(d.aprobado).toBe(true);
  });
});

describe('copilotoDinamico — concepto', () => {
  it('elegir un concepto marca comparar+elegir (avance 3), próximo = definir tipo', () => {
    const base = nuevoComercial('x', 'filmado');
    const c: Comercial = {
      ...base,
      estados: { ...base.estados, concepto: 'editado' },
      concepto: { id: 'c1', idea: 'i', tono: 't', estetica: 'e', referencia: 'r', porQueFunciona: 'p' },
    };
    const d = copilotoDinamico('concepto', c);
    expect(d.avance).toBe(3);
    expect(d.nextItem).toBe(3);
    expect(d.hasContent).toBe(true);
  });

  it('generado sin elegir todavía: avance 1', () => {
    const base = nuevoComercial('x', 'filmado');
    const c: Comercial = { ...base, estados: { ...base.estados, concepto: 'generado' } };
    expect(copilotoDinamico('concepto', c).avance).toBe(1);
  });
});

describe('copilotoDinamico — pack (Pack Flow)', () => {
  const packWith = (estados: PackFlow['escenas'][number]['estado'][]): Comercial => {
    const base = nuevoComercial('x', 'filmado');
    return {
      ...base,
      packFlow: { estilo: 's', personajes: [], escenas: estados.map((estado, i) => ({ escenaN: i + 1, rol: 'hook', prompt: 'p', estado })) },
    };
  };

  it('sin pack generado: avance 0, contador en cero', () => {
    const d = copilotoDinamico('pack', nuevoComercial('x', 'filmado'));
    expect(d.avance).toBe(0);
    expect(d.progreso).toEqual({ label: 'clips copiados', done: 0, total: 0 });
  });

  it('pack generado, nada copiado: avance 1 (copiá el MASTER)', () => {
    const d = copilotoDinamico('pack', packWith(['pendiente', 'pendiente', 'pendiente', 'pendiente']));
    expect(d.avance).toBe(1);
    expect(d.progreso).toEqual({ label: 'clips copiados', done: 0, total: 4 });
  });

  it('copiando clips (algunos): avance 2', () => {
    const d = copilotoDinamico('pack', packWith(['copiado', 'pendiente', 'pendiente', 'pendiente']));
    expect(d.avance).toBe(2);
    expect(d.progreso!.done).toBe(1);
  });

  it('todos copiados pero no todos importados: avance 3 (seguí en Rodaje)', () => {
    const d = copilotoDinamico('pack', packWith(['copiado', 'copiado', 'importado', 'copiado']));
    expect(d.avance).toBe(3);
    expect(d.progreso).toEqual({ label: 'clips copiados', done: 4, total: 4 });
  });

  it('todo importado: avance completo', () => {
    const d = copilotoDinamico('pack', packWith(['importado', 'importado', 'importado', 'importado']));
    expect(d.avance).toBe(COPILOTO.pack.hace.length);
    expect(d.nextItem).toBe(-1);
    expect(d.progreso).toEqual({ label: 'clips copiados', done: 4, total: 4 });
  });
});

describe('copilotoDinamico — rodaje', () => {
  const conStoryboardYTomas = (nEscenas: number, escenasImportadas: number[]): Comercial => {
    const base = nuevoComercial('x', 'filmado');
    return {
      ...base,
      storyboard: Array.from({ length: nEscenas }, (_, i) => ({
        n: i + 1, rol: 'hook' as const, durSec: 8, plano: '', angulo: '', personajes: [], accion: '', dialogo: '', continuidad: '',
      })),
      rodaje: escenasImportadas.map((n) => ({ id: `t${n}`, escenaN: n, fileRef: 'r', durSec: 8 })),
    };
  };

  it('cuenta escenas con clip sobre el total', () => {
    const d = copilotoDinamico('rodaje', conStoryboardYTomas(4, [1, 2]));
    expect(d.progreso).toEqual({ label: 'escenas con clip', done: 2, total: 4 });
    expect(d.avance).toBe(1);
  });

  it('sin ningún clip: avance 0', () => {
    expect(copilotoDinamico('rodaje', conStoryboardYTomas(4, [])).avance).toBe(0);
  });

  it('todas las escenas con clip: avance 2', () => {
    const d = copilotoDinamico('rodaje', conStoryboardYTomas(3, [1, 2, 3]));
    expect(d.avance).toBe(2);
    expect(d.progreso).toEqual({ label: 'escenas con clip', done: 3, total: 3 });
  });
});

describe('copilotoDinamico — negocio (sin generación de IA)', () => {
  it('nunca marca hasContent (el brief vive en el proyecto)', () => {
    const d = copilotoDinamico('negocio', nuevoComercial('x', 'filmado'));
    expect(d.hasContent).toBe(false);
    expect(d.avance).toBe(0);
  });

  it('aprobado cierra igual todos los ítems', () => {
    const base = nuevoComercial('x', 'filmado');
    const c: Comercial = { ...base, estados: { ...base.estados, negocio: 'aprobado' } };
    expect(copilotoDinamico('negocio', c).nextItem).toBe(-1);
  });
});
