// Inspector (panel derecho) — contextual según la selección (prototipo líneas 928-1018). Lo que
// tiene un campo REAL en el draft (contenido de texto, tipo de transición) se edita de verdad y entra
// al historial de deshacer/rehacer (vía los callbacks). Transform/opacidad/color/volumen/ducking/fades
// NO tienen un campo real en MontajePlan hoy — son overrides LOCALES de esta sesión (se pierden al
// cerrar el editor): mapear esto a un modelo persistible es la "composición final" que
// REGLAS-IMPLEMENTACION.md pide dejar para el modelo superior, no inventarla acá.
import { useState } from 'react';
import { PanelRightClose, PanelRightOpen, AlignLeft, AlignCenter, AlignRight, Diamond, SeparatorVertical, Layers } from 'lucide-react';
import type { EditorClip, TrackId, TransitionKind } from './lib/editorTracks';
import { transitionKindDurSec } from './lib/editorTracks';
import './EditorInspector.css';

interface Transform { x: number; y: number; scale: number; rotation: number; opacity: number }
const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 };

interface TextStyle { align: 'left' | 'center' | 'right'; color: string }
const DEFAULT_TEXT_STYLE: TextStyle = { align: 'center', color: '#FFFFFF' };

interface MediaLocal { volume: number; ducking: number; fadeIn: boolean; fadeOut: boolean }
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
  overlappingFx: EditorClip[];
}

export default function EditorInspector({
  open, width, onToggle, onResizeStart, selectionKind, trackId, clip, onTextContentChange, onTransitionTypeChange, overlappingFx,
}: EditorInspectorProps) {
  // overrides puramente de UI, por clip id — ver nota de honestidad arriba.
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>({});
  const [media, setMedia] = useState<Record<string, MediaLocal>>({});

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
  const mediaLocal: MediaLocal = (clipId && media[clipId]) || { volume: 100, ducking: clip?.meta === 'con ducking' ? 60 : 0, fadeIn: false, fadeOut: false };
  const patchMedia = (patch: Partial<MediaLocal>) => { if (clipId) setMedia((m) => ({ ...m, [clipId]: { ...mediaLocal, ...patch } })); };

  const isText = trackId === 'texto';
  const isMedia = trackId === 'video' || trackId === 'voz' || trackId === 'musica' || trackId === 'sfx';

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
                  <div className="ed-insp-lbl">Volumen</div>
                  <input className="ed-insp-range" type="range" min={0} max={100} value={mediaLocal.volume} onChange={(e) => patchMedia({ volume: Number(e.target.value) })} />
                  <div className="ed-insp-lbl">Ducking bajo voz</div>
                  <input className="ed-insp-range ed-insp-range--gold" type="range" min={0} max={100} value={mediaLocal.ducking} onChange={(e) => patchMedia({ ducking: Number(e.target.value) })} />
                  <div className="ed-insp-fades">
                    <button className={mediaLocal.fadeIn ? 'ed-insp-fade ed-insp-fade--on' : 'ed-insp-fade'} onClick={() => patchMedia({ fadeIn: !mediaLocal.fadeIn })}>Fade in</button>
                    <button className={mediaLocal.fadeOut ? 'ed-insp-fade ed-insp-fade--on' : 'ed-insp-fade'} onClick={() => patchMedia({ fadeOut: !mediaLocal.fadeOut })}>Fade out</button>
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
