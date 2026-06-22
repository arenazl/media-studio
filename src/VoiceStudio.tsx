// Estudio de voz — editor tipo DAW. COMPONENTE INYECTABLE (iframe en otras apps).
// REGLAS DURAS de layout:
//  · FILA 1: paneles de control. Las FUENTES (Guiones · Voces · Música) son todas el
//            mismo CONTROL GENÉRICO <SourcePanel> (buscador + filtros + preview +
//            colapsable). Sound Settings es un panel propio (sliders, no es fuente).
//  · FILA 2: SOLO texto + waveform, con divisor ARRASTRABLE (resize de columna).
// Todo es DINÁMICO: la "fuente" (hoy reels de Munify) NO está hardcodeada — llega
// por config (postMessage `mediastudio:config` o window.MEDIASTUDIO_CONFIG), con
// fallback a los guiones baked. Otra app inyecta su propia fuente/tracks.
import { useEffect, useRef, useState } from 'react';
import { Mic, Download, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Music2, Files, SkipBack, Square, VolumeX, Undo2, Eraser, Pencil, Loader2, Library, Check } from 'lucide-react';
import { BRAND } from './lib/brand';
import { TTS_SERVICE_URL } from './config';
import CadenceWave, { TONES, resolveRange, type PlacedMarker } from './CadenceWave';
import ScriptText from './ScriptText';
import { MUSIC_TRACKS, type MusicTrack } from './lib/music';
import { exportVoiceWithMusic } from './lib/exportMix';
import { addVoiceClip } from './lib/voiceLib';
import { deriveName } from './lib/sourcePanel';
import SourcePanel from './SourcePanel';

// rango en construcción: 1er toque fija el inicio (frac del slider), 2º toque cierra.
interface Pending { frac: number; kind: 'emphasis' | 'tone'; tag?: string; label: string; color: string }
import type { VoiceConfig } from './lib/projects';
import './VoiceStudio.css';

interface ReelCfg { slidesRef?: string | null; voiceConfig?: VoiceConfig | null }
interface VoiceStudioProps {
  reelConfig?: Record<string, ReelCfg>;                 // por reelId: boceto + settings guardados
  files?: SourceFile[];                                 // guiones del proyecto (agnóstico) — antes venían de NARRATION
  onGrabar?: (reelId: string, vc: VoiceConfig) => void; // persiste el settings del reel
  onAudio?: (reelId: string, blob: Blob) => void;       // comparte el mp3 generado (lo usa el editor del Reel)
}

interface Voice { voice_id: string; name: string; gender?: string; age?: string; accent?: string; use_case?: string; description?: string; preview_url?: string; }
interface SourceFile { id: string; label: string; text: string; sub?: string }
type Track = MusicTrack;
interface StudioConfig { sourceTitle: string; files: SourceFile[]; tracks: Track[]; text?: string }

// Defaults agnósticos. Los guiones reales llegan por la prop `files` (del proyecto) o
// por config dinámica (postMessage/window) cuando se inyecta en otra app.
const DEFAULT_TRACKS: Track[] = MUSIC_TRACKS;
const DEFAULT_CONFIG: StudioConfig = { sourceTitle: 'GUIONES', files: [], tracks: DEFAULT_TRACKS };
const DEFAULT_TEXT = 'Escribí tu guion acá. Cada línea es una frase. Generás la voz y ajustás la entonación, énfasis y pausas en la onda.';

// Presets de voz (ElevenLabs): stability bajo = más expresivo/variable, alto =
// estable/uniforme; style sube la carga emocional; speed la cadencia.
const VOICE_PRESETS = [
  { label: 'Natural', stability: 0.5, similarity: 0.75, style: 0.15, speed: 1.0 },
  { label: 'Conversacional', stability: 0.4, similarity: 0.8, style: 0.35, speed: 1.0 },
  { label: 'Enérgico', stability: 0.3, similarity: 0.8, style: 0.6, speed: 1.05 },
  { label: 'Locución', stability: 0.7, similarity: 0.85, style: 0.1, speed: 0.95 },
];

