// Plantillas de promo REUTILIZABLES (Fase 6, agnóstico). Definen la estructura por bloques
// y el clima musical de cada tipo de pieza; el editor/wizard las usa como punto de partida.
// Datos puros (sin marca del cliente) → reusables en cualquier proyecto.

export type BlockRole = 'hook' | 'dolor' | 'solucion' | 'prueba' | 'cta';
export type MusicMood = 'energica' | 'inspiradora' | 'calida' | 'cinematografica';

export interface TemplateBlock { role: BlockRole; sec: number }
export interface PromoTemplate {
  id: string;
  label: string;
  profile: 'awareness' | 'demo' | 'conversion' | 'mockups-only';
  durationSec: number;
  music: MusicMood;
  blocks: TemplateBlock[];
}

export const PROMO_TEMPLATES: PromoTemplate[] = [
  {
    id: 'awareness-15', label: 'Awareness 15s', profile: 'awareness', durationSec: 15, music: 'energica',
    blocks: [{ role: 'hook', sec: 2 }, { role: 'dolor', sec: 4 }, { role: 'solucion', sec: 6 }, { role: 'cta', sec: 3 }],
  },
  {
    id: 'demo-20', label: 'Demo de producto 20s', profile: 'demo', durationSec: 20, music: 'inspiradora',
    blocks: [{ role: 'hook', sec: 2 }, { role: 'solucion', sec: 13 }, { role: 'cta', sec: 5 }],
  },
  {
    id: 'conversion-18', label: 'Conversión 18s', profile: 'conversion', durationSec: 18, music: 'calida',
    blocks: [{ role: 'hook', sec: 2 }, { role: 'dolor', sec: 3 }, { role: 'solucion', sec: 7 }, { role: 'prueba', sec: 3 }, { role: 'cta', sec: 3 }],
  },
  {
    id: 'mockups-12', label: 'Solo mockups 12s', profile: 'mockups-only', durationSec: 12, music: 'inspiradora',
    blocks: [{ role: 'hook', sec: 2 }, { role: 'solucion', sec: 8 }, { role: 'cta', sec: 2 }],
  },
];

export function templateById(id: string): PromoTemplate | undefined {
  return PROMO_TEMPLATES.find((t) => t.id === id);
}

// suma de duraciones de los bloques (debe coincidir con durationSec — invariante testeado).
export function templateDuration(t: PromoTemplate): number {
  return t.blocks.reduce((s, b) => s + b.sec, 0);
}

// duraciones de slide sugeridas (s) por bloque — punto de partida para el track de animaciones.
export function templateSlideSecs(t: PromoTemplate): number[] {
  return t.blocks.map((b) => b.sec);
}
