// El DIRECTORIO DE EFECTOS DE SONIDO (Lucas, 2026-10-13: "hasta te diría efectos especiales"): efectos cortos
// generados por estilo (whoosh, pop, ding, impacto...), agnósticos, que el backend lista en GET /api/sfx. El armado los
// pone solo: un whoosh donde cambia el material (persona ↔ pantalla de la app) y un golpe suave cuando aterriza el logo
// de la placa. En el multipista viven en la pista SFX: se arrastran desde la biblioteca, se mueven y se borran como
// cualquier clip.
import { API_BASE } from '../config';
import { sceneStarts, totalDuration, type MontajePlan } from './montajePlan';

export type UsoSfx = 'transicion' | 'aparicion' | 'remate' | 'logo' | 'tension';
export interface EfectoSonido { id: string; nombre: string; uso: UsoSfx; durSec: number; src: string }

export const SFX_EFECTOS: EfectoSonido[] = [];
let cargados = false;
export async function cargarSfx(apiBase = API_BASE): Promise<EfectoSonido[]> {
  if (cargados) return SFX_EFECTOS;
  try {
    const r = await fetch(`${apiBase}/api/sfx`);
    const d = (await r.json()) as { efectos?: EfectoSonido[] };
    const lista = (d.efectos || []).filter((e) => e.src);
    if (lista.length) { SFX_EFECTOS.splice(0, SFX_EFECTOS.length, ...lista); cargados = true; }
  } catch { /* sin backend no hay efectos */ }
  return SFX_EFECTOS;
}

const buscar = (uso: UsoSfx, preferido?: string) => SFX_EFECTOS.find((e) => e.id === preferido) || SFX_EFECTOS.find((e) => e.uso === uso);
const GAIN_TRANSICION = 0.55;
const GAIN_LOGO = 0.7;

// el plan con sus efectos: whoosh un poco antes de cada cambio de material, golpe suave justo cuando aterriza el logo (el
// momento en que arranca la voz del cierre, o medio segundo después de que entra la placa). Un plan que ya trae efectos
// (editado en el multipista) no se toca.
export function conEfectosDeSonido(plan: MontajePlan, mockups: { fileRef: string }[] = []): MontajePlan {
  if (!SFX_EFECTOS.length || plan.sfx?.length) return plan;
  const whoosh = buscar('transicion', 'whoosh-corto');
  const golpe = buscar('logo', 'impacto-suave');
  const refs = new Set(mockups.map((m) => m.fileRef));
  const esPantalla = (s: MontajePlan['scenes'][number]) => refs.has(s.src) || s.rol === 'pantalla';
  const starts = sceneStarts(plan);
  const sfx: NonNullable<MontajePlan['sfx']> = [];
  plan.scenes.forEach((s, i) => {
    if (i === 0 || !whoosh) return;
    if (esPantalla(s) !== esPantalla(plan.scenes[i - 1])) sfx.push({ src: whoosh.src, at: Math.max(0, Math.round((starts[i] - 0.25) * 100) / 100), durSec: whoosh.durSec, gain: GAIN_TRANSICION, nombre: whoosh.nombre });
  });
  if (plan.endCard && golpe) {
    const aterriza = plan.voice ? plan.voice.at - 0.05 : totalDuration(plan) + 0.3;
    sfx.push({ src: golpe.src, at: Math.max(0, Math.round(aterriza * 100) / 100), durSec: golpe.durSec, gain: GAIN_LOGO, nombre: golpe.nombre });
  }
  return sfx.length ? { ...plan, sfx } : plan;
}
