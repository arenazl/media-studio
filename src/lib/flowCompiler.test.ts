// Fase 5 de la reingeniería (2026-10-07): Pack Flow compilado sin IA. Fuente: doc §4.6 y §07
// (golden por talking head, b-roll, CTA, escena sin actor, pantalla, personaje por imagen).
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { compileFlowPack, promptEscena, promptTraduccion, parseTraduccion, personajeCorto, VEO_REGLAS_EN } from '../../server/flowCompiler.mjs';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { buildFunctionPrompt, parseFunctionResult } from '../../server/functions.mjs';

const CAST = {
  personajes: [
    { id: 'p1', nombre: 'Darío', rol: 'vecino', fisicoEn: 'Argentine man in his late 30s, olive skin, short brown hair, short beard, tired face. He wears a worn navy jacket over a plain t-shirt and holds a numbered ticket.', fisicoEs: 'Hombre de 38, cansado, con turno en la mano', vestuario: 'campera azul', personalidad: 'resignado' },
    { id: 'p2', nombre: 'Beatriz', rol: 'empleada', fisicoEn: 'Argentine woman in her mid 50s, shoulder-length dyed auburn hair, reading glasses, municipal uniform shirt.', fisicoEs: 'Empleada municipal de 55', vestuario: 'camisa', personalidad: 'seca' },
  ],
  lugar: { nombre: 'Sala de espera municipal', descripcionEn: 'Waiting hall of a small Argentine municipality: fluorescent light, plastic chairs, a ticket dispenser, posters on the wall. Behind, a counter with an old computer.', luz: 'fluorescente' },
};
const SB = [
  { n: 1, rol: 'hook', durSec: 8, plano: 'medium shot waist-up', angulo: 'eye-level', personajes: ['p1'], accion: 'Darío levanta el ticket y una planta frente a cámara', dialogo: 'Traje una planta, eh. Por el turno. Capaz florece antes de que me llamen con Munifai.', continuidad: 'misma ropa' },
  { n: 2, rol: 'desarrollo', durSec: 4, plano: 'inserto cerrado', angulo: '', personajes: [], accion: 'La pantalla del celular muestra el reclamo con foto y mapa', dialogo: '', continuidad: 'misma luz' },
  { n: 3, rol: 'gag', durSec: 8, plano: 'medium shot waist-up', angulo: 'eye-level', personajes: ['p2'], accion: 'Beatriz mira la planta y suspira', dialogo: 'Señor, el bache ya está arreglado. La planta se la puede llevar.', continuidad: 'mismo mostrador' },
  { n: 4, rol: 'cta', durSec: 8, plano: 'medium shot waist-up', angulo: 'eye-level', personajes: ['p1'], accion: 'Darío sonríe a cámara con el celular en la mano', dialogo: 'Munifai. El municipio en tiempo real.', continuidad: 'misma ropa' },
];

describe('personajeCorto', () => {
  it('nombre + Argentine + lo esencial, nunca el fisicoEn largo', () => {
    const c = personajeCorto(CAST.personajes[0]);
    expect(c.startsWith('Darío, ')).toBe(true);
    expect(c).toMatch(/Argentine/);
    expect(c).not.toContain('worn navy jacket');
    expect(c.split(' ').length).toBeLessThan(24);
  });
});

