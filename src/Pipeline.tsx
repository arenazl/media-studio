// Pipeline de producción del comercial (Fase 2 del rework): reemplaza la sopa de tabs por un
// PROCESO. Selector de comercial (los reels del proyecto) + stepper de pasos + la pantalla del
// paso activo. TODO lo generado/editado se persiste al instante (saveProject = localStorage +
// dual-write al server). Los pasos pack/render/rodaje/montaje/publicar llegan en fases 3-5.
import { useState } from 'react';
import PipelineStepper from './PipelineStepper';
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
import { saveProject, type Project } from './lib/projects';
import { nuevoComercial, pasosVisibles, type Comercial, type PasoId } from './lib/comercial';
import './Pipeline.css';

export default function Pipeline({ project: initial }: { project: Project }) {
  const [project, setProject] = useState<Project>(initial);
  const [reelId, setReelId] = useState<string>(initial.reels[0]?.id || '');
  const [activePaso, setActivePaso] = useState<PasoId>('concepto');

  const reel = project.reels.find((r) => r.id === reelId) || project.reels[0];
  const comercial = reel?.comercial;
  const tipo = comercial?.tipo ?? 'filmado';

  // apply: crea el comercial si el reel no tenía, aplica el cambio y PERSISTE (dual-write).
  const setComercial = (updater: (c: Comercial) => Comercial) => {
    if (!reel) return;
    const base = reel.comercial ?? nuevoComercial(reel.angulo || reel.nombre || 'Comercial', 'filmado');
    const next = updater(base);
    // Sincroniza el guion legacy (reel.guion) con las narraciones del guion nuevo → la tab Audio
    // (VoiceStudio) ve el guion del comercial sin tocar su contrato. Cualquier cambio del guion
    // (generar, editar, regenerar bloque) pasa por acá, así siempre queda en sync.
    const narraciones = next.guion?.blocks?.map((b) => b.narration).filter(Boolean);
    const reels = project.reels.map((r) => (r.id === reel.id
      ? { ...r, comercial: next, ...(narraciones?.length ? { guion: narraciones, frases: narraciones.length } : {}) }
      : r));
    setProject(saveProject({ id: project.id, name: project.name, reels }));
  };

  // Aprobar y seguir: marca el paso actual 'aprobado' y avanza al siguiente visible.
  const goNext = () => {
    const vis = pasosVisibles(tipo);
    const i = vis.indexOf(activePaso);
    setComercial((c) => ({ ...c, estados: { ...c.estados, [activePaso]: 'aprobado' } }));
    if (i >= 0 && i < vis.length - 1) setActivePaso(vis[i + 1]);
  };

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
    <div className="pipe">
      {project.reels.length > 1 && (
        <div className="pipe-comerciales">
          {project.reels.map((r) => (
            <button key={r.id} className={r.id === reel?.id ? 'pipe-com pipe-com--on' : 'pipe-com'} onClick={() => setReelId(r.id)}>
              <span className="pipe-com-name">{r.nombre || r.angulo || 'Comercial'}</span>
              {r.comercial && <span className={`pipe-com-tipo pipe-com-tipo--${r.comercial.tipo}`}>{r.comercial.tipo}</span>}
            </button>
          ))}
        </div>
      )}

      <PipelineStepper tipo={tipo} estados={comercial?.estados} activePaso={activePaso} onPick={setActivePaso} />

      {reel ? renderPaso() : <div className="paso"><div className="paso-empty">Este proyecto no tiene comerciales todavía.</div></div>}
    </div>
  );
}
