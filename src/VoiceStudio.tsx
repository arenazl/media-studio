// Estudio de voz — layout de editor (tipo DAW), paneles colapsables.
// FILA 1: REELS · VOCES · MÚSICA · SOUND SETTINGS (controles).
// FILA 2: TEXTO (chico) · WAVEFORM (la base) con toolbar de markers arriba.
// La waveform se redibuja en vivo desde el texto; al generar muestra el audio real.
// App-agnóstica; genera contra el media-service. Soporta ?text= para precargar.
import { useEffect, useRef, useState } from 'react';
import { Mic, Download, Play, Pause, RotateCcw, Search, ChevronRight, ChevronLeft, Music2, Film } from 'lucide-react';
import { BRAND, FONT_SANS } from './lib/brand';
import { TTS_SERVICE_URL } from './config';
import { NARRATION } from './data/narrationText';
import CadenceWave, { TONES } from './CadenceWave';

interface Voice { voice_id: string; name: string; gender?: string; age?: string; accent?: string; use_case?: string; description?: string; }

const REEL_LABELS: Record<string, string> = { tour: 'Tour general', vecino: 'Vecino', intendente: 'Intendente', tesoreria: 'Tesorería', ia: 'IA / WhatsApp' };
const MUSIC_BASE = 'https://app.munify.com.ar/reels-audio';
const TRACKS = [
  { id: 'pop', label: 'Pop' }, { id: 'electro', label: 'Electrónica' }, { id: 'funk', label: 'Funk' }, { id: 'inspiradora', label: 'Inspiradora' },
  { id: 'calida', label: 'Cálida' }, { id: 'indie', label: 'Indie' }, { id: 'cine', label: 'Cine' }, { id: 'epica', label: 'Épica' },
];
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
  const [reel, setReel] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState('yA5jrK1S9cpCAojBYyMu');
  const [q, setQ] = useState('');
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
  // Paneles colapsables.
  const [open, setOpen] = useState({ reels: true, voces: true, musica: true, sound: true, texto: true, wave: true });
  const tg = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const taRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { fetch(`${TTS_SERVICE_URL}/voices`).then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(() => {}); }, []);

  // Toda mutación de texto pasa por acá: invalida la onda real (vuelve a sintética).
  const applyText = (t: string) => { setText(t); setPeaks(null); };
  const loadReel = (id: string) => { setReel(id); applyText((NARRATION[id] || []).join('\n')); };

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

  const duck = (down: boolean) => { const m = musicRef.current; if (m) m.volume = down ? musicVol * 0.45 : musicVol; };
  const pickTrack = (id: string) => {
    const m = musicRef.current; if (!m) return;
    if (track === id && musicOn) { m.pause(); setMusicOn(false); return; }
    setTrack(id); m.src = `${MUSIC_BASE}/${id}.mp3`; m.loop = true; m.volume = musicVol; m.currentTime = 0;
    m.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
  };

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

  const GENDERS: [string, string][] = [['female', 'Femeninas'], ['male', 'Masculinas'], ['', 'Otras']];
  const AGES: [string, string][] = [['young', 'Joven'], ['middle_aged', 'Adulta'], ['old', 'Mayor'], ['', '—']];
  const fil = voices.filter((v) => `${v.name} ${v.accent || ''} ${v.use_case || ''}`.toLowerCase().includes(q.toLowerCase()));

  // ---- estilos compartidos ----
  const card: React.CSSProperties = { display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 14, padding: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' };
  const mk: React.CSSProperties = { cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, padding: '5px 9px' };
  const collapseBtn: React.CSSProperties = { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' };

  const Head = ({ title, color, onCollapse, icon }: { title: string; color: string; onCollapse: () => void; icon?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color }}>{icon}{title}</span>
      <button onClick={onCollapse} title={`Colapsar ${title}`} style={collapseBtn}><ChevronLeft size={13} /></button>
    </div>
  );
  const Strip = ({ title, color, onOpen }: { title: string; color: string; onOpen: () => void }) => (
    <button onClick={onOpen} title={`Expandir ${title}`} style={{ flex: '0 0 42px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
      <ChevronRight size={14} color={color} />
      <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color }}>{title}</span>
    </button>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 104px)', minHeight: 540, fontFamily: FONT_SANS, color: '#fff' }}>
      {/* ===== FILA 1: controles ===== */}
      <div style={{ display: 'flex', gap: 12, flex: '0 0 224px', minHeight: 0 }}>
        {/* REELS / archivos */}
        {open.reels ? (
          <div style={{ ...card, flex: '1 1 0', overflowY: 'auto' }}>
            <Head title="REELS" color={BRAND.gold} icon={<Film size={13} />} onCollapse={() => tg('reels')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {Object.keys(NARRATION).map((id) => {
                const on = reel === id;
                return (
                  <button key={id} onClick={() => loadReel(id)} style={{ textAlign: 'left', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', borderRadius: 8, padding: '7px 10px', background: on ? `${BRAND.gold}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? BRAND.gold : 'rgba(255,255,255,0.1)'}` }}>
                    {REEL_LABELS[id] || id}
                    <span style={{ display: 'block', fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{(NARRATION[id] || []).length} frases</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : <Strip title="REELS" color={BRAND.gold} onOpen={() => tg('reels')} />}

        {/* VOCES */}
        {open.voces ? (
          <div style={{ ...card, flex: '1.3 1 0' }}>
            <Head title={`VOCES (${voices.length})`} color={BRAND.azure} icon={<Mic size={13} />} onCollapse={() => tg('voces')} />
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={12} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 9, top: 7 }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar…" style={{ width: '100%', boxSizing: 'border-box', padding: '5px 10px 5px 27px', fontSize: 11.5, borderRadius: 8, color: '#fff', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }} />
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
          </div>
        ) : <Strip title="VOCES" color={BRAND.azure} onOpen={() => tg('voces')} />}

        {/* MÚSICA */}
        {open.musica ? (
          <div style={{ ...card, flex: '1 1 0', overflowY: 'auto' }}>
            <Head title="MÚSICA" color="#22D3EE" icon={<Music2 size={13} />} onCollapse={() => tg('musica')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {TRACKS.map((t) => {
                const on = track === t.id && musicOn;
                return (<button key={t.id} onClick={() => pickTrack(t.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: '#fff', borderRadius: 999, padding: '4px 9px', background: on ? '#22D3EE30' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? '#22D3EE' : 'rgba(255,255,255,0.12)'}` }}>{on ? <Pause size={10} /> : <Play size={10} />}{t.label}</button>);
              })}
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 11, fontWeight: 700 }}>Volumen música</span><span style={{ fontSize: 10.5, color: '#22D3EE', fontWeight: 700 }}>{Math.round(musicVol * 100)}%</span></div>
              <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => { const v = Number(e.target.value); setMusicVol(v); const m = musicRef.current; if (m) m.volume = v; }} style={{ accentColor: '#22D3EE', width: '100%' }} />
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>baja sola mientras suena la voz</div>
            </div>
          </div>
        ) : <Strip title="MÚSICA" color="#22D3EE" onOpen={() => tg('musica')} />}

        {/* SOUND SETTINGS */}
        {open.sound ? (
          <div style={{ ...card, flex: '1.25 1 0', overflowY: 'auto', gap: 9 }}>
            <Head title="SOUND SETTINGS" color="#fff" onCollapse={() => tg('sound')} />
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
        ) : <Strip title="SOUND SETTINGS" color="#fff" onOpen={() => tg('sound')} />}
      </div>

      {/* ===== FILA 2: editor (texto + waveform) ===== */}
      <div style={{ display: 'flex', gap: 12, flex: '1 1 0', minHeight: 0 }}>
        {/* TEXTO */}
        {open.texto ? (
          <div style={{ ...card, flex: open.wave ? '0 0 320px' : '1 1 0', minWidth: 0 }}>
            <Head title="TEXTO" color="#fff" onCollapse={() => tg('texto')} />
            <textarea ref={taRef} value={text} onChange={(e) => applyText(e.target.value)} spellCheck={false}
              style={{ flex: 1, minHeight: 100, resize: 'none', borderRadius: 12, padding: 13, fontSize: 14.5, lineHeight: 1.7, fontFamily: FONT_SANS, color: '#fff', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }} />
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.4 }}>La puntuación (, . ? !) ya moldea la cadencia. Marcá más desde la onda →</div>
          </div>
        ) : <Strip title="TEXTO" color="#fff" onOpen={() => tg('texto')} />}

        {/* WAVEFORM */}
        {open.wave ? (
          <div style={{ ...card, flex: '1 1 0', minWidth: 0 }}>
            <Head title="WAVEFORM" color={BRAND.gold} onCollapse={() => tg('wave')} />
            {/* toolbar de markers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <button onClick={emphasize} style={{ ...mk, color: BRAND.ink, background: BRAND.gold, border: 'none', fontWeight: 800 }} title="Seleccioná texto y marcá énfasis (MAYÚS)">ÉNFASIS</button>
              <button onClick={() => insertAtCursor(' — ')} style={mk}>Pausa</button>
              <button onClick={() => insertAtCursor(' … ')} style={mk}>Pausa larga</button>
              <button onClick={() => insertAtCursor('?')} style={{ ...mk, color: '#22D3EE', borderColor: '#22D3EE66' }}>?</button>
              <button onClick={() => insertAtCursor('!')} style={{ ...mk, color: '#EC4899', borderColor: '#EC489966' }}>!</button>
              {TONES.map((t) => (<button key={t.tag} onClick={() => insertAtCursor(' ' + t.tag + ' ')} style={{ ...mk, borderColor: `${t.color}66`, color: t.color }}>{t.label}</button>))}
              <button onClick={reset} title="Reiniciar" style={{ ...mk, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={12} /></button>
            </div>
            {/* onda */}
            <div style={{ flex: 1, minHeight: 130, borderRadius: 12, padding: '10px 8px', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <CadenceWave text={text} peaks={peaks} />
            </div>
            {/* transport (aparece al generar) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, minHeight: 44 }}>
              {url ? (
                <>
                  <button onClick={toggle} style={{ cursor: 'pointer', width: 44, height: 44, borderRadius: 12, border: 'none', background: BRAND.gold, color: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
                  <span style={{ fontSize: 11.5, color: peaks ? '#34d399' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{peaks ? 'audio real generado' : 'onda de cadencia (preview) — editaste, regenerá'}</span>
                  <a href={url} download="voz.mp3" style={{ marginLeft: 'auto', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, background: BRAND.azure, color: '#fff', fontWeight: 800, fontSize: 13 }}><Download size={15} /> Exportar mp3</a>
                </>
              ) : (
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>Onda de cadencia en vivo. Apretá «Generar voz» para el audio real.</span>
              )}
            </div>
          </div>
        ) : <Strip title="WAVEFORM" color={BRAND.gold} onOpen={() => tg('wave')} />}
      </div>

      <audio ref={audioRef} onPlay={() => { setPlaying(true); duck(true); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); duck(false); }} />
      <audio ref={musicRef} />
    </div>
  );
}
