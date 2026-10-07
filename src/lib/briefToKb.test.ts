// Nuevo KSP por texto: el molde `briefToKb` cura un texto libre al shape del KnowledgeBase. Se testea
// el builder/parser del server (sin red, sin Claude) — igual patrón que videoprompt.test.ts.
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulo .mjs del server sin tipos; el resolver de vitest lo carga.
import { buildFunctionPrompt, parseFunctionResult } from '../../server/functions.mjs';
import { isValidKB } from './knowledgeBase';

const build = (options: object) => buildFunctionPrompt({ functionId: 'briefToKb', context: {}, options }) as { prompt: string };

describe('briefToKb — builder', () => {
  it('sin texto → error claro (no llamada)', () => {
    expect(() => build({})).toThrow(/texto del negocio/i);
    expect(() => build({ brief: '   ' })).toThrow(/texto del negocio/i);
  });
  it('con texto: el prompt lo incluye y pide el shape del KB', () => {
    const p = build({ brief: 'Somos Panadería Doña Rosa, vendemos pan casero en Rosario.' }).prompt;
    expect(p).toContain('Panadería Doña Rosa');
    expect(p).toContain('"business"');
    expect(p).toContain('"offerings"');
    expect(p).toMatch(/NO inventes/i);
  });
});

describe('briefToKb — parse', () => {
  it('JSON válido con business+offerings → pasa', () => {
    const text = JSON.stringify({ business: { name: 'ACME', description: 'hace cosas' }, offerings: [{ name: 'Producto', description: 'x' }] });
    const kb = parseFunctionResult('briefToKb', text) as { business: { name: string }; contract_version: string };
    expect(kb.business.name).toBe('ACME');
    expect(kb.contract_version).toBe('1.2');   // default si la IA no lo mandó
  });
  it('sin business.name → error', () => {
    const text = JSON.stringify({ business: { description: 'algo' }, offerings: [] });
    expect(() => parseFunctionResult('briefToKb', text)).toThrow(/negocio identificable/i);
  });
  it('sin offerings → se normaliza a array vacío (no rompe)', () => {
    const text = JSON.stringify({ business: { name: 'ACME', description: 'hace cosas' } });
    const kb = parseFunctionResult('briefToKb', text) as { offerings: unknown[] };
    expect(kb.offerings).toEqual([]);
  });
  it('el resultado pasa isValidKB (el mismo validador que usa KbFromText)', () => {
    const text = JSON.stringify({ business: { name: 'ACME', description: 'hace cosas' }, offerings: [{ name: 'P', description: 'x' }] });
    const kb = parseFunctionResult('briefToKb', text);
    expect(isValidKB(kb)).toBe(true);
  });
});
