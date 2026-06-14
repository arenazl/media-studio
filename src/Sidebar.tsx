// Sidebar colapsable: Proyectos (home) + secciones del proyecto activo + reels
// base (menú colapsable). Estilos en Sidebar.css (tokens, cero inline).
import { useState } from 'react';
import { Mic, Film, Video, Layers, Download, FolderKanban, ChevronLeft, ChevronRight, ChevronDown, AudioLines } from 'lucide-react';
import type { Project, ProjectReel } from './lib/projects';
import './Sidebar.css';

export type Section = 'audio' | 'reel' | 'videos' | 'montaje' | 'export';

const SECTIONS: { id: Section; label: string; Icon: typeof Mic }[] = [
  { id: 'audio', label: 'Audio', Icon: Mic },
  { id: 'reel', label: 'Reel', Icon: Film },
  { id: 'videos', label: 'Videos', Icon: Video },
  { id: 'montaje', label: 'Montaje', Icon: Layers },
  { id: 'export', label: 'Export', Icon: Download },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activeProject: Project | null;
  section: Section;
  onHome: () => void;
  onSection: (s: Section) => void;
  onOpenReel?: (r: ProjectReel) => void;
}

export default function Sidebar({ collapsed, onToggle, activeProject, section, onHome, onSection, onOpenReel }: Props) {
  const [reelsOpen, setReelsOpen] = useState(true);

  return (
    <aside className={collapsed ? 'ms-side ms-side--collapsed' : 'ms-side'}>
      <div className="ms-side-top">
        <AudioLines size={22} className="ms-side-mark" />
        {!collapsed && <span className="ms-side-brand">Media Studio</span>}
        <button className="ms-side-toggle" onClick={onToggle} title={collapsed ? 'Expandir' : 'Colapsar'}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="ms-side-nav">
        <button className={!activeProject ? 'ms-side-link ms-side-link--on' : 'ms-side-link'} onClick={onHome} title="Proyectos">
          <FolderKanban size={16} />{!collapsed && <span>Proyectos</span>}
        </button>

        {activeProject && (
          <>
            {!collapsed && <div className="ms-side-project" title={activeProject.name}>{activeProject.name}</div>}
            {SECTIONS.map((s) => (
              <button key={s.id} className={section === s.id ? 'ms-side-link ms-side-link--on' : 'ms-side-link'} onClick={() => onSection(s.id)} title={s.label}>
                <s.Icon size={16} />{!collapsed && <span>{s.label}</span>}
              </button>
            ))}

            {!collapsed && activeProject.reels.length > 0 && (
              <div className="ms-side-reels">
                <button className="ms-side-reels-head" onClick={() => setReelsOpen((o) => !o)}>
                  {reelsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Reels base ({activeProject.reels.length})
                </button>
                {reelsOpen && activeProject.reels.map((r) => (
                  <button key={r.id} className="ms-side-reel" onClick={() => onOpenReel?.(r)} title={`${r.nombre} · ${r.frases} frases`}>
                    {r.nombre}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
