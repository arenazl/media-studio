// Solapa VIDEOS — lista local (dev) + galería Cloudinary (prod + dev) + upload.
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, FolderOpen, Film, Upload, Trash2, Cloud } from 'lucide-react';
import VideoPromptBuilder from './VideoPromptBuilder';
import { API_BASE } from './config';
import './VideosTab.css';

interface LocalVid  { name: string; size: number; url: string }
interface CloudVid  { id: string; name: string; url: string; thumbnail: string | null; duration_sec: number | null; size_bytes: number | null }

const api = (path: string) => `${API_BASE}${path}`;

export default function VideosTab() {
  // locales (dev)
  const [localVids, setLocalVids] = useState<LocalVid[]>([]);
  const [localDir,  setLocalDir]  = useState('');
  const [localErr,  setLocalErr]  = useState<string | null>(null);

  // cloudinary
  const [cloudVids,    setCloudVids]    = useState<CloudVid[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudErr,     setCloudErr]     = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const loadLocal = async () => {
    try {
      const r = await fetch(api('/api/videos'));
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setLocalVids(d.videos || []);
      setLocalDir(d.dir || '');
      setLocalErr(null);
    } catch (e) {
      setLocalErr(e instanceof Error ? e.message : 'error — ¿backend local corriendo?');
    }
  };

  const loadCloud = async () => {
    setCloudLoading(true); setCloudErr(null);
    try {
      const r = await fetch(api('/api/cloud-videos'));
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setCloudVids(d.videos || []);
    } catch (e) {
      setCloudErr(e instanceof Error ? e.message : 'error cargando videos cloud');
    } finally { setCloudLoading(false); }
  };

  useEffect(() => { loadLocal(); loadCloud(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true); setCloudErr(null);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const r = await fetch(api('/api/cloud-videos/upload'), { method: 'POST', body: form });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      await loadCloud();
    } catch (e) {
      setCloudErr(e instanceof Error ? e.message : 'error al subir');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este video de Cloudinary?')) return;
    try {
      await fetch(api(`/api/cloud-videos/${id}`), { method: 'DELETE' });
      setCloudVids((vs) => vs.filter((v) => v.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="vids-root">
      <VideoPromptBuilder />

      {/* ── CLOUD VIDEOS ──────────────────────────────────────────────── */}
      <div className="vids-panel">
        <div className="vids-head">
          <span className="vids-title"><Cloud size={14} /> VIDEOS EN CLOUDINARY ({cloudVids.length})</span>
          <div className="vids-head-actions">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="vids-upload-btn"
            >
              <Upload size={12} /> {uploading ? 'Subiendo…' : 'Subir video'}
            </button>
            <button onClick={loadCloud} disabled={cloudLoading} className="vids-refresh">
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
        />

        {cloudErr && <div className="vids-error">{cloudErr}</div>}
        {!cloudErr && !cloudVids.length && (
          <div className="vids-empty">Subí un video con el botón de arriba — quedará en Cloudinary y disponible en todos los entornos.</div>
        )}
        <div className="vids-grid">
          {cloudVids.map((v) => (
            <div key={v.id} className="vids-card">
              {v.thumbnail
                ? <img src={v.thumbnail} className="vids-thumb" alt={v.name} />
                : <video src={v.url} preload="metadata" className="vids-video" />
              }
              <div className="vids-meta">
                <span className="vids-name">{v.name}</span>
                <span className="vids-size">{v.size_bytes ? (v.size_bytes / 1e6).toFixed(1) + ' MB' : ''}</span>
              </div>
              <div className="vids-card-actions">
                <a href={v.url} target="_blank" rel="noopener" className="vids-link">Ver</a>
                <button onClick={() => handleDelete(v.id)} className="vids-del"><Trash2 size={12} /> Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIDEOS LOCALES (dev) ───────────────────────────────────────── */}
      {(localVids.length > 0 || localErr) && (
        <div className="vids-panel">
          <div className="vids-head">
            <span className="vids-title"><Film size={14} /> VIDEOS LOCALES ({localVids.length})</span>
            <button onClick={loadLocal} className="vids-refresh"><RefreshCw size={12} /> Actualizar</button>
          </div>
          {localDir && <div className="vids-dir"><FolderOpen size={12} /> {localDir}</div>}
          {localErr && <div className="vids-error">error: {localErr}</div>}
          <div className="vids-grid">
            {localVids.map((v) => (
              <div key={v.name} className="vids-card">
                <video src={v.url} controls preload="metadata" className="vids-video" />
                <div className="vids-meta">
                  <span className="vids-name">{v.name}</span>
                  <span className="vids-size">{(v.size / 1e6).toFixed(1)} MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
