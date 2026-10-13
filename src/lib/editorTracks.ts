// Traduce el MONTAJE real del comercial (montajePlan.ts, ya persistido o derivable del storyboard)
// al view-model de PISTAS del editor multipista (Fase 4, docs/rediseno/HANDOFF.md §9). Puro y
// testeable — sin IA, sin red. NO inventa datos: si el comercial no tiene storyboard/montaje, cada
// pista vuelve vacía (estado honesto) en vez de rellenarse con ejemplos.
import type { Comercial } from './comercial';
import { storyboardToMontaje, sceneStarts, totalDuration, transitionDur, type MezclaPista, type MontajePlan, type MontajeState, type PistaAudio, type Transicion } from './montajePlan';
import { MUSIC_TRACKS } from './music';
import { NOMBRE_EFECTO } from './editorLibrary';

export type TrackId = 'video' | 'pantallas' | 'texto' | 'voz' | 'musica' | 'sfx' | 'fx';
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
  // WO-4: identidad de origen del clip de VIDEO — necesaria para invertir el draft a MontajePlan sin
  // adivinar. srcIn = offset dentro del archivo (= scene.in); escenaN = escena del storyboard/rodaje.
  srcIn?: number;
  escenaN?: number;
  audioGain?: number;   // WO-4: volumen del clip (video) — 0-1, persistido a scene.audioGain
  rol?: string;         // rol de la escena base (hook/desarrollo/gag/cta) — para reponerlo en la inversión
  audio?: 'keep' | 'mute';   // modo de audio de la escena (para la inversión)
  // la escena cuyo material es un MOCKUP de la app vive en la pista Mockups (separada de lo filmado), pero sigue siendo
  // una escena de la secuencia, no un inserto encima: la inversión la vuelve a meter entre las escenas por su tiempo.
  esEscena?: boolean;
  fadeIn?: number;    // segundos (menú del clip): escenas, mockups encima, voz y música
  fadeOut?: number;
}

export interface EditorTrack {
  id: TrackId;
  name: string;
  clips: EditorClip[];
  mix?: MezclaPista;   // sólo pistas con sonido (video/voz/música/sfx): volumen, mute y solo de la cabecera
}

export const PISTAS_CON_AUDIO: TrackId[] = ['video', 'voz', 'musica', 'sfx'];

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
  video: 'Video', pantallas: 'Mockups', texto: 'Texto', voz: 'Voz', musica: 'Música', sfx: 'SFX', fx: 'Efectos',
};

// fileRefs de los mockups de la app que tiene la pieza (los del paso Mockups y las tomas que salieron de ahí)
export function refsDeMockups(comercial: Comercial | undefined): Set<string> {
  return new Set([
    ...(comercial?.mockups || []).map((m) => m.fileRef),
    ...(comercial?.rodaje || []).filter((t) => t.origen === 'mockup').map((t) => t.fileRef),
  ].filter(Boolean));
}
const COLOR_MOCKUP = '#22C3E6';

