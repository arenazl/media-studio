// Copiloto del pipeline — panel de guía contextual (aside sticky a la derecha). Para el paso activo
// explica en criollo: qué es · qué hizo la IA · qué tenés que hacer (numerado, con el próximo paso
// resaltado y los cumplidos tildados) · un tip · el progreso dinámico. Es SÓLO presentación: lee el
// comercial real (nunca lo muta) y deriva todo de lib/copiloto.ts (datos puros y testeados).
import { Sparkles, Info, Wand2, ListChecks, Lightbulb, CheckCircle2, ArrowRight, PanelRightClose, BadgeInfo } from 'lucide-react';
import { COPILOTO, copilotoDinamico } from './lib/copiloto';
import { packProgress, type Comercial, type PasoId } from './lib/comercial';
import { pasoLabel } from './PipelineStepper';
import BrandBlock from './BrandBlock';
import type { Project } from './lib/projects';
import './Copiloto.css';

interface CopilotoProps {
  paso: PasoId;
  comercial: Comercial | undefined;
  project: Project;
  onClose: () => void;
}

export default function Copiloto({ paso, comercial, project, onClose }: CopilotoProps) {
  const step = COPILOTO[paso];
  const dyn = copilotoDinamico(paso, comercial);
  if (!step) return null;

  const showHizoIA = !!step.hizoIA && dyn.hasContent;
  const pr = paso === 'pack' ? packProgress(comercial?.packFlow) : null;

  return (
    <aside className="copilot" aria-label="Copiloto del pipeline">
      <header className="copilot-head">
        <span className="copilot-eyebrow"><span className="copilot-mark"><Sparkles size={13} /></span> Copiloto</span>
        <button className="copilot-close" onClick={onClose} title="Ocultar el copiloto" aria-label="Ocultar el copiloto">
          <PanelRightClose size={16} />
        </button>
      </header>

      <div className="copilot-body">
        <div className="copilot-title-row">
          <h3 className="copilot-title">{pasoLabel(paso)}</h3>
          {dyn.aprobado && <span className="copilot-approved"><CheckCircle2 size={12} /> Aprobado</span>}
        </div>
        <p className="copilot-ques"><Info size={13} /> {step.queEs}</p>

        {showHizoIA && (
          <div className="copilot-sec copilot-sec--ia">
            <div className="copilot-sec-h"><Wand2 size={13} /> Qué hizo la IA</div>
            <p className="copilot-sec-p">{step.hizoIA}</p>
          </div>
        )}

        <div className="copilot-sec">
          <div className="copilot-sec-h"><ListChecks size={13} /> Qué tenés que hacer</div>
          <ol className="copilot-do">
            {step.hace.map((txt, i) => {
              const done = i < dyn.avance;
              const next = i === dyn.nextItem;
              return (
                <li key={i} className={`copilot-do-item${done ? ' is-done' : ''}${next ? ' is-next' : ''}`}>
                  <span className="copilot-do-mark">
                    {done ? <CheckCircle2 size={16} /> : next ? <ArrowRight size={14} /> : <span className="copilot-do-n">{i + 1}</span>}
                  </span>
                  <span className="copilot-do-txt">{txt}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {dyn.progreso && dyn.progreso.total > 0 && (
          <div className="copilot-prog">
            <div className="copilot-prog-bar">
              <span className="copilot-prog-fill" style={{ ['--copilot-pct' as string]: `${Math.round((dyn.progreso.done / dyn.progreso.total) * 100)}%` }} />
            </div>
            <span className="copilot-prog-txt">
              {pr
                ? `${pr.copiados}/${pr.total} copiados · ${pr.importados} importados`
                : `${dyn.progreso.done}/${dyn.progreso.total} ${dyn.progreso.label}`}
            </span>
          </div>
        )}

        {step.tip && (
          <p className="copilot-tip"><Lightbulb size={13} /> <span>{step.tip}</span></p>
        )}

        {step.nota && (
          <p className="copilot-nota"><BadgeInfo size={13} /> <span>{step.nota}</span></p>
        )}

        {paso === 'pack' && <BrandBlock brandKit={project.brandKit} variant="panel" />}
      </div>
    </aside>
  );
}
