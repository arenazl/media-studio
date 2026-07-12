// Editor MULTIPISTA (Fase 4, docs/rediseno/HANDOFF.md §9 + prototipo.dc.html líneas 836-1085).
// Contenedor: orquesta biblioteca/preview/inspector/timeline (componentes hermanos) sobre un DRAFT
// local de pistas — sembrado una vez desde el MontajePlan REAL del comercial (editorTracks.ts) y
// editado con las funciones puras de editorEdits.ts (split/duplicar/eliminar + deshacer/rehacer).
//
// Límite de honestidad (REGLAS-IMPLEMENTACION.md): estos cambios NO se escriben de vuelta al
// proyecto — mapear el draft editado a un MontajePlan persistible + al render (renderComercial.mjs)
// es la "composición final" que el modelo superior tiene que diseñar, no esta fase. Por eso el editor
// no recibe `onChange`/`updateProject`: es intencional, no un olvido.
// TODO(modelo-superior): auto-armado por IA real de la timeline — hoy se puebla 1:1 desde el
// MontajePlan ya persistido (Montaje) o, si no se armó, desde storyboardToMontaje (mecánico).
// TODO(modelo-superior): persistir las ediciones del draft + exportar/renderizar desde acá (hoy
// "Listo → Publicar" sólo navega; el render real sigue viviendo en el paso Montaje).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import type { Project, ProjectReel } from './lib/projects';
import {
  buildEditorTimeline, findClip, clipAt, clipsAt, aspectLabel,
  type EditorTrack, type EditorClip, type TransitionKind,
} from './lib/editorTracks';
import {
  deleteClip, duplicateClip, splitClip, initHistory, pushHistory, undoHistory, redoHistory, type EditHistory,
} from './lib/editorEdits';
import {
  getEditorPanels, setEditorPanels, getPlayhead, setPlayhead,
  BIN_W_MIN, BIN_W_MAX, INSP_W_MIN, INSP_W_MAX, TL_H_MIN, TL_H_MAX, type EditorPanelsUi,
} from './lib/editorUi';
import { buildLibraryTabs, filterLibItems, type LibTab } from './lib/editorLibrary';
import EditorToolbar from './EditorToolbar';
import EditorLibrary from './EditorLibrary';
import EditorPreview from './EditorPreview';
import EditorInspector from './EditorInspector';
import EditorTimeline from './EditorTimeline';
import './Editor.css';

export interface EditorProps {
  project: Project | null;
  onBack: () => void;
  onPublish: () => void;
}

// alto de la timeline COLAPSADA (sólo la barra de herramientas visible) — igual al prototipo
// (edTlH cae a 40px cuando !edTlOpen, en vez de seguir reservando el alto arrastrable completo).
const TL_COLLAPSED_H = 40;

interface Selection { kind: 'clip' | 'transition' | null; clip?: EditorClip; track?: EditorTrack }

function resolveSelection(tracks: EditorTrack[], selectedId: string | null): Selection {
  if (!selectedId) return { kind: null };
  const rawId = selectedId.startsWith('tr-') ? selectedId.slice(3) : selectedId;
  const found = findClip(tracks, rawId);
  if (!found) return { kind: null };
  return { kind: selectedId.startsWith('tr-') ? 'transition' : 'clip', clip: found.clip, track: found.track };
}

