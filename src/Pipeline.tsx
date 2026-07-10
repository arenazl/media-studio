// Pipeline de producción del comercial (Fase 2 del rework): reemplaza la sopa de tabs por un
// PROCESO. Selector de comercial (los reels del proyecto) + stepper de pasos + la pantalla del
// paso activo. Es CONTROLLED: el proyecto y su persistencia los maneja App (dueño único de los
// datos); acá solo vive el estado de navegación (reel/paso activo). Escribe vía `onChange`, el
// mutador único de App — así ninguna otra pantalla puede pisar lo que se arma acá con una copia vieja.
import { useState } from 'react';
import { PanelRightOpen } from 'lucide-react';
import PipelineStepper from './PipelineStepper';
import Copiloto from './Copiloto';
import ProjectInfo from './ProjectInfo';
import PasoConcepto from './pasos/PasoConcepto';
import PasoGuion from './pasos/PasoGuion';
import PasoCast from './pasos/PasoCast';
import PasoStoryboard from './pasos/PasoStoryboard';
import PasoPack from './pasos/PasoPack';
import PasoRodaje from './pasos/PasoRodaje';
import PasoMontaje from './pasos/PasoMontaje';
import PasoPublicar from './pasos/PasoPublicar';
import PasoRender from './pasos/PasoRender';
import type { PasoProps } from './pasos/pasoKit';
import type { Project } from './lib/projects';
import { nuevoComercial, pasosVisibles, type Comercial, type PasoId } from './lib/comercial';
import { getCopilotOpen, setCopilotOpen } from './lib/settings';
import './Pipeline.css';

// El guardado lo maneja App: 'debounced' (tipear = 1 POST a los 500ms) o 'flush' (ya, botones/navegación).
type ChangeFn = (updater: (p: Project) => Project, mode?: 'debounced' | 'flush') => void;

export default function Pipeline({ project, onChange }: { project: Project; onChange: ChangeFn }) {
  const [reelId, setReelId] = useState<string>(project.reels[0]?.id || '');
  const [activePaso, setActivePaso] = useState<PasoId>('concepto');
  // copiloto: panel de guia a la derecha. Su estado abierto/cerrado persiste (settings.ts). Solo UI.
  const [copilotOpen, setCopilotOpenState] = useState<boolean>(getCopilotOpen);
  const toggleCopilot = (open: boolean) => { setCopilotOpenState(open); setCopilotOpen(open); };

  const reel = project.reels.find((r) => r.id === reelId) || project.reels[0];
  const comercial = reel?.comercial;
  const tipo = comercial?.tipo ?? 'filmado';

  // Aplica un cambio al comercial del reel activo (creándolo si el reel no tenía) y sincroniza el guion
  // legacy (reel.guion) con las narraciones → la tab Audio ve el guion nuevo. Sube al mutador de App.
  const setComercial = (updater: (c: Comercial) => Comercial, mode: 'debounced' | 'flush' = 'debounced') => {
    onChange((cur) => {
      const rl = cur.reels.find((r) => r.id === reelId) || cur.reels[0];
      if (!rl) return cur;
      const base = rl.comercial ?? nuevoComercial(rl.angulo || rl.nombre || 'Comercial', 'filmado');
      const next = updater(base);
      const narraciones = next.guion?.blocks?.map((b) => b.narration).filter(Boolean);
      const reels = cur.reels.map((r) => (r.id === rl.id
        ? { ...r, comercial: next, ...(narraciones?.length ? { guion: narraciones, frases: narraciones.length } : {}) }
        : r));
      return { ...cur, reels };
    }, mode);
  };

  // Aprobar y seguir: marca el paso actual 'aprobado', persiste inmediato (flush) y avanza.
  const goNext = () => {
    const vis = pasosVisibles(tipo);
    const i = vis.indexOf(activePaso);
    setComercial((c) => ({ ...c, estados: { ...c.estados, [activePaso]: 'aprobado' } }), 'flush');
    if (i >= 0 && i < vis.length - 1) setActivePaso(vis[i + 1]);
  };
  // navegar (cambiar de paso / de comercial): flush de lo pendiente antes de moverse.
  const pickPaso = (p: PasoId) => { onChange((x) => x, 'flush'); setActivePaso(p); };
  const pickReel = (id: string) => { onChange((x) => x, 'flush'); setReelId(id); };

  const pasoProps: PasoProps = { project, reelId: reel?.id || '', comercial, setComercial, goNext };

  const renderPaso = () => {
    switch (activePaso) {
      case 'negocio': return <ProjectInfo project={project} />;
      case 'concepto': return <PasoConcepto {...pasoProps} />;
      case 'guion': return <PasoGuion {...pasoProps} />;
      case 'cast': return <PasoCast {...pasoProps} />;
      case 'storyboard': return <PasoStoryboard {...pasoProps} />;
      case 'pack': return <PasoPack {...pasoProps} />;
      case 'rodaje': return <PasoRodaje {...pasoProps} />;
      case 'render': return <PasoRender {...pasoProps} />;
      case 'montaje': return <PasoMontaje {...pasoProps} />;
      case 'publicar': return <PasoPublicar {...pasoProps} />;
      default:
        return <div className="paso"><div className="paso-empty">Este paso llega en una próxima fase del rework.</div></div>;
    }
  };

  return (
    <div className={`pipe${copilotOpen ? ' pipe--copilot' : ''}`}>
      {project.reels.length > 1 && (
        <div className="pipe-comerciales">
          {project.reels.map((r) => (
            <button key={r.id} className={r.id === reel?.id ? 'pipe-com pipe-com--on' : 'pipe-com'} onClick={() => pickReel(r.id)}>
              <span className="pipe-com-name">{r.nombre || r.angulo || 'Comercial'}</span>
              {r.comercial && <span className={`pipe-com-tipo pipe-com-tipo--${r.comercial.tipo}`}>{r.comercial.tipo}</span>}
            </button>
          ))}
        </div>
      )}

      <PipelineStepper tipo={tipo} estados={comercial?.estados} activePaso={activePaso} onPick={pickPaso} />

      <div className="pipe-work">
        <div className="pipe-main">
          {reel ? renderPaso() : <div className="paso"><div className="paso-empty">Este proyecto no tiene comerciales todavía.</div></div>}
        </div>
        {copilotOpen ? (
          <Copiloto paso={activePaso} comercial={comercial} project={project} onClose={() => toggleCopilot(false)} />
        ) : (
          <button className="copilot-reopen" onClick={() => toggleCopilot(true)} title="Mostrar el copiloto">
            <PanelRightOpen size={16} /> <span className="copilot-reopen-lbl">Guía</span>
          </button>
        )}
      </div>
    </div>
  );
}
