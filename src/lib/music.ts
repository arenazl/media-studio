// Pistas de música de fondo (reels Munify) — fuente única (VoiceStudio + ReelTab).
// `cat` = estilo de sonido para el filtro de arriba.
export type MusicCat = 'Enérgica' | 'Tranquila' | 'Inspiradora' | 'Cinematográfica';
export interface MusicTrack { id: string; label: string; url: string; cat: MusicCat }
const BASE = 'https://app.munify.com.ar/reels-audio';
export const MUSIC_CATS: MusicCat[] = ['Enérgica', 'Tranquila', 'Inspiradora', 'Cinematográfica'];
export const MUSIC_TRACKS: MusicTrack[] = ([
  ['pop', 'Pop', 'Enérgica'], ['electro', 'Electrónica', 'Enérgica'], ['funk', 'Funk', 'Enérgica'],
  ['inspiradora', 'Inspiradora', 'Inspiradora'], ['calida', 'Cálida', 'Tranquila'], ['indie', 'Indie', 'Tranquila'],
  ['cine', 'Cine', 'Cinematográfica'], ['epica', 'Épica', 'Cinematográfica'],
] as [string, string, MusicCat][]).map(([id, label, cat]) => ({ id, label, url: `${BASE}/${id}.mp3`, cat }));
