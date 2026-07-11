import { describe, it, expect } from 'vitest';
import { estadoDelPaso } from './pasoEstado';
import { nuevoComercial, type Comercial, type Escena } from './comercial';

const base = () => nuevoComercial('x', 'filmado');
const escena = (n: number, durSec = 8): Escena => ({
  n, rol: 'hook', durSec, plano: '', angulo: '', personajes: [], accion: '', dialogo: '', continuidad: '',
});

describe('estadoDelPaso — concepto', () => {
  it('sin comercial: invita a generar', () => {
    expect(estadoDelPaso('concepto', undefined)).toBe('Generá 2-3 propuestas para arrancar');
  });
  it('generado sin elegir: falta elegir', () => {
    const c: Comercial = { ...base(), estados: { ...base().estados, concepto: 'generado' } };
    expect(estadoDelPaso('concepto', c)).toBe('Propuestas generadas · falta elegir una');
  });
  it('elegido: 1 propuesta · elegiste una', () => {
    const c: Comercial = { ...base(), concepto: { id: 'c', idea: 'i', tono: 't', estetica: 'e', referencia: 'r', porQueFunciona: 'p' } };
    expect(estadoDelPaso('concepto', c)).toBe('1 propuesta · elegiste una');
  });
});

describe('estadoDelPaso — guion', () => {
  it('vacío', () => {
    expect(estadoDelPaso('guion', base())).toBe('Generá el guion por bloques');
  });
  it('con bloques suma la duración', () => {
    const c: Comercial = { ...base(), guion: { blocks: [
      { role: 'hook', narration: '', visual: '', durSec: 2 },
      { role: 'desarrollo', narration: '', visual: '', durSec: 10 },
      { role: 'cta', narration: '', visual: '', durSec: 4 },
    ] } };
    expect(estadoDelPaso('guion', c)).toBe('3 bloques · ~16s totales');
  });
  it('con bloques sin duración: sólo el conteo', () => {
    const c: Comercial = { ...base(), guion: { blocks: [{ role: 'hook', narration: '', visual: '' }] } };
    expect(estadoDelPaso('guion', c)).toBe('1 bloques');
  });
});

describe('estadoDelPaso — cast', () => {
  it('vacío', () => {
    expect(estadoDelPaso('cast', base())).toBe('Generá los personajes y la locación');
  });
  it('con personajes y locación', () => {
    const c: Comercial = { ...base(), cast: {
      personajes: [
        { id: 'p1', nombre: 'A', rol: 'r', fisicoEn: '', fisicoEs: '', vestuario: '', personalidad: '' },
        { id: 'p2', nombre: 'B', rol: 'r', fisicoEn: '', fisicoEs: '', vestuario: '', personalidad: '' },
      ],
      lugar: { nombre: 'Oficina', descripcionEn: '', luz: '' },
    } };
    expect(estadoDelPaso('cast', c)).toBe('2 personajes · locación definida');
  });
  it('un personaje singular + sin locación', () => {
    const c: Comercial = { ...base(), cast: {
      personajes: [{ id: 'p1', nombre: 'A', rol: 'r', fisicoEn: '', fisicoEs: '', vestuario: '', personalidad: '' }],
      lugar: { nombre: '', descripcionEn: '', luz: '' },
    } };
    expect(estadoDelPaso('cast', c)).toBe('1 personaje · sin locación');
  });
});

describe('estadoDelPaso — storyboard', () => {
  it('vacío', () => {
    expect(estadoDelPaso('storyboard', base())).toBe('Generá las escenas del comercial');
  });
  it('con escenas suma la duración', () => {
    const c: Comercial = { ...base(), storyboard: [escena(1, 8), escena(2, 8), escena(3, 4)] };
    expect(estadoDelPaso('storyboard', c)).toBe('3 escenas · ~20s totales');
  });
});

