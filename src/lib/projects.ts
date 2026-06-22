// Store de PROYECTOS (multi-tenant). localStorage-first (anda sin backend). AGNÓSTICO:
// el contenido (guiones, screenshots) vive EN el proyecto, no hardcodeado. El proyecto
// "Munify" es solo un EJEMPLO/demo (data/demoProject), cargado por el mismo camino que
// cualquier cliente. El core no asume Munify.
import type { ContentType } from '../NewProjectWizard';
import { demoProject } from '../data/demoProject';
import { fitpassProject } from '../data/demoFitpass';
import type { BrandKit } from './brandKit';

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
export interface ProjectReel {
  id: string;
  nombre: string;
  frases: number;                // = guion.length (para display/contadores)
  guion: string[];               // los textos de las frases — VIVEN en el proyecto (agnóstico)
  slidesRef?: string | null;     // boceto/animación base (video) para el preview
  voiceConfig?: VoiceConfig | null;
}
export interface Project {
  id: string;
  name: string;
  type: string;
  preloaded?: boolean;           // viene precargado (ej. el demo)
  contentType?: ContentType;     // configura el layout: reels | video | audio | combinado
  brief?: string;                // MD del negocio (input agnóstico)
  screenshots?: string[];        // capturas del producto (para los mockups)
  brandKit?: BrandKit;           // marca del proyecto (logo/color/fonética) — agnóstico
  reels: ProjectReel[];
  created_at: number;
  updated_at: number;
}

const LS_KEY = 'ms.projects.v2';

// migración/normalización: garantiza que cada reel tenga `guion` (datos viejos sin él).
const normReel = (r: ProjectReel): ProjectReel => {
  const guion = Array.isArray(r.guion) ? r.guion : [];
  return { ...r, guion, frases: guion.length || r.frases || 0 };
};
const normProject = (p: Project): Project => ({ ...p, reels: (p.reels ?? []).map(normReel) });

const SEED_FLAG = 'ms.seeded.v2';   // inyecta los demos nuevos UNA sola vez (respeta borrados del usuario)
// para usuarios que ya tenían solo Munify: suma el demo FitPass una vez (flag), sin re-agregarlo si lo borran.
function ensureDemos(ps: Project[]): Project[] {
  try {
    if (localStorage.getItem(SEED_FLAG)) return ps;
    localStorage.setItem(SEED_FLAG, '1');
    if (ps.some((p) => p.id === 'fitpass')) return ps;
    const out = [...ps, fitpassProject()];
    persist(out);
    return out;
  } catch { return ps; }
}

function load(): Project[] {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return ensureDemos((JSON.parse(raw) as Project[]).map(normProject)); } catch { /* noop */ }
  const seed = [demoProject(), fitpassProject()];
  persist(seed);
  return seed;
}
function persist(ps: Project[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(ps)); } catch { /* noop */ } }

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function listProjects(): Project[] {
  return load().sort((a, b) => b.updated_at - a.updated_at);
}
export function getProject(id: string): Project | undefined {
  return load().find((p) => p.id === id);
}
export function saveProject(input: { id?: string; name: string; type?: string; preloaded?: boolean; contentType?: ContentType; brief?: string; screenshots?: string[]; brandKit?: BrandKit; reels?: ProjectReel[] }): Project {
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
    brandKit: input.brandKit ?? existing?.brandKit,
    reels: (input.reels ?? existing?.reels ?? []).map(normReel),
    created_at: existing?.created_at ?? now, updated_at: now,
  };
  persist(existing ? ps.map((p) => (p.id === id ? proj : p)) : [...ps, proj]);
  return proj;
}
export function deleteProject(id: string) { persist(load().filter((p) => p.id !== id)); }
