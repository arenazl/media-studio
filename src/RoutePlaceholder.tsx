// Placeholder de rutas que todavía no se implementan en esta fase (Formatos = Fase 5, Editor
// multipista = Fase 9). El ítem del rail ya navega; el contenido llega en una fase siguiente.
import type { LucideIcon } from 'lucide-react';
import './RoutePlaceholder.css';

export default function RoutePlaceholder({ Icon, title, note }: { Icon: LucideIcon; title: string; note: string }) {
  return (
    <div className="rp-page">
      <div className="rp-inner">
        <div className="rp-icon"><Icon size={26} /></div>
        <h1 className="rp-title">{title}</h1>
        <p className="rp-note">{note}</p>
        <span className="rp-badge">Próximamente</span>
      </div>
    </div>
  );
}
