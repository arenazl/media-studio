// Editor MULTIPISTA (Fase 4, docs/rediseno/HANDOFF.md §9 + prototipo.dc.html líneas 836-1085).
// Contenedor: orquesta biblioteca/preview/inspector/timeline (componentes hermanos) sobre un DRAFT
// local de pistas — sembrado una vez desde el MontajePlan REAL del comercial (editorTracks.ts) y
// editado con las funciones puras de editorEdits.ts (split/duplicar/eliminar + deshacer/rehacer).
//
// WO-4: el editor CIERRA el loop de persistencia. El draft editado se invierte a un MontajePlan
// (montajeFromTracks.ts) y se guarda vía el DUEÑO ÚNICO (App.updateProject) por el callback
// onSaveMontaje — el editor NO conoce localStorage ni fetch. El render sigue viviendo en el paso
// Montaje (D6): "Listo → Publicar" guarda (si hay cambios) + navega; no dispara un render escondido.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import type { Project, ProjectReel } from './lib/projects';
import {
  buildEditorTimeline, resolvePlan, findClip, clipAt, clipsAt, aspectLabel,
  type EditorTrack, type EditorClip, type TransitionKind,
} from './lib/editorTracks';
import { tracksToMontaje } from './lib/montajeFromTracks';
import { autoArmarPlan } from './lib/autoArmar';
import type { MontajePlan, MontajeState } from './lib/montajePlan';
import {
  deleteClip, duplicateClip, splitClip, dropLibItem, initHistory, pushHistory, undoHistory, redoHistory,
  type EditHistory, type DropItem,
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
  // WO-4: App lo cablea a updateProject (dueño único). El editor le pasa el MontajePlan invertido del
  // draft; App escribe comercial.montaje.plan + avanza el estado 'montaje'→'editado'.
  onSaveMontaje?: (plan: MontajePlan) => void;
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

export default function Editor({ project, onBack, onPublish, onSaveMontaje }: EditorProps) {
  const reel: ProjectReel | undefined = project?.reels[0];
  const comercial = reel?.comercial;

  // seed: se calcula UNA sola vez al montar (el editor entero remonta al cambiar de ruta — App.tsx
  // no lo mantiene vivo en background — así que no hace falta re-derivar en un efecto).
  const [history, setHistory] = useState<EditHistory<EditorTrack[]>>(() => initHistory(buildEditorTimeline(comercial).tracks));
  const [dims] = useState(() => { const t = buildEditorTimeline(comercial); return { width: t.width, height: t.height }; });
  const [contentDirty, setContentDirty] = useState(false);
  // plan base para invertir el draft (WO-4): el plan de origen del editor (persistido o derivado del
  // storyboard). Se fija al montar; aporta lo que el draft no modela (dims/logo/gain/duck). Fallback
  // con las dims que ya resolvió buildEditorTimeline (evita reinventar el default acá).
  const [basePlan] = useState<MontajePlan>(() => {
    const t = buildEditorTimeline(comercial);
    return resolvePlan(comercial) ?? { width: t.width, height: t.height, fps: 30, scenes: [], silences: [], texts: [] };
  });

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

  // WO-4: guardar = invertir el draft a MontajePlan y entregarlo al dueño único (App). Resetea el
  // estado "sin guardar" arrancando un historial nuevo desde el presente (no se puede deshacer más
  // allá de lo guardado, como en cualquier NLE tras un Guardar).
  const onSave = useCallback(() => {
    if (!onSaveMontaje) return;
    onSaveMontaje(tracksToMontaje(history.present, basePlan));
    setHistory((h) => initHistory(h.present));
    setContentDirty(false);
  }, [onSaveMontaje, history.present, basePlan]);

  // WO-5: auto-armar la timeline (determinístico, sin IA/red). Reemplaza el draft por el resultado de
  // autoArmarPlan (storyboard + voz + textos hook/CTA reales) vía el historial → deshacible con undo.
  const onAutoArmar = () => {
    if (!comercial) return;
    const plan = autoArmarPlan(comercial, reel);
    // reusa buildEditorTimeline pasándole un comercial con el plan armado como montaje persistido.
    const comercialConPlan = { ...comercial, montaje: { plan, exports: (comercial.montaje as MontajeState | undefined)?.exports ?? [] } };
    const tracks = buildEditorTimeline(comercialConPlan).tracks;
    mutate(() => tracks);
  };

  // WO-6a: soltar un item de la biblioteca en la timeline → dropLibItem (deshacible con undo).
  const onDropItem = (raw: string) => {
    try {
      const item = JSON.parse(raw) as DropItem;
      mutate((t) => dropLibItem(t, item, playheadSec));
    } catch { /* payload inválido → no-op */ }
  };

  // "Listo → Publicar": guarda si hay cambios y navega (D6 — el render sigue en Montaje).
  const onPublishSaving = () => { if (dirty) onSave(); onPublish(); };

  // salir: si hay cambios sin guardar, confirmar. Sin ConfirmModal propio del editor, window.confirm
  // (deuda menor anotada); el flujo de la app usa modales por pantalla, no hay uno global reutilizable.
  const onBackSafe = () => {
    if (dirty && !window.confirm('Tenés cambios sin guardar en el editor. ¿Salir y descartarlos?')) return;
    onBack();
  };

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

  // WO-4 (D5): cablea SOLO lo que el render EJECUTA — audioGain del clip (video) y gain/duck de la
  // música (persistidos vía el meta del clip de música). Va por replacePresent (marca dirty sin apilar
  // un undo por cada tick del slider — igual que editar texto).
  const onMediaChange = (clipId: string, patch: { audioGain?: number; duck?: boolean }) => {
    replacePresent((tracks) => tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const next = { ...c };
        if (patch.audioGain != null) next.audioGain = patch.audioGain;
        // la música codifica el ducking en su meta (lo lee montajeFromTracks para music.duck).
        if (patch.duck != null && t.id === 'musica') next.meta = patch.duck ? 'con ducking' : 'sin ducking';
        return next;
      }),
    })));
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
        onBack={onBackSafe}
        pieceName={pieceName}
        aspect={aspect}
        durationLabel={durationLabel}
        dirty={dirty}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        canEdit={canEdit}
        canSave={dirty && !!onSaveMontaje}
        canAutoArmar={!!comercial?.storyboard?.length}
        onUndo={onUndo}
        onRedo={onRedo}
        onSplit={onSplit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onSave={onSave}
        onAutoArmar={onAutoArmar}
        previewFocus={previewFocus}
        onTogglePreviewFocus={() => setPreviewFocus((v) => !v)}
        onPublish={onPublishSaving}
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
          onMediaChange={onMediaChange}
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
        onDropItem={onDropItem}
      />
    </div>
  );
}
