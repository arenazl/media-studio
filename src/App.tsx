import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceStudio from './VoiceStudio';
import KbInspector from './KbInspector';
import ProjectWizard from './ProjectWizard';
import ProjectInfo from './ProjectInfo';
import { Sparkles } from 'lucide-react';
import VideosTab from './VideosTab';
import ReelTab from './ReelTab';
import Pipeline from './Pipeline';
import Topbar from './Topbar';
import ProjectsABM from './ProjectsABM';
import { saveProject, type Project, type VoiceConfig } from './lib/projects';
import { useProjects } from './lib/useProjects';
import { defaultSection, type Section } from './lib/sections';
import { API_BASE } from './config';
import './App.css';

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = params.get('embed') === '1';

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [section, setSection] = useState<Section>('editor');
  // audio generado por reel (objectURL del mp3) — se comparte entre solapas.
  const [audioByReel, setAudioByReel] = useState<Record<string, string>>({});
  const [inspect, setInspect] = useState(false);   // visor de los KB de las Integraciones (+ Comenzar)
  const [wizardProject, setWizardProject] = useState<Project | null>(null);   // proyecto recién creado, en el wizard

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

  // abrir/cambiar de proyecto: flush lo pendiente del anterior y hacé del nuevo el proyecto dueño.
  const openProject = (p: Project) => { flushPending(); projectRef.current = p; setActiveProject(p); setSection(defaultSection(p)); };

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
      <Topbar
        projects={projects}
        activeProject={activeProject}
        section={section}
        onPickProject={openProject}
        onHome={() => { flushPending(); projectRef.current = null; setActiveProject(null); }}
        onSection={(s) => { flushPending(); setSection(s); }}
      />
      <main className="ms-main">
        {activeProject ? (
          <SectionView section={section} project={activeProject} onChange={updateProject} onGrabar={grabarReel} onAudio={onAudio} audioByReel={audioByReel} />
        ) : wizardProject ? (
          <ProjectWizard
            project={wizardProject}
            onDone={(p) => { setWizardProject(null); openProject(p); setSection('pipeline'); }}
            onCancel={() => setWizardProject(null)}
          />
        ) : inspect ? (
          <KbInspector onClose={() => setInspect(false)} onComenzar={(p) => { setInspect(false); setWizardProject(p); }} />
        ) : (
          <div className="ms-home">
            <div className="ms-home-bar">
              <button className="ms-kb-cta" onClick={() => setInspect(true)}><Sparkles size={15} /> Nuevo proyecto desde una Integración</button>
            </div>
            <ProjectsABM onOpen={openProject} />
          </div>
        )}
      </main>
    </div>
  );
}

function SectionView({ section, project, onChange, onGrabar, onAudio, audioByReel }: { section: Section; project: Project; onChange: (updater: (p: Project) => Project, mode?: 'debounced' | 'flush') => void; onGrabar: (reelId: string, vc: VoiceConfig) => void; onAudio: (reelId: string, blob: Blob) => void; audioByReel: Record<string, string> }) {
  // guiones del proyecto → VoiceStudio (memoizado: estable mientras no cambie el proyecto).
  const voiceFiles = useMemo(
    () => project.reels.map((r) => ({ id: r.id, label: r.nombre, text: r.guion.join('\n'), sub: `${r.guion.length} frases` })),
    [project],
  );
  // key={project.id} en los que cachean estado derivado del proyecto en useState (Pipeline: el
  // comercial/paso activo; ReelTab/ReelEditor: el reel activo): fuerza remount al cambiar de proyecto
  // por la Topbar y evita quedar viendo el proyecto anterior (estado stale).
  if (section === 'pipeline') return <Pipeline key={project.id} project={project} onChange={onChange} />;
  if (section === 'negocio') return <ProjectInfo project={project} />;
  if (section === 'audio') return (
    <VoiceStudio
      key={project.id}
      reelConfig={Object.fromEntries(project.reels.map((r) => [r.id, { slidesRef: r.slidesRef, voiceConfig: r.voiceConfig }]))}
      files={voiceFiles}
      onGrabar={onGrabar}
      onAudio={onAudio}
    />
  );
  if (section === 'videos') return <VideosTab />;
  return <ReelTab key={project.id} project={project} audioByReel={audioByReel} />;   // 'editor' (integrador, default)
}
