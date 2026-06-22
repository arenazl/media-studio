// Secciones del proyecto, en ORDEN DE USO (insumos → armado): Audio · Prompts ·
// Videos · Editor. El Editor es el integrador (default al abrir). Antes esto vivía en
// Sidebar; ahora la navegación es una topbar y la lógica vive acá (neutral).
import { Mic, Wand2, Video, Clapperboard } from 'lucide-react';
import type { Project } from './projects';
import type { ContentType } from '../NewProjectWizard';

export type Section = 'audio' | 'prompts' | 'videos' | 'editor';

export const ALL_SECTIONS: { id: Section; label: string; Icon: typeof Mic }[] = [
  { id: 'audio',   label: 'Audio',   Icon: Mic },
  { id: 'prompts', label: 'Prompts', Icon: Wand2 },
  { id: 'videos',  label: 'Videos',  Icon: Video },
  { id: 'editor',  label: 'Editor',  Icon: Clapperboard },
];

const LAYOUT: Record<ContentType, Section[]> = {
  reels:     ['audio', 'prompts', 'videos', 'editor'],
  video:     ['audio', 'videos', 'prompts', 'editor'],
  audio:     ['audio'],
  combinado: ['audio', 'prompts', 'videos', 'editor'],
};

export function sectionsFor(p: Project | null) {
  if (!p?.contentType) return ALL_SECTIONS;
  const ids = LAYOUT[p.contentType];
  return ALL_SECTIONS.filter((s) => ids.includes(s.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

// al abrir un proyecto se cae en el EDITOR (el integrador); si no aplica, la primera.
export function defaultSection(p: Project | null): Section {
  const secs = sectionsFor(p);
  return secs.find((s) => s.id === 'editor')?.id ?? secs[0]?.id ?? 'editor';
}
