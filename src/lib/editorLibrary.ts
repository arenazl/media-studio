// Biblioteca (panel izq.) del editor multipista — docs/rediseno/HANDOFF.md §9. Los tabs "Clips" y
// "Marca" se pueblan con datos REALES del proyecto/comercial (rodaje/renderRef, brandKit); "Audio" con
// el catálogo real de música (music.ts) + la voz grabada del reel. "Texto" y "Efectos" son un catálogo
// FIJO de herramientas de edición (como cualquier NLE) — no son contenido generado del cliente, por eso
// no hace falta ningún molde de IA para poblarlos. Puro y testeable.
import type { Comercial } from './comercial';
import type { Project, ProjectReel } from './projects';
import { MUSIC_TRACKS } from './music';

export type LibTab = 'clips' | 'audio' | 'texto' | 'efectos' | 'marca';

export interface LibItem {
  id: string;
  label: string;
  meta: string;
  color: string;
  fileRef?: string;   // asset real (server/storage) o URL de música — presente cuando el item es "soltable"
  durSec?: number;    // WO-6a: duración real del clip (para poblar el clip al soltarlo en la timeline)
  tab?: LibTab;       // WO-6a: de qué pista viene el item — decide en qué pista de la timeline se dropea
}

export const LIB_TABS: { id: LibTab; label: string }[] = [
  { id: 'clips', label: 'Clips' },
  { id: 'audio', label: 'Audio' },
  { id: 'texto', label: 'Texto' },
  { id: 'efectos', label: 'Efectos' },
  { id: 'marca', label: 'Marca' },
];

// Catálogo fijo de presets de texto (herramienta de edición, no dato del cliente). Droppables a la
// pista texto (WO-6a): el label es el contenido inicial, editable en el inspector.
export const TEXT_PRESETS: LibItem[] = [
  { id: 'preset-titulo', label: 'Título grande', meta: 'titulo', color: '#F5F1E8', tab: 'texto' },
  { id: 'preset-lower', label: 'Lower third', meta: 'lower', color: '#00B37E', tab: 'texto' },
  { id: 'preset-cta', label: 'CTA botón', meta: 'cta', color: '#FFB800', tab: 'texto' },
  { id: 'preset-subs', label: 'Subtítulos auto', meta: 'subs', color: '#4AA3FF', tab: 'texto' },
  { id: 'preset-precio', label: 'Precio destacado', meta: 'precio', color: '#FF5C8A', tab: 'texto' },
];

// Catálogo fijo de efectos (herramienta de edición).
export const EFFECT_PRESETS: LibItem[] = [
  { id: 'fx-pushin', label: 'Push-in sutil', meta: 'cámara · VEO look', color: '#7C5CFF' },
  { id: 'fx-fade', label: 'Fade in/out', meta: 'transición', color: '#4AA3FF' },
  { id: 'fx-zoom', label: 'Zoom rápido', meta: 'énfasis', color: '#FFB800' },
  { id: 'fx-flash', label: 'Flash blanco', meta: 'corte al beat', color: '#F5F1E8' },
  { id: 'fx-ramp', label: 'Speed ramp', meta: 'cámara lenta→rápida', color: '#FF5C8A' },
];

function buildClipsBin(comercial: Comercial | undefined): LibItem[] {
  if (!comercial) return [];
  if (comercial.tipo === 'animado') {
    return comercial.renderRef
      ? [{ id: 'clip-render', label: 'Render animado', meta: 'motion graphics · mp4', color: '#00B37E', fileRef: comercial.renderRef, tab: 'clips' }]
      : [];
  }
  return (comercial.rodaje || []).map((t) => ({
    id: `clip-${t.id}`,
    label: `Escena ${t.escenaN}`,
    meta: `${t.durSec.toFixed(1)}s · toma importada`,
    color: '#7C5CFF',
    fileRef: t.fileRef,
    durSec: t.durSec,
    tab: 'clips' as LibTab,
  }));
}

function buildAudioBin(reel: ProjectReel | undefined): LibItem[] {
  const items: LibItem[] = [];
  const voiceRef = reel?.voiceConfig?.audioRef;
  if (voiceRef) items.push({ id: 'audio-voz', label: 'Voz en off', meta: 'grabada del comercial', color: '#00B37E', fileRef: voiceRef, tab: 'audio' });
  for (const t of MUSIC_TRACKS) items.push({ id: `audio-${t.id}`, label: t.label, meta: `música · ${t.cat}`, color: '#FFB800', fileRef: t.url, tab: 'audio' });
  return items;
}

function buildMarcaBin(project: Project | null): LibItem[] {
  const bk = project?.brandKit;
  if (!bk) return [];
  const items: LibItem[] = [];
  if (bk.logoUrl) items.push({ id: 'marca-logo', label: 'Logo', meta: `overlay · esquina ${bk.logoPos || 'tr'}`, color: bk.color || '#00B37E', fileRef: bk.logoUrl });
  if (bk.color) items.push({ id: 'marca-color', label: 'Color de marca', meta: bk.color, color: bk.color });
  const fon = bk.phonetic || bk.name;
  if (fon) items.push({ id: 'marca-fon', label: fon, meta: 'marca fonética', color: bk.color || '#FFB800' });
  return items;
}

// Las 5 pistas de la biblioteca. Sin proyecto/comercial → todo lo real queda vacío (estado honesto);
// texto/efectos siempre muestran su catálogo fijo (son herramientas, no datos del cliente).
export function buildLibraryTabs(project: Project | null, reel: ProjectReel | undefined, comercial: Comercial | undefined): Record<LibTab, LibItem[]> {
  return {
    clips: buildClipsBin(comercial),
    audio: buildAudioBin(reel),
    texto: TEXT_PRESETS,
    efectos: EFFECT_PRESETS,
    marca: buildMarcaBin(project),
  };
}

// filtro de búsqueda (case-insensitive, label + meta) — el buscador de la biblioteca.
export function filterLibItems(items: LibItem[], query: string): LibItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => it.label.toLowerCase().includes(q) || it.meta.toLowerCase().includes(q));
}
