import { useState } from 'react';
import VoiceStudio from './VoiceStudio';
import VideosTab from './VideosTab';
import StageTab from './StageTab';
import Sidebar, { type Section } from './Sidebar';
import ProjectsABM from './ProjectsABM';
import type { Project } from './lib/projects';
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
          <ProjectsABM onOpen={(p) => { setActiveProject(p); setSection('audio'); }} />
        ) : (
          <SectionView section={section} projectName={activeProject.name} />
        )}
      </main>
    </div>
  );
}

function SectionView({ section, projectName }: { section: Section; projectName: string }) {
  if (section === 'audio') return <VoiceStudio />;
  if (section === 'videos') return <VideosTab />;
  if (section === 'reel') return (
    <StageTab title={`REEL — ${projectName} · slides 1080×1920`} color="var(--amber)"
      description="Pegá el prompt + el MD de contexto del reel. Lo genero como recorrido/mockups y lo combino con el audio de la sección Audio."
      placeholder="Ej: Reel 9:16. Tour de la app, 6 escenas, estética dark + naranja. (pegá tu MD de contexto / guion)"
      hint={<>Se une con el <b>audio</b> de la sección Audio. El reel queda en los assets del proyecto.</>} />
  );
  if (section === 'montaje') return (
    <StageTab title={`MONTAJE — ${projectName}`} color="var(--violet)"
      description="Decime cómo mechar los slides del reel con los videos de la biblioteca. Armo el corte y te muestro ~10 frames para que elijas."
      placeholder="Ej: arrancá con el slide 1, meté bache.mp4 en el segundo 3, volvé a slides en el 6, cerrá con cuadrilla.mp4…"
      hint={<>Los videos salen de la <b>biblioteca</b> (sección Videos). Te devuelvo frames para revisar.</>} />
  );
  return (
    <StageTab title={`EXPORT — ${projectName}`} color="var(--green)"
      description="Unifico todo (slides + audios + videos) en el reel final. Decime el corte definitivo y los niveles."
      placeholder="Ej: unificá todo, música Funk al 70% con ducking, voz Lucía, salida 1080×1920 mp4 a 30fps."
      hint={<>El mp4 final queda en los assets del proyecto.</>} />
  );
}
