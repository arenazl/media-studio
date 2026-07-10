// Secciones del proyecto, en ORDEN DE USO (insumos → armado): Audio · Videos · Editor.
// El Editor es el integrador (default al abrir). Antes esto vivía en Sidebar; ahora la
// navegación es una topbar y la lógica vive acá (neutral).
import { Mic, Video, Clapperboard, Building2, Workflow } from 'lucide-react';
import type { Project } from './projects';
import type { ContentType } from '../NewProjectWizard';

// 'pipeline' = el PROCESO de producción del comercial (rework, Fase 2): el camino principal.
// Las demás (audio/videos/editor) quedan como herramientas hasta que las absorba el pipeline.
export type Section = 'pipeline' | 'negocio' | 'audio' | 'videos' | 'editor';

export const ALL_SECTIONS: { id: Section; label: string; Icon: typeof Mic }[] = [
  { id: 'pipeline', label: 'Comercial', Icon: Workflow },
  { id: 'negocio', label: 'Negocio', Icon: Building2 },
  { id: 'audio',   label: 'Audio',   Icon: Mic },
  { id: 'videos',  label: 'Videos',  Icon: Video },
  { id: 'editor',  label: 'Editor',  Icon: Clapperboard },
];

const LAYOUT: Record<ContentType, Section[]> = {
  reels:     ['pipeline', 'negocio', 'audio', 'videos', 'editor'],
  video:     ['pipeline', 'negocio', 'audio', 'videos', 'editor'],
  audio:     ['negocio', 'audio'],
  combinado: ['pipeline', 'negocio', 'audio', 'videos', 'editor'],
};

export function sectionsFor(p: Project | null) {
  if (!p?.contentType) return ALL_SECTIONS;
  const ids = LAYOUT[p.contentType];
  return ALL_SECTIONS.filter((s) => ids.includes(s.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

// al abrir un proyecto se cae en el PIPELINE (el proceso); si no aplica, la primera.
export function defaultSection(p: Project | null): Section {
  const secs = sectionsFor(p);
  return secs.find((s) => s.id === 'pipeline')?.id ?? secs[0]?.id ?? 'pipeline';
}
