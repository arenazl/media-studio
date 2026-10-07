// Fase 2 de la reingeniería (2026-10-07): ProjectFacts. Fuente: docs/14-skills/MEDIA-STUDIO-REINGENIERIA-COMPLETA.md
// P0.1 ("el brief se corta a 2.500 caracteres") y §07 Fixture 1 ("brief largo: los facts del final
// llegan a Concept y Strategy").
import { describe, it, expect } from 'vitest';
import { buildProjectFacts, factsFromBrief, factsFromKb, factsText } from '../../server/projectFacts.mjs';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { buildFunctionPrompt } from '../../server/functions.mjs';
import { kbToBrief, type KnowledgeBase } from './knowledgeBase';

const KB: KnowledgeBase = {
  contract_version: '1.2',
  business: { name: 'Munify', tagline: 'El municipio en tiempo real', description: 'El vecino reclama, tramita y paga desde el celular.', value_story: 'Un único sistema de punta a punta.', industry: 'GovTech', target_audience: 'Intendentes y secretarios' },
  key_messages: ['Reclamo con foto y GPS', 'Pago de tasas desde el celular'],
  offerings: [{ name: 'Reclamos', description: 'Foto, GPS y derivación automática', key_features: ['Mapa de hotspots', 'Estados en vivo'] }, { name: 'Tesorería', description: 'Órdenes de pago y sueldos', key_features: [] }],
  differentiators: ['Validación biométrica oficial'],
  objections: [{ objection: 'Mi gente no va a usar otra app', response: 'Login único y sin capacitación' }],
  pricing: { summary: 'Implementación en una semana', promotions: ['Primer mes sin cargo'] },
  do_not_say: ['líder en innovación'],
  screens: [{ label: 'Home', kind: 'dashboard' }],
};

describe('factsFromKb', () => {
  it('estructura todos los bloques del KB 1.2', () => {
    const f = factsFromKb(KB);
    expect(f.name).toBe('Munify');
    expect(f.industry).toBe('GovTech');
    expect(f.keyMessages).toEqual(['Reclamo con foto y GPS', 'Pago de tasas desde el celular']);
    expect(f.offerings[0]).toEqual({ name: 'Reclamos', description: 'Foto, GPS y derivación automática', features: ['Mapa de hotspots', 'Estados en vivo'] });
    expect(f.objections[0].response).toBe('Login único y sin capacitación');
    expect(f.pricing.promotions).toEqual(['Primer mes sin cargo']);
    expect(f.doNotSay).toEqual(['líder en innovación']);
    expect(f.source).toBe('kb');
  });
});

describe('factsFromBrief — parsea de vuelta el markdown de kbToBrief', () => {
  it('ida y vuelta: el brief generado desde el KB recupera los mismos hechos', () => {
    const f = factsFromBrief(kbToBrief(KB));
    expect(f.name).toBe('Munify');
    expect(f.tagline).toBe('El municipio en tiempo real');
    expect(f.description).toBe('El vecino reclama, tramita y paga desde el celular.');
    expect(f.valueStory).toBe('Un único sistema de punta a punta.');
    expect(f.industry).toBe('GovTech');
    expect(f.targetAudience).toBe('Intendentes y secretarios');
    expect(f.keyMessages).toEqual(KB.key_messages);
    expect(f.offerings.map((o: { name: string }) => o.name)).toEqual(['Reclamos', 'Tesorería']);
    expect(f.offerings[0].features).toEqual(['Mapa de hotspots', 'Estados en vivo']);
    expect(f.differentiators).toEqual(['Validación biométrica oficial']);
    expect(f.objections[0]).toEqual({ objection: 'Mi gente no va a usar otra app', response: 'Login único y sin capacitación' });
    expect(f.pricing.summary).toBe('Implementación en una semana');
    expect(f.pricing.promotions).toEqual(['Primer mes sin cargo']);
    expect(f.doNotSay).toEqual(['líder en innovación']);
    expect(f.source).toBe('brief');
  });
  it('un brief libre (sin los encabezados) va entero a description, sin perder nada', () => {
    const libre = 'Somos una panadería de barrio.\nHacemos pan de masa madre.\nEnvíos a domicilio.';
    const f = factsFromBrief(libre, 'La Espiga');
    expect(f.name).toBe('La Espiga');
    expect(f.description).toBe(libre);
    expect(f.source).toBe('brief-libre');
  });
  it('vacío no rompe', () => {
    expect(factsFromBrief('', 'X').description).toBe('');
    expect(factsFromBrief(undefined).name).toBe('el producto');
  });
});

