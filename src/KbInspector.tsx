// Visor de Integraciones (solo lectura, para revisar qué manda cada app).
// Lista las apps del registro y muestra su KB en paneles legibles + un semáforo de salud
// (logo y pantallas subidos o caen al fallback de look-guides · encoding limpio). Toggle a JSON crudo.
import { useEffect, useState, type ReactNode } from 'react';
import {
  Building2, Package, Tag, Award, MessageSquareWarning, HelpCircle, Palette,
  MonitorSmartphone, Ban, X, Loader2, Check, AlertTriangle, RefreshCw, Code, Rocket, Megaphone,
} from 'lucide-react';
import { API_BASE } from './config';
import { kbToProjectInput, type KnowledgeBase } from './lib/knowledgeBase';
import { saveProject, type Project } from './lib/projects';
import './KbInspector.css';

interface AppItem { id: string; name: string; base_url: string; ready: boolean }
interface AssetState { ok: boolean; reason?: string; url?: string; label?: string; inline?: boolean }
interface ScreenState { ok: boolean; reason?: string; label?: string; kind?: string; headline?: string; components?: number; data?: number }
interface Health { logo: AssetState; screens: ScreenState[]; encodingOk: boolean }
interface Offering { id?: string; name: string; description?: string; key_features?: string[] }
interface Plan { name: string; target?: string }
interface KbScreen { label: string; kind?: string; headline?: string; framework?: string; nav?: string[]; components?: string[]; layout?: string; style?: string; data?: unknown; flow?: string }
interface Kb {
  contract_version?: string; last_updated?: string;
  business?: { name?: string; tagline?: string; description?: string; value_story?: string; industry?: string; target_audience?: string; website?: string };
  key_messages?: string[];
  offerings?: Offering[];
  pricing?: { summary?: string; plans?: Plan[]; promotions?: string[] };
  differentiators?: string[];
  objections?: { objection: string; response: string }[];
  faq?: { question: string; answer: string }[];
  do_not_say?: string[];
  brand?: { colors?: Record<string, string>; fonts?: Record<string, string>; style?: Record<string, string>; phonetic?: string; tone?: string };
  screens?: KbScreen[];
}
type Phase = 'idle' | 'loading' | 'done' | 'error';

