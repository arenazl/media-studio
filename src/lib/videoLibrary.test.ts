import { describe, it, expect } from 'vitest';
import {
  metaOf, setMetaFor, toggleFavorite, addTag, removeTag, setProject,
  allTags, allProjects, filterVideos, type MetaMap,
} from './videoLibrary';

const vids = [
  { id: 'a', name: 'Drone pueblo' },
  { id: 'b', name: 'Cuadrilla calle' },
  { id: 'c', name: 'Oficina municipal' },
];

describe('metaOf', () => {
  it('default vacío cuando no hay metadata', () => {
    expect(metaOf({}, 'x')).toEqual({ tags: [], favorite: false });
  });
});

describe('mutaciones inmutables', () => {
  it('no mutan el MetaMap original', () => {
    const m: MetaMap = {};
    const m2 = addTag(m, 'a', 'broll');
    expect(m).toEqual({});
    expect(m2.a.tags).toEqual(['broll']);
  });
  it('addTag normaliza y evita duplicados', () => {
    let m: MetaMap = {};
    m = addTag(m, 'a', '  Broll ');
    m = addTag(m, 'a', 'broll');
    expect(m.a.tags).toEqual(['broll']);
  });
  it('removeTag saca el tag', () => {
    let m = addTag({}, 'a', 'broll');
    m = addTag(m, 'a', 'pueblo');
    m = removeTag(m, 'a', 'broll');
    expect(m.a.tags).toEqual(['pueblo']);
  });
  it('toggleFavorite alterna', () => {
    let m = toggleFavorite({}, 'a');
    expect(m.a.favorite).toBe(true);
    m = toggleFavorite(m, 'a');
    expect(m.a.favorite).toBe(false);
  });
  it('setProject asigna y vacío lo limpia', () => {
    let m = setProject({}, 'a', 'Munify');
    expect(m.a.project).toBe('Munify');
    m = setProject(m, 'a', '   ');
    expect(m.a.project).toBeUndefined();
  });
  it('setMetaFor preserva lo no tocado', () => {
    let m = addTag({}, 'a', 'broll');
    m = setMetaFor(m, 'a', { favorite: true });
    expect(m.a).toEqual({ tags: ['broll'], favorite: true });
  });
});

describe('derivados', () => {
  it('allTags únicos y ordenados', () => {
    let m = addTag({}, 'a', 'pueblo');
    m = addTag(m, 'b', 'broll');
    m = addTag(m, 'c', 'pueblo');
    expect(allTags(m)).toEqual(['broll', 'pueblo']);
  });
  it('allProjects únicos', () => {
    let m = setProject({}, 'a', 'Munify');
    m = setProject(m, 'b', 'Otra');
    expect(allProjects(m)).toEqual(['Munify', 'Otra']);
  });
});

describe('filterVideos', () => {
  it('sin filtros → todos', () => {
    expect(filterVideos(vids, {}, {})).toHaveLength(3);
  });
  it('por favorito', () => {
    const m = toggleFavorite({}, 'b');
    expect(filterVideos(vids, m, { favorite: true }).map((v) => v.id)).toEqual(['b']);
  });
  it('por tag', () => {
    let m = addTag({}, 'a', 'pueblo');
    m = addTag(m, 'c', 'pueblo');
    expect(filterVideos(vids, m, { tag: 'pueblo' }).map((v) => v.id)).toEqual(['a', 'c']);
  });
  it('por proyecto', () => {
    const m = setProject({}, 'c', 'Munify');
    expect(filterVideos(vids, m, { project: 'Munify' }).map((v) => v.id)).toEqual(['c']);
  });
  it('búsqueda por nombre o tag', () => {
    const m = addTag({}, 'b', 'urgente');
    expect(filterVideos(vids, m, { query: 'oficina' }).map((v) => v.id)).toEqual(['c']);
    expect(filterVideos(vids, m, { query: 'urgente' }).map((v) => v.id)).toEqual(['b']);
  });
  it('combina filtros (AND)', () => {
    let m = addTag({}, 'a', 'pueblo');
    m = toggleFavorite(m, 'a');
    m = addTag(m, 'c', 'pueblo');
    expect(filterVideos(vids, m, { tag: 'pueblo', favorite: true }).map((v) => v.id)).toEqual(['a']);
  });
});
