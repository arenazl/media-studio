// WO-K4 — los moldes con MEDIA KIT + el FIX de la fuga narración→storyboard.
// Invariantes DUROS:
//   1. CON kit, las capturas REALES (nombre + qué demuestra + micro-animación) y los momentos entran
//      al prompt de concept/script/storyboard.
//   2. SIN kit el prompt es byte-idéntico al de antes (mismo criterio que el commit 0d0f014).
//   3. El storyboard YA NO devuelve escenas mudas: la narración del guion se propaga a `dialogo`.
// Se testea el builder/parser del server directo (están exportados) — sin red, sin Claude.
import { describe, it, expect } from 'vitest';
// @ts-expect-error el módulo del server es .mjs sin tipos; el resolver de vitest lo carga igual.
import { buildFunctionPrompt, parseFunctionResult } from '../../server/functions.mjs';

interface Built { prompt: string }
const build = (functionId: string, ctx: object, options: object = {}): Built =>
  buildFunctionPrompt({ functionId, context: ctx, options }) as Built;

const PROJECT = { name: 'ACME', brief: 'un brief', phonetic: 'ACME' };
const MEDIA_KIT = {
  pantallas: [
    { nombre: '[DEMO] Home', archivo: 'screens/01-demo-home.png', queDemuestra: '[DEMO] se busca y aparece', microAnimacion: '[DEMO] el buscador se despliega', zonaClave: '[DEMO] tercio superior' },
    { nombre: '[DEMO] Detalle', archivo: 'screens/02-demo-detalle.png', queDemuestra: '[DEMO] la ficha completa', microAnimacion: '[DEMO] la ficha entra desde abajo' },
  ],
  momentos: [{ nombre: '[DEMO] Del home al detalle', historia: '[DEMO] entro y abro la ficha', remate: '[DEMO] remate', pantallas: ['screens/01-demo-home.png'] }],
  cta: { principal: '[DEMO] Entrá y probalo', url: 'https://example.com/demo' },
};

describe('concept — el kit entra como materia prima', () => {
  it('CON kit nombra las capturas reales, los momentos y el CTA verificado', () => {
    const p = build('concept', { project: PROJECT, piece: { mediaKit: MEDIA_KIT } }).prompt;
    expect(p).toContain('CAPTURAS REALES DE LA APP');
    expect(p).toContain('[DEMO] Home');
    expect(p).toContain('[DEMO] el buscador se despliega');
    expect(p).toContain('MOMENTOS');
    expect(p).toContain('CTA VERIFICADO POR LA APP');
    expect(p).toContain('https://example.com/demo');
  });
  it('SIN kit el prompt no lo menciona y arranca exactamente igual que antes', () => {
    const p = build('concept', { project: PROJECT, piece: {} }).prompt;
    expect(p).not.toContain('CAPTURAS REALES');
    expect(p).not.toContain('MOMENTOS');
    expect(p.split('\n')[1]).toContain('Cada concepto: la IDEA');   // sin línea en blanco de más
  });
});

describe('script — el kit entra como materia prima', () => {
  it('CON kit las capturas están disponibles para el "visual" de cada bloque', () => {
    const p = build('script', { project: PROJECT, piece: { mediaKit: MEDIA_KIT } }).prompt;
    expect(p).toContain('CAPTURAS REALES DE LA APP');
    expect(p).toContain('[DEMO] Detalle');
  });
  it('SIN kit sigue byte-idéntico (1ª y 2ª línea exactas)', () => {
    const p = build('script', { project: PROJECT, piece: {} }).prompt;
    expect(p).not.toContain('CAPTURAS REALES');
    expect(p.split('\n')[0]).toBe(
      'Actuás como promo-director. Escribí el guion de un comercial de 18s para un reel 9:16, tono cercano.',
    );
    expect(p.split('\n')[1]).toContain('ENFOQUE GLOBAL (clave)');
  });
});

describe('storyboard — el kit entra en las dos técnicas', () => {
  it('animado CON kit lista las capturas reales', () => {
    const p = build('storyboard', { project: PROJECT, piece: { tipo: 'animado', mediaKit: MEDIA_KIT } }).prompt;
    expect(p).toContain('CAPTURAS REALES DE LA APP');
    expect(p).toContain('[DEMO] Home');
  });
  it('filmado CON kit también las ve (b-roll de producto)', () => {
    const p = build('storyboard', { project: PROJECT, piece: { tipo: 'filmado', mediaKit: MEDIA_KIT } }).prompt;
    expect(p).toContain('CAPTURAS REALES DE LA APP');
  });
  it('SIN kit los dos prompts quedan byte-idénticos (2ª línea sin corrimiento)', () => {
    const animado = build('storyboard', { project: PROJECT, piece: { tipo: 'animado' } }).prompt;
    const filmado = build('storyboard', { project: PROJECT, piece: { tipo: 'filmado' } }).prompt;
    expect(animado).not.toContain('CAPTURAS REALES');
    expect(filmado).not.toContain('CAPTURAS REALES');
    expect(animado.split('\n')[1]).toContain('Por escena: n (número)');
    expect(filmado.split('\n')[1]).toContain('Por escena: n, rol');
  });
});

