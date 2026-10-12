// Contrato de materia prima con ChatGPT (2026-10-11): el pedido lleva los hechos reales y la forma de la salida; la lectura
// de la respuesta la pasa a la forma de Media Studio, con los mismos validadores, y avisa lo que no existe.
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { armarPedido, leerRespuesta, CONTRATO_VERSION, REGLAS_DE_OFICIO } from '../../server/contratoMateriaPrima.mjs';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { normalizarDuraciones, asignarCapturas } from '../../server/functions.mjs';

const PROYECTO = {
  id: 'rh', name: 'RepareHoy', brief: '# RepareHoy\n> Contá el problema. Elegí entre 3 presupuestos.', brandKit: { phonetic: 'reparé hoy' },
  cta: { principal: 'Entrá a reparehoy.com.ar', url: 'https://reparehoy.com.ar' },
  pantallasKit: [{ nombre: 'Contar el problema', archivo: 'screens/01.png', queDemuestra: 'el pedido en cuatro pasos' }, { nombre: 'Bandeja de solicitudes', archivo: 'screens/05.png' }],
  reels: [
    { id: 'v1', durationSec: 26, comercial: { id: 'c1', titulo: 'Nadie te contesta', tipo: 'filmado', formatoId: 'reel-hibrido-9-16', primaryMessage: 'Dejá de perseguir', enfoque: 'dos-lados', tratamiento: 'aspiracional', estados: {} } },
    { id: 'v2', durationSec: 26, comercial: { id: 'c2', titulo: 'La seña al alias', tipo: 'filmado', formatoId: 'reel-hibrido-9-16', estados: {} } },
  ],
};

const PIEZA = {
  id: 'v1',
  concepto: { idea: 'A Lucía se le agranda la mancha y nadie le contesta; publica una vez y le llegan presupuestos.', porQueFunciona: 'x', tono: 'x', estetica: 'x' },
  personajes: [
    { id: 'p1', nombre: 'Lucía', quien: 'vecina', rol: 'pide', fisicoEs: 'mujer de 40', fisicoEn: 'Argentine woman around 40, dark curly hair tied back, olive skin, tired eyes, freckles, slim build, reading glasses pushed up on her head, plain look', vestuario: 'buzo gris', vestuarioEn: 'grey sweatshirt, jeans', lugarEn: 'her living room in Villa Urquiza with a damp stain on the ceiling and a bucket below it', personalidad: 'directa' },
  ],
  lugar: { nombre: 'casa', descripcionEn: 'a modest Buenos Aires living room with a damp ceiling stain, a bucket, a sofa and afternoon light from a balcony door', luz: 'tarde' },
  guion: { blocks: [
    { role: 'hook', quien: 'vecina', narration: 'Se agranda la mancha y nadie me contesta.', visual: 'el balde', durSec: 5 },
    { role: 'desarrollo', quien: 'vecina', narration: 'Bueno, lo cuento acá y listo.', visual: 'publica', durSec: 6 },
    { role: 'giro', quien: 'vecina', narration: 'Uy, ya me contestaron.', visual: 'presupuestos', durSec: 6 },
    { role: 'cta', quien: 'placa', narration: 'Contá qué hay que arreglar.', visual: 'placa', durSec: 4 },
  ], music: { mood: 'cálida' } },
  storyboard: [
    { n: 1, rol: 'hook', personajes: ['p1'], dialogo: 'Se agranda la mancha y nadie me contesta.', accion: 'Lucía mira la mancha', accionEn: 'Lucía stands under the stain', plano: 'medium shot', pantalla: '', durSec: 5 },
    { n: 2, rol: 'desarrollo', personajes: [], dialogo: '', accion: 'pantalla', accionEn: '', plano: '', pantalla: 'Contar el problema', sobreEscena: 1, durSec: 2 },
    { n: 3, rol: 'desarrollo', personajes: [], dialogo: '', accion: 'Un gráfico superpuesto con porcentajes', accionEn: 'a graphic overlay with percentages', plano: 'close-up', pantalla: '', durSec: 3 },
    { n: 4, rol: 'giro', personajes: [], dialogo: '', accion: 'pantalla inventada', accionEn: '', plano: '', pantalla: 'Presupuestos recibidos', durSec: 2 },
    { n: 5, rol: 'cta', personajes: [], dialogo: '', accion: 'placa', accionEn: '', plano: '', pantalla: '', durSec: 3 },
  ],
  placa: { linea1: 'Contá qué hay que arreglar.', linea2: 'reparehoy.com.ar' },
};

