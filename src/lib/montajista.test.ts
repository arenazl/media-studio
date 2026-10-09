import { describe, expect, it } from 'vitest';
import { afinarMontaje, corregirMarca, frasesDe, hostnameDe, inicioDeFrase, partirFrase, raiz, tokensDePantalla, ubicarInsertos, AIRE_ANTES, AIRE_DESPUES, AIRE_FINAL, INSERTO_DUR, INSERTO_MIN, INSERTO_SEPARACION, MAX_ATRAS } from './montajista';
import type { MontajePlan, MontajeScene, PalabraTiempo } from './montajePlan';
import type { PantallaKit } from './mediaKit';

// palabras equiespaciadas a partir de `desde`, 0.3 s cada una
const palabras = (texto: string, desde = 0.5, paso = 0.3): PalabraTiempo[] =>
  texto.split(' ').map((text, i) => ({ text, start: desde + i * paso, end: desde + i * paso + 0.22 }));

const escena = (n: number, src: string, rol: string, out = 10): MontajeScene =>
  ({ escenaN: n, src, in: 0, out, audio: 'keep', transition: 'cut', rol, dialogo: 'x' });

const PANTALLAS: PantallaKit[] = [
  { archivo: 'screens/02-perfil.png', url: '/api/media-kit/k/file/screens/02-perfil.png', nombre: 'Perfil de Proveedor 100% Verificado', zonaClave: 'Badge de Proveedor Verificado, estrellas' },
  { archivo: 'screens/03-paquetes.png', url: '/api/media-kit/k/file/screens/03-paquetes.png', nombre: 'Detalle de Servicio con Paquetes en Hasta 12 Cuotas', zonaClave: 'Selector de paquetes' },
  { archivo: 'screens/08-panel.png', url: '/api/media-kit/k/file/screens/08-panel.png', nombre: 'Panel del Proveedor con AI Coach', zonaClave: 'Métricas principales' },
];

const planBase = (): MontajePlan => ({
  width: 1080, height: 1920, fps: 30, silences: [], texts: [],
  scenes: [escena(1, 'a.mp4', 'hook'), escena(2, 'b.mp4', 'desarrollo'), escena(3, 'c.mp4', 'gag'), escena(4, 'd.mp4', 'cta')],
});

describe('raíces y coincidencia con pantallas', () => {
  it('normaliza acentos, plural y largo mínimo', () => {
    expect(raiz('verificados')).toBe('verifi');
    expect(raiz('Verificado')).toBe('verifi');
    expect(raiz('cuotas')).toBe('cuota');
    expect(raiz('con')).toBeNull();
    expect(raiz('para')).toBeNull();
  });
  it('arma los tokens de una pantalla desde nombre y zona clave', () => {
    const t = tokensDePantalla(PANTALLAS[0]);
    expect(t.has('verifi')).toBe(true);
    expect(t.has('provee')).toBe(true);
  });
});

describe('recortes de aire', () => {
  it('recorta antes de la primera palabra y después de la última; el último clip respira más', () => {
    const plan = planBase();
    const out = afinarMontaje(plan, { palabrasPorToma: { 'a.mp4': palabras('hola que tal', 1.0), 'd.mp4': palabras('chau', 3.0) } });
    expect(out.scenes[0].in).toBeCloseTo(1.0 - AIRE_ANTES, 5);
    expect(out.scenes[0].out).toBeCloseTo(1.6 + 0.22 + AIRE_DESPUES, 5);
    expect(out.scenes[3].in).toBeCloseTo(3.0 - AIRE_ANTES, 5);
    expect(out.scenes[3].out).toBeCloseTo(3.22 + AIRE_FINAL, 5);
    expect(out.scenes[1].in).toBe(0);                 // sin palabras: queda como estaba
    expect(out.scenes[1].out).toBe(10);
  });
  it('nunca recorta más allá del clip', () => {
    const plan = planBase();
    const out = afinarMontaje(plan, { palabrasPorToma: { 'a.mp4': palabras('una frase larga al final', 8.6) } });
    expect(out.scenes[0].out).toBe(10);
  });
});

