// Spine vertical del pipeline (rediseño Fase 2, prototipo.dc.html líneas 204-212): la columna
// izquierda del workspace de proyecto — un nodo por paso (pasosVisibles(tipo)) con su número/check,
// ícono, label y estado en color. Click navega. Antes era un riel horizontal arriba del panel;
// ahora es la columna fija de 220px a la izquierda (Pipeline.tsx arma el resto de la spine: crumb +
// selector de comercial + este componente).
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

// una línea corta por estado (prototipo `s.stateLabel`) — separada de EstadoPaso porque acá es COPY,
// no el valor persistido.
const ESTADO_LABEL: Record<EstadoPaso, string> = {
  pendiente: 'Pendiente', generado: 'Generado', editado: 'Editado', aprobado: 'Aprobado',
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
    <nav className="pw-steps" aria-label="Pasos del comercial">
      {pasos.map((p, i) => {
        const est = estadoDe(p);
        const M = META[p];
        const on = p === activePaso;
        return (
          <button
            key={p}
            className={`pw-step pw-step--${est}${on ? ' pw-step--active' : ''}`}
            onClick={() => onPick(p)}
            title={M.label}
            aria-current={on ? 'step' : undefined}
          >
            <span className="pw-step-dot">{est === 'aprobado' ? <Check size={13} /> : i + 1}</span>
            <span className="pw-step-body">
              <span className="pw-step-lbl"><M.Icon size={13} className="pw-step-ico" /> {M.label}</span>
              <span className="pw-step-state">{ESTADO_LABEL[est]}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