describe('compileFlowPack — golden', () => {
  const pack = compileFlowPack({ storyboard: SB, cast: CAST, phonetic: 'Munifai', traducciones: { 1: 'Darío raises the ticket and a potted plant to the camera', 2: 'The phone screen shows the complaint with a photo and a map', 3: 'Beatriz looks at the plant and sighs', 4: 'Darío smiles at the camera holding his phone' } });
  it('estilo global sin personajes ni acción; un retrato por personaje; una escena por escena del storyboard', () => {
    expect(pack.estilo).toMatch(/photorealistic/i);
    expect(pack.estilo).not.toMatch(/Darío|Beatriz/);
    expect(pack.personajes.map((p: { id: string }) => p.id)).toEqual(['p1', 'p2']);
    expect(pack.escenas).toHaveLength(4);
    expect(pack.escenas.map((e: { escenaN: number }) => e.escenaN)).toEqual([1, 2, 3, 4]);
    expect(pack.escenas.every((e: { estado: string }) => e.estado === 'pendiente')).toBe(true);
    expect(pack.huecos).toEqual([]);
  });
  it('el retrato arranca como pide Flow y es una foto fija', () => {
    const p = pack.personajes[0].promptImagen;
    expect(p.startsWith('Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine')).toBe(true);
    expect(p).toMatch(/no action, no dialogue/);
  });
  it('talking head (escena 1): nombre corto + Argentine, plano medio, diálogo literal en rioplatense, entrega del hook, logo libre, sin fisicoEn largo', () => {
    const t = pack.escenas[0].prompt;
    expect(t).toContain('Darío, ');
    expect(t).toMatch(/Argentine/);
    expect(t).toContain(VEO_REGLAS_EN.talkingHead);
    expect(t).toContain("He speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: 'Traje una planta, eh. Por el turno. Capaz florece antes de que me llamen con Munifai.'");
    expect(t).toMatch(/Energetic, hooking delivery/);
    expect(t).toContain(VEO_REGLAS_EN.logoLibre);
    expect(t).not.toContain('worn navy jacket');
    expect(t).toContain('Darío raises the ticket');
  });
  it('b-roll de pantalla (escena 2): sin diálogo, toma continua, pantalla no legible', () => {
    const t = pack.escenas[1].prompt;
    expect(t).toContain(VEO_REGLAS_EN.broll);
    expect(t).toContain(VEO_REGLAS_EN.pantalla);
    expect(t).not.toMatch(/speaks directly/);
  });
  it('personaje mujer (escena 3): pronombre She y entrega del gag', () => {
    const t = pack.escenas[2].prompt;
    expect(t).toMatch(/She speaks directly/);
    expect(t).toMatch(/Playful, sharp delivery/);
  });
  it('cierre (escena 4): el logo centrado arriba y entrega eufórica', () => {
    const t = pack.escenas[3].prompt;
    expect(t).toContain(VEO_REGLAS_EN.logoCierre);
    expect(t).toMatch(/Euphoric/);
  });
  it('el rol viene del storyboard (autoridad), y la locación se resume (primera oración)', () => {
    expect(pack.escenas.map((e: { rol: string }) => e.rol)).toEqual(['hook', 'desarrollo', 'gag', 'cta']);
    expect(pack.escenas[0].prompt).toContain('Location: Waiting hall of a small Argentine municipality: fluorescent light, plastic chairs, a ticket dispenser, posters on the wall');
    expect(pack.escenas[0].prompt).not.toContain('old computer');
  });
  it('sin traducciones el pack igual sale, con la acción en español y los huecos marcados', () => {
    const p2 = compileFlowPack({ storyboard: SB, cast: CAST });
    expect(p2.escenas).toHaveLength(4);
    expect(p2.huecos).toEqual([1, 2, 3, 4]);
    expect(p2.escenas[0].prompt).toContain('Darío levanta el ticket');
  });
  it('sin cast (animado/b-roll): no hay retratos y las escenas son b-roll', () => {
    const p3 = compileFlowPack({ storyboard: [SB[1]], cast: undefined, traducciones: { 2: 'x' } });
    expect(p3.personajes).toEqual([]);
    expect(p3.escenas[0].prompt).toContain(VEO_REGLAS_EN.broll);
  });
});

describe('traducción de acciones — lo único que se le pide al modelo', () => {
  it('el prompt lista una línea por escena con número y separador', () => {
    const t = promptTraduccion(SB);
    expect(t).toContain('1| Darío levanta el ticket');
    expect(t).toContain('4| Darío sonríe a cámara');
    expect(t).toMatch(/EXACTAMENTE una línea/);
  });
  it('sin acciones el prompt es vacío (y run-function no llama a la IA)', () => {
    expect(promptTraduccion([{ n: 1, rol: 'hook', accion: '' }])).toBe('');
  });
  it('parseTraduccion tolera líneas sueltas y basura', () => {
    expect(parseTraduccion('1| One\nblah\n 3 |  Three  \n')).toEqual({ 1: 'One', 3: 'Three' });
    expect(parseTraduccion('')).toEqual({});
  });
});

describe('molde flowpack en functions.mjs — compilado', () => {
  const body = { functionId: 'flowpack', context: { project: { name: 'Munify', phonetic: 'Munifai' }, piece: { storyboard: SB, cast: CAST } }, options: {} };
  it('build devuelve sólo el prompt de traducción (chico) y marca compilado', () => {
    const r = buildFunctionPrompt(body);
    expect(r.compilado).toBe(true);
    expect(r.prompt.length).toBeLessThan(900);
    expect(r.prompt).not.toMatch(/prompt-writer/);
  });
  it('parse arma el pack con las traducciones del modelo', () => {
    const out = parseFunctionResult('flowpack', '1| A\n2| B\n3| C\n4| D', body);
    expect(out.escenas).toHaveLength(4);
    expect(out.escenas[0].prompt).toContain('Action: A.');
    expect(out.huecos).toEqual([]);
    expect(out.version).toBe('flowpack/2.0-compilado');
  });
  it('parse con texto inútil: el pack sale igual y los huecos quedan marcados (nunca falla en silencio)', () => {
    const out = parseFunctionResult('flowpack', 'no entendí', body);
    expect(out.escenas).toHaveLength(4);
    expect(out.huecos).toEqual([1, 2, 3, 4]);
  });
  it('sin storyboard falla fuerte', () => {
    expect(() => parseFunctionResult('flowpack', '', { ...body, context: { project: {}, piece: {} } })).toThrow(/storyboard/);
  });
  it('la regeneración de UNA escena sigue siendo IA y devuelve JSON', () => {
    const r = buildFunctionPrompt({ ...body, regenerate: { escenaN: 2 } });
    expect(r.mode).toBe('escena');
    const out = parseFunctionResult('flowpack', '{"escena":{"escenaN":2,"prompt":"new"}}', { ...body, regenerate: { escenaN: 2 } });
    expect(out.escena).toEqual({ escenaN: 2, prompt: 'new' });
  });
});
