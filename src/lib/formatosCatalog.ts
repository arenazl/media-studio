// Capa de PRESENTACIÓN de los formatos — datos COMPARTIDOS entre la vitrina de Fase 3
// (FormatsCatalog.tsx) y el wizard formato-primero de Fase 5 (Wizard.tsx).
//
// La ENTIDAD real (aspecto/dims/fps/plataforma/técnica/duración + cableado a tipo/moldes/render) vive
// en `formato.ts` (FUENTE ÚNICA — WO-1). Acá queda SOLO lo que la entidad no necesita: el accent, el
// icono y la nota descriptiva por id. `FORMATOS` se DERIVA de `FORMATOS_DEF` mergeando esa capa, para
// que ambas pantallas usen la misma fuente sin duplicar aspectos/plataformas/duraciones.
import type { LucideIcon } from 'lucide-react';
import { Smartphone, Wand2, Square, RectangleVertical, Youtube, Tv } from 'lucide-react';
import { FORMATOS_DEF, type Aspecto } from './formato';

export interface FormatoCard {
  id: string; nombre: string; aspecto: Aspecto;
  plataforma: string; duracion: string; tecnica: string; nota: string; accent: string; Icon: LucideIcon;
}

// Presentación por id (accent/Icon/nota) — lo único que la entidad `Formato` no modela.
interface Presentacion { accent: string; Icon: LucideIcon; nota: string }
const PRESENTACION: Record<string, Presentacion> = {
  'reel-9-16': {
    accent: 'var(--rd-green)', Icon: Smartphone,
    nota: 'El formato base: presentador a cámara + b-roll. Cast + Pack Flow + rodaje.',
  },
  'reel-animado-9-16': {
    accent: 'var(--rd-blue)', Icon: Wand2,
    nota: 'Sin cast ni rodaje: motion graphics de las pantallas reales del producto (Playwright).',
  },
  'meta-feed-1-1': {
    accent: 'var(--rd-gold)', Icon: Square,
    nota: 'Mismo concepto/guion del reel, recortado a cuadrado — capa de render propia para Feed.',
  },
  'meta-feed-4-5': {
    accent: 'var(--rd-gold)', Icon: RectangleVertical,
    nota: 'Piezas fijas (capturas/mockups) en secuencia — sin rodaje, ideal para catálogos.',
  },
  'spot-yt-16-9': {
    accent: 'var(--rd-blue)', Icon: Youtube,
    nota: 'Mismo cerebro (concepto/guion/cast/storyboard), formato horizontal de entrega.',
  },
  'spot-tv-16-9': {
    accent: 'var(--rd-ink-dim)', Icon: Tv,
    nota: 'Igual que YouTube, con specs de entrega (bitrate/safe areas) propias de TV.',
  },
};

// Duración de la entidad → el string "15–30s" que muestran las cards (rango, no default).
const rangoDuracion = (d: { min: number; max: number }) => `${d.min}–${d.max}s`;
// Técnica de la entidad → label capitalizado para la UI.
const tecnicaLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Los formatos para la UI: entidad (fuente única) + capa de presentación por id.
export const FORMATOS: FormatoCard[] = FORMATOS_DEF.map((f) => {
  const pres = PRESENTACION[f.id];
  return {
    id: f.id, nombre: f.nombre, aspecto: f.aspecto, plataforma: f.plataforma,
    duracion: rangoDuracion(f.duracion), tecnica: tecnicaLabel(f.tecnicaProduccion),
    nota: pres?.nota ?? '', accent: pres?.accent ?? 'var(--rd-ink-dim)', Icon: pres?.Icon ?? Smartphone,
  };
});
