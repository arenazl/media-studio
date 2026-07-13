// El PLAN SEMÁNTICO del montaje (Fase 4): en SEGUNDOS y POR ESCENA — el shape único que entienden
// el preview y el render (mata la incompatibilidad de los 3 sistemas viejos). Origen: docs/07-rework/05.
// Puro y testeable (sin IA, sin ffmpeg). El render (server/renderComercial.mjs) duplica la derivación
// de tiempos porque no puede importar TS del front (anotado allá).
import type { Comercial } from './comercial';
import { getFormato } from './formato';
import { MUSIC_TRACKS, type MusicCat } from './music';

export type Transicion = 'cut' | 'fade' | 'crossfade' | 'wipe' | 'zoom';

export interface MontajeScene {
  escenaN: number;
  src: string;                 // fileRef RELATIVO de la toma activa (public_id de saveAsset)
  in: number; out: number;     // trim dentro del clip crudo
  audio: 'keep' | 'mute';      // keep = mezcla el diálogo lip-synced del clip; mute = b-roll sucio
  audioGain?: number;
  transition?: Transicion;     // hacia la escena SIGUIENTE
  effect?: string;
  rol?: string;                // para la UI (badge)
  dialogo?: string;            // para la UI + derivación de ducking
}

export interface MontajePlan {
  width: number; height: number; fps: number;
  scenes: MontajeScene[];
  voice?: { src: string; at: number };
  music?: { src: string; gain: number; duck: boolean };
  silences: { antesDeEscena: number; durSec: number }[];   // anclados a escena; from/to se derivan
  texts: { text: string; preset: string; at: number; dur: number; nx?: number; ny?: number }[];
  logo?: { src: string };
}

export interface MontajeState { plan: MontajePlan; exports: { fileRef: string; createdAt: number }[] }

export const DUCK_GAIN = 0.4;              // igual que el preview (montageAudio.ts)
const SILENCE_ANTES_GAG = 0.8;            // el "toque final" del workflow de referencia
const MUSIC_GAIN = 0.28;
const CUT_DUR = 0.03;                      // "corte" = xfade mínimo (uniforma la cadena xfade)
const XFADE_DUR = 0.4;

export function transitionDur(tr?: Transicion): number {
  return !tr || tr === 'cut' ? CUT_DUR : XFADE_DUR;
}

// toma ACTIVA de una escena = la última importada para esa escena (ver PasoRodaje).
function tomaActiva(comercial: Comercial, escenaN: number) {
  const ts = (comercial.rodaje || []).filter((t) => t.escenaN === escenaN);
  return ts[ts.length - 1];
}

// preselección de música: keyword del mood del guion → categoría → primer track de esa cat.
export function pickMusic(mood: string | undefined): string | undefined {
  if (!mood) return undefined;
  const m = mood.toLowerCase();
  const cat: MusicCat | undefined =
    /energ|pop|upbeat|divert|alegr|ritmo|fiesta|electr|funk|dinám|dinam/.test(m) ? 'Enérgica'
      : /tranqui|calm|suave|relaj|c[aá]lid|amable|chill/.test(m) ? 'Tranquila'
        : /inspir|emot|motiv|esperanz|superac/.test(m) ? 'Inspiradora'
          : /[eé]pic|cine|dram[aá]|intens|solemn|grave|tensi[oó]n/.test(m) ? 'Cinematográfica'
            : undefined;
  if (!cat) return undefined;
  return MUSIC_TRACKS.find((t) => t.cat === cat)?.url;
}

// mapper mecánico storyboard(animado) → slides del reel animado (mockupReel). El molde storyboard
// ya generó escenas orientadas a pantalla (screen + accion=título + continuidad=palabra a resaltar).
export function escenasToSlides(comercial: Comercial): { badge: string; title: string; accent: string; durSec: number }[] {
  return (comercial.storyboard || []).map((e) => ({
    badge: e.screen || e.rol || '',
    title: e.accion || '',
    accent: e.continuidad || '',
    durSec: e.durSec || 4,
  }));
}

// Dimensiones/fps del plan a partir del formato del comercial (WO-3). Sin formato → 9:16 30fps (el
// default histórico — byte-comparable a los planes viejos).
function dimsDeComercial(comercial: Comercial): { width: number; height: number; fps: number } {
  const f = getFormato(comercial.formatoId);
  return f ? { width: f.dims.width, height: f.dims.height, fps: f.fps } : { width: 1080, height: 1920, fps: 30 };
}

