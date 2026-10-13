import { describe, expect, it } from 'vitest';
import { buildFunctionPrompt, parseFunctionResult, IMPLEMENTED_FUNCTIONS } from './functions.mjs';
import { validarResultado } from './prompting.mjs';

const body = {
  functionId: 'montageDirection',
  context: {
    project: { name: 'Producto de ejemplo' },
    piece: {
      titulo: 'Spot cotidiano',
      enfoque: 'caso', tratamiento: 'sobrio',
      cierreTipo: 'presentadora', tieneMusica: true, tieneSfx: false,
      concepto: { idea: 'Una historia concreta, sin humor' },
      escenas: [{ escenaN: 1, src: 'clip.mp4', rol: 'hook', dialogo: 'Hola', durSec: 3 }],
    },
  },
  options: {},
};

describe('Molde director publicitario — back', () => {
  it('está registrado y sólo ofrece operaciones que el editor puede aplicar', () => {
    expect(IMPLEMENTED_FUNCTIONS).toContain('montageDirection');
    const prompt = buildFunctionPrompt(body);
    expect(prompt.promptVersion).toBe('montageDirection/1.0');
    expect(prompt.prompt).toContain('TRATAMIENTO: sobrio');
    expect(prompt.prompt).toContain('music_drop');
    expect(prompt.prompt).toContain('No inventes');
  });
  it('acepta propuestas vacías si no hay decisiones justificadas', () => {
    const parsed = parseFunctionResult('montageDirection', '{"diagnostico":"Un spot claro","decisiones":[]}', body);
    expect(validarResultado('montageDirection', parsed, body)).toEqual([]);
  });
  it('rechaza una escena inexistente y operaciones no ejecutables', () => {
    const parsed = parseFunctionResult('montageDirection', '{"diagnostico":"Prueba","decisiones":[{"recurso":"inventar_logo","escenaN":99,"cuando":"medio","durSec":4,"motivo":"arbitrario"}]}', body);
    const errors = validarResultado('montageDirection', parsed, body);
    expect(errors.join(' ')).toContain('recurso');
    expect(errors.join(' ')).toContain('escena');
    expect(errors.join(' ')).toContain('cuando');
    expect(errors.join(' ')).toContain('durSec');
  });
});
