// Solapa VIDEOS — DOS partes separadas:
//  (A) BIBLIOTECA: videos en Cloudinary (subidos desde la carpeta local),
//      ordenados por fecha. El user los ve acá y (próximo paso) los inserta en
//      el editor/montaje donde quiera. Fuente: manifest /cloud-videos.json +
//      backend /api/cloud-videos (mergeados) → se ven con o sin backend local.
//  (B) GENERAR PROMPT para Flow — sección aparte, colapsable.
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, FolderOpen, Film, Upload, Trash2, Cloud, Wand2, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import VideoPromptBuilder from './VideoPromptBuilder';
import { API_BASE } from './config';
import { fetchCloudVideos, prettyVid as pretty, fmtVidDate as fmtDate, type CloudVid } from './lib/cloudVideos';
import './VideosTab.css';

interface LocalVid { name: string; size: number; url: string }

const api = (path: string) => `${API_BASE}${path}`;

export default function VideosTab() {
  const [cloudVids, setCloudVids] = useState<CloudVid[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudErr, setCloudErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localVids, setLocalVids] = useState<LocalVid[]>([]);
  const [localDir, setLocalDir] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCloud = async () => {
    setCloudLoading(true); setCloudErr(null);
    try {
      const list = await fetchCloudVideos(API_BASE);
      setCloudVids(list);
      if (!list.length) setCloudErr('No hay videos en la biblioteca todavía.');
    } catch { setCloudErr('No se pudo cargar la biblioteca.'); } finally { setCloudLoading(false); }
  };

  const loadLocal = async () => {
    try {
      const r = await fetch(api('/api/videos'));
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setLocalVids(d.videos || []); setLocalDir(d.dir || ''); }
    } catch { /* sin backend local */ }
  };

  useEffect(() => { loadCloud(); loadLocal(); }, []);

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
    if (!confirm('¿Eliminar este video de Cloudinary?')) return;
    try { await fetch(api(`/api/cloud-videos/${id}`), { method: 'DELETE' }); setCloudVids((vs) => vs.filter((v) => v.id !== id)); } catch { /* ignore */ }
  };

  return (
    <div className="vids-root">
      {/* (A) BIBLIOTECA CLOUDINARY */}
      <div className="vids-panel">
        <div className="vids-head">
          <span className="vids-title"><Film size={14} /> BIBLIOTECA DE VIDEOS ({cloudVids.length})</span>
          <div className="vids-head-actions">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="vids-upload-btn"><Upload size={12} /> {uploading ? 'Subiendo…' : 'Subir'}</button>
            <button onClick={loadCloud} disabled={cloudLoading} className="vids-refresh"><RefreshCw size={12} /> Actualizar</button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" className="vids-hidden-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
        <div className="vids-dir"><Cloud size={12} /> Cloudinary · ordenados por fecha (más nuevos primero)</div>
        {cloudErr && <div className="vids-error">{cloudErr}</div>}
        <div className="vids-grid">
          {cloudVids.map((v) => (
            <div key={v.id} className="vids-card">
              <video className="vids-video" src={v.url} poster={v.thumbnail || undefined} controls preload="none" playsInline />
              <div className="vids-meta">
                <span className="vids-name" title={v.name}>{pretty(v.name)}</span>
                <span className="vids-size">{v.duration_sec ? `${Math.round(v.duration_sec)}s` : (v.size_bytes ? `${(v.size_bytes / 1e6).toFixed(1)}MB` : '')}</span>
              </div>
              <div className="vids-card-actions">
                <span className="vids-date"><Clock size={11} /> {fmtDate(v.created_at)}</span>
                <a href={v.url} target="_blank" rel="noreferrer" className="vids-link">abrir ↗</a>
                <button onClick={() => handleDelete(v.id)} className="vids-del" title="Eliminar de Cloudinary"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIDEOS LOCALES (solo dev, si el backend está corriendo) */}
      {localVids.length > 0 && (
        <div className="vids-panel">
          <div className="vids-head"><span className="vids-title"><FolderOpen size={14} /> EN LA CARPETA LOCAL ({localVids.length})</span></div>
          {localDir && <div className="vids-dir"><FolderOpen size={12} /> {localDir} — subí estos a Cloudinary con «Subir»</div>}
          <div className="vids-grid">
            {localVids.map((v) => (
              <div key={v.name} className="vids-card">
                <video src={api(v.url)} controls preload="none" className="vids-video" />
                <div className="vids-meta"><span className="vids-name" title={v.name}>{pretty(v.name)}</span><span className="vids-size">{(v.size / 1e6).toFixed(1)}MB</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* (B) GENERAR PROMPT PARA FLOW — sección aparte */}
      <div className="vids-panel">
        <button onClick={() => setShowPrompt((s) => !s)} className="vids-section-toggle">
          {showPrompt ? <ChevronDown size={15} /> : <ChevronRight size={15} />}<Wand2 size={14} /> GENERAR PROMPT PARA FLOW
        </button>
        {showPrompt && <div className="vids-prompt-wrap"><VideoPromptBuilder /></div>}
      </div>
    </div>
  );
}
