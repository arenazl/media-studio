// Pistas de música de fondo (reels Munify) — fuente única (VoiceStudio + ReelTab).
export interface MusicTrack { id: string; label: string; url: string }
const BASE = 'https://app.munify.com.ar/reels-audio';
export const MUSIC_TRACKS: MusicTrack[] = ([
  ['pop', 'Pop'], ['electro', 'Electrónica'], ['funk', 'Funk'], ['inspiradora', 'Inspiradora'],
  ['calida', 'Cálida'], ['indie', 'Indie'], ['cine', 'Cine'], ['epica', 'Épica'],
] as [string, string][]).map(([id, label]) => ({ id, label, url: `${BASE}/${id}.mp3` }));
