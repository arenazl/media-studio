// WO-2: los moldes se parametrizan por formato (aspecto/plataforma/duración). Invariante DURO (D4):
// SIN formato el prompt es byte-idéntico al anterior (retrocompat verificable); CON formato aparecen
// el aspecto y la plataforma donde antes había "9:16" hardcodeado. Se testea el builder del server
// directo (buildFunctionPrompt está exportado) — sin red, sin Claude.
import { describe, it, expect } from 'vitest';
// @ts-expect-error el módulo del server es .mjs sin tipos; el resolver de vitest lo carga igual.
import { buildFunctionPrompt } from '../../server/functions.mjs';

interface Built { prompt: string }
const build = (functionId: string, ctx: object, options: object = {}, regenerate?: object): Built =>
  buildFunctionPrompt({ functionId, context: ctx, options, regenerate }) as Built;

const PROJECT = { name: 'ACME', brief: 'un brief', phonetic: 'ACME' };
const FMT_YT = { aspecto: '16:9', plataforma: 'YouTube', durDefault: 25 };

describe('script — parametrización por formato', () => {
  it('SIN formato menciona "un reel 9:16" (byte-idéntico al anterior)', () => {
    const p = build('script', { project: PROJECT, piece: {} }).prompt;
    expect(p).toContain('para un reel 9:16');
    expect(p).not.toContain('16:9');
  });
  it('CON formato 16:9/YouTube interpola aspecto y plataforma', () => {
    const p = build('script', { project: PROJECT, piece: { formato: FMT_YT } }).prompt;
    expect(p).toContain('16:9');
    expect(p).toContain('YouTube');
    expect(p).not.toContain('reel 9:16');
  });
});

describe('storyboard — parametrización por formato', () => {
  it('filmado SIN formato dice "FILMADO 9:16"', () => {
    const p = build('storyboard', { project: PROJECT, piece: { tipo: 'filmado' } }).prompt;
    expect(p).toContain('FILMADO 9:16');
  });
  it('filmado CON 16:9 dice "FILMADO 16:9"', () => {
    const p = build('storyboard', { project: PROJECT, piece: { tipo: 'filmado', formato: FMT_YT } }).prompt;
    expect(p).toContain('FILMADO 16:9');
    expect(p).not.toContain('FILMADO 9:16');
  });
  it('animado SIN formato dice "ANIMADO 9:16"', () => {
    const p = build('storyboard', { project: PROJECT, piece: { tipo: 'animado' } }).prompt;
    expect(p).toContain('ANIMADO 9:16');
  });
});

describe('concept — bifurcación por técnica de la pieza (filmado vs animado)', () => {
  const PROJECT_SCREENS = { ...PROJECT, screens: [{ label: 'Panel de trámites', kind: 'dashboard' }] };
  it('animado: el prompt le prohíbe filmar y le pide motion graphics sobre la UI', () => {
    const p = build('concept', { project: PROJECT_SCREENS, piece: { tipo: 'animado' } }).prompt;
    expect(p).toContain('VIDEO ANIMADO');
    expect(p).toContain('motion graphics');
    expect(p).toContain('NO hay actores');
    expect(p).toContain('DIRECCIÓN DE MOTION/UI');
    // las pantallas del KB entran como materia prima del concepto animado
    expect(p).toContain('Panel de trámites');
  });
  it('SIN tipo no menciona la técnica animada (comportamiento actual)', () => {
    const p = build('concept', { project: PROJECT, piece: {} }).prompt;
    expect(p).not.toContain('VIDEO ANIMADO');
    expect(p).not.toContain('motion graphics');
  });
  it('SIN tipo el prompt es byte-idéntico al de tipo filmado (retrocompat)', () => {
    const sinTipo = build('concept', { project: PROJECT, piece: {} }).prompt;
    const filmado = build('concept', { project: PROJECT, piece: { tipo: 'filmado' } }).prompt;
    expect(sinTipo).toBe(filmado);
    // 1ª y 2ª línea exactas: un proyecto viejo no puede haber cambiado NI UN BYTE.
    expect(sinTipo.split('\n')[1]).toContain('Cada concepto: la IDEA');
  });
});

describe('strategy — parametrización por formato (nivel proyecto)', () => {
  it('SIN formato el shape de ejemplo usa "reel 9:16"/20 (byte-idéntico)', () => {
    const p = build('strategy', { project: PROJECT }, { perfil: 'campaña' }).prompt;
    expect(p).toContain('"format": "reel 9:16"');
    expect(p).toContain('"durationSec": 20');
  });
  it('CON formato el shape refleja aspecto/plataforma/duración', () => {
    const p = build('strategy', { project: { ...PROJECT, formato: FMT_YT } }, { perfil: 'campaña' }).prompt;
    expect(p).toContain('"format": "16:9 para YouTube"');
    expect(p).toContain('"durationSec": 25');
  });
});

describe('flowpack — parametrización por formato (VEO_RULES intacto)', () => {
  it('SIN formato dice "comercial 9:16"', () => {
    const p = build('flowpack', { project: PROJECT, piece: { storyboard: [], cast: null } }).prompt;
    expect(p).toContain('comercial 9:16');
  });
  it('CON 16:9 dice "comercial 16:9" pero conserva VEO_RULES (talking head battle-tested)', () => {
    const p = build('flowpack', { project: PROJECT, piece: { storyboard: [], cast: null, formato: FMT_YT } }).prompt;
    expect(p).toContain('comercial 16:9');
    // VEO_RULES no se toca: su bloque de estilo sigue diciendo "vertical 9:16".
    expect(p).toContain('professional cinematic vertical 9:16');
  });
});

describe('retrocompat byte-idéntica del prompt completo (sin formato)', () => {
  // El prompt de un proyecto viejo (sin piece.formato) no puede haber cambiado NI UN BYTE.
  it('script sin formato: snapshot exacto de la 1ª línea', () => {
    const p = build('script', { project: PROJECT, piece: {} }).prompt;
    expect(p.split('\n')[0]).toBe(
      'Actuás como promo-director. Escribí el guion de un comercial de 18s para un reel 9:16, tono cercano.',
    );
  });
});
