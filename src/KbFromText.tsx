// Segunda fuente de entrada del KSP: en vez de traer el KB de una app integrada, el usuario lo trae
// por TEXTO LIBRE (la IA lo cura al mismo shape, molde `briefToKb`) o pegando el JSON directo (hecho
// por afuera — sin IA, gratis). De ahí en adelante el flujo es EXACTAMENTE el mismo que KbInspector:
// kbToProjectInput → saveProject → onComenzar. No se toca nada aguas abajo.
import { useState } from 'react';
import { FileText, Code2, Rocket, Loader2, AlertTriangle, Check } from 'lucide-react';
import { API_BASE } from './config';
import { kbToProjectInput, isValidKB, type KnowledgeBase } from './lib/knowledgeBase';
import { saveProject, type Project } from './lib/projects';
import { effectiveModel } from './lib/settings';
import './KbFromText.css';

type Modo = 'texto' | 'json';
type Phase = 'idle' | 'working' | 'ready' | 'error';

export default function KbFromText({ onComenzar }: { onComenzar: (p: Project) => void }) {
  const [modo, setModo] = useState<Modo>('texto');
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState('');
  const [kb, setKb] = useState<KnowledgeBase | null>(null);

  // vía (a): texto libre → la IA cura el JSON del KB (molde briefToKb, Claude headless).
  const generarDesdeTexto = async () => {
    if (!input.trim()) { setErr('Escribí algo sobre el negocio primero.'); return; }
    setPhase('working'); setErr(''); setKb(null);
    try {
      const r = await fetch(`${API_BASE}/api/run-function`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId: 'briefToKb', context: {}, options: { brief: input.trim() }, model: effectiveModel('briefToKb') }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo curar el texto');
      const generado = d.result as KnowledgeBase;
      if (!isValidKB(generado)) throw new Error('la IA no devolvió un KB válido (falta business.name u offerings)');
      setKb(generado); setPhase('ready');
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); setPhase('error'); }
  };

  // vía (b): pegar el JSON del KB hecho por afuera — sin IA, solo se valida el shape mínimo.
  const validarJson = () => {
    setErr(''); setKb(null);
    try {
      const parsed = JSON.parse(input);
      if (!isValidKB(parsed)) throw new Error('el JSON no tiene el shape del KB (falta business.name u offerings[])');
      setKb(parsed); setPhase('ready');
    } catch (e) { setErr(e instanceof Error ? e.message : 'JSON inválido'); setPhase('error'); }
  };

  const comenzar = () => {
    if (!kb) return;
    const inp = kbToProjectInput(kb);
    const proj = saveProject({ name: inp.name, type: inp.type, brief: inp.brief, kb: inp.kb, brandKit: inp.brandKit, screens: inp.screens, contentType: 'combinado' });
    onComenzar(proj);
  };

  const cambiarModo = (m: Modo) => { setModo(m); setPhase('idle'); setErr(''); setKb(null); };

  return (
    <div className="kft-card">
      <div className="kft-head">
        <FileText size={18} />
        <div>
          <div className="kft-title">Nuevo negocio desde texto</div>
          <div className="kft-desc">Sin una app integrada: describí el negocio en texto libre, o pegá un Knowledge Base hecho por afuera.</div>
        </div>
      </div>

      <div className="kft-tabs">
        <button className={modo === 'texto' ? 'kft-tab kft-tab--on' : 'kft-tab'} onClick={() => cambiarModo('texto')}>
          <FileText size={13} /> Desde un texto
        </button>
        <button className={modo === 'json' ? 'kft-tab kft-tab--on' : 'kft-tab'} onClick={() => cambiarModo('json')}>
          <Code2 size={13} /> Pegar JSON
        </button>
      </div>

      <textarea
        className="kft-textarea"
        rows={7}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={modo === 'texto'
          ? 'Contame el negocio: nombre, a qué se dedica, qué ofrece, para quién, qué lo diferencia…'
          : '{ "business": { "name": "...", "description": "..." }, "offerings": [...] }'}
      />

      {err && <div className="kft-err"><AlertTriangle size={13} /> {err}</div>}

      {phase === 'ready' && kb && (
        <div className="kft-ready"><Check size={13} /> Listo: <strong>{kb.business?.name}</strong> — {(kb.offerings || []).length} producto(s), {(kb.screens || []).length} pantalla(s).</div>
      )}

      <div className="kft-actions">
        {modo === 'texto' ? (
          <button className="kft-btn kft-btn--primary" disabled={phase === 'working'} onClick={generarDesdeTexto}>
            {phase === 'working' ? <><Loader2 size={14} className="kft-spin" /> Curando…</> : <>Curar con IA</>}
          </button>
        ) : (
          <button className="kft-btn kft-btn--primary" onClick={validarJson}>Validar JSON</button>
        )}
        {phase === 'ready' && (
          <button className="kft-btn kft-btn--start" onClick={comenzar}><Rocket size={14} /> Comenzar con {kb?.business?.name}</button>
        )}
      </div>
    </div>
  );
}
