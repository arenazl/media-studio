// Tipos del helper canónico del guion (server/scriptToText.mjs) para el front TypeScript.
export type GuionLike = string[] | { blocks?: Array<{ role?: string; narration?: string; visual?: string; durSec?: number }> } | null | undefined;
export function scriptNarrations(guion: GuionLike): string[];
export function scriptToText(guion: GuionLike, opts?: { roles?: boolean }): string;
