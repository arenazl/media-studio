// Motor de audio del MONTAJE (Web Audio). UN solo AudioContext arma la línea de
// tiempo del reel: chunks de voz + música + audio de videos, agendados por su
// posición. Editar la timeline (mover / cortar / reordenar / insertar) = volver a
// agendar EN VIVO desde la posición actual. El reloj es ctx.currentTime (sin
// glitches, sin el parche de seek por chunk del editor viejo).
//
// Es agnóstico de la UI: recibe clips con tiempos ABSOLUTOS en segundos. El editor
// convierte sus clips en px a segundos (px / PX_PER_SEC) y se los pasa.

export type SourceKind = 'voice' | 'music' | 'video';

export interface ScheduledClip {
  key: string;        // identidad estable del clip (para diff / debug)
  url: string;        // fuente a decodificar (blob de voz · mp3 de música · mp4 con audio)
  kind: SourceKind;
  at: number;         // inicio en la timeline del montaje (s)
  offset: number;     // desde qué punto del buffer fuente arranca (s)
  dur: number;        // cuánto suena del buffer (s)
  gain?: number;      // volumen base (música suele ir más bajo)
  loop?: boolean;     // música: loopea para rellenar su tramo
  duck?: boolean;     // música: baja sola mientras suena la voz
}

const DUCK_GAIN = 0.4;   // a cuánto baja la música bajo la voz
const RAMP = 0.12;       // segundos de fade del ducking (suave, sin clicks)

