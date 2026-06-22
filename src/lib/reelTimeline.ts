// Lógica PURA del timeline del editor de reel (sin React/DOM) → unit-testeable.
// El editor (ReelEditor.tsx) sólo orquesta estado + UI; los cálculos viven acá.
import type { ScheduledClip } from './montageAudio';

export const PX_PER_SEC = 80;     // ESCALA timeline↔audio: 1s = 80px
export const GAP = 6;             // separación entre clips
export const MIN_W = 24;          // ancho mínimo de un clip
export const SLIDE_SEC = 2.5;     // duración default de una animación
export const DEF_PHRASE_SEC = 1.6;// ancho de frase antes de saber la duración real
export const DEF_VIDEO_SEC = 3;   // ancho default de un video sin metadata
export const DEF_MUSIC_SEC = 8;   // ancho mínimo de un bed de música
export const MUSIC_GAIN = 0.5;    // volumen base de la música

export const secToPx = (s: number) => Math.max(MIN_W, s * PX_PER_SEC);
export const pxToSec = (px: number) => px / PX_PER_SEC;

export interface Clip { x: number; w: number }
export interface SlideClip extends Clip { s: number }
export interface RefClip extends Clip { id: string }
export interface PhraseClip extends Clip { p: number }
export interface PhraseAudio { url: string; dur: number; peaks: number[]; offset?: number } // offset: arranque (s) dentro del archivo (audio real recortado)
export type TrackKind = 'slide' | 'video' | 'music' | 'audio' | 'transition' | 'effect' | 'text';

// ── Transiciones (entre clips) y Efectos (rango) ─────────────────────────────
export interface FxPreset { id: string; label: string }
export const TRANSITIONS: FxPreset[] = [
  { id: 'cut', label: 'Corte' },
  { id: 'fade', label: 'Fundido' },
  { id: 'crossfade', label: 'Crossfade' },
  { id: 'wipe', label: 'Wipe' },
  { id: 'zoom', label: 'Zoom' },
];
export const EFFECTS: FxPreset[] = [
  { id: 'kenburns', label: 'Ken Burns' },
  { id: 'vignette', label: 'Viñeta' },
  { id: 'grain', label: 'Grano' },
  { id: 'glow', label: 'Glow' },
  { id: 'bw', label: 'B&N' },
];
export const TRANSITION_SEC = 0.6;   // duración default de una transición
export const EFFECT_SEC = 4;         // ancho default de un efecto

// efecto activo en el playhead: el clip que cubre px y arranca más a la derecha
// (el último aplicado gana). Devuelve su tipo (id) o null.
export function effectAtPx(clips: { id: string; x: number; w: number }[], px: number): string | null {
  let best: string | null = null; let bestX = -1;
  for (const c of clips) {
    if (px >= c.x && px < c.x + c.w && c.x >= bestX) { best = c.id; bestX = c.x; }
  }
  return best;
}

// clase CSS del efecto para el preview (vacío si no hay / desconocido).
export function effectClass(type: string | null): string {
  if (!type || !EFFECTS.some((e) => e.id === type)) return '';
  return `rt-fx--${type}`;
}

// etiqueta legible de un preset por id (transición o efecto).
export function presetLabel(presets: FxPreset[], id: string): string {
  return presets.find((p) => p.id === id)?.label ?? id;
}

// ── Texto / Títulos ──────────────────────────────────────────────────────────
export interface TextClip extends Clip { id: string; preset: string; text: string }
export const TEXT_PRESETS: FxPreset[] = [
  { id: 'title', label: 'Título' },
  { id: 'lower', label: 'Lower-third' },
  { id: 'cta', label: 'CTA' },
  { id: 'subtitle', label: 'Subtítulo' },
];
export const TEXT_SEC = 3;   // duración default de un texto
export const DEFAULT_TEXT_FOR: Record<string, string> = {
  title: 'Tu título acá',
  lower: 'Nombre · Cargo',
  cta: 'Probalo gratis',
  subtitle: 'Subtítulo o aclaración',
};

