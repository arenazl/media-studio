// Pantalla KITS de voz — autorear + ESCUCHAR los perfiles de expresividad que las
// apps (SalesBot, etc.) portan. localStorage-first. El valor: tuneás voz + settings
// + tags + prompt y lo PROBÁS con audio real, después copiás el "kit JSON" a la app.
import { useEffect, useRef, useState } from 'react';
import { Boxes, Plus, Trash2, Play, Pause, Copy, Check, Save, Mic, Search } from 'lucide-react';
import { TTS_SERVICE_URL } from './config';
import { listKits, saveKit, deleteKit, buildPrompt, kitJson, type Kit } from './lib/kits';
import './KitsStudio.css';

interface Voice { voice_id: string; name: string; gender?: string; accent?: string; description?: string }
const ALL_TAGS: [string, string][] = [['[excited]', 'Entusiasmo'], ['[curious]', 'Curioso'], ['[serious]', 'Serio'], ['[whispers]', 'Susurro'], ['[sighs]', 'Suspiro'], ['[laughs]', 'Risa']];
const MODELS: [string, string][] = [['eleven_v3', 'v3 (tags)'], ['eleven_turbo_v2_5', 'turbo v2.5'], ['eleven_multilingual_v2', 'multi v2']];
const SAMPLE = 'Hola… ¿cómo va? Mirá, tengo algo que te va a INTERESAR. Es la promo del mes, sin vueltas.';

// pausas escritas → <break> (idéntico a buildTtsText) + sanitiza tags si no es v3.
function applyPauses(text: string, v3: boolean): string {
  let out = text.replace(/…|\.{3,}/g, (m) => ` <break time="${Math.min(0.3 + m.length * 0.08, 1.6).toFixed(2)}s"/> `);
  out = out.replace(/[ \t]{2,}/g, (m) => ` <break time="${Math.min(0.25 + (m.length - 1) * 0.1, 1.2).toFixed(2)}s"/> `);
  if (!v3) out = out.replace(/\[[a-z]+\]/g, '');
  return out.replace(/[ \t]{2,}/g, ' ').trim();
}

