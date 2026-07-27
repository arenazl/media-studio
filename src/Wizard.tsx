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
//
// WO-K2 (media kit): si la app elegida dejó su `media-kit/` (contrato base-compartida/16), acá se
// VE la materia prima ANTES de crear (badge + grilla de capturas) y al crear se estampa en el
// proyecto (mediaKitId/cta/momentos/pantallasKit/marcaKit). Sin kit todo funciona como hoy (KSP).
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Images, Loader2 } from 'lucide-react';
import { API_BASE } from './config';
import { FORMATOS, type FormatoCard } from './lib/formatosCatalog';
import { appAccent } from './lib/kspApps';
import { kbToProjectInput, type KBProjectInput, type KnowledgeBase } from './lib/knowledgeBase';
import { mediaKitToPantallas, mediaKitToProjectInput, type MediaKit, type MediaKitResumen } from './lib/mediaKit';
import { saveProject, type Project } from './lib/projects';
import './Wizard.css';

interface AppRow { id: string; name: string; base_url: string; ready: boolean }
// Una fila elegible del paso 2: la app del registro KSP con su kit (si lo dejó), o un kit HUÉRFANO
// (el kit puede llegar antes que el registro — contrato §id: se lista igual, marcado sinRegistro).
interface FuenteRow { id: string; name: string; ready: boolean; kit?: MediaKitResumen; soloKit: boolean }
type Phase = 'idle' | 'creando' | 'error';

