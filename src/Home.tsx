// HOME nuevo (rediseño F1, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html líneas 52-133).
// Dashboard: piezas (GET /api/projects vía useProjects, ya en App) + integraciones KSP
// (GET /api/kb/apps) + CTA "Nueva pieza". Todo derivado de datos reales — nada hardcodeado.
import { useEffect, useState } from 'react';
import { Plus, ArrowRight, Sparkles } from 'lucide-react';
import { API_BASE } from './config';
import type { Project } from './lib/projects';
import { resolveBrand } from './lib/brandKit';
import { pasosVisibles, type PasoId } from './lib/comercial';
import { appAccent, hostOf } from './lib/kspApps';
import './Home.css';

interface Props {
  projects: Project[];
  onOpenProject: (p: Project) => void;
  onNewPiece: () => void;
  onGoIntegrations: () => void;
}

interface KbAppRow { id: string; name: string; base_url: string; ready: boolean }

const PASO_LABELS: Record<PasoId, string> = {
  negocio: 'Negocio', concepto: 'Concepto', guion: 'Guion', cast: 'Cast', storyboard: 'Storyboard',
  pack: 'Pack Flow', render: 'Render', rodaje: 'Rodaje', montaje: 'Montaje', publicar: 'Publicar',
};
const CONTENT_LABELS: Record<string, string> = { reels: 'Reels', video: 'Video', audio: 'Audio', combinado: 'Combinado' };

// Progreso de la pieza: toma el primer reel que tenga un `comercial` corriendo el pipeline
// (rework) como representante del proyecto. Si ninguno tiene, la pieza está "sin iniciar".
function pieceProgress(p: Project): { pct: number; stepLabel: string; tipo?: 'filmado' | 'animado' } {
  const reel = p.reels.find((r) => r.comercial);
  const comercial = reel?.comercial;
  if (!comercial) return { pct: 0, stepLabel: 'Sin iniciar' };
  const visibles = pasosVisibles(comercial.tipo);
  const aprobados = visibles.filter((paso) => comercial.estados[paso] === 'aprobado').length;
  const pct = Math.round((aprobados / visibles.length) * 100);
  const siguiente = visibles.find((paso) => comercial.estados[paso] !== 'aprobado');
  const stepLabel = siguiente ? PASO_LABELS[siguiente] : 'Publicado';
  return { pct, stepLabel, tipo: comercial.tipo };
}

function isPublicada(p: Project): boolean {
  return p.reels.some((r) => r.comercial?.estados.publicar === 'aprobado');
}

type Filtro = 'todos' | 'progreso' | 'publicadas';

export default function Home({ projects, onOpenProject, onNewPiece, onGoIntegrations }: Props) {
  const [apps, setApps] = useState<KbAppRow[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/kb/apps`).then((r) => r.json())
      .then((d) => { if (alive) setApps((d.apps as KbAppRow[]) || []); })
      .catch(() => { /* server opcional: la barra de Integraciones queda vacía */ });
    return () => { alive = false; };
  }, []);

  const visibles = projects.filter((p) => {
    if (filtro === 'todos') return true;
    if (filtro === 'publicadas') return isPublicada(p);
    return !isPublicada(p);
  });
  const conectadas = apps.filter((a) => a.ready).length;
  const publicadas = projects.filter(isPublicada).length;
  const totalReels = projects.reduce((s, p) => s + p.reels.length, 0);

  return (
    <div className="home">
    <div className="home-inner">
      <div className="home-head">
        <div>
          <div className="home-eyebrow">Media Studio</div>
          <h1 className="home-title">Buenas</h1>
          <p className="home-sub">Generá contenido multimedia a partir de lo que tus apps ya saben de sí mismas.</p>
        </div>
        <button className="home-cta" onClick={onNewPiece}><Plus size={17} /> Nueva pieza</button>
      </div>

      <div className="home-stats">
        <StatCard value={String(projects.length)} label="Piezas" color="var(--rd-ink)" />
        <StatCard value={String(conectadas)} label="Apps integradas" color="var(--rd-green)" />
        <StatCard value={String(totalReels)} label="Reels totales" color="var(--rd-ink)" />
        <StatCard value={String(publicadas)} label="Publicadas" color="var(--rd-green)" />
      </div>

      <div className="home-row">
        <h2 className="home-h2">Piezas recientes</h2>
        <div className="home-filters">
          {(['todos', 'progreso', 'publicadas'] as Filtro[]).map((f) => (
            <button
              key={f}
              className={filtro === f ? 'home-filter home-filter--on' : 'home-filter'}
              onClick={() => setFiltro(f)}
            >
              {f === 'todos' ? 'Todas' : f === 'progreso' ? 'En progreso' : 'Publicadas'}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="home-empty">
          <Sparkles size={22} />
          <p>Todavía no hay piezas{filtro !== 'todos' ? ' en este filtro' : ''}. Arrancá una con «Nueva pieza».</p>
        </div>
      ) : (
        <div className="home-grid">
          {visibles.map((p) => {
            const { pct, stepLabel, tipo } = pieceProgress(p);
            const accent = resolveBrand(p.brandKit).color;
            return (
              <button key={p.id} className="piece-card" onClick={() => onOpenProject(p)} style={{ '--piece-accent': accent } as React.CSSProperties}>
                <div className="piece-cover">
                  <div className="piece-badge">{p.name[0]?.toUpperCase() || '?'}</div>
                  <div className="piece-pills">
                    {p.contentType && <span className="piece-pill">{CONTENT_LABELS[p.contentType] || p.contentType}</span>}
                    {tipo && (
                      <span className="piece-pill" style={{ color: tipo === 'animado' ? 'var(--rd-green)' : 'var(--rd-gold)' }}>
                        {tipo === 'animado' ? 'Animado' : 'Filmado'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="piece-body">
                  <div className="piece-app-row">
                    <span className="piece-app-dot" style={{ background: accent }} />
                    <span className="piece-app-name">{p.type || 'Sin rubro'}</span>
                  </div>
                  <div className="piece-name">{p.name}</div>
                  <div className="piece-progress">
                    <div className="piece-bar"><div className="piece-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--rd-green)' : 'var(--rd-gold)' }} /></div>
                    <span className="piece-step">{stepLabel}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="home-row home-row--ksp">
        <div>
          <h2 className="home-h2">Integraciones · KSP</h2>
          <p className="home-ksp-sub">Media Studio no te pide datos: los importa de tus apps en tiempo real.</p>
        </div>
        <button className="home-link" onClick={onGoIntegrations}>Ver todas <ArrowRight size={13} /></button>
      </div>
      <div className="home-ksp-grid">
        {apps.slice(0, 4).map((a) => (
          <div key={a.id} className="ksp-card">
            <div className="ksp-card-top">
              <div className="ksp-initial" style={{ background: appAccent(a.id) }}>{a.name[0]?.toUpperCase()}</div>
              <span className="ksp-status" style={{ color: a.ready ? 'var(--rd-green)' : 'var(--rd-gold)' }}>
                <span className="ksp-dot" style={{ background: a.ready ? 'var(--rd-green)' : 'var(--rd-gold)' }} />
                {a.ready ? 'Conectada' : 'Pendiente'}
              </span>
            </div>
            <div className="ksp-name">{a.name}</div>
            <div className="ksp-desc">{a.ready ? hostOf(a.base_url) : 'Sin servidor configurado'}</div>
          </div>
        ))}
        {!apps.length && <div className="home-empty home-empty--inline">Sin Integraciones en el registro todavía.</div>}
      </div>
    </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
