import { describe, it, expect } from 'vitest';
import { pieceToReel, kitToReels, kitToProject, isValidKit, type Kit, type KitPiece } from './kitToProject';

const piece = (over: Partial<KitPiece> = {}): KitPiece => ({
  id: 'awareness-1',
  objective: 'awareness',
  angle: 'El municipio en el celular',
  format: 'reel 9:16',
  platforms: ['instagram', 'tiktok'],
  durationSec: 18,
  script: {
    blocks: [
      { role: 'hook', narration: '¿Cuántas veces fuiste a la municipalidad?', visual: 'vecino en la cola' },
      { role: 'solucion', narration: 'Con Munify reclamás un bache desde el celular.', visual: 'mockup app' },
      { role: 'cta', narration: 'Descargala gratis.', visual: 'logo + CTA' },
    ],
    music: { mood: 'cercano' },
  },
  slides: [{ frame: '9:16' }],
  videoPrompts: [{ template: 'A' }],
  narration: { mode: 'tts', text: 'todo el guion' },
  publish: { hookOnScreen: 'El municipio en tu celu', caption: 'cap', hashtags: ['#munify'], cta: 'Descargá' },
  qa: { score: 42, verdict: 'LISTO PARA PRODUCIR', issues: [] },
  ...over,
});

const kit = (pieces: KitPiece[]): Kit => ({ project: 'Munify', profile: 'campaign', positioning: 'pos', pieces });

describe('pieceToReel', () => {
  it('arma el guion desde las narraciones de los bloques', () => {
    const r = pieceToReel(piece());
    expect(r.guion).toEqual([
      '¿Cuántas veces fuiste a la municipalidad?',
      'Con Munify reclamás un bache desde el celular.',
      'Descargala gratis.',
    ]);
    expect(r.frases).toBe(3);
  });

  it('usa el ángulo como nombre, con fallback a objetivo y luego id', () => {
    expect(pieceToReel(piece()).nombre).toBe('El municipio en el celular');
    expect(pieceToReel(piece({ angle: undefined })).nombre).toBe('awareness');
    expect(pieceToReel(piece({ angle: undefined, objective: undefined })).nombre).toBe('awareness-1');
  });

  it('conserva el material del panel como metadata (visual hints, prompts, publish, qa)', () => {
    const r = pieceToReel(piece());
    expect(r.visualHints).toEqual(['vecino en la cola', 'mockup app', 'logo + CTA']);
    expect(r.musicMood).toBe('cercano');
    expect(r.videoPrompts).toHaveLength(1);
    expect(r.slides).toHaveLength(1);
    expect(r.publish?.cta).toBe('Descargá');
    expect(r.qa).toEqual({ score: 42, verdict: 'LISTO PARA PRODUCIR' });
  });

  it('deja el reel listo para que el editor genere TTS (sin voiceConfig ni slidesRef)', () => {
    const r = pieceToReel(piece());
    expect(r.voiceConfig).toBeNull();
    expect(r.slidesRef).toBeNull();
  });

  it('omite arrays vacíos de assets en vez de guardarlos', () => {
    const r = pieceToReel(piece({ slides: [], videoPrompts: [] }));
    expect(r.slides).toBeUndefined();
    expect(r.videoPrompts).toBeUndefined();
  });
});

describe('kitToReels', () => {
  it('convierte todas las piezas', () => {
    expect(kitToReels(kit([piece({ id: 'a' }), piece({ id: 'b' })]))).toHaveLength(2);
  });

  it('descarta piezas sin guion (un reel vacío no sirve)', () => {
    const vacia = piece({ id: 'vacia', script: { blocks: [{ narration: '   ' }], music: {} } });
    const reels = kitToReels(kit([piece({ id: 'ok' }), vacia]));
    expect(reels.map((r) => r.id)).toEqual(['ok']);
  });

  it('tolera un kit sin piezas', () => {
    expect(kitToReels({ project: 'X', pieces: [] })).toEqual([]);
  });
});

describe('kitToProject', () => {
  it('arma el proyecto con nombre del kit, reels y extras del KB', () => {
    const proj = kitToProject(kit([piece()]), {
      id: 'munify',
      type: 'Govtech',
      brief: '# Munify',
      screenshots: ['s1.html'],
      brandKit: { name: 'Munify', phonetic: 'Munifái' },
    });
    expect(proj.name).toBe('Munify');
    expect(proj.id).toBe('munify');
    expect(proj.type).toBe('Govtech');
    expect(proj.contentType).toBe('combinado');
    expect(proj.reels).toHaveLength(1);
    expect(proj.brandKit?.phonetic).toBe('Munifái');
    expect(proj.screenshots).toEqual(['s1.html']);
  });

  it('funciona con extras vacíos (id derivado después en saveProject)', () => {
    const proj = kitToProject(kit([piece()]));
    expect(proj.id).toBe('');
    expect(proj.reels).toHaveLength(1);
  });
});

describe('isValidKit', () => {
  it('acepta un kit con piezas', () => {
    expect(isValidKit(kit([piece()]))).toBe(true);
  });
  it('rechaza basura', () => {
    expect(isValidKit(null)).toBe(false);
    expect(isValidKit({})).toBe(false);
    expect(isValidKit({ pieces: [] })).toBe(false);
  });
});