export default function Wizard({ onCancel, onComenzar, formatoIdInicial }: { onCancel: () => void; onComenzar: (p: Project) => void; formatoIdInicial?: string }) {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [kits, setKits] = useState<MediaKitResumen[]>([]);
  const [kitData, setKitData] = useState<MediaKit | null>(null);   // el kit COMPLETO de la app elegida (preview)
  const [formatoId, setFormatoId] = useState<string | null>(formatoIdInicial ?? null);
  const [appId, setAppId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/kb/apps`).then((r) => r.json())
      .then((d) => { if (alive) setApps((d.apps as AppRow[]) || []); })
      .catch(() => { if (alive) setErr('No pude leer el registro de Integraciones.'); });
    // los kits son OPCIONALES: si el escaneo falla, el wizard sigue andando exactamente como antes.
    fetch(`${API_BASE}/api/media-kit`).then((r) => r.json())
      .then((d) => { if (alive) setKits((d.kits as MediaKitResumen[]) || []); })
      .catch(() => { /* sin kits: flujo KSP de siempre */ });
    return () => { alive = false; };
  }, []);

  // Registro KSP + kits huérfanos = las fuentes elegibles. Un kit con capturas habilita la app
  // aunque su servidor KSP no esté levantado (el kit trae negocio + marca + capturas: alcanza para
  // crear). El cruce va en minúsculas: el id del kit es una llave y el primer kit real llegó con la
  // caja distinta a la del registro (carpeta "EventMarker" vs id "eventmarker").
  const kitDe = (id: string) => kits.find((k) => k.id.toLowerCase() === id.toLowerCase());
  const fuentes: FuenteRow[] = [
    ...apps.map((a) => ({ id: a.id, name: a.name, ready: a.ready || !!kitDe(a.id), kit: kitDe(a.id), soloKit: false })),
    ...kits.filter((k) => !apps.some((a) => a.id.toLowerCase() === k.id.toLowerCase()))
      .map((k) => ({ id: k.id, name: k.app || k.id, ready: k.pantallas > 0, kit: k, soloKit: true })),
  ];

  const formato = FORMATOS.find((f) => f.id === formatoId);
  const app = fuentes.find((a) => a.id === appId);
  const kitDelApp = appId ? kitDe(appId) : undefined;
  const puedeCrear = !!formato && !!app && phase !== 'creando';

  // Preview de las capturas: al elegir una app con kit se trae el JSON completo (local, barato) para
  // MOSTRAR la materia prima antes de crear. Si falla, queda el badge con el conteo del resumen.
  useEffect(() => {
    if (!kitDelApp) { setKitData(null); return; }
    let alive = true;
    setKitData(null);
    fetch(`${API_BASE}/api/media-kit/${encodeURIComponent(kitDelApp.id)}`).then((r) => r.json())
      .then((d) => { if (alive && d?.kit) setKitData(d.kit as MediaKit); })
      .catch(() => { /* preview opcional */ });
    return () => { alive = false; };
  }, [kitDelApp?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Crea la pieza con el flujo REAL: trae el KB completo de la app elegida y lo convierte a
  // brief+marca+pantallas (idéntico a KbInspector.comenzar). Si además hay MEDIA KIT, el kit MANDA
  // en lo que sabe mejor (nombre exacto, marca completa, brief de hechos crudos, capturas reales) y
  // el KSP aporta lo suyo (rubro, metadata de pantallas). El resto — perfil de campaña + siembra de
  // piezas vía `strategy` — lo hace ProjectWizard a continuación, sin tocar esa lógica.
  const crear = async () => {
    if (!app || !formato || phase === 'creando') return;
    setPhase('creando'); setErr('');
    try {
      const kitRes = kitDe(app.id);
      // 1) el kit completo (si hay): puede estar ya en memoria por el preview.
      let kit: MediaKit | null = kitRes && kitData?.id === kitRes.id ? kitData : null;
      if (kitRes && !kit) {
        const rk = await fetch(`${API_BASE}/api/media-kit/${encodeURIComponent(kitRes.id)}`);
        const dk = await rk.json();
        if (rk.ok && dk?.kit) kit = dk.kit as MediaKit;
      }
      // 2) el KB del KSP (si la app está en el registro). Con kit, un KSP caído NO frena la creación;
      //    sin kit el error sigue siendo fatal, exactamente como antes.
      let kb: KBProjectInput | null = null;
      if (!app.soloKit) {
        try {
          const r = await fetch(`${API_BASE}/api/kb/inspect`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: app.id }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'no se pudo leer el KB');
          kb = kbToProjectInput(d.kb as KnowledgeBase);
        } catch (e) {
          if (!kit) throw e;
        }
      }
      if (!kb && !kit) throw new Error('esa fuente no tiene KB conectado ni media kit');
      const mk = kit ? mediaKitToProjectInput(kit) : null;
      // WO-1: el Formato elegido viaja como `formatoId` del proyecto — ProjectWizard lo usa para
      // derivar el `tipo` de cada pieza (mapeo D2) y estamparlo en cada comercial.
      const proj = saveProject({
        name: mk?.name || kb!.name,
        type: kb?.type || mk?.type || '',
        // el brief sale del kit SOLO si el kit trae los hechos del negocio; si no, el del KSP.
        brief: (kit?.negocio ? mk?.brief : kb?.brief) || mk?.brief || kb?.brief,
        brandKit: mk?.brandKit || kb?.brandKit,
        screens: kb?.screens,
        contentType: 'combinado',
        formatoId: formato.id,
        ...(mk ? { mediaKitId: mk.mediaKitId, marcaKit: mk.marcaKit, cta: mk.cta, momentos: mk.momentos, pantallasKit: mk.pantallasKit } : {}),
      });
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

      <StepHeader n={2} label="Fuente de datos" tag="se importa vía KSP / media kit — sin formularios" />
      <div className="wz-grid wz-grid--apps">
        {fuentes.map((a) => (
          <AppOption key={a.id} a={a} selected={appId === a.id} onPick={() => setAppId(a.id)} />
        ))}
        {!fuentes.length && !err && <div className="wz-muted">Leyendo el registro de Integraciones…</div>}
      </div>

      {kitDelApp && <KitPreview resumen={kitDelApp} kit={kitData} />}

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

function AppOption({ a, selected, onPick }: { a: FuenteRow; selected: boolean; onPick: () => void }) {
  const kit = a.kit;
  const desc = a.soloKit ? 'Solo media kit · sin registro KSP' : a.ready ? 'Conectada · on-demand' : 'Pendiente';
  return (
    <button
      type="button"
      className={selected ? 'wz-app wz-app--on' : a.ready ? 'wz-app' : 'wz-app wz-app--off'}
      disabled={!a.ready}
      title={a.ready ? undefined : 'Sin servidor configurado ni media kit válido'}
      onClick={onPick}
    >
      <div className="wz-app-initial" style={{ background: appAccent(a.id) }}>{a.name[0]?.toUpperCase()}</div>
      <div className="wz-app-meta">
        <div className="wz-app-name">{a.name}</div>
        <div className="wz-app-desc">{desc}</div>
        {kit && (
          <div className={kit.valido ? 'wz-kit-badge' : 'wz-kit-badge wz-kit-badge--warn'}>
            <Images size={12} /> Media kit · {kit.pantallas} {kit.pantallas === 1 ? 'captura' : 'capturas'}
            {!kit.valido && ' (incompleto)'}
          </div>
        )}
      </div>
      {selected && <Check size={15} className="wz-app-check" />}
    </button>
  );
}

// La materia prima A LA VISTA antes de crear (pedido del dueño): las capturas REALES del kit en
// grilla chica + la ficha corta. Sin kit este bloque no se monta y el wizard queda como estaba.
function KitPreview({ resumen, kit }: { resumen: MediaKitResumen; kit: MediaKit | null }) {
  const pantallas = kit ? mediaKitToPantallas(kit) : [];
  return (
    <section className="wz-kit">
      <header className="wz-kit-h">
        <Images size={15} />
        <span className="wz-kit-title">Media kit de {resumen.app}</span>
        <span className="wz-kit-meta">
          {resumen.pantallas} capturas · {resumen.momentos} momentos
          {resumen.generado ? ` · generado ${resumen.generado}` : ''}
          {resumen.sinRegistro ? ' · sin registro KSP' : ''}
        </span>
      </header>
      {!resumen.valido && (
        <p className="wz-kit-warn">Kit incompleto (falta: {resumen.faltantes.join(', ')}). Se importa lo que haya.</p>
      )}
      {pantallas.length > 0 ? (
        <div className="wz-kit-shots">
          {pantallas.map((p) => (
            <figure key={p.archivo} className="wz-shot">
              <img src={p.url} alt={p.nombre} loading="lazy" />
              <figcaption>{p.nombre}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="wz-kit-warn">{kit ? 'El kit no trae capturas.' : 'Leyendo las capturas del kit…'}</p>
      )}
    </section>
  );
}
