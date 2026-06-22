export const meta = {
  name: 'promo-kit',
  description: 'Produce el KIT de videos de marketing de un negocio desde brief + capturas, orquestando el panel de skills (estratega/director/mockup/veo/plataforma) con QA holístico y loop de mejora. Modelos por rol: Opus a juicio, Sonnet a ejecución.',
  whenToUse: 'Cuando el dueño dio luz verde a producir la campaña en serio (varias piezas, calidad alta). Opt-in: gasta tokens.',
  phases: [
    { title: 'Estrategia', detail: 'estratega define posicionamiento + plan de piezas (Opus)', model: 'opus' },
    { title: 'Produccion', detail: 'por pieza: director -> mockup/veo -> plataforma -> QA, con loop de mejora' },
  ],
}

// args = { project, brief, captures?: string[], profile? }
// robusto: si args llega como string JSON (serializado), lo parseo.
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = {} } }
A = A || {}
const project = A.project || 'proyecto'
const brief = A.brief
const captures = A.captures || []
const profile = A.profile || 'campaign'
log(`args: tipo=${typeof args} · project=${project} · brief=${brief ? brief.length + ' chars' : 'VACIO'} · perfil=${profile}`)
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

// --- Producción por pieza, con QA HOLÍSTICO + loop de mejora ---
phase('Produccion')
const QA_MIN = 38           // /50 — umbral de "listo para producir"
const MAX_ATTEMPTS = 2      // 1 reintento si el QA pide ajustar (acota el costo)
const capList = captures.length ? `Capturas: ${captures.join(', ')}.` : 'Sin capturas (mockups en modo fallback).'

async function buildPiece(piece) {
  let priorIssues = []
  let best = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const fix = priorIssues.length
      ? `\nLa versión anterior NO pasó el QA. Corregí ESTO: ${priorIssues.map((i) => i.note).join(' · ')}. ` +
        `Hook más fuerte en los primeros 2s (sin logo, sin "somos X"), UNA sola idea, CTA único y claro al final.`
      : ''
    // 1) Guion (Opus: criterio creativo)
    const script = await agent(
      `Actuás como promo-director (skill). Pieza ${piece.id} · objetivo ${piece.objective} · ángulo "${piece.angle}" · ${piece.durationSec}s · ${piece.format}.\n` +
      `Brief creativo: ${piece.creativeBrief}\nPosicionamiento: ${strategy.positioning}${fix}\n` +
      `Devolvé el guion por bloques (hook→dolor→solución→prueba→cta) con narración calibrada (~2.7 pal/seg) + el mood de música.`,
      { label: `guion:${piece.id}#${attempt + 1}`, phase: 'Produccion', model: 'opus', schema: SCRIPT }
    )
    // 2) Assets (Sonnet) + 3) Publicación (Sonnet), en paralelo
    const wantMock = profile === 'demo' || profile === 'mockups-only' || /16x9|consider/i.test(`${piece.format}${piece.objective}`)
    const wantVeo = profile !== 'mockups-only'
    const [[slides, videoPrompts], publish] = await Promise.all([
      Promise.all([
        wantMock ? agent(`Actuás como mockup-designer (skill). ${capList}\nGuion: ${JSON.stringify(script.blocks)}\nDevolvé el spec por slide (framing 9:16, highlight único, motion, copy ≤5 palabras).`,
          { label: `mockups:${piece.id}`, phase: 'Produccion', model: 'sonnet', schema: ASSETS }).then((a) => a?.slides || []) : Promise.resolve([]),
        wantVeo ? agent(`Actuás como veo-flow-prompter (skill, PLAYBOOK_VIDEOS_FLOW). Negocio ${project}.\nGuion: ${JSON.stringify(script.blocks)}\nDevolvé los prompts Veo 3 (template A/B/C) + settings (9:16, 8s) + marca fonética.`,
          { label: `veo:${piece.id}`, phase: 'Produccion', model: 'sonnet', schema: ASSETS }).then((a) => a?.videoPrompts || []) : Promise.resolve([]),
      ]),
      agent(`Actuás como social-platform-specialist (skill). Pieza ${piece.id}, objetivo ${piece.objective}, plataformas ${(piece.platforms || []).join(', ')}.\nGuion: ${JSON.stringify(script.blocks)}\nDevolvé hook on-screen (≤6 palabras), caption, hashtags (3-6) y CTA. Sin emojis.`,
        { label: `publish:${piece.id}`, phase: 'Produccion', model: 'sonnet', schema: PUBLISH }),
    ])
    // 4) QA HOLÍSTICO: un promo-critic aplica su rúbrica de 10 ejes (0-5) → score /50 real.
    const qa = await agent(
      `Evaluá esta promo COMPLETA con tu rúbrica de 10 ejes (0-5 cada uno = total /50). NO la juzgues por un solo aspecto: puntuá los 10 ejes y sumá.\n` +
      `Pieza ${piece.id}, ${piece.durationSec}s, objetivo ${piece.objective}, ángulo ${piece.angle}.\n` +
      `Guion: ${JSON.stringify(script.blocks)}\nPublicación: ${JSON.stringify(publish)}\n` +
      `Devolvé score /50, veredicto (LISTO PARA PRODUCIR ≥${QA_MIN} / AJUSTAR / REHACER) y los issues por severidad con el fix concreto.`,
      { label: `qa:${piece.id}#${attempt + 1}`, phase: 'Produccion', model: 'opus', agentType: 'promo-critic', schema: VERDICT }
    )
    const cand = { piece, script, slides, videoPrompts, publish, qa: qa || { score: 0, verdict: 'REHACER', issues: [] } }
    if (!best || cand.qa.score > best.qa.score) best = cand   // me quedo con el mejor intento
    log(`${piece.id} intento ${attempt + 1}: ${cand.qa.score}/50 ${cand.qa.verdict}`)
    if (cand.qa.score >= QA_MIN && cand.qa.verdict !== 'REHACER') break
    priorIssues = cand.qa.issues || []
  }
  return best
}

const judged = await parallel(strategy.pieces.map((p) => () => buildPiece(p)))

const pieces = judged.filter(Boolean).map((b) => ({
  id: b.piece.id, objective: b.piece.objective, angle: b.piece.angle, format: b.piece.format,
  platforms: b.piece.platforms || [], durationSec: b.piece.durationSec,
  script: b.script, slides: b.slides, videoPrompts: b.videoPrompts,
  narration: { mode: 'tts', text: b.script.blocks.map((x) => x.narration).join(' ') },
  publish: b.publish, qa: b.qa,
}))
const avg = pieces.length ? Math.round(pieces.reduce((s, p) => s + (p.qa?.score || 0), 0) / pieces.length) : 0
const ready = pieces.filter((p) => (p.qa?.score || 0) >= QA_MIN).length
log(`Kit listo: ${pieces.length} piezas · ${ready} listas (≥${QA_MIN}) · score promedio ${avg}/50`)

return { project, profile, positioning: strategy.positioning, audiences: strategy.audiences || [], pieces }
