// Timeline (panel inferior): ruler + playhead + pistas Video/Texto/Voz/Música/SFX/Efectos, con
// marcadores de transición clickeables entre clips de video (prototipo líneas 1022-1077). Colapsable
// + alto arrastrable (lib/editorUi.ts TL_H_MIN/MAX). Clips posicionados por %, proporcional a
// startSec/durSec REALES (editorTracks.ts) — cero coordenadas inventadas.
import { useCallback, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Play, Pause, Magnet, Minus, Plus, Film, Type, Mic, Music2, Volume2, Sparkles, Smartphone, Diamond, SeparatorVertical, Clapperboard } from 'lucide-react';
import type { EditorTrack, TrackId } from './lib/editorTracks';
import { PISTAS_CON_AUDIO } from './lib/editorTracks';
import type { MezclaPista } from './lib/montajePlan';
import EditorKnob from './EditorKnob';
import EditorClipMenu, { type AccionClip, type MenuClipState } from './EditorClipMenu';
import './EditorTimeline.css';

const TRACK_ICON: Record<TrackId, typeof Film> = { video: Film, pantallas: Smartphone, texto: Type, voz: Mic, musica: Music2, sfx: Volume2, fx: Sparkles };
const LABEL_COL = 168;   // nombre de la pista + perilla de volumen + solo + mute

