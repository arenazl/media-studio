// Solapa MONTAJE — misma filosofía: paneles colapsables arriba + timeline abajo.
//  · Panel "Videos": subís videos local→Cloudinary (los exportás de tu máquina y
//    los subís acá). Se muestran como MINIATURAS chiquitas (no galería gigante).
//  · Timeline de 3 tracks: Slides + Audio (vienen del reel/solapas anteriores) +
//    Video (el 3er nivel, donde ponés los pedacitos de video). Acá se arma el
//    montaje entero. (Cortar/arrastrar clips + transiciones = próximo paso.)
import { useEffect, useRef, useState } from 'react';
import { Film, AudioLines, Video, Upload, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { API_BASE } from './config';
import { fetchCloudVideos, prettyVid, thumbOf, type CloudVid } from './lib/cloudVideos';
import type { Project } from './lib/projects';
import './MontajeTab.css';

export default function MontajeTab({ project }: { project: Project }) {
  const [vids, setVids] = useState<CloudVid[]>([]);
  const [libOpen, setLibOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reel = project.reels.find((r) => r.id === reelId) ?? project.reels[0] ?? null;
  const grabado = !!reel?.voiceConfig?.voice_id;
  const n = reel?.frases ?? 0;
  const slides = Array.from({ length: n }, (_, i) => i);

  const load = () => fetchCloudVideos(API_BASE).then(setVids).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    setUploading(true); setErr(null);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const r = await fetch(`${API_BASE}/api/cloud-videos/upload`, { method: 'POST', body: form });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || `HTTP ${r.status}`); }
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'error al subir (¿backend local corriendo?)'); } finally { setUploading(false); }
  };

  return (
    <div className="mt-root">
      {/* panel colapsable: biblioteca de videos (miniaturas chiquitas) */}
      <div className="mt-panel">
        <div className="mt-panel-head">
          <button className="mt-panel-toggle" onClick={() => setLibOpen((o) => !o)}>
            {libOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Video size={14} /> Videos <span className="mt-count">{vids.length}</span>
          </button>
          <label className="mt-upload">
            <Upload size={13} /> {uploading ? 'Subiendo…' : 'Subir video'}
            <input ref={fileRef} type="file" accept="video/*" hidden disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); if (fileRef.current) fileRef.current.value = ''; }} />
          </label>
        </div>
        {libOpen && (
          <div className="mt-lib">
            {vids.map((v) => (
              <div key={v.id} className="mt-thumb" draggable title={prettyVid(v.name)}>
                <img src={thumbOf(v)} alt="" className="mt-thumb-img" onError={(e) => e.currentTarget.classList.add('mt-thumb-img--broken')} />
                <span className="mt-thumb-name">{prettyVid(v.name)}</span>
              </div>
            ))}
            {!vids.length && <div className="mt-empty">Subí tus videos (los exportás de tu máquina) y aparecen acá como miniaturas para meter en el montaje.</div>}
          </div>
        )}
        {err && <div className="mt-err">{err}</div>}
      </div>

      {/* selector de reel */}
      {project.reels.length > 0 && (
        <div className="mt-reelbar">
          {project.reels.map((r) => (
            <button key={r.id} className={r.id === reel?.id ? 'mt-reelchip mt-reelchip--on' : 'mt-reelchip'} onClick={() => setReelId(r.id)}>{r.nombre}</button>
          ))}
        </div>
      )}

      {/* timeline de 3 tracks: Slides + Audio + Video */}
      <div className="mt-timeline">
        <div className="mt-track">
          <span className="mt-track-name"><Film size={12} /> Slides</span>
          <div className="mt-lane">
            {n > 0 ? slides.map((i) => <div key={i} className="mt-clip mt-clip--slide"><GripVertical size={11} className="mt-clip-grip" /> Slide {i + 1}</div>)
              : <div className="mt-lane-empty">Generá el reel en la solapa «Reel».</div>}
          </div>
        </div>
        <div className="mt-track">
          <span className="mt-track-name"><AudioLines size={12} /> Audio</span>
          <div className="mt-lane">
            {n > 0 && grabado ? slides.map((i) => <div key={i} className="mt-clip mt-clip--audio">frase {i + 1}</div>)
              : <div className="mt-lane-empty">Grabá el audio en la solapa «Audio».</div>}
          </div>
        </div>
        <div className="mt-track mt-track--video">
          <span className="mt-track-name"><Video size={12} /> Video</span>
          <div className="mt-lane mt-lane--drop">
            <div className="mt-lane-empty">Arrastrá videos de arriba a este track para meterlos entre los slides.</div>
          </div>
        </div>
        <div className="mt-hint">Acá se arma el montaje entero: slides + audio + tus videos. Próximo: arrastrar/cortar los pedacitos de video en el track + transiciones.</div>
      </div>
    </div>
  );
}
