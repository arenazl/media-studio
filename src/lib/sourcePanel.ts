// Lógica PURA del control genérico de selección+preview (SourcePanel). Sin React/DOM
// → unit-testeable. El componente sólo orquesta estado + UI; el filtrado/orden vive
// acá. Un "source" es cualquier fuente del editor: voces, música, animaciones, videos,
// imágenes, clips de librería… todos comparten esta forma y este pipeline.

export interface SourceItem {
  id: string;
  label: string;                         // texto principal (nombre)
  sub?: string;                          // subtítulo (duración, voz, etc.)
  thumb?: string;                        // url de miniatura (vista grid)
  meta?: Record<string, string>;         // claves para los filtros dinámicos (género, categoría…)
  searchText?: string;                   // texto extra indexado para la búsqueda (ej. el guión completo)
  createdAt?: number;                    // para ordenar por más recientes
  // payload libre que el host usa al seleccionar (no lo toca la lógica pura).
  data?: unknown;
}

export type SortMode = 'none' | 'recent' | 'alpha';

// opciones de un filtro: las explícitas, o derivadas de los valores presentes en meta[key].
export function deriveFilterOptions(items: SourceItem[], key: string): string[] {
  const seen = new Set<string>();
  for (const it of items) { const v = it.meta?.[key]; if (v) seen.add(v); }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

// filtra por filtros activos (meta exacta) + búsqueda de texto (label + sub + searchText).
export function filterItems(items: SourceItem[], query: string, active: Record<string, string>): SourceItem[] {
  const q = query.trim().toLowerCase();
  const activeEntries = Object.entries(active).filter(([, v]) => v);
  return items.filter((it) => {
    for (const [k, v] of activeEntries) { if ((it.meta?.[k] ?? '') !== v) return false; }
    if (!q) return true;
    return `${it.label} ${it.sub ?? ''} ${it.searchText ?? ''}`.toLowerCase().includes(q);
  });
}

// orden: recientes (createdAt desc), alfabético, o sin tocar.
export function sortItems(items: SourceItem[], mode: SortMode): SourceItem[] {
  if (mode === 'none') return items;
  const arr = [...items];
  if (mode === 'recent') arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  else if (mode === 'alpha') arr.sort((a, b) => a.label.localeCompare(b.label));
  return arr;
}

// pipeline completo: filtrar → ordenar. Es lo que consume el render del panel.
export function applyView(items: SourceItem[], query: string, active: Record<string, string>, sort: SortMode): SourceItem[] {
  return sortItems(filterItems(items, query, active), sort);
}

// nombre derivado de un texto (las primeras palabras) — para nombrar clips de librería.
export function deriveName(text: string, maxWords = 6, maxChars = 42): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Sin título';
  const words = clean.split(' ').slice(0, maxWords).join(' ');
  return (words.length > maxChars ? words.slice(0, maxChars).trimEnd() + '…' : words);
}
