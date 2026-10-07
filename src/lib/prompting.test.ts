// Fase 3 de la reingeniería (2026-10-07): la parte mecánica del Prompt Engine V2. Fuente: doc §03
// (Regla 2 versionado, Regla 4 largos, Regla 5 la duración gobierna el texto, Regla 7 reparación, P0.7).
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { PROMPT_VERSIONS, maxNarrationWords, presupuestoGuion, presupuestoTexto, validarResultado, promptReparacion, generationKey } from '../../server/prompting.mjs';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { buildFunctionPrompt } from '../../server/functions.mjs';

describe('presupuesto de palabras (Regla 5)', () => {
  it('2,7 palabras por segundo, piso de 3', () => {
    expect(maxNarrationWords(10)).toBe(27);
    expect(maxNarrationWords(8)).toBe(21);
    expect(maxNarrationWords(0)).toBe(3);
  });
  it('reparte 20 s en hook/desarrollo/gag/cta con palabras por rol', () => {
    const p = presupuestoGuion(20);
    expect(p.total).toBe(20);
    expect(p.roles.hook.seg).toBe(3);
    expect(p.roles.desarrollo.seg).toBe(9);
    expect(p.roles.desarrollo.palabras).toBe(24);
    expect(p.totalPalabras).toBe(52);   // suma de los topes por rol (8+24+10+10), no 20×2,7
  });
  it('el texto para el prompt tiene los números', () => {
    const t = presupuestoTexto(20);
    expect(t).toContain('hook: 3s, hasta 8 palabras');
    expect(t).toContain('Total: 20s y hasta 52 palabras habladas');
  });
  it('el prompt del guion lleva el presupuesto en números y no "sé muy conciso"', () => {
    const { prompt, promptVersion } = buildFunctionPrompt({ functionId: 'script', context: { project: { name: 'X', brief: 'b' }, piece: { durationSec: 20 } }, options: { duracion: 20 } });
    expect(prompt).toContain('PRESUPUESTO HABLADO (contá palabras):\n- hook: 3s, máximo 8 palabras');
    expect(prompt).toContain('Total: 20s, máximo 52 palabras');
    expect(prompt).not.toContain('SÉ MUY CONCISO');
    expect(promptVersion).toBe('script/2.0');
  });
  it('el storyboard filmado acota el diálogo por segundo y el total', () => {
    const { prompt } = buildFunctionPrompt({ functionId: 'storyboard', context: { project: { name: 'X' }, piece: { tipo: 'filmado', durationSec: 20, guion: { blocks: [] } } }, options: {} });
    expect(prompt).toContain('máximo 2,7 palabras por segundo (8s = 21 palabras)');
    expect(prompt).toContain('(máximo 25s)');
  });
});

describe('versionado (Regla 2)', () => {
  it('todos los moldes tienen versión y buildFunctionPrompt la devuelve', () => {
    for (const id of ['strategy', 'concept', 'script', 'cast', 'storyboard', 'flowpack', 'publish', 'qa', 'videoprompt', 'briefToKb']) {
      expect(PROMPT_VERSIONS[id], id).toMatch(/^[a-zA-Z]+\/\d/);
    }
    expect(buildFunctionPrompt({ functionId: 'concept', context: { project: { name: 'X', brief: 'b' }, piece: {} }, options: {} }).promptVersion).toBe('concept/2.0');
  });
});

