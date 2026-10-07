// Tests del framework de tema (kit v3). Son del CATÁLOGO en espíritu: si uno de
// estos cae, el que está roto es el framework, no media-studio.
//
// Entorno vitest = node puro (sin jsdom): no hay `document` ni `localStorage`.
// El store está escrito para tolerar las dos ausencias, y eso también se testea
// acá — es la rama que corre en SSR y en una ventana privada.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ACENTOS, FONDOS, aplicarTokens, derivar, getAcento, getFondo, limpiarTokens,
  luminancia, tintaSobre, VARS, type Tokens,
} from './temaPresets';
import { crearTemaStore } from './temaStore';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => { m.clear(); },
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  };
}

/** Un elemento con lo justo para que `aplicarTokens` escriba sobre él. */
function fakeRoot() {
  const props = new Map<string, string>();
  return {
    props,
    el: {
      style: {
        setProperty: (k: string, v: string) => { props.set(k, v); },
        removeProperty: (k: string) => { props.delete(k); },
      },
    } as unknown as HTMLElement,
  };
}

beforeEach(() => { vi.stubGlobal('localStorage', fakeStorage()); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('la matriz de fondos', () => {
  it('son seis: tres claros y tres oscuros', () => {
    expect(FONDOS.filter((f) => f.modo === 'light')).toHaveLength(3);
    expect(FONDOS.filter((f) => f.modo === 'dark')).toHaveLength(3);
  });

  it('ningún par (modo, temperatura) se repite — si se repite, uno de los dos sobra', () => {
    const casilleros = FONDOS.map((f) => `${f.modo}/${f.temperatura}`);
    expect(new Set(casilleros).size).toBe(FONDOS.length);
  });

  it('cada fondo recomienda un acento que EXISTE en la paleta', () => {
    for (const f of FONDOS) {
      expect(ACENTOS.some((a) => a.id === f.acentoRecomendado), f.id).toBe(true);
    }
  });

  it('los claros son claros y los oscuros oscuros (nada de un "claro" al 0.3)', () => {
    for (const f of FONDOS) {
      const l = luminancia(f.base);
      if (f.modo === 'light') expect(l, f.id).toBeGreaterThan(0.85);
      else expect(l, f.id).toBeLessThan(0.2);
    }
  });
});

describe('getFondo (resolución tolerante)', () => {
  it('devuelve el pedido cuando existe en ese modo', () => {
    expect(getFondo('tabaco', 'dark').id).toBe('tabaco');
  });

  it('un id de OTRO modo no se cuela: cae al default del modo pedido', () => {
    expect(getFondo('tabaco', 'light').modo).toBe('light');
  });

  it('traduce los ids viejos guardados en localStorage (carbon -> grafito)', () => {
    expect(getFondo('carbon', 'dark').id).toBe('grafito');
  });

  it('basura o vacío no rompe', () => {
    expect(getFondo('no-existe', 'dark').modo).toBe('dark');
    expect(getFondo(null, 'light').modo).toBe('light');
  });
});

describe('getAcento', () => {
  it('traduce los acentos viejos (esmeralda -> verde)', () => {
    expect(getAcento('esmeralda', 'azul').id).toBe('verde');
  });

  it('cae al recomendado del fondo si no hay elección', () => {
    expect(getAcento(null, 'terracota').id).toBe('terracota');
  });
});

describe('tintaSobre (la vara del contraste)', () => {
  it('el verde pleno lleva tinta CLARA y la lima tinta OSCURA — el corte en 0.59', () => {
    expect(tintaSobre('#22c55e')).toBe('#ffffff');
    expect(tintaSobre('#a3e635')).toBe('#1e293b');
  });

  it('cada acento de la paleta recibe una tinta que contrasta de verdad', () => {
    for (const a of ACENTOS) {
      const tinta = tintaSobre(a.color);
      const dif = Math.abs(luminancia(a.color) - luminancia(tinta));
      expect(dif, `${a.id} contra ${tinta}`).toBeGreaterThan(0.25);
    }
  });
});

describe('derivar (la paleta sale de un color)', () => {
  it('en modo oscuro los escalones ACLARAN; en claro OSCURECEN', () => {
    const osc = derivar(getFondo('grafito', 'dark'), getAcento('azul', 'azul'));
    expect(luminancia(osc.bg2)).toBeGreaterThan(luminancia(osc.bg1));
    const cla = derivar(getFondo('marfil', 'light'), getAcento('azul', 'azul'));
    expect(luminancia(cla.bg2)).toBeLessThan(luminancia(cla.bg1));
  });

  it('un fondo casi blanco baja un escalón y la CARD se queda con el blanco', () => {
    const nieve = getFondo('nieve', 'light');
    const t = derivar(nieve, getAcento('azul', 'azul'));
    expect(luminancia(t.bg1)).toBeLessThan(luminancia(nieve.base));
    expect(t.surface).toBe(nieve.base);
  });

  it('el escalón conserva la TEMPERATURA del fondo (Marfil no se vuelve frío)', () => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(derivar(getFondo('marfil', 'light'), ACENTOS[0]).bg1.slice(1 + i, 3 + i), 16));
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(b);
  });

  it('el acento manda en brand-500 y la tinta de encima se calcula', () => {
    const dorado = derivar(getFondo('marino', 'dark'), getAcento('dorado', 'dorado'));
    expect(dorado.brand500).toBe('#c79a2b');
    expect(dorado.onBrand).toBe('#1e293b');          // dorado claro -> tinta oscura
    const vino = derivar(getFondo('marino', 'dark'), getAcento('vino', 'vino'));
    expect(vino.onBrand).toBe('#ffffff');            // vino oscuro -> tinta clara
  });

  it('las sombras del modo claro son más suaves que las del oscuro', () => {
    const cla = derivar(getFondo('nieve', 'light'), ACENTOS[0]);
    const osc = derivar(getFondo('marino', 'dark'), ACENTOS[0]);
    expect(cla.shadowCard).toContain('13, 20, 18');
    expect(osc.shadowCard).toContain('0, 0, 0');
  });

  it('ninguna combinación fondo × acento deja un token vacío', () => {
    for (const f of FONDOS) {
      for (const a of ACENTOS) {
        const t = derivar(f, a);
        for (const k of Object.keys(VARS) as (keyof Tokens)[]) {
          expect(t[k], `${f.id}/${a.id}/${k}`).toBeTruthy();
        }
      }
    }
  });
});