// ── El FIX: la narración del guion tiene que llegar al storyboard ──────────────
const GUION = {
  blocks: [
    { role: 'hook', narration: 'Perdés media hora buscando. Y encima no aparece.' },
    { role: 'desarrollo', narration: 'Entrás, buscás y lo tenés. Comparás en un toque. Elegís tranquilo.' },
    { role: 'gag', narration: 'Todo eso, sin llamar a nadie.' },
    { role: 'cta', narration: 'Entrá y probalo.' },
  ],
};
const escenasIA = (extra: object[] = []) => JSON.stringify({
  escenas: [
    { n: 1, rol: 'hook', durSec: 4, screen: '[DEMO] Home', plano: '', angulo: '', personajes: [], accion: 'a', dialogo: '', continuidad: 'x' },
    { n: 2, rol: 'desarrollo', durSec: 5, screen: '[DEMO] Detalle', plano: '', angulo: '', personajes: [], accion: 'b', dialogo: '', continuidad: 'y' },
    { n: 3, rol: 'cta', durSec: 4, screen: '[DEMO] Home', plano: '', angulo: '', personajes: [], accion: 'c', dialogo: '', continuidad: 'z' },
    ...extra,
  ],
});
interface EscenaOut { n: number; rol: string; durSec: number; dialogo: string; archivoCaptura?: string; screen?: string }
const parseSb = (text: string, piece: object): EscenaOut[] =>
  (parseFunctionResult('storyboard', text, { context: { piece } }) as { escenas: EscenaOut[] }).escenas;

describe('storyboard.parse — propagación narración → dialogo (la fuga que dejaba los renders mudos)', () => {
  it('cada escena sale con la narración del bloque de SU rol', () => {
    const escenas = parseSb(escenasIA(), { tipo: 'animado', guion: GUION });
    expect(escenas[0].dialogo).toBe('Perdés media hora buscando. Y encima no aparece.');
    expect(escenas[1].dialogo).toBe('Entrás, buscás y lo tenés. Comparás en un toque. Elegís tranquilo.');
    expect(escenas[2].dialogo).toBe('Entrá y probalo.');
    expect(escenas.every((e) => !!e.dialogo.trim())).toBe(true);   // NINGUNA escena muda
  });
  it('propagar NO infla la duración de las escenas animadas (la regla de 8s es del talking head)', () => {
    const escenas = parseSb(escenasIA(), { tipo: 'animado', guion: GUION });
    expect(escenas.map((e) => e.durSec)).toEqual([4, 5, 4]);
  });
  it('varias escenas del mismo rol se reparten el texto por oraciones, sin repetirlo', () => {
    const extra = [{ n: 4, rol: 'desarrollo', durSec: 4, screen: '[DEMO] Home', plano: '', angulo: '', personajes: [], accion: 'd', dialogo: '', continuidad: 'w' }];
    const escenas = parseSb(escenasIA(extra), { tipo: 'animado', guion: GUION });
    const desarrollo = escenas.filter((e) => e.rol === 'desarrollo').map((e) => e.dialogo);
    expect(desarrollo).toHaveLength(2);
    expect(desarrollo[0]).not.toBe(desarrollo[1]);
    expect(desarrollo.join(' ')).toBe('Entrás, buscás y lo tenés. Comparás en un toque. Elegís tranquilo.');
  });
  it('NO pisa un diálogo que la IA ya escribió (filmado queda igual que siempre)', () => {
    const filmado = JSON.stringify({
      escenas: [{ n: 1, rol: 'hook', durSec: 8, plano: 'medium', angulo: 'eye', personajes: ['p1'], accion: 'a', dialogo: 'Lo que dice la actriz a cámara', continuidad: 'x' }],
    });
    const escenas = parseSb(filmado, { tipo: 'filmado', guion: GUION });
    expect(escenas[0].dialogo).toBe('Lo que dice la actriz a cámara');
  });
  it('sin guion en la pieza, las escenas quedan como vinieron (retrocompat)', () => {
    const escenas = parseSb(escenasIA(), { tipo: 'animado' });
    expect(escenas.every((e) => e.dialogo === '')).toBe(true);
  });
  it('un rol sin bloque en el guion no inventa texto', () => {
    const escenas = parseSb(escenasIA(), { tipo: 'animado', guion: { blocks: [{ role: 'hook', narration: 'Solo el hook.' }] } });
    expect(escenas[0].dialogo).toBe('Solo el hook.');
    expect(escenas[1].dialogo).toBe('');
    expect(escenas[2].dialogo).toBe('');
  });
});

describe('storyboard.parse — archivoCaptura desde el kit', () => {
  it('matchea el `screen` de la escena con la captura real', () => {
    const escenas = parseSb(escenasIA(), { tipo: 'animado', guion: GUION, mediaKit: MEDIA_KIT });
    expect(escenas[0].archivoCaptura).toBe('screens/01-demo-home.png');
    expect(escenas[1].archivoCaptura).toBe('screens/02-demo-detalle.png');
  });
  it('sin kit ninguna escena queda con archivoCaptura', () => {
    const escenas = parseSb(escenasIA(), { tipo: 'animado', guion: GUION });
    expect(escenas.every((e) => e.archivoCaptura === undefined)).toBe(true);
  });
  it('un screen que no matchea ninguna captura no se inventa una', () => {
    const raro = JSON.stringify({ escenas: [{ n: 1, rol: 'hook', durSec: 4, screen: 'pantalla inexistente', plano: '', angulo: '', personajes: [], accion: 'a', dialogo: '', continuidad: 'x' }] });
    expect(parseSb(raro, { tipo: 'animado', mediaKit: MEDIA_KIT })[0].archivoCaptura).toBeUndefined();
  });
});