describe('estadoDelPaso — pack', () => {
  it('vacío', () => {
    expect(estadoDelPaso('pack', base())).toBe('Generá el pack de prompts para Flow');
  });
  it('con progreso: copiados/total · importados', () => {
    const c: Comercial = { ...base(), packFlow: { master: 'm', clips: [
      { escenaN: 1, prompt: 'p', estado: 'importado' },
      { escenaN: 2, prompt: 'p', estado: 'copiado' },
      { escenaN: 3, prompt: 'p', estado: 'pendiente' },
      { escenaN: 4, prompt: 'p', estado: 'pendiente' },
    ] } };
    expect(estadoDelPaso('pack', c)).toBe('2/4 copiados · 1 importados');
  });
});

describe('estadoDelPaso — rodaje', () => {
  it('vacío', () => {
    expect(estadoDelPaso('rodaje', base())).toBe('Importá los clips que bajaste de Flow');
  });
  it('cuenta escenas con clip sobre el total del storyboard', () => {
    const c: Comercial = {
      ...base(),
      storyboard: [escena(1), escena(2), escena(3), escena(4)],
      rodaje: [
        { id: 't1', escenaN: 1, fileRef: 'r', durSec: 8 },
        { id: 't2', escenaN: 2, fileRef: 'r', durSec: 8 },
        { id: 't2b', escenaN: 2, fileRef: 'r', durSec: 8 },   // 2da toma de la misma escena → no la cuenta doble
      ],
    };
    expect(estadoDelPaso('rodaje', c)).toBe('2/4 escenas con clip');
  });
});

describe('estadoDelPaso — montaje', () => {
  it('vacío', () => {
    expect(estadoDelPaso('montaje', base())).toBe('Armá el montaje desde el storyboard');
  });
  it('armado con música + voz + QA', () => {
    const c: Comercial = {
      ...base(),
      qa: { score: 42, verdict: 'ok' },
      montaje: { plan: {
        width: 1080, height: 1920, fps: 30,
        scenes: [
          { escenaN: 1, src: 'a', in: 0, out: 8, audio: 'keep' },
          { escenaN: 2, src: 'b', in: 0, out: 6, audio: 'mute' },
        ],
        music: { src: 'm', gain: 0.28, duck: true },
        voice: { src: 'v', at: 2 },
        silences: [], texts: [],
      }, exports: [] },
    };
    // dur ≈ (8) + (6 - 0.03 transición) ≈ 13.97 → 14
    expect(estadoDelPaso('montaje', c)).toBe('2 escenas · ~14s · con música · con voz · QA 42/50');
  });
  it('armado sin música ni voz ni QA', () => {
    const c: Comercial = {
      ...base(),
      montaje: { plan: {
        width: 1080, height: 1920, fps: 30,
        scenes: [{ escenaN: 1, src: 'a', in: 0, out: 8, audio: 'keep' }],
        silences: [], texts: [],
      }, exports: [] },
    };
    expect(estadoDelPaso('montaje', c)).toBe('1 escenas · ~8s · sin música · sin voz');
  });
});

describe('estadoDelPaso — render / publicar / negocio', () => {
  it('render vacío / renderizado', () => {
    expect(estadoDelPaso('render', base())).toBe('Generá el render desde el storyboard');
    expect(estadoDelPaso('render', { ...base(), renderRef: 'r' })).toBe('Reel animado renderizado');
  });
  it('publicar vacío / con paquete', () => {
    expect(estadoDelPaso('publicar', base())).toBe('Generá el paquete de publicación');
    const c: Comercial = { ...base(), publicacion: { hookOnScreen: '', caption: '', hashtags: ['#a', '#b', '#c'], cta: '' } };
    expect(estadoDelPaso('publicar', c)).toBe('Paquete listo · 3 hashtags');
  });
  it('negocio no arma línea desde el comercial (la arma ProjectInfo)', () => {
    expect(estadoDelPaso('negocio', base())).toBe('');
  });
});