// Arrastre genérico de un panel (bin/inspector por ancho X, timeline por alto Y) — mismo criterio que
// startDrag() del prototipo: listeners en document (no en el handle) para no perder el drag si el
// mouse sale del handle a mitad de camino.
function beginAxisDrag(e: React.MouseEvent, opts: {
  axis: 'x' | 'y'; dir?: 1 | -1; min: number; max: number; start: number;
  onChange: (v: number) => void; onEnd: (v: number) => void;
}) {
  e.preventDefault();
  const { axis, dir = 1, min, max, start, onChange, onEnd } = opts;
  const x0 = e.clientX;
  const y0 = e.clientY;
  let last = start;
  const onMove = (ev: MouseEvent) => {
    const delta = (axis === 'x' ? ev.clientX - x0 : ev.clientY - y0) * dir;
    last = Math.min(max, Math.max(min, start + delta));
    onChange(last);
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    onEnd(last);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
}

export default function Editor({ project, onBack, onPublish }: EditorProps) {
  const reel: ProjectReel | undefined = project?.reels[0];
  const comercial = reel?.comercial;

  // seed: se calcula UNA sola vez al montar (el editor entero remonta al cambiar de ruta — App.tsx
  // no lo mantiene vivo en background — así que no hace falta re-derivar en un efecto).
  const [history, setHistory] = useState<EditHistory<EditorTrack[]>>(() => initHistory(buildEditorTimeline(comercial).tracks));
  const [dims] = useState(() => { const t = buildEditorTimeline(comercial); return { width: t.width, height: t.height }; });
  const [contentDirty, setContentDirty] = useState(false);

  const draftTracks = history.present;
  const totalSec = useMemo(() => {
    let max = 0;
    for (const t of draftTracks) for (const c of t.clips) max = Math.max(max, c.startSec + c.durSec);
    return max;
  }, [draftTracks]);

  const [panels, setPanels] = useState<EditorPanelsUi>(() => getEditorPanels());
  const [previewFocus, setPreviewFocus] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LibTab>('clips');
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [playheadSec, setPlayheadSec] = useState(() => getPlayhead(project?.id));

  // reproducción: avanza el playhead mientras `playing` (rAF, no depende de ningún <video> real —
  // varios clips/pistas pueden solaparse, no hay un único elemento de media que "sea" el reloj).
  useEffect(() => {
    if (!playing || totalSec <= 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setPlayheadSec((p) => {
        const next = p + dt;
        if (next >= totalSec) { setPlaying(false); return totalSec; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, totalSec]);

  // persiste la posición del playhead por proyecto (debounce corto — mismo criterio que App.tsx).
  const playheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (playheadTimer.current) clearTimeout(playheadTimer.current);
    playheadTimer.current = setTimeout(() => setPlayhead(project?.id, playheadSec), 400);
    return () => { if (playheadTimer.current) clearTimeout(playheadTimer.current); };
  }, [playheadSec, project?.id]);

  const onSeek = useCallback((sec: number) => setPlayheadSec(Math.min(Math.max(0, sec), Math.max(0, totalSec))), [totalSec]);

  const updatePanelsLive = (patch: Partial<EditorPanelsUi>) => setPanels((p) => ({ ...p, ...patch }));
  const commitPanels = (patch: Partial<EditorPanelsUi>) => setPanels(setEditorPanels(patch));
  const toggleBin = () => commitPanels({ binOpen: !panels.binOpen });
  const toggleInsp = () => commitPanels({ inspOpen: !panels.inspOpen });
  const toggleTl = () => commitPanels({ tlOpen: !panels.tlOpen });

  const dragBin = (e: React.MouseEvent) => beginAxisDrag(e, {
    axis: 'x', min: BIN_W_MIN, max: BIN_W_MAX, start: panels.binW,
    onChange: (v) => updatePanelsLive({ binW: v }), onEnd: (v) => commitPanels({ binW: v }),
  });
  const dragInsp = (e: React.MouseEvent) => beginAxisDrag(e, {
    axis: 'x', dir: -1, min: INSP_W_MIN, max: INSP_W_MAX, start: panels.inspW,
    onChange: (v) => updatePanelsLive({ inspW: v }), onEnd: (v) => commitPanels({ inspW: v }),
  });
  const dragTl = (e: React.MouseEvent) => beginAxisDrag(e, {
    axis: 'y', dir: -1, min: TL_H_MIN, max: TL_H_MAX, start: panels.tlH,
    onChange: (v) => updatePanelsLive({ tlH: v }), onEnd: (v) => commitPanels({ tlH: v }),
  });

  // mutaciones ESTRUCTURALES (split/duplicar/eliminar/tipo de transición): entran al historial —
  // deshacer/rehacer las cubre, como en cualquier NLE.
  const mutate = (fn: (t: EditorTrack[]) => EditorTrack[]) => {
    setHistory((h) => { const next = fn(h.present); return next === h.present ? h : pushHistory(h, next); });
  };
  // edición de CONTENIDO (tipear en un texto): reemplaza el presente sin apilar un undo por tecla —
  // se marca "sin guardar" igual (contentDirty), pero no se apila en el historial de deshacer/rehacer.
  const replacePresent = (fn: (t: EditorTrack[]) => EditorTrack[]) => {
    setHistory((h) => ({ ...h, present: fn(h.present) }));
    setContentDirty(true);
  };

  const selection = useMemo(() => resolveSelection(draftTracks, selectedId), [draftTracks, selectedId]);
  const canEdit = selection.kind === 'clip';
  const dirty = history.past.length > 0 || contentDirty;

  const onDelete = () => { if (!selection.clip) return; const id = selection.clip.id; mutate((t) => deleteClip(t, id)); setSelectedId(null); };
  const onDuplicate = () => { if (!selection.clip) return; mutate((t) => duplicateClip(t, selection.clip!.id)); };
  const onSplit = () => { if (!selection.clip) return; mutate((t) => splitClip(t, selection.clip!.id, playheadSec)); };
  const onUndo = () => setHistory(undoHistory);
  const onRedo = () => setHistory(redoHistory);

  const onTextContentChange = (clipId: string, value: string) => {
    replacePresent((tracks) => tracks.map((t) => (t.id === 'texto'
      ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? { ...c, label: value } : c)) }
      : t)));
  };
  const onTransitionTypeChange = (clipId: string, kind: TransitionKind) => {
    mutate((tracks) => tracks.map((t) => (t.id === 'video'
      ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? { ...c, transitionAfter: kind } : c)) }
      : t)));
  };

  const videoTrack = draftTracks.find((t) => t.id === 'video');
  const textoTrack = draftTracks.find((t) => t.id === 'texto');
  const fxTrack = draftTracks.find((t) => t.id === 'fx');
  const currentVideoClip = clipAt(videoTrack, playheadSec);
  const activeTexts = clipsAt(textoTrack, playheadSec);
  const overlappingFx = useMemo(() => {
    if (selection.kind !== 'clip' || !selection.clip || !fxTrack) return [];
    const { startSec, durSec } = selection.clip;
    return fxTrack.clips.filter((f) => f.startSec < startSec + durSec && f.startSec + f.durSec > startSec);
  }, [selection.kind, selection.clip, fxTrack]);

  const onStepScene = (dir: 1 | -1) => {
    if (!videoTrack || videoTrack.clips.length === 0) return;
    const idx = videoTrack.clips.findIndex((c) => playheadSec >= c.startSec && playheadSec < c.startSec + c.durSec);
    const cur = idx === -1 ? (dir === 1 ? -1 : videoTrack.clips.length) : idx;
    const nextIdx = Math.min(videoTrack.clips.length - 1, Math.max(0, cur + dir));
    const target = videoTrack.clips[nextIdx];
    if (target) setPlayheadSec(target.startSec);
  };

  const libTabs = useMemo(() => buildLibraryTabs(project, reel, comercial), [project, reel, comercial]);
  const libItems = useMemo(() => filterLibItems(libTabs[activeTab], search), [libTabs, activeTab, search]);

  const aspect = aspectLabel(dims.width, dims.height);
  const durationLabel = `${Math.round(totalSec)}s`;
  const pieceName = comercial?.titulo || project?.name || 'Sin título';

  if (!project) {
    return (
      <div className="editor-shell">
        <div className="editor-empty">
          <Clapperboard size={34} strokeWidth={1.5} className="editor-empty-ico" />
          <div className="editor-empty-title">No hay un proyecto abierto</div>
          <p className="editor-empty-note">Abrí una pieza desde Inicio, Videos o Audio para editarla acá.</p>
          <button className="editor-empty-back" onClick={onBack}><ArrowLeft size={13} /> Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-shell">
      <EditorToolbar
        onBack={onBack}
        pieceName={pieceName}
        aspect={aspect}
        durationLabel={durationLabel}
        dirty={dirty}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        canEdit={canEdit}
        onUndo={onUndo}
        onRedo={onRedo}
        onSplit={onSplit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        previewFocus={previewFocus}
        onTogglePreviewFocus={() => setPreviewFocus((v) => !v)}
        onPublish={onPublish}
      />
      <div className="editor-mid">
        <EditorLibrary
          open={panels.binOpen && !previewFocus}
          width={panels.binW}
          onToggle={toggleBin}
          onResizeStart={dragBin}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          search={search}
          onSearchChange={setSearch}
          items={libItems}
        />
        <EditorPreview
          aspect={aspect}
          playing={playing}
          onTogglePlay={() => setPlaying((p) => !p)}
          onStepScene={onStepScene}
          playheadSec={playheadSec}
          totalSec={totalSec}
          currentVideoClip={currentVideoClip}
          activeTexts={activeTexts}
          cta={comercial?.publicacion?.cta}
          brandKit={project.brandKit}
        />
        <EditorInspector
          open={panels.inspOpen && !previewFocus}
          width={panels.inspW}
          onToggle={toggleInsp}
          onResizeStart={dragInsp}
          selectionKind={selection.kind}
          trackId={selection.track?.id}
          clip={selection.clip}
          onTextContentChange={onTextContentChange}
          onTransitionTypeChange={onTransitionTypeChange}
          overlappingFx={overlappingFx}
        />
      </div>
      <EditorTimeline
        open={panels.tlOpen}
        height={panels.tlOpen ? panels.tlH : TL_COLLAPSED_H}
        onToggle={toggleTl}
        onResizeStart={dragTl}
        tracks={draftTracks}
        totalSec={totalSec}
        playheadSec={playheadSec}
        onSeek={onSeek}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        selectedId={selectedId}
        onSelect={setSelectedId}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    </div>
  );
}