describe('validación por molde (P0.7)', () => {
  const idea = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`).join(' ');
  it('concept: 3 conceptos, ganchos distintos, idea de 40 a 60 palabras, sin tiempos ni planos', () => {
    const ok = { conceptos: [1, 2, 3].map((i) => ({ id: `c${i}`, topico: `T${i}`, tipoGancho: `G${i}`, idea: idea(50) })) };
    expect(validarResultado('concept', ok, {})).toEqual([]);
    const mal = { conceptos: [{ id: 'c1', topico: 'T', tipoGancho: 'G', idea: idea(120) + ' plano cenital de 2s' }, { id: 'c2', topico: '', tipoGancho: 'G', idea: idea(10) }] };
    const e = validarResultado('concept', mal, {});
    expect(e.some((x: string) => x.includes('3 conceptos'))).toBe(true);
    expect(e.some((x: string) => x.includes('distintos'))).toBe(true);
    expect(e.some((x: string) => x.includes('palabras (va de 40 a 60)'))).toBe(true);
    expect(e.some((x: string) => x.includes('tiempos o planos'))).toBe(true);
    expect(e.some((x: string) => x.includes('falta el tópico'))).toBe(true);
  });
  it('script: roles, orden, palabras por segundo y suma de duraciones', () => {
    const body = { options: { duracion: 20 }, context: { piece: {} } };
    const ok = { blocks: [{ role: 'hook', narration: idea(7), durSec: 3 }, { role: 'desarrollo', narration: idea(22), durSec: 9 }, { role: 'gag', narration: idea(9), durSec: 4 }, { role: 'cta', narration: idea(9), durSec: 4 }] };
    expect(validarResultado('script', ok, body)).toEqual([]);
    const mal = { blocks: [{ role: 'hook', narration: idea(20), durSec: 3 }, { role: 'cta', narration: idea(5), durSec: 4 }, { role: 'gag', narration: idea(5), durSec: 4 }] };
    const e = validarResultado('script', mal, body);
    expect(e.some((x: string) => x.includes('falta el bloque "desarrollo"'))).toBe(true);
    expect(e.some((x: string) => x.includes('gag tiene que ir antes'))).toBe(true);
    expect(e.some((x: string) => x.includes('20 palabras en 3s'))).toBe(true);
    expect(e.some((x: string) => x.includes('suman 11s'))).toBe(true);
  });
  it('storyboard: ids del cast, rol, palabras por segundo y total', () => {
    const body = { context: { piece: { tipo: 'filmado', durationSec: 20, cast: { personajes: [{ id: 'p1' }] } } } };
    const mal = { escenas: [{ n: 1, rol: 'hook', durSec: 8, personajes: ['p9'], dialogo: idea(40) }, { n: 2, rol: 'intro', durSec: 30, personajes: [], dialogo: '' }] };
    const e = validarResultado('storyboard', mal, body);
    expect(e.some((x: string) => x.includes('"p9"'))).toBe(true);
    expect(e.some((x: string) => x.includes('rol "intro"'))).toBe(true);
    expect(e.some((x: string) => x.includes('40 palabras en 8s'))).toBe(true);
    expect(e.some((x: string) => x.includes('suman 38s'))).toBe(true);
  });
  it('cast y publish: largos', () => {
    expect(validarResultado('cast', { personajes: [{ id: 'p1', fisicoEn: idea(5), fisicoEs: idea(30) }], lugar: { descripcionEn: idea(100) } }, {})).toHaveLength(3);
    expect(validarResultado('publish', { caption: '', hookOnScreen: idea(12), hashtags: ['#a b'] }, {})).toHaveLength(3);
    expect(validarResultado('publish', { caption: 'x', hookOnScreen: 'y', hashtags: ['#ok'] }, {})).toEqual([]);
  });
  it('un molde sin validador no falla', () => {
    expect(validarResultado('videoprompt', { prompt: 'x' }, {})).toEqual([]);
  });
});

describe('generationKey (Fase 6)', () => {
  it('misma entrada → misma clave; cambia cualquier parte → otra clave', () => {
    const base = { functionId: 'script', promptVersion: 'script/1.2', model: 'opus', provider: 'claude', prompt: 'hola' };
    expect(generationKey(base)).toBe(generationKey({ ...base }));
    expect(generationKey(base)).toMatch(/^[0-9a-f]{64}$/);
    expect(generationKey({ ...base, prompt: 'hola!' })).not.toBe(generationKey(base));
    expect(generationKey({ ...base, model: 'sonnet' })).not.toBe(generationKey(base));
    expect(generationKey({ ...base, promptVersion: 'script/1.3' })).not.toBe(generationKey(base));
  });
});

describe('reparación (Regla 7)', () => {
  it('es corta, lista los errores y pega el JSON anterior', () => {
    const t = promptReparacion('script', { blocks: [] }, ['falta el bloque "cta"']);
    expect(t).toContain('- falta el bloque "cta"');
    expect(t).toContain('JSON ANTERIOR:\n{"blocks":[]}');
    expect(t.length).toBeLessThan(600);
  });
});
