// Persistencia del MONTAJE del editor por (proyecto, reel) en localStorage. Se guarda
// la disposición de los clips de cada canal (posición + ancho + referencia), NO los
// blobs de audio (los objectURL del TTS se regeneran on-demand al reproducir). Así el
// usuario retoma el montaje donde lo dejó. La lógica pura (snapshot/empty) es testeable.
import type { SlideClip, PhraseClip, RefClip, TextClip } from './reelTimeline';

export interface MontageSnapshot {
  slides: SlideClip[];
  audios: PhraseClip[];      // p + x + w (el audio de la frase se regenera al reproducir)
  music: RefClip[];
  videos: RefClip[];
  transitions: RefClip[];
  effects: RefClip[];
  texts: TextClip[];
}

export interface MontageTracks {
  slideTrack: SlideClip[]; audioTrack: PhraseClip[]; musicTrack: RefClip[];
  videoTrack: RefClip[]; transitionTrack: RefClip[]; effectTrack: RefClip[]; textTrack: TextClip[];
}

// snapshot serializable: redondea px (evita ruido de sub-píxel del drag) y descarta
// cualquier campo de runtime — los clips ya son planos.
export function buildSnapshot(t: MontageTracks): MontageSnapshot {
  const round = <C extends { x: number; w: number }>(c: C): C => ({ ...c, x: Math.round(c.x), w: Math.round(c.w) });
  return {
    slides: t.slideTrack.map(round),
    audios: t.audioTrack.map(round),
    music: t.musicTrack.map(round),
    videos: t.videoTrack.map(round),
    transitions: t.transitionTrack.map(round),
    effects: t.effectTrack.map(round),
    texts: t.textTrack.map(round),
  };
}

export function isEmptySnapshot(s: MontageSnapshot): boolean {
  return !s.slides.length && !s.audios.length && !s.music.length && !s.videos.length
    && !s.transitions.length && !s.effects.length && !s.texts.length;
}

const key = (projectId: string, reelId: string) => `ms.montage.${projectId}.${reelId}`;

export function saveMontage(projectId: string, reelId: string, snap: MontageSnapshot): void {
  if (!reelId) return;
  try {
    if (isEmptySnapshot(snap)) localStorage.removeItem(key(projectId, reelId));
    else localStorage.setItem(key(projectId, reelId), JSON.stringify(snap));
  } catch { /* noop */ }
}

export function loadMontage(projectId: string, reelId: string): MontageSnapshot | null {
  if (!reelId) return null;
  try { const raw = localStorage.getItem(key(projectId, reelId)); if (raw) return JSON.parse(raw) as MontageSnapshot; } catch { /* noop */ }
  return null;
}
