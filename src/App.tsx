import { useMemo, useState } from 'react';
import VoiceStudio from './VoiceStudio';
import KbImport from './KbImport';
import { Sparkles } from 'lucide-react';
import VideosTab from './VideosTab';
import ReelTab from './ReelTab';
import VideoPromptBuilder from './VideoPromptBuilder';
import Topbar from './Topbar';
import ProjectsABM from './ProjectsABM';
import { listProjects, saveProject, type Project, type VoiceConfig } from './lib/projects';
import { defaultSection, type Section } from './lib/sections';
import './App.css';

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = params.get('embed') === '1';

  // Modo embed (otra app por iframe): solo el estudio de audio, sin chrome.
  if (embed) {
    return (
      <div className="ms-embed">
        <div className="ms-embed-inner"><VoiceStudio /></div>
      </div>
    );
  }

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [section, setSection] = useState<Section>('editor');
  // audio generado por reel (objectURL del mp3) — se comparte entre solapas.
  const [audioByReel, setAudioByReel] = useState<Record<string, string>>({});
  const [kbImport, setKbImport] = useState(false);

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
        {!activeProject ? (
          kbImport ? (
            <KbImport onClose={() => setKbImport(false)} onCreated={(p) => { setKbImport(false); openProject(p); }} />
          ) : (
            <div className="ms-home">
              <div className="ms-home-bar">
                <button className="ms-kb-cta" onClick={() => setKbImport(true)}><Sparkles size={15} /> Importar de una Integración</button>
              </div>
              <ProjectsABM onOpen={openProject} />
            </div>
          )
        ) : (
          <SectionView section={section} project={activeProject} onGrabar={grabarReel} onAudio={onAudio} audioByReel={audioByReel} />
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
  if (section === 'audio') return (
    <VoiceStudio
      reelConfig={Object.fromEntries(project.reels.map((r) => [r.id, { slidesRef: r.slidesRef, voiceConfig: r.voiceConfig }]))}
      files={voiceFiles}
      onGrabar={onGrabar}
      onAudio={onAudio}
    />
  );
  if (section === 'videos') return <VideosTab />;
  if (section === 'prompts') return <div className="vids-root"><VideoPromptBuilder /></div>;
  return <ReelTab project={project} audioByReel={audioByReel} />;   // 'editor' (integrador, default)
}