describe('aplicarTokens / limpiarTokens', () => {
  it('escribe TODOS los tokens más los alias del acento', () => {
    const { props, el } = fakeRoot();
    aplicarTokens(derivar(getFondo('marino', 'dark'), getAcento('verde', 'verde')), el);
    expect(props.get('--bg-1')).toBe('#18202f');
    expect(props.get('--brand-500')).toBe('#2fb37e');
    expect(props.get('--color-primary')).toBe('#2fb37e');   // alias, mismo valor
    expect(props.size).toBe(Object.keys(VARS).length + 2);
  });

  it('limpiar devuelve el control al CSS de la app', () => {
    const { props, el } = fakeRoot();
    aplicarTokens(derivar(FONDOS[0], ACENTOS[0]), el);
    limpiarTokens(el);
    expect(props.size).toBe(0);
  });
});

describe('el store', () => {
  it('arranca en los defaults que le pasa la app', () => {
    const t = crearTemaStore({ prefijo: 'x', defaults: { claro: 'hielo', oscuro: 'tabaco', acento: 'violeta', modo: 'dark' } });
    expect(t.getEstado().modo).toBe('dark');
    expect(t.fondoActual().id).toBe('tabaco');
    expect(t.acentoActual().id).toBe('violeta');
  });

  it('LA LUNA: alterna el modo, salta al fondo del otro modo y CONSERVA el acento', () => {
    const t = crearTemaStore({ prefijo: 'x', defaults: { claro: 'hielo', oscuro: 'tabaco', acento: 'violeta', modo: 'dark' } });
    t.alternarModo();
    expect(t.getEstado().modo).toBe('light');
    expect(t.fondoActual().id).toBe('hielo');
    expect(t.acentoActual().id).toBe('violeta');
  });

  it('elegir un fondo del otro modo CAMBIA el modo (y no pierde el de este)', () => {
    const t = crearTemaStore({ prefijo: 'x', defaults: { claro: 'nieve', oscuro: 'marino', acento: 'azul', modo: 'dark' } });
    t.setFondo('marfil');
    expect(t.getEstado().modo).toBe('light');
    expect(t.getEstado().fondoClaro).toBe('marfil');
    expect(t.getEstado().fondoOscuro).toBe('marino');     // el oscuro elegido sigue ahí
  });

  it('persiste las cuatro preferencias y las relee', () => {
    const uno = crearTemaStore({ prefijo: 'app1' });
    uno.setFondo('tabaco');
    uno.setAcento('dorado');
    const otro = crearTemaStore({ prefijo: 'app1' });
    expect(otro.getEstado().fondoOscuro).toBe('tabaco');
    expect(otro.acentoActual().id).toBe('dorado');
  });

  it('dos apps en el mismo navegador NO se pisan la preferencia', () => {
    crearTemaStore({ prefijo: 'app1' }).setAcento('vino');
    const otra = crearTemaStore({ prefijo: 'app2', defaults: { claro: 'nieve', oscuro: 'marino', acento: 'verde' } });
    expect(otra.acentoActual().id).toBe('verde');
  });

  it('ignora un acento que no está en la paleta (nadie se queda con un color inventado)', () => {
    const t = crearTemaStore({ prefijo: 'x', defaults: { claro: 'nieve', oscuro: 'marino', acento: 'azul' } });
    t.setAcento('fucsia-neon');
    expect(t.acentoActual().id).toBe('azul');
  });

  it('avisa a los suscriptores en cada cambio, y sólo cuando cambia algo', () => {
    const t = crearTemaStore({ prefijo: 'x', defaults: { claro: 'nieve', oscuro: 'marino', acento: 'azul', modo: 'dark' } });
    let avisos = 0;
    const baja = t.subscribe(() => { avisos += 1; });
    t.setAcento('verde');
    t.setAcento('verde');            // el mismo: no hay cambio, no hay aviso
    t.setModo('light');
    baja();
    t.setModo('dark');               // ya dado de baja
    expect(avisos).toBe(2);
  });

  it('el snapshot es ESTABLE mientras no cambie nada (useSyncExternalStore no repinta en loop)', () => {
    const t = crearTemaStore({ prefijo: 'x' });
    expect(t.getEstado()).toBe(t.getEstado());
  });

  it('sin localStorage sigue funcionando en memoria (ventana privada / SSR)', () => {
    vi.stubGlobal('localStorage', undefined);
    const t = crearTemaStore({ prefijo: 'x', defaults: { claro: 'nieve', oscuro: 'marino', acento: 'azul', modo: 'light' } });
    t.setAcento('turquesa');
    expect(t.acentoActual().id).toBe('turquesa');
  });

  it('sin document, aplicar() no explota', () => {
    const t = crearTemaStore({ prefijo: 'x' });
    expect(() => t.aplicar()).not.toThrow();
  });
});
