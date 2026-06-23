import { describe, it, expect } from 'vitest';
import { kbToBrief, kbToBrandKit, kbToProjectInput, isValidKB, type KnowledgeBase } from './knowledgeBase';

const KB: KnowledgeBase = {
  contract_version: '1.1',
  business: {
    name: 'Munify',
    tagline: 'Conecta al vecino con su municipio en una app.',
    description: 'El vecino reclama, hace tramites y paga desde el celular.',
    industry: 'Gestion municipal (govtech)',
    target_audience: 'Intendentes y secretarios de municipios',
  },
  offerings: [
    { name: 'Reclamos', description: 'Reporta problemas con foto y GPS.', key_features: ['Foto y GPS', 'Derivacion por IA'] },
    { name: 'Tramites', description: 'Tramites online con validacion RENAPER.' },
  ],
  pricing: { model: 'per_capita', summary: 'El municipio paga por habitante; la app es gratis para el vecino.', promotions: ['3 meses gratis sin tarjeta'] },
  differentiators: ['Un solo sistema con login unico', 'App gratis para el vecino'],
  objections: [{ objection: 'Ya tenemos un sistema.', response: 'Nos integramos con lo que ya tienen.' }],
  do_not_say: ['No inventar precios.'],
  screens: [
    { label: 'Home', url: 'https://app.munify.com.ar/kb-ui/home.html' },
    { label: 'Reclamo', url: 'https://app.munify.com.ar/kb-ui/reclamo.html' },
  ],
  brand: {
    logo: { primary: 'https://app.munify.com.ar/kb-ui/logo.svg' },
    colors: { primary: '#103070', accent: '#C8A24E' },
    phonetic: 'Munifai',
    tone: 'cercano',
  },
};

describe('kbToBrief', () => {
  const brief = kbToBrief(KB);
  it('incluye negocio, oferta y diferenciadores', () => {
    expect(brief).toContain('# Munify');
    expect(brief).toContain('El vecino reclama');
    expect(brief).toContain('**Reclamos**');
    expect(brief).toContain('Un solo sistema con login unico');
  });
  it('mapea objeciones como dolores', () => {
    expect(brief).toContain('Ya tenemos un sistema.');
    expect(brief).toContain('Nos integramos');
  });
  it('incluye oferta/CTA y do_not_say', () => {
    expect(brief).toContain('3 meses gratis');
    expect(brief).toContain('No inventar precios.');
  });
  it('NO mete lo visual en el brief (eso va por brand/screens)', () => {
    expect(brief).not.toContain('logo.svg');
    expect(brief).not.toContain('#103070');
  });
});

describe('kbToBrandKit', () => {
  it('mapea color de acento, logo y fonética', () => {
    const bk = kbToBrandKit(KB)!;
    expect(bk.name).toBe('Munify');
    expect(bk.color).toBe('#C8A24E');
    expect(bk.logoUrl).toContain('logo.svg');
    expect(bk.phonetic).toBe('Munifai');
  });
  it('undefined si el KB no trae brand', () => {
    expect(kbToBrandKit({ ...KB, brand: undefined })).toBeUndefined();
  });
});

describe('kbToProjectInput', () => {
  it('arma el input del proyecto y conserva las screens aparte', () => {
    const inp = kbToProjectInput(KB);
    expect(inp.name).toBe('Munify');
    expect(inp.type).toContain('govtech');
    expect(inp.brief).toContain('# Munify');
    expect(inp.screens).toHaveLength(2);
    expect(inp.brandKit?.color).toBe('#C8A24E');
  });
});

describe('isValidKB', () => {
  it('acepta un KB con business.name + offerings', () => {
    expect(isValidKB(KB)).toBe(true);
  });
  it('rechaza basura', () => {
    expect(isValidKB(null)).toBe(false);
    expect(isValidKB({})).toBe(false);
    expect(isValidKB({ business: { name: 'x' } })).toBe(false); // sin offerings
  });
});
