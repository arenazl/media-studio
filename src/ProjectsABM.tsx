// ABM de PROYECTOS — primera pantalla (multi-tenant). Grilla visual con covers
// por tipo + crear/editar (panel lateral) + borrar (confirm). Estilos en ProjectsABM.css.
import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, FolderKanban, Film, Clock, X, Sparkles } from 'lucide-react';
import { listProjects, saveProject, deleteProject, munifyBaseReels, type Project } from './lib/projects';
import './ProjectsABM.css';

interface Props { onOpen: (p: Project) => void }

// Acento de color por tipo de proyecto (consistente via hash del id como fallback)
const ACCENT_VARS = ['var(--azure)', 'var(--violet)', 'var(--amber)', 'var(--cyan)', 'var(--green)', 'var(--pink)'];
function cardAccent(p: Project): string {
  const t = (p.type || '').toLowerCase();
  if (t.includes('municipal') || t.includes('gobier') || t.includes('saas')) return 'var(--azure)';
  if (t.includes('market') || t.includes('ventas') || t.includes('comercial')) return 'var(--violet)';
  if (t.includes('educa') || t.includes('aprend')) return 'var(--cyan)';
  if (t.includes('salud') || t.includes('clinic')) return 'var(--green)';
  const hash = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACCENT_VARS[hash % ACCENT_VARS.length];
}

const fmtDate = (ms: number) =>
  ms ? new Date(ms).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';

// Cuenta reels que ya tienen voiceConfig guardado
const reelsGrabados = (p: Project) => p.reels.filter((r) => r.voiceConfig?.voice_id).length;

export default function ProjectsABM({ onOpen }: Props) {
  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Project | null>(null);

  const refresh = () => setProjects(listProjects());
  const fil = projects.filter((p) => `${p.name} ${p.type}`.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setIsNew(true); setEditing({ id: '', name: '', type: '', reels: [], created_at: 0, updated_at: 0 }); };
  const openEdit = (p: Project) => { setIsNew(false); setEditing(p); };

  return (
    <div className="abm">
      {/* Hero */}
      <div className="abm-hero">
        <h1 className="abm-hero-title">Proyectos</h1>
        <p className="abm-hero-sub">Seleccioná un proyecto para empezar a editar audio, reels y videos.</p>
      </div>

      {/* Toolbar */}
      <div className="abm-toolbar">
        <div className="abm-search">
          <Search size={13} className="abm-search-icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="abm-search-input" />
        </div>
        <button className="abm-new" onClick={openNew}><Plus size={14} /> Nuevo proyecto</button>
      </div>

      {/* Grid */}
      <div className="abm-grid">
        {fil.map((p, i) => {
          const accent = cardAccent(p);
          const grabados = reelsGrabados(p);
          return (
            <div
              key={p.id}
              className="abm-card"
              role="button"
              tabIndex={0}
              style={{ '--card-accent': accent, '--card-delay': `${i * 55}ms` } as React.CSSProperties}
              onClick={() => onOpen(p)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(p); } }}
            >
              {/* Cover */}
              <div className="abm-card-cover">
                <span className="abm-card-initial">{p.name[0]}</span>
                <div className="abm-card-cover-bg" />
                <div className="abm-cover-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="abm-icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                    <Pencil size={12} />
                  </button>
                  <button className="abm-icon-btn abm-icon-btn--danger" title="Eliminar" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="abm-card-body">
                <div className="abm-card-name-row">
                  <span className="abm-card-name">{p.name}</span>
                  {p.preloaded && <span className="abm-badge"><Sparkles size={9} /> precargado</span>}
                </div>
                <div className="abm-card-type">{p.type || <span className="abm-card-type--empty">Sin tipo</span>}</div>
              </div>

              {/* Footer */}
              <div className="abm-card-foot">
                <span className="abm-card-stat">
                  <Film size={11} />
                  {p.reels.length} reels
                  {grabados > 0 && <span className="abm-card-stat-chip">{grabados} grabados</span>}
                </span>
                <span className="abm-card-stat abm-card-stat--right">
                  <Clock size={11} />
                  {fmtDate(p.updated_at)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!fil.length && (
          <div className="abm-empty-state">
            <FolderKanban size={40} className="abm-empty-icon" />
            <div className="abm-empty-title">{q ? 'Sin resultados' : 'Todavía no hay proyectos'}</div>
            <p className="abm-empty-sub">
              {q
                ? `Nada coincide con «${q}». Probá con otro término.`
                : 'Creá tu primer proyecto con el botón «Nuevo proyecto» y cargá tus reels, audio y videos.'}
            </p>
            {!q && <button className="abm-empty-cta" onClick={openNew}><Plus size={14} /> Crear primer proyecto</button>}
          </div>
        )}
      </div>

      {/* Sheet crear/editar */}
      {editing && (
        <ProjectSheet
          project={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={() => { refresh(); setEditing(null); }}
        />
      )}

      {/* Confirm eliminar */}
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
          <p className="abm-hint">Si lo activás, el proyecto arranca con los guiones/slides ya hechos. Si no, arranca de cero.</p>
        </div>
        <div className="abm-sheet-foot">
          <button className="abm-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="abm-btn-primary" onClick={save} disabled={!name.trim()}>{isNew ? 'Crear proyecto' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
