// Pistas de música de fondo — fuente única (VoiceStudio + ReelEditor).
// `cat` = estilo de sonido para el filtro de arriba.
//  · 8 originales: en el server de Munify (app.munify.com.ar/reels-audio).
//  · 25 nuevas: Kevin MacLeod / Incompetech (CC-BY 4.0 — crédito "Música: Kevin
//    MacLeod – incompetech.com"), hosteadas en Cloudinary (media-studio/music).
export type MusicCat = 'Enérgica' | 'Tranquila' | 'Inspiradora' | 'Cinematográfica';
export interface MusicTrack { id: string; label: string; url: string; cat: MusicCat }
export const MUSIC_CATS: MusicCat[] = ['Enérgica', 'Tranquila', 'Inspiradora', 'Cinematográfica'];

const BASE = 'https://app.munify.com.ar/reels-audio';
const BASE_TRACKS: [string, string, MusicCat][] = [
  ['pop', 'Pop', 'Enérgica'], ['electro', 'Electrónica', 'Enérgica'], ['funk', 'Funk', 'Enérgica'],
  ['inspiradora', 'Inspiradora', 'Inspiradora'], ['calida', 'Cálida', 'Tranquila'], ['indie', 'Indie', 'Tranquila'],
  ['cine', 'Cine', 'Cinematográfica'], ['epica', 'Épica', 'Cinematográfica'],
];

const CDN = 'https://res.cloudinary.com/di39tigkf/video/upload';
const CLOUD_TRACKS: [string, string, MusicCat, string][] = [
  ['carefree', 'Carefree', 'Enérgica', `${CDN}/v1781564906/media-studio/music/carefree.mp3`],
  ['funkorama', 'Funkorama', 'Enérgica', `${CDN}/v1781564983/media-studio/music/funkorama.mp3`],
  ['itty-bitty-8-bit', 'Itty Bitty 8 Bit', 'Enérgica', `${CDN}/v1781565070/media-studio/music/itty-bitty-8-bit.mp3`],
  ['monkeys-spinning-monkeys', 'Monkeys Spinning Monkeys', 'Enérgica', `${CDN}/v1781565117/media-studio/music/monkeys-spinning-monkeys.mp3`],
  ['fluffing-a-duck', 'Fluffing a Duck', 'Enérgica', `${CDN}/v1781564970/media-studio/music/fluffing-a-duck.mp3`],
  ['sneaky-snitch', 'Sneaky Snitch', 'Enérgica', `${CDN}/v1781565151/media-studio/music/sneaky-snitch.mp3`],
  ['pixelland', 'Pixelland', 'Enérgica', `${CDN}/v1781565130/media-studio/music/pixelland.mp3`],
  ['hep-cats', 'Hep Cats', 'Enérgica', `${CDN}/v1781565026/media-studio/music/hep-cats.mp3`],
  ['spazzmatica-polka', 'Spazzmatica Polka', 'Enérgica', `${CDN}/v1781565166/media-studio/music/spazzmatica-polka.mp3`],
  ['run-amok', 'Run Amok', 'Enérgica', `${CDN}/v1781565136/media-studio/music/run-amok.mp3`],
  ['wallpaper', 'Wallpaper', 'Tranquila', `${CDN}/v1781565204/media-studio/music/wallpaper.mp3`],
  ['local-forecast-elevator', 'Local Forecast', 'Tranquila', `${CDN}/v1781565108/media-studio/music/local-forecast-elevator.mp3`],
  ['lobby-time', 'Lobby Time', 'Tranquila', `${CDN}/v1781565093/media-studio/music/lobby-time.mp3`],
  ['easy-lemon', 'Easy Lemon', 'Tranquila', `${CDN}/v1781564956/media-studio/music/easy-lemon.mp3`],
  ['wholesome', 'Wholesome', 'Tranquila', `${CDN}/v1781565228/media-studio/music/wholesome.mp3`],
  ['healing', 'Healing', 'Tranquila', `${CDN}/v1781565014/media-studio/music/healing.mp3`],
  ['inspired', 'Inspired', 'Inspiradora', `${CDN}/v1781565059/media-studio/music/inspired.mp3`],
  ['heroic-age', 'Heroic Age', 'Cinematográfica', `${CDN}/v1781565030/media-studio/music/heroic-age.mp3`],
  ['the-descent', 'The Descent', 'Cinematográfica', `${CDN}/v1781565181/media-studio/music/the-descent.mp3`],
  ['volatile-reaction', 'Volatile Reaction', 'Cinematográfica', `${CDN}/v1781565190/media-studio/music/volatile-reaction.mp3`],
  ['impact-prelude', 'Impact Prelude', 'Cinematográfica', `${CDN}/v1781565042/media-studio/music/impact-prelude.mp3`],
  ['killers', 'Killers', 'Cinematográfica', `${CDN}/v1781565084/media-studio/music/killers.mp3`],
  ['crusade-heavy-industry', 'Crusade', 'Cinematográfica', `${CDN}/v1781564948/media-studio/music/crusade-heavy-industry.mp3`],
  ['five-armies', 'Five Armies', 'Cinematográfica', `${CDN}/v1781564966/media-studio/music/five-armies.mp3`],
  ['achaidh-cheide', 'Achaidh Cheide', 'Cinematográfica', `${CDN}/v1781564893/media-studio/music/achaidh-cheide.mp3`],
];

export const MUSIC_TRACKS: MusicTrack[] = [
  ...BASE_TRACKS.map(([id, label, cat]) => ({ id, label, url: `${BASE}/${id}.mp3`, cat })),
  ...CLOUD_TRACKS.map(([id, label, cat, url]) => ({ id, label, url, cat })),
];
