// WIZARD de arranque — EL FLUJO: importar → analizar el KB → generar el TEMPLATE DE SALIDA
// (por pieza: guion de audio + mockups + prompts de human reels) → dejarlo como base editable.
// Barato: 1 estrategia + por pieza guion+mockups+veo, llamadas simples a Claude headless (NO el
// panel de 30 agentes). El usuario después edita; "regenerar" por pieza queda para variantes.
import { useState } from 'react';
import { Rocket, Loader2, Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { API_BASE } from './config';
import { getFunction } from './lib/functionCatalog';
import { saveProject, type Project, type ProjectReel } from './lib/projects';
import './VeoPanel.css';

interface Piece { id: string; objective?: string; angle?: string; durationSec?: number; creativeBrief?: string }
interface Strategy { positioning?: string; pieces: Piece[] }

// 1.2: usa la metadata de pantallas (kind/components/data) si vino del KB; si no, las screenshots legacy.
const screensOf = (p: Project) => (Array.isArray(p.screens) && p.screens.length
  ? (p.screens as Record<string, unknown>[])
  : (p.screenshots || []).map((s) => ({ label: (s.split('/').pop() || s).replace(/\.\w+$/, '').replace(/[-_]/g, ' ') })));

export default function ProjectWizard({ project, onDone, onCancel }: { project: Project; onDone: (p: Project) => void; onCancel: () => void }) {
  const fn = getFunction('strategy');
  const perfilOpt = fn?.options.find((o) => o.id === 'perfil');
  const [perfil, setPerfil] = useState(perfilOpt?.default || 'campaña');
  const [phase, setPhase] = useState<'idle' | 'working' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [err, setErr] = useState('');

  const base = { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', screens: screensOf(project) };

  const runFn = async (functionId: string, piece?: object, options: object = {}) => {
    const r = await fetch(`${API_BASE}/api/run-function`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ functionId, context: { project: base, ...(piece ? { piece } : {}) }, options }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || `falló ${functionId}`);
    return d.result;
  };

  // EL FLUJO: estrategia → por pieza genera el template (guion + mockups + prompts veo) → guarda.
  const generarTemplate = async () => {
    setPhase('working'); setErr('');
    try {
      setProgress('Analizando el negocio y armando el plan de piezas…');
      const strat: Strategy = await runFn('strategy', undefined, { perfil });
      const pieces = strat?.pieces || [];
      if (!pieces.length) throw new Error('la estrategia no devolvió piezas');

      const reels: ProjectReel[] = [];
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        setProgress(`Pieza ${i + 1}/${pieces.length} — "${p.angle}": guion, mockups y prompts de video…`);
        const piece = { angulo: p.angle, objetivo: p.objective, durationSec: p.durationSec };
        const script = await runFn('script', piece);
        const guion = (script?.blocks || []).map((b: { narration: string }) => b.narration).filter(Boolean);
        const [mockup, veo] = await Promise.all([
          runFn('mockup', { ...piece, guion }).catch(() => null),
          runFn('veo', { ...piece, guion }).catch(() => null),
        ]);
        reels.push({
          id: p.id, nombre: p.angle || p.objective || p.id, guion, frases: guion.length,
          objetivo: p.objective, angulo: p.angle, durationSec: p.durationSec,
          musicMood: script?.music?.mood,
          slides: mockup?.slides?.length ? mockup.slides : undefined,
          videoPrompts: veo?.clips?.length ? veo.clips : undefined,
        });
      }

      setProgress('Guardando el template…');
      const proj = saveProject({
        id: project.id, name: project.name, type: project.type, brief: project.brief,
        brandKit: project.brandKit, screenshots: project.screenshots, contentType: 'combinado', reels,
      });
      onDone(proj);
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); setPhase('error'); }
  };

  return (
    <div className="veo-root wiz-root">
      <header className="veo-head">
        <div className="veo-title"><Rocket size={18} /> Empezá tu campaña — {project.name}</div>
        <p className="veo-sub">{project.type || 'proyecto'} · elegí el tipo y armo el template (guiones + mockups + prompts de los reels)</p>
        <button className="wiz-cancel" onClick={onCancel} title="Cancelar"><X size={15} /></button>
      </header>

      <div className="wiz-step">
        <div className="veo-field">
          <span>Tipo de campaña</span>
          <div className="veo-chips">
            {(perfilOpt?.choices || []).map((c) => (
              <button key={c.value} disabled={phase === 'working'} className={perfil === c.value ? 'veo-chip veo-chip--on' : 'veo-chip'} onClick={() => setPerfil(c.value)}>{c.label}</button>
            ))}
          </div>
        </div>

        <div className="veo-card wiz-explain">
          <div className="veo-card-h"><Sparkles size={14} /> Qué te dejo armado (la base, después editás)</div>
          <ul className="wiz-list">
            <li>Las <strong>piezas</strong> de la campaña (según el tipo elegido)</li>
            <li>El <strong>guion para audio</strong> de cada pieza (para probar voces)</li>
            <li>Los <strong>mockups</strong> desde tus pantallas reales</li>
            <li>Los <strong>prompts de los human reels</strong> (secuencia de Flow, 17s)</li>
          </ul>
        </div>

        {err && <div className="veo-error">{err}</div>}

        {phase === 'working'
          ? <div className="veo-loading"><Loader2 size={26} className="veo-spin" /> {progress}</div>
          : <button className="veo-run wiz-cta" onClick={generarTemplate}>
              {phase === 'error' ? 'Reintentar' : <><Check size={15} /> Comenzar — armar el template <ArrowRight size={14} /></>}
            </button>}
      </div>
    </div>
  );
}
