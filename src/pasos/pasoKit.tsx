// Kit compartido de las pantallas de PASO del pipeline (Fase 2): el runner de moldes contra el
// backend + el shell visual común (título + Generar/Regenerar + Aprobar y seguir) + helpers.
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
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
        screens: project.screens || [],
        brand: project.brandKit,
        ...(formato ? { formato } : {}),   // strategy (nivel proyecto) lo lee de project.formato
      },
      piece: { ...piece, ...(formato ? { formato } : {}) },
    },
    options,
    model: effectiveModel(functionId),
    ...(regenerate ? { regenerate } : {}),
  };
  const r = await fetch(`${API_BASE}/api/run-function`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'no se pudo generar');
  return d.result as Record<string, unknown>;
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
  titulo: string; sub: string; hasContent: boolean; busy: boolean; onGenerate: () => void;
  generarLabel?: string; error?: string; children: ReactNode;
  onApprove?: () => void; canApprove?: boolean; approveLabel?: string;
  functionId?: string;   // id del molde (functionCatalog) — pinta el hint "IA: <modelo efectivo>" bajo el botón
  estado?: string;       // línea de estado/contexto del PIE (derivada del estado real vía estadoDelPaso)
}) {
  const modelHint = useEffectiveModel(functionId);
  const bloqueo = useContext(PasoGateCtx);
  const hayPie = !!(estado || onApprove);
  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">{titulo}</h2>
          <p className="paso-sub">{sub}</p>
        </div>
        <div className="paso-head-actions">
          <button
            className={hasContent && !busy ? 'paso-regen' : 'paso-gen'}
            onClick={onGenerate}
            disabled={busy || !!bloqueo}
            title={bloqueo || undefined}
          >
            {busy ? <Loader2 size={15} className="paso-spin" /> : hasContent ? <RefreshCw size={15} /> : <Wand2 size={15} />}
            {busy ? 'Generando…' : generarLabel || (hasContent ? 'Regenerar' : 'Generar con IA')}
          </button>
          {bloqueo
            ? <span className="paso-model-hint">{bloqueo}</span>
            : modelHint && <span className="paso-model-hint">IA: {modelHint}</span>}
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      {/* mientras genera, el cuerpo NO puede quedar en blanco: los pasos pintan su empty state con
          `!busy && <PasoEmpty/>`, así que durante los ~50s de la IA el panel quedaba vacío y parecía
          colgado. El aviso se agrega acá (una sola vez, para todos los pasos) en vez de repetirlo
          en cada pantalla — sólo cuando todavía no hay contenido que mirar. */}
      <div className="paso-body">
        {children}
        {busy && !hasContent && (
          <PasoEmpty icon={Loader2} spin>Generando con IA… esto puede tardar cerca de un minuto.</PasoEmpty>
        )}
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