const ROLE_COLOR: Record<string, string> = {
  hook: '#FFB800', desarrollo: '#7C5CFF', giro: '#FF5C8A', gag: '#FF5C8A', cta: '#00B37E', animado: '#7C5CFF',
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
// WO-4: exportada — la usa montajeFromTracks.ts para volver del kind del inspector al Transicion real.
export const TRANSITION_KIND_REP: Record<TransitionKind, Transicion> = { cut: 'cut', dissolve: 'crossfade', slide: 'wipe' };
export function transitionKindDurSec(kind: TransitionKind | undefined): number {
  return transitionDur(TRANSITION_KIND_REP[kind ?? 'cut']);
}

const trackLabel = (url: string | undefined): string | undefined => MUSIC_TRACKS.find((t) => t.url === url)?.label;

// El plan REAL a mostrar: el ya persistido en comercial.montaje, o — si todavía no se armó — el que
// se derivaría mecánicamente del storyboard (mismo cálculo que PasoMontaje "Armar"). Sin storyboard,
// no hay plan (undefined): la timeline queda vacía y lo dice.
export function resolvePlan(comercial: Comercial | undefined): MontajePlan | undefined {
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
  const mockups = refsDeMockups(comercial);
  const nombreMockup = (ref: string) => comercial?.mockups?.find((m) => m.fileRef === ref)?.nombre;
  const sceneClips: EditorClip[] = plan.scenes.map((s, i) => {
    const esMockup = !!s.src && mockups.has(s.src);
    return {
      id: `video-${s.escenaN}`,
      label: esMockup ? `Escena ${s.escenaN} · ${nombreMockup(s.src) || s.screen || 'mockup'}` : `Escena ${s.escenaN}`,
      startSec: starts[i],
      durSec: Math.max(0.1, s.out - s.in),
      color: esMockup ? COLOR_MOCKUP : roleColor(s.rol),
      fileRef: s.src || undefined,
      meta: s.rol,
      dialogo: s.dialogo,
      transitionAfter: i < plan.scenes.length - 1 ? transitionKind(s.transition) : undefined,
      // WO-4: identidad de origen para la inversión (montajeFromTracks).
      srcIn: s.in,
      escenaN: s.escenaN,
      audioGain: s.audioGain,
      rol: s.rol,
      audio: s.audio,
      ...(esMockup ? { esEscena: true } : {}),
      ...(s.fadeIn ? { fadeIn: s.fadeIn } : {}),
      ...(s.fadeOut ? { fadeOut: s.fadeOut } : {}),
    };
  });
  // lo filmado en Video; las escenas que son un mockup de la app, en la pista Mockups (Lucas, 2026-10-11)
  const videoClips = sceneClips.filter((c) => !c.esEscena);
  const escenasMockup = sceneClips.filter((c) => c.esEscena);

  // la placa final (endCard) va al cierre de la pista de video: se ve y se le ajusta la duración (el render la funde
  // sobre el último clip y dura durSec). El total del reel la incluye.
  const finClips = totalDuration(plan);
  const placaClips: EditorClip[] = plan.endCard ? [{
    id: 'placa-final',
    label: `Placa final · ${plan.endCard.linea1}`,
    startSec: finClips,
    durSec: Math.max(0.5, plan.endCard.durSec),
    color: '#00B37E',
    meta: 'placa',
  }] : [];
  // los insertos de pantalla (mockups de la app sobre una escena) en su propia pista, en el tiempo REAL del reel: el
  // mismo cálculo que el render (inicio de la escena + atSec - in)
  const insertoClips: EditorClip[] = plan.scenes.flatMap((s, i) => (s.inserts || []).map((ins, k) => ({
    id: `pantalla-${s.escenaN}-${k}`,
    label: ins.nombre || 'Pantalla',
    startSec: starts[i] + Math.max(0, ins.atSec - s.in),
    durSec: Math.max(0.3, ins.durSec),
    color: COLOR_MOCKUP,
    fileRef: ins.src || undefined,
    escenaN: s.escenaN,
    meta: ins.tarjeta,
    ...(ins.fadeIn != null ? { fadeIn: ins.fadeIn } : {}),
    ...(ins.fadeOut != null ? { fadeOut: ins.fadeOut } : {}),
  })));
  const pantallasClips = [...escenasMockup, ...insertoClips].sort((a, b) => a.startSec - b.startSec);

  const total = Math.max(0.1, finClips + (plan.endCard?.durSec || 0));

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
      durSec: Math.max(0.5, plan.voice.durSec ?? total - plan.voice.at),
      color: '#00B37E',
      fileRef: plan.voice.src,
      meta: `desde ${plan.voice.at}s`,
      ...(plan.voice.fadeIn ? { fadeIn: plan.voice.fadeIn } : {}),
      ...(plan.voice.fadeOut ? { fadeOut: plan.voice.fadeOut } : {}),
    }]
    : [];

  const musicaClips: EditorClip[] = plan.music
    ? [{
      id: 'musica-1',
      label: plan.music.generada ? 'Música a medida' : trackLabel(plan.music.src) || 'Música',
      startSec: 0,
      durSec: total,
      color: '#FFB800',
      fileRef: plan.music.src,
      meta: plan.music.duck ? 'con ducking' : 'sin ducking',
      ...(plan.music.fadeIn != null ? { fadeIn: plan.music.fadeIn } : {}),
      ...(plan.music.fadeOut != null ? { fadeOut: plan.music.fadeOut } : {}),
    }]
    : [];

  // sfx: sin fuente real en el Comercial hoy — pista vacía honesta (no hay dato que mapear).
  const sfxClips: EditorClip[] = [];

  // fx: el efecto de cada escena (lo pone una versión del montaje o se suelta desde la biblioteca); si se borra, la
  // escena queda sin efecto (montajeFromTracks)
  const fxClips: EditorClip[] = plan.scenes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !!s.effect)
    .map(({ s, i }) => ({
      id: `fx-${s.escenaN}`,
      label: NOMBRE_EFECTO[String(s.effect).replace(/^fx-/, '')] || (s.effect as string),
      startSec: starts[i],
      durSec: Math.max(0.1, s.out - s.in),
      color: '#4AA3FF',
      escenaN: s.escenaN,
      meta: String(s.effect).replace(/^fx-/, ''),
    }));

  // los acercamientos (punch-in del montajista) en la pista de efectos: se ven y, si se borran, la escena queda sin zoom
  const zoomClips: EditorClip[] = plan.scenes
    .map((s, i) => ({ s, i, desde: s.punchFrom ?? 1, hasta: s.punchTo ?? s.punchFrom ?? 1 }))
    .filter(({ desde, hasta }) => desde !== 1 || hasta !== 1)
    .map(({ s, i, desde, hasta }) => ({
      id: `zoom-${s.escenaN}`,
      label: `Acercamiento ${desde.toFixed(2)} → ${hasta.toFixed(2)}`,
      startSec: starts[i],
      durSec: Math.max(0.1, s.out - s.in),
      color: '#4AA3FF',
      escenaN: s.escenaN,
      meta: 'acercamiento',
    }));

  const mix = (id: PistaAudio) => (plan.mezcla?.[id] ? { mix: { ...plan.mezcla[id]! } } : {});
  return {
    totalSec: total,
    width: plan.width,
    height: plan.height,
    tracks: [
      { id: 'video', name: TRACK_META.video, clips: [...videoClips, ...placaClips], ...mix('video') },
      { id: 'pantallas', name: TRACK_META.pantallas, clips: pantallasClips },
      { id: 'texto', name: TRACK_META.texto, clips: textoClips },
      { id: 'voz', name: TRACK_META.voz, clips: vozClips, ...mix('voz') },
      { id: 'musica', name: TRACK_META.musica, clips: musicaClips, ...mix('musica') },
      { id: 'sfx', name: TRACK_META.sfx, clips: sfxClips, ...mix('sfx') },
      { id: 'fx', name: TRACK_META.fx, clips: [...fxClips, ...zoomClips] },
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
