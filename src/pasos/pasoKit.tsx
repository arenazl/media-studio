// Kit compartido de las pantallas de PASO del pipeline (Fase 2): el runner de moldes contra el
// backend + el shell visual común (título + Generar/Regenerar + Aprobar y seguir) + helpers.
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Loader2, Wand2, RefreshCw, ArrowRight, type LucideIcon } from 'lucide-react';
import { API_BASE } from '../config';
import type { Project } from '../lib/projects';
import type { Comercial } from '../lib/comercial';
import { getFormato } from '../lib/formato';
import { effectiveModel, subscribeAiModel } from '../lib/settings';

export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : 'error');

// Props comunes a las pantallas de paso. `setComercial` crea el comercial si no existe (apply).
export interface PasoProps {
  project: Project;
  reelId: string;                    // el reel/comercial activo (lo usa el render del montaje)
  comercial: Comercial | undefined;
  setComercial: (updater: (c: Comercial) => Comercial) => void;
  goNext: () => void;
}

// Resuelve el formato de la pieza al shape que consumen los moldes del server (WO-2): aspecto/
// plataforma/durDefault. Sin formatoId → undefined (los moldes caen a sus defaults byte-idénticos).
function formatoPayload(formatoId?: string): { aspecto: string; plataforma: string; durDefault: number } | undefined {
  const f = getFormato(formatoId);
  return f ? { aspecto: f.aspecto, plataforma: f.plataforma, durDefault: f.duracion.default } : undefined;
}

// Corre UN molde del catálogo (Claude headless) con el context armado desde project + piece.
// `piece` lleva los artefactos previos SIN aplanar (concepto/guion/cast/storyboard) — los moldes
// del rework los leen directo de context.piece.<artefacto>. Si se pasa `comercial`, su formato se
// inyecta en piece.formato (parametriza los moldes por aspecto/plataforma — WO-2).
export async function runMolde(
  functionId: string,
  project: Project,
  piece: Record<string, unknown>,
  options: Record<string, unknown> = {},
  regenerate?: Record<string, unknown>,
  comercial?: Comercial,
  provider?: 'claude' | 'gemini',
): Promise<Record<string, unknown>> {
  const bk = project.brandKit as { phonetic?: string } | undefined;
  const formato = formatoPayload(comercial?.formatoId);
  const body = {
    functionId,
    context: {
      project: {
        name: project.name,
        phonetic: bk?.phonetic || project.name,
        brief: project.brief || '',
        kb: project.kb,              // Fase 2: el KB crudo → ProjectFacts en el back (sin esto, se parsea el brief)
        type: project.type || '',   // rubro del KB (business.industry): lo usa cast para la locación (P0.3)
        screens: project.screens || [],
        brand: project.brandKit,
        ...(formato ? { formato } : {}),
      },
      piece: { ...piece, ...(formato ? { formato } : {}) },
    },
    options,
    model: effectiveModel(functionId),
    // Fase 6: sin `provider` = auto-disparo o volver a la pantalla → puede leer caché. Con botón ('claude'|'gemini')
    // el dueño quiere algo NUEVO: nunca caché. Los ids van para el registro de corridas (Fase 9).
    cache: provider === undefined && !regenerate,
    projectId: project.id,
    pieceId: comercial?.id || '',
    ...(provider ? { provider } : {}),
    ...(regenerate ? { regenerate } : {}),
  };
  const r = await fetch(`${API_BASE}/api/run-function`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'no se pudo generar');
  // Fase 9 (diagnóstico en la UI): la última corrida de cada molde queda a la vista bajo el botón.
  publicarCorrida(functionId, {
    promptVersion: String(d.promptVersion || ''),
    cache: (d.cache as string) || '',
    validacionOk: d.validacion?.ok !== false,
    errores: Array.isArray(d.validacion?.errores) ? (d.validacion.errores as string[]) : [],
    reparado: !!d.validacion?.reparado,
    modelReal: String(d.meta?.modelReal || ''),
    durationMs: Number(d.meta?.durationMs) || 0,
    thinkingTokens: Number(d.meta?.thinkingTokens) || 0,
    costUsd: Number(d.meta?.costUsd) || 0,
  });
  return d.result as Record<string, unknown>;
}

