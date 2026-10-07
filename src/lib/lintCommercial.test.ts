// Fase 7 de la reingeniería (2026-10-07): QA técnico sin IA. Fuente: doc §4.8 A.
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { lintCommercial } from '../../server/lintCommercial.mjs';

const GUION_OK = { blocks: [
  { role: 'hook', narration: 'Traje una planta. Por el turno, digo.', visual: 'x', durSec: 3 },
  { role: 'desarrollo', narration: 'Saco el celu, foto al bache, y se deriva solo a la dependencia que corresponde.', visual: 'x', durSec: 7 },
  { role: 'gag', narration: 'Capaz florece antes.', visual: 'x', durSec: 3 },
  { role: 'cta', narration: 'Munifai. El municipio en tiempo real, desde el celular y sin hacer la fila de siempre.', visual: 'x', durSec: 6 },
] };
const CAST = { personajes: [{ id: 'p1', nombre: 'Darío', fisicoEn: 'Argentine man in his late 30s, olive skin, short brown hair, short beard, tired face, navy jacket over a plain t-shirt' }], lugar: { descripcionEn: 'hall' } };
const SB_OK = [
  { n: 1, rol: 'hook', durSec: 8, personajes: ['p1'], accion: 'a', dialogo: 'Traje una planta, eh. Por el turno, digo. Calculo que capaz florece antes de que me llamen con Munifai.' },
  { n: 2, rol: 'desarrollo', durSec: 4, personajes: [], accion: 'pantalla', dialogo: '' },
  { n: 3, rol: 'cta', durSec: 8, personajes: ['p1'], accion: 'a', dialogo: 'Munifai. El municipio en tiempo real, desde el celular y sin hacer la fila de siempre.' },
];
const base = { name: 'Munify', phonetic: 'Munifai', tipo: 'filmado', durationSec: 20, guion: GUION_OK, cast: CAST, storyboard: SB_OK };
const codes = (r: { issues: { code: string }[] }) => r.issues.map((i) => i.code);

describe('lintCommercial — pieza sana', () => {
  it('no reporta nada', () => {
    const r = lintCommercial(base);
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });
  it('vacío no rompe', () => {
    expect(lintCommercial({}).ok).toBe(true);
  });
});

describe('guion', () => {
  it('rol faltante y gag después del cta', () => {
    const r = lintCommercial({ ...base, guion: { blocks: [GUION_OK.blocks[0], GUION_OK.blocks[1], GUION_OK.blocks[3], GUION_OK.blocks[2]] } });
    expect(codes(r)).toContain('guion.gag-despues-del-cta');
    const r2 = lintCommercial({ ...base, guion: { blocks: GUION_OK.blocks.slice(0, 3) } });
    expect(codes(r2)).toContain('guion.rol-faltante');
    expect(r2.ok).toBe(false);
  });
  it('demasiadas palabras por segundo es un error alto', () => {
    const r = lintCommercial({ ...base, guion: { blocks: [{ ...GUION_OK.blocks[1], narration: 'una dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis diecisiete dieciocho diecinueve veinte veintiuno veintidos', durSec: 4 }] } });
    expect(codes(r)).toContain('guion.muy-rapido');
  });
  it('la suma de duraciones lejos del target', () => {
    const r = lintCommercial({ ...base, durationSec: 40 });
    expect(codes(r)).toContain('guion.duracion');
  });
  it('el CTA dice la marca escrita en vez de la fonética', () => {
    const r = lintCommercial({ ...base, guion: { blocks: [...GUION_OK.blocks.slice(0, 3), { role: 'cta', narration: 'Munify. El municipio en tiempo real.', durSec: 4 }] } });
    expect(codes(r)).toContain('guion.marca-sin-fonetica');
  });
  it('"no decir" del negocio (frases cortas literales)', () => {
    const r = lintCommercial({ ...base, guion: { blocks: [{ role: 'hook', narration: 'Somos líderes en innovación municipal.', durSec: 3 }, ...GUION_OK.blocks.slice(1)] } }, { facts: { doNotSay: ['líderes', 'No prometer integraciones específicas sin confirmar con el equipo técnico'] } });
    expect(codes(r)).toContain('guion.no-decir');
    expect(codes(r).filter((c) => c === 'guion.no-decir')).toHaveLength(1);   // la regla larga no se busca literal
  });
});

