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
  type EditorTrack, type EditorClip, type TransitionKind, type TrackId,
} from './lib/editorTracks';
import { tracksToMontaje } from './lib/montajeFromTracks';
import { armarMontaje } from './lib/armarMontaje';
import { componerMusica, moodDe, musicaDelPlan } from './lib/musicaGenerada';
import { totalDuration } from './lib/montajePlan';
import type { MezclaPista, MontajePlan, MontajeState } from './lib/montajePlan';
import type { PlayerRef } from '@remotion/player';
import {
  deleteClip, duplicateClip, splitClip, canSplit, dropLibItem, initHistory, pushHistory, undoHistory, redoHistory,
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
import type { AccionClip } from './EditorClipMenu';
import './Editor.css';

export interface EditorProps {
  project: Project | null;
  onBack: () => void;
  onPublish: () => void;
  // WO-4: App lo cablea a updateProject (dueño único). El editor le pasa el MontajePlan invertido del
  // draft; App escribe comercial.montaje.plan + avanza el estado 'montaje'→'editado'.
  // automatico: el armado que hace el editor al entrar — se guarda sin marcar el paso como editado a mano.
  onSaveMontaje?: (plan: MontajePlan, opts?: { automatico?: boolean }) => void;
}

// alto de la timeline COLAPSADA (sólo la barra de herramientas visible) — igual al prototipo
// (edTlH cae a 40px cuando !edTlOpen, en vez de seguir reservando el alto arrastrable completo).
const TL_COLLAPSED_H = 40;
const FADE_SEC = 0.5;   // largo del fade que pone el menú del clip (como mucho un tercio del clip)

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
  // Sin una PIEZA abierta (entrada por Videos/Audio, o un proyecto cuyo reel no tiene comercial) no hay
  // dónde guardar: App.saveMontaje saltea los reels sin comercial, pero el editor reseteaba `dirty`
  // igual y el chip pasaba a "Guardado" sin haber persistido NADA. Guardar/Publicar quedan cerrados.
  const puedeGuardar = !!comercial && !!onSaveMontaje;

  // seed: se calcula UNA sola vez al montar (el editor entero remonta al cambiar de ruta — App.tsx
  // no lo mantiene vivo en background — así que no hace falta re-derivar en un efecto).
  const [history, setHistory] = useState<EditHistory<EditorTrack[]>>(() => initHistory(buildEditorTimeline(comercial).tracks));
  const [dims] = useState(() => { const t = buildEditorTimeline(comercial); return { width: t.width, height: t.height }; });
  const [contentDirty, setContentDirty] = useState(false);
  // plan base para invertir el draft (WO-4): el plan de origen del editor (persistido o derivado del
  // storyboard). Se fija al montar; aporta lo que el draft no modela (dims/logo/gain/duck). Fallback
  // con las dims que ya resolvió buildEditorTimeline (evita reinventar el default acá).
  const [basePlan, setBasePlan] = useState<MontajePlan>(() => {
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

  // el plan que sale del draft (lo mismo que se guardaría): la vista previa lo reproduce con el motor del render, y su
  // Player es el reloj mientras suena (onTime mueve el cabezal). Sin escenas con clip no hay nada que reproducir.
  const previewPlan = useMemo(() => tracksToMontaje(draftTracks, basePlan), [draftTracks, basePlan]);
  // play/pausa: se le pide al Player con el evento del click (si el play sale de un efecto, Chrome puede no dejar sonar
  // el audio); `playing` lo actualizan los eventos del Player. Sin Player montado (nada armado) no hay qué reproducir.
  const playerApi = useRef<PlayerRef | null>(null);
  const togglePlay = (e?: React.SyntheticEvent) => { playerApi.current?.toggle(e); };

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

  // auto-armar la timeline con el MISMO armado que el paso Montaje (lib/armarMontaje.ts: montajista, mockups, placa).
  // Antes usaba autoArmarPlan (sólo el storyboard) y el mismo botón daba otro comercial. Entra al historial: deshacible.
  const [autoArmando, setAutoArmando] = useState(false);
  const pistasDe = (plan: MontajePlan) => {
    // reusa buildEditorTimeline pasándole un comercial con el plan armado como montaje persistido.
    const comercialConPlan = { ...comercial!, montaje: { plan, exports: (comercial!.montaje as MontajeState | undefined)?.exports ?? [] } };
    return buildEditorTimeline(comercialConPlan).tracks;
  };
  const onAutoArmar = async () => {
    if (!comercial || !project || autoArmando) return;
    setAutoArmando(true);
    try {
      const plan = await armarMontaje(project, comercial);
      setBasePlan(plan);   // la placa, el estilo y los avisos del armado nuevo son la base de lo que se guarde
      mutate(() => pistasDe(plan));
      setPlayheadSec(0);
    } finally { setAutoArmando(false); }
  };

  // otra música compuesta a medida (Lucas, 2026-10-12: "lo más importante es la música"): reemplaza la de la pista
  // Música con una nueva del mismo clima y que dura lo que el video. Entra al historial: deshacible.
  const [componiendo, setComponiendo] = useState(false);
  const onOtraMusica = async () => {
    if (!comercial || componiendo) return;
    setComponiendo(true);
    try {
      const plan = tracksToMontaje(draftTracks, basePlan);
      const m = await componerMusica(moodDe(comercial), Math.ceil(totalDuration(plan) + 5), comercial.titulo);
      const music = musicaDelPlan(m, plan.music);
      setBasePlan((b) => ({ ...b, music }));
      mutate(() => pistasDe({ ...plan, music }));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'No se pudo componer la música');
    } finally { setComponiendo(false); }
  };

  // AL ENTRAR (Lucas, 2026-10-11: "el auto-armar debería llamarse al entrar a la pantalla para tener algo para
  // arrancar"): si el montaje todavía es el automático (no se guardó a mano ni se exportó), se rearma con el armado
  // vigente y se guarda como automático. Lo que Lucas ya editó o aprobó no se toca: para eso está el botón.
  const autoAlEntrar = useRef(false);
  useEffect(() => {
    if (autoAlEntrar.current || !comercial || !project || !onSaveMontaje || !comercial.storyboard?.length) return;
    const estado = comercial.estados?.montaje;
    if (estado === 'editado' || estado === 'aprobado') return;
    const hayMaterial = comercial.tipo === 'animado' ? !!comercial.renderRef : !!(comercial.rodaje || []).length;
    if (!hayMaterial) return;
    autoAlEntrar.current = true;
    setAutoArmando(true);
    armarMontaje(project, comercial)
      .then((plan) => {
        setBasePlan(plan);
        setHistory(initHistory(pistasDe(plan)));   // es el punto de partida, no un cambio para deshacer
        setContentDirty(false);
        setPlayheadSec(0);
        onSaveMontaje(plan, { automatico: true });
      })
      .catch(() => { /* sin armado nuevo queda el plan que había */ })
      .finally(() => setAutoArmando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // la transición vive en el clip de escena, esté en Video o en Mockups (escena que es un mockup)
  const onTransitionTypeChange = (clipId: string, kind: TransitionKind) => {
    mutate((tracks) => tracks.map((t) => ({ ...t, clips: t.clips.map((c) => (c.id === clipId ? { ...c, transitionAfter: kind } : c)) })));
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
  const currentVideoClip = clipAt(videoTrack, playheadSec) || clipAt(draftTracks.find((t) => t.id === 'pantallas'), playheadSec);
  const activeTexts = clipsAt(textoTrack, playheadSec);
  const overlappingFx = useMemo(() => {
    if (selection.kind !== 'clip' || !selection.clip || !fxTrack) return [];
    const { startSec, durSec } = selection.clip;
    return fxTrack.clips.filter((f) => f.startSec < startSec + durSec && f.startSec + f.durSec > startSec);
  }, [selection.kind, selection.clip, fxTrack]);

  // las escenas de la secuencia: lo filmado (Video) y las escenas-mockup (Mockups), en orden de tiempo
  const escenaClips = useMemo(() => [
    ...(videoTrack?.clips || []),
    ...(draftTracks.find((t) => t.id === 'pantallas')?.clips.filter((c) => c.esEscena) || []),
  ].sort((a, b) => a.startSec - b.startSec), [videoTrack, draftTracks]);
  const onStepScene = (dir: 1 | -1) => {
    if (escenaClips.length === 0) return;
    const idx = escenaClips.findIndex((c) => playheadSec >= c.startSec && playheadSec < c.startSec + c.durSec);
    const cur = idx === -1 ? (dir === 1 ? -1 : escenaClips.length) : idx;
    const nextIdx = Math.min(escenaClips.length - 1, Math.max(0, cur + dir));
    const target = escenaClips[nextIdx];
    if (target) setPlayheadSec(target.startSec);
  };

  // menú del clic derecho sobre un clip: fades, audio del clip, transición, partir, duplicar, eliminar (todo deshacible)
  const onClipAction = (clipId: string, a: AccionClip) => {
    if (a.tipo === 'partir') { mutate((t) => splitClip(t, clipId, playheadSec)); return; }
    if (a.tipo === 'duplicar') { mutate((t) => duplicateClip(t, clipId)); return; }
    if (a.tipo === 'eliminar') { mutate((t) => deleteClip(t, clipId)); setSelectedId(null); return; }
    if (a.tipo === 'irInicio') { const f = findClip(draftTracks, clipId); if (f) setPlayheadSec(f.clip.startSec); return; }
    mutate((tracks) => tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const fade = Math.min(FADE_SEC, c.durSec / 3);
        if (a.tipo === 'fadeIn') return { ...c, fadeIn: c.fadeIn ? undefined : fade };
        if (a.tipo === 'fadeOut') return { ...c, fadeOut: c.fadeOut ? undefined : fade };
        if (a.tipo === 'sinFades') return { ...c, fadeIn: undefined, fadeOut: undefined };
        if (a.tipo === 'audio') return { ...c, audio: c.audio === 'mute' ? 'keep' : 'mute' };
        if (a.tipo === 'transicion') return { ...c, transitionAfter: a.kind };
        return c;
      }),
    })));
  };

  // mezcla de la cabecera de una pista (volumen/solo/mute): se oye al instante en la vista previa y se guarda con el
  // plan (el render la respeta). Como el slider de volumen de un clip, no apila un deshacer por cada movimiento.
  const onMixChange = (trackId: TrackId, mix: MezclaPista) => {
    replacePresent((tracks) => tracks.map((t) => (t.id === trackId ? { ...t, mix } : t)));
  };

  const handleTrimLeft = (clipId: string, newStartSec: number, newDurSec: number) => {
    mutate((tracks) =>
      tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId ? { ...c, startSec: newStartSec, durSec: newDurSec, srcIn: (c.srcIn || 0) + (newStartSec - c.startSec) } : c
        ),
      }))
    );
  };

  const handleTrimRight = (clipId: string, newDurSec: number) => {
    mutate((tracks) =>
      tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, durSec: newDurSec } : c)),
      }))
    );
  };

  const handleMoveClip = (clipId: string, newStartSec: number) => {
    mutate((tracks) =>
      tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, startSec: newStartSec } : c)),
      }))
    );
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

  const handleColorChange = (clipId: string, color: string) => {
    mutate((tracks) =>
      tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, color } : c)),
      }))
    );
  };

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
        canSave={dirty && puedeGuardar}
        canPublish={puedeGuardar}
        guardable={puedeGuardar}
        saveHint={puedeGuardar ? undefined : 'Abrí una pieza para guardar'}
        canAutoArmar={!!comercial?.storyboard?.length && !autoArmando}
        autoArmando={autoArmando}
        componiendo={componiendo}
        onOtraMusica={comercial ? onOtraMusica : undefined}
        onUndo={onUndo}
        onRedo={onRedo}
        onSplit={onSplit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onSave={onSave}
        onAutoArmar={() => void onAutoArmar()}
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
          onTogglePlay={togglePlay}
          onStepScene={onStepScene}
          playheadSec={playheadSec}
          totalSec={totalSec}
          currentVideoClip={currentVideoClip}
          activeTexts={activeTexts}
          plan={previewPlan}
          onTime={setPlayheadSec}
          playerApi={playerApi}
          onPlayingChange={setPlaying}
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
          onColorChange={handleColorChange}
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
        onTogglePlay={togglePlay}
        selectedId={selectedId}
        onSelect={setSelectedId}
        zoom={zoom}
        onZoomChange={setZoom}
        onDropItem={onDropItem}
        onTrimLeft={handleTrimLeft}
        onTrimRight={handleTrimRight}
        onMoveClip={handleMoveClip}
        onMixChange={onMixChange}
        onClipAction={onClipAction}
        canSplitAt={(id) => canSplit(draftTracks, id, playheadSec)}
      />
    </div>
  );
}