describe('acercamientos y transiciones', () => {
  it('escala distinta por corte, lento en el remate, fijo en el cierre, y todo a corte seco', () => {
    const out = afinarMontaje(planBase(), { palabrasPorToma: {} });
    expect(out.scenes.map((s) => s.transition)).toEqual(['cut', 'cut', 'cut', 'cut']);
    expect(out.scenes[0]).toMatchObject({ punchFrom: 1.0, punchTo: 1.03 });
    expect(out.scenes[1]).toMatchObject({ punchFrom: 1.06, punchTo: 1.06 });
    expect(out.scenes[2]).toMatchObject({ punchFrom: 1.0, punchTo: 1.12 });
    expect(out.scenes[3]).toMatchObject({ punchFrom: 1.04, punchTo: 1.04 });
    expect(out.motor).toBe('remotion');
  });
});

describe('insertos de pantalla real', () => {
  it('ancla el inserto al principio de la frase que nombra la pantalla, nunca en el gancho ni en el cierre', () => {
    const scenes = planBase().scenes;
    const texto = 'ahora publico lo que necesito me cotizan proveedores verificados elijo y pago hasta en doce cuotas';
    const ws = palabras(texto, 0.5, 0.5);
    const ins = ubicarInsertos(scenes, { 'a.mp4': palabras('me pasaron un dato verificados', 0.5), 'b.mp4': ws, 'd.mp4': palabras('usá cuotas', 3) }, PANTALLAS);
    expect(ins[0]).toEqual([]);          // hook: la cara vende el gancho
    expect(ins[3]).toEqual([]);          // cta
    expect(ins[1].length).toBe(2);
    // el remate (gag) queda en la cara aunque nombre una pantalla
    const conGag = ubicarInsertos(scenes, { 'c.mp4': palabras('la seña con proveedores verificados', 0.5, 0.5) }, PANTALLAS);
    expect(conGag[2]).toEqual([]);
    const [verif, cuotas] = ins[1];
    // sin pausas ni puntuación, la frase arranca MAX_ATRAS palabras antes de la primera que pega
    const idx = texto.split(' ').indexOf('proveedores');
    expect(inicioDeFrase(ws, idx).text).toBe(texto.split(' ')[idx - MAX_ATRAS]);
    expect(verif.src).toContain('02-perfil');
    expect(verif.atSec).toBeCloseTo(ws[idx - MAX_ATRAS].start - 0.1, 5);
    expect(verif.durSec).toBeCloseTo(INSERTO_DUR, 5);
    expect(cuotas.src).toContain('03-paquetes');
    expect(cuotas.atSec).toBeCloseTo(ws[texto.split(' ').indexOf('pago')].start - 0.1, 5);
    expect(cuotas.atSec - (verif.atSec + verif.durSec)).toBeGreaterThanOrEqual(INSERTO_SEPARACION);
  });
  it('si dos pantallas se nombran muy seguido, el primer inserto se acorta para dejar cara; si ni así entra, el segundo no va', () => {
    const scenes = planBase().scenes;
    const juntas: PalabraTiempo[] = [{ text: 'proveedores', start: 1.0, end: 1.5 }, { text: 'cuotas', start: 3.9, end: 4.3 }];
    const ins = ubicarInsertos(scenes, { 'b.mp4': juntas }, PANTALLAS)[1];
    expect(ins.map((i) => [i.atSec, i.durSec])).toEqual([[0.9, expect.closeTo(3.8 - INSERTO_SEPARACION - 0.9, 5)], [3.8, INSERTO_DUR]]);
    expect(ins[0].durSec).toBeGreaterThanOrEqual(INSERTO_MIN);
    const pegadas: PalabraTiempo[] = [{ text: 'proveedores', start: 1.0, end: 1.5 }, { text: 'cuotas', start: 3.2, end: 3.6 }];
    expect(ubicarInsertos(scenes, { 'b.mp4': pegadas }, PANTALLAS)[1].length).toBe(1);
  });
  it('con el habla real (la pieza de Sin Vueltas), los dos insertos entran al principio de su frase', () => {
    const scenes = planBase().scenes;
    const ws: PalabraTiempo[] = [
      { text: 'me', start: 3.86, end: 3.94 }, { text: 'cotizan', start: 3.98, end: 4.36 }, { text: 'proveedores', start: 4.42, end: 4.92 },
      { text: 'verificados', start: 4.96, end: 5.56 }, { text: 'elijo', start: 6.96, end: 7.38 }, { text: 'y', start: 8.1, end: 8.12 },
      { text: 'pago', start: 8.24, end: 8.4 }, { text: 'hasta', start: 8.42, end: 8.58 }, { text: 'en', start: 8.62, end: 8.7 },
      { text: '12', start: 8.74, end: 9.02 }, { text: 'cuotas', start: 9.04, end: 9.46 },
    ];
    const ins = ubicarInsertos(scenes, { 'b.mp4': ws }, PANTALLAS)[1];
    // "me cotizan proveedores verificados" entra en "me" (3.86); "pago hasta en 12 cuotas" entra en "pago" (8.24)
    expect(ins.map((i) => [i.atSec, i.durSec])).toEqual([[expect.closeTo(3.76, 5), INSERTO_DUR], [expect.closeTo(8.14, 5), expect.closeTo(10 - 0.25 - 8.14, 5)]]);
  });
  it('inicioDeFrase se frena en una pausa o en un signo de puntuación', () => {
    const ws: PalabraTiempo[] = [
      { text: 'Hola.', start: 0, end: 0.3 }, { text: 'uso', start: 0.4, end: 0.6 }, { text: 'la', start: 0.65, end: 0.7 },
      { text: 'app', start: 0.75, end: 0.9 }, { text: 'ahora', start: 2.0, end: 2.3 }, { text: 'mismo', start: 2.35, end: 2.6 },
    ];
    expect(inicioDeFrase(ws, 3).text).toBe('uso');     // no cruza el punto de "Hola."
    expect(inicioDeFrase(ws, 5).text).toBe('ahora');   // no cruza la pausa de 1,1 s
  });
  it('sin coincidencia de palabras no inventa insertos, salvo que el storyboard haya asignado la captura', () => {
    const scenes = planBase().scenes;
    const sin = ubicarInsertos(scenes, { 'b.mp4': palabras('una historia cualquiera sin producto', 0.5) }, PANTALLAS);
    expect(sin[1]).toEqual([]);
    const asignada = scenes.map((s, i) => (i === 1 ? { ...s, archivoCaptura: 'screens/08-panel.png' } : s));
    const con = ubicarInsertos(asignada, { 'b.mp4': palabras('una historia cualquiera sin producto', 0.5) }, PANTALLAS);
    expect(con[1].length).toBe(1);
    expect(con[1][0].src).toContain('08-panel');
  });
  it('un inserto demasiado corto no se pone', () => {
    const scenes = [escena(1, 'a.mp4', 'hook'), escena(2, 'b.mp4', 'desarrollo', 3), escena(3, 'c.mp4', 'cta')];
    const ins = ubicarInsertos(scenes, { 'b.mp4': palabras('proveedores verificados', 1.9) }, PANTALLAS);
    expect(ins[1]).toEqual([]);
  });
});

