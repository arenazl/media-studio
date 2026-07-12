// WIZARD "formato-primero" (rediseño Fase 5, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html
// ~línea 136). Dos pasos en una sola pantalla, como en el prototipo (sin stepper con "siguiente"):
//
//   Paso 1 — Formato: catálogo de Fase 3 (src/lib/formatosCatalog.ts). HOY es sólo metadata/cosmético
//   — no cambia la generación (ver TODO más abajo, la entidad `Formato` todavía no existe).
//   Paso 2 — App fuente (KSP): GET /api/kb/apps, igual que Integrar/KbInspector.
//
// Al crear la pieza se reusa el flujo REAL que ya existía en KbInspector.comenzar: trae el KB
// completo (POST /api/kb/inspect), lo convierte con kbToProjectInput y guarda el proyecto
// (saveProject) — EXACTAMENTE lo mismo que hacía el botón "Comenzar con <app>". El proyecto creado
// entra a ProjectWizard (perfil de campaña → siembra de comerciales vía `strategy`) sin cambios —
// ver App.tsx ruta 'wizard'. Nada de esto inventa IA nueva: sólo reordena la UI para que el formato
// se elija primero.
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { API_BASE } from './config';
import { FORMATOS, type FormatoCard } from './lib/formatosCatalog';
import { appAccent } from './lib/kspApps';
import { kbToProjectInput, type KnowledgeBase } from './lib/knowledgeBase';
import { saveProject, type Project } from './lib/projects';
import './Wizard.css';

interface AppRow { id: string; name: string; base_url: string; ready: boolean }
type Phase = 'idle' | 'creando' | 'error';

export default function Wizard({ onCancel, onComenzar }: { onCancel: () => void; onComenzar: (p: Project) => void }) {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [formatoId, setFormatoId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/kb/apps`).then((r) => r.json())
      .then((d) => { if (alive) setApps((d.apps as AppRow[]) || []); })
      .catch(() => { if (alive) setErr('No pude leer el registro de Integraciones.'); });
    return () => { alive = false; };
  }, []);

  const formato = FORMATOS.find((f) => f.id === formatoId);
  const app = apps.find((a) => a.id === appId);
  const puedeCrear = !!formato && !!app && phase !== 'creando';

  // Crea la pieza con el flujo REAL: trae el KB completo de la app elegida y lo convierte a
  // brief+marca+pantallas (idéntico a KbInspector.comenzar). El resto — perfil de campaña + siembra
  // de piezas vía `strategy` — lo hace ProjectWizard a continuación, sin tocar esa lógica.
  const crear = async () => {
    if (!app || phase === 'creando') return;
    setPhase('creando'); setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/kb/inspect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: app.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo leer el KB');
      const inp = kbToProjectInput(d.kb as KnowledgeBase);
      // TODO(modelo-superior): el Formato elegido (formato.id / aspecto / tecnicaProduccion) todavía
      // no cablea el `tipo`/moldes/prompts de la pieza — la entidad `Formato` no existe en el modelo
      // de datos (HANDOFF §8). Acá es sólo metadata visual del wizard; no inventar ese cableado.
      const proj = saveProject({ name: inp.name, type: inp.type, brief: inp.brief, brandKit: inp.brandKit, screens: inp.screens, contentType: 'combinado' });
      onComenzar(proj);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'error trayendo el KB'); setPhase('error');
    }
  };

  return (
    <div className="wz-root">
      <div className="wz-crumb">
        <button type="button" className="wz-crumb-link" onClick={onCancel}>Inicio</button>
        <span>/</span>
        <span className="wz-crumb-on">Nueva pieza</span>
      </div>
      <h1 className="wz-title">¿Qué querés producir?</h1>
      <p className="wz-lead">Elegí primero el <strong>formato de salida</strong> — el mismo cerebro produce cualquiera de ellos.</p>

      <StepHeader n={1} label="Formato" tag="entidad de primer nivel" />
      <div className="wz-grid wz-grid--formatos">
        {FORMATOS.map((f) => (
          <FormatoOption key={f.id} f={f} selected={formatoId === f.id} onPick={() => setFormatoId(f.id)} />
        ))}
      </div>

      <StepHeader n={2} label="Fuente de datos" tag="se importa vía KSP — sin formularios" />
      <div className="wz-grid wz-grid--apps">
        {apps.map((a) => (
          <AppOption key={a.id} a={a} selected={appId === a.id} onPick={() => setAppId(a.id)} />
        ))}
        {!apps.length && !err && <div className="wz-muted">Leyendo el registro de Integraciones…</div>}
      </div>

      {err && <div className="wz-error">{err}</div>}

      <div className="wz-footer">
        <div className="wz-summary">
          {formato && app ? (
            <>Vas a crear <strong className="wz-gold">{formato.nombre}</strong> desde <strong className="wz-green">{app.name}</strong></>
          ) : (
            'Elegí un formato y una app fuente para continuar.'
          )}
        </div>
        <div className="wz-actions">
          <button type="button" className="wz-btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="button" className="wz-btn-primary" disabled={!puedeCrear} onClick={crear}>
            {phase === 'creando'
              ? <><Loader2 size={15} className="wz-spin" /> Creando…</>
              : <>Crear pieza <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ n, label, tag }: { n: number; label: string; tag: string }) {
  return (
    <div className="wz-step-h">
      <span className="wz-step-num">{n}</span>
      <span className="wz-step-label">{label}</span>
      <span className="wz-step-tag">{tag}</span>
    </div>
  );
}

function FormatoOption({ f, selected, onPick }: { f: FormatoCard; selected: boolean; onPick: () => void }) {
  const Icon = f.Icon;
  return (
    <button
      type="button"
      className={selected ? 'wz-card wz-card--on' : 'wz-card'}
      style={selected ? { borderColor: f.accent, background: `color-mix(in srgb, ${f.accent} 7%, var(--rd-surface-1))` } : undefined}
      onClick={onPick}
    >
      <div className="wz-card-top">
        <div className="wz-card-icon" style={{ background: `color-mix(in srgb, ${f.accent} 20%, transparent)`, color: f.accent }}>
          <Icon size={18} />
        </div>
        <span className="wz-card-aspecto">{f.aspecto}</span>
        {selected && <Check size={14} className="wz-card-check" style={{ color: f.accent }} />}
      </div>
      <div className="wz-card-name">{f.nombre}</div>
      <div className="wz-card-nota">{f.nota}</div>
      <div className="wz-card-chips">
        <span className="wz-chip">{f.duracion}</span>
        <span className="wz-chip">{f.tecnica}</span>
      </div>
    </button>
  );
}

function AppOption({ a, selected, onPick }: { a: AppRow; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      className={selected ? 'wz-app wz-app--on' : a.ready ? 'wz-app' : 'wz-app wz-app--off'}
      disabled={!a.ready}
      title={a.ready ? undefined : 'Sin servidor configurado'}
      onClick={onPick}
    >
      <div className="wz-app-initial" style={{ background: appAccent(a.id) }}>{a.name[0]?.toUpperCase()}</div>
      <div className="wz-app-meta">
        <div className="wz-app-name">{a.name}</div>
        <div className="wz-app-desc">{a.ready ? 'Conectada · on-demand' : 'Pendiente'}</div>
      </div>
      {selected && <Check size={15} className="wz-app-check" />}
    </button>
  );
}
