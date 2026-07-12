// Rail izquierdo (74px) — navegación GLOBAL nueva (reemplaza a la Topbar como nav de nivel
// app; docs/rediseno/HANDOFF.md §2 + prototipo.dc.html líneas 33-46). Topbar sigue viva pero
// SOLO dentro de route==='project' (secciones del proyecto: pipeline/negocio/audio/videos/editor).
import { Play, Home, LayoutTemplate, Share2, Video, AudioLines } from 'lucide-react';
import { RAIL_ROUTES, railGroupFor, type Route } from './lib/routes';
import './Rail.css';

// Solo los 5 ítems que viven en el rail (los contextuales — project/wizard/editor — no entran acá).
const ICONS: Partial<Record<Route, typeof Home>> = {
  home: Home, formats: LayoutTemplate, ksp: Share2, videos: Video, audio: AudioLines,
};

export default function Rail({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  const active = railGroupFor(route);
  return (
    <nav className="rail">
      <button className="rail-logo" onClick={() => onNavigate('home')} title="Inicio">
        <Play size={18} fill="currentColor" strokeWidth={0} />
      </button>
      <div className="rail-items">
        {RAIL_ROUTES.map((item) => {
          const Icon = ICONS[item.id] ?? Home;
          const on = active === item.id;
          return (
            <button
              key={item.id}
              className={on ? 'rail-item rail-item--on' : 'rail-item'}
              title={item.label}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} />
              <span className="rail-item-label">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="rail-spacer" />
      <div className="rail-avatar" title="Media Studio">MS</div>
    </nav>
  );
}
