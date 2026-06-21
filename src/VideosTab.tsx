// Solapa VIDEOS — ORGANIZADOR de la biblioteca (no editor de video: los videos los
// genera Flow). Acá se CATALOGAN y ENCUENTRAN: favoritos, tags, proyecto, buscador y
// filtros. La metadata de organización vive local (lib/videoLibrary). Sub-tab aparte:
// generador de prompts para Flow.
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Film, Upload, Trash2, Wand2, Clock, Star, Tag, Search, X, FolderKanban } from 'lucide-react';
import VideoPromptBuilder from './VideoPromptBuilder';
import { API_BASE } from './config';
import { fetchCloudVideos, prettyVid as pretty, fmtVidDate as fmtDate, thumbOf, type CloudVid } from './lib/cloudVideos';
import {
  loadMeta, saveMeta, metaOf, toggleFavorite, addTag, removeTag, setProject,
  allTags, allProjects, filterVideos, type MetaMap,
} from './lib/videoLibrary';
import './VideosTab.css';
import './VideoLibrary.css';

const api = (path: string) => `${API_BASE}${path}`;

export default function VideosTab() {
  const [cloudVids, setCloudVids] = useState<CloudVid[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudErr, setCloudErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vtab, setVtab] = useState<'biblioteca' | 'prompt'>('biblioteca');
  const fileRef = useRef<HTMLInputElement>(null);

  // metadata de organización (local) — tags / favorito / proyecto por video.
  const [meta, setMeta] = useState<MetaMap>(() => loadMeta());
  const mutate = (next: MetaMap) => { setMeta(next); saveMeta(next); };

  // filtros
  const [q, setQ] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [tagF, setTagF] = useState('');
  const [projF, setProjF] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const loadCloud = async () => {
    setCloudLoading(true); setCloudErr(null);
    try {
      const list = await fetchCloudVideos(API_BASE);
      setCloudVids(list);
      if (!list.length) setCloudErr('No hay videos en la biblioteca todavía.');
    } catch { setCloudErr('No se pudo cargar la biblioteca.'); } finally { setCloudLoading(false); }
  };
  useEffect(() => { loadCloud(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true); setCloudErr(null);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const r = await fetch(api('/api/cloud-videos/upload'), { method: 'POST', body: form });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      await loadCloud();
    } catch (e) { setCloudErr(e instanceof Error ? e.message : 'error al subir (¿backend local corriendo?)'); } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    try { await fetch(api(`/api/cloud-videos/${id}`), { method: 'DELETE' }); setCloudVids((vs) => vs.filter((v) => v.id !== id)); } catch { /* ignore */ }
  };

  const tags = useMemo(() => allTags(meta), [meta]);
  const projects = useMemo(() => allProjects(meta), [meta]);
  const shown = useMemo(
    () => filterVideos(cloudVids, meta, { query: q, favorite: favOnly || undefined, tag: tagF || undefined, project: projF || undefined }),
    [cloudVids, meta, q, favOnly, tagF, projF],
  );

  const commitTag = (id: string) => { if (newTag.trim()) { mutate(addTag(meta, id, newTag)); setNewTag(''); } };

  return (
    <div className="vids-root">
      <div className="vids-tabs">
        <button className={vtab === 'biblioteca' ? 'vids-tab vids-tab--on' : 'vids-tab'} onClick={() => setVtab('biblioteca')}><Film size={14} /> Biblioteca</button>
        <button className={vtab === 'prompt' ? 'vids-tab vids-tab--on' : 'vids-tab'} onClick={() => setVtab('prompt')}><Wand2 size={14} /> Prompt Flow</button>
      </div>

      {vtab === 'prompt' ? (
        <div className="vids-prompt-wrap"><VideoPromptBuilder /></div>
      ) : (
        <>
          {/* barra: buscador + favoritos + subir/actualizar */}
          <div className="vlib-bar">
            <div className="vlib-search">
              <Search size={13} className="vlib-search-icon" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar por nombre o tag…" className="vlib-search-input" />
            </div>
            <button className={favOnly ? 'vlib-chip vlib-chip--on' : 'vlib-chip'} onClick={() => setFavOnly((f) => !f)} title="Solo favoritos"><Star size={12} fill={favOnly ? 'currentColor' : 'none'} /> Favoritos</button>
            <div className="vlib-bar-right">
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="vlib-btn"><Upload size={12} /> {uploading ? 'Subiendo…' : 'Subir'}</button>
              <button onClick={loadCloud} disabled={cloudLoading} className="vlib-btn"><RefreshCw size={12} /> Actualizar</button>
            </div>
          </div>

          {/* filtros por tag / proyecto (sólo si existen) */}
          {(tags.length > 0 || projects.length > 0) && (
            <div className="vlib-filters">
              {tags.length > 0 && (
                <div className="vlib-filter-row">
                  <span className="vlib-filter-lbl"><Tag size={11} /> Tags</span>
                  <button className={!tagF ? 'vlib-fchip vlib-fchip--on' : 'vlib-fchip'} onClick={() => setTagF('')}>Todos</button>
                  {tags.map((t) => <button key={t} className={tagF === t ? 'vlib-fchip vlib-fchip--on' : 'vlib-fchip'} onClick={() => setTagF(tagF === t ? '' : t)}>{t}</button>)}
                </div>
              )}
              {projects.length > 0 && (
                <div className="vlib-filter-row">
                  <span className="vlib-filter-lbl"><FolderKanban size={11} /> Proyecto</span>
                  <button className={!projF ? 'vlib-fchip vlib-fchip--on' : 'vlib-fchip'} onClick={() => setProjF('')}>Todos</button>
                  {projects.map((p) => <button key={p} className={projF === p ? 'vlib-fchip vlib-fchip--on' : 'vlib-fchip'} onClick={() => setProjF(projF === p ? '' : p)}>{p}</button>)}
                </div>
              )}
            </div>
          )}

          <div className="vlib-count">{shown.length} de {cloudVids.length} videos · Cloudinary · catalogá con ★ y tags para reusarlos entre proyectos</div>
          {cloudErr && <div className="vids-error">{cloudErr}</div>}

          {/* grilla densa de thumbs chicos */}
          <div className="vlib-grid">
            {shown.map((v) => {
              const m = metaOf(meta, v.id);
              const editing = editId === v.id;
              return (
                <div key={v.id} className={editing ? 'vlib-card vlib-card--edit' : 'vlib-card'}>
                  <div className="vlib-thumb">
                    <img src={thumbOf(v)} alt="" loading="lazy" className="vlib-thumb-img" onError={(e) => e.currentTarget.classList.add('vlib-thumb-img--broken')} />
                    <button className={m.favorite ? 'vlib-star vlib-star--on' : 'vlib-star'} title="Favorito" onClick={() => mutate(toggleFavorite(meta, v.id))}><Star size={12} fill={m.favorite ? 'currentColor' : 'none'} /></button>
                    <a href={v.url} target="_blank" rel="noreferrer" className="vlib-open" title="Abrir">↗</a>
                  </div>
                  <div className="vlib-name" title={v.name}>{pretty(v.name)}</div>
                  <div className="vlib-sub"><Clock size={9} /> {fmtDate(v.created_at)}{v.duration_sec ? ` · ${Math.round(v.duration_sec)}s` : ''}{m.project ? ` · ${m.project}` : ''}</div>
                  <div className="vlib-tags">
                    {m.tags.map((t) => (
                      <span key={t} className="vlib-tag">{t}<button className="vlib-tag-x" title="Quitar tag" onClick={() => mutate(removeTag(meta, v.id, t))}><X size={8} /></button></span>
                    ))}
                    <button className="vlib-tag-add" title="Etiquetar / proyecto" onClick={() => { setEditId(editing ? null : v.id); setNewTag(''); }}><Tag size={10} /></button>
                  </div>
                  {editing && (
                    <div className="vlib-edit">
                      <input className="vlib-edit-in" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitTag(v.id); }} placeholder="tag + Enter" autoFocus />
                      <input className="vlib-edit-in" defaultValue={m.project ?? ''} onBlur={(e) => mutate(setProject(meta, v.id, e.target.value))} placeholder="proyecto" />
                      <button className="vlib-edit-del" title="Eliminar de Cloudinary" onClick={() => handleDelete(v.id)}><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" className="vids-hidden-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
    </div>
  );
}
