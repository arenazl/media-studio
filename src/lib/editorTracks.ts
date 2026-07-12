// Traduce el MONTAJE real del comercial (montajePlan.ts, ya persistido o derivable del storyboard)
// al view-model de PISTAS del editor multipista (Fase 4, docs/rediseno/HANDOFF.md §9). Puro y
// testeable — sin IA, sin red. NO inventa datos: si el comercial no tiene storyboard/montaje, cada
// pista vuelve vacía (estado honesto) en vez de rellenarse con ejemplos.
import type { Comercial } from './comercial';
import { storyboardToMontaje, sceneStarts, totalDuration, transitionDur, type MontajePlan, type MontajeState, type Transicion } from './montajePlan';
import { MUSIC_TRACKS } from './music';

export type TrackId = 'video' | 'texto' | 'voz' | 'musica' | 'sfx' | 'fx';
export type TransitionKind = 'cut' | 'dissolve' | 'slide';

export interface EditorClip {
  id: string;
  label: string;
  startSec: number;
  durSec: number;
  color: string;
  fileRef?: string;         // asset real (server/storage) — si lo hay, la pista puede mostrar el clip real
  meta?: string;
  dialogo?: string;
  transitionAfter?: TransitionKind;   // sólo tiene sentido en 'video': marcador hacia el SIGUIENTE clip
  nx?: number;   // sólo 'texto': posición normalizada (0-1) — real, viene de MontajeText.nx/ny
  ny?: number;
}

export interface EditorTrack {
  id: TrackId;
  name: string;
  clips: EditorClip[];
}

export interface EditorTimeline {
  tracks: EditorTrack[];
  totalSec: number;   // duración total del comercial según el plan (0 si no hay nada armado todavía)
  width: number;
  height: number;
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

// Aspecto legible (ej. "9:16") a partir del ancho/alto REAL del plan — nunca un valor inventado; sin
// plan (proyecto recién creado) cae al default vertical del estudio (9:16, ver HANDOFF §1/§8).
export function aspectLabel(width: number, height: number): string {
  if (!width || !height) return '9:16';
  const d = gcd(width, height) || 1;
  return `${width / d}:${height / d}`;
}

const TRACK_META: Record<TrackId, string> = {
  video: 'Video', texto: 'Texto', voz: 'Voz', musica: 'Música', sfx: 'SFX', fx: 'Efectos',
};

const ROLE_COLOR: Record<string, string> = {
  hook: '#FFB800', desarrollo: '#7C5CFF', gag: '#FF5C8A', cta: '#00B37E', animado: '#7C5CFF',
};
export const roleColor = (rol?: string): string => (rol && ROLE_COLOR[rol]) || '#4AA3FF';

// mapea el enum real (montajePlan.ts) a los 3 tipos que distingue el inspector (docs/rediseno
// HANDOFF §9 / prototipo): disolvencia cruzada, corte directo, deslizar.
export function transitionKind(t: Transicion | undefined): TransitionKind {
  if (!t || t === 'cut') return 'cut';
  if (t === 'wipe') return 'slide';
  return 'dissolve';   // fade | crossfade | zoom → visualmente "disolvencia"
}

// El render (renderComercial.mjs / montajePlan.ts) sólo conoce 2 duraciones reales: corte (xfade
// mínimo) o disolvencia (xfade completo) — transitionDur() ya lo resuelve así. Se reusa esa MISMA
// función (representando cada kind del inspector con un Transicion real) en vez de inventar un
// tercer número para "slide": el inspector muestra la duración REAL, no una granularidad que no existe.
const TRANSITION_KIND_REP: Record<TransitionKind, Transicion> = { cut: 'cut', dissolve: 'crossfade', slide: 'wipe' };
export function transitionKindDurSec(kind: TransitionKind | undefined): number {
  return transitionDur(TRANSITION_KIND_REP[kind ?? 'cut']);
}

const trackLabel = (url: string | undefined): string | undefined => MUSIC_TRACKS.find((t) => t.url === url)?.label;

// El plan REAL a mostrar: el ya persistido en comercial.montaje, o — si todavía no se armó — el que
// se derivaría mecánicamente del storyboard (mismo cálculo que PasoMontaje "Armar"). Sin storyboard,
// no hay plan (undefined): la timeline queda vacía y lo dice.
function resolvePlan(comercial: Comercial | undefined): MontajePlan | undefined {
  if (!comercial) return undefined;
  const persisted = (comercial.montaje as MontajeState | undefined)?.plan;
  if (persisted) return persisted;
  return comercial.storyboard?.length ? storyboardToMontaje(comercial) : undefined;
}

// Construye las 6 pistas del editor a partir del plan resuelto. Siempre devuelve las 6 (algunas
// vacías): el usuario ve qué pistas EXISTEN aunque no tengan contenido todavía (estado vacío honesto).
export function buildEditorTimeline(comercial: Comercial | undefined): EditorTimeline {
  const plan = resolvePlan(comercial);
  const empty: EditorTrack[] = (Object.keys(TRACK_META) as TrackId[]).map((id) => ({ id, name: TRACK_META[id], clips: [] }));
  if (!plan) return { tracks: empty, totalSec: 0, width: 1080, height: 1920 };

  const starts = sceneStarts(plan);
  const videoClips: EditorClip[] = plan.scenes.map((s, i) => ({
    id: `video-${s.escenaN}`,
    label: `Escena ${s.escenaN}`,
    startSec: starts[i],
    durSec: Math.max(0.1, s.out - s.in),
    color: roleColor(s.rol),
    fileRef: s.src || undefined,
    meta: s.rol,
    dialogo: s.dialogo,
    transitionAfter: i < plan.scenes.length - 1 ? transitionKind(s.transition) : undefined,
  }));

  const total = Math.max(0.1, totalDuration(plan));

  const textoClips: EditorClip[] = (plan.texts || []).map((t, i) => ({
    id: `texto-${i}`,
    label: t.text,
    startSec: t.at,
    durSec: Math.max(0.3, t.dur),
    color: '#F5F1E8',
    meta: t.preset,
    nx: t.nx,
    ny: t.ny,
  }));

  const vozClips: EditorClip[] = plan.voice
    ? [{
      id: 'voz-1',
      label: 'Voz en off',
      startSec: plan.voice.at,
      durSec: Math.max(0.5, total - plan.voice.at),
      color: '#00B37E',
      fileRef: plan.voice.src,
      meta: `desde ${plan.voice.at}s`,
    }]
    : [];

  const musicaClips: EditorClip[] = plan.music
    ? [{
      id: 'musica-1',
      label: trackLabel(plan.music.src) || 'Música',
      startSec: 0,
      durSec: total,
      color: '#FFB800',
      fileRef: plan.music.src,
      meta: plan.music.duck ? 'con ducking' : 'sin ducking',
    }]
    : [];

  // sfx: sin fuente real en el Comercial hoy — pista vacía honesta (no hay dato que mapear).
  const sfxClips: EditorClip[] = [];

  // fx: sólo las escenas que ya tengan un `effect` propio asignado (campo real de MontajeScene,
  // hoy sin generador que lo pueble — vacío hasta que algo lo escriba).
  const fxClips: EditorClip[] = plan.scenes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !!s.effect)
    .map(({ s, i }) => ({
      id: `fx-${s.escenaN}`,
      label: s.effect as string,
      startSec: starts[i],
      durSec: Math.max(0.1, s.out - s.in),
      color: '#4AA3FF',
    }));

