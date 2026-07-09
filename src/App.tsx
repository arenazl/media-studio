import { useMemo, useState } from 'react';
import VoiceStudio from './VoiceStudio';
import KbInspector from './KbInspector';
import ProjectWizard from './ProjectWizard';
import ProjectInfo from './ProjectInfo';
import { Sparkles } from 'lucide-react';
import VideosTab from './VideosTab';
import ReelTab from './ReelTab';
import GuidedPanel from './GuidedPanel';
import Pipeline from './Pipeline';
import Topbar from './Topbar';
import ProjectsABM from './ProjectsABM';
import { listProjects, saveProject, type Project, type VoiceConfig } from './lib/projects';
import { defaultSection, type Section } from './lib/sections';
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

  const projects = listProjects();   // se relee en cada render → refleja altas/cambios

  // "Grabar" desde el editor: persiste el settings de voz del reel y refresca el proyecto.
  const grabarReel = (reelId: string, vc: VoiceConfig) => {
    if (!activeProject) return;
    const reels = activeProject.reels.map((r) => (r.id === reelId ? { ...r, voiceConfig: vc } : r));
    setActiveProject(saveProject({
      id: activeProject.id, name: activeProject.name, type: activeProject.type,
      preloaded: activeProject.preloaded, reels,
    }));
  };
  // VoiceStudio avisa cuando generó el mp3 → lo guardamos por reel (revoca el viejo).
  const onAudio = (reelId: string, blob: Blob) => {
    setAudioByReel((m) => { if (m[reelId]) URL.revokeObjectURL(m[reelId]); return { ...m, [reelId]: URL.createObjectURL(blob) }; });
  };

  const openProject = (p: Project) => { setActiveProject(p); setSection(defaultSection(p)); };

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
        onHome={() => setActiveProject(null)}
        onSection={setSection}
      />
      <main className="ms-main">
        {activeProject ? (
          <SectionView section={section} project={activeProject} onGrabar={grabarReel} onAudio={onAudio} audioByReel={audioByReel} />
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

function SectionView({ section, project, onGrabar, onAudio, audioByReel }: { section: Section; project: Project; onGrabar: (reelId: string, vc: VoiceConfig) => void; onAudio: (reelId: string, blob: Blob) => void; audioByReel: Record<string, string> }) {
  // guiones del proyecto → VoiceStudio (memoizado: estable mientras no cambie el proyecto).
  const voiceFiles = useMemo(
    () => project.reels.map((r) => ({ id: r.id, label: r.nombre, text: r.guion.join('\n'), sub: `${r.guion.length} frases` })),
    [project],
  );
  if (section === 'pipeline') return <Pipeline project={project} />;
  if (section === 'negocio') return <ProjectInfo project={project} />;
  if (section === 'audio') return (
    <VoiceStudio
      reelConfig={Object.fromEntries(project.reels.map((r) => [r.id, { slidesRef: r.slidesRef, voiceConfig: r.voiceConfig }]))}
      files={voiceFiles}
      onGrabar={onGrabar}
      onAudio={onAudio}
    />
  );
  if (section === 'videos') return <VideosTab />;
  if (section === 'prompts') return <GuidedPanel project={project} />;
  return <ReelTab project={project} audioByReel={audioByReel} />;   // 'editor' (integrador, default)
}
