// Editor de timeline COMPARTIDO (Reel y Montaje). Acumulativo: Animación + Video +
// Música + Voz. Los clips se mueven LIBRE en horizontal arrastrándolos (pointer
// events → anda en touch y mouse). La timeline es A-ESCALA (1s = PX_PER_SEC px), así
// el ancho de cada clip refleja su duración real y mover/cortar mapea 1:1 al audio.
//
// AUDIO POR FRASE: cada frase de narración tiene su PROPIO audio (TTS por frase,
// generado on-demand contra el media-service y cacheado). El motor (lib/montageAudio)
// agenda cada clip en su posición; el reloj es ctx.currentTime (sin glitches).
//
// FUENTES: las paletas de arriba (animaciones, narración, música, videos) son todas
// instancias del CONTROL GENÉRICO <SourcePanel> — mismo control, distinta vista según
// el contenido (grid / chips), con buscador, filtros, preview y colapsado. "Se cambia
// en un lado solo". La lógica pura (timeline + filtros) vive en lib/*, con unit tests.
import { useEffect, useRef, useState } from 'react';
import { Film, AudioLines, Music2, Video, Shuffle, Sparkles, Type, Pencil, X, Play, Pause, SkipBack, ChevronRight, ChevronLeft, Loader2, Eraser, Trash2, Volume2, VolumeX } from 'lucide-react';
import { extractFrames } from './lib/videoFrames';
import { MUSIC_TRACKS } from './lib/music';
import { TTS_SERVICE_URL } from './config';
import { prettyVid, thumbOf, type CloudVid } from './lib/cloudVideos';
import { MontageAudio } from './lib/montageAudio';
import SourcePanel, { type SourcePanelProps } from './SourcePanel';
import {
  PX_PER_SEC, GAP, MIN_W, SLIDE_SEC, DEF_PHRASE_SEC, DEF_VIDEO_SEC, DEF_MUSIC_SEC,
  TRANSITION_SEC, EFFECT_SEC, TRANSITIONS, EFFECTS, TEXT_SEC, TEXT_PRESETS, DEFAULT_TEXT_FOR,
  secToPx, masterSecOf, rulerTicks, appendX, reflow, buildPlan, effectAtPx, effectClass, presetLabel, textsAtPx, textPresetClass,
  type SlideClip, type RefClip, type PhraseClip, type PhraseAudio, type TextClip, type TrackKind,
} from './lib/reelTimeline';
import { buildSnapshot, loadMontage, saveMontage } from './lib/montageStore';
import { getRealAudioUrl } from './lib/audioSource';
import { slicePeaks } from './lib/audioSlice';
import type { Project } from './lib/projects';
import './ReelTab.css';

type DragMode = 'move' | 'l' | 'r';           // mover · resize inicio · resize fin

// voz por defecto cuando el reel no tiene settings guardado (Lucía, es-AR).
const DEFAULT_VOICE = { voice_id: 'yA5jrK1S9cpCAojBYyMu', model: 'eleven_v3', stability: 0.4, similarity: 0.8, style: 0.5, speed: 1.0 };

// Mini-onda dibujada DENTRO de un clip de audio. peaks = slice 0..1 de la fuente.
function ClipWave({ peaks }: { peaks: number[] }) {
  if (!peaks.length) return null;
  const bw = 100 / peaks.length;
  return (
    <svg className="rt-clip-wave" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {peaks.map((v, i) => {
        const h = Math.max(7, v * 96);
        return <rect key={i} x={i * bw} y={(100 - h) / 2} width={Math.max(0.5, bw - 0.35)} height={h} rx={0.6} />;
      })}
    </svg>
  );
}

