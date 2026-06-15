// Solapa REEL — el EDITOR del reel slide-based (los "dibujitos" 9:16, NO los
// videos Veo/Flow — eso vive en la solapa Videos). Arriba las PALETAS (slides
// reales del boceto + chips de música), después la WAVEFORM del audio, y abajo
// 3 LÍNEAS DE TIEMPO (Slides · Música · Audio). Arrastrás slides y música a sus
// tracks; el Audio viene de la narración partida en frases. (Cortar/transiciones = next.)
import { useEffect, useState } from 'react';
import { Film, AudioLines, Music2, GripVertical, X, Clapperboard } from 'lucide-react';
import CadenceWave from './CadenceWave';
import { extractFrames } from './lib/videoFrames';
import { MUSIC_TRACKS } from './lib/music';
import { NARRATION } from './data/narrationText';
import type { Project } from './lib/projects';
import './ReelTab.css';

export default function ReelTab({ project }: { project: Project }) {
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const [frames, setFrames] = useState<string[]>([]);       // thumbnails reales del boceto
  const [slideTrack, setSlideTrack] = useState<number[]>([]); // slides colocados en el track
  const [musicTrack, setMusicTrack] = useState<string[]>([]); // música colocada en el track
  const [over, setOver] = useState<string | null>(null);      // track resaltado al arrastrar

  const reel = project.reels.find((r) => r.id === reelId) ?? project.reels[0] ?? null;
  const n = reel?.frases ?? 0;
  const slides = Array.from({ length: n }, (_, i) => i);
  const phrases: string[] = (reel && NARRATION[reel.id]) || [];
  const waveText = phrases.length ? phrases.join('  ') : '';

  // frames reales del boceto + arranca el track de slides con todos en orden.
  useEffect(() => {
    let alive = true; setFrames([]); setSlideTrack(slides); setMusicTrack([]);
    if (reel?.slidesRef && n > 0) extractFrames(reel.slidesRef, n).then((f) => { if (alive) setFrames(f); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.slidesRef, n]);

  // ── drag & drop (HTML5) ───────────────────────────────────────────────────
  const setPayload = (e: React.DragEvent, v: string) => { e.dataTransfer.setData('text/plain', v); e.dataTransfer.effectAllowed = 'copyMove'; };
  const allow = (e: React.DragEvent, track: string) => { e.preventDefault(); setOver(track); };
  const dropSlide = (e: React.DragEvent) => {
    e.preventDefault(); setOver(null);
    const d = e.dataTransfer.getData('text/plain');
    if (d.startsWith('slide:')) setSlideTrack((t) => [...t, Number(d.slice(6))]);
  };
  const dropMusic = (e: React.DragEvent) => {
    e.preventDefault(); setOver(null);
    const d = e.dataTransfer.getData('text/plain');
    if (d.startsWith('music:')) { const id = d.slice(6); setMusicTrack((t) => (t.includes(id) ? t : [...t, id])); }
  };
  const labelOf = (id: string) => MUSIC_TRACKS.find((m) => m.id === id)?.label || id;

  return (
    <div className="rt-root">
      <div className="rt-head"><Clapperboard size={15} /> Editor del reel</div>

      {/* selector de reel */}
      {project.reels.length > 0 && (
        <div className="rt-reelbar">
          {project.reels.map((r) => (
            <button key={r.id} className={r.id === reel?.id ? 'rt-reelchip rt-reelchip--on' : 'rt-reelchip'} onClick={() => setReelId(r.id)}>
              {r.nombre}{r.voiceConfig?.voice_id && <span className="rt-reelchip-dot" title="tiene audio" />}
            </button>
          ))}
        </div>
      )}

      {!n ? (
        <div className="rt-empty">Este reel todavía no tiene slides. Cargalos/generalos y aparecen acá para editar.</div>
      ) : (
        <div className="rt-editor">
          {/* PALETA: slides reales (arrastrables) */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Film size={12} /> Slides — arrastralos a la línea de tiempo</div>
            <div className="rt-frames">
              {slides.map((i) => (
                <div key={i} className="rt-frame" draggable onDragStart={(e) => setPayload(e, `slide:${i}`)}>
                  <div className="rt-frame-thumb">{frames[i] ? <img src={frames[i]} alt={`Slide ${i + 1}`} className="rt-frame-img" /> : <Film size={18} />}</div>
                  <span className="rt-frame-lbl">Slide {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PALETA: música (chips arrastrables) */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Music2 size={12} /> Música — arrastrala al track de música</div>
            <div className="rt-music-chips">
              {MUSIC_TRACKS.map((m) => (
                <div key={m.id} className="rt-mchip" draggable onDragStart={(e) => setPayload(e, `music:${m.id}`)}><GripVertical size={10} /> {m.label}</div>
              ))}
            </div>
          </div>

          {/* WAVEFORM del audio (cadencia de la narración) */}
          <div className="rt-wave">
            <div className="rt-palette-head"><AudioLines size={12} /> Audio del reel</div>
            <div className="rt-wave-box">
              {waveText ? <CadenceWave text={waveText} peaks={null} cursor={0} /> : <div className="rt-lane-empty">Grabá el audio en la solapa «Audio».</div>}
            </div>
          </div>

          {/* 3 LÍNEAS DE TIEMPO: Slides · Música · Audio */}
          <div className="rt-timeline">
            <div className="rt-track">
              <span className="rt-track-name"><Film size={12} /> Slides</span>
              <div className={over === 'slides' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'slides')} onDragLeave={() => setOver(null)} onDrop={dropSlide}>
                {slideTrack.length ? slideTrack.map((s, k) => (
                  <div key={k} className="rt-clip rt-clip--slide">
                    {frames[s] && <img src={frames[s]} alt="" className="rt-clip-thumb" />} S{s + 1}
                    <button className="rt-clip-x" onClick={() => setSlideTrack((t) => t.filter((_, j) => j !== k))}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Arrastrá slides acá.</div>}
              </div>
            </div>

            <div className="rt-track">
              <span className="rt-track-name"><Music2 size={12} /> Música</span>
              <div className={over === 'music' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'music')} onDragLeave={() => setOver(null)} onDrop={dropMusic}>
                {musicTrack.length ? musicTrack.map((id, k) => (
                  <div key={k} className="rt-clip rt-clip--music">{labelOf(id)}
                    <button className="rt-clip-x" onClick={() => setMusicTrack((t) => t.filter((_, j) => j !== k))}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Arrastrá una música acá.</div>}
              </div>
            </div>

            <div className="rt-track">
              <span className="rt-track-name"><AudioLines size={12} /> Audio</span>
              <div className="rt-lane">
                {phrases.length ? phrases.map((p, i) => (
                  <div key={i} className="rt-clip rt-clip--audio" title={p}>frase {i + 1}</div>
                )) : <div className="rt-lane-empty">Grabá el audio en la solapa «Audio».</div>}
              </div>
            </div>

            <div className="rt-hint">Arrastrás slides y música a sus tracks; el audio sale de la narración. Próximo: cortar/alinear los clips + transiciones.</div>
          </div>
        </div>
      )}
    </div>
  );
}
