// Integrar · KSP (rediseño F1, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html ~línea 569).
// Overview fiel al prototipo (grid de cards del registro, GET /api/kb/apps) + el inspector real
// (KbInspector) debajo para el detalle del KB y el "Comenzar" — ese flujo sigue intacto: crea el
// proyecto (kbToProjectInput) y dispara el wizard de siempre. No se rediseña KbInspector por dentro
// (fuera de alcance de F1); su paleta legacy (--gold/--ink viejos) es un poco distinta al resto de
// esta pantalla — swap señalado para Fable.
import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { API_BASE } from './config';
import KbInspector from './KbInspector';
import type { Project } from './lib/projects';
import { appAccent, hostOf } from './lib/kspApps';
import './Integrar.css';

interface KbAppRow { id: string; name: string; base_url: string; ready: boolean }

export default function Integrar({ onHome, onComenzar }: { onHome: () => void; onComenzar: (p: Project) => void }) {
  const [apps, setApps] = useState<KbAppRow[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/kb/apps`).then((r) => r.json())
      .then((d) => { if (alive) setApps((d.apps as KbAppRow[]) || []); })
      .catch(() => { /* server opcional */ });
    return () => { alive = false; };
  }, []);

  return (
    <div className="ksp-page">
    <div className="ksp-inner">
      <h1 className="ksp-title">Integraciones · KSP</h1>
      <p className="ksp-lead">
        El Knowledge Share Protocol trae el negocio, la marca y las pantallas de cada app{' '}
        <strong>en tiempo real y sin cache</strong>. Media Studio no inventa datos.
      </p>

      <div className="ksp-overview-grid">
        {apps.map((a) => (
          <div key={a.id} className="ksp-ovcard">
            <div className="ksp-ovcard-top">
              <div className="ksp-ovinitial" style={{ background: appAccent(a.id) }}>{a.name[0]?.toUpperCase()}</div>
              <div className="ksp-ovmeta">
                <div className="ksp-ovname">{a.name}</div>
                <div className="ksp-ovdesc">{a.ready ? hostOf(a.base_url) : 'Sin servidor configurado'}</div>
              </div>
              <span className="ksp-ovstatus" style={{ color: a.ready ? 'var(--rd-green)' : 'var(--rd-gold)' }}>
                <span className="ksp-ovdot" style={{ background: a.ready ? 'var(--rd-green)' : 'var(--rd-gold)' }} />
                {a.ready ? 'Conectada' : 'Pendiente'}
              </span>
            </div>
            <div className="ksp-ovfoot">
              <span>on-demand</span>
              {a.ready && <span style={{ color: 'var(--rd-green)' }}>X-KB-Key ✓</span>}
            </div>
          </div>
        ))}
        {!apps.length && <div className="ksp-ovempty">Leyendo el registro de Integraciones…</div>}
      </div>

      <div className="ksp-register">
        <Share2 size={20} />
        <div className="ksp-register-body">
          <div className="ksp-register-title">Registrar nueva app</div>
          <div className="ksp-register-desc">
            Cualquier app que exponga <code>GET /api/knowledge-base</code> puede alimentar Media Studio
            — se suma al registro compartido del ecosistema.
          </div>
        </div>
      </div>

      <div className="ksp-inspect-h">Detalle e inspección</div>
      <div className="ksp-inspect">
        <KbInspector onClose={onHome} onComenzar={onComenzar} />
      </div>
    </div>
    </div>
  );
}
