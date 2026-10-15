import { describe, expect, it } from 'vitest';
import { numeroAudiosPendientes, planAnimatic, vozDelStoryboard } from './preproduccion';
import type { Comercial, Concepto, Escena, Prototipo } from './comercial';
import type { Project } from './projects';

const concepto = { id: 'c1', topico: 'Del lote al barrio', idea: 'Una historia sin inventar datos' } as Concepto;
const storyboard: Escena[] = [{
  n: 1, rol: 'desarrollo', durSec: 4, plano: 'medio', angulo: '', personajes: ['p1'],
  accion: 'Muestra la venta de lotes', dialogo: 'Todos los lotes, en un mismo lugar.', continuidad: '',
  archivoCaptura: 'screens/lotes.png',
}, {
  n: 2, rol: 'cta', durSec: 3, plano: '', angulo: '', personajes: [],
  accion: 'Cierre de marca', dialogo: '', continuidad: '',
}];
const comercial = { id: 'com-test', tipo: 'filmado', storyboard, formatoId: 'reel-hibrido-9-16',
  estados: {} } as unknown as Comercial;
const project = { name: 'Urbanify', pantallasKit: [{ archivo: 'screens/lotes.png',
  nombre: 'Lotes', url: 'http://localhost/test.png' }] } as Project;

describe('preproducción: compilador sin consumo de recursos', () => {
  it('usa capturas del kit y no inventa imágenes de actores', () => {
    const v: Prototipo = { conceptoId: 'c1', storyboard, cast: { personajes: [{
      id: 'p1', nombre: 'Vendedora', rol: 'comercial', fisicoEn: '', fisicoEs: '',
      vestuario: '', personalidad: '',
    }], lugar: { nombre: '', descripcionEn: '', luz: '' } } };
    const plan = planAnimatic(project, comercial, concepto, v);
    expect(plan.escenas[0].imagen).toBe('http://localhost/test.png');
    expect(plan.escenas[0].actor).toBe('Vendedora');
    expect(plan.escenas[1].imagen).toBeUndefined();
    expect(numeroAudiosPendientes(plan)).toBe(1);
  });

  it('usa duración del audio y rechaza locución obsoleta al cambiar voice ID', () => {
    const v: Prototipo = { conceptoId: 'c1', storyboard,
      vozPorActor: { p1: 'voz-nueva' },
      audios: [{ escenaN: 1, texto: storyboard[0].dialogo,
        voiceId: 'voz-vieja', src: '/old.mp3', durSec: 7 }],
    };
    // El storyboard usa ids como nombres cuando aún no hay cast.
    const plan = planAnimatic(project, comercial, concepto, v);
    expect(plan.escenas[0].audio).toBeUndefined();
    v.audios = [{ escenaN: 1, texto: storyboard[0].dialogo,
      voiceId: 'voz-nueva', src: '/new.mp3', durSec: 7 }];
    const actual = planAnimatic(project, comercial, concepto, v);
    expect(actual.escenas[0].audio).toBe('/new.mp3');
    expect(actual.escenas[0].durSec).toBe(7.6);
  });

  it('no crea diálogos ficticios para placas CTA', () => {
    expect(vozDelStoryboard(storyboard[1], { blocks: [{
      role: 'cta', narration: 'Visitá Urbanify', visual: '',
    }] })).toBe('');
  });
});