// ── Última corrida por molde (Fase 9, diagnóstico): pub/sub mínimo, mismo patrón que settings ──
export interface CorridaMeta {
  promptVersion: string; cache: string; validacionOk: boolean; errores: string[]; reparado: boolean;
  modelReal: string; durationMs: number; thinkingTokens: number; costUsd: number;
}
const corridas = new Map<string, CorridaMeta>();
const corridaListeners = new Set<() => void>();
function publicarCorrida(functionId: string, meta: CorridaMeta) {
  corridas.set(functionId, meta);
  for (const fn of corridaListeners) fn();
}
function subscribeCorridas(fn: () => void) { corridaListeners.add(fn); return () => { corridaListeners.delete(fn); }; }
export function useUltimaCorrida(functionId?: string): CorridaMeta | undefined {
  return useSyncExternalStore(subscribeCorridas, () => (functionId ? corridas.get(functionId) : undefined));
}
// Texto corto para la UI: "opus · 17 s · validado" / "caché" / "2 problemas, reparado"
export function corridaResumen(c: CorridaMeta): { texto: string; alerta: boolean } {
  if (c.cache === 'hit') return { texto: 'de caché, sin llamar a la IA', alerta: false };
  const modelo = c.modelReal.replace(/^claude-/, '').replace(/-\d{8}$/, '');
  const seg = c.durationMs ? `${Math.round(c.durationMs / 1000)} s` : '';
  const base = [modelo, seg].filter(Boolean).join(' · ');
  if (!c.validacionOk) return { texto: `${base} · ${c.errores.length} problema${c.errores.length === 1 ? '' : 's'} sin resolver`, alerta: true };
  if (c.reparado) return { texto: `${base} · reparado al segundo intento`, alerta: false };
  return { texto: `${base} · validado`, alerta: false };
}

// se suscribe al ajuste de modelo (settings.ts) para que el hint se repinte EN VIVO al cambiarlo
// desde el popover de la Topbar, sin esperar un F5 (árboles de componentes distintos → sin esto
// quedaba stale: localStorage cambiaba pero nada disparaba un re-render acá).
function useEffectiveModel(functionId: string | undefined) {
  return useSyncExternalStore(subscribeAiModel, () => (functionId ? effectiveModel(functionId) : undefined));
}

// GATE del paso, en profundidad. El spine ya deshabilita los pasos cerrados, pero el panel es un
// componente aparte: si por lo que fuera se muestra un paso cerrado (aterrizaje, estado que cambia
// bajo los pies), su botón "Generar con IA" seguía vivo y un click salteaba el gate. El Pipeline
// envuelve el panel con <PasoGate motivo="…"> y PasoShell cierra el botón con ese motivo de hint.
// El contexto queda PRIVADO del módulo a propósito (el provider es la única API pública).
const PasoGateCtx = createContext<string>('');

export function PasoGate({ motivo, children }: { motivo: string; children: ReactNode }) {
  return <PasoGateCtx.Provider value={motivo}>{children}</PasoGateCtx.Provider>;
}

