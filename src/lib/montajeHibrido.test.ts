// Reglas del armado híbrido y de la mezcla (2026-10-11): placa sin hueco, mockups que cubren escenas sin clip y rellenan
// los huecos de cara, la misma frase no se dice dos veces, disolvencia al cambiar de material, pista Mockups separada.
import { describe, expect, it } from 'vitest';
import { afinarMontaje, cubrirConMockups, quitarFrasesRepetidas } from './montajista';
import { gananciaDePista, type MontajePlan, type MontajeScene, type PalabraTiempo } from './montajePlan';
import { buildEditorTimeline } from './editorTracks';
import { tracksToMontaje } from './montajeFromTracks';
import type { Comercial } from './comercial';

const palabras = (texto: string, desde = 0.3, paso = 0.3): PalabraTiempo[] =>
  texto.split(' ').map((text, i) => ({ text, start: desde + i * paso, end: desde + i * paso + 0.22 }));
const esc = (n: number, src: string, rol: string, out: number, extra: Partial<MontajeScene> = {}): MontajeScene =>
  ({ escenaN: n, src, in: 0, out, audio: 'keep', transition: 'cut', rol, dialogo: 'x', ...extra });
const MOCKUPS = ['Contar el problema', 'Te esperan tus proveedores', 'Pagar la seña', 'Bandeja de solicitudes', 'Armar el plan']
  .map((nombre, i) => ({ nombre, fileRef: `mk${i}.mp4`, durSec: 6 }));
const plan = (scenes: MontajeScene[]): MontajePlan => ({ width: 1080, height: 1920, fps: 30, silences: [], texts: [], scenes });
const usadosDe = (p: MontajePlan) => [...p.scenes.map((s) => s.src), ...p.scenes.flatMap((s) => (s.inserts || []).map((i) => i.src))].filter((r) => r.startsWith('mk'));

describe('híbrido: todo el material, sin huecos', () => {
  const base = plan([
    esc(1, 'f1.mp4', 'hook', 8), esc(2, 'f2.mp4', 'desarrollo', 8), esc(3, 'mk0.mp4', 'desarrollo', 6),
    esc(4, 'f4.mp4', 'desarrollo', 8), esc(5, '', 'giro', 5, { dialogo: 'abrí la app y ya tenía todo' }), esc(6, '', 'cta', 6, { placa: true }),
  ]);
  const words = {
    'f1.mp4': palabras('yo esperaba que alguien me recomendara un plomero'),
    'f2.mp4': palabras('cuento lo que me pasa y espero las respuestas tranquilo en casa sin llamar a nadie más'),
    'f4.mp4': palabras('el pedido me llega con mi zona y mi oficio y respondo cuando puedo desde el celular'),
  };
  const out = afinarMontaje(base, { palabrasPorToma: words, mockups: MOCKUPS, hibrido: true });

  it('la escena cta sin clip no queda como hueco: es la placa', () => {
    expect(out.scenes.some((s) => s.rol === 'cta')).toBe(false);
    expect(out.endCard?.durSec).toBe(6);
  });
  it('la escena sin clip la cubre un mockup que no se usó, en silencio', () => {
    const giro = out.scenes.find((s) => s.escenaN === 5)!;
    expect(giro.src).toBe('mk1.mp4');
    expect(giro.audio).toBe('mute');
  });
  it('un mockup que es escena no vuelve como inserto, y ningún mockup se repite', () => {
    const insertos = out.scenes.flatMap((s) => (s.inserts || []).map((i) => i.src));
    expect(insertos).not.toContain('mk0.mp4');
    const todos = usadosDe(out);
    expect(new Set(todos).size).toBe(todos.length);
  });
  it('los mockups restantes entran como insertos en las escenas filmadas con voz (no en el gancho)', () => {
    expect(out.scenes[0].inserts).toBeUndefined();
    expect(out.scenes.flatMap((s) => s.inserts || []).length).toBeGreaterThanOrEqual(2);
  });
  it('disolvencia cuando cambia el material, corte entre tomas del mismo material', () => {
    const tr = out.scenes.map((s) => s.transition);
    expect(tr[0]).toBe('cut');          // f1 → f2
    expect(tr[1]).toBe('crossfade');    // f2 → mk0
    expect(tr[2]).toBe('crossfade');    // mk0 → f4
  });
  it('lo que no entra queda avisado', () => {
    const libres = MOCKUPS.length - new Set(usadosDe(out)).size;
    expect(!!out.avisos?.some((a) => a.includes('no entraron'))).toBe(libres > 0);
  });
  it('sin mockups libres, la escena sin clip queda como estaba', () => {
    expect(cubrirConMockups([esc(1, '', 'giro', 5)], [], [])[0].src).toBe('');
  });
});

