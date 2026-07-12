// Barra superior del editor multipista (prototipo.dc.html líneas 840-857). Navegación (back/publicar)
// + herramientas de edición del clip seleccionado (split/duplicar/eliminar) + deshacer/rehacer sobre
// el historial local (lib/editorEdits.ts) + chips de estado.
import { ArrowLeft, Undo2, Redo2, Scissors, CopyPlus, Trash2, Sparkles, Check, Pencil, Eye } from 'lucide-react';
import './EditorToolbar.css';

export interface EditorToolbarProps {
  onBack: () => void;
  pieceName: string;
  aspect: string;
  durationLabel: string;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canEdit: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  previewFocus: boolean;
  onTogglePreviewFocus: () => void;
  onPublish: () => void;
}

export default function EditorToolbar({
  onBack, pieceName, aspect, durationLabel, dirty, canUndo, canRedo, canEdit,
  onUndo, onRedo, onSplit, onDuplicate, onDelete, previewFocus, onTogglePreviewFocus, onPublish,
}: EditorToolbarProps) {
  return (
    <div className="ed-toolbar">
      <div className="ed-toolbar-left">
        <button className="ed-crumb" onClick={onBack}><ArrowLeft size={13} /> Montaje</button>
        <span className="ed-sep" />
        <span className="ed-title">Editor</span>
        <span className="ed-chip" title={pieceName}>{aspect} · {durationLabel}</span>
        <span className="ed-chip ed-chip--gold"><Sparkles size={11} /> Auto-armado por IA</span>
        <span className={dirty ? 'ed-chip ed-chip--blue' : 'ed-chip ed-chip--green'}>
          {dirty ? <><Pencil size={11} /> Cambios sin guardar</> : <><Check size={11} /> Guardado</>}
        </span>
      </div>
      <div className="ed-toolbar-right">
        <button className="ed-tool" title="Deshacer" disabled={!canUndo} onClick={onUndo}><Undo2 size={15} /></button>
        <button className="ed-tool" title="Rehacer" disabled={!canRedo} onClick={onRedo}><Redo2 size={15} /></button>
        <button className="ed-tool" title="Partir en el playhead" disabled={!canEdit} onClick={onSplit}><Scissors size={15} /></button>
        <button className="ed-tool" title="Duplicar" disabled={!canEdit} onClick={onDuplicate}><CopyPlus size={15} /></button>
        <button className="ed-tool ed-tool--danger" title="Eliminar" disabled={!canEdit} onClick={onDelete}><Trash2 size={15} /></button>
        <span className="ed-vsep" />
        <button className={previewFocus ? 'ed-btn ed-btn--on' : 'ed-btn'} onClick={onTogglePreviewFocus}>
          <Eye size={13} /> Vista previa
        </button>
        <button className="ed-btn ed-btn--primary" onClick={onPublish}>Listo → Publicar</button>
      </div>
    </div>
  );
}
