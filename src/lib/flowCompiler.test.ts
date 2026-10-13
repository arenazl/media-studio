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
    expect(pack.escenas).toHaveLength(4);   // 3.x: la cta con una persona hablando se filma; sólo la cta SIN persona es la placa
    expect(pack.escenas.map((e: { escenaN: number }) => e.escenaN)).toEqual([1, 2, 3, 4]);
    expect(pack.escenas.every((e: { estado: string }) => e.estado === 'pendiente')).toBe(true);
    expect(pack.huecos).toEqual([]);
  });
  it('el retrato arranca como pide Flow y es una foto fija', () => {
    const p = pack.personajes[0].promptImagen;
    expect(p.startsWith('Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine')).toBe(true);
    expect(p).toMatch(/no action, no dialogue/);
  });
  // flowpack/3.x (2026-10-11): el contenido primero — quién, dónde, qué hace, cómo dice la frase — y sin la receta fija de
  // cara a cámara ni el "sigue hablando todo el clip"; la frase arranca en el primer segundo y después no hay más palabras.
  it('escena con frase (escena 1): quién y dónde, la acción, la frase literal desde el primer segundo, sin relleno, logo libre', () => {
    const t = pack.escenas[0].prompt;
    expect(t).toContain('Darío, an Argentine man');
    expect(t).toContain('in Waiting hall of a small Argentine municipality');
    expect(t).toContain('Darío raises the ticket');
    expect(t).toContain("He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Traje una planta, eh. Por el turno. Capaz florece antes de que me llamen con Munifai.'");
    expect(t).toContain(VEO_REGLAS_EN.despues);
    expect(t).toMatch(/Energetic, hooking delivery/);   // sin accionEn del storyboard, la entrega por rol
    expect(t).not.toContain(VEO_REGLAS_EN.talkingHead);
    expect(t).not.toContain(VEO_REGLAS_EN.sinSilencio);
    expect(t).toContain(VEO_REGLAS_EN.logoLibre);
    expect(t).not.toContain('worn navy jacket');
    expect(t.indexOf('Darío raises')).toBeLessThan(t.indexOf('starts speaking'));   // la acción antes que la técnica
  });
  it('con accionEn del storyboard: la usa tal cual, sin el lugar del cast ni la entrega fija; el vestuario viaja', () => {
    const cast = { ...CAST, personajes: [{ ...CAST.personajes[0], vestuarioEn: 'worn navy jacket, plain t-shirt' }, CAST.personajes[1]] };
    const t = promptEscena({ ...SB[0], accionEn: 'Already talking, Darío lifts his numbered ticket at the counter.' }, { cast, lugar: cast.lugar });
    expect(t).toContain('Already talking, Darío lifts his numbered ticket at the counter.');
    expect(t).toContain('wearing worn navy jacket, plain t-shirt');
    expect(t).not.toContain('Waiting hall');
    expect(t).not.toMatch(/Energetic, hooking delivery/);
  });
  it('si un paso intermedio vació "personajes", la escena no pierde a su persona', () => {
    const t = promptEscena({ ...SB[0], personajes: [], personajesModelo: ['p1'] }, { cast: CAST, lugar: CAST.lugar });
    expect(t).toContain('Darío, an Argentine man');
    expect(t).toContain("exactly these words and nothing else: 'Traje una planta");
  });
  it('b-roll de pantalla (escena 2): sin diálogo, toma continua, la pantalla nunca a cámara (una sola regla, sin "poco legible")', () => {
    const t = pack.escenas[1].prompt;
    expect(t).toContain(VEO_REGLAS_EN.broll);
    expect(t).toContain(VEO_REGLAS_EN.sinInterfaz);
    expect(t).not.toContain(VEO_REGLAS_EN.pantalla);
    expect(t).not.toMatch(/speaks directly/);
  });
  it('personaje mujer (escena 3): pronombre She y entrega del gag', () => {
    const t = pack.escenas[2].prompt;
    expect(t).toMatch(/She starts speaking within the first second/);
    expect(t).toMatch(/Playful, sharp delivery/);
  });
  // 2026-10-10: la escena cta es la placa de cierre (la dibuja el montaje con logo, marca y CTA): no se filma en Flow,
  // y ningún prompt le pide a Veo el logo ("logo.png" salía escrito en la imagen y costó créditos).
  it('la cta SIN persona no entra al pack y ningún prompt pide el logo: sólo dejar libre el tercio superior', () => {
    const sinPersona = compileFlowPack({ storyboard: [...SB.slice(0, 3), { ...SB[3], personajes: [], dialogo: '' }], cast: CAST });
    expect(sinPersona.escenas.some((e: { rol: string }) => e.rol === 'cta')).toBe(false);
    for (const e of pack.escenas as { prompt: string }[]) {
      expect(e.prompt).not.toContain('logo.png');
      expect(e.prompt).toContain(VEO_REGLAS_EN.logoLibre);
    }
  });
  it('el rol viene del storyboard (autoridad), y el lugar va ENTERO (antes se cortaba en la primera oración)', () => {
    expect(pack.escenas.map((e: { rol: string }) => e.rol)).toEqual(['hook', 'desarrollo', 'gag', 'cta']);
    expect(pack.escenas[0].prompt).toContain('Waiting hall of a small Argentine municipality: fluorescent light, plastic chairs, a ticket dispenser, posters on the wall');
    expect(pack.escenas[0].prompt).toContain('old computer');
  });
  it('el lugar propio del personaje (lugarEn) le gana a la locación general', () => {
    const cast = { ...CAST, personajes: [CAST.personajes[0], { ...CAST.personajes[1], lugarEn: 'the counter of the municipal office, a stack of forms and a rubber stamp' }] };
    const t = promptEscena(SB[2], { cast, lugar: cast.lugar });
    expect(t).toContain('in the counter of the municipal office, a stack of forms and a rubber stamp');
    expect(t).not.toContain('Waiting hall');
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
  it('con el cast, cada línea dice quién está en cuadro y su género; las escenas con accionEn no se traducen', () => {
    const t = promptTraduccion([SB[0], SB[2], { ...SB[3], accionEn: 'already in English' }], CAST);
    expect(t).toContain('1| Darío levanta el ticket y una planta frente a cámara (en cuadro: Darío, hombre)');
    expect(t).toContain('3| Beatriz mira la planta y suspira (en cuadro: Beatriz, mujer)');
    expect(t).not.toContain('4|');
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
    expect(out.escenas.filter((e: { escenaN: number }) => e.escenaN !== 90)).toHaveLength(4);
    expect(out.escenas[0].prompt).toContain(' A. ');
    expect(out.huecos).toEqual([]);
    expect(out.version).toBe('flowpack/3.2-compilado');
  });
  it('parse con texto inútil: el pack sale igual y los huecos quedan marcados (nunca falla en silencio)', () => {
    const out = parseFunctionResult('flowpack', 'no entendí', body);
    expect(out.escenas.filter((e: { escenaN: number }) => e.escenaN !== 90)).toHaveLength(4);
    expect(out.huecos).toEqual([1, 2, 3, 4]);
  });
  // 2026-10-13 (Lucas: "metela junto con los demás clips"): la presentadora del cierre va al final del pack, con su frase
  it('la presentadora del cierre va al final del pack, dice la frase de la marca y es un personaje más', () => {
    const conFirma = { ...body, context: { ...body.context, piece: { ...body.context.piece, cierreMarca: 'Munify, para vos.' } } };
    const out = parseFunctionResult('flowpack', '1| A\n2| B\n3| C\n4| D', conFirma);
    const ultima = out.escenas[out.escenas.length - 1];
    expect(ultima.escenaN).toBe(90);
    expect(ultima.dialogo).toBe('Munify, para vos.');
    expect(ultima.prompt).toContain("'Munify, para vos.'");
    expect(out.personajes.map((p: { nombre: string }) => p.nombre)).toContain('Presentadora');
    // en una pieza animada no hay presentadora
    const animada = { ...conFirma, context: { ...conFirma.context, piece: { ...conFirma.context.piece, tipo: 'animado' } } };
    expect(parseFunctionResult('flowpack', '', animada).escenas.some((e: { escenaN: number }) => e.escenaN === 90)).toBe(false);
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
