// Store de PROYECTOS (multi-tenant). localStorage-first para que ande sin backend
// (el user trabaja por escritorio remoto). El backend /api/projects + el esquema
// por-proyecto los define INFRA (ver APP_AGENT.md → Pedidos). Cuando esté, se
// migra este store a leer/escribir contra /api/projects.
import { NARRATION } from '../data/narrationText';
import type { ContentType } from '../NewProjectWizard';

// settings de voz por reel (lo que persiste el botón "Grabar").
// Esquema confirmado por INFRA: va dentro de data.reels[].voiceConfig.
export interface VoiceConfig {
  voice_id: string;
  stability: number;
  similarity: number;
  style: number;
  speed: number;
  model: string;
  markers?: unknown[];   // PlacedMarker[] del editor
  text?: string;         // texto asociado (el guión editado)
}
export interface ProjectReel {
  id: string;
  nombre: string;
  frases: number;
  slidesRef?: string | null;     // boceto del reel (video) para el preview
  voiceConfig?: VoiceConfig | null;
}
export interface Project {
  id: string;
  name: string;
  type: string;
  preloaded?: boolean;        // viene con reels base (ej. Munify)
  contentType?: ContentType;  // configura el layout: reels | video | audio | combinado
  reels: ProjectReel[];
  created_at: number;
  updated_at: number;
}

const LS_KEY = 'ms.projects.v1';
const REEL_LABELS: Record<string, string> = { tour: 'Tour general', vecino: 'Para el vecino', intendente: 'Para el intendente', tesoreria: 'Tesorería', ia: 'Atención con IA' };

export const munifyBaseReels = (): ProjectReel[] =>
  Object.keys(NARRATION).map((id) => ({ id, nombre: REEL_LABELS[id] || id, frases: NARRATION[id].length, slidesRef: `/bocetos/${id}.mp4`, voiceConfig: null }));

const munifySeed = (): Project => {
  const t = Date.now();
  return { id: 'munify', name: 'Munify', type: 'Municipal (SaaS)', preloaded: true, reels: munifyBaseReels(), created_at: t, updated_at: t };
};

function load(): Project[] {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) as Project[]; } catch { /* noop */ }
  const seed = [munifySeed()];
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
export function saveProject(input: { id?: string; name: string; type?: string; preloaded?: boolean; contentType?: ContentType; reels?: ProjectReel[] }): Project {
  const ps = load();
  const id = input.id || `${slug(input.name) || 'proj'}-${Date.now().toString(36).slice(-4)}`;
  const existing = ps.find((p) => p.id === id);
  const now = Date.now();
  const proj: Project = {
    id, name: input.name.trim() || 'Proyecto sin nombre', type: (input.type || '').trim(),
    preloaded: input.preloaded ?? existing?.preloaded ?? false,
    contentType: input.contentType ?? existing?.contentType,
    reels: input.reels ?? existing?.reels ?? [],
    created_at: existing?.created_at ?? now, updated_at: now,
  };
  persist(existing ? ps.map((p) => (p.id === id ? proj : p)) : [...ps, proj]);
  return proj;
}
export function deleteProject(id: string) { persist(load().filter((p) => p.id !== id)); }
