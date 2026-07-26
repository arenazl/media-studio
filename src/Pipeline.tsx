// Workspace de PROYECTO (rediseño Fase 2, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html
// líneas 194-567): spine izquierdo (220px, pasosVisibles del tipo) + panel central del paso activo +
// copiloto derecho colapsable. Reemplaza el viejo shell Topbar+tabs de secciones — 'negocio' ya vive
// como el primer paso del spine, 'audio'/'videos'/'editor' pasaron a rutas propias del rail (App.tsx).
// Es CONTROLLED: el proyecto y su persistencia los maneja App (dueño único de los datos); acá solo
// vive el estado de navegación (reel/paso activo/copiloto/ajustes). Escribe vía `onChange`, el
// mutador único de App — así ninguna otra pantalla puede pisar lo que se arma acá con una copia vieja.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, PanelRightOpen, Settings, Check } from 'lucide-react';
import PipelineStepper, { pasoLabel } from './PipelineStepper';
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
import { PasoGate, type PasoProps } from './pasos/pasoKit';
import type { Project } from './lib/projects';
import { nuevoComercial, pasosVisibles, pasoHabilitado, pasoDeEntrada, type Comercial, type PasoId } from './lib/comercial';
import { getFormato, tipoDesdeFormato } from './lib/formato';
import { getCopilotOpen, setCopilotOpen, getAiModel, setAiModel, subscribeAiModel, type AiModelSetting } from './lib/settings';
import './Pipeline.css';

// El guardado lo maneja App: 'debounced' (tipear = 1 POST a los 500ms) o 'flush' (ya, botones/navegación).
type ChangeFn = (updater: (p: Project) => Project, mode?: 'debounced' | 'flush') => void;

const AI_MODEL_OPTIONS: { value: AiModelSetting; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'recomendado — cada paso usa su modelo' },
  { value: 'opus', label: 'Opus', hint: 'máxima calidad, caro' },
  { value: 'sonnet', label: 'Sonnet', hint: 'equilibrado' },
  { value: 'haiku', label: 'Haiku', hint: 'económico' },
];

export default function Pipeline({ project, onChange, onFlush, onHome, onGoEditor }: { project: Project; onChange: ChangeFn; onFlush: () => void; onHome: () => void; onGoEditor?: () => void }) {
  const [reelId, setReelId] = useState<string>(project.reels[0]?.id || '');
  const comercialInicial = (project.reels.find((r) => r.id === reelId) || project.reels[0])?.comercial;
  // Aterrizaje: el primer paso HABILITADO sin aprobar (pasoDeEntrada). Abrir siempre en 'concepto'
  // fijo mostraba el panel de un paso que el spine tenía cerrado — con su "Generar con IA" vivo, un
  // click salteaba el gate (ej. pieza con el Negocio todavía pendiente).
  const [activePaso, setActivePaso] = useState<PasoId>(() => pasoDeEntrada(comercialInicial));
  // copiloto: panel de guia a la derecha. Su estado abierto/cerrado persiste (settings.ts). Solo UI.
  const [copilotOpen, setCopilotOpenState] = useState<boolean>(getCopilotOpen);
  const toggleCopilot = (open: boolean) => { setCopilotOpenState(open); setCopilotOpen(open); };
  // ajuste "Modelo de IA" (antes vivía en la Topbar, retirada en este rediseño) — mismo popover, ahora
  // colgado de un engranaje chico en la cabecera de la spine.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  // el ajuste vive en localStorage (settings.ts) y lo tocan DOS engranajes (éste y el del rail):
  // con useState local, cambiarlo en uno dejaba al otro mostrando el valor viejo hasta un F5. El
  // pub/sub de settings.ts + useSyncExternalStore los mantiene en el mismo valor (igual que RailSettings).
  const aiModel = useSyncExternalStore(subscribeAiModel, getAiModel, () => 'auto' as AiModelSetting);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const pickModel = (v: AiModelSetting) => { setAiModel(v); setSettingsOpen(false); };

  const reel = project.reels.find((r) => r.id === reelId) || project.reels[0];
  const comercial = reel?.comercial;
  const tipo = comercial?.tipo ?? 'filmado';

  // Aplica un cambio al comercial del reel activo (creándolo si el reel no tenía) y sincroniza el guion
  // legacy (reel.guion) con las narraciones → la tab Audio ve el guion nuevo. Sube al mutador de App.
  const setComercial = (updater: (c: Comercial) => Comercial, mode: 'debounced' | 'flush' = 'debounced') => {
    onChange((cur) => {
      const rl = cur.reels.find((r) => r.id === reelId) || cur.reels[0];
      if (!rl) return cur;
      // Un comercial creado ACÁ (reel sin comercial, ej. proyectos viejos o reels sembrados sin pieza)
      // nacía SIEMPRE 'filmado' e ignorando el formato del proyecto — la misma desincronización que
      // WO-1 arregló en el wizard. Mismo criterio que ProjectWizard: la técnica sale del formato y el
      // formatoId se estampa en el comercial. Sin formato (proyectos viejos) → 'filmado', como antes.
      const formatoProj = getFormato(cur.formatoId);
      const base = rl.comercial ?? { ...nuevoComercial(rl.angulo || rl.nombre || 'Comercial', tipoDesdeFormato(formatoProj)), formatoId: cur.formatoId };
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
  // navegar (cambiar de paso / de comercial): flush de lo PENDIENTE antes de moverse. Ojo con el
  // atajo viejo `onChange((x) => x, 'flush')`: forzaba un guardado aunque no hubiera nada en vuelo,
  // así que sólo MIRAR una pieza la reescribía (localStorage + POST /api/projects con updated_at
  // nuevo) y la subía en "Piezas recientes". `onFlush` (App.flushPending) sólo persiste si hay un
  // guardado con retraso agendado — el autosave de 500ms queda igual.
  const pickPaso = (p: PasoId) => { onFlush(); setActivePaso(p); };
  const pickReel = (id: string) => {
    onFlush();
    setReelId(id);
    // cada comercial va por su propio pipeline: recalcular el aterrizaje con SU estado (si no, al
    // cambiar de pieza quedabas parado en un paso que para ésta puede estar cerrado).
    setActivePaso(pasoDeEntrada(project.reels.find((r) => r.id === id)?.comercial));
  };

  const pasoProps: PasoProps = { project, reelId: reel?.id || '', comercial, setComercial, goNext };

  // motivo del bloqueo del paso ACTIVO (defensa en profundidad del gate, ver PasoGate en pasoKit):
  // vacío = habilitado. Mismo copy que el tooltip del spine.
  const visibles = pasosVisibles(tipo);
  const idxActivo = visibles.indexOf(activePaso);
  const bloqueoMotivo = comercial && idxActivo > 0 && !pasoHabilitado(comercial, activePaso)
    ? `Completá antes ${pasoLabel(visibles[idxActivo - 1])}`
    : '';

  const renderPaso = () => {
    switch (activePaso) {
      case 'negocio': return <ProjectInfo project={project} onApprove={goNext} aprobado={comercial?.estados?.negocio === 'aprobado'} />;
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

        <PipelineStepper tipo={tipo} comercial={comercial} activePaso={activePaso} onPick={pickPaso} />
      </aside>

      <div className="pw-center">
        <PasoGate motivo={bloqueoMotivo}>
          {reel ? renderPaso() : <div className="paso"><div className="paso-empty">Este proyecto no tiene comerciales todavía.</div></div>}
        </PasoGate>
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
