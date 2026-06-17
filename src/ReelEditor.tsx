// Editor de timeline COMPARTIDO (Reel y Montaje). Acumulativo: Slides + Video +
// Música + Audio. Los clips se mueven LIBRE en horizontal arrastrándolos (pointer
// events → anda en touch y mouse). Cada clip tiene una posición x propia.
// Galería de videos estilo Fotos (miniaturas + multi-selección). Transporte con
// playhead: si hay voz generada, ese mp3 es el reloj; si no, timer estimado + música.
import { useEffect, useRef, useState } from 'react';
import { Film, AudioLines, Music2, Video, GripVertical, X, Play, Pause, SkipBack, ChevronDown, ChevronRight, Plus, Check, Loader2 } from 'lucide-react';
import CadenceWave from './CadenceWave';
import { extractFrames } from './lib/videoFrames';
import { MUSIC_TRACKS } from './lib/music';
import { NARRATION } from './data/narrationText';
import { prettyVid, thumbOf, type CloudVid } from './lib/cloudVideos';
import type { Project } from './lib/projects';
import './ReelTab.css';

const CLIP_W = 112, GAP = 6, MIN_W = 36;   // ancho inicial + separación + ancho mínimo
type TrackKind = 'slide' | 'video' | 'music' | 'audio';
type DragMode = 'move' | 'l' | 'r';        // mover · resize inicio · resize fin
interface SlideClip { s: number; x: number; w: number }
interface RefClip { id: string; x: number; w: number }
interface PhraseClip { p: number; x: number; w: number }

