// Director publicitario: vocabulario cerrado, ejecución pura y anclajes estables a escenas.
// La IA sólo PROPONE. Este compilador valida y aplica acciones que el render realmente conoce.
import { sceneStarts, silenceRanges, totalDuration, type MontajePlan, type MusicCue } from './montajePlan';

export type RecursoMontaje = 'music_drop' | 'music_dip' | 'music_lift' | 'cut' | 'dissolve' | 'show_face' | 'sfx_off';
export interface DecisionMontaje {
  recurso: RecursoMontaje;
  escenaN: number;
  clipId?: string;
  offsetSec?: number; // instante relativo al inicio visible de la instancia
  insertId?: string; // para retirar UN inserto, nunca todos por accidente
  cuando: 'antes' | 'inicio' | 'final';
  durSec: number;
  motivo: string;
}
export interface PropuestaMontaje { diagnostico: string; decisiones: DecisionMontaje[] }
export interface ResultadoDireccion { plan: MontajePlan; aplicadas: DecisionMontaje[]; rechazadas: string[] }

const MUSIC_LEVEL: Partial<Record<RecursoMontaje, number>> = {
  music_drop: 0, music_dip: 0.32, music_lift: 1.18,
};
const RECURSOS = new Set<RecursoMontaje>(['music_drop', 'music_dip', 'music_lift', 'cut', 'dissolve', 'show_face', 'sfx_off']);
const QUANDOS = new Set(['antes', 'inicio', 'final']);
const limite = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function validarPropuestaMontaje(value: unknown): string[] {
  const p = value as Partial<PropuestaMontaje> | null;
  const errores: string[] = [];
  if (!p || typeof p.diagnostico !== 'string' || !p.diagnostico.trim()) errores.push('falta diagnostico');
  if (!Array.isArray(p?.decisiones) || p!.decisiones!.length > 8) return [...errores, 'decisiones debe ser una lista de 0 a 8'];
  p!.decisiones!.forEach((x, i) => {
    if (!x || !RECURSOS.has(x.recurso)) errores.push(`decisiones[${i}].recurso no admitido`);
    if (!Number.isInteger(x?.escenaN) || x.escenaN < 1) errores.push(`decisiones[${i}].escenaN inválido`);
    if (!QUANDOS.has(x?.cuando)) errores.push(`decisiones[${i}].cuando inválido`);
    if (typeof x?.durSec !== 'number' || !Number.isFinite(x.durSec) || x.durSec < 0 || x.durSec > 1.5) errores.push(`decisiones[${i}].durSec debe estar entre 0 y 1.5`);
    if (x?.offsetSec != null && (typeof x.offsetSec !== 'number' || !Number.isFinite(x.offsetSec) || x.offsetSec < 0)) errores.push(`decisiones[${i}].offsetSec inválido`);
    if (x?.clipId != null && (typeof x.clipId !== 'string' || !x.clipId.trim())) errores.push(`decisiones[${i}].clipId inválido`);
    if (x?.insertId != null && (typeof x.insertId !== 'string' || !x.insertId.trim())) errores.push(`decisiones[${i}].insertId inválido`);
    if (!x?.motivo || typeof x.motivo !== 'string' || x.motivo.length > 180) errores.push(`decisiones[${i}].motivo requerido, máximo 180 caracteres`);
  });
  return errores;
}

