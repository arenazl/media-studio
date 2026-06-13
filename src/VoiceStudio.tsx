// Estudio de voz — editor tipo DAW. COMPONENTE INYECTABLE (iframe en otras apps).
// REGLAS DURAS de layout:
//  · FILA 1: TODOS los paneles de control (sean 4 o 10), cada uno colapsable.
//            Es una fila que scrollea horizontal si hay muchos.
//  · FILA 2: SOLO texto + waveform, con divisor ARRASTRABLE (resize de columna).
// Todo es DINÁMICO: la "fuente" (hoy reels de Munify) NO está hardcodeada — llega
// por config (postMessage `mediastudio:config` o window.MEDIASTUDIO_CONFIG), con
// fallback a los guiones baked. Otra app inyecta su propia fuente/tracks.
import { useEffect, useRef, useState } from 'react';
import { Mic, Download, Play, Pause, RotateCcw, Search, ChevronRight, ChevronLeft, Music2, Files } from 'lucide-react';
import { BRAND, FONT_SANS } from './lib/brand';
import { TTS_SERVICE_URL } from './config';
import { NARRATION } from './data/narrationText';
import CadenceWave, { TONES } from './CadenceWave';

interface Voice { voice_id: string; name: string; gender?: string; age?: string; accent?: string; use_case?: string; description?: string; }
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