export default function ReelEditor({ project, audioByReel = {}, videos, videosLoading = false }: {
  project: Project; audioByReel?: Record<string, string>; videos?: CloudVid[]; videosLoading?: boolean;
}) {
  const withVideo = videos !== undefined;
  const [reelId, setReelId] = useState<string | null>(project.reels[0]?.id ?? null);
  const [frames, setFrames] = useState<string[]>([]);
  const [slideTrack, setSlideTrack] = useState<SlideClip[]>([]);
  const [audioTrack, setAudioTrack] = useState<PhraseClip[]>([]);
  const [musicTrack, setMusicTrack] = useState<RefClip[]>([]);
  const [videoTrack, setVideoTrack] = useState<RefClip[]>([]);
  const [galOpen, setGalOpen] = useState(false);   // galería colapsada por defecto → el timeline queda a la vista
  const [selVids, setSelVids] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [playFrac, setPlayFrac] = useState(0);   // 0-1 sobre los chunks seleccionados
  const [waveCursor, setWaveCursor] = useState(0); // 0-1 posición en el waveform por frase
  const [voiceDur, setVoiceDur] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  // Chunk playback: segmentos ordenados por posición x en la timeline
  const segIdxRef = useRef(0);
  const segsRef = useRef<Array<{ phraseIdx: number; start: number; end: number }>>([]);

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
  // El playhead (0..1) se mapea al ANCHO real del contenido (px de los clips), así
  // sabemos qué clip está "abajo" del cursor — sea slide o VIDEO.
  const playing0 = playing || playFrac > 0;
  const contentW = Math.max(1, ...[...slideTrack, ...videoTrack].map((c) => c.x + c.w), 1);
  const playPx = playFrac * contentW;
  const slidesByX = [...slideTrack].sort((a, b) => a.x - b.x);
  // slide actual = el último cuyo inicio ya pasó el playhead (se mantiene en los gaps).
  const curSlide = playing0 ? ([...slidesByX].reverse().find((c) => c.x <= playPx) ?? slidesByX[0]) : undefined;
  const activeS = curSlide?.s;
  // video activo = el clip de video que CUBRE el playhead (si hay) → tiene prioridad en el preview.
  const activeVidClip = playing0 ? videoTrack.find((c) => playPx >= c.x && playPx < c.x + c.w) : undefined;
  const activeVid = activeVidClip ? vidById(activeVidClip.id) : undefined;

  useEffect(() => {
    let alive = true; setFrames([]);
    setSlideTrack(slides.map((s, i) => ({ s, x: i * (CLIP_W + GAP), w: CLIP_W })));
    setAudioTrack(phrases.map((_, i) => ({ p: i, x: i * (CLIP_W + GAP), w: CLIP_W })));
    setMusicTrack([]); setVideoTrack([]); stopPlay();
    if (reel?.slidesRef && n > 0) extractFrames(reel.slidesRef, n).then((f) => { if (alive) setFrames(f); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.slidesRef, n]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Chunks: segmenta el mp3 en frases y devuelve los chunks seleccionados ─
  // Cada frase ocupa (voiceDur / n) segundos dentro del mp3 (distribución uniforme).
  const buildSegs = (dur: number) => {
    if (!dur || !n || !audioTrack.length) return [];
    const phraseDur = dur / n;
    return [...audioTrack]
      .sort((a, b) => a.x - b.x)
      .map((c) => ({
        phraseIdx: c.p,
        start: c.p * phraseDur,
        end: Math.min((c.p + 1) * phraseDur, dur),
      }));
  };

  // ── transporte ────────────────────────────────────────────────────────────
  const tick = () => {
    const f = Math.min(1, (performance.now() - startRef.current) / totalMs);
    setPlayFrac(f); setWaveCursor(f);
    if (f >= 1) { setPlaying(false); musicAudioRef.current?.pause(); return; }
    rafRef.current = requestAnimationFrame(tick);
  };
  const startMusic = () => {
    const m = musicAudioRef.current; const url = MUSIC_TRACKS.find((t) => t.id === musicTrack[0]?.id)?.url;
    if (m && url) { if (m.src !== url) m.src = url; m.loop = true; m.volume = hasVoice ? 0.35 : 0.7; m.play().catch(() => {}); }
  };
  const play = () => {
    if (playing || !slideTrack.length) return;
    setPlaying(true); startMusic();
    const v = voiceRef.current;
    if (hasVoice && v) {
      if (v.src !== voiceUrl) v.src = voiceUrl!;
      const dur = v.duration || voiceDur;
      const segs = buildSegs(dur);
      segsRef.current = segs;
      segIdxRef.current = 0;
      if (segs.length > 0) {
        v.currentTime = segs[0].start;
      } else if (playFrac >= 1) {
        v.currentTime = 0; setPlayFrac(0); setWaveCursor(0);
      }
      v.play().catch(() => {});
    } else {
      startRef.current = performance.now() - (playFrac >= 1 ? 0 : playFrac) * totalMs;
      if (playFrac >= 1) { setPlayFrac(0); setWaveCursor(0); }
      rafRef.current = requestAnimationFrame(tick);
    }
  };
  const pause = () => { setPlaying(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); musicAudioRef.current?.pause(); voiceRef.current?.pause(); };
  function stopPlay() {
    setPlaying(false); setPlayFrac(0); setWaveCursor(0);
    segIdxRef.current = 0; segsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const m = musicAudioRef.current; if (m) { m.pause(); m.currentTime = 0; }
    const v = voiceRef.current; if (v) { v.pause(); v.currentTime = 0; }
  }

  // ── Handler de timeUpdate con lógica de chunks ─────────────────────────
  const onVoiceTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const a = e.currentTarget;
    if (!a.duration) return;
    const segs = segsRef.current;

    // Sin chunks → reproducir mp3 completo (fallback legacy)
    if (!segs.length) {
      const f = a.currentTime / a.duration;
      setPlayFrac(f); setWaveCursor(f);
      return;
    }

    const idx = segIdxRef.current;
    const seg = segs[idx];
    if (!seg) return;

    // ¿Llegamos al fin del chunk actual?
    if (a.currentTime >= seg.end - 0.05) {
      if (idx < segs.length - 1) {
        // Saltar al siguiente chunk
        segIdxRef.current = idx + 1;
        a.currentTime = segs[idx + 1].start;
        return;
      } else {
        // Fin de todos los chunks
        a.pause();
        setPlaying(false);
        musicAudioRef.current?.pause();
        setPlayFrac(1);
        setWaveCursor(Math.min(1, (seg.phraseIdx + 1) / n));
        return;
      }
    }

    // Progreso dentro del chunk actual sobre el total seleccionado
    const doneTime = segs.slice(0, idx).reduce((s, sg) => s + (sg.end - sg.start), 0);
    const inSeg = a.currentTime - seg.start;
    const totalSel = segs.reduce((s, sg) => s + (sg.end - sg.start), 0);
    if (totalSel > 0) setPlayFrac((doneTime + inSeg) / totalSel);

    // waveCursor: posición 0-1 en el waveform por índice de frase
    const phraseDur = a.duration / n;
    setWaveCursor((seg.phraseIdx + (phraseDur > 0 ? inSeg / phraseDur : 0)) / n);
  };

  // ── agregar al track (TAP) — el nuevo clip se ubica al final de su track ────
  const nextX = (len: number) => len * (CLIP_W + GAP);
  const addSlide = (i: number) => setSlideTrack((t) => [...t, { s: i, x: nextX(t.length), w: CLIP_W }]);
  const addPhrase = (i: number) => setAudioTrack((t) => [...t, { p: i, x: nextX(t.length), w: CLIP_W }]);
  const addMusic = (id: string) => setMusicTrack((t) => [...t, { id, x: nextX(t.length), w: CLIP_W }]);
  const addVideo = (id: string) => setVideoTrack((t) => [...t, { id, x: nextX(t.length), w: CLIP_W }]);
  const addSelected = () => { setVideoTrack((t) => [...t, ...Array.from(selVids).map((id, k) => ({ id, x: nextX(t.length + k), w: CLIP_W }))]); setSelVids(new Set()); };

  const removeAt = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, k: number) => setter((arr) => arr.filter((_, j) => j !== k));

  // ── mover LIBRE + RESIZE (inicio/fin) — listeners en WINDOW durante el drag ──
  // (robusto: captura todos los pointermove aunque el clip se re-renderice o el
  //  cursor salga del clip; anda en touch y mouse).
  const setClip = (kind: TrackKind, idx: number, x: number, w: number) => {
    const upd = <T extends { x: number; w: number }>(arr: T[]) => arr.map((c, i) => (i === idx ? { ...c, x, w } : c));
    if (kind === 'slide') setSlideTrack(upd); else if (kind === 'video') setVideoTrack(upd);
    else if (kind === 'music') setMusicTrack(upd); else setAudioTrack(upd);
  };
  const onPtrDown = (e: React.PointerEvent, kind: TrackKind, idx: number, mode: DragMode, x0: number, w0: number) => {
    e.stopPropagation(); e.preventDefault();
    const lane = (e.currentTarget as HTMLElement).closest('.rt-lane') as HTMLElement;
    const laneW = lane?.getBoundingClientRect().width ?? 0;
    const startX = e.clientX;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      let x = x0, w = w0;
      if (mode === 'move') x = Math.max(0, Math.min(Math.max(0, laneW - w0), x0 + dx));
      else if (mode === 'r') w = Math.max(MIN_W, Math.min(laneW - x0, w0 + dx));
      else { const right = x0 + w0; x = Math.max(0, Math.min(right - MIN_W, x0 + dx)); w = right - x; }
      setClip(kind, idx, x, w);
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  const labelOf = (id: string) => MUSIC_TRACKS.find((m) => m.id === id)?.label || id;
  const xwStyle = (x: number, w: number) => ({ ['--x']: `${x}px`, ['--w']: `${w}px` } as React.CSSProperties);
  const stopPd = (e: React.PointerEvent) => e.stopPropagation();
  // handles de resize (inicio/fin) — se renderizan dentro de cada clip.
  const handles = (kind: TrackKind, idx: number, x: number, w: number) => (<>
    <span className="rt-clip-h rt-clip-h--l" onPointerDown={(e) => onPtrDown(e, kind, idx, 'l', x, w)} />
    <span className="rt-clip-h rt-clip-h--r" onPointerDown={(e) => onPtrDown(e, kind, idx, 'r', x, w)} />
  </>);

  return (
    <div className="rt-shell">
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
            <div className="rt-palette-head"><Film size={12} /> Slides — tocá uno para sumarlo</div>
            <div className="rt-frames">
              {slides.map((i) => (
                <button key={i} type="button" className="rt-frame" onClick={() => addSlide(i)}>
                  <div className="rt-frame-thumb">{frames[i] ? <img src={frames[i]} alt={`Slide ${i + 1}`} className="rt-frame-img" /> : <Film size={18} />}</div>
                  <span className="rt-frame-lbl">Slide {i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PALETA: narración */}
          {phrases.length > 0 && (
            <div className="rt-palette">
              <div className="rt-palette-head"><AudioLines size={12} /> Narración — tocá una frase para sumarla</div>
              <div className="rt-music-chips">
                {phrases.map((p, i) => (
                  <button key={i} type="button" className="rt-pchip" title={p} onClick={() => addPhrase(i)}>frase {i + 1}</button>
                ))}
              </div>
            </div>
          )}

          {/* PALETA: música */}
          <div className="rt-palette">
            <div className="rt-palette-head"><Music2 size={12} /> Música — tocá una para sumarla</div>
            <div className="rt-music-chips">
              {MUSIC_TRACKS.map((m) => (
                <button key={m.id} type="button" className="rt-mchip" onClick={() => addMusic(m.id)}><GripVertical size={10} /> {m.label}</button>
              ))}
            </div>
          </div>

          {/* GALERÍA de videos estilo Fotos */}
          {withVideo && (
            <div className="rt-palette">
              <button type="button" className="rt-gal-head" onClick={() => setGalOpen((o) => !o)}>
                {galOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} <Video size={12} /> Videos <span className="rt-gal-count">{videos!.length}</span>
                <span className="rt-gal-hint">{selVids.size ? `${selVids.size} seleccionados` : 'tocá para seleccionar varios'}</span>
                {selVids.size > 0 && <span className="rt-gal-add" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); addSelected(); }}><Plus size={12} /> Agregar {selVids.size} al timeline</span>}
              </button>
              {galOpen && (
                videosLoading ? (
                  <div className="rt-gal-loading"><Loader2 size={16} className="rt-spin" /> Cargando videos de Cloudinary…</div>
                ) : videos!.length ? (
                  <div className="rt-gal">
                    {videos!.map((v) => {
                      const sel = selVids.has(v.id);
                      return (
                        <button key={v.id} type="button" className={sel ? 'rt-gal-item rt-gal-item--sel' : 'rt-gal-item'} title={prettyVid(v.name)}
                          onClick={() => setSelVids((s) => { const nn = new Set(s); nn.has(v.id) ? nn.delete(v.id) : nn.add(v.id); return nn; })}
                          onDoubleClick={() => addVideo(v.id)}>
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
              {activeVid ? (
                <video key={activeVidClip!.id} src={activeVid.url} autoPlay muted loop playsInline className="rt-preview-img" />
              ) : activeS !== undefined && frames[activeS] ? (
                <img src={frames[activeS]} alt="" className="rt-preview-img" />
              ) : <div className="rt-preview-ph"><Film size={22} /></div>}
            </div>
            <div className="rt-wave">
              <div className="rt-palette-head"><AudioLines size={12} /> Audio del reel</div>
              <div className="rt-wave-box">
                {waveText ? <CadenceWave text={waveText} peaks={null} cursor={waveCursor} /> : <div className="rt-lane-empty">Grabá el audio en la solapa «Audio».</div>}
              </div>
              <div className="rt-transport">
                <button className="rt-tbtn" onClick={stopPlay} title="Rebobinar"><SkipBack size={15} /></button>
                <button className="rt-tbtn rt-tbtn--play" onClick={() => (playing ? pause() : play())} disabled={!slideTrack.length} title={playing ? 'Pausa' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                {(() => {
                  const segs = audioTrack.length && voiceDur && n
                    ? [...audioTrack].map(c => { const pd = voiceDur / n; return Math.min((c.p + 1) * pd, voiceDur) - c.p * pd; }).reduce((a, b) => a + b, 0)
                    : hasVoice && voiceDur ? voiceDur : totalMs / 1000;
                  return <span className="rt-time">{(playFrac * segs).toFixed(1)}s / {segs.toFixed(1)}s</span>;
                })()}
                <span className="rt-transport-note">{hasVoice ? (audioTrack.length ? `${audioTrack.length} chunks · voz + música` : 'voz completa + música') : 'generá audio en «Audio» para activar la voz'}</span>
              </div>
            </div>
          </div>

          {/* LÍNEAS DE TIEMPO — clips con posición libre (arrastrá para moverlos) */}
          <div className="rt-timeline">
            <div className="rt-track">
              <span className="rt-track-name"><Film size={12} /> Slides</span>
              <div className="rt-lane rt-lane--free">
                {slideTrack.length ? slideTrack.map((c, k) => (
                  <div key={k} className={c.s === activeS ? 'rt-clip rt-clip--slide rt-clip--active' : 'rt-clip rt-clip--slide'} style={xwStyle(c.x, c.w)}
                    onPointerDown={(e) => onPtrDown(e, 'slide', k, 'move', c.x, c.w)}>
                    {handles('slide', k, c.x, c.w)}
                    {frames[c.s] && <img src={frames[c.s]} alt="" className="rt-clip-thumb" />} S{c.s + 1}
                    <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setSlideTrack, k)}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Tocá un slide de arriba para sumarlo.</div>}
              </div>
            </div>

            {withVideo && (
              <div className="rt-track">
                <span className="rt-track-name"><Video size={12} /> Video</span>
                <div className="rt-lane rt-lane--free">{playing0 && <span className="rt-lane-ph" style={{ ['--x']: `${playPx}px` } as React.CSSProperties} />}
                  {videoTrack.length ? videoTrack.map((c, k) => {
                    const v = vidById(c.id);
                    return (
                      <div key={k} className="rt-clip rt-clip--video" style={xwStyle(c.x, c.w)}
                        onPointerDown={(e) => onPtrDown(e, 'video', k, 'move', c.x, c.w)}>
                        {handles('video', k, c.x, c.w)}
                        {v && <img src={thumbOf(v)} alt="" className="rt-clip-thumb" onError={(e) => e.currentTarget.classList.add('rt-gal-img--broken')} />}
                        {v ? prettyVid(v.name).slice(0, 9) : 'video'}
                        <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setVideoTrack, k)}><X size={10} /></button>
                      </div>
                    );
                  }) : <div className="rt-lane-empty">Tocá un video de la galería para meterlo.</div>}
                </div>
              </div>
            )}

            <div className="rt-track">
              <span className="rt-track-name"><Music2 size={12} /> Música</span>
              <div className="rt-lane rt-lane--free">
                {musicTrack.length ? musicTrack.map((c, k) => (
                  <div key={k} className="rt-clip rt-clip--music" style={xwStyle(c.x, c.w)}
                    onPointerDown={(e) => onPtrDown(e, 'music', k, 'move', c.x, c.w)}>
                    {handles('music', k, c.x, c.w)}
                    {labelOf(c.id)}
                    <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setMusicTrack, k)}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Tocá una música de arriba para sumarla.</div>}
              </div>
            </div>

            <div className="rt-track">
              <span className="rt-track-name"><AudioLines size={12} /> Audio</span>
              <div className="rt-lane rt-lane--free">
                {audioTrack.length ? audioTrack.map((c, k) => (
                  <div key={k} className="rt-clip rt-clip--audio" style={xwStyle(c.x, c.w)} title={phrases[c.p]}
                    onPointerDown={(e) => onPtrDown(e, 'audio', k, 'move', c.x, c.w)}>
                    {handles('audio', k, c.x, c.w)}
                    frase {c.p + 1}
                    <button className="rt-clip-x" onPointerDown={stopPd} onClick={() => removeAt(setAudioTrack, k)}><X size={10} /></button>
                  </div>
                )) : <div className="rt-lane-empty">Tocá una frase de arriba para sumarla.</div>}
              </div>
            </div>

            <div className="rt-hint">Arrastrá los clips para moverlos libre en horizontal. La × los saca. Tocá las paletas para sumar. Próximo: cortar/seccionar + transiciones.</div>
          </div>
        </div>
      )}
      <audio ref={musicAudioRef} />
      <audio ref={voiceRef}
        onLoadedMetadata={(e) => setVoiceDur(e.currentTarget.duration || 0)}
        onTimeUpdate={onVoiceTimeUpdate}
        onEnded={() => { setPlaying(false); musicAudioRef.current?.pause(); }} />
    </div>
  );
}
