import { describe, it, expect } from 'vitest';
import { buildLibraryTabs, filterLibItems, TEXT_PRESETS, EFFECT_PRESETS } from './editorLibrary';
import type { Comercial } from './comercial';
import type { Project, ProjectReel } from './projects';

const baseEstados = {
  negocio: 'aprobado', concepto: 'aprobado', guion: 'aprobado', cast: 'aprobado', storyboard: 'aprobado',
  pack: 'aprobado', render: 'pendiente', rodaje: 'generado', montaje: 'pendiente', publicar: 'pendiente',
} as Comercial['estados'];

describe('buildLibraryTabs — sin proyecto/comercial (proyecto nuevo)', () => {
  const tabs = buildLibraryTabs(null, undefined, undefined);
  it('clips y marca quedan vacíos (nada real que mostrar)', () => {
    expect(tabs.clips).toEqual([]);
    expect(tabs.marca).toEqual([]);
  });
  it('audio trae el catálogo de música aunque no haya voz grabada', () => {
    expect(tabs.audio.length).toBeGreaterThan(0);
    expect(tabs.audio.some((i) => i.id === 'audio-voz')).toBe(false);
  });
  it('texto y efectos son el catálogo fijo de herramientas (siempre presentes)', () => {
    expect(tabs.texto).toEqual(TEXT_PRESETS);
    expect(tabs.efectos).toEqual(EFFECT_PRESETS);
  });
});

describe('buildLibraryTabs — filmado con rodaje', () => {
  const comercial: Comercial = {
    id: 'c1', titulo: 'x', tipo: 'filmado', estados: baseEstados,
    rodaje: [
      { id: 't1', escenaN: 1, fileRef: 'proj/a.mp4', durSec: 8 },
      { id: 't2', escenaN: 2, fileRef: 'proj/b.mp4', durSec: 6 },
    ],
  };
  it('clips: un item por toma, con el fileRef real', () => {
    const tabs = buildLibraryTabs(null, undefined, comercial);
    expect(tabs.clips).toHaveLength(2);
    expect(tabs.clips[0].fileRef).toBe('proj/a.mp4');
    expect(tabs.clips[0].label).toBe('Escena 1');
  });
});

describe('buildLibraryTabs — animado con renderRef', () => {
  it('clips: un único item (el render), sin duplicar por escena', () => {
    const comercial: Comercial = { id: 'c2', titulo: 'x', tipo: 'animado', estados: baseEstados, renderRef: 'proj/anim.mp4' };
    const tabs = buildLibraryTabs(null, undefined, comercial);
    expect(tabs.clips).toEqual([{ id: 'clip-render', label: 'Render animado', meta: 'motion graphics · mp4', color: '#00B37E', fileRef: 'proj/anim.mp4', tab: 'clips' }]);
  });
  it('animado sin renderRef todavía → clips vacío', () => {
    const comercial: Comercial = { id: 'c3', titulo: 'x', tipo: 'animado', estados: baseEstados };
    expect(buildLibraryTabs(null, undefined, comercial).clips).toEqual([]);
  });
});

describe('buildLibraryTabs — voz + marca', () => {
  it('audio: la voz grabada aparece primero que el catálogo', () => {
    const reel = { id: 'r1', nombre: 'x', frases: 0, guion: [], voiceConfig: { voice_id: 'v', stability: 0, similarity: 0, style: 0, speed: 1, model: 'x', audioRef: 'proj/voz.mp3' } } as unknown as ProjectReel;
    const tabs = buildLibraryTabs(null, reel, undefined);
    expect(tabs.audio[0]).toEqual({ id: 'audio-voz', label: 'Voz en off', meta: 'grabada del comercial', color: '#00B37E', fileRef: 'proj/voz.mp3', tab: 'audio' });
  });
  it('marca: logo + color + fonética cuando el brandKit los tiene', () => {
    const project = { brandKit: { logoUrl: 'https://x/logo.png', color: '#7C5CFF', phonetic: 'Munifái', logoPos: 'tr' } } as unknown as Project;
    const tabs = buildLibraryTabs(project, undefined, undefined);
    expect(tabs.marca.map((i) => i.id)).toEqual(['marca-logo', 'marca-color', 'marca-fon']);
  });
});

describe('filterLibItems', () => {
  const items = TEXT_PRESETS;
  it('sin query → devuelve todo', () => {
    expect(filterLibItems(items, '')).toEqual(items);
    expect(filterLibItems(items, '   ')).toEqual(items);
  });
  it('filtra case-insensitive por label o meta', () => {
    expect(filterLibItems(items, 'cta').map((i) => i.id)).toEqual(['preset-cta']);
    expect(filterLibItems(items, 'GRANDE').map((i) => i.id)).toEqual(['preset-titulo']);
  });
  it('sin coincidencias → vacío', () => {
    expect(filterLibItems(items, 'zzz-no-existe')).toEqual([]);
  });
});
