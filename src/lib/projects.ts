// Store de PROYECTOS (multi-tenant). localStorage-first (anda sin backend). AGNÓSTICO:
// el contenido (guiones, screenshots) vive EN el proyecto, no hardcodeado. El proyecto
// de ejemplo (data/demoFitpass) es solo un DEMO, cargado por el mismo camino que
// cualquier cliente. El core no asume Munify.
import type { ContentType } from '../NewProjectWizard';
import { fitpassProject } from '../data/demoFitpass';
import type { BrandKit } from './brandKit';
import type { MontageSnapshot } from './montageStore';
import type { Comercial } from './comercial';
import { API_BASE } from '../config';

// un recorte del audio real (locutor) — metadata; el blob vive en IndexedDB por reel.
export interface AudioSegment {
  id: string;
  label: string;        // "Hook", "CTA", "Frase 2"…
  startSec: number;     // inicio dentro del audio real
  endSec: number;       // fin dentro del audio real
  phraseIndex?: number; // a qué frase/bloque del guion va
}

// settings de voz por reel (lo que persiste el botón "Grabar").
export interface VoiceConfig {
  voice_id: string;
  stability: number;
  similarity: number;
  style: number;
  speed: number;
  model: string;
  markers?: unknown[];
  text?: string;
  audioMode?: 'tts' | 'real';   // sintética (default) o locutor real (subido/grabado)
  segments?: AudioSegment[];    // recortes del audio real (modo 'real')
}
// Material que produce el panel de skills (promo-kit) por pieza — TODO opcional, para no
// perder lo generado (mockups, prompts Veo, copy de publicación, QA). El editor lo usa de
// guía; nada de esto es requerido para un reel cargado a mano.
export interface ReelKitMeta {
  objetivo?: string;             // awareness | consideracion | conversion
  angulo?: string;               // el ángulo de la pieza
  durationSec?: number;          // duración objetivo de la pieza
  visualHints?: string[];        // guía visual por frase (blocks[].visual)
  musicMood?: string;            // mood de la música sugerido
  videoPrompts?: unknown[];      // prompts Veo/Flow (template A/B/C)
  slides?: unknown[];            // spec de mockups (framing 9:16, highlight, copy)
  publish?: { hookOnScreen?: string; caption?: string; hashtags?: string[]; cta?: string };
  qa?: { score?: number; verdict?: string };
}
export interface ProjectReel extends ReelKitMeta {
  id: string;
  nombre: string;
  frases: number;                // = guion.length (para display/contadores)
  guion: string[];               // los textos de las frases — VIVEN en el proyecto (agnóstico)
  slidesRef?: string | null;     // boceto/animación base (video) para el preview
  voiceConfig?: VoiceConfig | null;
  demoMontage?: MontageSnapshot; // montaje precompuesto (demo) — el editor lo usa si no hay uno guardado
  comercial?: Comercial;         // rework: el comercial del pipeline (aditivo; los campos legacy quedan)
}
export interface Project {
  id: string;
  name: string;
  type: string;
  preloaded?: boolean;           // viene precargado (ej. el demo)
  contentType?: ContentType;     // configura el layout: reels | video | audio | combinado
  brief?: string;                // MD del negocio (input agnóstico)
  screenshots?: string[];        // capturas del producto (legacy)
  screens?: unknown[];           // metadata de pantallas del KB 1.2 (kind/components/data…) → reel animado
  brandKit?: BrandKit;           // marca del proyecto (logo/color/fonética) — agnóstico
  reels: ProjectReel[];
  created_at: number;
  updated_at: number;
}

const LS_KEY = 'ms.projects.v3';   // v3: reset — arranca limpio (el Munify viejo queda fuera)

// migración/normalización: garantiza que cada reel tenga `guion` (datos viejos sin él).
const normReel = (r: ProjectReel): ProjectReel => {
  const guion = Array.isArray(r.guion) ? r.guion : [];
  return { ...r, guion, frases: guion.length || r.frases || 0 };
};
const normProject = (p: Project): Project => ({ ...p, reels: (p.reels ?? []).map(normReel) });

