// Biblioteca de videos en Cloudinary — fuente compartida (VideosTab + MontajeTab).
// Mergea el manifest estático (/cloud-videos.json, se ve sin backend) con el
// backend dinámico (/api/cloud-videos, uploads nuevos), dedup por URL, ordenado
// por fecha desc.
export interface CloudVid {
  id: string; name: string; url: string; thumbnail: string | null;
  duration_sec: number | null; size_bytes: number | null; created_at?: number;
}

export const normalizeVid = (v: Record<string, unknown>): CloudVid => ({
  id: String(v.id ?? v.public_id ?? v.name ?? ''),
  name: String(v.name ?? ''),
  url: String(v.url ?? ''),
  thumbnail: v.thumbnail ? String(v.thumbnail) : null,
  duration_sec: typeof v.duration_sec === 'number' ? v.duration_sec : null,
  size_bytes: typeof v.size_bytes === 'number' ? v.size_bytes : (typeof v.bytes === 'number' ? v.bytes : null),
  created_at: typeof v.created_at === 'number' ? v.created_at : undefined,
});

export const prettyVid = (n: string) =>
  n.replace(/_\d{8,}.*$/, '').replace(/\.(mp4|mov|webm|m4v)$/i, '').replace(/_/g, ' ').trim() || n;

export const fmtVidDate = (ms?: number) =>
  ms ? new Date(ms).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';

// thumbnail de Cloudinary: frame 0 como jpg (fallback al <video> si falla).
export const thumbOf = (v: CloudVid) =>
  v.thumbnail || (v.url ? v.url.replace('/upload/', '/upload/so_0,w_200/').replace(/\.\w+$/, '.jpg') : '');

export async function fetchCloudVideos(apiBase: string): Promise<CloudVid[]> {
  const byUrl = new Map<string, CloudVid>();
  try {
    const r = await fetch('/cloud-videos.json', { cache: 'no-store' });
    if (r.ok) { const d = await r.json(); (d.videos || []).map(normalizeVid).forEach((v: CloudVid) => v.url && byUrl.set(v.url, v)); }
  } catch { /* sin manifest */ }
  try {
    const r = await fetch(`${apiBase}/api/cloud-videos`);
    if (r.ok) { const d = await r.json(); (d.videos || []).map(normalizeVid).forEach((v: CloudVid) => v.url && byUrl.set(v.url, v)); }
  } catch { /* sin backend */ }
  return Array.from(byUrl.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}
