// WIZARD de arranque (rework fase 2 §Generación) — EL FLUJO: importar → analizar el KB → correr
// SOLO `strategy` (Claude headless, 1 llamada) → sembrar un comercial por pieza (con su ángulo y
// creativeBrief). El contenido (concepto, guion, cast, storyboard, pack…) lo produce el PIPELINE
// paso a paso, on-demand. Barato y rápido; el usuario dirige cada paso desde el stepper.
import { useState } from 'react';
import { Rocket, Loader2, Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { API_BASE } from './config';
import { getFunction } from './lib/functionCatalog';
import { saveProject, type Project, type ProjectReel } from './lib/projects';
import { nuevoComercial } from './lib/comercial';
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

  // EL FLUJO (fase 2 §Generación): corre SOLO `strategy` → siembra un comercial por pieza
  // (nuevoComercial + angulo/creativeBrief). El resto del contenido lo genera el PIPELINE paso a
  // paso, on-demand. Una sola llamada headless; el usuario dirige desde el stepper.
  const comenzar = async () => {
    setPhase('working'); setErr('');
    try {
      setProgress('Analizando el negocio y armando el plan de piezas…');
      let reels: ProjectReel[] = [];
      try {
        const strat: Strategy = await runFn('strategy', undefined, { perfil });
        reels = (strat?.pieces || []).map((p, i) => {
          const titulo = p.angle || p.objective || `Pieza ${i + 1}`;
          return {
            id: p.id || `reel-${i + 1}`, nombre: titulo, frases: 0, guion: [],
            objetivo: p.objective, angulo: p.angle, durationSec: p.durationSec,
            // El comercial nace con su ángulo → PasoConcepto lo usa como proxy diferenciado (no el título genérico).
            comercial: { ...nuevoComercial(titulo, 'filmado'), angulo: p.angle, creativeBrief: p.creativeBrief },
          };
        });
      } catch { /* strategy falló → no bloquear el import; abajo se siembra un comercial base */ }

      // Sin piezas (strategy caído o vacío): 1 comercial base para que el pipeline arranque igual.
      if (!reels.length) reels = [{ id: `reel-${project.id}`, nombre: project.name, frases: 0, guion: [], comercial: nuevoComercial(project.name, 'filmado') }];

      setProgress('Guardando el proyecto…');
      const proj = saveProject({
        id: project.id, name: project.name, type: project.type, brief: project.brief,
        brandKit: project.brandKit, screenshots: project.screenshots, screens: project.screens,
        contentType: 'combinado', reels,
      });
      onDone(proj);
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); setPhase('error'); }
  };

  return (
    <div className="veo-root wiz-root">
      <header className="veo-head">
        <div className="veo-title"><Rocket size={18} /> Empezá tu campaña — {project.name}</div>
        <p className="veo-sub">{project.type || 'proyecto'} · elegí el tipo y armo las piezas de la campaña (cada una con su ángulo, lista para el pipeline)</p>
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
          <div className="veo-card-h"><Sparkles size={14} /> Qué te dejo armado (la base, después producís cada paso)</div>
          <ul className="wiz-list">
            <li>Las <strong>piezas</strong> de la campaña, cada una con su <strong>ángulo</strong> (según el tipo elegido)</li>
            <li>Cada pieza queda como un <strong>comercial</strong> listo para producir en el <strong>pipeline</strong></li>
            <li>Concepto → guion → cast → storyboard → video: lo generás (y editás) paso a paso</li>
            <li>Rápido: una sola pasada de estrategia, sin gastar tokens de más</li>
          </ul>
        </div>

        {err && <div className="veo-error">{err}</div>}

        {phase === 'working'
          ? <div className="veo-loading"><Loader2 size={26} className="veo-spin" /> {progress}</div>
          : <button className="veo-run wiz-cta" onClick={comenzar}>
              {phase === 'error' ? 'Reintentar' : <><Check size={15} /> Comenzar — armar las piezas <ArrowRight size={14} /></>}
            </button>}
      </div>
    </div>
  );
}