export function aplicarPropuestaMontaje(base: MontajePlan, propuesta: PropuestaMontaje): ResultadoDireccion {
  const errores = validarPropuestaMontaje(propuesta);
  if (errores.length) throw new Error(errores.join('; '));
  const scenes = base.scenes.map((s) => ({ ...s, inserts: s.inserts?.map((ins) => ({ ...ins })) }));
  const aplicadas: DecisionMontaje[] = [];
  const rechazadas: string[] = [];
  const cues: MusicCue[] = [...(base.musicCues || [])]; // preservar pausas manuales y automatizaciones anteriores
  let sfx = base.sfx?.map((s) => ({ ...s }));
  const starts = sceneStarts(base);
  propuesta.decisiones.forEach((d) => {
    const i = scenes.findIndex((s) => d.clipId ? s.clipId === d.clipId : s.escenaN === d.escenaN);
    if (i < 0 || !scenes[i].src) { rechazadas.push(`Escena ${d.escenaN} sin clip disponible: ${d.recurso}`); return; }
    if (d.recurso in MUSIC_LEVEL) {
      if (!base.music?.src) { rechazadas.push(`Sin música: ${d.recurso}`); return; }
      const dur = limite(d.durSec, 0.1, 1.5);
      const inicio = starts[i];
      const sceneDur = Math.max(0, scenes[i].out - scenes[i].in);
      if (d.offsetSec != null && d.offsetSec > sceneDur) { rechazadas.push(`Instante fuera de escena ${d.escenaN}`); return; }
      const ancla = inicio + (d.offsetSec || 0);
      if (d.cuando === 'antes' && ancla < dur) { rechazadas.push(`No hay tiempo antes de escena ${d.escenaN}`); return; }
      cues.push({ escenaN: d.escenaN, ...(scenes[i].clipId ? { clipId: scenes[i].clipId } : {}), ...(d.offsetSec != null ? { offsetSec: d.offsetSec } : {}), origen: 'ia', cuando: d.cuando, durSec: dur, nivel: MUSIC_LEVEL[d.recurso]!, motivo: d.motivo });
    } else if (d.recurso === 'cut' || d.recurso === 'dissolve') {
      // La transición está guardada en la escena ANTERIOR al corte que se quiere tratar.
      const idx = d.cuando === 'final' ? i : i - 1;
      if (idx < 0 || idx >= scenes.length - 1) { rechazadas.push(`No hay corte adyacente a escena ${d.escenaN}`); return; }
      scenes[idx].transition = d.recurso === 'cut' ? 'cut' : 'crossfade';
    } else if (d.recurso === 'show_face') {
      const insertos = scenes[i].inserts || [];
      if (!insertos.length) { rechazadas.push(`Escena ${d.escenaN} sin insertos que retirar`); return; }
      if (!d.insertId && insertos.length > 1) { rechazadas.push(`Escena ${d.escenaN} tiene varios insertos: hay que indicar insertId`); return; }
      const elegido = d.insertId
        ? insertos.findIndex((ins, k) => (ins.id || `${scenes[i].clipId || scenes[i].escenaN}:insert-${k}`) === d.insertId) : 0;
      if (elegido < 0) { rechazadas.push(`Inserto inexistente en escena ${d.escenaN}`); return; }
      scenes[i].inserts = insertos.filter((_, k) => k !== elegido);
    } else if (d.recurso === 'sfx_off') {
      const end = starts[i] + Math.max(0, scenes[i].out - scenes[i].in);
      const a = sfx?.length || 0;
      sfx = sfx?.filter((x) => x.at < starts[i] - 0.3 || x.at > end);
      if (a === (sfx?.length || 0)) { rechazadas.push(`Escena ${d.escenaN} sin efectos que retirar`); return; }
    }
    aplicadas.push(d);
  });
  return { plan: { ...base, scenes, musicCues: cues, ...(sfx ? { sfx } : {}) }, aplicadas, rechazadas };
}

export interface IntervaloMusica { desde: number; hasta: number; nivel: number; fade: number }

// La orden permanece atada a escenaN si un editor modifica las duraciones/orden de escenas.
export function intervalosMusica(plan: MontajePlan): IntervaloMusica[] {
  const starts = sceneStarts(plan);
  const total = totalDuration(plan) + (plan.endCard?.durSec || 0);
  const fromCue = (plan.musicCues || []).flatMap((cue) => {
    const i = plan.scenes.findIndex((s) => cue.clipId ? s.clipId === cue.clipId : s.escenaN === cue.escenaN);
    if (i < 0 || !plan.scenes[i].src) return [];
    const t = cue.cuando === 'final' ? starts[i] + plan.scenes[i].out - plan.scenes[i].in : starts[i] + (cue.offsetSec || 0);
    const desde = cue.cuando === 'antes' || cue.cuando === 'final' ? t - cue.durSec : t;
    const hasta = desde + cue.durSec;
    return [{ desde: limite(r3(desde), 0, total), hasta: limite(r3(hasta), 0, total), nivel: cue.nivel, fade: 0.07 }];
  });
  const legacy = silenceRanges(plan).map(([desde, hasta]) => ({ desde, hasta, nivel: 0, fade: 0.07 }));
  return [...legacy, ...fromCue].filter((i) => i.hasta > i.desde);
}

// Ganancia multiplicativa, con rampas de entrada y salida para evitar clicks.
// 'duck' se interpola suavemente en lugar de saltar de 1 a 0.35 entre cuadros.
export function factorMusica(t: number, intervals: IntervaloMusica[], duckRanges: [number, number][], duck = true): number {
  const r = (v: number) => limite(v, 0, 1);
  let factor = 1;
  if (duck) for (const [a,b] of duckRanges) {
    const attack = r((t - (a - 0.10)) / 0.10), release = r((b + 0.18 - t) / 0.18);
    factor = Math.min(factor, 1 - 0.65 * Math.min(attack, release));
  }
  for (const cue of intervals) {
    const ramp = Math.min(cue.fade, (cue.hasta - cue.desde) / 3);
    const a = r((t - cue.desde) / Math.max(0.001, ramp));
    const b = r((cue.hasta - t) / Math.max(0.001, ramp));
    const k = Math.min(a, b);
    const gain = 1 + (cue.nivel - 1) * k;
    factor = cue.nivel <= 1 ? Math.min(factor, gain) : Math.min(1.25, factor * gain);
  }
  return limite(factor, 0, 1.25);
}
