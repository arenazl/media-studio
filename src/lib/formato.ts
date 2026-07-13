// Entidad FORMATO (WO-1 del plan de cableado, docs/rediseno/07-PLAN-OPUS-CABLEADO.md · HANDOFF §8).
// El formato de salida (aspecto/plataforma/técnica/duración) deja de ser metadata cosmética del
// wizard y pasa a ser una ENTIDAD tipada que decide: (1) el `tipo` del comercial (bifurcación del
// pipeline filmado/animado — mapeo D2), (2) los prompts de los moldes (WO-2, interpolan aspecto/
// plataforma) y (3) las dimensiones del render (WO-3, plan.width/height/fps).
//
// FUENTE ÚNICA de los formatos: `FORMATOS_DEF`. `formatosCatalog.ts` deriva de acá su capa de
// presentación (accent/Icon/nota). Acotado a lo que el sistema EJECUTA hoy: specsEntrega/moldeGuion/
// moldeRender del HANDOFF §8 NO se agregan (nada los consume — YAGNI; se suman con su consumidor).
import type { TipoComercial } from './comercial';

export type Aspecto = '9:16' | '1:1' | '4:5' | '16:9';
export type TecnicaProduccion = 'filmado' | 'animado' | 'mixto' | 'slideshow' | '3D';

export interface Formato {
  id: string;
  nombre: string;
  aspecto: Aspecto;
  dims: { width: number; height: number };   // ver DIMS_POR_ASPECTO
  fps: number;                                // 30 en todos por ahora
  plataforma: string;                         // texto para prompts/UI ("Instagram / TikTok", "Meta Ads", "YouTube", "TV")
  tecnicaProduccion: TecnicaProduccion;
  duracion: { min: number; max: number; default: number };  // seg
}

// Dimensiones canónicas por aspecto (el render las usa como plan.width/height — WO-3).
export const DIMS_POR_ASPECTO: Record<Aspecto, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '16:9': { width: 1920, height: 1080 },
};

export const FORMATO_DEFAULT_ID = 'reel-9-16';

// Los 6 formatos del catálogo actual (mismos ids/nombres/aspectos/plataformas/técnicas que la vieja
// data estática de formatosCatalog.ts). Duración: default 20 en todos salvo el spot de TV (default 25,
// rango 20–30); el resto rango 15–30.
export const FORMATOS_DEF: Formato[] = [
  {
    id: 'reel-9-16', nombre: 'Reel vertical', aspecto: '9:16', dims: DIMS_POR_ASPECTO['9:16'], fps: 30,
    plataforma: 'Instagram / TikTok', tecnicaProduccion: 'filmado', duracion: { min: 15, max: 30, default: 20 },
  },
  {
    id: 'reel-animado-9-16', nombre: 'Reel animado', aspecto: '9:16', dims: DIMS_POR_ASPECTO['9:16'], fps: 30,
    plataforma: 'Instagram / TikTok', tecnicaProduccion: 'animado', duracion: { min: 15, max: 30, default: 20 },
  },
  {
    id: 'meta-feed-1-1', nombre: 'Meta Feed cuadrado', aspecto: '1:1', dims: DIMS_POR_ASPECTO['1:1'], fps: 30,
    plataforma: 'Meta Ads', tecnicaProduccion: 'mixto', duracion: { min: 15, max: 30, default: 20 },
  },
  {
    id: 'meta-feed-4-5', nombre: 'Meta Feed retrato', aspecto: '4:5', dims: DIMS_POR_ASPECTO['4:5'], fps: 30,
    plataforma: 'Meta Ads', tecnicaProduccion: 'slideshow', duracion: { min: 15, max: 30, default: 20 },
  },
  {
    id: 'spot-yt-16-9', nombre: 'Spot YouTube', aspecto: '16:9', dims: DIMS_POR_ASPECTO['16:9'], fps: 30,
    plataforma: 'YouTube', tecnicaProduccion: 'filmado', duracion: { min: 15, max: 30, default: 20 },
  },
  {
    id: 'spot-tv-16-9', nombre: 'Spot TV', aspecto: '16:9', dims: DIMS_POR_ASPECTO['16:9'], fps: 30,
    plataforma: 'TV', tecnicaProduccion: 'filmado', duracion: { min: 20, max: 30, default: 25 },
  },
];

// Mapeo D2 (tecnicaProduccion → tipo del pipeline). Solo existen 2 pipelines (TipoComercial):
//   filmado → 'filmado' · animado → 'animado' · mixto → 'filmado' (el 1:1 recorta el reel filmado)
//   slideshow → 'animado' (piezas fijas sin rodaje) · 3D → 'filmado' (default conservador).
const TECNICA_A_TIPO: Record<TecnicaProduccion, TipoComercial> = {
  filmado: 'filmado',
  animado: 'animado',
  mixto: 'filmado',
  slideshow: 'animado',
  '3D': 'filmado',
};

// ── Helpers puros ─────────────────────────────────────────────────────────────

export function getFormato(id?: string): Formato | undefined {
  if (!id) return undefined;
  return FORMATOS_DEF.find((f) => f.id === id);
}

// El tipo del pipeline a partir del formato. Sin formato (proyectos viejos) → 'filmado' (como hoy).
export function tipoDesdeFormato(f?: Formato): TipoComercial {
  return f ? TECNICA_A_TIPO[f.tecnicaProduccion] : 'filmado';
}
