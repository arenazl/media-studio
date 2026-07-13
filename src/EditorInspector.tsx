// Inspector (panel derecho) — contextual según la selección (prototipo líneas 928-1018). WO-4:
// lo que el render EJECUTA se edita de verdad y PERSISTE (vía los callbacks al draft → montajeFromTracks):
// contenido de texto, tipo de transición, VOLUMEN del clip (video → audioGain), volumen+DUCKING de la
// música. Lo que el render NO ejecuta sigue siendo preview de sesión con hint honesto (se pierde al
// cerrar): transform/opacidad/rotación, alineación/color de texto, fades por clip, volumen de VOZ
// (el render lo tiene fijo en 1.4). Agregar esos como persistibles sería mentirle al usuario (D5) —
// se suman campo+control JUNTOS el día que el render los soporte, nunca el campo solo.
import { useState } from 'react';
import { PanelRightClose, PanelRightOpen, AlignLeft, AlignCenter, AlignRight, Diamond, SeparatorVertical, Layers } from 'lucide-react';
import type { EditorClip, TrackId, TransitionKind } from './lib/editorTracks';
import { transitionKindDurSec } from './lib/editorTracks';
import './EditorInspector.css';

interface Transform { x: number; y: number; scale: number; rotation: number; opacity: number }
const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 };

interface TextStyle { align: 'left' | 'center' | 'right'; color: string }
const DEFAULT_TEXT_STYLE: TextStyle = { align: 'center', color: '#FFFFFF' };

// fades = preview de sesión (el render no ejecuta fades por clip — D5); volumen/ducking pasan a
// persistir por callback, ya no viven acá.
interface FadesLocal { fadeIn: boolean; fadeOut: boolean }
const SWATCHES = ['#FFFFFF', '#FFB800', '#00B37E', '#14110C', '#FF5C8A'];

const KIND_LABEL: Partial<Record<TrackId, string>> = {
  video: 'Clip de video', texto: 'Capa de texto', voz: 'Pista de voz', musica: 'Pista de música', sfx: 'Efecto de sonido', fx: 'Efecto',
};

export interface EditorInspectorProps {
  open: boolean;
  width: number;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  selectionKind: 'clip' | 'transition' | null;
  trackId?: TrackId;
  clip?: EditorClip;
  onTextContentChange: (clipId: string, value: string) => void;
  onTransitionTypeChange: (clipId: string, kind: TransitionKind) => void;
  onMediaChange: (clipId: string, patch: { audioGain?: number; duck?: boolean }) => void;   // WO-4: volumen/ducking ejecutables
  overlappingFx: EditorClip[];
}

