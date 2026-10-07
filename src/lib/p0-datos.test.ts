// Reingeniería 2026-10-07, Fase 1 (bugs de datos P0). Fuente: docs/14-skills/MEDIA-STUDIO-REINGENIERIA-COMPLETA.md §02.
// Cada test acá nació de un bug confirmado leyendo el código: si uno falla, volvió el bug.
import { describe, it, expect } from 'vitest';
import { scriptNarrations, scriptToText } from '../../server/scriptToText.mjs';
// @ts-expect-error el módulo del server es .mjs sin tipos; el resolver de vitest lo carga igual.
import { buildFunctionPrompt, parseFunctionResult } from '../../server/functions.mjs';

const BRIEF = 'Munify conecta al vecino con su municipio. ' + 'Dato del final del brief: tesoreria y sueldos. '.repeat(40);
const project = { name: 'Munify', phonetic: 'Munifai', brief: BRIEF, type: 'GovTech / gestion municipal', screens: [] };
const guionBlocks = {
  blocks: [
    { role: 'hook', narration: 'El bache cumple tres años.', visual: 'bache con velita', durSec: 3 },
    { role: 'desarrollo', narration: 'Con Munify el reclamo llega solo.', visual: 'pantalla del reclamo', durSec: 8 },
    { role: 'gag', narration: '', visual: 'el nene con la torta', durSec: 3 },
    { role: 'cta', narration: 'Munifai. El municipio en tiempo real.', durSec: 4 },
  ],
};

describe('scriptToText — helper canónico del guion (P0.2)', () => {
  it('array legacy: devuelve las frases tal cual, sin vacías', () => {
    expect(scriptNarrations(['Hola. ', '', 'Chau'])).toEqual(['Hola.', 'Chau']);
    expect(scriptToText(['Hola.', 'Chau'])).toBe('Hola. · Chau');
  });
  it('{ blocks } nuevo: saca las narraciones en orden', () => {
    expect(scriptNarrations(guionBlocks)).toEqual(['El bache cumple tres años.', 'Con Munify el reclamo llega solo.', 'Munifai. El municipio en tiempo real.']);
  });
  it('vacío, null y undefined: [] y "" sin romper', () => {
    expect(scriptNarrations(undefined)).toEqual([]);
    expect(scriptNarrations(null)).toEqual([]);
    expect(scriptNarrations({})).toEqual([]);
    expect(scriptToText(undefined)).toBe('');
    expect(scriptToText({ blocks: [] }, { roles: true })).toBe('');
  });
  it('bloque sin narration: se saltea en las frases; con roles conserva el visual', () => {
    expect(scriptNarrations(guionBlocks)).toHaveLength(3);
    const t = scriptToText(guionBlocks, { roles: true });
    expect(t).toContain('[gag]  (visual: el nene con la torta)');
    expect(t).toContain('[hook] El bache cumple tres años. (visual: bache con velita)');
  });
  it('caracteres especiales: tildes, comillas y ñ pasan intactos', () => {
    const g = { blocks: [{ role: 'hook', narration: '¿Y el bache? "Ñandú" · fin' }] };
    expect(scriptToText(g)).toBe('¿Y el bache? "Ñandú" · fin');
  });
});

describe('publish y qa leen el GUION, nunca caen al brief en silencio (P0.2)', () => {
  it('publish con guion estructurado manda las narraciones y no el brief', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'publish', context: { project, piece: { guion: guionBlocks } }, options: { red: 'instagram' } });
    expect(prompt).toContain('GUION: El bache cumple tres años. · Con Munify el reclamo llega solo.');
    expect(prompt).not.toContain('Dato del final del brief');
  });
  it('publish con guion legacy sigue igual que antes', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'publish', context: { project, piece: { guion: ['Uno.', 'Dos.'] } }, options: {} });
    expect(prompt).toContain('GUION: Uno. · Dos.');
  });
  it('qa de una pieza suelta (no holístico) con guion estructurado lee el guion', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'qa', context: { project, piece: { guion: guionBlocks } }, options: {} });
    expect(prompt).toContain('GUION DE LA PIEZA: El bache cumple tres años.');
    expect(prompt).not.toContain('Dato del final del brief');
  });
});

describe('cast: el rubro viene del KB, el brief no entra en la regla de locación (P0.3)', () => {
  it('usa project.type como rubro y no interpola el brief', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'cast', context: { project, piece: { guion: guionBlocks } }, options: {} });
    expect(prompt).toContain('RUBRO: GovTech / gestion municipal');
    expect(prompt).not.toContain('Dato del final del brief');
  });
  it('sin rubro cae al nombre, nunca al brief', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'cast', context: { project: { ...project, type: '' }, piece: { guion: guionBlocks } }, options: {} });
    expect(prompt).toContain('RUBRO: Munify');
    expect(prompt).not.toContain('Dato del final del brief');
  });
});

describe('flowpack: una sola política de identidad, sin la contradicción vieja de Veo (P0.4)', () => {
  const storyboard = [{ n: 1, rol: 'hook', durSec: 8, plano: 'medium shot waist-up', personajes: ['p1'], accion: 'habla', dialogo: 'Hola' }];
  const cast = { personajes: [{ id: 'p1', nombre: 'Ana', fisicoEn: 'Argentine woman in her late 20s with a very long and detailed physical description that must never be pasted into a scene prompt' }], lugar: { descripcionEn: 'office' } };
  it('el pack compilado nombra al personaje corto y NUNCA pega el fisicoEn largo', () => {
    const body = { functionId: 'flowpack', context: { project, piece: { storyboard, cast } }, options: {} };
    const out = parseFunctionResult('flowpack', '1| talks', body);
    expect(out.escenas[0].prompt).toContain('Ana, ');
    expect(out.escenas[0].prompt).not.toContain('must never be pasted');
  });
  it('la regeneración de una escena (IA) tampoco pide repetir la descripción física exacta', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'flowpack', context: { project, piece: { storyboard, cast } }, options: {}, regenerate: { escenaN: 1 } });
    expect(prompt).not.toMatch(/misma descripcion fisica EXACTA/i);
    expect(prompt).toContain('NUNCA se repite la descripcion fisica larga');
  });
  it('videoprompt (que comparte las reglas) tampoco', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'videoprompt', context: {}, options: { brief: 'una mujer en una oficina', modo: 'talking-head' } });
    expect(prompt).not.toMatch(/misma descripcion fisica EXACTA/i);
  });
});
