// Stepper del pipeline de producción: renderiza pasosVisibles(comercial.tipo) — 9 pasos filmado,
// 7 animado — con iconos lucide (jamás emojis) y estado visual por paso. Click navega.
import { Building2, Lightbulb, FileText, Users, Clapperboard, PackageOpen, Film, Video, Scissors, Megaphone, Check } from 'lucide-react';
import { pasosVisibles, type PasoId, type EstadoPaso, type TipoComercial } from './lib/comercial';

const META: Record<PasoId, { label: string; Icon: typeof Building2 }> = {
  negocio: { label: 'Negocio', Icon: Building2 },
  concepto: { label: 'Concepto', Icon: Lightbulb },
  guion: { label: 'Guion', Icon: FileText },
  cast: { label: 'Cast', Icon: Users },
  storyboard: { label: 'Storyboard', Icon: Clapperboard },
  pack: { label: 'Pack Flow', Icon: PackageOpen },
  render: { label: 'Render', Icon: Film },
  rodaje: { label: 'Rodaje', Icon: Video },
  montaje: { label: 'Montaje', Icon: Scissors },
  publicar: { label: 'Publicar', Icon: Megaphone },
};

export const pasoLabel = (id: PasoId): string => META[id].label;

interface Props {
  tipo: TipoComercial;
  estados: Record<PasoId, EstadoPaso> | undefined;
  activePaso: PasoId;
  onPick: (p: PasoId) => void;
}

export default function PipelineStepper({ tipo, estados, activePaso, onPick }: Props) {
  const pasos = pasosVisibles(tipo);
  const estadoDe = (p: PasoId): EstadoPaso => estados?.[p] ?? 'pendiente';
  return (
    <nav className="pipe-stepper" aria-label="Pasos del comercial">
      {pasos.map((p, i) => {
        const est = estadoDe(p);
        const M = META[p];
        const on = p === activePaso;
        return (
          <button
            key={p}
            className={`pipe-step pipe-step--${est}${on ? ' pipe-step--active' : ''}`}
            onClick={() => onPick(p)}
            title={M.label}
            aria-current={on ? 'step' : undefined}
          >
            <span className="pipe-step-n">{est === 'aprobado' ? <Check size={16} /> : i + 1}</span>
            <span className="pipe-step-foot">
              <span className="pipe-step-ico"><M.Icon size={13} /></span>
              <span className="pipe-step-lbl">{M.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
