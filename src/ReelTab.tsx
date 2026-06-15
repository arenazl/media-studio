// Solapa REEL — el EDITOR acumulativo del reel: Slides + Audio + Música + Video.
// La galería de videos (estilo Fotos) sale de Cloudinary; se arma todo acá. El
// Montaje queda aparte para los ajustes finales/transiciones.
import { useEffect, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import ReelEditor from './ReelEditor';
import { fetchCloudVideos, type CloudVid } from './lib/cloudVideos';
import { API_BASE } from './config';
import type { Project } from './lib/projects';
import './ReelTab.css';

export default function ReelTab({ project, audioByReel = {} }: { project: Project; audioByReel?: Record<string, string> }) {
  const [videos, setVideos] = useState<CloudVid[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true; setLoading(true);
    fetchCloudVideos(API_BASE).then((v) => { if (alive) { setVideos(v); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="rt-root">
      <div className="rt-head"><Clapperboard size={15} /> Editor del reel</div>
      <ReelEditor project={project} audioByReel={audioByReel} videos={videos} videosLoading={loading} />
    </div>
  );
}
