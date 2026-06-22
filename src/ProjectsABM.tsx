// ABM de PROYECTOS — primera pantalla (multi-tenant). Grilla visual con covers
// por tipo + wizard de creación + editar (sheet lateral) + borrar (confirm). Estilos en ProjectsABM.css.
import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Pencil, FolderKanban, Film, Clock, X, Sparkles, Mic } from 'lucide-react';
import { listProjects, saveProject, deleteProject, type Project } from './lib/projects';
import NewProjectWizard from './NewProjectWizard';
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDel, setConfirmDel] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 420); return () => clearTimeout(t); }, []);

  const refresh = () => setProjects(listProjects());
  const fil = projects.filter((p) => `${p.name} ${p.type}`.toLowerCase().includes(q.toLowerCase()));

  const totalReels = projects.reduce((s, p) => s + p.reels.length, 0);
  const totalGrabados = projects.reduce((s, p) => s + reelsGrabados(p), 0);

  const handleOpen = (p: Project) => {
    setOpening(p.id);
    setTimeout(() => { setOpening(null); onOpen(p); }, 320);
  };

  const openEdit = (p: Project) => setEditing(p);

  return (
    <div className="abm">
      {/* Hero */}
      <div className="abm-hero">
        <div className="abm-hero-eyebrow"><Mic size={13} /> Media Studio</div>
        <h1 className="abm-hero-title">Proyectos</h1>
        {!loading && projects.length > 0 && (
          <div className="abm-stats-bar">
            <span className="abm-stat-pill"><strong>{projects.length}</strong> proyectos</span>
            <span className="abm-stat-sep" />
            <span className="abm-stat-pill"><Film size={11} /> <strong>{totalReels}</strong> reels</span>
            {totalGrabados > 0 && (
              <><span className="abm-stat-sep" /><span className="abm-stat-pill abm-stat-pill--green"><Mic size={11} /> <strong>{totalGrabados}</strong> grabados</span></>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="abm-toolbar">
        <div className="abm-search">
          <Search size={13} className="abm-search-icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto…" className="abm-search-input" />
        </div>
        <button className="abm-new" onClick={() => setWizardOpen(true)}><Plus size={14} /> Nuevo</button>
      </div>

      {/* Grid */}
      <div className="abm-grid">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="abm-skeleton" style={{ '--sk-delay': `${i * 80}ms` } as React.CSSProperties} />
        ))}

        {!loading && fil.map((p, i) => {
          const accent = cardAccent(p);
          const grabados = reelsGrabados(p);
          return (
            <div
              key={p.id}
              className={`abm-card${opening === p.id ? ' abm-card--opening' : ''}`}
              role="button"
              tabIndex={0}
              style={{ '--card-accent': accent, '--card-delay': `${i * 55}ms` } as React.CSSProperties}
              onClick={() => handleOpen(p)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(p); } }}
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
        {!loading && !fil.length && (
          <div className="abm-empty-state">
            <FolderKanban size={40} className="abm-empty-icon" />
            <div className="abm-empty-title">{q ? 'Sin resultados' : 'Todavía no hay proyectos'}</div>
            <p className="abm-empty-sub">
              {q
                ? `Nada coincide con «${q}». Probá con otro término.`
                : 'Creá tu primer proyecto con el botón «Nuevo proyecto» y cargá tus reels, audio y videos.'}
            </p>
            {!q && <button className="abm-empty-cta" onClick={() => setWizardOpen(true)}><Plus size={14} /> Crear primer proyecto</button>}
          </div>
        )}
      </div>

      {/* Wizard nuevo proyecto */}
      <NewProjectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(proj) => { refresh(); onOpen(proj); }}
      />

      {/* Sheet editar proyecto existente */}
      {editing && (
        <ProjectSheet
          project={editing}
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

function ProjectSheet({ project, onClose, onSaved }: { project: Project; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(project.name);
  const [type, setType] = useState(project.type);

  const save = () => {
    if (!name.trim()) return;
    saveProject({ id: project.id || undefined, name, type, reels: project.reels });
    onSaved();
  };

  return (
    <div className="abm-overlay" onClick={onClose}>
      <div className="abm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="abm-sheet-head">
          <span className="abm-sheet-title">Editar proyecto</span>
          <button className="abm-icon-btn" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="abm-sheet-body">
          <label className="abm-field">
            <span className="abm-label">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Café Aurora, Lanzamiento app…" className="abm-input" autoFocus />
          </label>
          <label className="abm-field">
            <span className="abm-label">Tipo / rubro</span>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ej. Gastronomía, E-commerce, SaaS…" className="abm-input" />
          </label>
        </div>
        <div className="abm-sheet-foot">
          <button className="abm-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="abm-btn-primary" onClick={save} disabled={!name.trim()}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