  return {
    totalSec: total,
    width: plan.width,
    height: plan.height,
    tracks: [
      { id: 'video', name: TRACK_META.video, clips: videoClips },
      { id: 'texto', name: TRACK_META.texto, clips: textoClips },
      { id: 'voz', name: TRACK_META.voz, clips: vozClips },
      { id: 'musica', name: TRACK_META.musica, clips: musicaClips },
      { id: 'sfx', name: TRACK_META.sfx, clips: sfxClips },
      { id: 'fx', name: TRACK_META.fx, clips: fxClips },
    ],
  };
}

// Ubica un clip por id en el set de pistas (para selección/edición). Devuelve también su pista e índice.
export function findClip(tracks: EditorTrack[], clipId: string | null | undefined): { track: EditorTrack; clip: EditorClip; index: number } | null {
  if (!clipId) return null;
  for (const track of tracks) {
    const index = track.clips.findIndex((c) => c.id === clipId);
    if (index !== -1) return { track, clip: track.clips[index], index };
  }
  return null;
}

// clip de VIDEO activo en un instante dado (para el preview compuesto): el que cubre playheadSec.
export function clipAt(track: EditorTrack | undefined, sec: number): EditorClip | undefined {
  if (!track) return undefined;
  return track.clips.find((c) => sec >= c.startSec && sec < c.startSec + c.durSec);
}

// todos los clips de una pista activos en un instante (para overlays de texto, que pueden solaparse).
export function clipsAt(track: EditorTrack | undefined, sec: number): EditorClip[] {
  if (!track) return [];
  return track.clips.filter((c) => sec >= c.startSec && sec < c.startSec + c.durSec);
}
