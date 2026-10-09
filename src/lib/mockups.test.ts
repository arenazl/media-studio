import { describe, expect, it } from 'vitest';
import { armarMockups, elegirCaptura, numeroDe, partesResaltadas } from './mockups';
import type { Comercial, Escena } from './comercial';
import type { PantallaKit } from './mediaKit';

const PANTALLAS: PantallaKit[] = [
  { archivo: 'screens/dash.png', url: '/api/storage/p/dash.png', nombre: 'Dashboard municipal', zonaClave: 'fila de KPIs y reclamos por estado' },
  { archivo: 'screens/reclamos.png', url: '/api/storage/p/reclamos.png', nombre: 'Reclamos vecinales', zonaClave: 'lista con estado y categoría' },
  { archivo: 'screens/vecino.png', url: '/api/storage/p/vecino.png', nombre: 'App del vecino', zonaClave: 'carga de un reclamo desde el celular', viewport: 'mobile' },
];

const escena = (n: number, rol: Escena['rol'], accion: string, extra: Partial<Escena> = {}): Escena =>
  ({ n, rol, durSec: 4, plano: '', angulo: '', personajes: [], accion, dialogo: '', continuidad: '', ...extra });

const comercial = (storyboard: Escena[]): Comercial =>
  ({ id: 'c', titulo: 't', tipo: 'animado', estados: {} as Comercial['estados'], storyboard });

describe('numeroDe', () => {
  it('encuentra la cifra con su formato y no anima cantidades chicas', () => {
    expect(numeroDe('1.229 reclamos gestionados')).toBe('1.229');
    expect(numeroDe('87% de resolución')).toBe('87%');
    expect(numeroDe('pago hasta en 12 cuotas')).toBe('12');
    expect(numeroDe('en 4 pasos')).toBeUndefined();
    expect(numeroDe('Tu gestión, en números.')).toBeUndefined();
    expect(numeroDe('Ley 25.326 de datos')).toBe('25.326');
  });
});

describe('elegirCaptura', () => {
  it('prioriza la captura asignada por el storyboard, después el nombre de pantalla, y si nada pega, ninguna', () => {
    expect(elegirCaptura(escena(1, 'hook', 'x', { archivoCaptura: 'screens/vecino.png' }), PANTALLAS)?.archivo).toBe('screens/vecino.png');
    expect(elegirCaptura(escena(1, 'desarrollo', 'Todo en una pantalla', { screen: 'Dashboard municipal' }), PANTALLAS)?.archivo).toBe('screens/dash.png');
    expect(elegirCaptura(escena(1, 'desarrollo', 'Los reclamos, ordenados', { screen: 'Listado de reclamos' }), PANTALLAS)?.archivo).toBe('screens/reclamos.png');
    expect(elegirCaptura(escena(1, 'hook', 'Tu gestión, en números.'), PANTALLAS)).toBeUndefined();
    expect(elegirCaptura(escena(1, 'hook', 'x', { screen: 'Dashboard municipal' }), [])).toBeUndefined();
  });
});

describe('partesResaltadas', () => {
  it('parte el título en antes / resaltado / después sin importar mayúsculas', () => {
    expect(partesResaltadas('Tu gestión, en números.', 'en números')).toEqual(['Tu gestión, ', 'en números', '.']);
    expect(partesResaltadas('Goberná con datos.', 'CON DATOS')).toEqual(['Goberná ', 'con datos', '.']);
    expect(partesResaltadas('Goberná con datos.', 'papel')).toEqual(['Goberná con datos.', '', '']);
    expect(partesResaltadas('Hola', undefined)).toEqual(['Hola', '', '']);
  });
});

