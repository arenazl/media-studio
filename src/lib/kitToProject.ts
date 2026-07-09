// GAP A del pipeline: el KIT que produce el panel de skills (workflow promo-kit) → reels de
// un proyecto, para que lo generado (guion, mockups, prompts Veo, copy, QA) quede USABLE en
// el editor. Es el puente que faltaba entre "orquestar la campaña" y "editar/renderizar".
//
// Forma del kit (output de .claude/workflows/promo-kit.js): { project, profile, positioning,
// audiences, pieces[] }. Cada pieza trae el guion por bloques + assets. Acá lo aplanamos al
// shape que el editor ya consume (ProjectReel: guion[] + metadata).
import type { Project, ProjectReel } from './projects';
import type { BrandKit } from './brandKit';

export interface KitBlock { role?: string; narration: string; visual?: string }
export interface KitScript { blocks: KitBlock[]; music?: { mood?: string } }
export interface KitPublish { hookOnScreen?: string; caption?: string; hashtags?: string[]; cta?: string }
export interface KitQA { score?: number; verdict?: string; issues?: { severity?: string; note?: string }[] }
export interface KitPiece {
  id: string;
  objective?: string;
  angle?: string;
  format?: string;
  platforms?: string[];
  durationSec?: number;
  script: KitScript;
  slides?: unknown[];
  videoPrompts?: unknown[];
  narration?: { mode?: string; text?: string };
  publish?: KitPublish;
  qa?: KitQA;
}
export interface Kit {
  project: string;
  profile?: string;
  positioning?: string;
  audiences?: { label: string; pain?: string; language?: string }[];
  pieces: KitPiece[];
}

// limpia y arma las frases del guion desde los bloques de la pieza.
function guionFromPiece(piece: KitPiece): string[] {
  return (piece.script?.blocks || [])
    .map((b) => (b?.narration || '').trim())
    .filter(Boolean);
}

// una pieza del kit → un reel del proyecto. El guion son las narraciones; el resto del
// material (mockups, prompts, publish, QA, guía visual) viaja como metadata opcional.
export function pieceToReel(piece: KitPiece): ProjectReel {
  const guion = guionFromPiece(piece);
  return {
    id: piece.id,
    nombre: piece.angle || piece.objective || piece.id,
    guion,
    frases: guion.length,
    slidesRef: null,
    voiceConfig: null,
    objetivo: piece.objective,
    angulo: piece.angle,
    durationSec: piece.durationSec,
    visualHints: (piece.script?.blocks || []).map((b) => b?.visual || '').filter(Boolean),
    musicMood: piece.script?.music?.mood,
    videoPrompts: piece.videoPrompts?.length ? piece.videoPrompts : undefined,
    slides: piece.slides?.length ? piece.slides : undefined,
    publish: piece.publish,
    qa: piece.qa ? { score: piece.qa.score, verdict: piece.qa.verdict } : undefined,
  };
}

// todas las piezas del kit → reels (descarta piezas sin guion: un reel vacío no sirve).
export function kitToReels(kit: Kit): ProjectReel[] {
  return (kit?.pieces || []).map(pieceToReel).filter((r) => r.guion.length > 0);
}

// el kit + el material del KB (brief/marca/pantallas ya derivados) → un Project completo
// listo para el editor. `id` opcional para upsert; si no, se deriva del nombre en saveProject.
export interface KitProjectExtras {
  id?: string;
  type?: string;
  brief?: string;
  brandKit?: BrandKit;
  screenshots?: string[];
}
export function kitToProject(kit: Kit, extras: KitProjectExtras = {}): Omit<Project, 'created_at' | 'updated_at'> {
  return {
    id: extras.id || '',
    name: kit?.project || 'Proyecto',
    type: extras.type || '',
    contentType: 'combinado',
    brief: extras.brief,
    screenshots: extras.screenshots,
    brandKit: extras.brandKit,
    reels: kitToReels(kit),
  };
}

// validación mínima de un kit recibido (forward-compatible).
export function isValidKit(x: unknown): x is Kit {
  const k = x as Kit;
  return !!k && typeof k === 'object' && Array.isArray(k.pieces) && k.pieces.length > 0;
}