const SEED_FLAG = 'ms.seeded.v4';   // v4: borra los demos Munify viejos (kit real + demo municipal)
const STALE_DEMO_IDS = ['munify', 'munify-kit'];   // los Munify que hay que sacar del localStorage
function ensureDemos(ps: Project[]): Project[] {
  try {
    if (localStorage.getItem(SEED_FLAG)) return ps;
    localStorage.setItem(SEED_FLAG, '1');
    let out = ps.filter((p) => !STALE_DEMO_IDS.includes(p.id));   // borra los Munify viejos
    if (!out.some((p) => p.id === 'fitpass')) out = [...out, fitpassProject()];
    persist(out);
    return out;
  } catch { return ps; }
}

function load(): Project[] {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return ensureDemos((JSON.parse(raw) as Project[]).map(normProject)); } catch { /* noop */ }
  const seed = [fitpassProject()];
  persist(seed);
  return seed;
}
function persist(ps: Project[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(ps)); } catch { /* noop */ } }

// DUAL-WRITE: además de localStorage, empuja el proyecto al backend (SQLite) sin bloquear ni
// romper si el server no está (la app es local y anda solo con localStorage). El proyecto ENTERO
// va como `data`; el server lo upsertea por id (POST /api/projects, sin id en el path).
function syncToServer(proj: Project) {
  try {
    void fetch(`${API_BASE}/api/projects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: proj.id, name: proj.name, data: proj }),
    }).catch(() => { /* server opcional */ });
  } catch { /* noop */ }
}
function syncDeleteServer(id: string) {
  try { void fetch(`${API_BASE}/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {}); } catch { /* noop */ }
}

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function listProjects(): Project[] {
  return load().sort((a, b) => b.updated_at - a.updated_at);
}
export function getProject(id: string): Project | undefined {
  return load().find((p) => p.id === id);
}
export function saveProject(input: { id?: string; name: string; type?: string; preloaded?: boolean; contentType?: ContentType; brief?: string; screenshots?: string[]; screens?: unknown[]; brandKit?: BrandKit; reels?: ProjectReel[] }): Project {
  const ps = load();
  const id = input.id || `${slug(input.name) || 'proj'}-${Date.now().toString(36).slice(-4)}`;
  const existing = ps.find((p) => p.id === id);
  const now = Date.now();
  const proj: Project = {
    id, name: input.name.trim() || 'Proyecto sin nombre', type: (input.type || '').trim(),
    preloaded: input.preloaded ?? existing?.preloaded ?? false,
    contentType: input.contentType ?? existing?.contentType,
    brief: input.brief ?? existing?.brief,
    screenshots: input.screenshots ?? existing?.screenshots,
    screens: input.screens ?? existing?.screens,
    brandKit: input.brandKit ?? existing?.brandKit,
    reels: (input.reels ?? existing?.reels ?? []).map(normReel),
    created_at: existing?.created_at ?? now, updated_at: now,
  };
  persist(existing ? ps.map((p) => (p.id === id ? proj : p)) : [...ps, proj]);
  syncToServer(proj);
  return proj;
}
export function deleteProject(id: string) { persist(load().filter((p) => p.id !== id)); syncDeleteServer(id); }

// HIDRATACIÓN server-first (read-side del dual-write): mergea los proyectos del server con los
// locales — gana el de `updated_at` más nuevo — y persiste el resultado en localStorage. NO
// re-sincroniza al server (evita loops). La usa el hook useProjects al montar.
export function mergeServerProjects(serverProjects: Project[]): Project[] {
  const byId = new Map(load().map((p) => [p.id, p]));
  for (const sp of serverProjects) {
    if (!sp || !sp.id) continue;
    const local = byId.get(sp.id);
    if (!local || (sp.updated_at || 0) > (local.updated_at || 0)) byId.set(sp.id, normProject(sp));
  }
  const merged = Array.from(byId.values()).sort((a, b) => b.updated_at - a.updated_at);
  persist(merged);
  return merged;
}