describe('armarMockups', () => {
  const sb = [
    escena(1, 'hook', 'Tu gestión, en números.', { continuidad: 'en números', dialogo: 'Esto es lo que pasa cuando el municipio deja el papel.' }),
    escena(2, 'desarrollo', 'Todo en una pantalla', { screen: 'Dashboard municipal', continuidad: 'una pantalla' }),
    escena(3, 'desarrollo', 'El vecino carga desde el celular', { screen: 'App del vecino', continuidad: 'celular', durSec: 2 }),
    escena(4, 'cta', 'Goberná con datos.', { continuidad: 'con datos', screen: 'Dashboard municipal' }),
  ];
  const insumos = {
    pantallas: PANTALLAS,
    marca: { nombre: 'Munify', logoUrl: 'https://app.munify.com.ar/brand/Munify.svg', colores: { primario: '#18a24d' } },
    cta: { principal: 'Pedí una demo para tu municipio', url: 'https://munify.com.ar' },
  };
  it('título cuando no hay captura, pantalla cuando la hay (teléfono si es móvil), y el cierre siempre es título', () => {
    const p = armarMockups(comercial(sb), insumos);
    expect(p.escenas.map((e) => e.tipo)).toEqual(['titulo', 'pantalla', 'pantalla', 'titulo']);
    expect(p.escenas[0]).toMatchObject({ titulo: 'Tu gestión, en números.', resaltar: 'en números', numero: undefined });
    expect(p.escenas[1]).toMatchObject({ badge: 'Dashboard municipal', captura: { src: '/api/storage/p/dash.png', alto: false } });
    expect(p.escenas[2].captura?.alto).toBe(true);
    expect(p.escenas[2].durSec).toBe(2.5);                 // mínimo por escena
    expect(p.escenas[3]).toMatchObject({ tipo: 'titulo', badge: 'Dashboard municipal' });
  });
  it('la cifra sólo sale del texto; la placa usa el CTA y el dominio; los colores de la marca pisan el estilo oscuro', () => {
    const p = armarMockups(comercial([escena(1, 'hook', '1.229 reclamos gestionados', { continuidad: 'reclamos' })]), insumos);
    expect(p.escenas[0].numero).toBe('1.229');
    expect(p.placa).toMatchObject({ linea1: 'Pedí una demo para tu municipio', linea2: 'munify.com.ar', logoSrc: 'https://app.munify.com.ar/brand/Munify.svg' });
    expect(p.marca).toMatchObject({ nombre: 'Munify', sitio: 'munify.com.ar', estilo: { primario: '#18a24d', acento: '#F59E0B', fondo: '#0B0A14' } });
    expect(armarMockups(comercial([]), { pantallas: [], marca: { nombre: 'X' } }).placa).toBeUndefined();
  });
  it('un resaltado que no está en el título no se aplica; la medida real gana sobre el viewport', () => {
    const p = armarMockups(comercial([escena(1, 'desarrollo', 'Todo en una pantalla', { screen: 'Dashboard municipal', continuidad: 'papel' })]), { ...insumos, medidas: { '/api/storage/p/dash.png': 2.1 } });
    expect(p.escenas[0].resaltar).toBeUndefined();
    expect(p.escenas[0].captura).toMatchObject({ alto: true, proporcion: 2.1 });
  });
  it('la narración corta va como línea secundaria; la larga o igual al título, no', () => {
    const corta = armarMockups(comercial([escena(1, 'hook', 'Tu gestión, en una pantalla.', { dialogo: 'Reclamos, trámites, tesorería y turnos: todo en un solo lugar.' })]), insumos);
    expect(corta.escenas[0].sub).toBe('Reclamos, trámites, tesorería y turnos: todo en un solo lugar.');
    const larga = armarMockups(comercial([escena(1, 'hook', 'Título', { dialogo: 'x'.repeat(140) })]), insumos);
    expect(larga.escenas[0].sub).toBeUndefined();
    const igual = armarMockups(comercial([escena(1, 'hook', '', { dialogo: 'Lo mismo' })]), insumos);
    expect(igual.escenas[0]).toMatchObject({ titulo: 'Lo mismo', sub: undefined });
  });
});
