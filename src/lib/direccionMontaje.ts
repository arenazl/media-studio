// Decisiones de montaje que el motor puede ejecutar y el editor multipista puede corregir.
// La IA NO decide frames arbitrarios: ancla sus sugerencias a escenas existentes.
import { sceneStarts, totalDuration, type MontajePlan } from './montajePlan';

export type RecursoDireccion = 'pausa_musical' | 'bajar_musica' | 'subir_musica' | 'corte_seco' | 'fundido' | 'zoom_sutil' | 'sin_zoom';
export interface DecisionDireccion { escenaN: number; recurso: RecursoDireccion; durSec?: number; motivo: string }
export interface PropuestaDireccion { diagnostico: string; decisiones: DecisionDireccion[] }
export interface ResultadoDireccion { plan: MontajePlan; aplicadas: string[]; descartadas: string[] }
export interface PuntoMusical { atSec: number; gain: number; rampSec?: number }

const RECURSOS = new Set<RecursoDireccion>(['pausa_musical', 'bajar_musica', 'subir_musica', 'corte_seco', 'fundido', 'zoom_sutil', 'sin_zoom']);
const redondear = (n: number) => Math.round(n * 1000) / 1000;
const limitar = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Multiplicador de ganancia para la pista musical: cada punto marca el final de una rampa.
// Al no haber puntos devuelve 1: todos los montajes anteriores se reproducen igual.
export function nivelAutomatizacion(seg: number, puntos: readonly PuntoMusical[] = []): number {
  let anterior = 1;
  for (const punto of [...puntos].sort((a, b) => a.atSec - b.atSec)) {
    if (!Number.isFinite(punto.atSec) || !Number.isFinite(punto.gain)) continue;
    const objetivo = limitar(punto.gain, 0, 1);
    const fin = Math.max(0, punto.atSec);
    const rampa = limitar(punto.rampSec ?? 0, 0, 3);
    const inicio = fin - rampa;
    if (seg < inicio) return anterior;
    if (rampa > 0 && seg < fin) return limitar(anterior + (objetivo - anterior) * (seg - inicio) / rampa, 0, 1);
    anterior = objetivo;
  }
  return anterior;
}

export function aplicarDireccionMontaje(base: MontajePlan, propuesta: PropuestaDireccion): ResultadoDireccion {
  const plan: MontajePlan = {
    ...base,
    scenes: base.scenes.map((s) => ({ ...s })),
    music: base.music ? { ...base.music, automation: [...(base.music.automation || [])] } : undefined,
    silences: [...(base.silences || [])],
    sfx: base.sfx ? [...base.sfx] : undefined,
  };
  const aplicadas: string[] = [], descartadas: string[] = [];
  const starts = sceneStarts(plan);
  const usado = new Set<string>();
  const decisiones = Array.isArray(propuesta?.decisiones) ? propuesta.decisiones.slice(0, 10) : [];
  for (const d of decisiones) {
    const ix = plan.scenes.findIndex((s) => s.escenaN === d.escenaN && !!s.src);
    if (ix < 0 || !RECURSOS.has(d.recurso)) { descartadas.push('Escena/recurso inexistente'); continue; }
    const clave = d.escenaN + ':' + d.recurso;
    if (usado.has(clave)) { descartadas.push('Repetida: ' + clave); continue; }
    usado.add(clave);
    const s = plan.scenes[ix];
    const at = starts[ix];
    const dur = Math.max(0, s.out - s.in);
    const siguiente = ix < plan.scenes.length - 1;
    if (d.recurso === 'pausa_musical' || d.recurso === 'bajar_musica' || d.recurso === 'subir_musica') {
      if (!plan.music?.src) { descartadas.push('Sin música para ' + d.recurso + ' en escena ' + d.escenaN); continue; }
      const cues = plan.music.automation!;
      if (d.recurso === 'pausa_musical') {
        const pausa = limitar(Number(d.durSec) || 0.4, 0.2, 0.8);
        if (at < 0.16) { descartadas.push('Sin margen para pausa en escena ' + d.escenaN); continue; }
        cues.push({ atSec: redondear(at - 0.08), gain: 0, rampSec: 0.08 });
        cues.push({ atSec: redondear(at + pausa + 0.14), gain: 1, rampSec: 0.14 });
      } else if (d.recurso === 'bajar_musica') {
        cues.push({ atSec: redondear(at + 0.15), gain: 0.5, rampSec: 0.15 });
        cues.push({ atSec: redondear(at + Math.max(0.4, dur) + 0.2), gain: 1, rampSec: 0.2 });
      } else {
        if (at < 0.6) { descartadas.push('Sin margen para subida en escena ' + d.escenaN); continue; }
        cues.push({ atSec: redondear(at - 0.5), gain: 0.55 });
        cues.push({ atSec: redondear(at + 0.1), gain: 1, rampSec: 0.6 });
      }
    } else if (d.recurso === 'corte_seco' || d.recurso === 'fundido') {
      if (!siguiente) { descartadas.push('No hay transición posterior a escena ' + d.escenaN); continue; }
      s.transition = d.recurso === 'corte_seco' ? 'cut' : 'crossfade';
    } else if (d.recurso === 'zoom_sutil') { s.punchFrom = 1; s.punchTo = 1.05; }
    else { s.punchFrom = 1; s.punchTo = 1; }
    aplicadas.push('Escena ' + d.escenaN + ': ' + d.recurso + (d.motivo ? ' — ' + String(d.motivo).slice(0, 100) : ''));
  }
  if (plan.music?.automation) {
    // Si dos automatizaciones se superponen, evitar un resultado sonoro no determinista.
    plan.music.automation = plan.music.automation
      .filter((p) => Number.isFinite(p.atSec) && Number.isFinite(p.gain))
      .map((p) => ({ ...p, atSec: limitar(p.atSec, 0, totalDuration(plan) + (plan.endCard?.durSec || 0) + 1), gain: limitar(p.gain, 0, 1) }))
      .sort((a, b) => a.atSec - b.atSec);
  }
  return { plan, aplicadas, descartadas };
}
