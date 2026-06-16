// Sidebar colapsable: Proyectos (home) + secciones del proyecto activo + reels
// base (menú colapsable). Las secciones visibles se filtran según project.contentType
// (configurado por el wizard de creación). Estilos en Sidebar.css.
import { useState } from 'react';
import { Mic, Film, Video, Layers, Download, FolderKanban, ChevronLeft, ChevronRight, ChevronDown, AudioLines, Boxes } from 'lucide-react';
import type { Project, ProjectReel } from './lib/projects';
import type { ContentType } from './NewProjectWizard';
import './Sidebar.css';

export type Section = 'audio' | 'reel' | 'videos' | 'montaje' | 'export';

const ALL_SECTIONS: { id: Section; label: string; Icon: typeof Mic }[] = [
  { id: 'audio',   label: 'Audio',   Icon: Mic },
  { id: 'reel',    label: 'Reel',    Icon: Film },
  { id: 'videos',  label: 'Videos',  Icon: Video },
  { id: 'montaje', label: 'Montaje', Icon: Layers },
  { id: 'export',  label: 'Export',  Icon: Download },
];

const LAYOUT: Record<ContentType, Section[]> = {
  reels:     ['audio', 'reel', 'montaje', 'export'],
  video:     ['videos', 'montaje', 'export'],
  audio:     ['audio'],
  combinado: ['audio', 'reel', 'videos', 'montaje', 'export'],
};

export function sectionsFor(p: Project | null) {
  if (!p?.contentType) return ALL_SECTIONS;
  const ids = LAYOUT[p.contentType];
  return ALL_SECTIONS.filter((s) => ids.includes(s.id));
}

export function defaultSection(p: Project | null): Section {
  return sectionsFor(p)[0]?.id ?? 'audio';
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activeProject: Project | null;
  section: Section;
  kitsActive?: boolean;
  onHome: () => void;
  onKits?: () => void;
  onSection: (s: Section) => void;
  onOpenReel?: (r: ProjectReel) => void;
}

export default function Sidebar({ collapsed, onToggle, activeProject, section, kitsActive, onHome, onKits, onSection, onOpenReel }: Props) {
  const [reelsOpen, setReelsOpen] = useState(true);
  const sections = sectionsFor(activeProject);

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
        <button className={!activeProject && !kitsActive ? 'ms-side-link ms-side-link--on' : 'ms-side-link'} onClick={onHome} title="Proyectos">
          <FolderKanban size={16} />{!collapsed && <span>Proyectos</span>}
        </button>
        <button className={kitsActive ? 'ms-side-link ms-side-link--on' : 'ms-side-link'} onClick={onKits} title="Kits de voz">
          <Boxes size={16} />{!collapsed && <span>Kits</span>}
        </button>

        {activeProject && !kitsActive && (
          <>
            {!collapsed && <div className="ms-side-project" title={activeProject.name}>{activeProject.name}</div>}
            {sections.map((s) => (
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
