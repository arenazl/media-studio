// Workspace de VIDEOS (rediseño F3, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html ~línea 715).
// ORGANIZADOR de la biblioteca (no editor de video: los clips los genera Flow). Lista + detalle:
// recorte in/out, metadata (proyecto/clasificación), "Al multipista". La metadata de organización
// vive local (lib/videoLibrary); clasificación por IA (Gemini Vision) al subir.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Search, Sparkles, Loader2, X, Copy, Check } from 'lucide-react';
import { API_BASE } from './config';
import { effectiveModel } from './lib/settings';
import { fetchCloudVideos, prettyVid as pretty, thumbOf, type CloudVid } from './lib/cloudVideos';
import {
  loadMeta, saveMeta, metaOf, toggleFavorite, addTag, addTags, removeTag, setProject, setTrim,
  filterVideos, classifyVideo, type MetaMap,
} from './lib/videoLibrary';
import VideoDetail from './VideoDetail';
import './VideosWorkspace.css';

const api = (path: string) => `${API_BASE}${path}`;

type Filtro = 'todos' | 'favoritos' | 'sinclasificar' | 'conproyecto';
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'sinclasificar', label: 'Sin clasificar' },
  { id: 'conproyecto', label: 'Con proyecto' },
];

export default function VideosTab({ onGoEditor }: { onGoEditor?: () => void } = {}) {
  const [cloudVids, setCloudVids] = useState<CloudVid[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudErr, setCloudErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [meta, setMeta] = useState<MetaMap>(() => loadMeta());
  const mutate = (next: MetaMap) => { setMeta(next); saveMeta(next); };

  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classifying, setClassifying] = useState<{ done: number; total: number } | null>(null);
  const [reclassifyingIds, setReclassifyingIds] = useState<Set<string>>(new Set());

  // WO-6c: modal del molde `videoprompt` standalone (prompt de Flow suelto).
  const [vpOpen, setVpOpen] = useState(false);
  const [vpBrief, setVpBrief] = useState('');
  const [vpModo, setVpModo] = useState<'talking-head' | 'b-roll'>('talking-head');
  const [vpBusy, setVpBusy] = useState(false);
  const [vpErr, setVpErr] = useState('');
  const [vpResult, setVpResult] = useState('');
  const [vpCopied, setVpCopied] = useState(false);

  const generarPrompt = async () => {
    if (!vpBrief.trim()) { setVpErr('Escribí una descripción del video.'); return; }
    setVpBusy(true); setVpErr(''); setVpResult('');
    try {
      const r = await fetch(api('/api/run-function'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId: 'videoprompt', context: {}, options: { brief: vpBrief.trim(), modo: vpModo }, model: effectiveModel('videoprompt') }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo generar el prompt');
      setVpResult((d.result?.prompt as string) || '');
    } catch (e) { setVpErr(e instanceof Error ? e.message : 'error'); } finally { setVpBusy(false); }
  };
  const copiarPrompt = async () => {
    try { await navigator.clipboard.writeText(vpResult); setVpCopied(true); setTimeout(() => setVpCopied(false), 1500); } catch { /* noop */ }
  };

  const storeTags = (id: string, tags: string[], replace = false) => {
    if (!replace && !tags.length) return;
    setMeta((prev) => {
      const next = replace ? { ...prev, [id]: { ...metaOf(prev, id), tags } } : addTags(prev, id, tags);
      saveMeta(next);
      return next;
    });
  };

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

  // AUTO-clasificación: cada video sin tags se clasifica solo al cargar/subir (sin botón).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = cloudVids.filter((v) => metaOf(meta, v.id).tags.length === 0);
      if (!pending.length) { setClassifying(null); return; }
      for (let i = 0; i < pending.length; i++) {
        if (cancelled) return;
        setClassifying({ done: i, total: pending.length });
        const v = pending[i];
        const tags = await classifyVideo(API_BASE, v.thumbnail || thumbOf(v));
        if (cancelled) return;
        storeTags(v.id, tags);
      }
      if (!cancelled) setClassifying(null);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudVids]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(api(`/api/cloud-videos/${id}`), { method: 'DELETE' });
      setCloudVids((vs) => vs.filter((v) => v.id !== id));
    } catch { /* ignore */ }
  };

  const reclassify = async (v: CloudVid) => {
    setReclassifyingIds((s) => new Set(s).add(v.id));
    try { const tags = await classifyVideo(API_BASE, v.thumbnail || thumbOf(v)); storeTags(v.id, tags, true); }
    finally { setReclassifyingIds((s) => { const n = new Set(s); n.delete(v.id); return n; }); }
  };

  const shown = useMemo(() => {
    const base = filterVideos(cloudVids, meta, { query: q });
    return base.filter((v) => {
      const m = metaOf(meta, v.id);
      if (filtro === 'favoritos') return m.favorite;
      if (filtro === 'sinclasificar') return m.tags.length === 0;
      if (filtro === 'conproyecto') return !!m.project;
      return true;
    });
  }, [cloudVids, meta, q, filtro]);

  // selección: por default el primero de la lista filtrada; si el activo sale del filtro, reelige.
  useEffect(() => {
    if (!shown.length) { setSelectedId(null); return; }
    if (!selectedId || !shown.some((v) => v.id === selectedId)) setSelectedId(shown[0].id);
  }, [shown, selectedId]);

  const selected = shown.find((v) => v.id === selectedId) ?? null;

  return (
    <div className="vw-root">
      <div className="vw-header">
        <div>
          <h1 className="vw-title">Videos</h1>
          <p className="vw-sub">Trabajá cada clip por separado — recorte, clasificación, versiones — y mandalo al multipista.</p>
        </div>
        <div className="vw-header-actions">
          <button className="vw-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? 'Subiendo…' : 'Importar de Flow'}
          </button>
          {/* WO-6c: molde `videoprompt` standalone — un prompt de Flow suelto, fuera de un proyecto. */}
          <button className="vw-btn vw-btn--gold" onClick={() => { setVpOpen(true); setVpErr(''); }} title="Generar un prompt de Google Flow (Veo) suelto">
            <Sparkles size={14} /> Generar prompt
          </button>
        </div>
      </div>

      <div className="vw-filters">
        {FILTROS.map((f) => (
          <button key={f.id} className={filtro === f.id ? 'vw-chip vw-chip--on' : 'vw-chip'} onClick={() => setFiltro(f.id)}>{f.label}</button>
        ))}
        <div className="vw-search">
          <Search size={12} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar por nombre o tag…" />
        </div>
        <button className="vw-refresh" onClick={loadCloud} disabled={cloudLoading}>{cloudLoading ? 'Actualizando…' : 'Actualizar'}</button>
      </div>

      {cloudErr && <div className="vw-error">{cloudErr}</div>}
      {classifying && (
        <div className="vw-classifying"><Loader2 size={11} className="vw-spin" /> clasificando con IA {classifying.done}/{classifying.total}…</div>
      )}

      <div className="vw-body">
        <div className="vw-list">
          {shown.map((v) => {
            const m = metaOf(meta, v.id);
            const on = v.id === selectedId;
            return (
              <button key={v.id} className={on ? 'vw-card vw-card--on' : 'vw-card'} onClick={() => setSelectedId(v.id)}>
                <div className="vw-thumb">
                  <img src={thumbOf(v)} alt="" loading="lazy" onError={(e) => e.currentTarget.classList.add('vw-thumb-broken')} />
                  {v.duration_sec != null && <span className="vw-thumb-dur">{Math.round(v.duration_sec)}s</span>}
                  {m.tags[0] && <span className="vw-thumb-tag">{m.tags[0]}</span>}
                  {m.favorite && <span className="vw-thumb-fav">★</span>}
                </div>
                <div className="vw-card-name">{pretty(v.name)}</div>
              </button>
            );
          })}
          {!shown.length && !cloudLoading && <div className="vw-list-empty">Sin videos para este filtro.</div>}
        </div>

        {selected ? (
          <VideoDetail
            video={selected}
            meta={metaOf(meta, selected.id)}
            onToggleFavorite={() => mutate(toggleFavorite(meta, selected.id))}
            onAddTag={(t) => mutate(addTag(meta, selected.id, t))}
            onRemoveTag={(t) => mutate(removeTag(meta, selected.id, t))}
            onSetProject={(p) => mutate(setProject(meta, selected.id, p))}
            onSetTrim={(a, b) => mutate(setTrim(meta, selected.id, a, b))}
            onDelete={() => handleDelete(selected.id)}
            onReclassify={() => reclassify(selected)}
            reclassifying={reclassifyingIds.has(selected.id)}
            onGoEditor={onGoEditor}
          />
        ) : (
          <div className="vw-empty-detail">{cloudLoading ? 'Cargando biblioteca…' : 'Subí o elegí un video de la biblioteca.'}</div>
        )}
      </div>

      <input
        ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" className="vw-hidden-input"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
      />

      {vpOpen && (
        <div className="vw-modal-backdrop" onClick={() => setVpOpen(false)}>
          <div className="vw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vw-modal-head">
              <h3><Sparkles size={16} /> Prompt de Google Flow</h3>
              <button className="vw-modal-x" onClick={() => setVpOpen(false)}><X size={16} /></button>
            </div>
            <div className="vw-modal-body">
              <label className="vw-modal-lbl">¿Qué querés que muestre el video?</label>
              <textarea
                className="vw-modal-textarea" rows={4} value={vpBrief} placeholder="Ej: una emprendedora en su local mostrando cómo carga un producto en la app, tono cercano y confiado."
                onChange={(e) => setVpBrief(e.target.value)}
              />
              <label className="vw-modal-lbl">Tipo de plano</label>
              <div className="vw-modal-chips">
                {(['talking-head', 'b-roll'] as const).map((m) => (
                  <button key={m} className={vpModo === m ? 'vw-modal-chip vw-modal-chip--on' : 'vw-modal-chip'} onClick={() => setVpModo(m)}>
                    {m === 'talking-head' ? 'Talking head' : 'B-roll'}
                  </button>
                ))}
              </div>
              {vpErr && <div className="vw-modal-err">{vpErr}</div>}
              {vpResult && (
                <div className="vw-modal-result">
                  <div className="vw-modal-result-head">
                    <span>Prompt (pegalo en Flow)</span>
                    <button className="vw-modal-copy" onClick={copiarPrompt}>
                      {vpCopied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                    </button>
                  </div>
                  <pre className="vw-modal-pre">{vpResult}</pre>
                </div>
              )}
            </div>
            <div className="vw-modal-foot">
              <button className="vw-btn" onClick={() => setVpOpen(false)}>Cerrar</button>
              <button className="vw-btn vw-btn--gold" disabled={vpBusy || !vpBrief.trim()} onClick={generarPrompt}>
                {vpBusy ? <><Loader2 size={14} className="vw-spin" /> Generando…</> : <><Sparkles size={14} /> {vpResult ? 'Regenerar' : 'Generar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