describe('storyboard', () => {
  it('personaje inexistente y rol inválido', () => {
    const r = lintCommercial({ ...base, storyboard: [{ ...SB_OK[0], personajes: ['p9'] }, { ...SB_OK[1], rol: 'intro' }, SB_OK[2]] });
    expect(codes(r)).toContain('storyboard.personaje-inexistente');
    expect(codes(r)).toContain('storyboard.rol-invalido');
  });
  it('talking head de menos de 8 s', () => {
    const r = lintCommercial({ ...base, storyboard: [{ ...SB_OK[0], durSec: 5 }, SB_OK[1], SB_OK[2]] });
    expect(codes(r)).toContain('storyboard.talking-head-corto');
  });
  it('animado: pantalla que no está en el kit y escena sin captura', () => {
    const r = lintCommercial({ ...base, tipo: 'animado', cast: null, mediaKit: { pantallas: [{ nombre: 'Home' }, { nombre: 'Detalle' }] },
      storyboard: [{ n: 1, rol: 'hook', durSec: 4, personajes: [], accion: 'a', dialogo: '', screen: 'Home', archivoCaptura: 'screens/home.png' }, { n: 2, rol: 'cta', durSec: 4, personajes: [], accion: 'a', dialogo: '', screen: 'Pagos' }] });
    expect(codes(r)).toContain('storyboard.pantalla-inexistente');
    expect(codes(r)).toContain('storyboard.sin-captura');
    expect(codes(r)).not.toContain('storyboard.talking-head-corto');
  });
});

describe('pack flow', () => {
  it('pega el fisicoEn largo, falta Argentine, escenas desparejas, acciones sin traducir', () => {
    const r = lintCommercial({ ...base, packFlow: { estilo: 'x', personajes: [], huecos: [2], escenas: [
      { escenaN: 1, rol: 'hook', prompt: `Scene with ${CAST.personajes[0].fisicoEn} talking`, estado: 'pendiente' },
      { escenaN: 3, rol: 'cta', prompt: 'Darío, a man speaks', estado: 'pendiente' },
    ] } });
    expect(codes(r)).toContain('pack.fisico-largo');
    expect(codes(r)).toContain('pack.sin-argentine');
    expect(codes(r)).toContain('pack.escenas-desparejas');
    expect(codes(r)).toContain('pack.accion-sin-traducir');
  });
  it('un pack sano no reporta', () => {
    const r = lintCommercial({ ...base, packFlow: { estilo: 'x', personajes: [], huecos: [], escenas: SB_OK.map((e) => ({ escenaN: e.n, rol: e.rol, prompt: e.personajes.length ? 'Darío, an Argentine man speaks' : 'b-roll', estado: 'pendiente' })) } });
    expect(r.issues.filter((i: { code: string }) => i.code.startsWith('pack.'))).toEqual([]);
  });
});

describe('severidad', () => {
  it('ok es false con cualquier issue alta, y cuenta errores y avisos', () => {
    const r = lintCommercial({ ...base, storyboard: [{ ...SB_OK[0], durSec: 5 }, SB_OK[1], SB_OK[2]], durationSec: 40 });
    expect(r.ok).toBe(false);
    expect(r.errores).toBeGreaterThanOrEqual(1);
    expect(r.avisos).toBeGreaterThanOrEqual(1);
    for (const i of r.issues) expect(['alta', 'media', 'baja']).toContain(i.severity);
  });
});
