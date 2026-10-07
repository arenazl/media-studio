// Tipos de server/projectFacts.mjs para el front TypeScript.
export interface ProjectFacts {
  name: string; tagline: string; description: string; valueStory: string; industry: string; targetAudience: string;
  keyMessages: string[];
  offerings: Array<{ name: string; description: string; features: string[] }>;
  differentiators: string[];
  objections: Array<{ objection: string; response: string }>;
  pricing: { summary: string; promotions: string[] };
  doNotSay: string[];
  screens: unknown[];
  source: 'kb' | 'brief' | 'brief-libre';
  rawBrief?: string;
}
export type Seccion = 'negocio' | 'mensajes' | 'ofrece' | 'diferenciadores' | 'objeciones' | 'oferta' | 'evitar';
export const SECCIONES_TODAS: Seccion[];
export function factsFromKb(kb: unknown): ProjectFacts;
export function factsFromBrief(brief: string | undefined, name?: string): ProjectFacts;
export function buildProjectFacts(project: { name?: string; type?: string; brief?: string; kb?: unknown; screens?: unknown[] }): ProjectFacts;
export function factsText(f: ProjectFacts, secciones?: Seccion[]): string;
