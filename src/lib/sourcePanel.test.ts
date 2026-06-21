import { describe, it, expect } from 'vitest';
import { deriveFilterOptions, filterItems, sortItems, applyView, deriveName, type SourceItem } from './sourcePanel';

const items: SourceItem[] = [
  { id: 'a', label: 'Lucía', sub: 'es-AR', meta: { gender: 'female', lang: 'Latinoamericano' }, createdAt: 30 },
  { id: 'b', label: 'Mauricio', sub: 'es-AR', meta: { gender: 'male', lang: 'Latinoamericano' }, createdAt: 10 },
  { id: 'c', label: 'Karolina', sub: 'warm', meta: { gender: 'female', lang: 'Inglés (US)' }, searchText: 'calm and deep', createdAt: 20 },
];

describe('deriveFilterOptions', () => {
  it('saca los valores únicos de meta[key], ordenados', () => {
    expect(deriveFilterOptions(items, 'gender')).toEqual(['female', 'male']);
    expect(deriveFilterOptions(items, 'lang')).toEqual(['Inglés (US)', 'Latinoamericano']);
  });
  it('ignora items sin esa meta', () => {
    expect(deriveFilterOptions([{ id: 'x', label: 'X' }], 'gender')).toEqual([]);
  });
});

describe('filterItems', () => {
  it('sin query ni filtros → todos', () => {
    expect(filterItems(items, '', {})).toHaveLength(3);
  });
  it('filtra por meta exacta', () => {
    expect(filterItems(items, '', { gender: 'female' }).map((i) => i.id)).toEqual(['a', 'c']);
  });
  it('combina filtros (AND)', () => {
    expect(filterItems(items, '', { gender: 'female', lang: 'Latinoamericano' }).map((i) => i.id)).toEqual(['a']);
  });
  it('busca en label, sub y searchText (case-insensitive)', () => {
    expect(filterItems(items, 'luc', {}).map((i) => i.id)).toEqual(['a']);
    expect(filterItems(items, 'deep', {}).map((i) => i.id)).toEqual(['c']);   // viene de searchText
    expect(filterItems(items, 'ES-ar', {}).map((i) => i.id)).toEqual(['a', 'b']);
  });
  it('un filtro vacío no descarta nada', () => {
    expect(filterItems(items, '', { gender: '' })).toHaveLength(3);
  });
});

describe('sortItems', () => {
  it('recientes: createdAt descendente', () => {
    expect(sortItems(items, 'recent').map((i) => i.id)).toEqual(['a', 'c', 'b']);
  });
  it('alfabético por label', () => {
    expect(sortItems(items, 'alpha').map((i) => i.id)).toEqual(['c', 'a', 'b']); // Karolina, Lucía, Mauricio
  });
  it('none no muta el orden ni el array original', () => {
    const same = sortItems(items, 'none');
    expect(same).toBe(items);
  });
  it('recent no muta el array original', () => {
    const before = items.map((i) => i.id);
    sortItems(items, 'recent');
    expect(items.map((i) => i.id)).toEqual(before);
  });
});

describe('applyView', () => {
  it('filtra y después ordena por recientes', () => {
    const out = applyView(items, '', { gender: 'female' }, 'recent');
    expect(out.map((i) => i.id)).toEqual(['a', 'c']);   // ambas female, a(30) antes que c(20)
  });
});

describe('deriveName', () => {
  it('toma las primeras palabras del texto', () => {
    expect(deriveName('¿Tu municipio todavía maneja todo en papel y planillas?')).toBe('¿Tu municipio todavía maneja todo en');
  });
  it('recorta por largo máximo con elipsis', () => {
    const out = deriveName('Supercalifragilisticoespialidoso etcétera', 6, 20);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(21);
  });
  it('texto vacío → fallback', () => {
    expect(deriveName('   ')).toBe('Sin título');
  });
});
