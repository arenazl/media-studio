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