describe('placa final', () => {
  it('usa la llamada a la acción del kit y agrega el dominio sólo si no está ya en el texto', () => {
    const a = afinarMontaje(planBase(), { palabrasPorToma: {}, cta: { principal: 'Entrá a sinvueltasya.com.ar y armá tu evento', url: 'https://sinvueltasya.com.ar' }, logoUrl: '/api/media-kit/k/file/logo.svg' });
    expect(a.endCard).toMatchObject({ linea1: 'Entrá a sinvueltasya.com.ar y armá tu evento', linea2: undefined, logoSrc: '/api/media-kit/k/file/logo.svg' });
    const b = afinarMontaje(planBase(), { palabrasPorToma: {}, cta: { principal: 'Pedí una demo', url: 'https://www.munify.com.ar/demo' } });
    expect(b.endCard).toMatchObject({ linea1: 'Pedí una demo', linea2: 'munify.com.ar' });
    expect(afinarMontaje(planBase(), { palabrasPorToma: {} }).endCard).toBeUndefined();
    expect(hostnameDe('sinvueltasya.com.ar/x')).toBe('sinvueltasya.com.ar');
  });
});

describe('la marca en los subtítulos', () => {
  it('reemplaza lo que la transcripción oyó por el nombre exacto, conservando tiempo y puntuación', () => {
    const marca = { exacto: 'sin vueltas ¡YA!', fonetica: 'sin vueltas ya' };
    const a = corregirMarca([{ text: 'Ahora', start: 0, end: 0.3 }, { text: 'uso', start: 0.4, end: 0.5 }, { text: 'Sin', start: 0.6, end: 0.7 }, { text: 'Vuelta', start: 0.75, end: 0.9 }, { text: 'Ya.', start: 1.0, end: 1.2 }], marca);
    expect(a.map((w) => w.text)).toEqual(['Ahora', 'uso', 'sin vueltas ¡YA!']);
    expect(a[2]).toMatchObject({ start: 0.6, end: 1.2 });
    // dijo la marca sin el "ya": se escribe bien lo que dijo, sin agregarle lo que no dijo
    const b = corregirMarca([{ text: 'Usá', start: 0, end: 0.2 }, { text: 'SinVueltas', start: 0.3, end: 0.9 }], marca);
    expect(b.map((w) => w.text)).toEqual(['Usá', 'sin vueltas']);
    const c = corregirMarca([{ text: 'Pedí', start: 0, end: 0.2 }, { text: 'una', start: 0.3, end: 0.4 }, { text: 'demo.', start: 0.5, end: 0.9 }], { exacto: 'Munify', fonetica: 'muni fai' });
    expect(c.map((w) => w.text)).toEqual(['Pedí', 'una', 'demo.']);
    const d = corregirMarca([{ text: 'Entrá', start: 0, end: 0.2 }, { text: 'a', start: 0.3, end: 0.35 }, { text: 'Munifai,', start: 0.4, end: 0.9 }], { exacto: 'Munify', fonetica: 'muni fai' });
    expect(d.map((w) => w.text)).toEqual(['Entrá', 'a', 'Munify,']);
    expect(corregirMarca([{ text: 'hola', start: 0, end: 1 }], undefined)).toEqual([{ text: 'hola', start: 0, end: 1 }]);
  });
});

describe('paginado de subtítulos', () => {
  it('corta frases por punto y por pausa larga; parte las largas por la coma o por el medio', () => {
    const ws = palabras('Le transferí la seña a un DJ que me pasaron por Instagram. Me clavó el visto.', 0.5, 0.3);
    const frases = frasesDe(ws);
    expect(frases.length).toBe(2);
    const paginas = frases.flatMap(partirFrase).map((p) => p.map((w) => w.text).join(' '));
    expect(paginas).toEqual(['Le transferí la seña a un DJ', 'que me pasaron por Instagram.', 'Me clavó el visto.']);
    const conComa = partirFrase(palabras('me cotizan proveedores verificados con Conquit, elijo y pago hasta en 12 cuotas'));
    expect(conComa.map((p) => p.map((w) => w.text).join(' '))).toEqual(['me cotizan proveedores verificados con Conquit,', 'elijo y pago hasta en 12 cuotas']);
    const pausa = [...palabras('Si no cumplen,', 0), ...palabras('te devuelven todo.', 3)];
    expect(frasesDe(pausa).length).toBe(2);
  });
});
