// Estudio de voz — editor tipo DAW. COMPONENTE INYECTABLE (iframe en otras apps).
// REGLAS DURAS de layout:
//  · FILA 1: TODOS los paneles de control (sean 4 o 10), cada uno colapsable.
//            Es una fila que scrollea horizontal si hay muchos.
//  · FILA 2: SOLO texto + waveform, con divisor ARRASTRABLE (resize de columna).
// Todo es DINÁMICO: la "fuente" (hoy reels de Munify) NO está hardcodeada — llega
// por config (postMessage `mediastudio:config` o window.MEDIASTUDIO_CONFIG), con
// fallback a los guiones baked. Otra app inyecta su propia fuente/tracks.
import { useEffect, useRef, useState } from 'react';
import { Mic, Download, Play, Pause, RotateCcw, Search, ChevronRight, ChevronLeft, Music2, Files, SkipBack, Square, VolumeX, Undo2, Eraser, Save } from 'lucide-react';
import { BRAND } from './lib/brand';
import { TTS_SERVICE_URL } from './config';
import { NARRATION } from './data/narrationText';
import CadenceWave, { TONES, resolveRange, type ScrubInfo, type PlacedMarker } from './CadenceWave';
import type { VoiceConfig } from './lib/projects';
import './VoiceStudio.css';

interface ReelCfg { slidesRef?: string | null; voiceConfig?: VoiceConfig | null }
interface VoiceStudioProps {
  reelConfig?: Record<string, ReelCfg>;                 // por reelId: boceto + settings guardados
  onGrabar?: (reelId: string, vc: VoiceConfig) => void; // persiste el settings del reel
}

interface Voice { voice_id: string; name: string; gender?: string; age?: string; accent?: string; use_case?: string; description?: string; preview_url?: string; }
interface SourceFile { id: string; label: string; text: string; sub?: string }
interface Track { id: string; label: string; url: string }
interface StudioConfig { sourceTitle: string; files: SourceFile[]; tracks: Track[]; text?: string }

// Defaults (caso Munify / standalone). Otra app los sobreescribe por config.
const REEL_LABELS: Record<string, string> = { tour: 'Tour general', vecino: 'Vecino', intendente: 'Intendente', tesoreria: 'Tesorería', ia: 'IA / WhatsApp' };
const MUSIC_BASE = 'https://app.munify.com.ar/reels-audio';
const DEFAULT_TRACKS: Track[] = [
  ['pop', 'Pop'], ['electro', 'Electrónica'], ['funk', 'Funk'], ['inspiradora', 'Inspiradora'],
  ['calida', 'Cálida'], ['indie', 'Indie'], ['cine', 'Cine'], ['epica', 'Épica'],
].map(([id, label]) => ({ id, label, url: `${MUSIC_BASE}/${id}.mp3` }));
const DEFAULT_CONFIG: StudioConfig = {
  sourceTitle: 'GUIONES',
  files: Object.keys(NARRATION).map((id) => ({ id, label: REEL_LABELS[id] || id, text: NARRATION[id].join('\n'), sub: `${NARRATION[id].length} frases` })),
  tracks: DEFAULT_TRACKS,
};
const DEFAULT_TEXT = '¿Tu municipio todavía maneja todo en papel?\nCon Munify ves toda tu gestión EN VIVO, en una sola pantalla.\nMunify. Tu municipio, al día.';

// Presets de voz (ElevenLabs): stability bajo = más expresivo/variable, alto =
// estable/uniforme; style sube la carga emocional; speed la cadencia.
const VOICE_PRESETS = [
  { label: 'Natural', stability: 0.5, similarity: 0.75, style: 0.15, speed: 1.0 },
  { label: 'Conversacional', stability: 0.4, similarity: 0.8, style: 0.35, speed: 1.0 },
  { label: 'Enérgico', stability: 0.3, similarity: 0.8, style: 0.6, speed: 1.05 },
  { label: 'Locución', stability: 0.7, similarity: 0.85, style: 0.1, speed: 0.95 },
];

