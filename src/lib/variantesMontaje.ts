// Las VERSIONES del montaje (Lucas, 2026-10-12: "que genere 3 o 4 variantes del paso previo al multipista; templates de
// reubicación y de sonido"). Sobre el armado del montajista, cada versión cambia cómo se cuenta (transiciones,
// acercamientos, efectos, dónde van las pantallas de la app) y cómo suena (nivel de la música, fundidos). Son
// transformaciones del mismo plan: no se vuelve a generar nada ni se compone otra música, así que cambiar de versión es
// instantáneo.
import type { MontajePlan, MontajeScene } from './montajePlan';

export type VarianteId = 'montajista' | 'ritmo' | 'suave' | 'voz' | 'app';
export interface Variante { id: VarianteId; nombre: string; que: string }

export const VARIANTES: Variante[] = [
  { id: 'montajista', nombre: 'Montajista', que: 'Como la armó el montajista: corte seco entre tomas y disolvencia cuando cambia el material.' },
  { id: 'ritmo', nombre: 'Ritmo', que: 'Cortes secos, acercamientos marcados, un flash en cada cambio de material y la música más arriba.' },
  { id: 'suave', nombre: 'Suave', que: 'Disolvencias entre todas las escenas, un acercamiento lento y la música que entra y sale despacio.' },
  { id: 'voz', nombre: 'Voz al frente', que: 'La persona sin pantallas encima y la música bien abajo, para que mande lo que dice.' },
  { id: 'app', nombre: 'Más app', que: 'Suma como escenas las pantallas de la app que no entraron, entre las tomas de la persona.' },
];

export interface MockupDisponible { nombre: string; fileRef: string; durSec?: number }

const DUR_PANTALLA = 3.5;   // lo que dura una pantalla de la app sumada como escena

// los mockups que el armado no usó (ni como escena ni como inserto): son los que suma "Más app"
function mockupsSinUsar(plan: MontajePlan, mockups: MockupDisponible[]): MockupDisponible[] {
  const usados = new Set<string>();
  for (const s of plan.scenes) { usados.add(s.src); for (const i of s.inserts || []) usados.add(i.src); }
  return mockups.filter((m) => m.fileRef && !usados.has(m.fileRef));
}

// las versiones que tienen sentido para este plan: "Más app" sólo si sobran pantallas
export function variantesDisponibles(base: MontajePlan, mockups: MockupDisponible[] = []): Variante[] {
  return VARIANTES.filter((v) => v.id !== 'app' || mockupsSinUsar(base, mockups).length > 0);
}

const conMusica = (plan: MontajePlan, cambios: Partial<NonNullable<MontajePlan['music']>>): MontajePlan['music'] =>
  plan.music ? { ...plan.music, ...cambios } : undefined;

export function aplicarVariante(base: MontajePlan, id: VarianteId | string | undefined, mockups: MockupDisponible[] = []): MontajePlan {
  const refsMockup = new Set(mockups.map((m) => m.fileRef));
  const esPantalla = (s: MontajeScene) => refsMockup.has(s.src) || s.rol === 'pantalla';
  const ultimo = base.scenes.length - 1;
  const cambiaMaterial = (i: number) => i > 0 && esPantalla(base.scenes[i]) !== esPantalla(base.scenes[i - 1]);

  if (id === 'ritmo') {
    return {
      ...base,
      scenes: base.scenes.map((s, i) => ({
        ...s,
        transition: i < ultimo ? 'cut' : s.transition,
        ...(esPantalla(s) ? {} : i % 2 === 0 ? { punchFrom: 1, punchTo: 1.12 } : { punchFrom: 1.12, punchTo: 1 }),
        ...(cambiaMaterial(i) ? { effect: 'flash' } : {}),
      })),
      music: conMusica(base, { gain: 0.36, fadeIn: 0 }),
    };
  }
  if (id === 'suave') {
    return {
      ...base,
      scenes: base.scenes.map((s, i) => ({
        ...s,
        transition: i < ultimo ? 'crossfade' : s.transition,
        ...(esPantalla(s) ? {} : { punchFrom: 1, punchTo: 1.05 }),
      })),
      music: conMusica(base, { gain: 0.24, fadeIn: 1.5, fadeOut: 3 }),
    };
  }
  if (id === 'voz') {
    return {
      ...base,
      scenes: base.scenes.map((s) => {
        const { inserts: _sinPantallasEncima, ...resto } = s;
        return resto;
      }),
      music: conMusica(base, { gain: 0.16, duck: true }),
    };
  }
  if (id === 'app') {
    const sobran = mockupsSinUsar(base, mockups);
    if (!sobran.length) return base;
    // repartidas entre las tomas de la persona: nunca antes del gancho (la primera escena) ni pegadas a la placa
    const huecos = base.scenes.map((_, i) => i).filter((i) => i >= 0 && i < ultimo && !esPantalla(base.scenes[i]));
    const despues = new Map<number, MockupDisponible[]>();
    sobran.forEach((m, k) => {
      const i = huecos.length ? huecos[Math.min(huecos.length - 1, Math.floor(((k + 1) * huecos.length) / (sobran.length + 1)))] : ultimo;
      despues.set(i, [...(despues.get(i) || []), m]);
    });
    let n = Math.max(0, ...base.scenes.map((s) => s.escenaN)) + 100;
    const scenes: MontajeScene[] = [];
    base.scenes.forEach((s, i) => {
      const extra = despues.get(i) || [];
      scenes.push(extra.length ? { ...s, transition: 'crossfade' } : s);
      extra.forEach((m) => {
        n += 1;
        scenes.push({ escenaN: n, src: m.fileRef, in: 0, out: Math.min(m.durSec && m.durSec > 0 ? m.durSec : DUR_PANTALLA, DUR_PANTALLA), audio: 'mute', audioGain: 1, transition: 'crossfade', rol: 'pantalla', screen: m.nombre, punchFrom: 1, punchTo: 1 });
      });
    });
    return { ...base, scenes };
  }
  return base;
}