const fmt = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export interface EditorTimelineProps {
  open: boolean;
  height: number;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  tracks: EditorTrack[];
  totalSec: number;
  playheadSec: number;
  onSeek: (sec: number) => void;
  playing: boolean;
  onTogglePlay: (e?: React.SyntheticEvent) => void;   // con el evento del click: el Player lo necesita para el audio
  selectedId: string | null;
  onSelect: (id: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onDropItem?: (raw: string) => void;
  onTrimLeft?: (clipId: string, newStartSec: number, newDurSec: number) => void;
  onTrimRight?: (clipId: string, newDurSec: number) => void;
  onMoveClip?: (clipId: string, newStartSec: number) => void;
  onMixChange?: (trackId: TrackId, mix: MezclaPista) => void;
  onClipAction?: (clipId: string, accion: AccionClip) => void;   // clic derecho → menú del clip
  canSplitAt?: (clipId: string) => boolean;
}

// cabecera de una pista con sonido: perilla de volumen, S (solo) y M (mute). Una pista que no suena por el solo de otra
// se ve apagada.
function MezclaCabecera({ track, haySolo, onMixChange }: { track: EditorTrack; haySolo: boolean; onMixChange: (trackId: TrackId, mix: MezclaPista) => void }) {
  const mix: MezclaPista = track.mix || { gain: 1 };
  const set = (patch: Partial<MezclaPista>) => onMixChange(track.id, { ...mix, ...patch });
  const callada = mix.mute || (haySolo && !mix.solo);
  return (
    <span className={callada ? 'ed-tl-mix ed-tl-mix--callada' : 'ed-tl-mix'} onClick={(e) => e.stopPropagation()}>
      <EditorKnob value={mix.gain} onChange={(gain) => set({ gain })} label={`Volumen de ${track.name}`} />
      <button className={mix.solo ? 'ed-tl-sm ed-tl-sm--solo' : 'ed-tl-sm'} title={mix.solo ? 'Quitar solo' : 'Solo: escuchar sólo esta pista'} onClick={() => set({ solo: !mix.solo })}>S</button>
      <button className={mix.mute ? 'ed-tl-sm ed-tl-sm--mute' : 'ed-tl-sm'} title={mix.mute ? 'Activar el sonido' : 'Mute: silenciar esta pista'} onClick={() => set({ mute: !mix.mute })}>M</button>
    </span>
  );
}

export default function EditorTimeline({
  open, height, onToggle, onResizeStart, tracks, totalSec, playheadSec, onSeek, playing, onTogglePlay,
  selectedId, onSelect, zoom, onZoomChange, onDropItem, onTrimLeft, onTrimRight, onMoveClip, onMixChange, onClipAction, canSplitAt,
}: EditorTimelineProps) {
  const lanesRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuClipState | null>(null);
  const cerrarMenu = useCallback(() => setMenu(null), []);
  const haySolo = tracks.some((t) => t.mix?.solo);

  const secAt = (clientX: number): number => {
    const el = lanesRef.current;
    if (!el || totalSec <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const usable = Math.max(1, rect.width - LABEL_COL);
    const x = clientX - rect.left - LABEL_COL;
    return Math.min(totalSec, Math.max(0, (x / usable) * totalSec));
  };

  const handleSeekClick = (e: React.MouseEvent) => onSeek(secAt(e.clientX));

  const beginScrub = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSeek(secAt(e.clientX));
    const onMove = (ev: MouseEvent) => onSeek(secAt(ev.clientX));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Arrastre horizontal de clip
  const beginClipDrag = (e: React.MouseEvent, c: any) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(c.id);
    const startX = e.clientX;
    const initialStart = c.startSec;

    const onMove = (ev: MouseEvent) => {
      const el = lanesRef.current;
      if (!el || totalSec <= 0) return;
      const rect = el.getBoundingClientRect();
      const usable = Math.max(1, rect.width - LABEL_COL);
      const deltaSec = ((ev.clientX - startX) / usable) * totalSec;
      const newStart = Math.max(0, Math.min(totalSec - c.durSec, initialStart + deltaSec));
      if (onMoveClip) onMoveClip(c.id, newStart);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Trim Izquierdo
  const beginTrimLeft = (e: React.MouseEvent, c: any) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(c.id);
    const startX = e.clientX;
    const initialStart = c.startSec;
    const initialDur = c.durSec;

    const onMove = (ev: MouseEvent) => {
      const el = lanesRef.current;
      if (!el || totalSec <= 0) return;
      const rect = el.getBoundingClientRect();
      const usable = Math.max(1, rect.width - LABEL_COL);
      const deltaSec = ((ev.clientX - startX) / usable) * totalSec;
      const newStart = Math.max(0, Math.min(initialStart + initialDur - 0.2, initialStart + deltaSec));
      const newDur = Math.max(0.2, initialDur - (newStart - initialStart));
      if (onTrimLeft) onTrimLeft(c.id, newStart, newDur);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Trim Derecho
  const beginTrimRight = (e: React.MouseEvent, c: any) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(c.id);
    const startX = e.clientX;
    const initialDur = c.durSec;

    const onMove = (ev: MouseEvent) => {
      const el = lanesRef.current;
      if (!el || totalSec <= 0) return;
      const rect = el.getBoundingClientRect();
      const usable = Math.max(1, rect.width - LABEL_COL);
      const deltaSec = ((ev.clientX - startX) / usable) * totalSec;
      const newDur = Math.max(0.2, initialDur + deltaSec);
      if (onTrimRight) onTrimRight(c.id, newDur);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const ratio = totalSec > 0 ? playheadSec / totalSec : 0;
  const ticks = Array.from({ length: 7 }, (_, i) => (totalSec / 6) * i);

  return (
    <>
    {open && <div className="editor-resize-y" onMouseDown={onResizeStart} title="Arrastrar para redimensionar" />}
    <div
      className="ed-tl" style={{ height, flex: `0 0 ${height}px` }}
      onDragOver={onDropItem ? (e) => { if (e.dataTransfer.types.includes('application/x-lib-item')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } } : undefined}
      onDrop={onDropItem ? (e) => { const raw = e.dataTransfer.getData('application/x-lib-item'); if (raw) { e.preventDefault(); onDropItem(raw); } } : undefined}
    >
      <div className="ed-tl-bar">
        <button className="ed-tl-chevron" onClick={onToggle} title="Colapsar/expandir">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <button className="ed-tl-play" onClick={onTogglePlay}>{playing ? <Pause size={12} /> : <Play size={12} />}</button>
        <span className="ed-tl-time">{fmt(playheadSec)} <span className="ed-tl-time-total">/ {fmt(totalSec)}</span></span>
        <div className="ed-tl-spacer" />
        <span className="ed-tl-snap"><Magnet size={12} /> Snap</span>
        <div className="ed-tl-zoom">
          <button onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))} title="Alejar"><Minus size={13} /></button>
          <input type="range" min={0.5} max={3} step={0.25} value={zoom} onChange={(e) => onZoomChange(Number(e.target.value))} />
          <button onClick={() => onZoomChange(Math.min(3, zoom + 0.25))} title="Acercar"><Plus size={13} /></button>
        </div>
      </div>

      {open && (totalSec <= 0 ? (
        <div className="ed-tl-empty">
          <Clapperboard size={26} strokeWidth={1.5} />
          <span>Todavía no hay nada armado. Generá el storyboard y armá el Montaje (con los videos de Pack Flow y los mockups) para ver la timeline.</span>
        </div>
      ) : (
        <>
          <div className="ed-tl-ruler" style={{ paddingLeft: LABEL_COL, width: `${zoom * 100}%` }} onMouseDown={beginScrub} title="Click o arrastrá para mover el playhead">
            {ticks.map((t, i) => <div key={i} className="ed-tl-tick">{fmt(t)}</div>)}
          </div>
          <div className="ed-tl-scroll">
            <div className="ed-tl-lanes" ref={lanesRef} style={{ width: `${zoom * 100}%`, minWidth: '100%' }} onClick={handleSeekClick}>
              <div className="ed-tl-playhead" style={{ left: `calc(${LABEL_COL}px + (100% - ${LABEL_COL}px) * ${ratio})` }}>
                <div className="ed-tl-playhead-grip" onMouseDown={beginScrub} />
              </div>
              {tracks.map((track) => {
                const Icon = TRACK_ICON[track.id];
                return (
                  <div key={track.id} className="ed-tl-row">
                    <div className="ed-tl-row-label">
                      <Icon size={12} /> <span className="ed-tl-row-name">{track.name}</span>
                      {onMixChange && PISTAS_CON_AUDIO.includes(track.id) && <MezclaCabecera track={track} haySolo={haySolo} onMixChange={onMixChange} />}
                    </div>
                    <div className="ed-tl-row-clips">
                      {track.clips.map((c) => {
                        const leftPct = (c.startSec / totalSec) * 100;
                        const widthPct = (c.durSec / totalSec) * 100;
                        const isVideo = track.id === 'video';
                        const wavy = track.id === 'voz' || track.id === 'musica' || track.id === 'sfx';
                        const isSel = selectedId === c.id;

                        return (
                          <div key={c.id} className="ed-tl-clip-wrap" style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
                            {/* Handle de Trim Izquierdo */}
                            <div
                              className="ed-tl-handle ed-tl-handle-left"
                              style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px',
                                cursor: 'col-resize', zIndex: 20, background: isSel ? '#A78BFA' : 'rgba(255,255,255,0.4)',
                                borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                              }}
                              onMouseDown={(e) => beginTrimLeft(e, c)}
                              title="Recortar inicio (Trim In) — arrastrá para ajustar"
                            >
                              <div style={{ width: '2px', height: '14px', background: '#FFF', borderRadius: '1px' }} />
                            </div>

                            <div
                              className={isSel ? 'ed-tl-clip ed-tl-clip--sel' : 'ed-tl-clip'}
                              style={{
                                background: `linear-gradient(135deg, ${c.color}66, ${c.color}22)`,
                                borderColor: c.fileRef || track.id !== 'video' ? `${c.color}88` : 'rgba(0,0,0,0.25)',
                                cursor: 'grab', userSelect: 'none', width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 14px',
                              }}
                              onClick={(e) => { e.stopPropagation(); onSelect(c.id); }}
                              onMouseDown={(e) => { if (e.button === 0) beginClipDrag(e, c); }}
                              onContextMenu={onClipAction ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect(c.id); setMenu({ x: e.clientX, y: e.clientY, clip: c, track }); } : undefined}
                              title={`${c.dialogo || c.label} — click para seleccionar, arrastrá para mover`}
                            >
                              <span className="ed-tl-clip-bar" style={{ background: c.color }} />
                              {c.fadeIn ? <span className="ed-tl-fade ed-tl-fade--in" style={{ width: `${Math.min(50, (c.fadeIn / c.durSec) * 100)}%` }} /> : null}
                              {c.fadeOut ? <span className="ed-tl-fade ed-tl-fade--out" style={{ width: `${Math.min(50, (c.fadeOut / c.durSec) * 100)}%` }} /> : null}
                              {wavy && <span className="ed-tl-clip-wave" style={{ backgroundColor: `${c.color}99` }} />}
                              <span className="ed-tl-clip-label">{c.label}{isVideo && !c.fileRef && c.meta !== 'placa' ? ' · sin clip' : ''}</span>
                            </div>

                            {/* Handle de Trim Derecho */}
                            <div
                              className="ed-tl-handle ed-tl-handle-right"
                              style={{
                                position: 'absolute', right: 0, top: 0, bottom: 0, width: '12px',
                                cursor: 'col-resize', zIndex: 20, background: isSel ? '#A78BFA' : 'rgba(255,255,255,0.4)',
                                borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                              }}
                              onMouseDown={(e) => beginTrimRight(e, c)}
                              title="Recortar final (Trim Out) — arrastrá para ajustar"
                            >
                              <div style={{ width: '2px', height: '14px', background: '#FFF', borderRadius: '1px' }} />
                            </div>

                            {c.transitionAfter && (
                              <button
                                className={selectedId === `tr-${c.id}` ? 'ed-tl-trans ed-tl-trans--sel' : 'ed-tl-trans'}
                                title="Transición"
                                onClick={(e) => { e.stopPropagation(); onSelect(`tr-${c.id}`); }}
                              >
                                {c.transitionAfter === 'cut' ? <SeparatorVertical size={11} /> : <Diamond size={11} />}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ))}
      {menu && onClipAction && (
        <EditorClipMenu menu={menu} puedePartir={canSplitAt ? canSplitAt(menu.clip.id) : true} onAccion={(a) => onClipAction(menu.clip.id, a)} onClose={cerrarMenu} />
      )}
    </div>
    </>
  );
}
