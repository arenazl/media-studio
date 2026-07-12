// Helpers de presentación para el registro de apps del KSP (GET /api/kb/apps) — COMPARTIDOS
// (antes triplicados: Home.tsx, Integrar.tsx y ahora Wizard.tsx mostraban la misma tabla+hash).
// Los colores de las apps YA conocidas están documentados en docs/rediseno/HANDOFF.md §1; el resto
// (apps nuevas del registro sin acento documentado) cae a una rotación determinística por id —
// NO se inventa marca para una app nueva, es sólo un acento visual neutro.
const KNOWN_APP_COLOR: Record<string, string> = {
  munify: 'var(--rd-app-munify)', hablah: 'var(--rd-app-hablah)',
  eventmarker: 'var(--rd-app-eventmarker)', tasar: 'var(--rd-app-tasar)',
};
const FALLBACK_PALETTE = ['var(--rd-blue)', 'var(--rd-green)', 'var(--rd-gold)', 'var(--rd-app-munify)'];

export function appAccent(id: string): string {
  if (KNOWN_APP_COLOR[id]) return KNOWN_APP_COLOR[id];
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export function hostOf(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}
