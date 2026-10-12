// Helper CANÓNICO del guion (reingeniería 2026-10-07, P0.2). Es el ÚNICO lugar del repo que sabe
// qué forma tiene un guion: el legacy (array de frases) y el estructurado ({ blocks:[{role,
// narration, visual, durSec}] }). Lo importan el back (server/functions.mjs) y el front
// (PasoPublicar, Pipeline, kitToProject). Antes había cuatro aplanadores distintos y `ctx().guion`
// sólo entendía el legacy: con un guion estructurado quedaba vacío y `publish`/`qa` caían al brief.

// Las frases habladas del guion, en orden, sin vacías. Acepta cualquiera de los dos shapes (y
// nada: devuelve []). Un bloque sin narración se saltea, no rompe.
export function scriptNarrations(guion) {
  if (!guion) return [];
  if (Array.isArray(guion)) return guion.map((s) => String(s ?? '').trim()).filter(Boolean);
  const blocks = Array.isArray(guion.blocks) ? guion.blocks : [];
  return blocks.map((b) => String(b?.narration ?? '').trim()).filter(Boolean);
}

// El guion como texto plano para un prompt. `roles: true` antepone el rol y suma el visual
// ("[hook] frase (visual: ...)"), que es lo que leen cast/storyboard/qa; sin roles es la
// concatenación de frases que leían los moldes legacy. Vacío si no hay guion.
export function scriptToText(guion, { roles = false } = {}) {
  if (!guion) return '';
  if (roles && !Array.isArray(guion) && Array.isArray(guion.blocks)) {
    return guion.blocks
      .filter((b) => b && (String(b.narration ?? '').trim() || String(b.visual ?? '').trim()))
      // script/3.0: con `quien` (la persona que lo dice en cámara) el texto lo nombra: "[desarrollo · electricista] ..."
      // 2026-10-12: con la duración del bloque, para que el storyboard dure lo que dura el guion (estudio curado)
      .map((b) => `[${b.role || ''}${String(b.quien ?? '').trim() ? ` · dice: ${String(b.quien).trim()}` : ''}${Number(b.durSec) > 0 ? ` · ${Number(b.durSec)}s` : ''}] ${String(b.narration ?? '').trim()}${b.visual ? ` (visual: ${b.visual})` : ''}`)
      .join(' · ');
  }
  return scriptNarrations(guion).join(' · ');
}