let _actx: AudioContext | null = null;
const audioCtx = () => (_actx ||= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

export default function VoiceStudio({ reelConfig, onGrabar }: VoiceStudioProps = {}) {
  const initialText = (() => {
    if (typeof window === 'undefined') return DEFAULT_TEXT;
    const t = new URLSearchParams(window.location.search).get('text');
    return t && t.trim() ? t : DEFAULT_TEXT;
  })();
  const [text, setText] = useState(initialText);
  const [cfg, setCfg] = useState<StudioConfig>(DEFAULT_CONFIG);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState('yA5jrK1S9cpCAojBYyMu');
  const [qv, setQv] = useState('');
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
  const [progress, setProgress] = useState(0);           // avance de reproducción (0..1) para el playhead
  const [pick, setPick] = useState<ScrubInfo | null>(null); // punto marcado en la onda sintética
  const [voiceVol, setVoiceVol] = useState(1.0);
  const [track, setTrack] = useState<string | null>(null);
  const [musicVol, setMusicVol] = useState(0.7);
  const [musicOn, setMusicOn] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [textoW, setTextoW] = useState(330);
  const [markers, setMarkers] = useState<PlacedMarker[]>([]); // CAPA de markers sobre la onda (NO toca el texto)
  const [mHist, setMHist] = useState<PlacedMarker[][]>([]);   // historial de markers para Undo
  const [sampling, setSampling] = useState(false);       // sonando el sample de una voz
  const [saved, setSaved] = useState(false);             // toast tras Grabar
  const [textoTab, setTextoTab] = useState<'texto' | 'preview'>('texto');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const sampleRef = useRef<HTMLAudioElement>(null);      // preview de voz (como la música)
  const fila2Ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const isOpen = (id: string) => open[id] !== false;
  const tg = (id: string) => setOpen((o) => ({ ...o, [id]: o[id] === false }));
  // el texto es solo referencia; editarlo invalida el audio y recorta markers fuera de rango.
  const applyText = (t: string) => { setText(t); setPeaks(null); setProgress(0); setMarkers((ms) => ms.filter((m) => m.end <= t.length)); };
  // markers = capa propia; mutación con historial para Undo.
  const mutate = (next: PlacedMarker[]) => { setMHist((h) => [...h.slice(-49), markers]); setMarkers(next); };
  const undo = () => { setMHist((h) => { if (!h.length) return h; setMarkers(h[h.length - 1]); return h.slice(0, -1); }); };

  useEffect(() => { fetch(`${TTS_SERVICE_URL}/voices`).then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(() => {}); }, []);

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
    setActiveFile(f.id); setPick(null); setMHist([]); setSaved(false); setTextoTab('texto');
    // si el reel ya tiene settings guardado (Grabar), lo restauro; si no, arranca del guión.
    const vc = reelConfig?.[f.id]?.voiceConfig;
    if (vc) {
      setText(vc.text ?? f.text); setPeaks(null); setProgress(0);
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
  // GRABAR: persiste el settings del reel activo (voz + cadencia + pausas + markers + texto).
  const grabar = () => {
    if (!activeFile || !onGrabar) return;
    onGrabar(activeFile, { voice_id: voiceId, stability, similarity, style, speed, model, markers, text });
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  };
  const boceto = activeFile ? (reelConfig?.[activeFile]?.slidesRef ?? null) : null;

  // Scrub: en audio real hace seek; en sintético deja el punto/sector activo (pick).
  const onScrub = (info: ScrubInfo) => {
    if (peaks) { const a = audioRef.current; if (a && a.duration) { a.currentTime = info.frac * a.duration; setProgress(info.frac); } }
    else setPick(info);
  };
  // Coloca un MARKER sobre la onda en el punto/sector activo. NO toca el texto.
  // pausa/larga = punto (palabra del playhead); énfasis/tono = rango seleccionado.
  const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'm' + Date.now() + Math.round(Math.random() * 1e6));
  const addMarker = (kind: PlacedMarker['kind'], info: { tag?: string; label: string; color: string }) => {
    if (!pick) return; // primero marcá un punto/sector en la onda
    const r = resolveRange(text, pick.fracStart, pick.frac);
    if (!r) return;
    const isRange = kind === 'emphasis' || kind === 'tone';
    mutate([...markers, { id: uid(), kind, tag: info.tag, label: info.label, color: info.color, start: isRange ? r.ws : r.we, end: isRange ? r.we : r.we }]);
    setPick((p) => (p ? { frac: p.frac, fracStart: p.frac, ws: null, we: null } : p)); // limpia el rect, deja el playhead
  };
  const removeMarker = (id: string) => mutate(markers.filter((m) => m.id !== id));
  const clearMarkers = () => mutate([]);
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
  // Sample de la voz (como la música): reproduce el preview de ElevenLabs.
  const previewVoice = (v: Voice) => {
    setVoiceId(v.voice_id);
    const s = sampleRef.current; if (!s || !v.preview_url) return;
    s.src = v.preview_url; s.currentTime = 0; duck(true);
    s.play().then(() => setSampling(true)).catch(() => setSampling(false));
  };
  const applyPreset = (p: { stability: number; similarity: number; style: number; speed: number }) => {
    setStability(p.stability); setSimilarity(p.similarity); setStyle(p.style); setSpeed(p.speed);
  };
  const rewind = () => { const a = audioRef.current; if (!a) return; a.currentTime = 0; setProgress(0); a.play().then(() => setPlaying(true)).catch(() => {}); };
  const stopMusic = () => { const m = musicRef.current; if (m) m.pause(); setMusicOn(false); setTrack(null); };
  const stopAll = () => {
    const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; }
    const s = sampleRef.current; if (s) s.pause();
    stopMusic(); setPlaying(false); setSampling(false); setProgress(0);
  };
  const reset = () => { applyText(DEFAULT_TEXT); setPick(null); setMarkers([]); setMHist([]); setStability(0.4); setSimilarity(0.8); setStyle(0.5); setSpeed(1.0); setBoost(true); setUrl(null); };

  const pickTrack = (t: Track) => {
    const m = musicRef.current; if (!m) return;
    if (track === t.id && musicOn) { m.pause(); setMusicOn(false); return; }
    setTrack(t.id); m.src = t.url; m.loop = true; m.volume = musicVol; m.currentTime = 0;
    m.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
  };
  const duck = (down: boolean) => { const m = musicRef.current; if (m) m.volume = down ? musicVol * 0.45 : musicVol; };

  const generate = async () => {
    if (!text.trim() || !voiceId) return;
    setBusy(true); setErr(null); setProgress(0);
    // el texto queda intacto en el editor; acá lo combino con los markers de la onda.
    const ttsText = buildTtsText();
    try {
      const r = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText, voice_id: voiceId, model_id: model, stability, similarity_boost: similarity, style, speed, use_speaker_boost: boost }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} · ${(await r.text()).slice(0, 120)}`);
      const blob = await r.blob();
      if (url) URL.revokeObjectURL(url);
      const u = URL.createObjectURL(blob); setUrl(u);
      try {
        const ctx = audioCtx(); await ctx.resume();
        const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
        const ch = buf.getChannelData(0); const N = 260; const step = Math.max(1, Math.floor(ch.length / N));
        const pk: number[] = [];
        for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < step; j++) { const v = Math.abs(ch[i * step + j] || 0); if (v > m) m = v; } pk.push(m); }
        const mx = Math.max(...pk, 0.001); setPeaks(pk.map((v) => v / mx));
      } catch { setPeaks(null); }
      const a = audioRef.current; if (a) { a.src = u; a.volume = voiceVol; a.currentTime = 0; a.play().then(() => setPlaying(true)).catch(() => {}); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); } finally { setBusy(false); }
  };
  const toggle = () => { const a = audioRef.current; if (!a || !url) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };

  // Enter = play/pausa (salvo cuando estás escribiendo en un input/textarea).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !url) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || el?.isContentEditable) return;
      e.preventDefault(); toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Resize de la columna de texto (divisor arrastrable).
  const onDragStart = (e: React.PointerEvent) => { dragging.current = true; (e.target as Element).setPointerCapture(e.pointerId); };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = fila2Ref.current?.getBoundingClientRect(); if (!rect) return;
    setTextoW(Math.max(190, Math.min(rect.width - 320, e.clientX - rect.left)));
  };
  const onDragEnd = (e: React.PointerEvent) => { dragging.current = false; try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  const GENDERS: [string, string][] = [['female', 'Femeninas'], ['male', 'Masculinas'], ['', 'Otras']];
  const AGES: [string, string][] = [['young', 'Joven'], ['middle_aged', 'Adulta'], ['old', 'Mayor'], ['', '—']];
  const fil = voices.filter((v) => `${v.name} ${v.accent || ''} ${v.use_case || ''}`.toLowerCase().includes(qv.toLowerCase()));

  // ---- render helpers (estilos en VoiceStudio.css) ----
  // cabecera de panel: el título toma el color de acento del panel vía --accent.
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

  // ---- definición DINÁMICA de paneles de la fila 1 (sean 4 o 10) ----
  type Panel = { id: string; title: string; color: string; icon: React.ReactNode; width: number; body: React.ReactNode };
  const panels: Panel[] = [];
  if (cfg.files.length) panels.push({
    id: 'src', title: cfg.sourceTitle, color: BRAND.gold, icon: <Files size={13} />, width: 210,
    body: (
      <div className="vs-files">
        {cfg.files.map((f) => {
          const on = activeFile === f.id;
          return (
            <button key={f.id} onClick={() => loadFile(f)} className={on ? 'vs-file vs-file--on' : 'vs-file'}>
              {f.label}{f.sub && <span className="vs-file-sub">{f.sub}</span>}
            </button>
          );
        })}
      </div>
    ),
  });
  panels.push({
    id: 'voces', title: `VOCES (${voices.length})`, color: BRAND.azure, icon: <Mic size={13} />, width: 282,
    body: (
      <>
        <div className="vs-search">
          <Search size={12} color="rgba(255,255,255,0.4)" className="vs-search-icon" />
          <input value={qv} onChange={(e) => setQv(e.target.value)} placeholder="buscar…" className="vs-search-input" />
        </div>
        <div className="vs-voices">
          {GENDERS.map(([g, gl]) => {
            const inG = fil.filter((v) => (v.gender || '') === g); if (!inG.length) return null;
            return (
              <div key={g || 'x'} className="vs-voices-group">
                <div className="vs-voices-gender">{gl}</div>
                {AGES.map(([a, al]) => {
                  const inA = inG.filter((v) => (v.age || '') === a); if (!inA.length) return null;
                  return (
                    <div key={a || 'x'} className="vs-voices-age">
                      <div className="vs-voices-age-label">{al}</div>
                      <div className="vs-voices-chips">
                        {inA.map((v) => {
                          const on = voiceId === v.voice_id;
                          return (<button key={v.voice_id} onClick={() => previewVoice(v)} title={`${v.accent || ''} · ${v.description || ''} — click: escuchar sample`} className={on ? 'vs-voice vs-voice--on' : 'vs-voice'} style={{ ['--accent']: BRAND.azure } as React.CSSProperties}>{v.name}</button>);
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!voices.length && <div className="vs-empty">cargando…</div>}
        </div>
      </>
    ),
  });
  if (cfg.tracks.length) panels.push({
    id: 'musica', title: 'MÚSICA', color: '#22D3EE', icon: <Music2 size={13} />, width: 232,
    body: (
      <>
        <div className="vs-tracks" style={{ ['--accent']: '#22D3EE' } as React.CSSProperties}>
          {cfg.tracks.map((t) => {
            const on = track === t.id && musicOn;
            return (<button key={t.id} onClick={() => pickTrack(t)} className={on ? 'vs-track vs-track--on' : 'vs-track'}>{on ? <Pause size={10} /> : <Play size={10} />}{t.label}</button>);
          })}
          <button onClick={stopMusic} title="Silenciar música (escuchar solo la voz)" className={!musicOn ? 'vs-track vs-track--on' : 'vs-track'}><VolumeX size={10} /> Silencio</button>
        </div>
        <div className="vs-music-vol">
          <div className="vs-music-vol-row"><span className="vs-music-vol-label">Volumen</span><span className="vs-music-vol-val">{Math.round(musicVol * 100)}%</span></div>
          <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => { const v = Number(e.target.value); setMusicVol(v); const m = musicRef.current; if (m) m.volume = v; }} className="vs-range-cyan" />
          <div className="vs-music-vol-hint">baja sola mientras suena la voz</div>
        </div>
      </>
    ),
  });
  panels.push({
    id: 'sound', title: 'SOUND SETTINGS', color: '#fff', icon: null, width: 272,
    body: (
      <div className="vs-sound">
        {/* params scrollean si hace falta; el botón Generar queda SIEMPRE visible abajo */}
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
        {onGrabar && (
          <button onClick={grabar} disabled={!activeFile} className={saved ? 'vs-grabar vs-grabar--saved' : 'vs-grabar'} title="Guardar el settings de este reel (voz + cadencia + pausas + markers + texto)">
            <Save size={14} /> {saved ? 'Guardado ✓' : 'Grabar reel'}
          </button>
        )}
        {err && <span className="vs-error">error: {err}</span>}
      </div>
    ),
  });

  return (
    <div className="vs-root">
      {/* ===== FILA 1: TODOS los paneles de control, colapsables ===== */}
      <div className="vs-row1">
        {panels.map((p) => (
          isOpen(p.id) ? (
            <div key={p.id} className="vs-panel" style={{ ['--grow']: p.width, ['--accent']: p.color } as React.CSSProperties}>
              {headRow(<>{p.icon}{p.title}</>, p.color, p.id)}
              {p.body}
            </div>
          ) : (
            <button key={p.id} onClick={() => tg(p.id)} title={`Expandir ${p.title}`} className="vs-strip" style={{ ['--accent']: p.color } as React.CSSProperties}>
              <ChevronRight size={14} className="vs-strip-chevron" />
              <span className="vs-strip-label">{p.title}</span>
            </button>
          )
        ))}
      </div>

      {/* ===== FILA 2: texto + waveform con divisor arrastrable ===== */}
      <div ref={fila2Ref} className="vs-row2">
        {/* TEXTO / PREVIEW (el preview aparece como tab si el reel tiene boceto) */}
        <div className="vs-card vs-texto" style={{ ['--texto-w']: textoW + 'px' } as React.CSSProperties}>
          <div className="vs-texto-tabs">
            <button className={textoTab === 'texto' ? 'vs-texto-tab vs-texto-tab--on' : 'vs-texto-tab'} onClick={() => setTextoTab('texto')}>TEXTO</button>
            {boceto && <button className={textoTab === 'preview' ? 'vs-texto-tab vs-texto-tab--on' : 'vs-texto-tab'} onClick={() => setTextoTab('preview')}>PREVIEW</button>}
          </div>
          {textoTab === 'preview' && boceto ? (
            <div className="vs-preview"><video src={boceto} controls playsInline className="vs-preview-video" /></div>
          ) : (
            <>
              <textarea ref={taRef} value={text} onChange={(e) => { applyText(e.target.value); setPick(null); }} spellCheck={false} className="vs-textarea" />
              <div className="vs-texto-hint">Solo el guión + puntuación (, ? !). La entonación, énfasis y pausas se marcan en la onda →</div>
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
            <button onClick={() => addMarker('emphasis', { label: 'énfasis', color: BRAND.gold })} className="vs-mk vs-mk--emphasis" title="Clickeá/arrastrá un sector en la onda y aplicá énfasis">ÉNFASIS</button>
            <button onClick={() => addMarker('pause', { label: 'pausa', color: BRAND.gold })} className="vs-mk">Pausa</button>
            <button onClick={() => addMarker('pauseLong', { label: 'larga', color: BRAND.gold })} className="vs-mk">Pausa larga</button>
            {TONES.map((t) => (<button key={t.tag} onClick={() => addMarker('tone', { tag: t.tag, label: t.label, color: t.color })} title="Marcá un punto/sector en la onda y aplicá el tono" className="vs-mk vs-mk--accent" style={{ ['--accent']: t.color } as React.CSSProperties}>{t.label}</button>))}
            <button onClick={undo} disabled={!mHist.length} title="Deshacer (Undo)" className="vs-mk vs-mk--reset"><Undo2 size={12} /></button>
            <button onClick={clearMarkers} disabled={!markers.length} title="Limpiar markers (deja el texto)" className="vs-mk"><Eraser size={12} /></button>
            <button onClick={reset} title="Reiniciar todo" className="vs-mk"><RotateCcw size={12} /></button>
          </div>
          <div className="vs-wave-area">
            <CadenceWave text={text} peaks={peaks} playhead={peaks ? progress : (pick ? pick.frac : null)} sel={pick} markers={markers} onScrub={onScrub} onRemoveMarker={removeMarker} />
          </div>
          {/* botonera: rebobinar · play/pausa · stop + estado + export */}
          <div className="vs-transport">
            <button onClick={rewind} disabled={!url} title="Rebobinar" className="vs-rewind"><SkipBack size={16} /></button>
            <button onClick={toggle} disabled={!url} title={playing ? 'Pausa' : 'Play'} className="vs-play">{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <button onClick={stopAll} disabled={!url && !musicOn && !sampling} title="Stop — apaga voz, música, sample y vuelve a 0" className="vs-stop"><Square size={15} /></button>
            <span className={!url ? 'vs-status vs-status--idle' : peaks ? 'vs-status vs-status--real' : 'vs-status'}>
              {!url ? 'Deslizá el playhead y marcá pausas/acentos. «Generar voz» para el audio real.' : peaks ? 'audio real — deslizá para hacer seek' : 'editaste — regenerá'}
            </span>
            {url && <a href={url} download="voz.mp3" className="vs-export"><Download size={15} /> Exportar mp3</a>}
          </div>
        </div>
      </div>

      <audio ref={audioRef} onPlay={() => { setPlaying(true); duck(true); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); duck(false); }} onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setProgress(a.currentTime / a.duration); }} />
      <audio ref={musicRef} />
      <audio ref={sampleRef} onEnded={() => { setSampling(false); duck(false); }} />
    </div>
  );
}