let _actx: AudioContext | null = null;
const audioCtx = () => (_actx ||= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

export default function VoiceStudio() {
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
  const [track, setTrack] = useState<string | null>(null);
  const [musicVol, setMusicVol] = useState(0.7);
  const [musicOn, setMusicOn] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [textoW, setTextoW] = useState(330);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const fila2Ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const isOpen = (id: string) => open[id] !== false;
  const tg = (id: string) => setOpen((o) => ({ ...o, [id]: o[id] === false }));
  const applyText = (t: string) => { setText(t); setPeaks(null); };

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

  const loadFile = (f: SourceFile) => { setActiveFile(f.id); applyText(f.text); };

  const insertAtCursor = (before: string) => {
    const ta = taRef.current; if (!ta) { applyText(text + before); return; }
    const s = ta.selectionStart ?? text.length, e = ta.selectionEnd ?? text.length;
    applyText(text.slice(0, s) + before + text.slice(e));
    requestAnimationFrame(() => { ta.focus(); const p = s + before.length; ta.setSelectionRange(p, p); });
  };
  const emphasize = () => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart ?? 0, e = ta.selectionEnd ?? 0; if (s === e) return;
    applyText(text.slice(0, s) + text.slice(s, e).toUpperCase() + text.slice(e));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s, e); });
  };
  const reset = () => { applyText(DEFAULT_TEXT); setStability(0.4); setSimilarity(0.8); setStyle(0.5); setSpeed(1.0); setBoost(true); setUrl(null); };

  const pickTrack = (t: Track) => {
    const m = musicRef.current; if (!m) return;
    if (track === t.id && musicOn) { m.pause(); setMusicOn(false); return; }
    setTrack(t.id); m.src = t.url; m.loop = true; m.volume = musicVol; m.currentTime = 0;
    m.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
  };
  const duck = (down: boolean) => { const m = musicRef.current; if (m) m.volume = down ? musicVol * 0.45 : musicVol; };

  const generate = async () => {
    if (!text.trim() || !voiceId) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId, model_id: model, stability, similarity_boost: similarity, style, speed, use_speaker_boost: boost }),
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
      const a = audioRef.current; if (a) { a.src = u; a.currentTime = 0; a.play().then(() => setPlaying(true)).catch(() => {}); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); } finally { setBusy(false); }
  };
  const toggle = () => { const a = audioRef.current; if (!a || !url) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };

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

  // ---- estilos ----
  const card: React.CSSProperties = { display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 14, padding: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' };
  const mk: React.CSSProperties = { cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, padding: '5px 9px' };
  const collapseBtn: React.CSSProperties = { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' };
  const headRow = (title: React.ReactNode, color: string, id: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color }}>{title}</span>
      <button onClick={() => tg(id)} title="Colapsar" style={collapseBtn}><ChevronLeft size={13} /></button>
    </div>
  );
  const Slider = ({ label, val, set, min, max, step, hint, fmt }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step: number; hint?: string; fmt: (n: number) => string }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 11, color: BRAND.gold, fontWeight: 700 }}>{fmt(val)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ accentColor: BRAND.gold, width: '100%' }} />
      {hint && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{hint}</div>}
    </div>
  );

  // ---- definición DINÁMICA de paneles de la fila 1 (sean 4 o 10) ----
  type Panel = { id: string; title: string; color: string; icon: React.ReactNode; width: number; body: React.ReactNode };
  const panels: Panel[] = [];
  if (cfg.files.length) panels.push({
    id: 'src', title: cfg.sourceTitle, color: BRAND.gold, icon: <Files size={13} />, width: 210,
    body: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {cfg.files.map((f) => {
          const on = activeFile === f.id;
          return (
            <button key={f.id} onClick={() => loadFile(f)} style={{ textAlign: 'left', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', borderRadius: 8, padding: '7px 10px', background: on ? `${BRAND.gold}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? BRAND.gold : 'rgba(255,255,255,0.1)'}` }}>
              {f.label}{f.sub && <span style={{ display: 'block', fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{f.sub}</span>}
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
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={12} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 9, top: 7 }} />
          <input value={qv} onChange={(e) => setQv(e.target.value)} placeholder="buscar…" style={{ width: '100%', boxSizing: 'border-box', padding: '5px 10px 5px 27px', fontSize: 11.5, borderRadius: 8, color: '#fff', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
          {GENDERS.map(([g, gl]) => {
            const inG = fil.filter((v) => (v.gender || '') === g); if (!inG.length) return null;
            return (
              <div key={g || 'x'} style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: BRAND.gold, marginBottom: 3 }}>{gl}</div>
                {AGES.map(([a, al]) => {
                  const inA = inG.filter((v) => (v.age || '') === a); if (!inA.length) return null;
                  return (
                    <div key={a || 'x'} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{al}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {inA.map((v) => {
                          const on = voiceId === v.voice_id;
                          return (<button key={v.voice_id} onClick={() => setVoiceId(v.voice_id)} title={`${v.accent || ''} · ${v.description || ''}`} style={{ cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: 999, padding: '3px 8px', background: on ? `${BRAND.azure}30` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? BRAND.azure : 'rgba(255,255,255,0.12)'}` }}>{v.name}</button>);
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!voices.length && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>cargando…</div>}
        </div>
      </>
    ),
  });
  if (cfg.tracks.length) panels.push({
    id: 'musica', title: 'MÚSICA', color: '#22D3EE', icon: <Music2 size={13} />, width: 232,
    body: (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {cfg.tracks.map((t) => {
            const on = track === t.id && musicOn;
            return (<button key={t.id} onClick={() => pickTrack(t)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: '#fff', borderRadius: 999, padding: '4px 9px', background: on ? '#22D3EE30' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? '#22D3EE' : 'rgba(255,255,255,0.12)'}` }}>{on ? <Pause size={10} /> : <Play size={10} />}{t.label}</button>);
          })}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 11, fontWeight: 700 }}>Volumen</span><span style={{ fontSize: 10.5, color: '#22D3EE', fontWeight: 700 }}>{Math.round(musicVol * 100)}%</span></div>
          <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => { const v = Number(e.target.value); setMusicVol(v); const m = musicRef.current; if (m) m.volume = v; }} style={{ accentColor: '#22D3EE', width: '100%' }} />
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>baja sola mientras suena la voz</div>
        </div>
      </>
    ),
  });
  panels.push({
    id: 'sound', title: 'SOUND SETTINGS', color: '#fff', icon: null, width: 272,
    body: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minHeight: 0, flex: 1 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {[{ id: 'eleven_v3', label: 'v3' }, { id: 'eleven_multilingual_v2', label: 'v2' }, { id: 'eleven_flash_v2_5', label: 'flash' }].map((m) => (
            <button key={m.id} onClick={() => setModel(m.id)} style={{ cursor: 'pointer', fontSize: 10.5, fontWeight: 700, color: '#fff', borderRadius: 8, padding: '5px 7px', flex: 1, background: model === m.id ? `${BRAND.gold}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${model === m.id ? BRAND.gold : 'rgba(255,255,255,0.12)'}` }}>{m.label}</button>
          ))}
        </div>
        <Slider label="Estabilidad" val={stability} set={setStability} min={0} max={1} step={0.05} hint="bajo = más expresivo" fmt={(v) => v.toFixed(2)} />
        <Slider label="Similitud" val={similarity} set={setSimilarity} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Slider label="Estilo" val={style} set={setStyle} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Slider label="Cadencia" val={speed} set={setSpeed} min={0.7} max={1.2} step={0.05} hint="0.7 lento — 1.2 rápido" fmt={(v) => `${v.toFixed(2)}×`} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 11.5, fontWeight: 700 }}>
          <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} style={{ accentColor: BRAND.gold, width: 14, height: 14 }} /> Speaker boost
        </label>
        <button onClick={generate} disabled={busy} style={{ marginTop: 'auto', cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 11, border: 'none', background: busy ? 'rgba(255,255,255,0.15)' : BRAND.gold, color: busy ? '#fff' : BRAND.ink, fontWeight: 800, fontSize: 14 }}>
          <Mic size={15} /> {busy ? 'Generando…' : 'Generar voz'}
        </button>
        {err && <span style={{ fontSize: 10.5, color: '#ef4444' }}>error: {err}</span>}
      </div>
    ),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 104px)', minHeight: 540, fontFamily: FONT_SANS, color: '#fff' }}>
      {/* ===== FILA 1: TODOS los paneles de control, colapsables, scroll horizontal ===== */}
      <div style={{ display: 'flex', gap: 12, flex: '0 0 226px', minHeight: 0, overflowX: 'auto', paddingBottom: 2 }}>
        {panels.map((p) => (
          isOpen(p.id) ? (
            <div key={p.id} style={{ ...card, flex: `0 0 ${p.width}px`, overflowY: 'auto' }}>
              {headRow(<>{p.icon}{p.title}</>, p.color, p.id)}
              {p.body}
            </div>
          ) : (
            <button key={p.id} onClick={() => tg(p.id)} title={`Expandir ${p.title}`} style={{ flex: '0 0 42px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
              <ChevronRight size={14} color={p.color} />
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: p.color, whiteSpace: 'nowrap' }}>{p.title}</span>
            </button>
          )
        ))}
      </div>

      {/* ===== FILA 2: texto + waveform con divisor arrastrable ===== */}
      <div ref={fila2Ref} style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {/* TEXTO */}
        <div style={{ ...card, flex: `0 0 ${textoW}px`, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#fff', marginBottom: 9 }}>TEXTO</div>
          <textarea ref={taRef} value={text} onChange={(e) => applyText(e.target.value)} spellCheck={false}
            style={{ flex: 1, minHeight: 100, resize: 'none', borderRadius: 12, padding: 13, fontSize: 14.5, lineHeight: 1.7, fontFamily: FONT_SANS, color: '#fff', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }} />
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.4 }}>La puntuación (, . ? !) ya moldea la cadencia. Marcá más desde la onda →</div>
        </div>

        {/* Divisor arrastrable */}
        <div onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} title="Arrastrá para redimensionar"
          style={{ flex: '0 0 12px', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 4, height: 46, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* WAVEFORM */}
        <div style={{ ...card, flex: '1 1 0', minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: BRAND.gold, marginBottom: 9 }}>WAVEFORM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <button onClick={emphasize} style={{ ...mk, color: BRAND.ink, background: BRAND.gold, border: 'none', fontWeight: 800 }} title="Seleccioná texto y marcá énfasis (MAYÚS)">ÉNFASIS</button>
            <button onClick={() => insertAtCursor(' — ')} style={mk}>Pausa</button>
            <button onClick={() => insertAtCursor(' … ')} style={mk}>Pausa larga</button>
            <button onClick={() => insertAtCursor('?')} style={{ ...mk, color: '#22D3EE', borderColor: '#22D3EE66' }}>?</button>
            <button onClick={() => insertAtCursor('!')} style={{ ...mk, color: '#EC4899', borderColor: '#EC489966' }}>!</button>
            {TONES.map((t) => (<button key={t.tag} onClick={() => insertAtCursor(' ' + t.tag + ' ')} style={{ ...mk, borderColor: `${t.color}66`, color: t.color }}>{t.label}</button>))}
            <button onClick={reset} title="Reiniciar" style={{ ...mk, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={12} /></button>
          </div>
          <div style={{ flex: 1, minHeight: 130, borderRadius: 12, padding: '10px 8px', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <CadenceWave text={text} peaks={peaks} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, minHeight: 44 }}>
            {url ? (
              <>
                <button onClick={toggle} style={{ cursor: 'pointer', width: 44, height: 44, borderRadius: 12, border: 'none', background: BRAND.gold, color: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
                <span style={{ fontSize: 11.5, color: peaks ? '#34d399' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{peaks ? 'audio real generado' : 'editaste — regenerá'}</span>
                <a href={url} download="voz.mp3" style={{ marginLeft: 'auto', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, background: BRAND.azure, color: '#fff', fontWeight: 800, fontSize: 13 }}><Download size={15} /> Exportar mp3</a>
              </>
            ) : (
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>Onda de cadencia en vivo. Apretá «Generar voz» para el audio real.</span>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} onPlay={() => { setPlaying(true); duck(true); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); duck(false); }} />
      <audio ref={musicRef} />
    </div>
  );
}
