// Música A MEDIDA de cada pieza (Lucas, 2026-10-12: "lo más importante es la música; es un desastre la que hay").
// La compone ElevenLabs Music en el backend (/api/musica/generar) con el clima que el guion pide para la música y la
// duración del video. El armado la usa en lugar del catálogo; si la pieza ya tiene una compuesta que alcanza para lo
// que dura, la reusa (componer cuesta y tarda unos segundos).
import { API_BASE } from '../config';
import type { Comercial } from './comercial';
import { MUSIC_GAIN, totalDuration, type MontajePlan, type MontajeState } from './montajePlan';

// lo que dura la placa de cierre más un margen, para que la música no se corte antes del final
const MARGEN_SEG = 5;

export interface MusicaCompuesta { src: string; durSec: number; mood: string }

export async function componerMusica(mood: string, durSec: number, nombre?: string): Promise<MusicaCompuesta> {
  const r = await fetch(`${API_BASE}/api/musica/generar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, durSec, nombre }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.src) throw new Error(d.error || `no se pudo componer la música (${r.status})`);
  return d as MusicaCompuesta;
}

export const moodDe = (comercial: Comercial): string => comercial.guion?.music?.mood?.trim() || '';

export function musicaDelPlan(m: MusicaCompuesta, previa?: MontajePlan['music']): NonNullable<MontajePlan['music']> {
  return { src: m.src, gain: previa?.gain ?? MUSIC_GAIN, duck: previa?.duck ?? true, fadeOut: 1.5, generada: true, durSec: m.durSec, mood: m.mood };
}

// El plan con su música compuesta: la que ya tenía la pieza si alcanza, si no una nueva. Si no se puede componer, sin
// música y con el motivo en los avisos del armado (el catálogo viejo no vuelve).
export async function conMusicaPropia(plan: MontajePlan, comercial: Comercial): Promise<MontajePlan> {
  const necesita = Math.ceil(totalDuration(plan) + MARGEN_SEG);
  const previa = (comercial.montaje as MontajeState | undefined)?.plan?.music;
  if (previa?.generada && (previa.durSec || 0) >= necesita) return { ...plan, music: { ...previa } };
  try {
    const m = await componerMusica(moodDe(comercial), necesita, comercial.titulo || comercial.formatoId);
    return { ...plan, music: musicaDelPlan(m, previa) };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    return { ...plan, music: undefined, avisos: [...(plan.avisos || []), `Sin música: ${motivo}`] };
  }
}
