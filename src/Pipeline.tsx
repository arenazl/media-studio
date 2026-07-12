// Workspace de PROYECTO (rediseño Fase 2, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html
// líneas 194-567): spine izquierdo (220px, pasosVisibles del tipo) + panel central del paso activo +
// copiloto derecho colapsable. Reemplaza el viejo shell Topbar+tabs de secciones — 'negocio' ya vive
// como el primer paso del spine, 'audio'/'videos'/'editor' pasaron a rutas propias del rail (App.tsx).
// Es CONTROLLED: el proyecto y su persistencia los maneja App (dueño único de los datos); acá solo
// vive el estado de navegación (reel/paso activo/copiloto/ajustes). Escribe vía `onChange`, el
// mutador único de App — así ninguna otra pantalla puede pisar lo que se arma acá con una copia vieja.
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, PanelRightOpen, Settings, Check } from 'lucide-react';
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
import { getCopilotOpen, setCopilotOpen, getAiModel, setAiModel, type AiModelSetting } from './lib/settings';
import './Pipeline.css';

// El guardado lo maneja App: 'debounced' (tipear = 1 POST a los 500ms) o 'flush' (ya, botones/navegación).
type ChangeFn = (updater: (p: Project) => Project, mode?: 'debounced' | 'flush') => void;

const AI_MODEL_OPTIONS: { value: AiModelSetting; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'recomendado — cada paso usa su modelo' },
  { value: 'opus', label: 'Opus', hint: 'máxima calidad, caro' },
  { value: 'sonnet', label: 'Sonnet', hint: 'equilibrado' },
  { value: 'haiku', label: 'Haiku', hint: 'económico' },
];

export default function Pipeline({ project, onChange, onHome, onGoEditor }: { project: Project; onChange: ChangeFn; onHome: () => void; onGoEditor?: () => void }) {
  const [reelId, setReelId] = useState<string>(project.reels[0]?.id || '');
  const [activePaso, setActivePaso] = useState<PasoId>('concepto');
  // copiloto: panel de guia a la derecha. Su estado abierto/cerrado persiste (settings.ts). Solo UI.
  const [copilotOpen, setCopilotOpenState] = useState<boolean>(getCopilotOpen);
  const toggleCopilot = (open: boolean) => { setCopilotOpenState(open); setCopilotOpen(open); };
  // ajuste "Modelo de IA" (antes vivía en la Topbar, retirada en este rediseño) — mismo popover, ahora
  // colgado de un engranaje chico en la cabecera de la spine.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [aiModel, setAiModelState] = useState<AiModelSetting>(() => getAiModel());
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const pickModel = (v: AiModelSetting) => { setAiModel(v); setAiModelState(v); setSettingsOpen(false); };

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
      case 'montaje': return <PasoMontaje {...pasoProps} onGoEditor={onGoEditor} />;
      case 'publicar': return <PasoPublicar {...pasoProps} />;
      default:
        return <div className="paso"><div className="paso-empty">Este paso llega en una próxima fase del rework.</div></div>;
    }
  };

  return (
    <div className="pw-shell">
      <aside className="pw-spine">
        <div className="pw-spine-top">
          <button className="pw-crumb" onClick={onHome}><ArrowLeft size={13} /> Inicio</button>
          <div className="pw-settings" ref={settingsRef}>
            <button className="pw-gear" title="Modelo de IA" onClick={() => setSettingsOpen((o) => !o)}><Settings size={14} /></button>
            {settingsOpen && (
              <div className="pw-menu">
                <div className="pw-menu-lbl">Modelo de IA</div>
                {AI_MODEL_OPTIONS.map((o) => (
                  <button key={o.value} className={aiModel === o.value ? 'pw-menu-item pw-menu-item--on' : 'pw-menu-item'} onClick={() => pickModel(o.value)}>
                    <span className="pw-menu-item-txt"><span className="pw-menu-item-name">{o.label}</span><span className="pw-menu-item-hint">{o.hint}</span></span>
                    {aiModel === o.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pw-spine-head">
          <span className="pw-spine-eyebrow">Pipeline</span>
          <span className={`pw-spine-tipo pw-spine-tipo--${tipo}`}>{tipo === 'animado' ? 'Animado' : 'Filmado'}</span>
        </div>

        {project.reels.length > 1 && (
          <div className="pw-comerciales">
            {project.reels.map((r) => (
              <button key={r.id} className={r.id === reel?.id ? 'pw-com pw-com--on' : 'pw-com'} onClick={() => pickReel(r.id)}>
                {r.nombre || r.angulo || 'Comercial'}
              </button>
            ))}
          </div>
        )}

        <PipelineStepper tipo={tipo} estados={comercial?.estados} activePaso={activePaso} onPick={pickPaso} />
      </aside>

      <div className="pw-center">
        {reel ? renderPaso() : <div className="paso"><div className="paso-empty">Este proyecto no tiene comerciales todavía.</div></div>}
      </div>

      <div className={`pw-copilot-dock${copilotOpen ? '' : ' pw-copilot-dock--closed'}`}>
        {copilotOpen ? (
          <Copiloto paso={activePaso} comercial={comercial} project={project} onClose={() => toggleCopilot(false)} />
        ) : (
          <button className="copilot-reopen" onClick={() => toggleCopilot(true)} title="Mostrar el copiloto">
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
