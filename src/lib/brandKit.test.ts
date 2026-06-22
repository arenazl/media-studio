import { describe, it, expect } from 'vitest';
import { resolveBrand, logoPosClass, brandPhonetic, DEFAULT_BRAND } from './brandKit';

describe('resolveBrand', () => {
  it('aplica defaults cuando no hay marca', () => {
    expect(resolveBrand()).toEqual({ color: DEFAULT_BRAND.color, logoPos: 'tr' });
    expect(resolveBrand(null)).toEqual({ color: DEFAULT_BRAND.color, logoPos: 'tr' });
  });
  it('respeta los overrides del proyecto', () => {
    const b = resolveBrand({ name: 'Acme', color: '#FF0066', logoPos: 'bl' });
    expect(b.color).toBe('#FF0066');
    expect(b.logoPos).toBe('bl');
    expect(b.name).toBe('Acme');
  });
  it('no muta la entrada', () => {
    const input = { color: '#123456' };
    resolveBrand(input);
    expect(input).toEqual({ color: '#123456' });
  });
});

describe('logoPosClass', () => {
  it('mapea cada esquina', () => {
    expect(logoPosClass('tl')).toBe('rt-brand--tl');
    expect(logoPosClass('br')).toBe('rt-brand--br');
  });
  it('default tr', () => {
    expect(logoPosClass()).toBe('rt-brand--tr');
  });
});

describe('brandPhonetic', () => {
  it('prefiere la fonética explícita', () => {
    expect(brandPhonetic({ name: 'Munify', phonetic: 'Munifái' })).toBe('Munifái');
  });
  it('cae al nombre', () => {
    expect(brandPhonetic({ name: 'Acme' })).toBe('Acme');
  });
  it('vacío si no hay nada', () => {
    expect(brandPhonetic()).toBe('');
    expect(brandPhonetic({})).toBe('');
  });
});
