// Solapa REEL — el EDITOR del reel slide-based (los "dibujitos" 9:16, NO los
// videos Veo/Flow — eso vive en la solapa Videos). Arriba las PALETAS (slides
// reales del boceto + chips de música), después la WAVEFORM del audio, y abajo
// 3 LÍNEAS DE TIEMPO (Slides · Música · Audio). Arrastrás slides y música a sus
// tracks; el Audio viene de la narración partida en frases. (Cortar/transiciones = next.)
import { useEffect, useRef, useState } from 'react';
import { Film, AudioLines, Music2, GripVertical, X, Clapperboard, Play, Pause, SkipBack } from 'lucide-react';
import CadenceWave from './CadenceWave';
import { extractFrames } from './lib/videoFrames';
import { MUSIC_TRACKS } from './lib/music';
import { NARRATION } from './data/narrationText';
import type { Project } from './lib/projects';
import './ReelTab.css';

export default function ReelTab({ project, audioByReel = {} }: { project: Project; audioByReel?: Record<string, string> }) {
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const [frames, setFrames] = useState<string[]>([]);       // thumbnails reales del boceto
  const [slideTrack, setSlideTrack] = useState<number[]>([]); // slides colocados en el track
  const [audioTrack, setAudioTrack] = useState<number[]>([]); // frases colocadas en el track
  const [musicTrack, setMusicTrack] = useState<string[]>([]); // música colocada en el track
  const [over, setOver] = useState<string | null>(null);      // track resaltado al arrastrar
  const [playing, setPlaying] = useState(false);
  const [playFrac, setPlayFrac] = useState(0);                // playhead 0..1
  const [voiceDur, setVoiceDur] = useState(0);                // duración real del mp3 de voz
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);

  const reel = project.reels.find((r) => r.id === reelId) ?? project.reels[0] ?? null;
  const n = reel?.frases ?? 0;
  const slides = Array.from({ length: n }, (_, i) => i);
  const phrases: string[] = (reel && NARRATION[reel.id]) || [];
  const waveText = phrases.length ? phrases.join('  ') : '';
  const voiceUrl = reel ? audioByReel[reel.id] : undefined;   // mp3 generado en la solapa Audio
  const hasVoice = !!voiceUrl;

  // duración: real si hay voz; si no, estimada ~2.5s por slide.
  const SLIDE_SEC = 2.5;
  const totalMs = Math.max(1, slideTrack.length) * SLIDE_SEC * 1000;
  const activeSlide = playing || playFrac > 0 ? Math.min(slideTrack.length - 1, Math.floor(playFrac * slideTrack.length)) : -1;

  // frames reales del boceto + arranca los tracks con el reel armado (slides + frases en orden).
  useEffect(() => {
    let alive = true; setFrames([]); setSlideTrack(slides); setAudioTrack(phrases.map((_, i) => i)); setMusicTrack([]); stopPlay();
    if (reel?.slidesRef && n > 0) extractFrames(reel.slidesRef, n).then((f) => { if (alive) setFrames(f); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.slidesRef, n]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── transporte (play/pausa/rebobinar) ─────────────────────────────────────
  // si hay VOZ generada, ese audio es el reloj (playhead = currentTime/duration);
  // si no, un timer estimado (~2.5s por slide) + la música del track.
  const tick = () => {
    const f = Math.min(1, (performance.now() - startRef.current) / totalMs);
    setPlayFrac(f);
    if (f >= 1) { setPlaying(false); musicAudioRef.current?.pause(); return; }
    rafRef.current = requestAnimationFrame(tick);
  };
  const startMusic = () => {
    const m = musicAudioRef.current; const url = MUSIC_TRACKS.find((t) => t.id === musicTrack[0])?.url;
    if (m && url) { if (m.src !== url) m.src = url; m.loop = true; m.volume = hasVoice ? 0.35 : 0.7; m.play().catch(() => {}); }
  };
  const play = () => {
    if (playing || !slideTrack.length) return;
    setPlaying(true);
    startMusic();
    const v = voiceRef.current;
    if (hasVoice && v) {
      if (v.src !== voiceUrl) v.src = voiceUrl!;
      if (playFrac >= 1) { v.currentTime = 0; setPlayFrac(0); }
      v.play().catch(() => {});
    } else {
      startRef.current = performance.now() - (playFrac >= 1 ? 0 : playFrac) * totalMs;
      if (playFrac >= 1) setPlayFrac(0);
      rafRef.current = requestAnimationFrame(tick);
    }
  };
  const pause = () => { setPlaying(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); musicAudioRef.current?.pause(); voiceRef.current?.pause(); };
  function stopPlay() {
    setPlaying(false); setPlayFrac(0); if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const m = musicAudioRef.current; if (m) { m.pause(); m.currentTime = 0; }
    const v = voiceRef.current; if (v) { v.pause(); v.currentTime = 0; }
  }

  // agregar al track (TAP — anda en touch y mouse). El drag es bonus en desktop.
  const addSlide = (i: number) => setSlideTrack((t) => [...t, i]);
  const addPhrase = (i: number) => setAudioTrack((t) => [...t, i]);
  const addMusic = (id: string) => setMusicTrack((t) => (t.includes(id) ? t : [...t, id]));

  // ── drag & drop (HTML5, solo desktop) — el camino confiable es el TAP de arriba ──
  const setPayload = (e: React.DragEvent, v: string) => { e.dataTransfer.setData('text/plain', v); e.dataTransfer.effectAllowed = 'copyMove'; };
  const allow = (e: React.DragEvent, track: string) => { e.preventDefault(); setOver(track); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setOver(null);
    const d = e.dataTransfer.getData('text/plain');
    if (d.startsWith('slide:')) addSlide(Number(d.slice(6)));
    else if (d.startsWith('phrase:')) addPhrase(Number(d.slice(7)));
    else if (d.startsWith('music:')) addMusic(d.slice(6));
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
          {/* PALETA: slides reales (tocá para agregar; arrastrar = bonus desktop) */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Film size={12} /> Slides — tocá uno para sumarlo al track (o arrastralo)</div>
            <div className="rt-frames">
              {slides.map((i) => (
                <button key={i} type="button" className="rt-frame" draggable onClick={() => addSlide(i)} onDragStart={(e) => setPayload(e, `slide:${i}`)}>
                  <div className="rt-frame-thumb">{frames[i] ? <img src={frames[i]} alt={`Slide ${i + 1}`} className="rt-frame-img" /> : <Film size={18} />}</div>
                  <span className="rt-frame-lbl">Slide {i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PALETA: narración (frases) — tocá para sumar al track Audio */}
          {phrases.length > 0 && (
            <div className="rt-palette">
              <div className="rt-palette-head"><AudioLines size={12} /> Narración — tocá una frase para sumarla al track Audio</div>
              <div className="rt-music-chips">
                {phrases.map((p, i) => (
                  <button key={i} type="button" className="rt-pchip" draggable title={p} onClick={() => addPhrase(i)} onDragStart={(e) => setPayload(e, `phrase:${i}`)}>frase {i + 1}</button>
                ))}
              </div>
            </div>
          )}

          {/* PALETA: música — tocá para sumar al track Música */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Music2 size={12} /> Música — tocá una para sumarla al track</div>
            <div className="rt-music-chips">
              {MUSIC_TRACKS.map((m) => (
                <button key={m.id} type="button" className="rt-mchip" draggable onClick={() => addMusic(m.id)} onDragStart={(e) => setPayload(e, `music:${m.id}`)}><GripVertical size={10} /> {m.label}</button>
              ))}
            </div>
          </div>

          {/* preview + WAVEFORM del audio (cadencia de la narración) con playhead */}
          <div className="rt-stage">
            <div className="rt-preview">
              {activeSlide >= 0 && frames[slideTrack[activeSlide]]
                ? <img src={frames[slideTrack[activeSlide]]} alt="" className="rt-preview-img" />
                : <div className="rt-preview-ph"><Film size={22} /></div>}
            </div>
            <div className="rt-wave">
              <div className="rt-palette-head"><AudioLines size={12} /> Audio del reel</div>
              <div className="rt-wave-box">
                {waveText ? <CadenceWave text={waveText} peaks={null} cursor={playFrac} /> : <div className="rt-lane-empty">Grabá el audio en la solapa «Audio».</div>}
              </div>
              {/* transporte */}
              <div className="rt-transport">
                <button className="rt-tbtn" onClick={stopPlay} title="Rebobinar"><SkipBack size={15} /></button>
                <button className="rt-tbtn rt-tbtn--play" onClick={() => (playing ? pause() : play())} disabled={!slideTrack.length} title={playing ? 'Pausa' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                <span className="rt-time">{(playFrac * (hasVoice && voiceDur ? voiceDur : totalMs / 1000)).toFixed(1)}s / {(hasVoice && voiceDur ? voiceDur : totalMs / 1000).toFixed(1)}s</span>
                <span className="rt-transport-note">{hasVoice ? 'suena la voz generada + música del track' : 'generá el audio en la solapa «Audio» para que suene la voz; por ahora música + visual'}</span>
              </div>
            </div>
          </div>

          {/* 3 LÍNEAS DE TIEMPO: Slides · Música · Audio */}
          <div className="rt-timeline">
            <div className="rt-track">
              <span className="rt-track-name"><Film size={12} /> Slides</span>
              <div className={over === 'slides' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'slides')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                {slideTrack.length ? slideTrack.map((s, k) => (
                  <div key={k} className={k === activeSlide ? 'rt-clip rt-clip--slide rt-clip--active' : 'rt-clip rt-clip--slide'}>
                    {frames[s] && <img src={frames[s]} alt="" className="rt-clip-thumb" />} S{s + 1}
                    <button className="rt-clip-x" onClick={() => setSlideTrack((t) => t.filter((_, j) => j !== k))}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Tocá un slide de arriba para sumarlo.</div>}
              </div>
            </div>

            <div className="rt-track">
              <span className="rt-track-name"><Music2 size={12} /> Música</span>
              <div className={over === 'music' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'music')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                {musicTrack.length ? musicTrack.map((id, k) => (
                  <div key={k} className="rt-clip rt-clip--music">{labelOf(id)}
                    <button className="rt-clip-x" onClick={() => setMusicTrack((t) => t.filter((_, j) => j !== k))}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Tocá una música de arriba para sumarla.</div>}
              </div>
            </div>

            <div className="rt-track">
              <span className="rt-track-name"><AudioLines size={12} /> Audio</span>
              <div className={over === 'audio' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'audio')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                {audioTrack.length ? audioTrack.map((p, k) => (
                  <div key={k} className="rt-clip rt-clip--audio" title={phrases[p]}>frase {p + 1}
                    <button className="rt-clip-x" onClick={() => setAudioTrack((t) => t.filter((_, j) => j !== k))}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Tocá una frase de arriba para sumarla.</div>}
              </div>
            </div>

            <div className="rt-hint">Tocá un slide, frase o música para sumarlo a su track (en desktop también podés arrastrar). La × saca el clip. Próximo: cortar/alinear + transiciones.</div>
          </div>
        </div>
      )}
      <audio ref={musicAudioRef} />
      <audio ref={voiceRef}
        onLoadedMetadata={(e) => setVoiceDur(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setPlayFrac(a.currentTime / a.duration); }}
        onEnded={() => { setPlaying(false); musicAudioRef.current?.pause(); }} />
    </div>
  );
}
