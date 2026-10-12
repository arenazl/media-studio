// Orquestador (2026-10-10): el prompt del molde del paso activo, armado para ESTA pieza sin llamar al modelo, visto
// por capas (como el motor de 9 capas de Habláh): número, título, naturaleza (estático / preset / dinámico), el
// texto que entra y "para cambiar algo acá: ...". Pestaña "Prompt" con el texto literal. Es la mesa de trabajo
// para entender qué cambia el prompt y ajustar hasta dar con el algoritmo de creación.
import { useCallback, useEffect, useState } from 'react';
import { X, Copy, Check, Layers, RefreshCw, FileText } from 'lucide-react';
import { API_BASE } from './config';
import type { Project } from './lib/projects';
import type { Comercial } from './lib/comercial';
import { MOLDES, moldeDelPaso, piezaYOpciones, type MoldeId, type CapasRespuesta } from './lib/orquestador';
import { bodyMolde } from './pasos/pasoKit';
import './Orquestador.css';

const NATURALEZA: Record<string, { label: string; nota: string }> = {
  estatico: { label: 'Estático', nota: 'texto fijo del molde' },
  preset: { label: 'Preset', nota: 'elegido: perfil, enfoque, tratamiento, formato' },
  dinamico: { label: 'Dinámico', nota: 'sale de la app y de los pasos anteriores' },
};

export default function Orquestador({ project, comercial, paso, onClose }: { project: Project; comercial: Comercial | undefined; paso: string; onClose: () => void }) {
  const [molde, setMolde] = useState<MoldeId>(moldeDelPaso(paso));
  const [vista, setVista] = useState<'capas' | 'prompt'>('capas');
  const [data, setData] = useState<CapasRespuesta | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { setMolde(moldeDelPaso(paso)); }, [paso]);

  const cargar = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const { piece, options } = piezaYOpciones(molde, project, comercial);
      const body = bodyMolde(molde, project, piece, options, undefined, comercial);
      const r = await fetch(`${API_BASE}/api/orquestador/capas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no pude armar el prompt');
      setData(d as CapasRespuesta);
    } catch (e) { setError(e instanceof Error ? e.message : 'error'); setData(null); } finally { setBusy(false); }
  }, [molde, project, comercial]);

  useEffect(() => { cargar(); }, [cargar]);

  const copiar = async () => {
    if (!data?.prompt) return;
    try { await navigator.clipboard.writeText(data.prompt); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* sin portapapeles */ }
  };

  return (
    <section className="orq" aria-label="Orquestador">
      <header className="orq-head">
        <span className="orq-eyebrow"><Layers size={14} /> Orquestador</span>
        <span className="orq-sub">El prompt que se manda, armado para esta pieza sin correrlo. Tocá una capa para ver de dónde sale.</span>
        <span style={{ flex: 1 }} />
        <button className="orq-btn" onClick={cargar} disabled={busy} title="Volver a armar"><RefreshCw size={13} className={busy ? 'paso-spin' : ''} /></button>
        <button className="orq-btn" onClick={onClose} title="Cerrar"><X size={14} /></button>
      </header>

      <div className="orq-tabs">
        {MOLDES.map((m) => (
          <button key={m.id} className={m.id === molde ? 'orq-tab orq-tab--on' : 'orq-tab'} onClick={() => setMolde(m.id)}>{m.label}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button className={vista === 'capas' ? 'orq-tab orq-tab--on' : 'orq-tab'} onClick={() => setVista('capas')}><Layers size={12} /> Capas</button>
        <button className={vista === 'prompt' ? 'orq-tab orq-tab--on' : 'orq-tab'} onClick={() => setVista('prompt')}><FileText size={12} /> Prompt</button>
      </div>

      {data && (
        <div className="orq-chips">
          {data.chips.map((c) => <span key={c.k} className="orq-chip"><b>{c.k}</b> {c.v}</span>)}
          <span className="orq-chip orq-chip--dim"><b>versión</b> {data.promptVersion}</span>
          <span className="orq-chip orq-chip--dim"><b>largo</b> {data.totalPalabras} palabras · {data.capas.length} capas</span>
        </div>
      )}

      <div className="orq-leyenda">
        {Object.entries(NATURALEZA).map(([k, v]) => <span key={k} className={`orq-tag orq-tag--${k}`} title={v.nota}>{v.label}</span>)}
      </div>

      {error && <div className="paso-error">{error}</div>}
      {!error && !data && <div className="paso-empty">Armando el prompt…</div>}
      {data && data.compilado && <div className="paso-empty">Este molde es determinístico: no hay prompt, el pack se compila del storyboard sin IA.</div>}

      {data && !data.compilado && vista === 'capas' && (
        <div className="orq-capas">
          {data.capas.map((c) => (
            <article key={c.n} className={`orq-capa orq-capa--${c.naturaleza}`}>
              <div className="orq-capa-h">
                <span className="orq-capa-n">{c.n}</span>
                <span className="orq-capa-t">{c.titulo}</span>
                <span className="orq-capa-w">{c.palabras} palabras</span>
                <span className={`orq-tag orq-tag--${c.naturaleza}`}>{NATURALEZA[c.naturaleza]?.label || c.naturaleza}</span>
              </div>
              <pre className="orq-pre">{c.texto}</pre>
              <div className="orq-origen"><b>Para cambiar algo acá:</b> {c.origen}</div>
            </article>
          ))}
        </div>
      )}

      {data && !data.compilado && vista === 'prompt' && (
        <div className="orq-prompt">
          <div className="orq-prompt-bar">
            <span>Prompt literal · {data.totalPalabras} palabras</span>
            <button className="orq-btn" onClick={copiar}>{copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'copiado' : 'copiar'}</button>
          </div>
          <pre className="orq-pre orq-pre--full">{data.prompt}</pre>
        </div>
      )}
    </section>
  );
}
