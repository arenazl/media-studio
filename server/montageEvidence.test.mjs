import { describe, it, expect } from 'vitest';
import { resolverClipLocal, segundoDeMuestra } from './montageEvidence.mjs';
import path from 'node:path';
describe('evidencia visual acotada a storage', () => {
  it('rechaza traversal, URLs y formatos que no son video', () => {
    const root = path.resolve('/tmp/recursos');
    expect(resolverClipLocal(root, '../secreto.mp4')).toBeNull();
    expect(resolverClipLocal(root, 'https://example.com/clip.mp4')).toBeNull();
    expect(resolverClipLocal(root, '/etc/secret.mov')).toBeNull();
    expect(resolverClipLocal(root, 'un-script.js')).toBeNull();
    expect(resolverClipLocal(root, 'piezas/1.mp4')).toBe(path.join(root, 'piezas/1.mp4'));
  });
  it('toma una muestra dentro del recorte visible, sin asumir imágenes adicionales', () => {
    expect(segundoDeMuestra({ in: 2, out: 6 })).toBe(4.2);
    expect(segundoDeMuestra({ in: 0, out: 8 })).toBe(4.4);
  });
});