// clips de texto activos en el playhead (puede haber varios superpuestos).
export function textsAtPx<T extends { x: number; w: number }>(clips: T[], px: number): T[] {
  return clips.filter((c) => px >= c.x && px < c.x + c.w);
}

// clase CSS de posición/estilo según el preset de texto.
export function textPresetClass(preset: string): string {
  return TEXT_PRESETS.some((p) => p.id === preset) ? `rt-txt--${preset}` : 'rt-txt--title';
}

// duración total del montaje (s) = fin del clip más a la derecha de CUALQUIER track.
export function masterSecOf(tracks: Clip[][]): number {
  let maxEnd = 1;
  for (const t of tracks) for (const c of t) maxEnd = Math.max(maxEnd, c.x + c.w);
  return maxEnd / PX_PER_SEC;
}

// marcas de la regla de tiempo (s), cada `step` según la densidad del montaje.
export function rulerTicks(masterSec: number): number[] {
  const step = masterSec <= 8 ? 1 : masterSec <= 20 ? 2 : masterSec <= 45 ? 5 : 10;
  const ticks: number[] = [];
  for (let t = 0; t <= masterSec + 1e-3; t += step) ticks.push(Math.round(t * 10) / 10);
  return ticks;
}

// x del próximo clip: al final del último + GAP (o 0 si el track está vacío).
export function appendX(clips: Clip[]): number {
  if (!clips.length) return 0;
  const end = clips.reduce((m, c) => Math.max(m, c.x + c.w), 0);
  return end + GAP;
}

// re-secuencia un track a-escala: cada clip arranca donde termina el anterior, con
// ancho = duración real (durOf). Mantiene el orden por x. No muta la entrada.
export function reflow<T extends Clip>(clips: T[], durOf: (c: T) => number): T[] {
  let x = 0;
  return [...clips].sort((a, b) => a.x - b.x).map((c) => {
    const w = secToPx(durOf(c));
    const nc = { ...c, x, w };
    x += w + GAP;
    return nc;
  });
}

export interface PlanInput {
  audioTrack: PhraseClip[];
  phraseAudio: Record<number, PhraseAudio>;
  musicTrack: RefClip[];
  videoTrack: RefClip[];
  musicUrlOf: (id: string) => string | undefined;
  videoUrlOf: (id: string) => string | undefined;
  muted: Set<TrackKind>;
}

// plan del montaje: todos los tracks → clips agendados (tiempos absolutos en s) para
// el motor de audio. Un clip de voz sólo entra si su frase ya tiene audio generado.
export function buildPlan(inp: PlanInput): ScheduledClip[] {
  const { audioTrack, phraseAudio, musicTrack, videoTrack, musicUrlOf, videoUrlOf, muted } = inp;
  const plan: ScheduledClip[] = [];
  if (!muted.has('audio')) for (const c of audioTrack) {
    const pa = phraseAudio[c.p]; if (!pa) continue;
    const dur = Math.min(pxToSec(c.w), pa.dur);
    if (dur > 0.02) plan.push({ key: `a${c.p}-${Math.round(c.x)}`, url: pa.url, kind: 'voice', at: pxToSec(c.x), offset: pa.offset ?? 0, dur, gain: 1 });
  }
  if (!muted.has('music')) for (const c of musicTrack) {
    const url = musicUrlOf(c.id); if (!url) continue;
    plan.push({ key: `m${c.id}-${Math.round(c.x)}`, url, kind: 'music', at: pxToSec(c.x), offset: 0, dur: pxToSec(c.w), gain: MUSIC_GAIN, loop: true, duck: true });
  }
  if (!muted.has('video')) for (const c of videoTrack) {
    const url = videoUrlOf(c.id); if (!url) continue;
    plan.push({ key: `v${c.id}-${Math.round(c.x)}`, url, kind: 'video', at: pxToSec(c.x), offset: 0, dur: pxToSec(c.w), gain: 1 });
  }
  return plan;
}
