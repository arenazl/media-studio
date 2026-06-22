// Organizador de la biblioteca de videos. Cloudinary NO trae tags/proyecto/favorito,
// así que la metadata de ORGANIZACIÓN vive local (localStorage) y se cruza con los
// videos por id. NO editamos video (eso lo hace Flow); acá sólo catalogamos y
// encontramos. La lógica pura (filtrar/derivar/mutar inmutable) es unit-testeable.

export interface VideoMeta { tags: string[]; favorite: boolean; project?: string }
export type MetaMap = Record<string, VideoMeta>;

const LS_KEY = 'ms.videoMeta.v1';

export function loadMeta(): MetaMap {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) as MetaMap; } catch { /* noop */ }
  return {};
}
export function saveMeta(m: MetaMap): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch { /* noop */ }
}

export const metaOf = (m: MetaMap, id: string): VideoMeta => m[id] ?? { tags: [], favorite: false };

// ── mutaciones INMUTABLES (devuelven un MetaMap nuevo) ───────────────────────
export function setMetaFor(m: MetaMap, id: string, patch: Partial<VideoMeta>): MetaMap {
  return { ...m, [id]: { ...metaOf(m, id), ...patch } };
}
export function toggleFavorite(m: MetaMap, id: string): MetaMap {
  return setMetaFor(m, id, { favorite: !metaOf(m, id).favorite });
}
export function addTag(m: MetaMap, id: string, tag: string): MetaMap {
  const t = tag.trim().toLowerCase(); if (!t) return m;
  const cur = metaOf(m, id); if (cur.tags.includes(t)) return m;
  return setMetaFor(m, id, { tags: [...cur.tags, t] });
}
export function addTags(m: MetaMap, id: string, tags: string[]): MetaMap {
  const cur = metaOf(m, id);
  const norm = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const merged = [...new Set([...cur.tags, ...norm])];
  return merged.length === cur.tags.length ? m : setMetaFor(m, id, { tags: merged });
}
export function removeTag(m: MetaMap, id: string, tag: string): MetaMap {
  return setMetaFor(m, id, { tags: metaOf(m, id).tags.filter((x) => x !== tag) });
}
export function setProject(m: MetaMap, id: string, project: string): MetaMap {
  return setMetaFor(m, id, { project: project.trim() || undefined });
}

// ── derivados para los filtros (categorías que existen) ──────────────────────
export function allTags(m: MetaMap): string[] {
  const s = new Set<string>();
  for (const v of Object.values(m)) for (const t of v.tags) s.add(t);
  return [...s].sort((a, b) => a.localeCompare(b));
}
export function allProjects(m: MetaMap): string[] {
  const s = new Set<string>();
  for (const v of Object.values(m)) if (v.project) s.add(v.project);
  return [...s].sort((a, b) => a.localeCompare(b));
}

// ── clasificación por IA (tipos de clip de video promocional) ────────────────
export const VIDEO_TYPES = ['modelo', 'close-up', 'people', 'office', 'producto', 'exterior', 'interior', 'manos', 'pantalla', 'naturaleza', 'comida', 'ciudad'];

// pide al backend (Gemini Vision sobre el thumbnail) los tags de tipo del video.
export async function classifyVideo(apiBase: string, thumbnail: string): Promise<string[]> {
  try {
    const r = await fetch(`${apiBase}/api/classify-video`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thumbnail, types: VIDEO_TYPES }),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.tags) ? d.tags : [];
  } catch { return []; }
}

// ── filtrado (búsqueda + favorito + tag + proyecto) ──────────────────────────
export interface VideoFilter { query?: string; tag?: string; favorite?: boolean; project?: string }
export function filterVideos<T extends { id: string; name: string }>(videos: T[], m: MetaMap, f: VideoFilter): T[] {
  const q = (f.query ?? '').trim().toLowerCase();
  return videos.filter((v) => {
    const meta = metaOf(m, v.id);
    if (f.favorite && !meta.favorite) return false;
    if (f.tag && !meta.tags.includes(f.tag)) return false;
    if (f.project && meta.project !== f.project) return false;
    if (q && !`${v.name} ${meta.tags.join(' ')} ${meta.project ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
