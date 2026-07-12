// Catálogo de Formatos — "el norte" del rediseño (docs/rediseno/HANDOFF.md §8 + prototipo.dc.html
// ~línea 596). La entidad `Formato` (aspecto/plataforma/técnica/specsEntrega/moldes) es NUEVA y
// TODAVÍA NO EXISTE en el código — esta pantalla es la vitrina navegable con los formatos del
// HANDOFF como data LOCAL (no vienen de ningún endpoint: no hay backend de Formatos todavía).
//
// TODO(modelo-superior): definir la entidad `Formato` real (persistencia + wizard Formato-primero +
// cableado a moldes de guion/render por duración/plataforma/técnica) — no inventar esa lógica acá.
// Esta pantalla es sólo la vitrina; "Usar este formato" queda deshabilitado hasta que exista.
import type { LucideIcon } from 'lucide-react';
import { Sparkles, Smartphone, Wand2, Square, RectangleVertical, Youtube, Tv } from 'lucide-react';
import './FormatsCatalog.css';

interface FormatoCard {
  id: string; nombre: string; aspecto: '9:16' | '1:1' | '4:5' | '16:9';
  plataforma: string; duracion: string; tecnica: string; nota: string; accent: string; Icon: LucideIcon;
}

// Los 6 formatos del HANDOFF §8 (interface Formato): aspecto/plataforma/tecnicaProduccion reales del
// spec — la NOTA describe qué reusa cada uno del cerebro agnóstico (concepto/guion/cast/storyboard).
const FORMATOS: FormatoCard[] = [
  {
    id: 'reel-9-16', nombre: 'Reel vertical', aspecto: '9:16', plataforma: 'Instagram / TikTok', duracion: '15–30s',
    tecnica: 'Filmado', accent: 'var(--rd-green)', Icon: Smartphone,
    nota: 'El formato base: presentador a cámara + b-roll. Cast + Pack Flow + rodaje.',
  },
  {
    id: 'reel-animado-9-16', nombre: 'Reel animado', aspecto: '9:16', plataforma: 'Instagram / TikTok', duracion: '15–30s',
    tecnica: 'Animado', accent: 'var(--rd-blue)', Icon: Wand2,
    nota: 'Sin cast ni rodaje: motion graphics de las pantallas reales del producto (Playwright).',
  },
  {
    id: 'meta-feed-1-1', nombre: 'Meta Feed cuadrado', aspecto: '1:1', plataforma: 'Meta Ads', duracion: '15–30s',
    tecnica: 'Mixto', accent: 'var(--rd-gold)', Icon: Square,
    nota: 'Mismo concepto/guion del reel, recortado a cuadrado — capa de render propia para Feed.',
  },
  {
    id: 'meta-feed-4-5', nombre: 'Meta Feed retrato', aspecto: '4:5', plataforma: 'Meta Ads', duracion: '15–30s',
    tecnica: 'Slideshow', accent: 'var(--rd-gold)', Icon: RectangleVertical,
    nota: 'Piezas fijas (capturas/mockups) en secuencia — sin rodaje, ideal para catálogos.',
  },
  {
    id: 'spot-yt-16-9', nombre: 'Spot YouTube', aspecto: '16:9', plataforma: 'YouTube', duracion: '15–30s',
    tecnica: 'Filmado', accent: 'var(--rd-blue)', Icon: Youtube,
    nota: 'Mismo cerebro (concepto/guion/cast/storyboard), formato horizontal de entrega.',
  },
  {
    id: 'spot-tv-16-9', nombre: 'Spot TV', aspecto: '16:9', plataforma: 'TV', duracion: '20–30s',
    tecnica: 'Filmado', accent: 'var(--rd-ink-dim)', Icon: Tv,
    nota: 'Igual que YouTube, con specs de entrega (bitrate/safe areas) propias de TV.',
  },
];

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
