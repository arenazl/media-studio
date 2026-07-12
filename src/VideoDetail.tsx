// Panel de detalle del workspace de Videos (rediseño F3, prototipo.dc.html ~línea 715): preview +
// recorte in/out (metadata local, real — NO dispara un corte/render; eso lo hace el render del
// comercial cuando el clip se usa en un proyecto) + panel de metadata (proyecto/clasificación).
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Scissors, Star, Trash2, RefreshCw, Tag, X, ArrowRightToLine } from 'lucide-react';
import type { CloudVid } from './lib/cloudVideos';
import { prettyVid as pretty, fmtVidDate as fmtDate } from './lib/cloudVideos';
import type { VideoMeta } from './lib/videoLibrary';
import './VideosWorkspace.css';

interface Props {
  video: CloudVid;
  meta: VideoMeta;
  onToggleFavorite: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSetProject: (project: string) => void;
  onDelete: () => void;
  onReclassify: () => void;
  reclassifying: boolean;
  onSetTrim: (trimIn: number, trimOut: number) => void;
  onGoEditor?: () => void;
}

const fmtSec = (s: number) => {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

export default function VideoDetail({
  video, meta, onToggleFavorite, onAddTag, onRemoveTag, onSetProject, onDelete, onReclassify, reclassifying, onSetTrim, onGoEditor,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<'in' | 'out' | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(video.duration_sec || 0);
  const [dragIn, setDragIn] = useState(meta.trimIn ?? 0);
  const [dragOut, setDragOut] = useState(meta.trimOut ?? (video.duration_sec || 0));
  const [newTag, setNewTag] = useState('');
  const [projectDraft, setProjectDraft] = useState(meta.project ?? '');

  // al cambiar de video: resetea preview + handles de recorte al estado persistido de ESE video.
  useEffect(() => {
    setPlaying(false);
    setDuration(video.duration_sec || 0);
    setDragIn(meta.trimIn ?? 0);
    setDragOut(meta.trimOut ?? (video.duration_sec || 0));
    setProjectDraft(meta.project ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); } else { v.pause(); setPlaying(false); }
  };

  const fracFromEvent = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect(); if (!rect || !rect.width) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };
  const startDrag = (which: 'in' | 'out') => (e: React.PointerEvent) => {
    dragRef.current = which;
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onBarMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !duration) return;
    const sec = fracFromEvent(e.clientX) * duration;
    if (dragRef.current === 'in') setDragIn(Math.min(sec, dragOut - 0.2));
    else setDragOut(Math.max(sec, dragIn + 0.2));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    onSetTrim(dragIn, dragOut);
  };
  const commitTrim = () => onSetTrim(dragIn, dragOut);

  const commitTag = () => { if (newTag.trim()) { onAddTag(newTag); setNewTag(''); } };

  const inPct = duration ? (dragIn / duration) * 100 : 0;
  const outPct = duration ? (dragOut / duration) * 100 : 100;

  return (
    <div className="vw-detail">
      <div className="vw-preview-col">
        <div className="vw-preview">
          <video
            ref={videoRef}
            src={video.url}
            className="vw-preview-video"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || video.duration_sec || 0)}
            onEnded={() => setPlaying(false)}
            onClick={togglePlay}
          />
          <button className="vw-preview-play" onClick={togglePlay} title={playing ? 'Pausa' : 'Reproducir'}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>

        <div className="vw-trim">
          <div className="vw-trim-head">
            <span>Recorte</span>
            <span className="vw-trim-dur">{fmtSec(dragIn)} – {fmtSec(dragOut)} · {fmtSec(duration)}</span>
          </div>
          <div ref={barRef} className="vw-trim-bar" onPointerMove={onBarMove} onPointerUp={endDrag}>
            <div className="vw-trim-range" style={{ left: `${inPct}%`, right: `${100 - outPct}%` }} />
            <div className="vw-trim-handle" style={{ left: `${inPct}%` }} onPointerDown={startDrag('in')} />
            <div className="vw-trim-handle" style={{ left: `${outPct}%` }} onPointerDown={startDrag('out')} />
          </div>
          <div className="vw-trim-actions">
            <button className="vw-btn" onClick={commitTrim} disabled={!duration}><Scissors size={13} /> Recortar</button>
            <button className="vw-btn vw-btn--primary" onClick={onGoEditor} disabled={!onGoEditor}>
              <ArrowRightToLine size={13} /> Al multipista
            </button>
          </div>
        </div>
      </div>

      <div className="vw-meta">
        <div className="vw-meta-top">
          <button className={meta.favorite ? 'vw-fav vw-fav--on' : 'vw-fav'} onClick={onToggleFavorite} title="Favorito">
            <Star size={14} fill={meta.favorite ? 'currentColor' : 'none'} />
          </button>
          <span className="vw-meta-name" title={video.name}>{pretty(video.name)}</span>
        </div>

        <div className="vw-meta-label">Origen</div>
        <div className="vw-meta-val">Cloudinary · {fmtDate(video.created_at) || 'sin fecha'}</div>

        <div className="vw-meta-label">Proyecto</div>
        <input
          className="vw-meta-input"
          value={projectDraft}
          onChange={(e) => setProjectDraft(e.target.value)}
          onBlur={() => onSetProject(projectDraft)}
          placeholder="sin asignar"
        />

        <div className="vw-meta-label">Clasificación</div>
        <div className="vw-meta-tags">
          {meta.tags.map((t) => (
            <span key={t} className="vw-tag">{t}<button onClick={() => onRemoveTag(t)} title="Quitar"><X size={9} /></button></span>
          ))}
          <span className="vw-tag-add">
            <Tag size={10} />
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitTag(); }} placeholder="tag + Enter" />
          </span>
        </div>

        {/* Prompt usado: sin fuente real hoy — un cloud video no queda linkeado a la escena de Pack
            Flow que lo originó. TODO(modelo-superior): cablear ese link (Formato/Pack Flow → clip
            importado) cuando la entidad Formato exista — no inventar el prompt mientras tanto. */}
        <div className="vw-meta-label">Prompt usado</div>
        <div className="vw-meta-empty">Sin registrar (el clip no está linkeado a una escena de Pack Flow)</div>

        <div className="vw-meta-actions">
          <button className="vw-btn" onClick={onReclassify} disabled={reclassifying}>
            <RefreshCw size={13} className={reclassifying ? 'vw-spin' : ''} /> {reclassifying ? 'Clasificando…' : 'Reclasificar'}
          </button>
          <a className="vw-btn" href={video.url} target="_blank" rel="noreferrer">Abrir original</a>
          <button className="vw-btn vw-btn--danger" onClick={onDelete}><Trash2 size={13} /> Eliminar</button>
        </div>
      </div>
    </div>
  );
}
