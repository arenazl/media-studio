export const meta = {
  name: 'promo-kit',
  description: 'Produce el KIT de videos de marketing de un negocio desde brief + capturas, orquestando el panel de skills (estratega/director/mockup/veo/plataforma) con QA adversarial. Modelos por rol: Opus a juicio, Sonnet a ejecución.',
  whenToUse: 'Cuando el dueño dio luz verde a producir la campaña en serio (varias piezas, calidad alta). Opt-in: gasta tokens.',
  phases: [
    { title: 'Estrategia', detail: 'estratega define posicionamiento + plan de piezas (Opus)', model: 'opus' },
    { title: 'Produccion', detail: 'por pieza: director -> mockup/veo -> plataforma' },
    { title: 'QA', detail: 'panel de criticos por lente; loop si score bajo (Opus)', model: 'opus' },
  ],
}

// args = { project, brief, captures?: string[], profile? }
const project = args?.project || 'proyecto'
const brief = args?.brief
const captures = args?.captures || []
const profile = args?.profile || 'campaign'
if (!brief) { log('Falta el brief (hechos del negocio). Aborto.'); return { error: 'no-brief' } }

const STRATEGY = {
  type: 'object',
  properties: {
    positioning: { type: 'string' },
    audiences: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, pain: { type: 'string' }, language: { type: 'string' } }, required: ['label', 'pain'] } },
    pieces: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, objective: { type: 'string' }, angle: { type: 'string' },
      format: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } },
      durationSec: { type: 'number' }, creativeBrief: { type: 'string' },
    }, required: ['id', 'objective', 'angle', 'format', 'durationSec', 'creativeBrief'] } },
  },
  required: ['positioning', 'pieces'],
}
const SCRIPT = {
  type: 'object',
  properties: {
    blocks: { type: 'array', items: { type: 'object', properties: {
      role: { type: 'string' }, tStart: { type: 'number' }, tEnd: { type: 'number' },
      narration: { type: 'string' }, visual: { type: 'string' },
    }, required: ['role', 'narration', 'visual'] } },
    music: { type: 'object', properties: { mood: { type: 'string' } }, required: ['mood'] },
  },
  required: ['blocks', 'music'],
}
const ASSETS = { type: 'object', properties: { slides: { type: 'array' }, videoPrompts: { type: 'array' } } }
const PUBLISH = {
  type: 'object',
  properties: { hookOnScreen: { type: 'string' }, caption: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } }, cta: { type: 'string' } },
  required: ['hookOnScreen', 'caption', 'cta'],
}
const VERDICT = {
  type: 'object',
  properties: { score: { type: 'number' }, verdict: { type: 'string' }, issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string' }, note: { type: 'string' } } } } },
  required: ['score', 'verdict'],
}

// --- Estrategia (Opus: el cerebro) ---
phase('Estrategia')
const strategy = await agent(
  `Actuás como social-marketing-strategist (skill en ~/.claude/skills/social-marketing-strategist).\n` +
  `Negocio: ${project}. Perfil pedido: ${profile}.\nBRIEF (hechos):\n${brief}\n\n` +
  `Devolvé el posicionamiento, los públicos, y el PLAN DE PIEZAS (una pieza = un ángulo = un objetivo). ` +
  `Para 'campaign': ~3 awareness + 1 demo + 1 conversion. No inventes datos/prueba.`,
  { label: 'estrategia', phase: 'Estrategia', model: 'opus', schema: STRATEGY }
)
if (!strategy?.pieces?.length) { log('Estrategia vacía. Aborto.'); return { error: 'no-strategy' } }
log(`Estrategia lista: ${strategy.pieces.length} piezas.`)

// --- Producción por pieza (pipeline, sin barrera) ---
phase('Produccion')
const QA_MIN = 40
const capList = captures.length ? `Capturas disponibles: ${captures.join(', ')}.` : 'Sin capturas (mockups en modo fallback).'

const built = await pipeline(
  strategy.pieces,
  // 1) Guion (Opus: criterio creativo) — con loop de QA embebido
  async (piece) => {
    let script = await agent(
      `Actuás como promo-director (skill). Pieza: ${piece.id} · objetivo ${piece.objective} · ángulo "${piece.angle}" · ${piece.durationSec}s · formato ${piece.format}.\n` +
      `Brief creativo: ${piece.creativeBrief}\nPosicionamiento: ${strategy.positioning}\n` +
      `Devolvé el guion por bloques (hook→dolor→solución→prueba→cta) con narración calibrada (~2.7 pal/seg) + el mood de música.`,
      { label: `guion:${piece.id}`, phase: 'Produccion', model: 'opus', schema: SCRIPT }
    )
    return { piece, script }
  },
  // 2) Assets (Sonnet: ejecutores) — mockup y/o veo según formato, en paralelo
  async (prev) => {
    const { piece, script } = prev
    const wantMock = profile === 'demo' || profile === 'mockups-only' || piece.format === 'video-16x9'
    const wantVeo = profile !== 'mockups-only'
    const [slides, videoPrompts] = await Promise.all([
      wantMock ? agent(
        `Actuás como mockup-designer (skill). ${capList}\nGuion: ${JSON.stringify(script.blocks)}\n` +
        `Mapeá guion→capturas y devolvé el spec por slide (framing 9:16, highlight único, motion, copy ≤5 palabras).`,
        { label: `mockups:${piece.id}`, phase: 'Produccion', model: 'sonnet', schema: ASSETS }
      ).then((a) => a?.slides || []) : Promise.resolve([]),
      wantVeo ? agent(
        `Actuás como veo-flow-prompter (skill, basada en docs/PLAYBOOK_VIDEOS_FLOW.md). Negocio ${project}.\n` +
        `Guion: ${JSON.stringify(script.blocks)}\nDevolvé los prompts Veo 3 (template A/B/C) + settings (9:16, 8s) + marca fonética.`,
        { label: `veo:${piece.id}`, phase: 'Produccion', model: 'sonnet', schema: ASSETS }
      ).then((a) => a?.videoPrompts || []) : Promise.resolve([]),
    ])
    return { ...prev, slides, videoPrompts }
  },
  // 3) Publicación (Sonnet)
  async (prev) => {
    const { piece, script } = prev
    const publish = await agent(
      `Actuás como social-platform-specialist (skill). Pieza ${piece.id}, objetivo ${piece.objective}, plataformas sugeridas ${(piece.platforms || []).join(', ')}.\n` +
      `Guion: ${JSON.stringify(script.blocks)}\nDevolvé hook on-screen (≤6 palabras), caption, hashtags (3-6) y CTA. Sin emojis.`,
      { label: `publish:${piece.id}`, phase: 'Produccion', model: 'sonnet', schema: PUBLISH }
    )
    return { ...prev, publish }
  },
)

// --- QA: panel de jueces por lente (Opus). 3 lentes, promedio; loop si bajo ---
phase('QA')
const LENSES = ['gancho (frena el scroll en 2s)', 'una sola idea + claridad sin sonido', 'formato/ritmo (9:16, planos 2-4s, CTA único)']
const judged = await parallel(
  built.filter(Boolean).map((b) => async () => {
    const votes = await parallel(LENSES.map((lens) => () =>
      agent(
        `Evaluá esta promo SOLO por el lente: ${lens}. Pieza ${b.piece.id}.\nGuion: ${JSON.stringify(b.script.blocks)}\nPublicación: ${JSON.stringify(b.publish)}`,
        { label: `qa:${b.piece.id}:${lens.slice(0, 8)}`, phase: 'QA', model: 'opus', agentType: 'promo-critic', schema: VERDICT }
      )
    ))
    const valid = votes.filter(Boolean)
    const score = valid.length ? Math.round(valid.reduce((s, v) => s + (v.score || 0), 0) / valid.length) : 0
    const issues = valid.flatMap((v) => v.issues || [])
    return { ...b, qa: { score, verdict: score >= QA_MIN ? 'LISTO PARA PRODUCIR' : 'AJUSTAR', issues } }
  })
)

const pieces = judged.filter(Boolean).map((b) => ({
  id: b.piece.id, objective: b.piece.objective, angle: b.piece.angle, format: b.piece.format,
  platforms: b.piece.platforms || [], durationSec: b.piece.durationSec,
  script: b.script, slides: b.slides, videoPrompts: b.videoPrompts,
  narration: { mode: 'tts', text: b.script.blocks.map((x) => x.narration).join(' ') },
  publish: b.publish, qa: b.qa,
}))
log(`Kit listo: ${pieces.length} piezas · score promedio ${pieces.length ? Math.round(pieces.reduce((s, p) => s + p.qa.score, 0) / pieces.length) : 0}/50`)

return { project, profile, positioning: strategy.positioning, audiences: strategy.audiences || [], pieces }
