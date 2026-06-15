// Solapa MONTAJE — ajustes finales: transiciones entre clips, niveles, timing fino.
// El armado (slides + audio + música + video) se hace en la solapa REEL. Acá se
// pule el resultado. (Transiciones/niveles: próximo bloque.)
import { Layers, Wand2, SlidersHorizontal, Scissors } from 'lucide-react';
import type { Project } from './lib/projects';
import './MontajeTab.css';

export default function MontajeTab({ project }: { project: Project }) {
  return (
    <div className="mt-root">
      <div className="mt-head"><Layers size={15} /> Montaje — ajustes finales · {project.name}</div>
      <div className="mt-final">
        <p className="mt-final-lead">El reel se arma en la solapa <b>Reel</b> (slides + audio + música + video). Acá vienen los <b>ajustes finales</b> sobre ese montaje:</p>
        <div className="mt-final-grid">
          <div className="mt-final-card"><Wand2 size={16} /><span className="mt-final-t">Transiciones</span><span className="mt-final-d">cortes, fundidos y wipes entre slides y videos</span></div>
          <div className="mt-final-card"><SlidersHorizontal size={16} /><span className="mt-final-t">Niveles</span><span className="mt-final-d">volumen de voz vs música, ducking, fade in/out</span></div>
          <div className="mt-final-card"><Scissors size={16} /><span className="mt-final-t">Timing fino</span><span className="mt-final-d">ajustar la duración exacta de cada bloque</span></div>
        </div>
        <p className="mt-final-note">Próximo bloque. Primero terminamos el armado en Reel.</p>
      </div>
    </div>
  );
}