export function PasoShell({
  titulo, sub, hasContent, busy, onGenerate, generarLabel, error, children, onApprove, canApprove, approveLabel, functionId, estado,
}: {
  titulo: string; sub: string; hasContent: boolean; busy: boolean;
  onGenerate: (provider?: 'claude' | 'gemini') => void;
  generarLabel?: string; error?: string; children: ReactNode;
  onApprove?: () => void; canApprove?: boolean; approveLabel?: string;
  functionId?: string;   // id del molde (functionCatalog) — pinta el hint "IA: <modelo efectivo>" bajo el botón
  estado?: string;       // línea de estado/contexto del PIE (derivada del estado real vía estadoDelPaso)
}) {
  const modelHint = useEffectiveModel(functionId);
  const corrida = useUltimaCorrida(functionId);
  const bloqueo = useContext(PasoGateCtx);
  const hayPie = !!(estado || onApprove);
  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">{titulo}</h2>
          <p className="paso-sub">{sub}</p>
        </div>
        <div className="paso-head-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={hasContent && !busy ? 'paso-regen' : 'paso-gen'}
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFF' }}
            onClick={() => onGenerate('claude')}
            disabled={busy || !!bloqueo}
            title={bloqueo || 'Generar plan con Claude AI (Sonnet/Opus)'}
          >
            {busy ? <Loader2 size={15} className="paso-spin" /> : hasContent ? <RefreshCw size={15} /> : <Wand2 size={15} />}
            {busy ? 'Generando…' : hasContent ? 'Re-Plan Claude' : 'Plan Claude'}
          </button>

          <button
            className={hasContent && !busy ? 'paso-regen' : 'paso-gen'}
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF' }}
            onClick={() => onGenerate('gemini')}
            disabled={busy || !!bloqueo}
            title={bloqueo || 'Generar plan con Google Gemini AI (1.5 Pro / 2.0 Flash)'}
          >
            {busy ? <Loader2 size={15} className="paso-spin" /> : hasContent ? <RefreshCw size={15} /> : <Wand2 size={15} />}
            {busy ? 'Generando…' : hasContent ? 'Re-Plan Gemini' : 'Plan Gemini'}
          </button>

          {bloqueo
            ? <span className="paso-model-hint">{bloqueo}</span>
            : modelHint && <span className="paso-model-hint">IA: {modelHint}</span>}
          {corrida && !busy && (() => { const r = corridaResumen(corrida); return (
            <span className={r.alerta ? 'paso-corrida paso-corrida--alerta' : 'paso-corrida'} title={corrida.errores.join('\n') || corrida.promptVersion}>
              {r.texto}
            </span>
          ); })()}
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      {/* mientras genera, el cuerpo NO puede quedar en blanco: los pasos pintan su empty state con
          `!busy && <PasoEmpty/>`, así que durante los ~50s de la IA el panel quedaba vacío y parecía
          colgado. El aviso se agrega acá (una sola vez, para todos los pasos) en vez de repetirlo
          en cada pantalla — sólo cuando todavía no hay contenido que mirar. */}
      <div className="paso-body">
        {children}
        {busy && !hasContent && <PasoProgreso functionId={functionId} />}
      </div>
      {hayPie && (
        <div className={`paso-foot${estado ? ' paso-foot--split' : ''}`}>
          {estado && <span className="paso-estado">{estado}</span>}
          {onApprove && (
            <button className="paso-approve" disabled={!canApprove} onClick={onApprove}>
              {approveLabel || 'Aprobar y seguir'} <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Progreso "de película" mientras la IA escribe (dueño, 2026-10-07) ─────────────────────────
// El spinner con "puede tardar cerca de un minuto" no decía nada. Esto muestra una TIRA DE PELÍCULA
// que avanza, la etapa en la que está el molde ("Escena 2/4 · Escribiendo tres ideas distintas") y
// el reloj. El avance es ASINTÓTICO sobre la duración esperada del molde: llega al ~80% en el tiempo
// típico y se arrastra hasta 96% si tarda más (nunca miente con un 100% que no es). Las etapas son
// narrativas, no reales: el CLI no reporta progreso. Si se pasa 1.6x del tiempo típico, lo dice.
const PROGRESO: Record<string, { seg: number; etapas: string[] }> = {
  concept:    { seg: 25, etapas: ['Leyendo el brief del negocio', 'Buscando el ángulo de esta pieza', 'Escribiendo tres ideas distintas', 'Puliendo los remates'] },
  script:     { seg: 50, etapas: ['Releyendo el concepto elegido', 'Armando el gancho de los primeros 2 segundos', 'Escribiendo el desarrollo y el remate', 'Calibrando la narración para la voz'] },
  cast:       { seg: 45, etapas: ['Leyendo el guion', 'Eligiendo a los personajes', 'Describiéndolos para la cámara', 'Buscando la locación del rubro'] },
  storyboard: { seg: 70, etapas: ['Leyendo el guion y el cast', 'Cortando el guion en escenas', 'Definiendo planos y duraciones', 'Escribiendo los diálogos', 'Revisando la continuidad'] },
  flowpack:   { seg: 90, etapas: ['Leyendo el storyboard', 'Fijando el estilo global', 'Armando los retratos de los personajes', 'Escribiendo el prompt de cada escena', 'Traduciendo y ajustando a Flow'] },
  strategy:   { seg: 60, etapas: ['Leyendo el brief', 'Definiendo el posicionamiento', 'Segmentando el público', 'Armando las piezas de la campaña'] },
  publish:    { seg: 20, etapas: ['Leyendo el guion', 'Escribiendo el caption', 'Eligiendo hashtags'] },
  qa:         { seg: 35, etapas: ['Leyendo el comercial entero', 'Puntuando los 10 ejes', 'Anotando qué ajustar'] },
  default:    { seg: 45, etapas: ['Leyendo el material', 'Escribiendo', 'Revisando'] },
};

export function PasoProgreso({ functionId }: { functionId?: string }) {
  const cfg = PROGRESO[functionId || ''] || PROGRESO.default;
  const [seg, setSeg] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setSeg((Date.now() - t0) / 1000), 250);
    return () => clearInterval(id);
  }, []);
  const pct = Math.min(96, Math.round((1 - Math.exp(-seg / (cfg.seg * 0.6))) * 100));
  const n = cfg.etapas.length;
  const idx = Math.min(n - 1, Math.floor((seg / cfg.seg) * n));
  const tarde = seg > cfg.seg * 1.6;
  const mm = Math.floor(seg / 60), ss = Math.floor(seg % 60);
  return (
    <div className="paso-progreso" role="status" aria-live="polite">
      <div className="paso-progreso-head">
        <span className="paso-progreso-escena">Escena {idx + 1} / {n}</span>
        <span className="paso-progreso-reloj">{mm}:{String(ss).padStart(2, '0')}</span>
      </div>
      <div className="paso-progreso-tira">
        <div className="paso-progreso-fill" style={{ width: `${pct}%` }} />
        <div className="paso-progreso-cabezal" style={{ left: `${pct}%` }} />
      </div>
      <div className="paso-progreso-etapa">{cfg.etapas[idx]}<span className="paso-progreso-puntos" /></div>
      <div className="paso-progreso-sub">
        {tarde ? 'Está tardando más de lo habitual para este paso. Sigue escribiendo.' : `La IA escribe la respuesta entera antes de mostrarla · suele llevar ${cfg.seg < 60 ? `${cfg.seg} segundos` : `${Math.round(cfg.seg / 60 * 10) / 10} minutos`}`}
      </div>
    </div>
  );
}

// Empty state diseñado (icono lucide grande + una línea de qué es el paso). El CTA vive en el header.
// `--full` = ocupa el cuerpo del panel y centra vertical (no una caja perdida en un océano).
// `spin` gira el icono (reusa la animación del botón) → el mismo bloque sirve de estado "generando".
export function PasoEmpty({ icon: Icon, children, spin }: { icon: LucideIcon; children: ReactNode; spin?: boolean }) {
  return (
    <div className="paso-empty paso-empty--full">
      <Icon size={34} strokeWidth={1.5} className={spin ? 'paso-empty-ico paso-spin' : 'paso-empty-ico'} />
      <span>{children}</span>
    </div>
  );
}

// input inline autoguardable (textarea que crece); dispara onChange en cada tecla (el Pipeline debouncea el save).
export function InlineEdit({ value, onChange, rows = 2, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      className="paso-inline"
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