describe('contrato de materia prima: el pedido', () => {
  const pedido = armarPedido({ project: PROYECTO });
  it('lleva la versión, los hechos de la marca, las piezas del proyecto y las pantallas reales', () => {
    expect(pedido.contrato).toBe(CONTRATO_VERSION);
    expect(pedido.marca.nombre).toBe('RepareHoy');
    expect(pedido.marca.como_se_dice).toBe('reparé hoy');
    expect(pedido.marca.web).toBe('https://reparehoy.com.ar');
    expect(pedido.campana.piezas.map((p: { id: string }) => p.id)).toEqual(['v1', 'v2']);
    expect(pedido.campana.piezas[0].duracion_seg).toBe(26);
    expect(pedido.material_disponible.pantallas_de_la_app.map((p: { nombre: string }) => p.nombre)).toEqual(['Contar el problema', 'Bandeja de solicitudes']);
  });
  it('lleva las reglas de oficio y la forma exacta de la salida', () => {
    expect(pedido.reglas_de_oficio).toBe(REGLAS_DE_OFICIO);
    expect(REGLAS_DE_OFICIO.produccion.join(' ')).toMatch(/NO HAY LOCUTOR/);
    expect(pedido.salida_esperada.piezas[0]).toHaveProperty('storyboard');
    expect(pedido.salida_esperada.piezas[0].storyboard[0]).toHaveProperty('accionEn');
    expect(pedido.salida_esperada.piezas[0].guion.blocks[0]).toHaveProperty('quien');
  });
});

describe('contrato de materia prima: leer la respuesta', () => {
  const texto = `Acá va:\n\`\`\`json\n${JSON.stringify({ contrato: CONTRATO_VERSION, piezas: [PIEZA] })}\n\`\`\``;
  const leido = leerRespuesta(texto, { project: PROYECTO, normalizar: normalizarDuraciones, asignarCapturas });
  const p = leido.piezas[0];
  it('encuentra la pieza por id y la pasa a la forma de Media Studio', () => {
    expect(leido.errores).toEqual([]);
    expect(p.id).toBe('v1');
    expect(p.titulo).toBe('Nadie te contesta');
    expect(p.concepto.idea).toMatch(/mancha/);
    expect(p.guion.blocks[0]).toMatchObject({ role: 'hook', quien: 'vecina' });
    expect(p.cast.personajes[0]).toMatchObject({ id: 'p1', vestuarioEn: 'grey sweatshirt, jeans', quien: 'vecina' });
    expect(p.storyboard[0].accionEn).toBe('Lucía stands under the stain');
  });
  it('conserva la pantalla sobre la frase y le asigna su captura del kit', () => {
    const pantalla = p.storyboard.find((e: { pantalla: string }) => e.pantalla === 'Contar el problema');
    expect(pantalla.sobreEscena).toBe(1);
    expect(pantalla.archivoCaptura).toBe('screens/01.png');
  });
  it('avisa lo que no existe: una pantalla inventada y un gráfico que Flow no puede dibujar', () => {
    expect(p.errores.some((e: string) => e.includes('"Presupuestos recibidos", que no existe en el kit'))).toBe(true);
    expect(p.errores.some((e: string) => e.includes('la escena 3 pide un gráfico o texto que no existe'))).toBe(true);
  });
  it('sin JSON en la respuesta lo dice, no inventa', () => {
    expect(leerRespuesta('no entendí el pedido', { project: PROYECTO }).errores[0]).toMatch(/No encontré un JSON/);
  });
  it('acepta una pieza sola (sin "piezas") y la manda a la primera pieza del proyecto', () => {
    const una = leerRespuesta(JSON.stringify({ ...PIEZA, id: '' }), { project: PROYECTO, normalizar: normalizarDuraciones, asignarCapturas });
    expect(una.piezas).toHaveLength(1);
    expect(una.piezas[0].id).toBe('v1');
  });
});
