// Store de KITS de voz (el "cerebro" que media-studio versiona y las apps portan).
// localStorage-first (anda sin backend). Cada kit = perfil/familia de voz con sus
// settings + tags permitidos + expression_prompt. El artefacto que se copia a la app.
export interface Kit {
  id: string;            // 'levante', 'ventas'… (familia/app)
  nombre: string;        // 'Levante / Picante'
  estilo: string;        // cómo habla
  voice_id: string;
  model: string;         // eleven_v3 | eleven_turbo_v2_5 | eleven_multilingual_v2
  stability: number; similarity: number; style: number; speed: number;
  tags: string[];        // tags_permitidos: ['[whispers]','[curious]']
  max_chars: number;     // tope de largo de respuesta (la cadencia va con el largo)
  prompt: string;        // expression_prompt (compacto) — editable
  version: number;       // kit_version (bump → las apps re-sincronizan)
  updated_at: number;
}

const LS_KEY = 'ms.kits.v1';
const DEFAULT_VOICE = 'yA5jrK1S9cpCAojBYyMu';

// expression_prompt compacto a partir del kit (va al system prompt de la app).
export function buildPrompt(k: Pick<Kit, 'nombre' | 'estilo' | 'tags'>): string {
  const tags = k.tags.length ? k.tags.join(' ') : '(ninguno)';
  return `Escribí la respuesta para que la lea una voz (ElevenLabs). Hacela expresiva según "${k.nombre}" (${k.estilo}). Audio tags permitidos (solo estos, antes de la frase que actúan): ${tags}. 1 tag por idea, no encadenes. Pausas: <break time="0.4s"/> normal, <break time="0.9s"/> antes de un precio o del remate. Énfasis: 1-2 palabras EN MAYÚSCULAS por frase. No sobreactúes. Devolvé SOLO el texto con esos marcadores.`;
}

// JSON que la app porta (el "contrato" del kit).
export function kitJson(k: Kit) {
  return {
    kit_version: k.version,
    familia: k.id,
    estilo: k.estilo,
    voice_id: k.voice_id,
    model_id: k.model,
    voice_settings: { stability: k.stability, similarity_boost: k.similarity, style: k.style, use_speaker_boost: true, speed: k.speed },
    tags_permitidos: k.tags,
    max_chars: k.max_chars,
    expression_prompt: k.prompt,
  };
}

// Seed: las 5 familias de SalesBot con los presets que confirmamos en el doc.
const SEED: Omit<Kit, 'prompt' | 'version' | 'updated_at'>[] = [
  { id: 'levante', nombre: 'Levante / Picante', estilo: 'pausado, sensual, énfasis en palabras', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.35, similarity: 0.85, style: 0.55, speed: 0.90, tags: ['[whispers]', '[curious]'], max_chars: 250 },
  { id: 'ventas', nombre: 'Ventas', estilo: 'enérgico, entusiasta', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.30, similarity: 0.80, style: 0.60, speed: 1.05, tags: ['[excited]', '[curious]'], max_chars: 500 },
  { id: 'soporte', nombre: 'Soporte', estilo: 'directo, claro, plano', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.50, similarity: 0.80, style: 0.25, speed: 1.0, tags: [], max_chars: 400 },
  { id: 'cobranza', nombre: 'Cobranza', estilo: 'firme, serio, formal', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.60, similarity: 0.85, style: 0.20, speed: 1.0, tags: ['[serious]'], max_chars: 350 },
  { id: 'joda', nombre: 'Joda / Humor', estilo: 'exagerado, expresivo', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.30, similarity: 0.80, style: 0.65, speed: 1.05, tags: ['[excited]', '[laughs]', '[curious]'], max_chars: 300 },
  { id: 'formal', nombre: 'Formal / Legal', estilo: 'serio, neutral, claro (laboral, legal, RRHH, vecindad)', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.55, similarity: 0.85, style: 0.20, speed: 0.98, tags: ['[serious]'], max_chars: 320 },
  { id: 'personal', nombre: 'Familia / Personal', estilo: 'cálido, cercano, natural', voice_id: DEFAULT_VOICE, model: 'eleven_turbo_v2_5', stability: 0.45, similarity: 0.80, style: 0.40, speed: 1.0, tags: ['[curious]', '[sighs]'], max_chars: 300 },
];

function seed(): Kit[] {
  const t = Date.now();
  return SEED.map((s) => ({ ...s, prompt: buildPrompt(s), version: 1, updated_at: t }));
}
function load(): Kit[] {
  let ks: Kit[] | null = null;
  try { const raw = localStorage.getItem(LS_KEY); if (raw) ks = JSON.parse(raw) as Kit[]; } catch { /* noop */ }
  if (!ks) { const s = seed(); persist(s); return s; }
  // merge: agrega familias del seed que falten (ej. nuevas) sin pisar lo ya editado.
  const have = new Set(ks.map((k) => k.id));
  const t = Date.now();
  const missing = SEED.filter((s) => !have.has(s.id)).map((s) => ({ ...s, prompt: buildPrompt(s), version: 1, updated_at: t }));
  let changed = missing.length > 0;
  if (missing.length) ks = [...ks, ...missing];
  // migración 1-vez: eleven_v3 era un default malo (alpha, lento, entitlement-gated,
  // rompía el motor del bot). Lo paso a turbo_v2_5. Después el user puede elegir v3 a mano.
  if (!localStorage.getItem('ms.kits.mig_v3')) {
    ks = ks.map((k) => (k.model === 'eleven_v3' ? { ...k, model: 'eleven_turbo_v2_5' } : k));
    try { localStorage.setItem('ms.kits.mig_v3', '1'); } catch { /* noop */ }
    changed = true;
  }
  if (changed) persist(ks);
  return ks;
}
function persist(ks: Kit[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(ks)); } catch { /* noop */ } }
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function listKits(): Kit[] { return load().sort((a, b) => b.updated_at - a.updated_at); }
export function saveKit(k: Omit<Kit, 'updated_at'> & { updated_at?: number }): Kit {
  const ks = load();
  const id = k.id || `${slug(k.nombre) || 'kit'}-${Date.now().toString(36).slice(-4)}`;
  const existing = ks.find((x) => x.id === id);
  // si cambió algo que las apps consumen, bump de versión.
  const bump = existing && JSON.stringify(kitJson({ ...existing })) !== JSON.stringify(kitJson({ ...existing, ...k, id }));
  const kit: Kit = { ...k, id, version: bump ? existing!.version + 1 : (existing?.version ?? k.version ?? 1), updated_at: Date.now() };
  persist(existing ? ks.map((x) => (x.id === id ? kit : x)) : [...ks, kit]);
  return kit;
}
export function deleteKit(id: string) { persist(load().filter((k) => k.id !== id)); }
