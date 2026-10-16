// Validación sin acceso a red: el analizador sólo observa clips en storage local.
import path from 'node:path';

export function resolverClipLocal(storageDir, fileRef) {
  if (typeof fileRef !== 'string' || !fileRef || fileRef.includes('\0') || path.isAbsolute(fileRef) ||
      !/\.(mp4|webm|mov|m4v)$/i.test(fileRef) || /^https?:/i.test(fileRef)) return null;
  const root = path.resolve(storageDir);
  const full = path.resolve(root, fileRef);
  const rel = path.relative(root, full);
  if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) return null;
  return full;
}

export function segundoDeMuestra(escena) {
  const inicio = Number(escena?.in) || 0;
  const out = Number(escena?.out);
  const dur = Math.max(0.1, Number.isFinite(out) ? out - inicio : Number(escena?.durSec) || 3);
  return Math.round(Math.max(0, inicio + dur * 0.55) * 100) / 100;
}
