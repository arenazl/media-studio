// Catálogo de Formatos — datos COMPARTIDOS entre la vitrina de Fase 3 (FormatsCatalog.tsx) y el
// wizard formato-primero de Fase 5 (Wizard.tsx). Antes vivía duplicado dentro de FormatsCatalog.tsx;
// se extrajo acá para que ambas pantallas usen la MISMA fuente (docs/rediseno/HANDOFF.md §8).
//
// La entidad `Formato` real (persistencia + cableado a tipo/moldes por aspecto/plataforma/técnica)
// TODAVÍA NO EXISTE — esto es sólo la data ESTÁTICA del selector/vitrina, no un catálogo persistido.
// TODO(modelo-superior): cuando exista la entidad Formato, este archivo pasa a ser el seed/fallback.
import type { LucideIcon } from 'lucide-react';
import { Smartphone, Wand2, Square, RectangleVertical, Youtube, Tv } from 'lucide-react';

export interface FormatoCard {
  id: string; nombre: string; aspecto: '9:16' | '1:1' | '4:5' | '16:9';
  plataforma: string; duracion: string; tecnica: string; nota: string; accent: string; Icon: LucideIcon;
}

// Los 6 formatos del HANDOFF §8 (interface Formato): aspecto/plataforma/tecnicaProduccion reales del
// spec — la NOTA describe qué reusa cada uno del cerebro agnóstico (concepto/guion/cast/storyboard).
export const FORMATOS: FormatoCard[] = [
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
