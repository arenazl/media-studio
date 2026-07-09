import { describe, it, expect } from 'vitest';
import {
  nuevoComercial, avanzarEstado, pasoHabilitado, pasosVisibles, escenasAPrompts,
  type Escena, type Cast,
} from './comercial';

describe('pasosVisibles', () => {
  it('filmado tiene 9 pasos, sin render, con cast/pack/rodaje', () => {
    const v = pasosVisibles('filmado');
    expect(v).toEqual(['negocio', 'concepto', 'guion', 'cast', 'storyboard', 'pack', 'rodaje', 'montaje', 'publicar']);
    expect(v).toHaveLength(9);
    expect(v).not.toContain('render');
  });

  it('animado tiene 7 pasos, con render, sin cast/pack/rodaje', () => {
    const v = pasosVisibles('animado');
    expect(v).toEqual(['negocio', 'concepto', 'guion', 'storyboard', 'render', 'montaje', 'publicar']);
    expect(v).toHaveLength(7);
    for (const p of ['cast', 'pack', 'rodaje'] as const) expect(v).not.toContain(p);
  });
});

describe('nuevoComercial', () => {
  it('arranca con todos los estados en pendiente', () => {
    const c = nuevoComercial('El caos vs el orden', 'filmado');
    expect(c.tipo).toBe('filmado');
    expect(c.titulo).toBe('El caos vs el orden');
    expect(typeof c.id).toBe('string');
    expect(c.id.length).toBeGreaterThan(0);
    // TODOS los pasos (incluidos los no visibles) arrancan pendiente
    for (const estado of Object.values(c.estados)) expect(estado).toBe('pendiente');
    expect(c.estados.negocio).toBe('pendiente');
    expect(c.estados.montaje).toBe('pendiente');
  });

  it('titulo vacío cae a un default', () => {
    const c = nuevoComercial('   ', 'animado');
    expect(c.titulo).toBe('Comercial sin título');
    expect(c.tipo).toBe('animado');
  });
});

describe('avanzarEstado', () => {
  it('devuelve una copia inmutable con el estado actualizado', () => {
    const c = nuevoComercial('demo', 'filmado');
    const c2 = avanzarEstado(c, 'negocio', 'generado');
    expect(c2).not.toBe(c);
    expect(c2.estados).not.toBe(c.estados);
    expect(c.estados.negocio).toBe('pendiente');       // original intacto
    expect(c2.estados.negocio).toBe('generado');
    expect(c2.estados.concepto).toBe('pendiente');     // el resto no cambia
  });
});

describe('pasoHabilitado', () => {
  it('el primer paso (negocio) siempre está habilitado', () => {
    expect(pasoHabilitado(nuevoComercial('x', 'filmado'), 'negocio')).toBe(true);
    expect(pasoHabilitado(nuevoComercial('x', 'animado'), 'negocio')).toBe(true);
  });

  it('un paso se habilita cuando el anterior visible está ≥ generado', () => {
    let c = nuevoComercial('x', 'filmado');
    expect(pasoHabilitado(c, 'concepto')).toBe(false);   // negocio aún pendiente
    c = avanzarEstado(c, 'negocio', 'generado');
    expect(pasoHabilitado(c, 'concepto')).toBe(true);
    // 'editado' y 'aprobado' también cuentan como ≥ generado
    c = avanzarEstado(c, 'negocio', 'aprobado');
    expect(pasoHabilitado(c, 'concepto')).toBe(true);
  });

  it('un paso no visible para el tipo nunca se habilita', () => {
    expect(pasoHabilitado(nuevoComercial('x', 'filmado'), 'render')).toBe(false);  // filmado no tiene render
    const anim = nuevoComercial('x', 'animado');
    for (const p of ['cast', 'pack', 'rodaje'] as const) expect(pasoHabilitado(anim, p)).toBe(false);
  });

  it('montaje (filmado) se habilita cuando rodaje ≥ generado', () => {
    let c = nuevoComercial('x', 'filmado');
    expect(pasoHabilitado(c, 'montaje')).toBe(false);
    c = avanzarEstado(c, 'rodaje', 'generado');
    expect(pasoHabilitado(c, 'montaje')).toBe(true);
  });

  it('montaje (animado) se habilita cuando render ≥ generado', () => {
    let c = nuevoComercial('x', 'animado');
    expect(pasoHabilitado(c, 'montaje')).toBe(false);
    c = avanzarEstado(c, 'render', 'generado');
    expect(pasoHabilitado(c, 'montaje')).toBe(true);
  });
});

describe('escenasAPrompts', () => {
  const cast: Cast = {
    personajes: [
      { id: 'p1', nombre: 'Ana', rol: 'presentadora', fisicoEn: '...', fisicoEs: '...', vestuario: '...', personalidad: '...' },
    ],
    lugar: { nombre: 'oficina', descripcionEn: '...', luz: 'natural' },
  };
  const escena = (n: number, personajes: string[]): Escena => ({
    n, rol: 'hook', durSec: 8, plano: '', angulo: '', personajes, accion: '', dialogo: '', continuidad: '',
  });

  it('ok=true cuando toda referencia de personaje existe en el cast', () => {
    const r = escenasAPrompts([escena(1, ['p1']), escena(2, [])], cast);
    expect(r.ok).toBe(true);
    expect(r.faltantes).toHaveLength(0);
  });

  it('reporta las referencias que no existen en el cast', () => {
    const r = escenasAPrompts([escena(1, ['p1', 'p9']), escena(2, ['pX'])], cast);
    expect(r.ok).toBe(false);
    expect(r.faltantes).toEqual([
      { escenaN: 1, personajeId: 'p9' },
      { escenaN: 2, personajeId: 'pX' },
    ]);
  });

  it('tolera storyboard/cast vacíos o indefinidos', () => {
    expect(escenasAPrompts(undefined, undefined).ok).toBe(true);
    expect(escenasAPrompts([escena(1, ['p1'])], undefined).ok).toBe(false);
  });
});
