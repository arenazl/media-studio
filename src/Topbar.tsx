// Barra superior de navegación (reemplaza al sidebar). Densa, pro-tool: logo +
// selector de proyectos (combo) + tabs de secciones en ORDEN DE USO + ajustes.
// Diseño validado con la skill ui-ux-pro-max (dark soft-UI, transiciones 200ms,
// focus visible, cursor-pointer, sin clutter).
import { useEffect, useRef, useState } from 'react';
import { AudioLines, ChevronDown, Settings, FolderKanban, Check, Home } from 'lucide-react';
import { sectionsFor, type Section } from './lib/sections';
import type { Project } from './lib/projects';
import './Topbar.css';

interface Props {
  projects: Project[];
  activeProject: Project | null;
  section: Section;
  onPickProject: (p: Project) => void;
  onHome: () => void;                 // ir al home (grilla de proyectos / crear nuevo)
  onSection: (s: Section) => void;
}

export default function Topbar({ projects, activeProject, section, onPickProject, onHome, onSection }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const sections = sectionsFor(activeProject);

  return (
    <header className="tb">
      <div className="tb-brand"><AudioLines size={19} className="tb-mark" /><span className="tb-brand-name">Media Studio</span></div>

      {/* selector de proyectos */}
      <div className="tb-proj" ref={ref}>
        <button className="tb-proj-btn" onClick={() => setOpen((o) => !o)} title="Cambiar de proyecto">
          <FolderKanban size={14} />
          <span className="tb-proj-name">{activeProject ? activeProject.name : 'Elegí un proyecto'}</span>
          <ChevronDown size={13} className="tb-proj-caret" />
        </button>
        {open && (
          <div className="tb-menu">
            <div className="tb-menu-lbl">Proyectos</div>
            {projects.map((p) => (
              <button key={p.id} className={p.id === activeProject?.id ? 'tb-menu-item tb-menu-item--on' : 'tb-menu-item'} onClick={() => { onPickProject(p); setOpen(false); }}>
                <span className="tb-menu-item-name">{p.name}</span>
                {p.id === activeProject?.id && <Check size={13} />}
              </button>
            ))}
            <div className="tb-menu-sep" />
            <button className="tb-menu-item" onClick={() => { onHome(); setOpen(false); }}><Home size={13} /> Ir a Home · todos / nuevo</button>
          </div>
        )}
      </div>

      {/* tabs de secciones (orden de uso) — solo con proyecto abierto */}
      {activeProject && (
        <nav className="tb-tabs">
          {sections.map((s) => (
            <button key={s.id} className={section === s.id ? 'tb-tab tb-tab--on' : 'tb-tab'} onClick={() => onSection(s.id)}>
              <s.Icon size={15} /> <span>{s.label}</span>
            </button>
          ))}
        </nav>
      )}

      <div className="tb-right">
        <button className="tb-icon-btn" title="Ajustes y tema (próximamente)"><Settings size={16} /></button>
      </div>
    </header>
  );
}
