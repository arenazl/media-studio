// Etapa con "sector de prompt" que ejecuta trabajo interno vía Claude headless
// (backend local /api/claude). La usan Reel, Montaje y Export.
import { useState } from 'react';
import { Play, Loader2, Terminal } from 'lucide-react';
import './StageTab.css';

interface Props {
  title: string;
  color: string;
  description: string;
  placeholder: string;
  hint?: React.ReactNode;
}

export default function StageTab({ title, color, description, placeholder, hint }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!prompt.trim()) return;
    setBusy(true); setErr(null); setOut('');
    try {
      const r = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setOut(d.text || '(sin salida)');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'error — ¿está corriendo el backend local? (npm run studio)');
    } finally { setBusy(false); }
  };

  return (
    <div className="stage-root" style={{ ['--accent']: color } as React.CSSProperties}>
      <div>
        <div className="stage-title">{title}</div>
        <p className="stage-description">{description}</p>
      </div>

      <div className="stage-panel">
        <div className="stage-panel-label">
          <Terminal size={13} /> PROMPT (lo ejecuto yo por Claude headless)
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={placeholder} spellCheck={false}
          className="stage-textarea" />
        {hint && <div className="stage-hint">{hint}</div>}
        <button onClick={run} disabled={busy} className="stage-run-btn">
          {busy ? <Loader2 size={16} className="spin" /> : <Play size={16} />} {busy ? 'Ejecutando…' : 'Ejecutar con Claude'}
        </button>
        {err && <div className="stage-error">error: {err}</div>}
      </div>

      {out && (
        <div className="stage-result">
          <div className="stage-result-label">RESULTADO</div>
          <pre className="stage-result-pre">{out}</pre>
        </div>
      )}
    </div>
  );
}