describe('buildProjectFacts — KB guardado gana, después el brief', () => {
  it('con kb en el proyecto usa el KB', () => {
    expect(buildProjectFacts({ name: 'Otro', brief: '# Otro — brief\n## El negocio\nx', kb: KB }).source).toBe('kb');
  });
  it('sin kb parsea el brief y completa rubro desde project.type', () => {
    const f = buildProjectFacts({ name: 'Munify', type: 'GovTech', brief: 'texto libre' });
    expect(f.source).toBe('brief-libre');
    expect(f.industry).toBe('GovTech');
    expect(f.rawBrief).toBe('texto libre');
  });
});

describe('factsText — por secciones, sin tope', () => {
  it('todas las secciones', () => {
    const t = factsText(factsFromKb(KB));
    for (const s of ['NEGOCIO: Munify', 'RUBRO: GovTech', 'MENSAJES CLAVE', 'QUÉ OFRECE', 'POR QUÉ ES DISTINTO', 'DOLORES Y OBJECIONES', 'OFERTA / CTA', 'NO DECIR']) expect(t).toContain(s);
  });
  it('sólo las pedidas', () => {
    const t = factsText(factsFromKb(KB), ['negocio', 'oferta']);
    expect(t).toContain('OFERTA / CTA');
    expect(t).not.toContain('MENSAJES CLAVE');
    expect(t).not.toContain('NO DECIR');
  });
});

describe('Fixture 1 del doc: brief de más de 8.000 caracteres', () => {
  // Un KB con MUCHO texto en el medio y un hecho único al final (en "A evitar" y en la oferta).
  const kbLargo: KnowledgeBase = {
    ...KB,
    offerings: Array.from({ length: 40 }, (_, i) => ({ name: `Módulo ${i + 1}`, description: 'Descripción larga del módulo que ocupa bastante espacio en el brief para empujar los hechos del final más allá del corte viejo de dos mil quinientos caracteres.', key_features: ['a', 'b'] })),
    pricing: { summary: 'HECHO-DEL-FINAL: implementación en siete días hábiles', promotions: [] },
    do_not_say: ['PALABRA-PROHIBIDA-DEL-FINAL'],
  };
  const brief = kbToBrief(kbLargo);
  it('el brief supera los 8.000 caracteres (si no, el test no prueba nada)', () => {
    expect(brief.length).toBeGreaterThan(8000);
  });
  it('concept recibe el hecho del final (antes se cortaba a 2.500)', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'concept', context: { project: { name: 'Munify', brief }, piece: { tipo: 'filmado' } }, options: {} });
    expect(prompt).toContain('HECHO-DEL-FINAL');
    expect(prompt).toContain('PALABRA-PROHIBIDA-DEL-FINAL');
  });
  it('strategy también', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'strategy', context: { project: { name: 'Munify', brief } }, options: { perfil: 'campaña' } });
    expect(prompt).toContain('HECHO-DEL-FINAL');
  });
  it('con el KB guardado en el proyecto el resultado es el mismo sin pasar por el markdown', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'concept', context: { project: { name: 'Munify', brief: 'lo que sea', kb: kbLargo }, piece: {} }, options: {} });
    expect(prompt).toContain('HECHO-DEL-FINAL');
  });
});