export default function KbInspector({ onClose, onComenzar }: { onClose: () => void; onComenzar: (p: Project) => void }) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [selId, setSelId] = useState('');
  const [kb, setKb] = useState<Kb | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState('');
  const [rawJson, setRawJson] = useState(false);

  const load = async (id: string) => {
    setSelId(id); setErr(''); setKb(null); setHealth(null); setPhase('loading');
    try {
      const r = await fetch(`${API_BASE}/api/kb/inspect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: id }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'no se pudo leer el KB');
      setKb(d.kb); setHealth(d.health); setPhase('done');
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); setPhase('error'); }
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/kb/apps`).then((r) => r.json())
      .then((d) => { const list: AppItem[] = d.apps || []; setApps(list); const f = list.find((a) => a.ready); if (f) load(f.id); })
      .catch(() => setErr('no pude leer el registro de Integraciones'));
  }, []);

  // "Comenzar": del KB visible → crea un proyecto nuevo (brief + marca) y lo abre para laburar.
  // No usa IA (no depende del /api/kb/plan): la generación de piezas se hace dentro, con las funciones.
  const comenzar = () => {
    if (!kb) return;
    const inp = kbToProjectInput(kb as unknown as KnowledgeBase);
    const proj = saveProject({ name: inp.name, type: inp.type, brief: inp.brief, brandKit: inp.brandKit, screens: inp.screens, contentType: 'combinado' });
    onComenzar(proj);
  };

  const b = kb?.business;
  const okScreens = health ? health.screens.filter((s) => s.ok).length : 0;

  return (
    <div className="kbx-root">
      <aside className="kbx-side">
        <div className="kbx-side-h">Integraciones</div>
        {apps.map((a) => (
          <button key={a.id} className={selId === a.id ? 'kbx-app kbx-app--on' : 'kbx-app'} disabled={!a.ready} onClick={() => load(a.id)}>
            <span>{a.name}</span>{!a.ready && <span className="kbx-app-off">sin URL</span>}
          </button>
        ))}
        {!apps.length && <div className="kbx-muted">leyendo registro…</div>}
        <button className="kbx-close" onClick={onClose}><X size={14} /> Cerrar</button>
      </aside>

      <main className="kbx-main">
        {phase === 'loading' && <div className="kbx-center"><Loader2 className="kbx-spin" size={26} /> trayendo el KB…</div>}
        {phase === 'error' && <div className="kbx-error"><AlertTriangle size={16} /> {err}</div>}
        {phase === 'done' && kb && (
          <>
            <header className="kbx-top">
              <div>
                <h1>{b?.name}</h1>
                {b?.tagline && <p className="kbx-tagline">{b.tagline}</p>}
              </div>
              <div className="kbx-actions">
                <button className="kbx-start" onClick={comenzar} title="Crear el proyecto y empezar a laburar">
                  <Rocket size={15} /> Comenzar con {b?.name}
                </button>
                <button className="kbx-iconbtn" onClick={() => selId && load(selId)} title="Recargar"><RefreshCw size={14} /></button>
                <button className={rawJson ? 'kbx-iconbtn kbx-iconbtn--on' : 'kbx-iconbtn'} onClick={() => setRawJson((v) => !v)} title="Ver JSON crudo"><Code size={14} /></button>
              </div>
            </header>

            {health && (
              <div className="kbx-health">
                <Badge ok={!!b?.description} label="Negocio" />
                <Badge ok={health.logo.ok} label="Logo" reason={health.logo.reason} />
                <Badge ok={okScreens === health.screens.length && health.screens.length > 0} partial={okScreens > 0 && okScreens < health.screens.length} label={`Pantallas ${okScreens}/${health.screens.length}`} />
                <Badge ok={health.encodingOk} label="Encoding" />
                <span className="kbx-ver">v{kb.contract_version} · {kb.last_updated?.slice(0, 10)}</span>
              </div>
            )}

            {rawJson ? (
              <pre className="kbx-json">{JSON.stringify(kb, null, 2)}</pre>
            ) : (
              <div className="kbx-grid">
                <Panel icon={<Building2 size={15} />} title="Negocio">
                  <p>{b?.description}</p>
                  {b?.value_story && <p className="kbx-vstory"><strong>La propuesta (el hilo): </strong>{b.value_story}</p>}
                  <dl className="kbx-dl">
                    {b?.industry && <><dt>Rubro</dt><dd>{b.industry}</dd></>}
                    {b?.target_audience && <><dt>Público</dt><dd>{b.target_audience}</dd></>}
                    {b?.website && <><dt>Web</dt><dd>{b.website}</dd></>}
                  </dl>
                </Panel>

                {!!kb.key_messages?.length && (
                  <Panel icon={<Megaphone size={15} />} title="Mensajes clave (van en cada reel)">
                    <ul className="kbx-list">{kb.key_messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </Panel>
                )}

                <Panel icon={<Package size={15} />} title={`Productos (${(kb.offerings || []).length})`}>
                  {(kb.offerings || []).map((o, i) => (
                    <div key={i} className="kbx-off">
                      <div className="kbx-off-name">{o.name}</div>
                      <p className="kbx-off-desc">{o.description}</p>
                      {!!o.key_features?.length && <ul className="kbx-feats">{o.key_features.map((f, j) => <li key={j}>{f}</li>)}</ul>}
                    </div>
                  ))}
                </Panel>

                {kb.brand && (
                  <Panel icon={<Palette size={15} />} title="Marca">
                    <div className="kbx-swatches">{Object.entries(kb.brand.colors || {}).map(([k, v]) => (
                      <div key={k} className="kbx-sw"><span className="kbx-sw-box" style={{ background: v }} /><span className="kbx-sw-k">{k}</span><span className="kbx-sw-v">{v}</span></div>
                    ))}</div>
                    <dl className="kbx-dl">
                      {kb.brand.fonts && <><dt>Fuentes</dt><dd>{Object.values(kb.brand.fonts).join(' · ')}</dd></>}
                      {kb.brand.phonetic && <><dt>Fonética</dt><dd>"{kb.brand.phonetic}"</dd></>}
                      {kb.brand.tone && <><dt>Tono</dt><dd>{kb.brand.tone}</dd></>}
                      {kb.brand.style && <><dt>Estilo</dt><dd>{Object.values(kb.brand.style).filter(Boolean).join(' · ')}</dd></>}
                    </dl>
                    {health?.logo.ok
                      ? (health.logo.inline
                          ? <div className="kbx-logo-ok"><Check size={13} /> logo SVG embebido</div>
                          : <img className="kbx-logo" src={health.logo.url} alt="logo" />)
                      : <div className="kbx-logo-miss"><AlertTriangle size={13} /> sin logo ({health?.logo.reason})</div>}
                  </Panel>
                )}

                <Panel icon={<MonitorSmartphone size={15} />} title={`Pantallas (${(kb.screens || []).length})`}>
                  {(health?.screens || []).map((s, i) => (
                    <div key={i} className="kbx-screen">
                      {s.ok ? <Check size={13} className="kbx-ok" /> : <AlertTriangle size={13} className="kbx-bad" />}
                      <span className="kbx-screen-label">{s.headline || s.label}</span>
                      {s.kind && <span className="kbx-screen-kind">{s.kind}</span>}
                      <span className="kbx-reason">{s.ok ? `${s.components} controles · ${s.data} datos` : s.reason}</span>
                    </div>
                  ))}
                  {!(kb.screens || []).length && <p className="kbx-muted">sin pantallas en el KB</p>}
                </Panel>

                {!!kb.differentiators?.length && (
                  <Panel icon={<Award size={15} />} title="Diferenciadores">
                    <ul className="kbx-list">{kb.differentiators.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </Panel>
                )}

                {!!kb.objections?.length && (
                  <Panel icon={<MessageSquareWarning size={15} />} title="Objeciones">
                    {kb.objections.map((o, i) => <div key={i} className="kbx-qa"><div className="kbx-q">"{o.objection}"</div><div className="kbx-a">{o.response}</div></div>)}
                  </Panel>
                )}

                {!!kb.faq?.length && (
                  <Panel icon={<HelpCircle size={15} />} title="FAQ">
                    {kb.faq.map((f, i) => <div key={i} className="kbx-qa"><div className="kbx-q">{f.question}</div><div className="kbx-a">{f.answer}</div></div>)}
                  </Panel>
                )}

                {kb.pricing && (
                  <Panel icon={<Tag size={15} />} title="Precios">
                    {kb.pricing.summary && <p>{kb.pricing.summary}</p>}
                    {(kb.pricing.plans || []).map((p, i) => (
                      <div key={i} className="kbx-plan"><strong>{p.name}</strong>{p.target && <span className="kbx-muted"> — {p.target}</span>}</div>
                    ))}
                    {!!kb.pricing.promotions?.length && <ul className="kbx-list">{kb.pricing.promotions.map((p, i) => <li key={i}>{p}</li>)}</ul>}
                  </Panel>
                )}

                {!!kb.do_not_say?.length && (
                  <Panel icon={<Ban size={15} />} title="No decir">
                    <ul className="kbx-list kbx-list--no">{kb.do_not_say.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </Panel>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="kbx-panel"><div className="kbx-panel-h">{icon} {title}</div><div className="kbx-panel-b">{children}</div></section>;
}
function Badge({ ok, partial, label, reason }: { ok: boolean; partial?: boolean; label: string; reason?: string }) {
  const cls = ok ? 'kbx-badge kbx-badge--ok' : partial ? 'kbx-badge kbx-badge--warn' : 'kbx-badge kbx-badge--bad';
  return <span className={cls} title={reason}>{ok ? <Check size={12} /> : <AlertTriangle size={12} />} {label}</span>;
}
