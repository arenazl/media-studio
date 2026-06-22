// Marca por PROYECTO (agnóstico): cada cliente trae su logo/color/fonética. Reemplaza el
// uso del BRAND fijo (navy+gold) en lo que es contenido del cliente. Lógica pura, testeable.

export type LogoPos = 'tl' | 'tr' | 'bl' | 'br';

export interface BrandKit {
  name?: string;       // nombre de marca (para overlays/CTA)
  color?: string;      // color de acento (hex)
  logoUrl?: string;    // dataURL/URL del logo (overlay del preview/render)
  logoPos?: LogoPos;   // esquina donde va el logo
  phonetic?: string;   // marca fonética para TTS/Veo (ej. "Munifái")
}

export const DEFAULT_BRAND = { color: '#C8A24E', logoPos: 'tr' as LogoPos };

// Mezcla la marca del proyecto con los defaults (no muta).
export function resolveBrand(b?: BrandKit | null): BrandKit {
  return { color: DEFAULT_BRAND.color, logoPos: DEFAULT_BRAND.logoPos, ...(b ?? {}) };
}

const POS_CLASS: Record<LogoPos, string> = {
  tl: 'rt-brand--tl', tr: 'rt-brand--tr', bl: 'rt-brand--bl', br: 'rt-brand--br',
};
export function logoPosClass(pos?: LogoPos): string {
  return POS_CLASS[pos ?? 'tr'];
}

// Marca fonética para TTS/Veo: la explícita, o el nombre como fallback.
export function brandPhonetic(b?: BrandKit | null): string {
  return (b?.phonetic?.trim() || b?.name?.trim() || '');
}
