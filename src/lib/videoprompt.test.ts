// WO-6c: molde `videoprompt` standalone (prompt de Flow suelto). Se testea el builder del server:
// brief vacío → error (no llamada); con brief arma el prompt con VEO_RULES y el modo correcto.
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulo .mjs del server sin tipos; el resolver de vitest lo carga.
import { buildFunctionPrompt, parseFunctionResult } from '../../server/functions.mjs';

const build = (options: object) => buildFunctionPrompt({ functionId: 'videoprompt', context: {}, options }) as { prompt: string };

describe('videoprompt — builder', () => {
  it('brief vacío → error claro (no llamada)', () => {
    expect(() => build({ modo: 'talking-head' })).toThrow(/descripción/i);
    expect(() => build({ brief: '   ' })).toThrow(/descripción/i);
  });
  it('talking-head: incluye el brief, VEO_RULES y la guía de talking head', () => {
    const p = build({ brief: 'una emprendedora en su local', modo: 'talking-head' }).prompt;
    expect(p).toContain('una emprendedora en su local');
    expect(p).toContain('TALKING HEAD');
    expect(p).toContain('Rioplatense');   // de VEO_RULES
  });
  it('b-roll: usa la guía de b-roll (sin diálogo)', () => {
    const p = build({ brief: 'plano del producto sobre una mesa', modo: 'b-roll' }).prompt;
    expect(p).toContain('B-ROLL');
    expect(p).toContain('No spoken dialogue');
  });
  it('modo desconocido → cae a talking-head', () => {
    const p = build({ brief: 'algo', modo: 'raro' }).prompt;
    expect(p).toContain('TALKING HEAD');
  });
});

describe('videoprompt — parse', () => {
  it('devuelve el texto plano como { prompt }', () => {
    expect(parseFunctionResult('videoprompt', '  el prompt final  ')).toEqual({ prompt: 'el prompt final' });
  });
  it('texto vacío → error', () => {
    expect(() => parseFunctionResult('videoprompt', '   ')).toThrow(/no devolvió/i);
  });
});
