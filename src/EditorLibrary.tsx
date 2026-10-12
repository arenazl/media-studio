// Biblioteca (panel izquierdo) — tabs Clips/Audio/Texto/Efectos/Marca + buscador + items (prototipo
// líneas 861-895). Colapsable a un riel angosto + ancho arrastrable (lib/editorUi.ts BIN_W_MIN/MAX).
// WO-6a: los items DROPPABLES (clips/audio con fileRef, presets de texto) son draggable a la timeline
// para insertar un clip nuevo. Efectos/Marca NO son droppables (el render no ejecuta efectos por clip;
// el logo ya viene del brandKit) — cursor not-allowed + tooltip honesto.
// 2026-10-11 (Lucas: "toda esta parte debería tener preview, audio, texto, foto del video, imagen, todo"): cada item
// lleva su miniatura según lo que es — el cuadro real del clip (se reproduce al pasar el mouse), play del audio ahí
// mismo, el texto como queda en el cuadro, el efecto animado, y el logo, el color y el nombre de la marca.
import { useEffect, useRef, useState } from 'react';
import { Search, ChevronsRight, ChevronsLeft, Plus, Play, Pause } from 'lucide-react';
import type { LibItem, LibTab } from './lib/editorLibrary';
import { LIB_TABS } from './lib/editorLibrary';
import { API_BASE } from './config';
import { resolverSrc } from './remotion/derivar';
import './EditorLibrary.css';

const urlDe = (ref: string) => resolverSrc(API_BASE, ref);

// muestra de cada preset de texto, ubicada donde cae en el cuadro
const MUESTRA_TEXTO: Record<string, string> = { titulo: 'Título', lower: 'Nombre', cta: 'Entrá ya', subs: 'así se lee', precio: '$9.900' };

function Miniatura({ it, sonando, onAudio }: { it: LibItem; sonando: boolean; onAudio: (it: LibItem) => void }) {
  if (it.tab === 'clips' && it.fileRef) {
    return (
      <video
        className="ed-lib-thumb ed-lib-thumb--video"
        src={`${urlDe(it.fileRef)}#t=0.8`}
        muted playsInline preload="metadata"
        onMouseEnter={(e) => { void e.currentTarget.play().catch(() => {}); }}
        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0.8; }}
      />
    );
  }
  if (it.tab === 'audio' && it.fileRef) {
    return (
      <button
        className={sonando ? 'ed-lib-thumb ed-lib-thumb--audio ed-lib-thumb--on' : 'ed-lib-thumb ed-lib-thumb--audio'}
        style={{ ['--c' as string]: it.color }}
        onClick={(e) => { e.stopPropagation(); onAudio(it); }}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        title={sonando ? 'Pausar' : 'Escuchar'}
      >
        {sonando ? <Pause size={14} /> : <Play size={14} />}
        <span className="ed-lib-bars">{[0, 1, 2, 3].map((i) => <i key={i} />)}</span>
      </button>
    );
  }
  if (it.tab === 'texto') {
    return (
      <div className={`ed-lib-thumb ed-lib-thumb--frame ed-lib-txt ed-lib-txt--${it.meta}`}>
        <span style={{ ['--c' as string]: it.color }}>{MUESTRA_TEXTO[it.meta] || 'Aa'}</span>
      </div>
    );
  }
  if (it.id.startsWith('fx-')) {
    return <div className={`ed-lib-thumb ed-lib-thumb--frame ed-lib-fx ed-lib-fx--${it.id}`}><span className="ed-lib-fx-escena" /><span className="ed-lib-fx-flash" /></div>;
  }
  if (it.id === 'marca-logo' && it.fileRef) {
    return <div className="ed-lib-thumb ed-lib-thumb--frame ed-lib-thumb--logo"><img src={urlDe(it.fileRef)} alt="" /></div>;
  }
  if (it.id === 'marca-color') return <div className="ed-lib-thumb ed-lib-thumb--frame" style={{ background: it.color }} />;
  if (it.id === 'marca-fon') return <div className="ed-lib-thumb ed-lib-thumb--frame ed-lib-thumb--fon" style={{ color: it.color }}>Aa</div>;
  return (
    <div className="ed-lib-item-ico" style={{ background: `${it.color}22`, borderColor: `${it.color}44` }}>
      <span className="ed-lib-item-dot" style={{ background: it.color }} />
    </div>
  );
}

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
  // un solo audio sonando a la vez en la biblioteca; se corta al salir del editor
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sonando, setSonando] = useState<string | null>(null);
  useEffect(() => () => { audioRef.current?.pause(); }, []);
  const onAudio = (it: LibItem) => {
    audioRef.current?.pause();
    if (sonando === it.id) { setSonando(null); return; }
    const a = new Audio(urlDe(it.fileRef!));
    audioRef.current = a;
    a.onended = () => setSonando(null);
    void a.play().then(() => setSonando(it.id)).catch(() => setSonando(null));
  };
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
                <Miniatura it={it} sonando={sonando === it.id} onAudio={onAudio} />
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
