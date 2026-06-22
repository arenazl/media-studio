import { describe, it, expect } from 'vitest';
import { PROMO_TEMPLATES, templateById, templateDuration, templateSlideSecs } from './promoTemplates';

describe('PROMO_TEMPLATES', () => {
  it('hay plantillas y todas tienen id único', () => {
    expect(PROMO_TEMPLATES.length).toBeGreaterThan(0);
    const ids = PROMO_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('invariante: la suma de bloques == durationSec', () => {
    for (const t of PROMO_TEMPLATES) {
      expect(templateDuration(t)).toBe(t.durationSec);
    }
  });
  it('cada plantilla arranca con hook y cierra con cta', () => {
    for (const t of PROMO_TEMPLATES) {
      expect(t.blocks[0].role).toBe('hook');
      expect(t.blocks[t.blocks.length - 1].role).toBe('cta');
    }
  });
});

describe('templateById', () => {
  it('encuentra por id', () => {
    expect(templateById('awareness-15')?.label).toBe('Awareness 15s');
  });
  it('undefined si no existe', () => {
    expect(templateById('nope')).toBeUndefined();
  });
});

describe('templateSlideSecs', () => {
  it('devuelve las duraciones por bloque', () => {
    expect(templateSlideSecs(PROMO_TEMPLATES[0])).toEqual([2, 4, 6, 3]);
  });
});