// filtros de voces (mapeo valor→etiqueta) para el control genérico.
const GENDER_OPTS = [{ value: 'female', label: 'Femeninas' }, { value: 'male', label: 'Masculinas' }];
const AGE_OPTS = [{ value: 'young', label: 'Joven' }, { value: 'middle_aged', label: 'Adulta' }, { value: 'old', label: 'Mayor' }];

let _actx: AudioContext | null = null;
const audioCtx = () => (_actx ||= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

export default function VoiceStudio({ reelConfig, files, onGrabar, onAudio }: VoiceStudioProps = {}) {
  const initialText = (() => {
    if (typeof window === 'undefined') return DEFAULT_TEXT;
    const t = new URLSearchParams(window.location.search).get('text');
    return t && t.trim() ? t : DEFAULT_TEXT;
  })();
  const [text, setText] = useState(initialText);
  const [cfg, setCfg] = useState<StudioConfig>(() => ({ ...DEFAULT_CONFIG, files: files ?? [] }));
  const [activeFile, setActiveFile] = useState<string | null>(onAudio ? (files?.[0]?.id ?? null) : null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState('yA5jrK1S9cpCAojBYyMu');
  const [sampleVol, setSampleVol] = useState(0.9); // volumen del preview de voz
  const [model, setModel] = useState('eleven_v3');
  const [stability, setStability] = useState(0.4);
  const [similarity, setSimilarity] = useState(0.8);
  const [style, setStyle] = useState(0.5);
  const [speed, setSpeed] = useState(1.0);
  const [boost, setBoost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);               // SLIDER único (0..1): edición + playhead. Lo arrastrás vos.
  const [pending, setPending] = useState<Pending | null>(null); // rango inicio→fin en construcción
  const [voiceVol, setVoiceVol] = useState(1.0);
  const [track, setTrack] = useState<string | null>(null);
  const [musicVol, setMusicVol] = useState(0.7);
  const [musicOn, setMusicOn] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [textoW, setTextoW] = useState(330);
  const [markers, setMarkers] = useState<PlacedMarker[]>([]); // CAPA de markers sobre la onda (NO toca el texto)
  const [mHist, setMHist] = useState<PlacedMarker[][]>([]);   // historial de markers para Undo
  const [sampling, setSampling] = useState(false);       // sonando el sample de una voz
  const [editingText, setEditingText] = useState(false); // editar el guión (textarea) vs verlo pintarse (karaoke)
  const [withMusic, setWithMusic] = useState(false);     // tilde "música" del export: mezcla la pista elegida
  const [exporting, setExporting] = useState(false);     // exportación de la mezcla en curso
  const [exportErr, setExportErr] = useState<string | null>(null);
  const [savedLib, setSavedLib] = useState(false);       // feedback "guardada en la librería"
  const voiceBlobRef = useRef<Blob | null>(null);        // último mp3 de voz generado (para exportar/mezclar)
  const taRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const sampleRef = useRef<HTMLAudioElement>(null);      // preview de voz (como la música)
  const fila2Ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const isOpen = (id: string) => open[id] !== false;
  const tg = (id: string) => setOpen((o) => ({ ...o, [id]: o[id] === false }));
  // el texto es solo referencia; editarlo invalida el audio y recorta markers fuera de rango.
  const applyText = (t: string) => { setText(t); setPeaks(null); setCursor(0); setPending(null); setMarkers((ms) => ms.filter((m) => m.end <= t.length)); };
  // markers = capa propia; mutación con historial para Undo.
  const mutate = (next: PlacedMarker[]) => { setMHist((h) => [...h.slice(-49), markers]); setMarkers(next); };
  const undo = () => { setMHist((h) => { if (!h.length) return h; setMarkers(h[h.length - 1]); return h.slice(0, -1); }); };

  useEffect(() => { fetch(`${TTS_SERVICE_URL}/voices`).then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(() => {}); }, []);

  // guiones del proyecto (prop `files`) → cfg.files (agnóstico, reemplaza a NARRATION).
  useEffect(() => { if (files) setCfg((c) => ({ ...c, files })); }, [files]);

  // Config dinámica: window global + postMessage del host (app que inyecta).
  useEffect(() => {
    const w = window as unknown as { MEDIASTUDIO_CONFIG?: Partial<StudioConfig> };
    if (w.MEDIASTUDIO_CONFIG) setCfg((c) => ({ ...c, ...w.MEDIASTUDIO_CONFIG }));
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.type === 'mediastudio:config' && d.config) {
        setCfg((c) => ({ ...c, ...d.config }));
        if (typeof d.config.text === 'string' && d.config.text.trim()) applyText(d.config.text);
      }
    };
    window.addEventListener('message', onMsg);
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mediastudio:ready' }, '*'); } catch { /* noop */ }
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const loadFile = (f: SourceFile) => {
    setActiveFile(f.id); setCursor(0); setPending(null); setMHist([]); setEditingText(false);
    // si el reel ya tiene settings guardado (Grabar), lo restauro; si no, arranca del guión.
    const vc = reelConfig?.[f.id]?.voiceConfig;
    if (vc) {
      setText(vc.text ?? f.text); setPeaks(null); setCursor(0);
      setMarkers((vc.markers as PlacedMarker[]) ?? []);
      if (vc.voice_id) setVoiceId(vc.voice_id);
      if (vc.model) setModel(vc.model);
      setStability(vc.stability); setSimilarity(vc.similarity); setStyle(vc.style); setSpeed(vc.speed);
    } else {
      applyText(f.text); setMarkers([]);
    }
    // avisar al host (ej. Munify) para que sincronice su canvas/preview.
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mediastudio:file', id: f.id }, '*'); } catch { /* noop */ }
  };
  // Auto-guarda el settings del reel (voz + cadencia + pausas + markers + texto) al
  // generar — sin botón. Lo usa la solapa Reel para saber qué reel ya tiene audio.
  const autosave = () => { if (activeFile && onGrabar) onGrabar(activeFile, { voice_id: voiceId, stability, similarity, style, speed, model, markers, text }); };
  // Mover el SLIDER: en audio real hace seek; siempre actualiza la posición del cursor.
  const onCursor = (frac: number) => {
    setCursor(frac);
    if (peaks) { const a = audioRef.current; if (a && a.duration) a.currentTime = frac * a.duration; }
  };
  const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'm' + Date.now() + Math.round(Math.random() * 1e6));
  // PAUSA (puntual): en la palabra donde está el slider. Un solo toque.
  const applyPause = (kind: 'pause' | 'pauseLong', info: { label: string; color: string }) => {
    const r = resolveRange(text, cursor, cursor);
    if (!r) return;
    mutate([...markers, { id: uid(), kind, label: info.label, color: info.color, start: r.we, end: r.we }]);
  };
  // ÉNFASIS / TONO (rango): 1er toque fija el inicio en el slider; 2º toque (cualquier
  // botón de rango) cierra con el tipo que armaste, desde el inicio hasta el slider.
  const applyRange = (kind: 'emphasis' | 'tone', info: { tag?: string; label: string; color: string }) => {
    if (!pending) { setPending({ frac: cursor, kind, tag: info.tag, label: info.label, color: info.color }); return; }
    const r = resolveRange(text, pending.frac, cursor);
    const p = pending; setPending(null);
    if (!r || r.we <= r.ws) return; // rango vacío (mismo punto) → cancela el armado
    mutate([...markers, { id: uid(), kind: p.kind, tag: p.tag, label: p.label, color: p.color, start: r.ws, end: r.we }]);
  };
  const removeMarker = (id: string) => mutate(markers.filter((m) => m.id !== id));
  const clearMarkers = () => { setPending(null); mutate([]); };
  // Combina guión + markers para el TTS (el texto del editor queda INTACTO).
  const buildTtsText = () => {
    type Op = { at: number; end?: number; t: 'emph' | 'tone' | 'pause' | 'pauseLong'; tag?: string };
    const ops: Op[] = markers.map((m) => m.kind === 'emphasis' ? { at: m.start, end: m.end, t: 'emph' }
      : m.kind === 'tone' ? { at: m.start, t: 'tone', tag: m.tag }
        : { at: m.end, t: m.kind === 'pauseLong' ? 'pauseLong' : 'pause' });
    ops.sort((a, b) => b.at - a.at); // de atrás hacia adelante para no correr índices
    let out = text;
    for (const op of ops) {
      if (op.t === 'emph' && op.end != null) out = out.slice(0, op.at) + out.slice(op.at, op.end).toUpperCase() + out.slice(op.end);
      else if (op.t === 'tone') out = out.slice(0, op.at) + (op.tag || '') + ' ' + out.slice(op.at);
      else out = out.slice(0, op.at) + (op.t === 'pauseLong' ? ' <break time="0.9s"/> ' : ' <break time="0.4s"/> ') + out.slice(op.at);
    }
    // pausas ESCRITAS por el user (puntos suspensivos o corridas de espacios) → <break>
    // exacto en ese lugar. Los puntos/comas sueltos quedan como están (respiro natural).
    out = out.replace(/…|\.{3,}/g, (m) => ` <break time="${Math.min(0.3 + m.length * 0.08, 1.6).toFixed(2)}s"/> `);
    out = out.replace(/[ \t]{2,}/g, (m) => ` <break time="${Math.min(0.25 + (m.length - 1) * 0.1, 1.2).toFixed(2)}s"/> `);
    return out.replace(/[ \t]{2,}/g, ' ').trim();
  };
  // Sample de la voz: selecciona + reproduce directo (sin Web Audio) para evitar el
  // bloqueo CORS de las URLs de preview de ElevenLabs (storage.googleapis.com).
  const previewVoice = (v: Voice) => {
    setVoiceId(v.voice_id);
    const s = sampleRef.current; if (!s || !v.preview_url) return;
    s.volume = sampleVol;
    s.src = v.preview_url; s.currentTime = 0; duck(true);
    s.play().then(() => setSampling(true)).catch(() => setSampling(false));
  };
  const applyPreset = (p: { stability: number; similarity: number; style: number; speed: number }) => {
    setStability(p.stability); setSimilarity(p.similarity); setStyle(p.style); setSpeed(p.speed);
  };
  const rewind = () => { const a = audioRef.current; if (!a) return; a.currentTime = 0; setCursor(0); a.play().then(() => setPlaying(true)).catch(() => {}); };
  const stopMusic = () => { const m = musicRef.current; if (m) m.pause(); setMusicOn(false); setTrack(null); };
  const stopAll = () => {
    const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; }
    const s = sampleRef.current; if (s) s.pause();
    stopMusic(); setPlaying(false); setSampling(false); setCursor(0);
  };
  const reset = () => { applyText(DEFAULT_TEXT); setPending(null); setMarkers([]); setMHist([]); setStability(0.4); setSimilarity(0.8); setStyle(0.5); setSpeed(1.0); setBoost(true); setUrl(null); };

  const pickTrack = (t: Track) => {
    const m = musicRef.current; if (!m) return;
    if (track === t.id && musicOn) { m.pause(); setMusicOn(false); return; }
    setTrack(t.id); m.src = t.url; m.loop = true; m.volume = musicVol; m.currentTime = 0;
    m.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
  };
  const duck = (down: boolean) => { const m = musicRef.current; if (m) m.volume = down ? musicVol * 0.45 : musicVol; };

  const generate = async () => {
    if (!text.trim() || !voiceId) return;
    setBusy(true); setErr(null); setCursor(0); setEditingText(false);
    // el texto queda intacto en el editor; acá lo combino con los markers de la onda.
    const ttsText = buildTtsText();
    try {
      const r = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText, voice_id: voiceId, model_id: model, stability, similarity_boost: similarity, style, speed, use_speaker_boost: boost }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} · ${(await r.text()).slice(0, 120)}`);
      const blob = await r.blob();
      voiceBlobRef.current = blob;                 // lo reusa el export (con o sin música)
      if (url) URL.revokeObjectURL(url);
      const u = URL.createObjectURL(blob); setUrl(u);
      const fileId = activeFile || cfg.files[0]?.id;
      if (fileId && onAudio) onAudio(fileId, blob); // compartir el mp3 con el editor del Reel
      try {
        const ctx = audioCtx(); await ctx.resume();
        const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
        const ch = buf.getChannelData(0); const N = 260; const step = Math.max(1, Math.floor(ch.length / N));
        const pk: number[] = [];
        for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < step; j++) { const v = Math.abs(ch[i * step + j] || 0); if (v > m) m = v; } pk.push(m); }
        const mx = Math.max(...pk, 0.001); setPeaks(pk.map((v) => v / mx));
      } catch { setPeaks(null); }
      const a = audioRef.current; if (a) { a.src = u; a.volume = voiceVol; a.currentTime = 0; a.play().then(() => setPlaying(true)).catch(() => {}); }
      autosave(); // guarda el settings del reel (lo lee la solapa Reel)
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); } finally { setBusy(false); }
  };
  const toggle = () => { const a = audioRef.current; if (!a || !url) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };

  // Descarga un blob disparando un <a> temporal (sirve igual para voz sola o mezcla).
  const downloadBlob = (b: Blob, name: string) => {
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  };
  // Export: sin tilde (o sin pista) baja la voz tal cual; con tilde mezcla la pista
  // elegida (volumen del slider, sin ducking) + fade out de 3s tras la voz.
  const handleExport = async () => {
    const voiceBlob = voiceBlobRef.current; if (!voiceBlob) return;
    if (!withMusic || !track) { downloadBlob(voiceBlob, 'voz.mp3'); return; }
    const t = cfg.tracks.find((x) => x.id === track); if (!t) return;
    setExporting(true); setExportErr(null);
    try {
      const mixed = await exportVoiceWithMusic({ voiceBlob, musicUrl: t.url, voiceVol, musicVol, fadeTailSec: 3 });
      downloadBlob(mixed, 'voz-musica.mp3');
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      setExportErr(/HTTP|fetch|cors|network/i.test(m)
        ? 'Esa pista no se puede mezclar todavía (sin CORS). Elegí una de las nuevas o exportá sin música.'
        : 'No se pudo exportar la mezcla.');
    } finally { setExporting(false); }
  };

  // Guardar la voz generada en la LIBRERÍA (IndexedDB) — se reusa en el editor.
  const addToLibrary = async () => {
    const blob = voiceBlobRef.current; if (!blob) return;
    const v = voices.find((x) => x.voice_id === voiceId);
    try {
      await addVoiceClip({ id: uid(), name: deriveName(text), voiceId, voiceName: v?.name || voiceId, dur: audioRef.current?.duration || 0, createdAt: Date.now(), blob });
      setSavedLib(true); setTimeout(() => setSavedLib(false), 1600);
    } catch { /* noop */ }
  };

  // Enter = play/pausa · Escape = cancela el rango armado (salvo escribiendo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'INPUT' || el?.isContentEditable;
      if (e.key === 'Escape' && pending) { setPending(null); return; }
      if (e.key !== 'Enter' || !url || typing) return;
      e.preventDefault(); toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, pending]);

  // Resize de la columna de texto (divisor arrastrable).
  const onDragStart = (e: React.PointerEvent) => { dragging.current = true; (e.target as Element).setPointerCapture(e.pointerId); };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = fila2Ref.current?.getBoundingClientRect(); if (!rect) return;
    setTextoW(Math.max(190, Math.min(rect.width - 320, e.clientX - rect.left)));
  };
  const onDragEnd = (e: React.PointerEvent) => { dragging.current = false; try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  // Agrupa el accent crudo en una REGIÓN lógica para el filtro de idioma.
  const langGroup = (accent?: string): string => {
    const a = (accent || '').toLowerCase().trim(); if (!a) return '';
    if (/(argentin|urugua|latin|mexic|colomb|chil|peru|spanish|español|castell)/.test(a)) return 'Latinoamericano';
    if (/brazil|portug/.test(a)) return 'Brasileño';
    if (/british|^uk|england/.test(a)) return 'Inglés (UK)';
    if (/australian|aussie/.test(a)) return 'Inglés (AU)';
    if (/american|^us|united states/.test(a)) return 'Inglés (US)';
    if (/irish|scott|welsh/.test(a)) return 'Inglés (UK)';
    return accent || '';
  };

  // ---- render helpers (estilos en VoiceStudio.css) ----
  const headRow = (title: React.ReactNode, color: string, id: string) => (
    <div className="vs-head" style={{ ['--accent']: color } as React.CSSProperties}>
      <span className="vs-head-title">{title}</span>
      <button onClick={() => tg(id)} title="Colapsar" className="vs-collapse-btn"><ChevronLeft size={13} /></button>
    </div>
  );
  const Slider = ({ label, val, set, min, max, step, hint, fmt }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step: number; hint?: string; fmt: (n: number) => string }) => (
    <div>
      <div className="vs-slider-row">
        <span className="vs-slider-label">{label}</span>
        <span className="vs-slider-val">{fmt(val)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="vs-range-gold" />
      {hint && <div className="vs-slider-hint">{hint}</div>}
    </div>
  );

  // ---- fuentes (control genérico) ----
  const fileItems = cfg.files.map((f) => ({ id: f.id, label: f.label, sub: f.sub, data: f }));
  const voiceItems = voices.map((v) => ({
    id: v.voice_id, label: v.name,
    meta: { gender: v.gender || '', age: v.age || '', lang: langGroup(v.accent) },
    searchText: `${v.accent || ''} ${v.use_case || ''} ${v.description || ''}`,
    data: v,
  }));
  const trackItems = cfg.tracks.map((t) => ({ id: t.id, label: t.label, meta: { cat: t.cat }, data: t }));

  // ---- footers (volúmenes / silencio) ----
  const voiceFooter = (
    <div className="vs-music-vol">
      <div className="vs-music-vol-row"><span className="vs-music-vol-label">Volumen</span><span className="vs-music-vol-val">{Math.round(sampleVol * 100)}%</span></div>
      <input type="range" min={0} max={1} step={0.05} value={sampleVol} onChange={(e) => { const v = Number(e.target.value); setSampleVol(v); const s = sampleRef.current; if (s) s.volume = v; }} className="vs-range-azure" />
      <div className="vs-music-vol-hint">volumen del preview de cada narrador</div>
    </div>
  );
  const musicFooter = (
    <>
      <div className="vs-music-vol">
        <div className="vs-music-vol-row"><span className="vs-music-vol-label">Volumen</span><span className="vs-music-vol-val">{Math.round(musicVol * 100)}%</span></div>
        <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => { const v = Number(e.target.value); setMusicVol(v); const m = musicRef.current; if (m) m.volume = v; }} className="vs-range-cyan" />
        <div className="vs-music-vol-hint">baja sola mientras suena la voz · Kevin MacLeod · incompetech.com (CC-BY)</div>
      </div>
      <button onClick={stopMusic} title="Silenciar música (escuchar solo la voz)" className="vs-track vs-silence"><VolumeX size={11} /> Silencio</button>
    </>
  );

  // ---- panel SOUND SETTINGS (no es fuente: sliders + presets + generar) ----
  const soundPanel = isOpen('sound') ? (
    <div className="vs-panel" style={{ ['--grow']: 272, ['--accent']: '#fff' } as React.CSSProperties}>
      {headRow(<>SOUND SETTINGS</>, '#fff', 'sound')}
      <div className="vs-sound">
        <div className="vs-sound-scroll">
          <div className="vs-presets">
            {VOICE_PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p)} className="vs-preset" title={`estab ${p.stability} · estilo ${p.style} · cadencia ${p.speed}×`}>{p.label}</button>
            ))}
          </div>
          <div className="vs-models">
            {[{ id: 'eleven_v3', label: 'v3' }, { id: 'eleven_multilingual_v2', label: 'v2' }, { id: 'eleven_flash_v2_5', label: 'flash' }].map((m) => (
              <button key={m.id} onClick={() => setModel(m.id)} className={model === m.id ? 'vs-model vs-model--on' : 'vs-model'}>{m.label}</button>
            ))}
          </div>
          <Slider label="Estabilidad" val={stability} set={setStability} min={0} max={1} step={0.05} hint="bajo = más expresivo" fmt={(v) => v.toFixed(2)} />
          <Slider label="Similitud" val={similarity} set={setSimilarity} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
          <Slider label="Estilo" val={style} set={setStyle} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
          <Slider label="Cadencia" val={speed} set={setSpeed} min={0.7} max={1.2} step={0.05} hint="0.7 lento — 1.2 rápido" fmt={(v) => `${v.toFixed(2)}×`} />
          <Slider label="Volumen voz" val={voiceVol} set={(v) => { setVoiceVol(v); const a = audioRef.current; if (a) a.volume = v; }} min={0} max={1} step={0.05} hint="volumen de reproducción local" fmt={(v) => `${Math.round(v * 100)}%`} />
          <label className="vs-check">
            <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} className="vs-check-box" /> Speaker boost
          </label>
        </div>
        <button onClick={generate} disabled={busy} className="vs-generate">
          <Mic size={15} /> {busy ? 'Generando…' : 'Generar voz'}
        </button>
        {err && <span className="vs-error">error: {err}</span>}
      </div>
    </div>
  ) : (
    <button onClick={() => tg('sound')} title="Expandir SOUND SETTINGS" className="vs-strip" style={{ ['--accent']: '#fff' } as React.CSSProperties}>
      <ChevronRight size={14} className="vs-strip-chevron" />
      <span className="vs-strip-label">SOUND SETTINGS</span>
    </button>
  );

  return (
    <div className="vs-root">
      {/* ===== FILA 1: fuentes (control genérico) + sound settings ===== */}
      <div className="vs-row1">
        <SourcePanel title={cfg.sourceTitle} accent={BRAND.gold} icon={<Files size={13} />} grow={210} view="list"
          items={fileItems} activeId={activeFile ?? undefined} onPick={(it) => loadFile(it.data as SourceFile)}
          open={isOpen('src')} onToggle={() => tg('src')} emptyText="sin guiones" />

        <SourcePanel title={`Voces (${voices.length})`} accent={BRAND.azure} icon={<Mic size={13} />} grow={282} view="chips"
          items={voiceItems} search activeId={voiceId}
          filters={[{ key: 'gender', label: 'Todas', options: GENDER_OPTS }, { key: 'age', label: 'Toda edad', options: AGE_OPTS }, { key: 'lang', label: 'Todo idioma' }]}
          onPick={(it) => previewVoice(it.data as Voice)} footer={voiceFooter}
          open={isOpen('voces')} onToggle={() => tg('voces')} emptyText={voices.length ? 'sin voces con esos filtros' : 'cargando…'} />

        <SourcePanel title="Música" accent="#22D3EE" icon={<Music2 size={13} />} grow={232} view="chips"
          items={trackItems} search filters={[{ key: 'cat', label: 'Todos' }]}
          activeId={musicOn && track ? track : undefined} onPick={(it) => pickTrack(it.data as Track)} footer={musicFooter}
          open={isOpen('musica')} onToggle={() => tg('musica')} />

        {soundPanel}
      </div>

      {/* ===== FILA 2: texto + waveform con divisor arrastrable ===== */}
      <div ref={fila2Ref} className="vs-row2">
        {/* GUIÓN — texto editable; con audio generado se pinta palabra por palabra (karaoke) */}
        <div className="vs-card vs-texto" style={{ ['--texto-w']: textoW + 'px' } as React.CSSProperties}>
          <div className="vs-texto-tabs">
            <button className="vs-texto-tab vs-texto-tab--on">GUIÓN</button>
          </div>
          {(peaks && !editingText) ? (
            <>
              <ScriptText text={text} markers={markers} activeRange={resolveRange(text, cursor, cursor)} />
              <button className="vs-texto-edit" onClick={() => setEditingText(true)}><Pencil size={12} /> Editar guión</button>
            </>
          ) : (
            <>
              <textarea ref={taRef} value={text} onChange={(e) => applyText(e.target.value)} spellCheck={false} className="vs-textarea" />
              <div className="vs-texto-hint">Solo el guión + puntuación (, ? !). La entonación, énfasis y pausas se marcan en la onda →{peaks ? ' · al generar/play se pinta solo.' : ''}</div>
            </>
          )}
        </div>

        {/* Divisor arrastrable */}
        <div onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} title="Arrastrá para redimensionar"
          className="vs-divider">
          <div className="vs-divider-grip" />
        </div>

        {/* WAVEFORM */}
        <div className="vs-card vs-wave">
          <div className="vs-section-title vs-section-title--gold">WAVEFORM</div>
          <div className="vs-marks">
            <button onClick={() => applyRange('emphasis', { label: 'énfasis', color: BRAND.gold })} className={pending?.kind === 'emphasis' ? 'vs-mk vs-mk--emphasis vs-mk--armed' : 'vs-mk vs-mk--emphasis'} title="Parate en el inicio, tocá ÉNFASIS, movés el slider y volvés a tocar para cerrar el rango">ÉNFASIS</button>
            <button onClick={() => applyPause('pause', { label: 'pausa', color: BRAND.gold })} className="vs-mk" title="Pausa en la posición del slider">Pausa</button>
            <button onClick={() => applyPause('pauseLong', { label: 'larga', color: BRAND.gold })} className="vs-mk" title="Pausa larga en la posición del slider">Pausa larga</button>
            {TONES.map((t) => (<button key={t.tag} onClick={() => applyRange('tone', { tag: t.tag, label: t.label, color: t.color })} title="Parate en el inicio, tocá el tono, movés el slider y volvés a tocar para cerrar el rango" className={pending?.tag === t.tag ? 'vs-mk vs-mk--accent vs-mk--armed' : 'vs-mk vs-mk--accent'} style={{ ['--accent']: t.color } as React.CSSProperties}>{t.label}</button>))}
            <button onClick={undo} disabled={!mHist.length} title="Deshacer (Undo)" className="vs-mk vs-mk--reset"><Undo2 size={12} /></button>
            <button onClick={clearMarkers} disabled={!markers.length && !pending} title="Limpiar markers (deja el texto)" className="vs-mk"><Eraser size={12} /></button>
            <button onClick={reset} title="Reiniciar todo" className="vs-mk"><RotateCcw size={12} /></button>
          </div>
          <div className="vs-wave-area">
            <CadenceWave text={text} peaks={peaks} cursor={cursor} pendingStart={pending ? pending.frac : null} pendingColor={pending?.color} markers={markers} onCursor={onCursor} onRemoveMarker={removeMarker} />
          </div>
          {/* botonera: rebobinar · play/pausa · stop + estado + export */}
          <div className="vs-transport">
            <button onClick={rewind} disabled={!url} title="Rebobinar" className="vs-rewind"><SkipBack size={16} /></button>
            <button onClick={toggle} disabled={!url} title={playing ? 'Pausa' : 'Play'} className="vs-play">{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <button onClick={stopAll} disabled={!url && !musicOn && !sampling} title="Stop — apaga voz, música, sample y vuelve a 0" className="vs-stop"><Square size={15} /></button>
            <span className={pending ? 'vs-status vs-status--armed' : !url ? 'vs-status vs-status--idle' : peaks ? 'vs-status vs-status--real' : 'vs-status'}>
              {pending
                ? `${pending.label} — movés el slider al final y volvés a tocar para cerrar (Esc cancela)`
                : !url ? 'Posicioná el slider y tocá un marker. «Generar voz» para el audio real.' : peaks ? 'audio real — deslizá para hacer seek' : 'editaste — regenerá la voz'}
            </span>
            {url && (
              <div className="vs-export-wrap">
                <label className={track ? 'vs-export-music' : 'vs-export-music vs-export-music--off'}
                  title={track ? 'Mezcla la pista de música elegida (volumen del slider) con fade out de 3s al final' : 'Elegí una pista en MÚSICA para activar la mezcla'}>
                  <input type="checkbox" className="vs-check-box" checked={withMusic && !!track} disabled={!track}
                    onChange={(e) => setWithMusic(e.target.checked)} />
                  música
                </label>
                <button onClick={handleExport} disabled={exporting} className="vs-export" title="Exportar mp3 (solo descarga)">
                  {exporting ? <Loader2 size={15} className="vs-spin" /> : <Download size={15} />}
                  {exporting ? 'Mezclando…' : 'Exportar mp3'}
                </button>
                <button onClick={addToLibrary} className="vs-export" title="Guardar esta voz en la librería (la reusás en el editor)">
                  {savedLib ? <Check size={15} /> : <Library size={15} />} {savedLib ? 'Guardada' : 'A la librería'}
                </button>
              </div>
            )}
          </div>
          {exportErr && <div className="vs-export-err">{exportErr}</div>}
        </div>
      </div>

      <audio ref={audioRef} onPlay={() => { setPlaying(true); duck(true); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); duck(false); }} onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setCursor(a.currentTime / a.duration); }} />
      <audio ref={musicRef} />
      <audio ref={sampleRef} onEnded={() => { setSampling(false); duck(false); }} />
    </div>
  );
}
