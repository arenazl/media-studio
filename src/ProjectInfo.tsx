// Sección "Negocio" — muestra TODA la metadata que se trajo del KB de la app al importar:
// el brief (negocio, productos, diferenciadores, objeciones, oferta, qué no decir), la marca
// (color, fonética, logo) y las pantallas. Es la base de lo que generan las funciones — read-only.
import { Building2, Palette, MonitorSmartphone } from 'lucide-react';
import type { Project } from './lib/projects';
import './ProjectInfo.css';

function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
}

// render markdown liviano del brief (h, listas, quote, bold).
function Brief({ md }: { md: string }) {
  return (
    <div className="pi-brief">
      {md.split('\n').map((ln, i) => {
        const t = ln.trimEnd();
        if (t.startsWith('## ')) return <h3 key={i}>{t.slice(3)}</h3>;
        if (t.startsWith('# ')) return <h2 key={i}>{inline(t.slice(2))}</h2>;
        if (t.startsWith('> ')) return <blockquote key={i}>{inline(t.slice(2))}</blockquote>;
        if (t.startsWith('  - ')) return <div key={i} className="pi-li pi-li--sub">{inline(t.slice(4))}</div>;
        if (t.startsWith('- ')) return <div key={i} className="pi-li">{inline(t.slice(2))}</div>;
        if (!t) return <div key={i} className="pi-gap" />;
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}

export default function ProjectInfo({ project }: { project: Project }) {
  const bk = project.brandKit;
  const shots = project.screenshots || [];
  return (
    <div className="pi-root">
      <header className="pi-head">
        <div className="pi-title"><Building2 size={18} /> {project.name} — datos importados</div>
        <p className="pi-sub">{project.type || 'proyecto'} · todo esto se trajo del KB de la app — es la base de lo que generás</p>
      </header>

      <div className="pi-grid">
        <section className="pi-card pi-main">
          {project.brief ? <Brief md={project.brief} /> : <p className="pi-sub">Este proyecto no trajo brief (no vino de una importación).</p>}
        </section>

        <aside className="pi-side">
          {bk && (
            <div className="pi-card">
              <div className="pi-card-h"><Palette size={14} /> Marca</div>
              <div className="pi-brand">
                {bk.color && <span className="pi-swatch" style={{ background: bk.color }} />}
                <div>
                  {bk.name && <div className="pi-brand-name">{bk.name}</div>}
                  {bk.phonetic && <div className="pi-sub">se lee "{bk.phonetic}"</div>}
                  {bk.color && <div className="pi-sub">{bk.color}</div>}
                </div>
              </div>
              {bk.logoUrl && <img className="pi-logo" src={bk.logoUrl} alt="logo" />}
            </div>
          )}
          {!!shots.length && (
            <div className="pi-card">
              <div className="pi-card-h"><MonitorSmartphone size={14} /> Pantallas ({shots.length})</div>
              <div className="pi-shots">
                {shots.map((s, i) => <img key={i} className="pi-shot" src={s} alt={`pantalla ${i + 1}`} loading="lazy" />)}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
