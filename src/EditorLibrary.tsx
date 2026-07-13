// Biblioteca (panel izquierdo) — tabs Clips/Audio/Texto/Efectos/Marca + buscador + items (prototipo
// líneas 861-895). Colapsable a un riel angosto + ancho arrastrable (lib/editorUi.ts BIN_W_MIN/MAX).
// WO-6a: los items DROPPABLES (clips/audio con fileRef, presets de texto) son draggable a la timeline
// para insertar un clip nuevo. Efectos/Marca NO son droppables (el render no ejecuta efectos por clip;
// el logo ya viene del brandKit) — cursor not-allowed + tooltip honesto.
import { Search, ChevronsRight, ChevronsLeft, Plus } from 'lucide-react';
import type { LibItem, LibTab } from './lib/editorLibrary';
import { LIB_TABS } from './lib/editorLibrary';
import './EditorLibrary.css';

export interface EditorLibraryProps {
  open: boolean;
  width: number;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  activeTab: LibTab;
  onTabChange: (t: LibTab) => void;
  search: string;
  onSearchChange: (v: string) => void;
  items: LibItem[];
}

// un item se puede soltar en la timeline si viene de una pista real (clips/audio/texto). Efectos y
// marca (sin tab de pista) no.
const esDroppable = (it: LibItem) => it.tab === 'clips' || it.tab === 'audio' || it.tab === 'texto';

export default function EditorLibrary({
  open, width, onToggle, onResizeStart, activeTab, onTabChange, search, onSearchChange, items,
}: EditorLibraryProps) {
  if (!open) {
    return (
      <div className="ed-lib ed-lib--closed" style={{ width: 46, flex: '0 0 46px' }}>
        <button className="ed-lib-rail" onClick={onToggle} title="Abrir biblioteca">
          <ChevronsRight size={15} />
          <span className="ed-lib-rail-lbl">Biblioteca</span>
        </button>
      </div>
    );
  }
  return (
    <>
      <div className="ed-lib" style={{ width, flex: `0 0 ${width}px` }}>
        <div className="ed-lib-tabs">
          {LIB_TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === activeTab ? 'ed-lib-tab ed-lib-tab--on' : 'ed-lib-tab'}
              onClick={() => onTabChange(t.id)}
              title={t.label}
            >
              {t.label}
            </button>
          ))}
          <button className="ed-lib-collapse" onClick={onToggle} title="Colapsar"><ChevronsLeft size={14} /></button>
        </div>
        <div className="ed-lib-search">
          <Search size={13} />
          <input
            placeholder="Buscar en la biblioteca"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="ed-lib-items">
          {items.length === 0 ? (
            <div className="ed-lib-empty">Nada acá todavía.</div>
          ) : items.map((it) => {
            const drop = esDroppable(it);
            return (
              <div
                key={it.id}
                className={drop ? 'ed-lib-item ed-lib-item--drag' : 'ed-lib-item ed-lib-item--nodrop'}
                title={drop ? 'Arrastrá a la timeline' : 'Este elemento no se puede soltar en la timeline'}
                draggable={drop}
                onDragStart={drop ? (e) => {
                  e.dataTransfer.setData('application/x-lib-item', JSON.stringify(it));
                  e.dataTransfer.effectAllowed = 'copy';
                } : undefined}
              >
                <div className="ed-lib-item-ico" style={{ background: `${it.color}22`, borderColor: `${it.color}44` }}>
                  <span className="ed-lib-item-dot" style={{ background: it.color }} />
                </div>
                <div className="ed-lib-item-txt">
                  <div className="ed-lib-item-label">{it.label}</div>
                  <div className="ed-lib-item-meta">{it.meta}</div>
                </div>
                {drop && <Plus size={14} className="ed-lib-item-add" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="editor-resize-x" onMouseDown={onResizeStart} title="Arrastrar para redimensionar" />
    </>
  );
}
