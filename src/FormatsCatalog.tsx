// Catálogo de Formatos — "el norte" del rediseño (docs/rediseno/HANDOFF.md §8 + prototipo.dc.html
// ~línea 596). La entidad `Formato` (aspecto/plataforma/técnica/specsEntrega/moldes) es NUEVA y
// TODAVÍA NO EXISTE en el código — esta pantalla es la vitrina navegable con los formatos del
// HANDOFF como data LOCAL (no vienen de ningún endpoint: no hay backend de Formatos todavía).
// La data (FORMATOS) vive en src/lib/formatosCatalog.ts — la reusa también el wizard formato-primero
// (Fase 5, Wizard.tsx) para no duplicar el catálogo en dos pantallas.
//
// TODO(modelo-superior): definir la entidad `Formato` real (persistencia + cableado a moldes de
// guion/render por duración/plataforma/técnica) — no inventar esa lógica acá. Esta pantalla sigue
// siendo sólo la vitrina; "Usar este formato" queda deshabilitado hasta que exista.
import { Sparkles } from 'lucide-react';
import { FORMATOS } from './lib/formatosCatalog';
import './FormatsCatalog.css';

export default function FormatsCatalog() {
  return (
    <div className="fc-root">
      <div className="fc-pill"><Sparkles size={12} /> El norte · Formato como entidad</div>
      <h1 className="fc-title">Catálogo de formatos</h1>
      <p className="fc-lead">
        La ingesta (KSP) y el cerebro (concepto/guion/cast/storyboard) son agnósticos al formato.
        Cada formato solo agrega su capa de producción y sus specs de entrega.
      </p>

      <div className="fc-grid">
        {FORMATOS.map((f) => {
          const Icon = f.Icon;
          return (
            <div key={f.id} className="fc-card" style={{ borderTopColor: f.accent }}>
              <div className="fc-card-top">
                <div className="fc-card-icon" style={{ background: `color-mix(in srgb, ${f.accent} 20%, transparent)`, color: f.accent }}>
                  <Icon size={20} />
                </div>
                <span className="fc-card-aspecto">{f.aspecto}</span>
              </div>
              <div className="fc-card-name">{f.nombre}</div>
              <div className="fc-card-nota">{f.nota}</div>
              <div className="fc-card-specs">
                <div className="fc-spec-row"><span>Plataforma</span><span>{f.plataforma}</span></div>
                <div className="fc-spec-row"><span>Duración</span><span>{f.duracion}</span></div>
                <div className="fc-spec-row"><span>Técnica</span><span>{f.tecnica}</span></div>
              </div>
              <button className="fc-card-cta" disabled title="Pendiente: entidad Formato + wizard Formato-primero (TODO modelo-superior)">
                Usar este formato
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
