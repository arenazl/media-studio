import { useState } from 'react';
import VoiceStudio from './VoiceStudio';
import VideosTab from './VideosTab';
import ReelTab from './ReelTab';
import MontajeTab from './MontajeTab';
import StageTab from './StageTab';
import Sidebar, { defaultSection, type Section } from './Sidebar';
import ProjectsABM from './ProjectsABM';
import { saveProject, type Project, type VoiceConfig } from './lib/projects';
import './App.css';

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = params.get('embed') === '1';

  // Modo embed (ej. Munify por iframe): solo el estudio de audio, sin chrome.
  if (embed) {
    return (
      <div className="ms-embed">
        <div className="ms-embed-inner"><VoiceStudio /></div>
      </div>
    );
  }

  const [collapsed, setCollapsed] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [section, setSection] = useState<Section>('audio');

  // "Grabar" desde el editor: persiste el settings de voz del reel y refresca el proyecto.
  const grabarReel = (reelId: string, vc: VoiceConfig) => {
    if (!activeProject) return;
    const reels = activeProject.reels.map((r) => (r.id === reelId ? { ...r, voiceConfig: vc } : r));
    setActiveProject(saveProject({
      id: activeProject.id, name: activeProject.name, type: activeProject.type,
      preloaded: activeProject.preloaded, reels,
    }));
  };

  return (
    <div className="ms-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        activeProject={activeProject}
        section={section}
        onHome={() => setActiveProject(null)}
        onSection={setSection}
        onOpenReel={() => setSection('audio')}
      />

      <main className="ms-main">
        {!activeProject ? (
          <ProjectsABM onOpen={(p) => { setActiveProject(p); setSection(defaultSection(p)); }} />
        ) : (
          <SectionView section={section} project={activeProject} onGrabar={grabarReel} />
        )}
      </main>
    </div>
  );
}

function SectionView({ section, project, onGrabar }: { section: Section; project: Project; onGrabar: (reelId: string, vc: VoiceConfig) => void }) {
  const projectName = project.name;
  if (section === 'audio') return (
    <VoiceStudio
      reelConfig={Object.fromEntries(project.reels.map((r) => [r.id, { slidesRef: r.slidesRef, voiceConfig: r.voiceConfig }]))}
      onGrabar={onGrabar}
    />
  );
  if (section === 'videos') return <VideosTab />;
  if (section === 'reel') return <ReelTab project={project} />;
  if (section === 'montaje') return <MontajeTab project={project} />;
  return (
    <StageTab title={`EXPORT — ${projectName}`} color="var(--green)"
      description="Unifico todo (slides + audios + videos) en el reel final. Decime el corte definitivo y los niveles."
      placeholder="Ej: unificá todo, música Funk al 70% con ducking, voz Lucía, salida 1080×1920 mp4 a 30fps."
      hint={<>El mp4 final queda en los assets del proyecto.</>} />
  );
}
