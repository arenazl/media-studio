// Editor de timeline COMPARTIDO (lo usan Reel y Montaje — "vamos sumando").
//  · Reel  → sin videos: paletas Slides/Narración/Música + tracks Slides/Música/Audio.
//  · Montaje → con `videos`: además una GALERÍA cómoda (panel colapsable, miniaturas
//    chicas, tap-para-agregar) + un 4º track de Video.
// El TAP suma al track (anda en touch); el drag es bonus en desktop. Transporte con
// playhead: si hay voz generada, ese mp3 es el reloj; si no, timer estimado + música.
import { useEffect, useRef, useState } from 'react';
import { Film, AudioLines, Music2, Video, GripVertical, X, Play, Pause, SkipBack, ChevronDown, ChevronRight, Plus, Check, Loader2, ChevronLeft } from 'lucide-react';
import CadenceWave from './CadenceWave';
import { extractFrames } from './lib/videoFrames';
import { MUSIC_TRACKS } from './lib/music';
import { NARRATION } from './data/narrationText';
import { prettyVid, thumbOf, type CloudVid } from './lib/cloudVideos';
import type { Project } from './lib/projects';
import './ReelTab.css';

export default function ReelEditor({ project, audioByReel = {}, videos, videosLoading = false }: {
  project: Project; audioByReel?: Record<string, string>; videos?: CloudVid[]; videosLoading?: boolean;
}) {
  const withVideo = videos !== undefined;
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const [frames, setFrames] = useState<string[]>([]);
  const [slideTrack, setSlideTrack] = useState<number[]>([]);
  const [audioTrack, setAudioTrack] = useState<number[]>([]);
  const [musicTrack, setMusicTrack] = useState<string[]>([]);
  const [videoTrack, setVideoTrack] = useState<string[]>([]);   // ids de video (CloudVid.id)
  const [galOpen, setGalOpen] = useState(true);
  const [selVids, setSelVids] = useState<Set<string>>(new Set()); // selección múltiple en la galería
  const [over, setOver] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playFrac, setPlayFrac] = useState(0);
  const [voiceDur, setVoiceDur] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);

  const reel = project.reels.find((r) => r.id === reelId) ?? project.reels[0] ?? null;
  const n = reel?.frases ?? 0;
  const slides = Array.from({ length: n }, (_, i) => i);
  const phrases: string[] = (reel && NARRATION[reel.id]) || [];
  const waveText = phrases.length ? phrases.join('  ') : '';
  const voiceUrl = reel ? audioByReel[reel.id] : undefined;
  const hasVoice = !!voiceUrl;
  const vidById = (id: string) => (videos || []).find((v) => v.id === id);

  const SLIDE_SEC = 2.5;
  const totalMs = Math.max(1, slideTrack.length) * SLIDE_SEC * 1000;
  const activeSlide = playing || playFrac > 0 ? Math.min(slideTrack.length - 1, Math.floor(playFrac * slideTrack.length)) : -1;

  useEffect(() => {
    let alive = true; setFrames([]); setSlideTrack(slides); setAudioTrack(phrases.map((_, i) => i)); setMusicTrack([]); setVideoTrack([]); stopPlay();
    if (reel?.slidesRef && n > 0) extractFrames(reel.slidesRef, n).then((f) => { if (alive) setFrames(f); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.slidesRef, n]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── transporte ────────────────────────────────────────────────────────────
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
    setPlaying(true); startMusic();
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

  // ── agregar al track (TAP) ─────────────────────────────────────────────────
  const addSlide = (i: number) => setSlideTrack((t) => [...t, i]);
  const addPhrase = (i: number) => setAudioTrack((t) => [...t, i]);
  const addMusic = (id: string) => setMusicTrack((t) => (t.includes(id) ? t : [...t, id]));
  const addVideo = (id: string) => setVideoTrack((t) => [...t, id]);
  // mover un clip por bloque (preciso, touch-friendly): intercambia con el vecino.
  function move<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, k: number, dir: -1 | 1) {
    setter((arr) => { const j = k + dir; if (j < 0 || j >= arr.length) return arr; const c = [...arr]; [c[k], c[j]] = [c[j], c[k]]; return c; });
  }
  const remove = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, k: number) => setter((arr) => arr.filter((_, j) => j !== k));
  // controles del clip: ◀ mover · mover ▶ · ✕ sacar (preciso y touch-friendly).
  const clipCtrl = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, k: number) => (
    <span className="rt-clip-ctrl">
      <button className="rt-clip-mv" title="Mover ←" onClick={() => move(setter, k, -1)}><ChevronLeft size={9} /></button>
      <button className="rt-clip-mv" title="Mover →" onClick={() => move(setter, k, 1)}><ChevronRight size={9} /></button>
      <button className="rt-clip-x" title="Sacar" onClick={() => remove(setter, k)}><X size={9} /></button>
    </span>
  );

  const setPayload = (e: React.DragEvent, v: string) => { e.dataTransfer.setData('text/plain', v); e.dataTransfer.effectAllowed = 'copyMove'; };
  const allow = (e: React.DragEvent, track: string) => { e.preventDefault(); setOver(track); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setOver(null);
    const d = e.dataTransfer.getData('text/plain');
    if (d.startsWith('slide:')) addSlide(Number(d.slice(6)));
    else if (d.startsWith('phrase:')) addPhrase(Number(d.slice(7)));
    else if (d.startsWith('music:')) addMusic(d.slice(6));
    else if (d.startsWith('video:')) addVideo(d.slice(6));
  };
  const labelOf = (id: string) => MUSIC_TRACKS.find((m) => m.id === id)?.label || id;

  return (
    <div className="rt-shell">
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
          {/* PALETA: slides */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Film size={12} /> Slides — tocá uno para sumarlo (o arrastralo)</div>
            <div className="rt-frames">
              {slides.map((i) => (
                <button key={i} type="button" className="rt-frame" draggable onClick={() => addSlide(i)} onDragStart={(e) => setPayload(e, `slide:${i}`)}>
                  <div className="rt-frame-thumb">{frames[i] ? <img src={frames[i]} alt={`Slide ${i + 1}`} className="rt-frame-img" /> : <Film size={18} />}</div>
                  <span className="rt-frame-lbl">Slide {i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PALETA: narración */}
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

          {/* PALETA: música */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Music2 size={12} /> Música — tocá una para sumarla al track</div>
            <div className="rt-music-chips">
              {MUSIC_TRACKS.map((m) => (
                <button key={m.id} type="button" className="rt-mchip" draggable onClick={() => addMusic(m.id)} onDragStart={(e) => setPayload(e, `music:${m.id}`)}><GripVertical size={10} /> {m.label}</button>
              ))}
            </div>
          </div>

          {/* GALERÍA de videos estilo Fotos (grilla de miniaturas, multi-selección) */}
          {withVideo && (
            <div className="rt-palette">
              <button type="button" className="rt-gal-head" onClick={() => setGalOpen((o) => !o)}>
                {galOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} <Video size={12} /> Videos <span className="rt-gal-count">{videos!.length}</span>
                <span className="rt-gal-hint">{selVids.size ? `${selVids.size} seleccionados` : 'tocá para seleccionar varios'}</span>
                {selVids.size > 0 && (
                  <span className="rt-gal-add" role="button" tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setVideoTrack((t) => [...t, ...Array.from(selVids)]); setSelVids(new Set()); }}>
                    <Plus size={12} /> Agregar {selVids.size} al timeline
                  </span>
                )}
              </button>
              {galOpen && (
                videosLoading ? (
                  <div className="rt-gal-loading"><Loader2 size={16} className="rt-spin" /> Cargando videos de Cloudinary…</div>
                ) : videos!.length ? (
                  <div className="rt-gal">
                    {videos!.map((v) => {
                      const sel = selVids.has(v.id);
                      return (
                        <button key={v.id} type="button" className={sel ? 'rt-gal-item rt-gal-item--sel' : 'rt-gal-item'} draggable title={prettyVid(v.name)}
                          onClick={() => setSelVids((s) => { const n = new Set(s); n.has(v.id) ? n.delete(v.id) : n.add(v.id); return n; })}
                          onDoubleClick={() => addVideo(v.id)}
                          onDragStart={(e) => setPayload(e, `video:${v.id}`)}>
                          <img src={thumbOf(v)} alt="" loading="lazy" className="rt-gal-img" onError={(e) => e.currentTarget.classList.add('rt-gal-img--broken')} />
                          {sel && <span className="rt-gal-check"><Check size={11} /></span>}
                          <span className="rt-gal-name">{prettyVid(v.name)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : <div className="rt-lane-empty">Subí videos en la solapa «Videos» y aparecen acá.</div>
              )}
            </div>
          )}

          {/* preview + waveform + transporte */}
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
              <div className="rt-transport">
                <button className="rt-tbtn" onClick={stopPlay} title="Rebobinar"><SkipBack size={15} /></button>
                <button className="rt-tbtn rt-tbtn--play" onClick={() => (playing ? pause() : play())} disabled={!slideTrack.length} title={playing ? 'Pausa' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                <span className="rt-time">{(playFrac * (hasVoice && voiceDur ? voiceDur : totalMs / 1000)).toFixed(1)}s / {(hasVoice && voiceDur ? voiceDur : totalMs / 1000).toFixed(1)}s</span>
                <span className="rt-transport-note">{hasVoice ? 'suena la voz generada + música del track' : 'generá el audio en «Audio» para que suene la voz; por ahora música + visual'}</span>
              </div>
            </div>
          </div>

          {/* LÍNEAS DE TIEMPO: Slides · Música · Audio (· Video en Montaje) */}
          <div className="rt-timeline">
            <div className="rt-track">
              <span className="rt-track-name"><Film size={12} /> Slides</span>
              <div className={over === 'slides' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'slides')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                {slideTrack.length ? slideTrack.map((s, k) => (
                  <div key={k} className={k === activeSlide ? 'rt-clip rt-clip--slide rt-clip--active' : 'rt-clip rt-clip--slide'}>
                    {frames[s] && <img src={frames[s]} alt="" className="rt-clip-thumb" />} S{s + 1}
                    {clipCtrl(setSlideTrack, k)}
                  </div>
                )) : <div className="rt-lane-empty">Tocá un slide de arriba para sumarlo.</div>}
              </div>
            </div>

            {withVideo && (
              <div className="rt-track">
                <span className="rt-track-name"><Video size={12} /> Video</span>
                <div className={over === 'video' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'video')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                  {videoTrack.length ? videoTrack.map((id, k) => {
                    const v = vidById(id);
                    return (
                      <div key={k} className="rt-clip rt-clip--video">
                        {v && <img src={thumbOf(v)} alt="" className="rt-clip-thumb" onError={(e) => e.currentTarget.classList.add('rt-gal-img--broken')} />}
                        {v ? prettyVid(v.name).slice(0, 10) : 'video'}
                        {clipCtrl(setVideoTrack, k)}
                      </div>
                    );
                  }) : <div className="rt-lane-empty">Tocá un video de la galería para meterlo entre los slides.</div>}
                </div>
              </div>
            )}

            <div className="rt-track">
              <span className="rt-track-name"><Music2 size={12} /> Música</span>
              <div className={over === 'music' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'music')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                {musicTrack.length ? musicTrack.map((id, k) => (
                  <div key={k} className="rt-clip rt-clip--music">{labelOf(id)}
                    {clipCtrl(setMusicTrack, k)}
                  </div>
                )) : <div className="rt-lane-empty">Tocá una música de arriba para sumarla.</div>}
              </div>
            </div>

            <div className="rt-track">
              <span className="rt-track-name"><AudioLines size={12} /> Audio</span>
              <div className={over === 'audio' ? 'rt-lane rt-lane--over' : 'rt-lane'} onDragOver={(e) => allow(e, 'audio')} onDragLeave={() => setOver(null)} onDrop={onDrop}>
                {audioTrack.length ? audioTrack.map((p, k) => (
                  <div key={k} className="rt-clip rt-clip--audio" title={phrases[p]}>frase {p + 1}
                    {clipCtrl(setAudioTrack, k)}
                  </div>
                )) : <div className="rt-lane-empty">Tocá una frase de arriba para sumarla.</div>}
              </div>
            </div>

            <div className="rt-hint">Tocá un item para sumarlo a su track (en desktop también arrastrás). La × saca el clip. Próximo: cortar/alinear + transiciones.</div>
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
