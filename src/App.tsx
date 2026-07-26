import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceStudio from './VoiceStudio';
import Wizard from './Wizard';
import ProjectWizard from './ProjectWizard';
import VideosTab from './VideosTab';
import AudioWorkspace from './AudioWorkspace';
import FormatsCatalog from './FormatsCatalog';
import Pipeline from './Pipeline';
import Editor from './Editor';
import Rail from './Rail';
import Home from './Home';
import Integrar from './Integrar';
import { saveProject, type Project, type VoiceConfig } from './lib/projects';
import { avanzarEstado, type Comercial } from './lib/comercial';
import type { MontajePlan, MontajeState } from './lib/montajePlan';
import { useProjects } from './lib/useProjects';
import type { Route } from './lib/routes';
import { API_BASE } from './config';
import './App.css';

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = params.get('embed') === '1';

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  // audio generado por reel (objectURL del mp3): sólo se escribe (cache de sesión para VoiceStudio/
  // persistVoice); ningún consumidor lee el mapa completo hoy (el editor multipista que lo hacía —
  // ReelTab — quedó fuera del workspace nuevo, ver docs/rediseno/HANDOFF.md §9/§11 ítem 9).
  const [, setAudioByReel] = useState<Record<string, string>>({});
  // router del shell nuevo (rail + columna). 'project'/'wizard'/'editor' son contextuales
  // (se llega desde otra vista, no tienen ítem propio en el rail — docs/rediseno/HANDOFF.md §2).
  const [route, setRoute] = useState<Route>('home');
  const [wizardProject, setWizardProject] = useState<Project | null>(null);   // proyecto recién creado, en el wizard
  const [wizardFormatoId, setWizardFormatoId] = useState<string | undefined>(undefined);   // WO-1: formato preseleccionado (desde el catálogo) — estado de navegación

  const { projects } = useProjects();   // server-first: estado inicial de localStorage + hidratación del server

  // App es el DUEÑO ÚNICO del proyecto activo en memoria y el único que lo persiste (localStorage + server).
  // `projectRef` espeja el proyecto para el guardado con retraso (que corre fuera del render). Antes el Pipeline
  // y App guardaban por su cuenta con copias distintas y se pisaban (perdías el comercial al grabar la voz).
  const projectRef = useRef<Project | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // persiste YA un proyecto (cancela el timer) y refresca ref + estado con el `updated_at` que genera saveProject.
  const persistNow = (proj: Project) => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    const saved = saveProject({ id: proj.id, name: proj.name, type: proj.type, preloaded: proj.preloaded, reels: proj.reels });
    projectRef.current = saved;
    setActiveProject(saved);
  };
  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { if (projectRef.current) persistNow(projectRef.current); }, 500);
  };
  // flush de lo pendiente antes de navegar (cambiar de sección/proyecto/home) — no perder un guardado en vuelo.
  const flushPending = () => { if (saveTimer.current && projectRef.current) persistNow(projectRef.current); };

  // EL ÚNICO mutador del proyecto: aplica el cambio en memoria (UI instantánea) y agenda o flushea el guardado.
  // Todas las pantallas (pipeline, voz) pasan por acá → imposible que una pise a otra con una copia vieja.
  const updateProject = (updater: (p: Project) => Project, mode: 'debounced' | 'flush' = 'debounced') => {
    const prev = projectRef.current;
    if (!prev) return;
    const next = updater(prev);
    projectRef.current = next;      // sincrónico: fuente para escrituras seguidas (tipear rápido)
    setActiveProject(next);         // UI instantánea
    if (mode === 'flush') persistNow(next); else scheduleSave();
  };

  // "Grabar" desde el editor: persiste el settings de voz del reel (inmediato, es una acción puntual).
  const grabarReel = (reelId: string, vc: VoiceConfig) => {
    updateProject((prev) => ({ ...prev, reels: prev.reels.map((r) => (r.id === reelId ? { ...r, voiceConfig: vc } : r)) }), 'flush');
  };

  // WO-4: el editor guarda su MontajePlan invertido. App (dueño único) lo escribe en el comercial del
  // primer reel (el que el editor edita) + avanza el estado 'montaje'→'editado'. Preserva los exports
  // previos (renders ya hechos). Flush inmediato: es una acción puntual del usuario (botón Guardar).
  const saveMontaje = (plan: MontajePlan) => {
    updateProject((prev) => ({
      ...prev,
      reels: prev.reels.map((r, i) => {
        if (i !== 0 || !r.comercial) return r;
        const prevState = r.comercial.montaje as MontajeState | undefined;
        const montaje: MontajeState = { plan, exports: prevState?.exports ?? [] };
        const c: Comercial = avanzarEstado({ ...r.comercial, montaje }, 'montaje', 'editado');
        return { ...r, comercial: c };
      }),
    }), 'flush');
  };
  // VoiceStudio avisa cuando generó el mp3 → lo guardamos por reel (revoca el viejo) y lo persistimos.
  const onAudio = (reelId: string, blob: Blob) => {
    setAudioByReel((m) => { if (m[reelId]) URL.revokeObjectURL(m[reelId]); return { ...m, [reelId]: URL.createObjectURL(blob) }; });
    void persistVoice(reelId, blob);
  };
  // Sube el mp3 de la voz al server (asset del proyecto) y guarda su fileRef en el reel (voiceConfig.audioRef)
  // — sobrevive F5 y lo usa el render del comercial. Aplica sobre el proyecto DUEÑO, nunca una copia vieja.
  const persistVoice = async (reelId: string, blob: Blob) => {
    const proj = projectRef.current;
    if (!proj) return;
    try {
      const fd = new FormData();
      fd.append('file', new File([blob], `voz-${reelId}.mp3`, { type: blob.type || 'audio/mpeg' }));
      const r = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(proj.id)}/assets`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok || !d.asset?.fileRef) return;
      updateProject((prev) => {
        if (prev.id !== proj.id) return prev;
        return { ...prev, reels: prev.reels.map((rl) => {
          if (rl.id !== reelId) return rl;
          const base: VoiceConfig = rl.voiceConfig ?? { voice_id: '', stability: 0.4, similarity: 0.8, style: 0.5, speed: 1.0, model: 'eleven_v3' };
          return { ...rl, voiceConfig: { ...base, audioRef: d.asset.fileRef as string } };
        }) };
      }, 'flush');
    } catch { /* server opcional */ }
  };

  // abrir/cambiar de proyecto: flush lo pendiente del anterior, hacé del nuevo el proyecto dueño y navegá a su workspace.
  const openProject = (p: Project) => { flushPending(); projectRef.current = p; setActiveProject(p); setRoute('project'); };

  // guiones del proyecto ABIERTO → VoiceStudio (memoizado: estable mientras no cambie el proyecto).
  // La ruta global 'audio' del rail (Fase 1) queda project-aware CUANDO hay un proyecto abierto —
  // preserva la grabación de voz por reel (grabarReel/onAudio, dueño único en App) que antes vivía
  // en la tab "Audio" de la Topbar vieja. Sin proyecto abierto, el estudio queda agnóstico (bare).
  const voiceFiles = useMemo(
    () => (activeProject ? activeProject.reels.map((r) => ({ id: r.id, label: r.nombre, text: r.guion.join('\n'), sub: `${r.guion.length} frases` })) : undefined),
    [activeProject],
  );

  // nav global del rail: flushea lo pendiente; "Inicio" además cierra el proyecto activo (como
  // hacía el botón Home de la Topbar vieja) — las demás rutas no lo tocan (podés volver a él).
  const goRoute = (r: Route) => {
    flushPending();
    if (r === 'home') { projectRef.current = null; setActiveProject(null); }
    setRoute(r);
  };

  // Al abrir/cambiar de proyecto, rehidrata el cache de audio de sesión (audioByReel) desde la voz
  // persistida de cada reel (voiceConfig.audioRef → /api/storage/<ref> → objectURL). Fija el bug del
  // mp3 que moría como objectURL en F5: el editor y el preview recuperan la voz grabada.
  useEffect(() => {
    if (!activeProject) return;
    let cancelled = false;
    (async () => {
      for (const r of activeProject.reels) {
        const ref = r.voiceConfig?.audioRef;
        if (!ref) continue;
        try {
          const res = await fetch(`${API_BASE}/api/storage/${ref}`);
          if (!res.ok || cancelled) continue;
          const blob = await res.blob();
          if (cancelled) return;
          setAudioByReel((m) => (m[r.id] ? m : { ...m, [r.id]: URL.createObjectURL(blob) }));
        } catch { /* server opcional */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  // Modo embed (otra app por iframe): solo el estudio de audio, sin chrome. Va DESPUÉS de los hooks
  // (jamás un early-return antes de los useState: cambiaría el orden de hooks → React #310).
  if (embed) {
    return (
      <div className="ms-embed">
        <div className="ms-embed-inner"><VoiceStudio /></div>
      </div>
    );
  }

  return (
    <div className="ms-shell">
      <Rail route={route} onNavigate={goRoute} />
      <div className="ms-maincol">
        {route === 'project' && activeProject ? (
          <Pipeline key={activeProject.id} project={activeProject} onChange={updateProject} onFlush={flushPending} onHome={() => goRoute('home')} onGoEditor={() => goRoute('editor')} />
        ) : route === 'wizard' ? (
          <div className="ms-page">
            {wizardProject ? (
              <ProjectWizard
                project={wizardProject}
                onDone={(p) => { setWizardProject(null); openProject(p); }}
                onCancel={() => { setWizardProject(null); goRoute('home'); }}
              />
            ) : (
              <Wizard onCancel={() => goRoute('home')} onComenzar={(p) => setWizardProject(p)} formatoIdInicial={wizardFormatoId} />
            )}
          </div>
        ) : route === 'ksp' ? (
          <div className="ms-page">
            <Integrar onHome={() => goRoute('home')} onComenzar={(p) => { setWizardProject(p); setRoute('wizard'); }} />
          </div>
        ) : route === 'videos' ? (
          <div className="ms-workspace"><VideosTab onGoEditor={() => goRoute('editor')} /></div>
        ) : route === 'audio' ? (
          <div className="ms-workspace">
            <AudioWorkspace
              key={activeProject?.id}
              project={activeProject}
              reelConfig={activeProject ? Object.fromEntries(activeProject.reels.map((r) => [r.id, { slidesRef: r.slidesRef, voiceConfig: r.voiceConfig }])) : undefined}
              files={voiceFiles}
              onGrabar={activeProject ? grabarReel : undefined}
              onAudio={activeProject ? onAudio : undefined}
              onGoEditor={() => goRoute('editor')}
            />
          </div>
        ) : route === 'formats' ? (
          <div className="ms-page"><FormatsCatalog onUsar={(fid) => { setWizardProject(null); setWizardFormatoId(fid); setRoute('wizard'); }} /></div>
        ) : route === 'editor' ? (
          <Editor project={activeProject} onBack={() => goRoute('project')} onPublish={() => goRoute('project')} onSaveMontaje={saveMontaje} />
        ) : (
          <div className="ms-page">
            <Home
              projects={projects}
              onOpenProject={openProject}
              onNewPiece={() => { setWizardFormatoId(undefined); goRoute('wizard'); }}
              onGoIntegrations={() => goRoute('ksp')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
