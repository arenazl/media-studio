// ABM de PROYECTOS — primera pantalla (multi-tenant). Grilla + crear/editar
// (panel lateral) + borrar (confirm). Header al patrón ABM: input full-width,
// botón "Nuevo" dockeado a la derecha. Estilos en ProjectsABM.css (tokens).
import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, FolderKanban, Film, X } from 'lucide-react';
import { listProjects, saveProject, deleteProject, munifyBaseReels, type Project } from './lib/projects';
import './ProjectsABM.css';

interface Props { onOpen: (p: Project) => void }

export default function ProjectsABM({ onOpen }: Props) {
  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Project | null>(null);   // proyecto en edición (o nuevo)
  const [isNew, setIsNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Project | null>(null);

  const refresh = () => setProjects(listProjects());
  const fil = projects.filter((p) => `${p.name} ${p.type}`.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setIsNew(true); setEditing({ id: '', name: '', type: '', reels: [], created_at: 0, updated_at: 0 }); };
  const openEdit = (p: Project) => { setIsNew(false); setEditing(p); };

  return (
    <div className="abm">
      <div className="abm-header">
        <span className="abm-title"><FolderKanban size={18} /> Proyectos</span>
        <div className="abm-search">
          <Search size={14} className="abm-search-icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto…" className="abm-search-input" />
        </div>
        <button className="abm-new" onClick={openNew}><Plus size={15} /> Nuevo</button>
      </div>

      <div className="abm-grid">
        {fil.map((p) => (
          <div key={p.id} className="abm-card" role="button" tabIndex={0} onClick={() => onOpen(p)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(p); } }}>
            <div className="abm-card-top">
              <span className="abm-card-name">{p.name}</span>
              {p.preloaded && <span className="abm-badge">precargado</span>}
            </div>
            <div className="abm-card-type">{p.type || '—'}</div>
            <div className="abm-card-foot">
              <span className="abm-card-meta"><Film size={12} /> {p.reels.length} reels</span>
              <span className="abm-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="abm-icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Pencil size={13} /></button>
                <button className="abm-icon-btn abm-icon-btn--danger" title="Eliminar" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }}><Trash2 size={13} /></button>
              </span>
            </div>
          </div>
        ))}
        {!fil.length && <div className="abm-empty">No hay proyectos. Creá uno con «Nuevo».</div>}
      </div>

      {editing && (
        <ProjectSheet
          project={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={() => { refresh(); setEditing(null); }}
        />
      )}

      {confirmDel && (
        <div className="abm-overlay" onClick={() => setConfirmDel(null)}>
          <div className="abm-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="abm-confirm-title">Eliminar «{confirmDel.name}»</div>
            <p className="abm-confirm-text">Se borra el proyecto y su configuración local. Esta acción no se puede deshacer.</p>
            <div className="abm-confirm-actions">
              <button className="abm-btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="abm-btn-danger" onClick={() => { deleteProject(confirmDel.id); refresh(); setConfirmDel(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectSheet({ project, isNew, onClose, onSaved }: { project: Project; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(project.name);
  const [type, setType] = useState(project.type);
  const [withBase, setWithBase] = useState(project.preloaded ?? false);

  const save = () => {
    if (!name.trim()) return;
    const reels = withBase ? munifyBaseReels() : project.reels;
    saveProject({ id: project.id || undefined, name, type, preloaded: withBase, reels });
    onSaved();
  };

  return (
    <div className="abm-overlay" onClick={onClose}>
      <div className="abm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="abm-sheet-head">
          <span className="abm-sheet-title">{isNew ? 'Nuevo proyecto' : 'Editar proyecto'}</span>
          <button className="abm-icon-btn" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="abm-sheet-body">
          <label className="abm-field">
            <span className="abm-label">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Munify" className="abm-input" autoFocus />
          </label>
          <label className="abm-field">
            <span className="abm-label">Tipo / rubro</span>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ej. Municipal (SaaS)" className="abm-input" />
          </label>
          <label className="abm-check">
            <input type="checkbox" checked={withBase} onChange={(e) => setWithBase(e.target.checked)} className="abm-check-box" />
            <span>Arrancar con los <b>reels base de Munify</b> ({munifyBaseReels().length})</span>
          </label>
          <p className="abm-hint">Si lo activás, el proyecto arranca con los guiones/slides ya hechos para seguir editándolos. Si no, arranca de cero.</p>
        </div>
        <div className="abm-sheet-foot">
          <button className="abm-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="abm-btn-primary" onClick={save} disabled={!name.trim()}>{isNew ? 'Crear proyecto' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
