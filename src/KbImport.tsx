// Pantalla "Nuevo proyecto desde una Integración" (consumidor del KSP).
// Combo de Integraciones (del registro apps.json, vía backend) → Importar → trae el KB →
// con IA arma un PROSPECTO + PROPUESTA DE TRABAJO. La generación de reels es la 2da etapa.
import { useEffect, useState } from 'react';
import { Building2, Download, Loader2, Sparkles, X, ArrowRight, Check } from 'lucide-react';
import { API_BASE } from './config';
import { kbToProjectInput, type KnowledgeBase } from './lib/knowledgeBase';
import { saveProject, type Project } from './lib/projects';
import './KbImport.css';

interface AppItem { id: string; name: string; base_url: string; ready: boolean }
interface Pieza { objetivo: string; angulo: string; formato: string; duracionSeg?: number }
interface Plan { prospecto: string; publico?: string[]; propuesta: { perfil: string; piezas: Pieza[]; resumen: string } }
type Phase = 'idle' | 'fetching' | 'planning' | 'done' | 'error';

export default function KbImport({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [appId, setAppId] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState('');
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/kb/apps`).then((r) => r.json())
      .then((d) => { const list: AppItem[] = d.apps || []; setApps(list); const first = list.find((a) => a.ready); if (first) setAppId(first.id); })
      .catch(() => setErr('no pude leer el registro de Integraciones'));
  }, []);

  const importar = async () => {
    if (!appId) return;
    setErr(''); setKb(null); setPlan(null); setPhase('fetching');
    try {
      const r = await fetch(`${API_BASE}/api/kb/fetch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'no se pudo traer el KB');
      setKb(d.kb); setPhase('planning');
      const r2 = await fetch(`${API_BASE}/api/kb/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kb: d.kb }) });
      const d2 = await r2.json(); if (!r2.ok) throw new Error(d2.error || 'no se pudo armar la propuesta');
      setPlan(d2.plan); setPhase('done');
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); setPhase('error'); }
  };

  const crear = () => {
    if (!kb) return;
    const inp = kbToProjectInput(kb);
    const proj = saveProject({ name: inp.name, type: inp.type, brief: inp.brief, brandKit: inp.brandKit, contentType: 'combinado' });
    onCreated(proj);
  };

  const busy = phase === 'fetching' || phase === 'planning';
  const biz = kb?.business;

  return (
    <div className="kbi-root">
      <div className="kbi-head">
        <div className="kbi-title"><Building2 size={18} /> Nuevo proyecto desde una Integración</div>
        <button className="kbi-close" onClick={onClose} title="Cerrar"><X size={16} /></button>
      </div>

      <div className="kbi-bar">
        <span className="kbi-bar-label">Integración:</span>
        <div className="kbi-apps">
          {apps.map((a) => (
            <button key={a.id} disabled={!a.ready || busy}
              className={appId === a.id ? 'kbi-chip kbi-chip--on' : 'kbi-chip'}
              title={a.ready ? a.base_url : 'sin URL en el registro'}
              onClick={() => setAppId(a.id)}>{a.name}{!a.ready && ' ·'}</button>
          ))}
          {!apps.length && <span className="kbi-muted">leyendo registro…</span>}
        </div>
        <button className="kbi-import" disabled={!appId || busy} onClick={importar}>
          {busy ? <Loader2 size={15} className="kbi-spin" /> : <Download size={15} />}
          {phase === 'fetching' ? 'Trayendo KB…' : phase === 'planning' ? 'Pensando con IA…' : 'Importar'}
        </button>
      </div>

      {err && <div className="kbi-error">{err}</div>}

      {busy && (
        <div className="kbi-loading">
          <Loader2 size={28} className="kbi-spin" />
          <p>{phase === 'fetching' ? 'Leyendo el Knowledge Base de la Integración…' : 'Analizando el negocio y armando la propuesta de campaña…'}</p>
        </div>
      )}

      {phase === 'done' && kb && plan && (
        <div className="kbi-result">
          {/* negocio */}
          <section className="kbi-card kbi-biz">
            <h3>{biz?.name}</h3>
            {biz?.tagline && <p className="kbi-tagline">{biz.tagline}</p>}
            <div className="kbi-meta">
              {biz?.industry && <span className="kbi-tag">{biz.industry}</span>}
              <span className="kbi-tag">{(kb.offerings || []).length} productos</span>
              {kb.brand && <span className="kbi-tag kbi-tag--lime">marca ✓</span>}
              <span className="kbi-tag">{(kb.screens || []).length} pantallas</span>
            </div>
          </section>

          {/* prospecto */}
          <section className="kbi-card">
            <div className="kbi-card-h"><Building2 size={14} /> Prospecto</div>
            <p>{plan.prospecto}</p>
            {!!plan.publico?.length && (
              <ul className="kbi-publico">{plan.publico.map((p, i) => <li key={i}>{p}</li>)}</ul>
            )}
          </section>

          {/* propuesta */}
          <section className="kbi-card kbi-prop">
            <div className="kbi-card-h"><Sparkles size={14} /> Propuesta de trabajo</div>
            <div className="kbi-perfil">Perfil sugerido: <strong>{plan.propuesta.perfil}</strong></div>
            <p className="kbi-prop-resumen">{plan.propuesta.resumen}</p>
            <div className="kbi-piezas">
              {(plan.propuesta.piezas || []).map((pz, i) => (
                <div key={i} className="kbi-pieza">
                  <span className="kbi-pieza-obj">{pz.objetivo}</span>
                  <span className="kbi-pieza-ang">{pz.angulo}</span>
                  <span className="kbi-pieza-fmt">{pz.formato}{pz.duracionSeg ? ` · ${pz.duracionSeg}s` : ''}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="kbi-actions">
            <button className="kbi-create" onClick={crear}><Check size={16} /> Crear proyecto con esto</button>
            <span className="kbi-next"><ArrowRight size={13} /> después: generar los reels (2da etapa)</span>
          </div>
        </div>
      )}
    </div>
  );
}