export class MontageAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private active: AudioBufferSourceNode[] = [];
  private bufCache = new Map<string, Promise<AudioBuffer>>();
  private t0 = 0;          // ctx.currentTime cuando arrancó la reproducción
  private from = 0;        // posición del playhead (s) al arrancar
  private dur = 0;         // duración total del último plan reproducido
  private _playing = false;
  private endTimer: number | null = null;
  onEnded: (() => void) | null = null;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  get playing() { return this._playing; }

  // Decodifica una URL a AudioBuffer (cacheado). Voz = blob (sin CORS); música y
  // video = remoto (Cloudinary manda CORS *). decodeAudioData saca la pista de
  // audio del mp4. Si una fuente falla, devuelve null y el clip queda mudo.
  async load(url: string): Promise<AudioBuffer | null> {
    let p = this.bufCache.get(url);
    if (!p) {
      const ctx = this.ensure();
      p = fetch(url).then((r) => r.arrayBuffer()).then((a) => ctx.decodeAudioData(a));
      // dejar el valor resuelto legible sincrónico (lo usa play() vía bufCacheSync).
      p.then((buf) => this.markResolved(url, buf)).catch(() => {});
      this.bufCache.set(url, p);
    }
    try { return await p; } catch { this.bufCache.delete(url); return null; }
  }

  // Peaks normalizados (0..1) de una fuente, para dibujar la onda real. n = barras.
  async peaks(url: string, n = 260): Promise<number[] | null> {
    const buf = await this.load(url);
    if (!buf) return null;
    return MontageAudio.peaksFromBuffer(buf, n);
  }

  static peaksFromBuffer(buf: AudioBuffer, n = 260): number[] {
    const ch = buf.getChannelData(0);
    const step = Math.max(1, Math.floor(ch.length / n));
    const pk: number[] = [];
    for (let i = 0; i < n; i++) {
      let m = 0;
      for (let j = 0; j < step; j++) { const v = Math.abs(ch[i * step + j] || 0); if (v > m) m = v; }
      pk.push(m);
    }
    const mx = Math.max(...pk, 0.001);
    return pk.map((v) => v / mx);
  }

  static durationOf(clips: ScheduledClip[]): number {
    return clips.reduce((m, c) => Math.max(m, c.at + c.dur), 0);
  }

  // Pre-decodifica todas las fuentes del plan (para que play() arranque sin esperas).
  async prime(clips: ScheduledClip[]): Promise<void> {
    await Promise.all([...new Set(clips.map((c) => c.url))].map((u) => this.load(u)));
  }

  // Reproduce el plan desde `fromSec`. Agenda cada clip en su tiempo absoluto.
  // Las fuentes ya tienen que estar decodificadas (llamar prime() antes).
  play(clips: ScheduledClip[], fromSec = 0): void {
    const ctx = this.ensure();
    ctx.resume();
    this.stopSources();
    this.dur = MontageAudio.durationOf(clips);
    this.from = Math.max(0, Math.min(fromSec, this.dur));
    this.t0 = ctx.currentTime;
    this._playing = true;

    // intervalos de voz (para el ducking de música), en tiempo de montaje.
    const voiceIv = clips
      .filter((c) => c.kind === 'voice')
      .map((c) => [c.at, c.at + c.dur] as [number, number]);

    for (const c of clips) {
      const buf = this.bufCacheSync(c.url);
      if (!buf) continue;                       // no decodificado / falló → mudo
      const endAt = c.at + c.dur;
      if (endAt <= this.from) continue;         // ya pasó

      const skip = Math.max(0, this.from - c.at);          // cuánto del clip ya transcurrió
      const whenRel = Math.max(0, c.at - this.from);       // cuándo suena (relativo a ahora)
      const srcOffset = c.offset + skip;
      const srcDur = c.dur - skip;
      if (srcDur <= 0.01) continue;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = !!c.loop;

      const g = ctx.createGain();
      const base = c.gain ?? 1;
      const when = ctx.currentTime + whenRel;
      if (c.kind === 'music' && c.duck) {
        this.scheduleDuck(g, base, c.at, c.dur, this.from, voiceIv, when);
      } else {
        g.gain.setValueAtTime(base, when);
      }
      src.connect(g).connect(this.master!);
      // loop: cortar a mano al final del tramo; no-loop: stop por duración del buffer.
      if (c.loop) { src.start(when, srcOffset % buf.duration); src.stop(when + srcDur); }
      else { src.start(when, srcOffset, srcDur); }
      this.active.push(src);
    }

    // fin del montaje → notificar (lo usa el editor para frenar el playhead).
    if (this.endTimer) clearTimeout(this.endTimer);
    const remaining = (this.dur - this.from) * 1000;
    this.endTimer = window.setTimeout(() => { this._playing = false; this.onEnded?.(); }, Math.max(0, remaining) + 40);
  }

  // Música: gain base, y baja a DUCK_GAIN durante cada intervalo de voz que cae
  // dentro del tramo de la música (con rampas suaves para evitar clicks).
  private scheduleDuck(g: GainNode, base: number, mAt: number, mDur: number, from: number, voiceIv: [number, number][], when: number) {
    const mEnd = mAt + mDur;
    g.gain.setValueAtTime(base, when);
    for (const [vs, ve] of voiceIv) {
      const s = Math.max(vs, mAt, from), e = Math.min(ve, mEnd);
      if (e <= s) continue;
      const tDown = when + (s - Math.max(mAt, from));
      const tUp = when + (e - Math.max(mAt, from));
      g.gain.setValueAtTime(base, Math.max(when, tDown - RAMP));
      g.gain.linearRampToValueAtTime(base * DUCK_GAIN, tDown);
      g.gain.setValueAtTime(base * DUCK_GAIN, Math.max(tDown, tUp - RAMP));
      g.gain.linearRampToValueAtTime(base, tUp);
    }
  }

  pause(): void {
    this.from = this.positionSec();
    this._playing = false;
    if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }
    this.stopSources();
  }

  stop(): void {
    this._playing = false;
    this.from = 0;
    if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }
    this.stopSources();
  }

  // posición del playhead (s) — derivada del reloj del AudioContext.
  positionSec(): number {
    if (!this.ctx) return this.from;
    if (!this._playing) return this.from;
    return Math.min(this.dur, this.from + (this.ctx.currentTime - this.t0));
  }

  // fracción 0..1 sobre la duración total (lo que consume la onda como cursor).
  positionFrac(): number {
    return this.dur > 0 ? this.positionSec() / this.dur : 0;
  }

  private stopSources(): void {
    for (const s of this.active) { try { s.stop(); } catch { /* ya parado */ } }
    this.active = [];
  }

  // lee el buffer del cache si YA está resuelto (sync). prime() lo deja listo.
  private bufCacheSync(url: string): AudioBuffer | null {
    const p = this.bufCache.get(url) as (Promise<AudioBuffer> & { _val?: AudioBuffer }) | undefined;
    return p?._val ?? null;
  }

  // marca el valor resuelto en la promesa (para lectura sync en play()).
  private markResolved(url: string, buf: AudioBuffer) {
    const p = this.bufCache.get(url) as (Promise<AudioBuffer> & { _val?: AudioBuffer }) | undefined;
    if (p) p._val = buf;
  }

  dispose(): void {
    this.stop();
    this.ctx?.close().catch(() => {});
    this.ctx = null; this.master = null; this.bufCache.clear();
  }
}
