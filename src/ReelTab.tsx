// Solapa REEL — 2 tabs (misma filosofía que Audio):
//  · PROMPT: área de prompt + templates Flow (paneles) para generar el reel.
//  · EDITAR SLIDES: los frames/slides del reel + el audio de la solapa Audio,
//    en 2 líneas de tiempo (track Slides + track Audio). Cada slide se alinea
//    con su frase de audio → acá empieza el montaje de slides. (El cortar/
//    arrastrar los clips es el próximo paso; por ahora el layout.)
import { useEffect, useState } from 'react';
import { Wand2, Clapperboard, Film, AudioLines, Scissors, GripVertical } from 'lucide-react';
import VideoPromptBuilder from './VideoPromptBuilder';
import { extractFrames } from './lib/videoFrames';
import type { Project } from './lib/projects';
import './ReelTab.css';

export default function ReelTab({ project }: { project: Project }) {
  const [tab, setTab] = useState<'prompt' | 'editar'>('prompt');
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const [frames, setFrames] = useState<string[]>([]);   // thumbnails reales del boceto
  const reel = project.reels.find((r) => r.id === reelId) ?? project.reels[0] ?? null;
  const grabado = !!reel?.voiceConfig?.voice_id;       // ya tiene audio de la solapa Audio
  const n = reel?.frases ?? 0;
  const slides = Array.from({ length: n }, (_, i) => i);

  // saca N frames del boceto (slidesRef) para mostrar los slides reales como imágenes.
  useEffect(() => {
    let alive = true;
    setFrames([]);
    if (reel?.slidesRef && n > 0) extractFrames(reel.slidesRef, n).then((f) => { if (alive) setFrames(f); });
    return () => { alive = false; };
  }, [reel?.slidesRef, n]);

  return (
    <div className="rt-root">
      <div className="rt-tabs">
        <button className={tab === 'prompt' ? 'rt-tab rt-tab--on' : 'rt-tab'} onClick={() => setTab('prompt')}><Wand2 size={14} /> Prompt</button>
        <button className={tab === 'editar' ? 'rt-tab rt-tab--on' : 'rt-tab'} onClick={() => setTab('editar')}><Clapperboard size={14} /> Editar slides</button>
      </div>

      {tab === 'prompt' ? (
        <div className="rt-prompt"><VideoPromptBuilder /></div>
      ) : (
        <div className="rt-editor">
          {/* selector de reel del proyecto */}
          {project.reels.length > 0 && (
            <div className="rt-reelbar">
              {project.reels.map((r) => (
                <button key={r.id} className={r.id === reel?.id ? 'rt-reelchip rt-reelchip--on' : 'rt-reelchip'} onClick={() => setReelId(r.id)}>
                  {r.nombre}
                  {r.voiceConfig?.voice_id && <span className="rt-reelchip-dot" title="tiene audio grabado" />}
                </button>
              ))}
            </div>
          )}

          {/* frames / slides del reel */}
          <div className="rt-frames-wrap">
            <div className="rt-frames-head"><Film size={13} /> Slides del reel {reel ? `· ${reel.nombre}` : ''}</div>
            <div className="rt-frames">
              {slides.map((i) => (
                <div key={i} className="rt-frame">
                  <div className="rt-frame-thumb">
                    {frames[i] ? <img src={frames[i]} alt={`Slide ${i + 1}`} className="rt-frame-img" /> : <Film size={20} />}
                  </div>
                  <span className="rt-frame-lbl">Slide {i + 1}</span>
                </div>
              ))}
              {!n && <div className="rt-empty">Generá el reel en el tab «Prompt» y los slides aparecen acá para editar.</div>}
            </div>
          </div>

          {/* 2 líneas de tiempo: Slides + Audio */}
          {n > 0 && (
            <div className="rt-timeline">
              <div className="rt-track">
                <span className="rt-track-name"><Film size={12} /> Slides</span>
                <div className="rt-lane">
                  {slides.map((i) => (
                    <div key={i} className="rt-clip rt-clip--slide"><GripVertical size={11} className="rt-clip-grip" /> Slide {i + 1}</div>
                  ))}
                </div>
              </div>
              <div className="rt-track">
                <span className="rt-track-name"><AudioLines size={12} /> Audio</span>
                <div className="rt-lane">
                  {grabado ? slides.map((i) => (
                    <div key={i} className="rt-clip rt-clip--audio">frase {i + 1} <Scissors size={10} className="rt-clip-cut" /></div>
                  )) : <div className="rt-lane-empty">Grabá el audio en la solapa «Audio» y lo partís acá en pedacitos por slide.</div>}
                </div>
              </div>
              <div className="rt-hint">Cada slide alineado con su frase de audio. Próximo: arrastrar/cortar los clips para decidir qué audio suena en cada slide + transiciones.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