export default function EditorInspector({
  open, width, onToggle, onResizeStart, selectionKind, trackId, clip, onTextContentChange, onTransitionTypeChange, onMediaChange, overlappingFx,
}: EditorInspectorProps) {
  // overrides puramente de UI, por clip id — ver nota de honestidad arriba (preview de sesión).
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>({});
  const [fades, setFades] = useState<Record<string, FadesLocal>>({});

  if (!open) {
    return (
      <div className="ed-insp ed-insp--closed" style={{ width: 46, flex: '0 0 46px' }}>
        <button className="ed-insp-rail" onClick={onToggle} title="Abrir inspector">
          <PanelRightOpen size={15} />
          <span className="ed-insp-rail-lbl">Inspector</span>
        </button>
      </div>
    );
  }

  const clipId = clip?.id;
  const transform = (clipId && transforms[clipId]) || DEFAULT_TRANSFORM;
  const patchTransform = (patch: Partial<Transform>) => { if (clipId) setTransforms((m) => ({ ...m, [clipId]: { ...transform, ...patch } })); };
  const textStyle = (clipId && textStyles[clipId]) || DEFAULT_TEXT_STYLE;
  const patchTextStyle = (patch: Partial<TextStyle>) => { if (clipId) setTextStyles((m) => ({ ...m, [clipId]: { ...textStyle, ...patch } })); };
  const fadesLocal: FadesLocal = (clipId && fades[clipId]) || { fadeIn: false, fadeOut: false };
  const patchFades = (patch: Partial<FadesLocal>) => { if (clipId) setFades((m) => ({ ...m, [clipId]: { ...fadesLocal, ...patch } })); };

  const isText = trackId === 'texto';
  const isMedia = trackId === 'video' || trackId === 'voz' || trackId === 'musica' || trackId === 'sfx';
  // volumen persistido (WO-4): video usa audioGain (default 1); música usa audioGain como music.gain
  // (default real 0.28). El slider trabaja en 0-100 y persiste 0-1.
  const gainDefault = trackId === 'musica' ? 0.28 : 1;
  const volumePct = Math.round(((clip?.audioGain ?? gainDefault)) * 100);
  const isDuck = clip?.meta !== 'sin ducking';   // música: el meta codifica el ducking

  return (
    <>
    <div className="editor-resize-x" onMouseDown={onResizeStart} title="Arrastrar para redimensionar" />
    <div className="ed-insp" style={{ width, flex: `0 0 ${width}px` }}>
      <div className="ed-insp-head">
        <span className="ed-insp-eyebrow">{selectionKind === 'transition' ? 'Transición' : (trackId && KIND_LABEL[trackId]) || 'Elemento'}</span>
        <button className="ed-insp-collapse" onClick={onToggle} title="Colapsar"><PanelRightClose size={14} /></button>
      </div>

      {!selectionKind && <div className="ed-insp-empty">Seleccioná un clip o una transición en la timeline.</div>}

      {selectionKind && clip && (
        <div className="ed-insp-body">
          <div className="ed-insp-name">{clip.label}</div>

          {selectionKind === 'transition' && (
            <>
              <div className="ed-insp-lbl">Tipo de transición</div>
              <div className="ed-insp-trans-opts">
                {([['dissolve', 'Disolvencia cruzada', 'funde clip A en clip B', Diamond], ['cut', 'Corte directo', 'sin transición', SeparatorVertical], ['slide', 'Deslizar', 'push lateral', SeparatorVertical]] as const)
                  .map(([kind, name, sub, Icon]) => (
                    <button
                      key={kind}
                      className={clip.transitionAfter === kind ? 'ed-insp-trans-opt ed-insp-trans-opt--on' : 'ed-insp-trans-opt'}
                      onClick={() => onTransitionTypeChange(clip.id, kind as TransitionKind)}
                    >
                      <Icon size={15} />
                      <div><div className="ed-insp-trans-name">{name}</div><div className="ed-insp-trans-sub">{sub}</div></div>
                    </button>
                  ))}
              </div>
              <div className="ed-insp-lbl">Duración (fija según el tipo — la resuelve el render)</div>
              <div className="ed-insp-static">{transitionKindDurSec(clip.transitionAfter).toFixed(2)}s</div>
            </>
          )}

          {selectionKind === 'clip' && (
            <>
              <div className="ed-insp-lbl">Posición &amp; tamaño <span className="ed-insp-hint">(vista previa — no persiste aún)</span></div>
              <div className="ed-insp-grid2">
                <label className="ed-insp-field">X<input type="number" value={transform.x} onChange={(e) => patchTransform({ x: Number(e.target.value) || 0 })} /></label>
                <label className="ed-insp-field">Y<input type="number" value={transform.y} onChange={(e) => patchTransform({ y: Number(e.target.value) || 0 })} /></label>
                <label className="ed-insp-field">Escala %<input type="number" value={transform.scale} onChange={(e) => patchTransform({ scale: Number(e.target.value) || 0 })} /></label>
                <label className="ed-insp-field">Rot °<input type="number" value={transform.rotation} onChange={(e) => patchTransform({ rotation: Number(e.target.value) || 0 })} /></label>
              </div>
              <div className="ed-insp-lbl">Opacidad</div>
              <input className="ed-insp-range" type="range" min={0} max={100} value={transform.opacity} onChange={(e) => patchTransform({ opacity: Number(e.target.value) })} />

              {isText && (
                <div className="ed-insp-section">
                  <div className="ed-insp-lbl">Contenido</div>
                  <textarea className="ed-insp-textarea" rows={2} value={clip.label} onChange={(e) => onTextContentChange(clip.id, e.target.value)} />
                  {clip.meta && <div className="ed-insp-note">Preset: {clip.meta}</div>}
                  <div className="ed-insp-lbl">Alineación</div>
                  <div className="ed-insp-align">
                    {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Icon]) => (
                      <button key={a} className={textStyle.align === a ? 'ed-insp-align-btn ed-insp-align-btn--on' : 'ed-insp-align-btn'} onClick={() => patchTextStyle({ align: a })}>
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                  <div className="ed-insp-lbl">Color</div>
                  <div className="ed-insp-swatches">
                    {SWATCHES.map((c) => (
                      <button key={c} className="ed-insp-swatch" style={{ background: c, borderColor: textStyle.color === c ? 'var(--rd-green)' : 'transparent' }} onClick={() => patchTextStyle({ color: c })} />
                    ))}
                  </div>
                </div>
              )}

              {isMedia && (
                <div className="ed-insp-section">
                  {trackId === 'voz' ? (
                    <>
                      <div className="ed-insp-lbl">Volumen <span className="ed-insp-hint">(fijo en el render)</span></div>
                      <input className="ed-insp-range" type="range" min={0} max={100} value={100} disabled readOnly />
                      <div className="ed-insp-note">La voz en off se mezcla a un nivel fijo (realce +40%). El volumen editable llega cuando el render lo soporte.</div>
                    </>
                  ) : (
                    <>
                      <div className="ed-insp-lbl">Volumen <span className="ed-insp-note">{volumePct}%</span></div>
                      <input
                        className="ed-insp-range" type="range" min={0} max={200} value={volumePct}
                        onChange={(e) => clipId && onMediaChange(clipId, { audioGain: Number(e.target.value) / 100 })}
                      />
                    </>
                  )}
                  {trackId === 'musica' && (
                    <>
                      <div className="ed-insp-lbl">Ducking bajo la voz</div>
                      <button
                        className={isDuck ? 'ed-insp-fade ed-insp-fade--on' : 'ed-insp-fade'}
                        onClick={() => clipId && onMediaChange(clipId, { duck: !isDuck })}
                        title="Baja la música al 40% mientras habla la voz"
                      >
                        {isDuck ? 'Activado — baja al 40% bajo la voz' : 'Desactivado'}
                      </button>
                    </>
                  )}
                  <div className="ed-insp-lbl">Fundidos <span className="ed-insp-hint">(vista previa — no persiste aún)</span></div>
                  <div className="ed-insp-fades">
                    <button className={fadesLocal.fadeIn ? 'ed-insp-fade ed-insp-fade--on' : 'ed-insp-fade'} onClick={() => patchFades({ fadeIn: !fadesLocal.fadeIn })}>Fade in</button>
                    <button className={fadesLocal.fadeOut ? 'ed-insp-fade ed-insp-fade--on' : 'ed-insp-fade'} onClick={() => patchFades({ fadeOut: !fadesLocal.fadeOut })}>Fade out</button>
                  </div>
                </div>
              )}

              <div className="ed-insp-section">
                <div className="ed-insp-lbl"><Layers size={11} /> Efectos aplicados en este clip</div>
                {overlappingFx.length === 0
                  ? <div className="ed-insp-note">Sin efectos aplicados en este clip.</div>
                  : overlappingFx.map((fx) => (
                    <div key={fx.id} className="ed-insp-fx-row">
                      <span className="ed-insp-fx-dot" style={{ background: fx.color }} />
                      <span className="ed-insp-fx-name">{fx.label}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