export default function ReelEditor({ project, audioByReel, videos, videosLoading = false }: {
  project: Project; audioByReel?: Record<string, string>; videos?: CloudVid[]; videosLoading?: boolean;
}) {
  const withVideo = videos !== undefined;
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const [frames, setFrames] = useState<string[]>([]);
  const [slideTrack, setSlideTrack] = useState<SlideClip[]>([]);
  const [audioTrack, setAudioTrack] = useState<PhraseClip[]>([]);
  const [musicTrack, setMusicTrack] = useState<RefClip[]>([]);
  const [videoTrack, setVideoTrack] = useState<RefClip[]>([]);
  const [transitionTrack, setTransitionTrack] = useState<RefClip[]>([]);   // id = tipo de transición
  const [effectTrack, setEffectTrack] = useState<RefClip[]>([]);           // id = tipo de efecto
  const [textTrack, setTextTrack] = useState<TextClip[]>([]);              // textos/títulos (contenido editable)
  const [editingTextId, setEditingTextId] = useState<string | null>(null); // texto en edición (input en el riel)
  const [openPanel, setOpenPanel] = useState<Record<string, boolean>>({});   // paletas colapsables (default abiertas)
  const [playing, setPlaying] = useState(false);
  const [playFrac, setPlayFrac] = useState(0);   // 0-1 sobre la duración del montaje (también el cursor del waveform)
  const [phraseAudio, setPhraseAudio] = useState<Record<number, PhraseAudio>>({});  // TTS por frase (url+dur+peaks)
  const [phraseBusy, setPhraseBusy] = useState<Set<number>>(new Set());             // frases generándose (feedback en el clip)
  const [musicPeaks, setMusicPeaks] = useState<Record<string, number[]>>({});       // peaks por track de música presente
  const [muted, setMuted] = useState<Set<TrackKind>>(new Set());                    // canales silenciados en la reproducción
  const [previewOpen, setPreviewOpen] = useState(true);                             // riel de preview (colapsable)
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);                    // wall-clock para el modo sin-audio
  const usingEngineRef = useRef(false);          // true: el playhead lo manda el motor; false: wall-clock
  const engineRef = useRef<MontageAudio | null>(null);
  if (!engineRef.current) engineRef.current = new MontageAudio();  // 1 motor por editor (AudioContext lazy)
  const inflightRef = useRef<Set<number>>(new Set());             // dedupe de generaciones TTS en curso
  const realAudioRef = useRef<{ reelId: string; url: string; dur: number; peaks: number[] } | null>(null); // audio real cargado (locutor)
  const masterSecRef = useRef(0);                // duración total del montaje (s), leída por el rAF sin closure stale
  const draggingRef = useRef(false);             // durante un drag NO reprogramamos (evita reiniciar el audio por píxel)
  const playRef = useRef<() => void>(() => {});  // play/stop fresco para el atajo de teclado
  const [rev, setRev] = useState(0);             // bump al soltar un drag → fuerza una reprogramación con estado fresco

  const reel = project.reels.find((r) => r.id === reelId) ?? project.reels[0] ?? null;
  const phrases: string[] = reel?.guion ?? [];   // el guion VIVE en el proyecto (agnóstico)
  const n = phrases.length;
  const slides = Array.from({ length: n }, (_, i) => i);
  const vidById = (id: string) => (videos || []).find((v) => v.id === id);
  const musicUrlOf = (id: string) => MUSIC_TRACKS.find((t) => t.id === id)?.url;
  const videoUrlOf = (id: string) => vidById(id)?.url;

  // duración total + regla de tiempo (lógica pura, testeada).
  const masterSec = masterSecOf([slideTrack, audioTrack, videoTrack, musicTrack, transitionTrack, effectTrack, textTrack]);
  masterSecRef.current = masterSec;
  const contentW = masterSec * PX_PER_SEC;
  const ruler = rulerTicks(masterSec);

  const playing0 = playing || playFrac > 0;
  const playPx = playFrac * contentW;
  const slidesByX = [...slideTrack].sort((a, b) => a.x - b.x);
  const curSlide = playing0 ? ([...slidesByX].reverse().find((c) => c.x <= playPx) ?? slidesByX[0]) : undefined;
  const activeS = curSlide?.s;
  const restS = slidesByX[0]?.s;                 // en reposo, mostrar la primera animación
  const showS = activeS ?? restS;
  const activeVidClip = playing0 ? videoTrack.find((c) => playPx >= c.x && playPx < c.x + c.w) : undefined;
  const activeVid = activeVidClip ? vidById(activeVidClip.id) : undefined;
  // efecto activo en el playhead (en reposo, el que arranca en 0) → clase CSS del preview.
  const activeEffect = effectAtPx(effectTrack, playing0 ? playPx : 0);
  const fxClass = effectClass(activeEffect);
  // textos activos en el playhead → overlays del preview.
  const activeTexts = textsAtPx(textTrack, playing0 ? playPx : 0);

  const currentPlan = () => buildPlan({ audioTrack, phraseAudio, musicTrack, videoTrack, musicUrlOf, videoUrlOf, muted });

  // ── Audio REAL (locutor): el reel usa el archivo grabado/subido, recortado por segmento ──
  const ensureRealAudio = async () => {
    if (!reel) return null;
    if (realAudioRef.current?.reelId === reel.id) return realAudioRef.current;
    // url ya compartida por VoiceStudio en esta sesión; si no, la persistida en IndexedDB.
    const url = audioByReel?.[reel.id] ?? (await getRealAudioUrl(reel.id));
    if (!url) return null;
    const buf = await engineRef.current!.load(url);
    const dur = buf?.duration || 0;
    const peaks = buf ? MontageAudio.peaksFromBuffer(buf, Math.max(48, Math.round(dur * 30))) : [];
    const ra = { reelId: reel.id, url, dur, peaks };
    realAudioRef.current = ra;
    return ra;
  };
  // PhraseAudio de la frase p a partir del segmento del audio real (offset = inicio del recorte).
  const genRealPhrase = async (p: number): Promise<PhraseAudio | null> => {
    const segs = reel?.voiceConfig?.segments ?? [];
    const seg = segs.find((s) => s.phraseIndex === p) ?? segs[p];
    if (!seg) return null;
    const ra = await ensureRealAudio(); if (!ra) return null;
    const dur = Math.max(0.05, seg.endSec - seg.startSec);
    const pa: PhraseAudio = { url: ra.url, dur, peaks: slicePeaks(ra.peaks, ra.dur, seg.startSec, seg.endSec), offset: seg.startSec };
    setPhraseAudio((prev) => ({ ...prev, [p]: pa }));
    return pa;
  };

  // ── TTS por frase: genera (una vez) el audio de la frase p y lo cachea ────────
  const genPhrase = async (p: number): Promise<PhraseAudio | null> => {
    if (phraseAudio[p]) return phraseAudio[p];
    if (reel?.voiceConfig?.audioMode === 'real') return genRealPhrase(p);  // locutor real → segmento
    if (inflightRef.current.has(p)) return null;       // ya hay una generación en curso
    const text = phrases[p]; if (!text || !reel) return null;
    inflightRef.current.add(p);
    setPhraseBusy((s) => new Set(s).add(p));
    const vc = reel.voiceConfig ?? DEFAULT_VOICE;
    try {
      const r = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: vc.voice_id, model_id: vc.model, stability: vc.stability, similarity_boost: vc.similarity, style: vc.style, speed: vc.speed, use_speaker_boost: true }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const buf = await engineRef.current!.load(url);      // decodifica (y cachea para la reproducción)
      const dur = buf?.duration || DEF_PHRASE_SEC;
      const peaks = buf ? MontageAudio.peaksFromBuffer(buf, Math.max(24, Math.round(dur * 38))) : [];
      const pa: PhraseAudio = { url, dur, peaks };
      setPhraseAudio((prev) => ({ ...prev, [p]: pa }));
      return pa;
    } catch {
      return null;
    } finally {
      inflightRef.current.delete(p);
      setPhraseBusy((s) => { const nn = new Set(s); nn.delete(p); return nn; });
    }
  };

  // al abrir un reel: si hay un montaje GUARDADO, lo restaura; si no, layout inicial
  // (todas las animaciones · resto vacío). Los frames del boceto se extraen para el preview.
  useEffect(() => {
    let alive = true; setFrames([]);
    const saved = reel ? loadMontage(project.id, reel.id) : null;
    if (saved) {
      setSlideTrack(saved.slides); setAudioTrack(saved.audios); setMusicTrack(saved.music);
      setVideoTrack(saved.videos); setTransitionTrack(saved.transitions); setEffectTrack(saved.effects); setTextTrack(saved.texts);
    } else {
      setSlideTrack(reflow(slides.map((s) => ({ s, x: 0, w: secToPx(SLIDE_SEC) })), () => SLIDE_SEC));
      setAudioTrack([]); setMusicTrack([]); setVideoTrack([]); setTransitionTrack([]); setEffectTrack([]); setTextTrack([]);
    }
    setEditingTextId(null); stopPlay();
    if (reel?.slidesRef && n > 0) extractFrames(reel.slidesRef, n).then((f) => { if (alive) setFrames(f); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, reel?.id, reel?.slidesRef, n]);

  // auto-guardado del montaje (debounced). El debounce + cleanup evita guardar los clips
  // del reel anterior bajo la clave del nuevo al cambiar de reel.
  useEffect(() => {
    if (!reel) return;
    const snap = buildSnapshot({ slideTrack, audioTrack, musicTrack, videoTrack, transitionTrack, effectTrack, textTrack });
    const t = setTimeout(() => saveMontage(project.id, reel.id, snap), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideTrack, audioTrack, musicTrack, videoTrack, transitionTrack, effectTrack, textTrack, reel?.id]);

  // al cambiar de reel: soltar el audio de las frases del reel anterior (revoca URLs).
  useEffect(() => {
    setPhraseAudio((prev) => { Object.values(prev).forEach((pa) => { try { URL.revokeObjectURL(pa.url); } catch { /* noop */ } }); return {}; });
    setPhraseBusy(new Set()); setMusicPeaks({});
    inflightRef.current = new Set();
    realAudioRef.current = null;   // soltar el audio real del reel anterior
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.id]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); engineRef.current?.dispose(); }, []);

  // Conocida la duración real de una frase, re-secuencia la pista de Voz a-escala:
  // cada clip toma su ancho real (= duración) y quedan contiguos, en el orden actual.
  // No corre en pleno drag (no pisa lo que estás moviendo a mano).
  useEffect(() => {
    if (draggingRef.current) return;
    setAudioTrack((arr) => (arr.length ? reflow(arr, (c) => phraseAudio[c.p]?.dur || DEF_PHRASE_SEC) : arr));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseAudio]);

  // Peaks de cada track de música presente (para dibujar su onda en el clip).
  useEffect(() => {
    const e = engineRef.current!; let alive = true;
    for (const c of musicTrack) {
      if (musicPeaks[c.id]) continue;
      const url = musicUrlOf(c.id); if (!url) continue;
      e.peaks(url, 140).then((pk) => { if (alive && pk) setMusicPeaks((prev) => prev[c.id] ? prev : { ...prev, [c.id]: pk }); });
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicTrack]);

  // ── reprogramación EN VIVO: si estás reproduciendo (con el motor) y cambia un track
  //    con audio, el montaje se rearma desde la posición actual (no en pleno drag). ──
  useEffect(() => {
    const e = engineRef.current; if (!e?.playing || draggingRef.current) return;
    const plan = currentPlan(); const at = e.positionSec();
    e.prime(plan).then(() => { if (e.playing && !draggingRef.current) e.play(plan, at); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioTrack, videoTrack, musicTrack, muted, phraseAudio, rev]);

  // ── transporte ──────────────────────────────────────────────────────────────
  const tick = () => {
    const e = engineRef.current!; const total = masterSecRef.current;
    if (usingEngineRef.current) {
      setPlayFrac(total > 0 ? Math.min(1, e.positionSec() / total) : 0);
      if (!e.playing) { setPlaying(false); return; }
    } else {
      const f = Math.min(1, (performance.now() - startRef.current) / (total * 1000));
      setPlayFrac(f);
      if (f >= 1) { setPlaying(false); return; }
    }
    rafRef.current = requestAnimationFrame(tick);
  };
  const play = () => {
    if (playing || !slideTrack.length) return;
    const e = engineRef.current!;
    setPlaying(true);
    setPreviewOpen(true);   // el preview se abre al dar Play (como las apps de diseño)
    const fromFrac = playFrac >= 1 ? 0 : playFrac;
    if (playFrac >= 1) setPlayFrac(0);
    e.onEnded = () => { setPlaying(false); setPlayFrac(1); };
    const plan = currentPlan();
    const from = fromFrac * masterSecRef.current;
    if (plan.length) {
      usingEngineRef.current = true;
      e.prime(plan).then(() => { e.play(plan, from); rafRef.current = requestAnimationFrame(tick); });
    } else {
      usingEngineRef.current = false;
      startRef.current = performance.now() - from * 1000;
      rafRef.current = requestAnimationFrame(tick);
    }
  };
  const pause = () => { engineRef.current?.pause(); setPlaying(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  function stopPlay() {
    setPlaying(false); setPlayFrac(0);
    engineRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }
  // barra espaciadora: si suena, para y vuelve a 0; si está parado, arranca desde 0.
  playRef.current = () => { if (playing) stopPlay(); else play(); };
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null; const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
      if (ev.code === 'Space') { ev.preventDefault(); playRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── agregar al track ──────────────────────────────────────────────────────────
  const addSlide = (i: number) => setSlideTrack((t) => [...t, { s: i, x: appendX(t), w: secToPx(SLIDE_SEC) }]);
  const addPhrase = (i: number) => {
    setAudioTrack((t) => [...t, { p: i, x: appendX(t), w: secToPx(phraseAudio[i]?.dur || DEF_PHRASE_SEC) }]);
    if (!phraseAudio[i]) genPhrase(i);   // genera en background → al llegar, el clip toma su onda + duración
  };
  const addMusic = (id: string) => {
    const span = Math.max(DEF_MUSIC_SEC, masterSec);   // el bed cubre el montaje actual
    setMusicTrack((t) => [...t, { id, x: 0, w: secToPx(span) }]);
  };
  const addVideo = (id: string) => { const v = vidById(id); setVideoTrack((t) => [...t, { id, x: appendX(t), w: secToPx(v?.duration_sec || DEF_VIDEO_SEC) }]); };
  const addVideos = (ids: string[]) => setVideoTrack((t) => { let x = appendX(t); return [...t, ...ids.map((id) => { const v = vidById(id); const w = secToPx(v?.duration_sec || DEF_VIDEO_SEC); const c = { id, x, w }; x += w + GAP; return c; })]; });
  const addTransition = (id: string) => setTransitionTrack((t) => [...t, { id, x: appendX(t), w: secToPx(TRANSITION_SEC) }]);
  const addEffect = (id: string) => setEffectTrack((t) => [...t, { id, x: appendX(t), w: secToPx(Math.min(EFFECT_SEC, Math.max(2, masterSec))) }]);
  const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'x' + Date.now() + Math.round(Math.random() * 1e6));
  const addText = (preset: string) => { const id = uid(); setTextTrack((t) => [...t, { id, preset, text: DEFAULT_TEXT_FOR[preset] || 'Texto', x: appendX(t), w: secToPx(TEXT_SEC) }]); setEditingTextId(id); setPreviewOpen(true); };
  const updateText = (id: string, patch: Partial<TextClip>) => setTextTrack((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeText = (id: string) => { setTextTrack((arr) => arr.filter((c) => c.id !== id)); if (editingTextId === id) setEditingTextId(null); };

  const removeAt = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, k: number) => setter((arr) => arr.filter((_, j) => j !== k));

  // ── limpiar canal / todo · mute por canal ────────────────────────────────────
  const clearTrack = (kind: TrackKind) => {
    if (kind === 'slide') setSlideTrack([]); else if (kind === 'video') setVideoTrack([]);
    else if (kind === 'music') setMusicTrack([]); else if (kind === 'transition') setTransitionTrack([]);
    else if (kind === 'effect') setEffectTrack([]); else if (kind === 'text') { setTextTrack([]); setEditingTextId(null); }
    else setAudioTrack([]);
    setRev((r) => r + 1);
  };
  const clearAll = () => { setSlideTrack([]); setVideoTrack([]); setMusicTrack([]); setAudioTrack([]); setTransitionTrack([]); setEffectTrack([]); setTextTrack([]); setEditingTextId(null); stopPlay(); };
  const toggleMute = (kind: TrackKind) => setMuted((m) => { const nn = new Set(m); nn.has(kind) ? nn.delete(kind) : nn.add(kind); return nn; });

  // ── mover LIBRE + RESIZE (inicio/fin) — listeners en WINDOW durante el drag ──
  const setClip = (kind: TrackKind, idx: number, x: number, w: number) => {
    const upd = <T extends { x: number; w: number }>(arr: T[]) => arr.map((c, i) => (i === idx ? { ...c, x, w } : c));
    if (kind === 'slide') setSlideTrack(upd); else if (kind === 'video') setVideoTrack(upd);
    else if (kind === 'music') setMusicTrack(upd); else if (kind === 'transition') setTransitionTrack(upd);
    else if (kind === 'effect') setEffectTrack(upd); else if (kind === 'text') setTextTrack(upd); else setAudioTrack(upd);
  };
  const onPtrDown = (e: React.PointerEvent, kind: TrackKind, idx: number, mode: DragMode, x0: number, w0: number) => {
    e.stopPropagation(); e.preventDefault();
    draggingRef.current = true;
    const lane = (e.currentTarget as HTMLElement).closest('.rt-lane') as HTMLElement;
    const laneW = lane?.getBoundingClientRect().width ?? 0;
    const startX = e.clientX;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      let x = x0, w = w0;
      if (mode === 'move') x = Math.max(0, Math.min(Math.max(0, laneW - w0), x0 + dx));
      else if (mode === 'r') w = Math.max(MIN_W, Math.min(laneW - x0, w0 + dx));
      else { const right = x0 + w0; x = Math.max(0, Math.min(right - MIN_W, x0 + dx)); w = right - x; }
      setClip(kind, idx, x, w);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      draggingRef.current = false; setRev((r) => r + 1);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  const labelOf = (id: string) => MUSIC_TRACKS.find((m) => m.id === id)?.label || id;
  const xwStyle = (x: number, w: number) => ({ ['--x']: `${x}px`, ['--w']: `${w}px` } as React.CSSProperties);
  const stopPd = (e: React.PointerEvent) => e.stopPropagation();
  const handles = (kind: TrackKind, idx: number, x: number, w: number) => (<>
    <span className="rt-clip-h rt-clip-h--l" onPointerDown={(e) => onPtrDown(e, kind, idx, 'l', x, w)} />
    <span className="rt-clip-h rt-clip-h--r" onPointerDown={(e) => onPtrDown(e, kind, idx, 'r', x, w)} />
  </>);
  const playhead = playing0 ? <span className="rt-lane-ph" style={{ ['--x']: `${playPx}px` } as React.CSSProperties} /> : null;
  const trackHead = (kind: TrackKind, icon: React.ReactNode, name: string, sounds: boolean) => (
    <div className="rt-track-head">
      <span className="rt-track-lbl">{icon} {name}</span>
      <span className="rt-track-acts">
        {sounds && <button className={muted.has(kind) ? 'rt-thbtn rt-thbtn--off' : 'rt-thbtn'} title={muted.has(kind) ? 'Activar sonido' : 'Silenciar canal'} onClick={() => toggleMute(kind)}>{muted.has(kind) ? <VolumeX size={12} /> : <Volume2 size={12} />}</button>}
        <button className="rt-thbtn" title="Vaciar canal" onClick={() => clearTrack(kind)}><Eraser size={12} /></button>
      </span>
    </div>
  );

  // ── FUENTES: cada paleta es una instancia del control genérico <SourcePanel> ──
  const isPanelOpen = (id: string) => openPanel[id] !== false;
  const togglePanel = (id: string) => setOpenPanel((o) => ({ ...o, [id]: o[id] === false }));
  const sources: (SourcePanelProps & { id: string })[] = [
    {
      id: 'anim', title: 'Animaciones', accent: 'var(--azure)', icon: <Film size={12} />, grow: 300, view: 'grid',
      items: slides.map((i) => ({ id: `s${i}`, label: String(i + 1), thumb: frames[i], data: i })),
      onPick: (it) => addSlide(it.data as number),
    },
    {
      id: 'narr', title: 'Narración', accent: 'var(--gold)', icon: <AudioLines size={12} />, grow: 250, view: 'chips',
      search: true, hint: '▶ escuchás la frase · tocá el texto para sumarla a la Voz',
      items: phrases.map((p, i) => ({ id: `n${i}`, label: `frase ${i + 1}`, sub: phraseAudio[i] ? `${phraseAudio[i].dur.toFixed(1)}s` : undefined, searchText: p, data: i })),
      getPreviewUrl: async (it) => { const i = it.data as number; const pa = phraseAudio[i] || await genPhrase(i); return pa?.url ?? null; },
      onPick: (it) => addPhrase(it.data as number),
      emptyText: 'Este reel no tiene narración.',
    },
    {
      id: 'mus', title: 'Música', accent: 'var(--violet)', icon: <Music2 size={12} />, grow: 280, view: 'chips',
      search: true, filters: [{ key: 'cat', label: 'Estilo' }],
      items: MUSIC_TRACKS.map((m) => ({ id: m.id, label: m.label, meta: { cat: m.cat }, data: m.id })),
      getPreviewUrl: (it) => musicUrlOf(it.data as string) ?? null,
      onPick: (it) => addMusic(it.data as string),
    },
    {
      id: 'trans', title: 'Transiciones', accent: 'var(--pink)', icon: <Shuffle size={12} />, grow: 220, view: 'chips',
      hint: 'sumala y arrastrala a la unión entre dos clips',
      items: TRANSITIONS.map((t) => ({ id: t.id, label: t.label, data: t.id })),
      onPick: (it) => addTransition(it.data as string),
    },
    {
      id: 'fx', title: 'Efectos', accent: 'var(--green)', icon: <Sparkles size={12} />, grow: 220, view: 'chips',
      hint: 'cubre un rango; el preview lo muestra en vivo',
      items: EFFECTS.map((e) => ({ id: e.id, label: e.label, data: e.id })),
      onPick: (it) => addEffect(it.data as string),
    },
    {
      id: 'txt', title: 'Texto', accent: 'var(--amber)', icon: <Type size={12} />, grow: 220, view: 'chips',
      hint: 'sumá un texto y editá el contenido (✎ en el clip)',
      items: TEXT_PRESETS.map((p) => ({ id: p.id, label: p.label, data: p.id })),
      onPick: (it) => addText(it.data as string),
    },
  ];
  if (withVideo) sources.push({
    id: 'vid', title: 'Videos', accent: 'var(--cyan)', icon: <Video size={12} />, grow: 320, view: 'grid',
    search: true, multiSelect: true,
    items: (videos || []).map((v) => ({ id: v.id, label: prettyVid(v.name), thumb: thumbOf(v), data: v.id })),
    onPick: (it) => addVideo(it.data as string),
    onPickMany: (its) => addVideos(its.map((i) => i.data as string)),
    pickManyLabel: (k) => `Agregar ${k} al timeline`,
    emptyText: videosLoading ? 'Cargando videos…' : 'Subí videos en la solapa «Videos».',
  });

  return (
    <div className="rt-shell">
      {project.reels.length > 0 && (
        <div className="rt-reelbar">
          {project.reels.map((r) => (
            <button key={r.id} className={r.id === reel?.id ? 'rt-reelchip rt-reelchip--on' : 'rt-reelchip'} onClick={() => setReelId(r.id)}>
              {r.nombre}{r.voiceConfig?.voice_id && <span className="rt-reelchip-dot" title="tiene voz configurada" />}
            </button>
          ))}
        </div>
      )}

      {!n ? (
        <div className="rt-empty">Este reel todavía no tiene animaciones. Cargalas/generalas y aparecen acá para editar.</div>
      ) : (
        <div className="rt-editor">
          {/* FUENTES: paneles colapsables (todos = el mismo control genérico) */}
          <div className="rt-row1">
            {sources.map(({ id, ...p }) => (
              <SourcePanel key={id} {...p} open={isPanelOpen(id)} onToggle={() => togglePanel(id)} />
            ))}
          </div>

          {/* WORKSPACE: timeline a la izquierda · preview 9:16 (riel colapsable) a la derecha */}
          <div className="rt-workspace">
            <div className="rt-main">
              {/* barra de transporte + acciones del montaje */}
              <div className="rt-toolbar">
                <button className="rt-tbtn" onClick={stopPlay} title="Rebobinar (a 0)"><SkipBack size={15} /></button>
                <button className="rt-tbtn rt-tbtn--play" onClick={() => (playing ? pause() : play())} disabled={!slideTrack.length} title={playing ? 'Pausa' : 'Play (barra espaciadora)'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                <span className="rt-time">{(playFrac * masterSec).toFixed(1)}s / {masterSec.toFixed(1)}s</span>
                <span className="rt-transport-note">{audioTrack.length ? `${audioTrack.length} clips de voz` : 'sumá frases para la voz'} · barra = play/stop</span>
                <div className="rt-toolbar-right">
                  <button className="rt-actbtn" onClick={clearAll} title="Vaciar todos los canales"><Trash2 size={13} /> Limpiar todo</button>
                  {!previewOpen && <button className="rt-actbtn" onClick={() => setPreviewOpen(true)} title="Mostrar preview"><ChevronLeft size={13} /> Preview</button>}
                </div>
              </div>

              {/* TIMELINE: regla de tiempo + canales (un playhead cruza todo) */}
              <div className="rt-timeline">
                <div className="rt-ruler">
                  <span className="rt-track-head rt-ruler-spacer" />
                  <div className="rt-lane rt-ruler-lane">
                    {ruler.map((t) => (
                      <span key={t} className="rt-tick" style={{ ['--x']: `${t * PX_PER_SEC}px` } as React.CSSProperties}>{t}s</span>
                    ))}
                    {playhead}
                  </div>
                </div>

                <div className="rt-track">
                  {trackHead('slide', <Film size={12} />, 'Animación', false)}
                  <div className="rt-lane rt-lane--free">{playhead}
                    {slideTrack.length ? slideTrack.map((c, k) => (
                      <div key={k} className={c.s === activeS ? 'rt-clip rt-clip--slide rt-clip--active' : 'rt-clip rt-clip--slide'} style={xwStyle(c.x, c.w)}
                        onPointerDown={(e) => onPtrDown(e, 'slide', k, 'move', c.x, c.w)}>
                        {handles('slide', k, c.x, c.w)}
                        {frames[c.s] && <img src={frames[c.s]} alt="" className="rt-clip-thumb" />} {c.s + 1}
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setSlideTrack, k)}><X size={10} /></button>
                      </div>
                    )) : <div className="rt-lane-empty">Tocá una animación de arriba para sumarla.</div>}
                  </div>
                </div>

                {withVideo && (
                  <div className="rt-track">
                    {trackHead('video', <Video size={12} />, 'Video', true)}
                    <div className="rt-lane rt-lane--free">{playhead}
                      {videoTrack.length ? videoTrack.map((c, k) => {
                        const v = vidById(c.id);
                        return (
                          <div key={k} className="rt-clip rt-clip--video" style={xwStyle(c.x, c.w)}
                            onPointerDown={(e) => onPtrDown(e, 'video', k, 'move', c.x, c.w)}>
                            {handles('video', k, c.x, c.w)}
                            {v && <img src={thumbOf(v)} alt="" className="rt-clip-thumb" onError={(e) => e.currentTarget.classList.add('rt-gal-img--broken')} />}
                            {v ? prettyVid(v.name).slice(0, 9) : 'video'}
                            <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setVideoTrack, k)}><X size={10} /></button>
                          </div>
                        );
                      }) : <div className="rt-lane-empty">Tocá un video de la galería para meterlo.</div>}
                    </div>
                  </div>
                )}

                <div className="rt-track">
                  {trackHead('music', <Music2 size={12} />, 'Música', true)}
                  <div className="rt-lane rt-lane--free">{playhead}
                    {musicTrack.length ? musicTrack.map((c, k) => (
                      <div key={k} className="rt-clip rt-clip--music" style={xwStyle(c.x, c.w)}
                        onPointerDown={(e) => onPtrDown(e, 'music', k, 'move', c.x, c.w)}>
                        {musicPeaks[c.id] && <ClipWave peaks={musicPeaks[c.id]} />}
                        {handles('music', k, c.x, c.w)}
                        <span className="rt-clip-lbl">{labelOf(c.id)}</span>
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setMusicTrack, k)}><X size={10} /></button>
                      </div>
                    )) : <div className="rt-lane-empty">Tocá una música de arriba para sumarla.</div>}
                  </div>
                </div>

                <div className="rt-track">
                  {trackHead('audio', <AudioLines size={12} />, 'Voz', true)}
                  <div className="rt-lane rt-lane--free">{playhead}
                    {audioTrack.length ? audioTrack.map((c, k) => (
                      <div key={k} className="rt-clip rt-clip--audio" style={xwStyle(c.x, c.w)} title={phrases[c.p]}
                        onPointerDown={(e) => onPtrDown(e, 'audio', k, 'move', c.x, c.w)}>
                        <ClipWave peaks={phraseAudio[c.p]?.peaks || []} />
                        {handles('audio', k, c.x, c.w)}
                        <span className="rt-clip-lbl">{phraseBusy.has(c.p) ? <Loader2 size={10} className="rt-spin" /> : null} frase {c.p + 1}</span>
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setAudioTrack, k)}><X size={10} /></button>
                      </div>
                    )) : <div className="rt-lane-empty">Tocá una frase de arriba para sumarla.</div>}
                  </div>
                </div>

                <div className="rt-track">
                  {trackHead('transition', <Shuffle size={12} />, 'Transición', false)}
                  <div className="rt-lane rt-lane--free">{playhead}
                    {transitionTrack.length ? transitionTrack.map((c, k) => (
                      <div key={k} className="rt-clip rt-clip--trans" style={xwStyle(c.x, c.w)}
                        onPointerDown={(e) => onPtrDown(e, 'transition', k, 'move', c.x, c.w)}>
                        {handles('transition', k, c.x, c.w)}
                        <span className="rt-clip-lbl">{presetLabel(TRANSITIONS, c.id)}</span>
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setTransitionTrack, k)}><X size={10} /></button>
                      </div>
                    )) : <div className="rt-lane-empty">Tocá una transición de arriba (va en la unión de dos clips).</div>}
                  </div>
                </div>

                <div className="rt-track">
                  {trackHead('effect', <Sparkles size={12} />, 'Efecto', false)}
                  <div className="rt-lane rt-lane--free">{playhead}
                    {effectTrack.length ? effectTrack.map((c, k) => (
                      <div key={k} className="rt-clip rt-clip--fx" style={xwStyle(c.x, c.w)}
                        onPointerDown={(e) => onPtrDown(e, 'effect', k, 'move', c.x, c.w)}>
                        {handles('effect', k, c.x, c.w)}
                        <span className="rt-clip-lbl">{presetLabel(EFFECTS, c.id)}</span>
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setEffectTrack, k)}><X size={10} /></button>
                      </div>
                    )) : <div className="rt-lane-empty">Tocá un efecto de arriba (cubre un rango del montaje).</div>}
                  </div>
                </div>

                <div className="rt-track">
                  {trackHead('text', <Type size={12} />, 'Texto', false)}
                  <div className="rt-lane rt-lane--free">{playhead}
                    {textTrack.length ? textTrack.map((c, k) => (
                      <div key={c.id} className={editingTextId === c.id ? 'rt-clip rt-clip--text rt-clip--active' : 'rt-clip rt-clip--text'} style={xwStyle(c.x, c.w)}
                        onPointerDown={(e) => onPtrDown(e, 'text', k, 'move', c.x, c.w)}>
                        {handles('text', k, c.x, c.w)}
                        <span className="rt-clip-lbl">{c.text || presetLabel(TEXT_PRESETS, c.preset)}</span>
                        <button className="rt-clip-edit" onPointerDown={stopPd} onClick={() => setEditingTextId(c.id)} title="Editar texto"><Pencil size={9} /></button>
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeText(c.id)}><X size={10} /></button>
                      </div>
                    )) : <div className="rt-lane-empty">Tocá un texto de arriba (título, lower-third, CTA…).</div>}
                  </div>
                </div>

                <div className="rt-hint">Arrastrá los clips para moverlos. Los bordes los agrandan/achican. La × los saca. Cada canal tiene vaciar. Barra espaciadora = play/stop. Próximo: cortar/seccionar + render.</div>
              </div>
            </div>

            {/* RIEL DE PREVIEW 9:16 — colapsable, se abre al dar Play */}
            <aside className={previewOpen ? 'rt-rail' : 'rt-rail rt-rail--closed'}>
              {previewOpen ? (
                <>
                  <div className="rt-rail-head">
                    <span>Preview</span>
                    <button className="rt-rail-toggle" onClick={() => setPreviewOpen(false)} title="Colapsar preview"><ChevronRight size={15} /></button>
                  </div>
                  <div className={`rt-rail-preview ${fxClass}`}>
                    {activeVid ? (
                      <video key={activeVidClip!.id} src={activeVid.url} autoPlay muted loop playsInline className="rt-preview-img" />
                    ) : showS !== undefined && frames[showS] ? (
                      <img src={frames[showS]} alt="" className="rt-preview-img" />
                    ) : <div className="rt-preview-ph"><Film size={26} /></div>}
                    {activeTexts.map((c) => (
                      <div key={c.id} className={`rt-txt ${textPresetClass(c.preset)}`}>{c.text}</div>
                    ))}
                  </div>
                  <div className="rt-rail-transport">
                    <button className="rt-tbtn" onClick={stopPlay} title="Rebobinar (a 0)"><SkipBack size={14} /></button>
                    <button className="rt-tbtn rt-tbtn--play" onClick={() => (playing ? pause() : play())} disabled={!slideTrack.length} title={playing ? 'Pausa' : 'Play (barra espaciadora)'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
                    <span className="rt-time">{(playFrac * masterSec).toFixed(1)}s / {masterSec.toFixed(1)}s</span>
                  </div>
                  {editingTextId && (() => {
                    const c = textTrack.find((t) => t.id === editingTextId); if (!c) return null;
                    return (
                      <div className="rt-txt-edit">
                        <div className="rt-txt-edit-presets">
                          {TEXT_PRESETS.map((p) => (
                            <button key={p.id} className={c.preset === p.id ? 'rt-txt-preset rt-txt-preset--on' : 'rt-txt-preset'} onClick={() => updateText(c.id, { preset: p.id })}>{p.label}</button>
                          ))}
                        </div>
                        <textarea className="rt-txt-edit-ta" value={c.text} onChange={(e) => updateText(c.id, { text: e.target.value })} rows={2} autoFocus />
                        <button className="rt-txt-edit-done" onClick={() => setEditingTextId(null)}>Listo</button>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <button className="rt-rail-open" onClick={() => setPreviewOpen(true)} title="Abrir preview"><ChevronLeft size={16} /></button>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
