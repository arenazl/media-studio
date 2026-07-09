// Proyecto Munify REAL armado por el CIRCUITO de la app (no hardcodeado a mano):
//   KB de produccion (KSP, GET /api/knowledge-base) + kit del panel de skills (promo-kit).
// El brief y la marca se DERIVAN del KB (kbToBrief/kbToBrandKit); los reels son las piezas que
// generó el panel (kitToReels). Las 7 pantallas del KB se renderizaron a PNG (chrome headless)
// y viven en public/munify/screens/. Es la prueba de punta a punta del pipeline, hasta el editor.
import type { Project } from '../lib/projects';
import { kitToReels, type Kit } from '../lib/kitToProject';
import { kbToBrief, kbToBrandKit, type KnowledgeBase } from '../lib/knowledgeBase';
import kitData from './munifyKit.json';
import kbData from './munifyKb.json';

const KB = kbData as unknown as KnowledgeBase;
const KIT = kitData as unknown as Kit;

// las 7 pantallas del KB, renderizadas a PNG → public/munify/screens/<name>.png
const SCREEN_NAMES = ['dashboard', 'reclamos', 'tramites', 'tesoreria', 'contaduria', 'sueldos', 'turnos'];
const SCREENSHOTS = SCREEN_NAMES.map((n) => `/munify/screens/${n}.png`);

export function munifyProject(): Project {
  const t = Date.now();
  return {
    id: 'munify-kit',
    name: 'Munify (kit real)',
    type: KB.business?.industry || 'GovTech',
    preloaded: true,
    contentType: 'combinado',
    brief: kbToBrief(KB),
    screenshots: SCREENSHOTS,
    brandKit: kbToBrandKit(KB),
    reels: kitToReels(KIT),
    created_at: t,
    updated_at: t,
  };
}
