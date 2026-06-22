// Proyecto DEMO "Munify" — es DATA, no core. Demuestra el producto usando el modelo
// AGNÓSTICO (el guion vive en cada reel). Cualquier otro cliente entra por el MISMO
// camino: brief + screenshots + preset → reels con su guion. La app no asume Munify.
import type { Project, ProjectReel } from '../lib/projects';
import { NARRATION } from './narrationText';

const DEMO_LABELS: Record<string, string> = {
  tour: 'Tour general', vecino: 'Para el vecino', intendente: 'Para el intendente',
  tesoreria: 'Tesorería', ia: 'Atención con IA',
};

export function demoReels(): ProjectReel[] {
  return Object.keys(NARRATION).map((id) => ({
    id,
    nombre: DEMO_LABELS[id] || id,
    guion: NARRATION[id],
    frases: NARRATION[id].length,
    slidesRef: `/bocetos/${id}.mp4`,
    voiceConfig: null,
  }));
}

export function demoProject(): Project {
  const t = Date.now();
  return {
    id: 'munify', name: 'Munify', type: 'Municipal (SaaS)',
    preloaded: true, contentType: 'combinado',
    brief: 'Proyecto de ejemplo. Software de gestión municipal: reclamos, trámites y tesorería en una app.',
    reels: demoReels(),
    created_at: t, updated_at: t,
  };
}