export default function KitsStudio() {
  const [kits, setKits] = useState<Kit[]>(() => listKits());
  const [sel, setSel] = useState<string | null>(() => listKits()[0]?.id ?? null);
  const [draft, setDraft] = useState<Kit | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [qv, setQv] = useState('');
  const [sample, setSample] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { fetch(`${TTS_SERVICE_URL}/voices`).then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(() => {}); }, []);
  useEffect(() => { const k = kits.find((x) => x.id === sel) ?? kits[0] ?? null; setDraft(k ? { ...k } : null); setUrl(null); setErr(null); }, [sel]); // eslint-disable-line

  const upd = (patch: Partial<Kit>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const toggleTag = (t: string) => setDraft((d) => (d ? { ...d, tags: d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t] } : d));
  const voiceName = (id: string) => voices.find((v) => v.voice_id === id)?.name || id.slice(0, 8);

  const nuevo = () => {
    const k: Kit = { id: '', nombre: 'Nuevo kit', estilo: '', voice_id: voices[0]?.voice_id || 'yA5jrK1S9cpCAojBYyMu', model: 'eleven_v3', stability: 0.4, similarity: 0.8, style: 0.4, speed: 1.0, tags: [], prompt: '', version: 1, updated_at: 0 };
    k.prompt = buildPrompt(k); setDraft(k); setSel(null); setUrl(null);
  };
  const guardar = () => {
    if (!draft) return;
    const k = saveKit(draft);
    setKits(listKits()); setSel(k.id); setDraft({ ...k });
    setSaved(true); window.setTimeout(() => setSaved(false), 1600);
  };
  const borrar = () => { if (!draft?.id) return; deleteKit(draft.id); const ks = listKits(); setKits(ks); setSel(ks[0]?.id ?? null); };
  const copiar = () => { if (!draft) return; navigator.clipboard?.writeText(JSON.stringify(kitJson(draft), null, 2)).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }).catch(() => {}); };
  const regenPrompt = () => draft && upd({ prompt: buildPrompt(draft) });

  const escuchar = async () => {
    if (!draft) return;
    const a = audioRef.current; if (a && !a.paused) { a.pause(); setPlaying(false); return; }
    setBusy(true); setErr(null);
    try {
      const v3 = draft.model === 'eleven_v3';
      const text = applyPauses(sample, v3);
      const r = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: draft.voice_id, model_id: draft.model, stability: draft.stability, similarity_boost: draft.similarity, style: draft.style, speed: draft.speed, use_speaker_boost: true }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const u = URL.createObjectURL(await r.blob()); setUrl(u);
      if (a) { a.src = u; a.play().then(() => setPlaying(true)).catch(() => {}); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); } finally { setBusy(false); }
  };

  const fil = voices.filter((v) => `${v.name} ${v.accent || ''}`.toLowerCase().includes(qv.toLowerCase()));
  const Slider = ({ label, val, set, min, max, step, fmt }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string }) => (
    <label className="ks-slider"><span className="ks-slider-top"><span>{label}</span><span className="ks-slider-val">{fmt(val)}</span></span>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="ks-range" /></label>
  );

  return (
    <div className="ks-root">
      <div className="ks-head"><Boxes size={16} /> Kits de voz <span className="ks-head-sub">— el perfil que cada app porta</span></div>

      <div className="ks-chips">
        {kits.map((k) => (
          <button key={k.id} className={draft?.id === k.id ? 'ks-chip ks-chip--on' : 'ks-chip'} onClick={() => setSel(k.id)}>{k.nombre} <span className="ks-chip-v">v{k.version}</span></button>
        ))}
        <button className="ks-chip ks-chip--new" onClick={nuevo}><Plus size={13} /> Nuevo</button>
      </div>

      {!draft ? <div className="ks-empty">No hay kits. Creá uno con «Nuevo».</div> : (
        <div className="ks-grid">
          {/* columna settings */}
          <div className="ks-card">
            <div className="ks-field"><span className="ks-label">Nombre</span><input value={draft.nombre} onChange={(e) => upd({ nombre: e.target.value })} className="ks-input" /></div>
            <div className="ks-field"><span className="ks-label">Estilo (cómo habla)</span><input value={draft.estilo} onChange={(e) => upd({ estilo: e.target.value })} placeholder="pausado, sensual, énfasis…" className="ks-input" /></div>
            <div className="ks-field"><span className="ks-label">Modelo</span>
              <div className="ks-chiprow">{MODELS.map(([id, l]) => <button key={id} className={draft.model === id ? 'ks-mini ks-mini--on' : 'ks-mini'} onClick={() => upd({ model: id })}>{l}</button>)}</div>
            </div>
            <Slider label="Estabilidad" val={draft.stability} set={(v) => upd({ stability: v })} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
            <Slider label="Similitud" val={draft.similarity} set={(v) => upd({ similarity: v })} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
            <Slider label="Estilo" val={draft.style} set={(v) => upd({ style: v })} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
            <Slider label="Cadencia" val={draft.speed} set={(v) => upd({ speed: v })} min={0.7} max={1.2} step={0.05} fmt={(v) => `${v.toFixed(2)}×`} />
            <div className="ks-field"><span className="ks-label">Tags permitidos</span>
              <div className="ks-chiprow">{ALL_TAGS.map(([t, l]) => <button key={t} className={draft.tags.includes(t) ? 'ks-mini ks-mini--on' : 'ks-mini'} onClick={() => toggleTag(t)}>{l}</button>)}</div>
            </div>
          </div>

          {/* columna voz + preview + prompt */}
          <div className="ks-card">
            <div className="ks-field"><span className="ks-label">Voz <b>· {voiceName(draft.voice_id)}</b></span>
              <div className="ks-search"><Search size={12} className="ks-search-ic" /><input value={qv} onChange={(e) => setQv(e.target.value)} placeholder="buscar voz…" className="ks-input ks-input--search" /></div>
              <div className="ks-voices">{fil.slice(0, 60).map((v) => <button key={v.voice_id} title={`${v.accent || ''} · ${v.description || ''}`} className={draft.voice_id === v.voice_id ? 'ks-voice ks-voice--on' : 'ks-voice'} onClick={() => upd({ voice_id: v.voice_id })}>{v.name}</button>)}{!voices.length && <span className="ks-muted">cargando voces…</span>}</div>
            </div>

            <div className="ks-field"><span className="ks-label">Probar (frase de muestra)</span>
              <textarea value={sample} onChange={(e) => setSample(e.target.value)} className="ks-textarea" rows={2} />
              <div className="ks-preview-row">
                <button onClick={escuchar} disabled={busy} className="ks-listen">{busy ? 'Generando…' : playing ? <><Pause size={13} /> Pausa</> : <><Play size={13} /> Escuchar</>}</button>
                {err && <span className="ks-err">error: {err}</span>}
                {url && !busy && !err && <span className="ks-muted">▸ con esta voz + settings</span>}
              </div>
            </div>

            <div className="ks-field"><span className="ks-label">expression_prompt <button onClick={regenPrompt} className="ks-regen">regenerar</button></span>
              <textarea value={draft.prompt} onChange={(e) => upd({ prompt: e.target.value })} className="ks-textarea ks-textarea--prompt" rows={4} />
            </div>
          </div>
        </div>
      )}

      {draft && (
        <div className="ks-foot">
          <span className="ks-foot-v">{draft.id ? `${draft.id} · v${draft.version}` : 'sin guardar'}</span>
          <button onClick={copiar} className="ks-btn">{copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar kit JSON</>}</button>
          {draft.id && <button onClick={borrar} className="ks-btn ks-btn--danger"><Trash2 size={13} /></button>}
          <button onClick={guardar} className={saved ? 'ks-btn ks-btn--primary ks-btn--ok' : 'ks-btn ks-btn--primary'}><Save size={13} /> {saved ? 'Guardado' : 'Guardar kit'}</button>
        </div>
      )}
      <audio ref={audioRef} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
    </div>
  );
}