describe('la misma frase no se dice dos veces', () => {
  it('se queda la toma que coincide con su escena; la otra sale con aviso', () => {
    const frase = palabras('y el pedido me llega a la bandeja con mi zona y mi oficio');
    const { scenes, avisos } = quitarFrasesRepetidas([
      esc(2, 'a.mp4', 'desarrollo', 8, { words: frase, dialogo: 'yo esperaba que alguien me recomendara' }),
      esc(4, 'b.mp4', 'desarrollo', 8, { words: frase, dialogo: 'y el pedido me llega a la bandeja con mi zona y mi oficio' }),
    ]);
    expect(scenes.map((s) => s.escenaN)).toEqual([4]);
    expect(avisos[0]).toContain('escena 2');
  });
  it('frases distintas no se tocan', () => {
    const { scenes } = quitarFrasesRepetidas([
      esc(1, 'a.mp4', 'hook', 8, { words: palabras('mandaba mensajes a cinco plomeros y nadie contestaba') }),
      esc(2, 'b.mp4', 'desarrollo', 8, { words: palabras('ahora cuento qué me pasa y me llegan presupuestos') }),
    ]);
    expect(scenes).toHaveLength(2);
  });
});

describe('mezcla por pista', () => {
  it('volumen, mute y solo', () => {
    expect(gananciaDePista({}, 'musica')).toBe(1);
    expect(gananciaDePista({ mezcla: { musica: { gain: 0.5 } } }, 'musica')).toBe(0.5);
    expect(gananciaDePista({ mezcla: { musica: { gain: 0.5, mute: true } } }, 'musica')).toBe(0);
    expect(gananciaDePista({ mezcla: { voz: { gain: 1, solo: true } } }, 'musica')).toBe(0);
    expect(gananciaDePista({ mezcla: { voz: { gain: 1, solo: true } } }, 'voz')).toBe(1);
  });
});

describe('editor: los mockups en su pista, ida y vuelta', () => {
  const planBase: MontajePlan = {
    ...plan([esc(1, 'f1.mp4', 'hook', 5, { transition: 'crossfade' }), esc(2, 'mk0.mp4', 'desarrollo', 6, { audio: 'mute', fadeOut: 0.5 }), esc(3, 'f3.mp4', 'desarrollo', 5)]),
    mezcla: { musica: { gain: 0.6 } },
  };
  const comercial = {
    id: 'c', titulo: 't', tipo: 'filmado', estados: {},
    mockups: [{ id: 'm', tarjeta: 't', nombre: 'Contar el problema', fileRef: 'mk0.mp4', durSec: 6 }],
    montaje: { exports: [], plan: planBase },
  } as unknown as Comercial;
  const tl = buildEditorTimeline(comercial);
  const pista = (id: string) => tl.tracks.find((t) => t.id === id)!;
  it('lo filmado en Video, la escena-mockup en Mockups', () => {
    expect(pista('video').clips.map((c) => c.escenaN)).toEqual([1, 3]);
    expect(pista('pantallas').name).toBe('Mockups');
    expect(pista('pantallas').clips[0]).toMatchObject({ escenaN: 2, esEscena: true, fadeOut: 0.5 });
  });
  it('al guardar vuelve la misma secuencia, con su transición y su fade', () => {
    const vuelta = tracksToMontaje(tl.tracks, planBase);
    expect(vuelta.scenes.map((s) => s.src)).toEqual(['f1.mp4', 'mk0.mp4', 'f3.mp4']);
    expect(vuelta.scenes[0].transition).toBe('crossfade');
    expect(vuelta.scenes[1].fadeOut).toBe(0.5);
    expect(vuelta.scenes[1].inserts).toBeUndefined();
  });
});
