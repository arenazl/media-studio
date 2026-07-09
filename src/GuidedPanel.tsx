// Panel de FUNCIONES GUIADAS — la solapa "Prompts". Lee el catálogo y dibuja un tab por función
// (proyecto + pieza). El tab 'veo' usa el VeoPanel rico (secuencia + regenerar); el resto, el
// FunctionRunner genérico. La pieza se elige una vez acá y se comparte. Agregar una función al
// catálogo = un tab nuevo, sin tocar este archivo.
import { useState, type ComponentType } from 'react';
import * as Icons from 'lucide-react';
import { projectFunctions, pieceFunctions } from './lib/functionCatalog';
import type { Project } from './lib/projects';
import VeoPanel from './VeoPanel';
import FunctionRunner from './FunctionRunner';
import './VeoPanel.css';

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const C = (Icons as unknown as Record<string, ComponentType<{ size?: number }>>)[name] || Icons.Wand2;
  return <C size={size} />;
}

export default function GuidedPanel({ project }: { project: Project }) {
  const proj = projectFunctions();
  const piece = pieceFunctions();
  const all = [...proj, ...piece];
  const [activeId, setActiveId] = useState(piece[0]?.id || all[0]?.id || '');
  const reels = project.reels || [];
  const [reelId, setReelId] = useState(reels[0]?.id || '');

  const fn = all.find((f) => f.id === activeId);
  const reel = reels.find((r) => r.id === reelId);

  const Tab = ({ id, label, icon }: { id: string; label: string; icon: string }) => (
    <button className={activeId === id ? 'veo-tab veo-tab--on' : 'veo-tab'} onClick={() => setActiveId(id)}><Icon name={icon} /> {label}</button>
  );

  return (
    <div className="veo-root">
      <header className="veo-head">
        <div className="veo-title"><Icons.Sparkles size={18} /> Funciones guiadas</div>
        <p className="veo-sub">Cada botón corre una IA on-demand sobre la data del proyecto. Probá y regenerá variantes.</p>
      </header>

      <div className="veo-tabs">
        {proj.length > 0 && <span className="veo-tabs-grp">Proyecto</span>}
        {proj.map((f) => <Tab key={f.id} id={f.id} label={f.label} icon={f.icon} />)}
        {piece.length > 0 && <span className="veo-tabs-grp">Pieza</span>}
        {piece.map((f) => <Tab key={f.id} id={f.id} label={f.label} icon={f.icon} />)}
      </div>

      {fn && <p className="veo-fn-desc">{fn.description}</p>}

      {fn?.level === 'piece' && reels.length > 0 && (
        <div className="veo-reelpick">
          <span>Pieza</span>
          <select value={reelId} onChange={(e) => setReelId(e.target.value)}>
            {reels.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
      )}

      {!fn ? <div className="veo-empty">No hay funciones en el catálogo.</div>
        : fn.id === 'veo' ? <VeoPanel project={project} reelId={reelId} embedded />
        : <FunctionRunner fn={fn} project={project} reel={reel} />}
    </div>
  );
}
