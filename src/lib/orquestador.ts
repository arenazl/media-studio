// Orquestador (2026-10-10): qué pieza (`piece`) y qué opciones arma cada paso para su molde. Es el ESPEJO de lo que
// hacen PasoConcepto, PasoGuion, PasoCast, PasoStoryboard y PasoPack al generar, puesto en un solo lugar para que el
// Orquestador muestre el mismo prompt que se manda. Si un paso cambia su pieza, se cambia acá también (pendiente:
// que los pasos consuman esta misma función para que no puedan divergir).
import type { Project } from './projects';
import type { Comercial } from './comercial';
import { mediaKitParaMolde } from './mediaKit';

export type MoldeId = 'concept' | 'script' | 'cast' | 'storyboard' | 'flowpack';

export const MOLDES: { id: MoldeId; paso: string; label: string }[] = [
  { id: 'concept', paso: 'concepto', label: 'Concepto' },
  { id: 'script', paso: 'guion', label: 'Guion' },
  { id: 'cast', paso: 'cast', label: 'Cast' },
  { id: 'storyboard', paso: 'storyboard', label: 'Storyboard' },
  { id: 'flowpack', paso: 'pack', label: 'Pack de Flow' },
];

export function moldeDelPaso(paso: string): MoldeId {
  return MOLDES.find((m) => m.paso === paso)?.id || 'concept';
}

const eleccion = (c: Comercial | undefined) => ({
  enfoque: c?.enfoque || 'caso',
  tratamiento: c?.tratamiento || 'natural',
  intensidadHumor: c?.intensidadHumor || 'sutil',
  recursoHumorId: c?.recursoHumorId || 'auto',
});

export function piezaYOpciones(molde: MoldeId, project: Project, comercial: Comercial | undefined): { piece: Record<string, unknown>; options: Record<string, unknown> } {
  const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
  const tipo = comercial?.tipo ?? 'filmado';
  const durationSec = (comercial as unknown as { durationSec?: number })?.durationSec || 20;
  const el = eleccion(comercial);
  switch (molde) {
    case 'concept':
      return {
        piece: { angulo: comercial?.angulo || comercial?.titulo || '', creativeBrief: comercial?.creativeBrief || '', messageScope: comercial?.messageScope, primaryMessage: comercial?.primaryMessage, durationSec: 20, tipo, ...el, cierreMarca: comercial?.cierreMarca || '', ...(mediaKit ? { mediaKit } : {}) },
        options: { perfil: 'campaña', ...el },
      };
    case 'script':
      return {
        piece: { concepto: comercial?.concepto, durationSec, tipo, messageScope: comercial?.messageScope, primaryMessage: comercial?.primaryMessage, supportingFacts: comercial?.supportingFacts, enfoque: el.enfoque, tratamiento: el.tratamiento, ...(mediaKit ? { mediaKit } : {}) },
        options: { tono: 'cercano' },
      };
    case 'cast':
      return { piece: { concepto: comercial?.concepto, guion: comercial?.guion, enfoque: el.enfoque, tratamiento: el.tratamiento }, options: {} };
    case 'storyboard':
      return { piece: { guion: comercial?.guion, cast: comercial?.cast, tipo, durationSec, enfoque: el.enfoque, tratamiento: el.tratamiento, ...(mediaKit ? { mediaKit } : {}) }, options: {} };
    case 'flowpack':
      return { piece: { storyboard: comercial?.storyboard, cast: comercial?.cast }, options: {} };
  }
}

export interface CapaPrompt { n: number; titulo: string; naturaleza: 'estatico' | 'preset' | 'dinamico'; origen: string; texto: string; palabras: number }
export interface CapasRespuesta { functionId: string; promptVersion: string; mode?: string; compilado: boolean; prompt: string; capas: CapaPrompt[]; chips: { k: string; v: string }[]; totalPalabras: number }
