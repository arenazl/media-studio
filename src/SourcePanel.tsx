// CONTROL GENÉRICO de selección + preview. Una sola fuente para TODOS los paneles del
// editor (voces, música, animaciones, videos, imágenes, clips de librería…). Se
// configura por props: items + vista + buscador + filtros dinámicos + orden + preview.
// "Se cambia en un lado solo": mejorás acá y mejora en todos los paneles.
//
// Vistas según el contenido: 'chips' (voces/música/narración), 'grid' (animaciones/
// videos/imágenes), 'list' (librería/guiones). La lógica pura (filtrar/ordenar/derivar
// filtros) vive en lib/sourcePanel (con unit tests).
import { useMemo, useRef, useState } from 'react';
import { Play, Square, Loader2, Search, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { applyView, deriveFilterOptions, type SourceItem, type SortMode } from './lib/sourcePanel';
import './SourcePanel.css';

export interface FilterDef { key: string; label: string; options?: { value: string; label: string }[] }
export type ViewMode = 'chips' | 'grid' | 'list';

export interface SourcePanelProps {
  title: string; accent: string; icon?: React.ReactNode; grow?: number; hint?: string;
  items: SourceItem[]; view: ViewMode;
  search?: boolean; filters?: FilterDef[]; sort?: SortMode;
  getPreviewUrl?: (item: SourceItem) => string | null | Promise<string | null>;  // url directa o loader async (TTS)
  previewVolume?: number;                                                        // volumen del preview (0..1)
  onPick: (item: SourceItem) => void;                                            // acción primaria (sumar / arrastrar)
  multiSelect?: boolean; onPickMany?: (items: SourceItem[]) => void; pickManyLabel?: (n: number) => string;
  onSecondary?: (item: SourceItem) => void; secondaryIcon?: React.ReactNode; secondaryTitle?: string;  // ej. borrar de librería
  activeId?: string;                                                             // item resaltado (voz elegida / track sonando / guión abierto)
  footer?: React.ReactNode;                                                      // slot extra debajo (volúmenes, silencio, etc.)
  open?: boolean; onToggle?: () => void;                                         // panel colapsable
  emptyText?: string;
}

export default function SourcePanel(props: SourcePanelProps) {
  const {
    title, accent, icon, grow = 1, hint, items, view, search, filters, sort = 'none',
    getPreviewUrl, previewVolume, onPick, multiSelect, onPickMany, pickManyLabel,
    onSecondary, secondaryIcon, secondaryTitle, activeId, footer, open, onToggle, emptyText,
  } = props;

  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shown = useMemo(() => applyView(items, query, active, sort), [items, query, active, sort]);

  const accentStyle = { ['--accent']: accent } as React.CSSProperties;

  // panel colapsado → tira vertical fina (el host maneja open/onToggle).
  if (open === false) {
    return (
      <button className="sp-strip" style={accentStyle} onClick={onToggle} title={`Expandir ${title}`}>
        <ChevronRight size={14} className="sp-strip-chevron" />
        <span className="sp-strip-label">{title}</span>
      </button>
    );
  }

  const setFilter = (key: string, value: string) => setActive((a) => ({ ...a, [key]: a[key] === value ? '' : value }));
  const toggleSel = (id: string) => setSel((s) => { const nn = new Set(s); nn.has(id) ? nn.delete(id) : nn.add(id); return nn; });
  const addMany = () => { if (onPickMany) onPickMany(items.filter((i) => sel.has(i.id))); setSel(new Set()); };

  const togglePreview = async (item: SourceItem) => {
    const a = audioRef.current; if (!a || !getPreviewUrl) return;
    if (previewId === item.id) { a.pause(); a.currentTime = 0; setPreviewId(null); return; }
    setLoadingId(item.id);
    let url: string | null = null;
    try { url = await getPreviewUrl(item); } catch { url = null; }
    setLoadingId(null);
    if (!url) return;
    a.src = url; a.currentTime = 0; a.volume = previewVolume ?? 1;
    a.play().then(() => setPreviewId(item.id)).catch(() => setPreviewId(null));
  };

  const playBtn = (item: SourceItem) => getPreviewUrl ? (
    <button type="button" className="sp-play" title={previewId === item.id ? 'Detener' : 'Escuchar'} onClick={(e) => { e.stopPropagation(); togglePreview(item); }} disabled={loadingId === item.id}>
      {loadingId === item.id ? <Loader2 size={11} className="sp-spin" /> : previewId === item.id ? <Square size={11} /> : <Play size={11} />}
    </button>
  ) : null;

  return (
    <div className="sp-panel" style={{ ['--grow']: grow, ['--accent']: accent } as React.CSSProperties}>
      <div className="sp-head">
        <span className="sp-title">{icon} {title}</span>
        {onToggle && <button className="sp-collapse" onClick={onToggle} title="Colapsar"><ChevronLeft size={13} /></button>}
      </div>

      {(search || (filters && filters.length > 0)) && (
        <div className="sp-tools">
          {filters?.map((f) => {
            const opts = f.options ?? deriveFilterOptions(items, f.key).map((v) => ({ value: v, label: v }));
            if (!opts.length) return null;
            return (
              <div key={f.key} className="sp-filter-row">
                <button className={!active[f.key] ? 'sp-fchip sp-fchip--on' : 'sp-fchip'} onClick={() => setActive((a) => ({ ...a, [f.key]: '' }))}>{f.label}</button>
                {opts.map((o) => <button key={o.value} className={active[f.key] === o.value ? 'sp-fchip sp-fchip--on' : 'sp-fchip'} onClick={() => setFilter(f.key, o.value)}>{o.label}</button>)}
              </div>
            );
          })}
          {search && (
            <div className="sp-search">
              <Search size={12} className="sp-search-icon" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar…" className="sp-search-input" />
            </div>
          )}
        </div>
      )}

      {hint && <div className="sp-hint">{hint}</div>}

      <div className="sp-body">
        {!shown.length ? (
          <div className="sp-empty">{emptyText || (items.length ? 'sin resultados' : 'vacío')}</div>
        ) : view === 'grid' ? (
          <div className="sp-grid">
            {shown.map((it) => {
              const on = sel.has(it.id);
              return (
                <button key={it.id} type="button" className={`sp-card${on ? ' sp-card--sel' : ''}${it.id === activeId ? ' sp-card--active' : ''}`} title={it.label}
                  onClick={() => (multiSelect ? toggleSel(it.id) : onPick(it))} onDoubleClick={() => onPick(it)}>
                  {it.thumb ? <img src={it.thumb} alt="" loading="lazy" className="sp-card-img" onError={(e) => e.currentTarget.classList.add('sp-img-broken')} /> : <div className="sp-card-ph" />}
                  {on && <span className="sp-card-check"><Check size={11} /></span>}
                  <span className="sp-card-lbl">{it.label}</span>
                </button>
              );
            })}
          </div>
        ) : view === 'list' ? (
          <div className="sp-list">
            {shown.map((it) => (
              <div key={it.id} className={it.id === activeId ? 'sp-row sp-row--active' : 'sp-row'}>
                {playBtn(it)}
                <button type="button" className="sp-row-main" title={it.label} onClick={() => onPick(it)}>
                  <span className="sp-row-lbl">{it.label}</span>
                  {it.sub && <span className="sp-row-sub">{it.sub}</span>}
                </button>
                {onSecondary && <button type="button" className="sp-row-sec" title={secondaryTitle} onClick={() => onSecondary(it)}>{secondaryIcon}</button>}
              </div>
            ))}
          </div>
        ) : (
          <div className="sp-chips">
            {shown.map((it) => (
              <span key={it.id} className="sp-chip-wrap">
                {playBtn(it)}
                <button type="button" className={`sp-chip${getPreviewUrl ? ' sp-chip--withplay' : ''}${it.id === activeId ? ' sp-chip--active' : ''}`} title={it.sub || it.label} onClick={() => onPick(it)}>
                  {it.label}{it.sub && <span className="sp-chip-sub"> · {it.sub}</span>}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {multiSelect && sel.size > 0 && (
        <button className="sp-addmany" onClick={addMany} style={accentStyle}><Plus size={13} /> {pickManyLabel ? pickManyLabel(sel.size) : `Agregar ${sel.size}`}</button>
      )}

      {footer && <div className="sp-footer">{footer}</div>}

      <audio ref={audioRef} onEnded={() => setPreviewId(null)} />
    </div>
  );
}