// MontajePlan inicial desde el storyboard + las tomas importadas (filmado) o el render (animado).
export function storyboardToMontaje(comercial: Comercial): MontajePlan {
  const escenas = comercial.storyboard || [];
  const dims = dimsDeComercial(comercial);
  // ANIMADO: el reel ya está renderizado (comercial.renderRef); el montaje le pone voz + música.
  if (comercial.tipo === 'animado') {
    const total = escenas.reduce((s, e) => s + (e.durSec || 4), 0) || 8;
    const scenes: MontajeScene[] = comercial.renderRef
      ? [{ escenaN: 1, src: comercial.renderRef, in: 0, out: total, audio: 'mute', audioGain: 1, transition: 'cut', rol: 'animado' }]
      : [];
    const musicUrl = pickMusic(comercial.guion?.music?.mood);
    return {
      width: dims.width, height: dims.height, fps: dims.fps, scenes,
      music: musicUrl ? { src: musicUrl, gain: MUSIC_GAIN, duck: true } : undefined,
      silences: [], texts: [],
    };
  }
  const scenes: MontajeScene[] = escenas.map((e, i) => {
    const toma = tomaActiva(comercial, e.n);
    const realDur = toma?.durSec || 0;
    const out = realDur > 0 ? Math.min(e.durSec, realDur) : e.durSec;
    const tieneDialogo = !!(e.dialogo && e.dialogo.trim());
    const proxEsCta = i < escenas.length - 1 && escenas[i + 1].rol === 'cta';
    return {
      escenaN: e.n,
      src: toma?.fileRef || '',
      in: 0,
      out,
      audio: tieneDialogo ? 'keep' : 'mute',
      audioGain: 1,
      transition: proxEsCta ? 'fade' : 'cut',
      rol: e.rol,
      dialogo: e.dialogo,
    };
  });
  const gag = escenas.find((e) => e.rol === 'gag');
  const silences = gag ? [{ antesDeEscena: gag.n, durSec: SILENCE_ANTES_GAG }] : [];
  const musicUrl = pickMusic(comercial.guion?.music?.mood);
  return {
    width: dims.width, height: dims.height, fps: dims.fps,
    scenes,
    music: musicUrl ? { src: musicUrl, gain: MUSIC_GAIN, duck: true } : undefined,
    silences,
    texts: [],
  };
}

// inicio ABSOLUTO de cada escena en el timeline final (acumula dur - transición, como el xfade).
export function sceneStarts(plan: MontajePlan): number[] {
  const starts: number[] = [];
  let t = 0;
  plan.scenes.forEach((s, i) => {
    starts.push(t);
    const dur = Math.max(0, s.out - s.in);
    t += dur - (i < plan.scenes.length - 1 ? transitionDur(s.transition) : 0);
  });
  return starts;
}

export function totalDuration(plan: MontajePlan): number {
  return plan.scenes.reduce((t, s, i) => {
    const dur = Math.max(0, s.out - s.in);
    return t + dur - (i < plan.scenes.length - 1 ? transitionDur(s.transition) : 0);
  }, 0);
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].filter((r) => r[1] > r[0]).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

// rangos de ducking de la música: baja bajo el diálogo de escenas 'keep' Y bajo la voz en off.
// (para la voz, si no se pasa su duración, se asume hasta el final del comercial — el render la mide).
export function duckRanges(plan: MontajePlan, voiceDur?: number): [number, number][] {
  const starts = sceneStarts(plan);
  const ranges: [number, number][] = [];
  plan.scenes.forEach((s, i) => {
    if (s.audio === 'keep' && s.dialogo && s.dialogo.trim()) {
      ranges.push([starts[i], starts[i] + Math.max(0, s.out - s.in)]);
    }
  });
  if (plan.voice) {
    const end = voiceDur != null ? plan.voice.at + voiceDur : totalDuration(plan);
    ranges.push([plan.voice.at, end]);
  }
  return mergeRanges(ranges);
}

// silencios estratégicos: from = inicio de la escena `antesDeEscena` menos durSec; to = ese inicio.
export function silenceRanges(plan: MontajePlan): [number, number][] {
  const starts = sceneStarts(plan);
  const startDe = new Map(plan.scenes.map((s, i) => [s.escenaN, starts[i]]));
  const out: [number, number][] = [];
  for (const sil of plan.silences || []) {
    const start = startDe.get(sil.antesDeEscena);
    if (start == null) continue;
    out.push([Math.max(0, start - sil.durSec), start]);
  }
  return out;
}
