// Mezcla offline de voz + música y codificación a mp3 — 100% cliente.
// La usa VoiceStudio al exportar con el tilde "música" activo.
//  · La música arranca en t=0 a volumen pleno (el del slider, sin ducking).
//  · Cuando termina la voz, la música hace un fade out lineal de `fadeTailSec`.
//  · Duración del mp3 = duración de la voz + fadeTailSec (cola).
//  · Si la pista es más corta que esa duración, se loopea para cubrirla.
import { Mp3Encoder } from '@breezystack/lamejs';

export interface MixOptions {
  voiceBlob: Blob;       // mp3 de voz ya generado (blob local, sin CORS)
  musicUrl: string;      // URL de la pista elegida (debe permitir CORS para decodificar)
  voiceVol: number;      // 0..1
  musicVol: number;      // 0..1
  fadeTailSec?: number;  // cola de fade tras la voz (default 3)
  kbps?: number;         // bitrate del mp3 de salida (default 192)
}

// Render forzado a 44.1 kHz: sample rate válido para mp3 y estándar de salida.
const OUT_SR = 44100;
const MP3_BLOCK = 1152; // tamaño de frame que espera lamejs

// decodifica un ArrayBuffer a AudioBuffer resampleado a OUT_SR (sin abrir un
// AudioContext real: OfflineAudioContext.decodeAudioData ya resamplea al sr del ctx).
async function decode(data: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, 1, OUT_SR);
  return await ctx.decodeAudioData(data);
}

export async function exportVoiceWithMusic(opts: MixOptions): Promise<Blob> {
  const { voiceBlob, musicUrl, voiceVol, musicVol, fadeTailSec = 3, kbps = 192 } = opts;

  const voiceBuf = await decode(await voiceBlob.arrayBuffer());
  // fetch de la música — si la fuente no manda CORS, esto tira TypeError ("Failed
  // to fetch"); el caller lo traduce a un aviso de "pista no mezclable".
  const res = await fetch(musicUrl, { mode: 'cors' });
  if (!res.ok) throw new Error(`music HTTP ${res.status}`);
  const musicBuf = await decode(await res.arrayBuffer());

  const totalSec = voiceBuf.duration + fadeTailSec;
  const length = Math.ceil(totalSec * OUT_SR);
  const off = new OfflineAudioContext(2, length, OUT_SR);

  // voz → gain (voiceVol) → salida
  const vSrc = off.createBufferSource(); vSrc.buffer = voiceBuf;
  const vGain = off.createGain(); vGain.gain.value = voiceVol;
  vSrc.connect(vGain).connect(off.destination);
  vSrc.start(0);

  // música (loop) → gain pleno hasta el fin de la voz, luego fade lineal a 0
  const mSrc = off.createBufferSource(); mSrc.buffer = musicBuf; mSrc.loop = true;
  const mGain = off.createGain();
  const fadeStart = voiceBuf.duration;
  mGain.gain.setValueAtTime(musicVol, 0);
  mGain.gain.setValueAtTime(musicVol, fadeStart);
  mGain.gain.linearRampToValueAtTime(0, fadeStart + fadeTailSec);
  mSrc.connect(mGain).connect(off.destination);
  mSrc.start(0);
  mSrc.stop(totalSec);

  const mixed = await off.startRendering();
  return encodeMp3(mixed, kbps);
}

function encodeMp3(buf: AudioBuffer, kbps: number): Blob {
  const channels = Math.min(2, buf.numberOfChannels);
  const enc = new Mp3Encoder(channels, buf.sampleRate, kbps);
  const left = floatToInt16(buf.getChannelData(0));
  const right = channels > 1 ? floatToInt16(buf.getChannelData(1)) : left;

  const chunks: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += MP3_BLOCK) {
    const l = left.subarray(i, i + MP3_BLOCK);
    const data = channels > 1
      ? enc.encodeBuffer(l, right.subarray(i, i + MP3_BLOCK))
      : enc.encodeBuffer(l);
    if (data.length) chunks.push(data);
  }
  const end = enc.flush();
  if (end.length) chunks.push(end);
  return new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
}

function floatToInt16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}
