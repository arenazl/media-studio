// 2026-10-07: duraciones del storyboard filmado por REGLA (normalizador, capa 3 de P0.7).
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { normalizarDuraciones } from '../../server/functions.mjs';

const w = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`).join(' ');

describe('normalizarDuraciones (filmado)', () => {
  it('talking head (personajes + diálogo) → 8s, diga lo que diga el modelo', () => {
    const [a, b] = normalizarDuraciones([{ n: 1, personajes: ['p1'], dialogo: w(20), durSec: 4 }, { n: 2, personajes: ['p1'], dialogo: 'otro texto distinto para que no se deduplique con el primero ' + w(12), durSec: 12 }]);
    expect(a.durSec).toBe(8); expect(b.durSec).toBe(8);
    expect(a.durSecModelo).toBe(4);
  });
  it('b-roll con voz en off → lo que dura su texto a 2,7 palabras/seg, entre 4 y 8', () => {
    const [a, b, c] = normalizarDuraciones([{ n: 1, personajes: [], dialogo: w(8), durSec: 8 }, { n: 2, personajes: [], dialogo: w(18), durSec: 8 }, { n: 3, personajes: [], dialogo: w(40), durSec: 8 }]);
    expect(a.durSec).toBe(4);   // 8 palabras = 3s → piso 4
    expect(b.durSec).toBe(7);   // 18 / 2,7 = 6,7 → 7
    expect(c.durSec).toBe(8);   // techo 8
  });
  it('b-roll mudo → 4s, o lo del modelo si estaba entre 4 y 6', () => {
    const [a, b, c] = normalizarDuraciones([{ n: 1, personajes: [], dialogo: '', durSec: 8 }, { n: 2, personajes: [], dialogo: '', durSec: 5 }, { n: 3, personajes: [], dialogo: '', durSec: 2 }]);
    expect(a.durSec).toBe(4); expect(b.durSec).toBe(5); expect(c.durSec).toBe(4);
  });
  it('no toca lo que ya está bien', () => {
    const e = { n: 1, personajes: ['p1'], dialogo: w(20), durSec: 8 };
    expect(normalizarDuraciones([e])[0]).toBe(e);
  });
});
