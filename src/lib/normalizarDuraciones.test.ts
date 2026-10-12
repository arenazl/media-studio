// 2026-10-07: duraciones del storyboard filmado por REGLA (normalizador, capa 3 de P0.7).
import { describe, it, expect } from 'vitest';
// @ts-expect-error módulos del server (.mjs) sin tipos para vitest
import { normalizarDuraciones } from '../../server/functions.mjs';

const w = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`).join(' ');

describe('normalizarDuraciones (filmado)', () => {
  // 2026-10-11: la escena con persona y frase dura lo que tarda la frase + 1 s de acción, de 3 a 7 (antes 8 fijo). Flow
  // igual genera 8 s; el montajista corta en la frase.
  it('escena con persona y frase → la duración que puso el storyboard (la del guion); si falta, la frase a 2,7 palabras/seg + 1', () => {
    // storyboard/3.8 (2026-10-12, estudio curado): la duración es la del guion; no se recalcula por palabras
    const [a, b] = normalizarDuraciones([{ n: 1, personajes: ['p1'], dialogo: w(20), durSec: 4 }, { n: 2, personajes: ['p2'], dialogo: 'cinco palabras y nada más', durSec: 0 }]);
    expect(a.durSec).toBe(4); expect(a.durSecModelo).toBeUndefined();
    expect(b.durSec).toBe(3);
  });
  it('una frase corta NO convierte la escena en b-roll: la persona y su frase se quedan', () => {
    const [a] = normalizarDuraciones([{ n: 1, personajes: ['p1'], dialogo: 'Nadie me contesta. Le escribí a tres.', durSec: 8 }]);
    expect(a.personajes).toEqual(['p1']);
    expect(a.dialogo).toBe('Nadie me contesta. Le escribí a tres.');
    expect(a.talkingHeadConvertido).toBeUndefined();
  });
  it('inserto de pantalla → sin frase (nadie la iba a decir) y con su duración; 3 s si no tiene', () => {
    const [a, b] = normalizarDuraciones([{ n: 1, personajes: [], pantalla: 'Bandeja de solicitudes', dialogo: 'una frase que nadie dice', durSec: 6 }, { n: 2, personajes: [], pantalla: 'Inicio', dialogo: '' }]);
    expect(a.dialogo).toBe('');
    expect(a.dialogoModelo).toBe('una frase que nadie dice');
    expect(a.durSec).toBe(6);
    expect(b.durSec).toBe(3);
  });
  it('b-roll con voz en off → lo que dura su texto a 2,7 palabras/seg, entre 4 y 8', () => {
    const [a, b, c] = normalizarDuraciones([{ n: 1, personajes: [], dialogo: w(8), durSec: 8 }, { n: 2, personajes: [], dialogo: w(18), durSec: 8 }, { n: 3, personajes: [], dialogo: w(40), durSec: 8 }]);
    expect(a.durSec).toBe(4);   // 8 palabras = 3s → piso 4
    expect(b.durSec).toBe(7);   // 18 / 2,7 = 6,7 → 7
    expect(c.durSec).toBe(8);   // techo 8
  });
  it('escena muda → la duración del storyboard; 4 s si no tiene', () => {
    const [a, b] = normalizarDuraciones([{ n: 1, personajes: ['p1'], dialogo: '', durSec: 8 }, { n: 2, personajes: [], dialogo: '' }]);
    expect(a.durSec).toBe(8); expect(b.durSec).toBe(4);
  });
  it('no toca lo que ya está bien', () => {
    const e = { n: 1, personajes: ['p1'], dialogo: w(20), durSec: 7 };
    expect(normalizarDuraciones([e])[0]).toBe(e);
  });
});
