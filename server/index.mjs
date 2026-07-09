// Backend LOCAL/Cloud Run del media-studio.
// Entornos:
//   IS_PROD=false (default) → Claude headless para pipelines AI, videos en carpeta local
//   IS_PROD=true            → Gemini para pipelines AI, videos en Cloudinary
//
// Endpoints:
//   GET    /api/health
//   POST   /api/claude                    → AI pipeline (Claude local / Gemini prod)
//   GET    /api/videos                    → lista videos locales (dev)
//   GET    /api/videos/file/<n>           → stream video local
//   GET    /api/cloud-videos              → lista videos en Cloudinary / DB
//   POST   /api/cloud-videos/upload       → sube a Cloudinary, persiste en DB
//   DELETE /api/cloud-videos/<id>         → elimina de Cloudinary + DB
//   POST   /api/classify-video            → clasifica un video por tipo (Gemini Vision)
//   POST   /api/render                     → arma el mp4 del montaje (ffmpeg)
//   GET    /api/projects                  → lista proyectos SQLite
//   POST   /api/projects                  → crear proyecto
//   GET    /api/projects/<id>             → detalle con data JSON
//   POST   /api/projects/<id>             → actualizar proyecto (name + data)
//   DELETE /api/projects/<id>
//   GET    /api/projects/<id>/assets      → lista assets del proyecto (de data.assets)
//   POST   /api/projects/<id>/assets      → sube asset a Cloudinary en carpeta del proyecto
//   GET    /api/apps                      → lista app_configs
//   GET    /api/apps/<id>                 → config de voz de una app
//   POST   /api/apps/<id>                 → guardar config de voz
//   DELETE /api/apps/<id>

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  listProjects, getProject, saveProject, deleteProject,
  listCloudVideos, saveCloudVideo, deleteCloudVideo,
  getAppConfig, listAppConfigs, saveAppConfig, deleteAppConfig,
  DB_PATH,
} from './db.mjs';
import { buildFunctionPrompt, parseFunctionResult, IMPLEMENTED_FUNCTIONS } from './functions.mjs';
import { assemble } from './assemble.mjs';
import { renderMockupReel } from './mockupReel.mjs';

// .env LOCAL (sin dependencias ni flag): carga claves (ELEVENLABS_API_KEY, etc.) antes de leer process.env.
// No pisa lo ya seteado en el entorno; ignora líneas vacías/comentadas.
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
} catch { /* noop */ }

const PORT      = Number(process.env.STUDIO_PORT || 5301);
const VIDEOS_DIR = process.env.VIDEOS_DIR || 'D:/Code/sugerenciasMun/reels/videos';
const REPO_CWD  = process.env.STUDIO_CWD  || 'D:/Code';
const IS_WIN    = process.platform === 'win32';
const IS_PROD   = process.env.IS_PROD === 'true';   // LOCAL (Claude headless) por default; prod (Gemini) SOLO con IS_PROD=true

// Cloudinary (solo en prod o si están las vars seteadas)
const CLD_CLOUD  = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLD_KEY    = process.env.CLOUDINARY_API_KEY    || '';
const CLD_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLD_FOLDER = process.env.CLOUDINARY_FOLDER     || 'media-studio';

// Gemini (prod)
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// ElevenLabs (TTS local — antes vivía en el Cloud Run tts-service; lo incorporamos para no salir afuera)
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVEN_API = 'https://api.elevenlabs.io/v1';

const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v']);
const MIME      = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4' };

if (!IS_PROD) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// ── helpers ─────────────────────────────────────────────────────────────────
const json    = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)); });

// ── Integraciones (KSP): registro compartido + traer el KB por el consumidor ──
// El registro (apps.json) tiene la base_url + key de cada Integración. La key vive
// SOLO acá (backend); el front nunca la ve. Media Studio = consumidor: lee el registro
// y hace el GET a cada Integración con su X-KB-Key.
// Registro del ecosistema (modelo nuevo): { generadores, aplicaciones }. Soy Media Studio,
// un GENERADOR: mi clave fija vive en generadores.mediastudio; las apps van en aplicaciones
// (id, nombre, servidor) SIN key — todas validan contra las dos claves de generadores.
const KB_REGISTRY = process.env.KB_REGISTRY || 'D:/Code/base-compartida/2-APPS-ENTRADAS.json';
const KB_GENERATOR = 'mediastudio';
function loadRegistry() {
  try {
    if (process.env.KB_REGISTRY_JSON) return JSON.parse(process.env.KB_REGISTRY_JSON);
    return JSON.parse(fs.readFileSync(KB_REGISTRY, 'utf8'));
  } catch { return { generadores: {}, aplicaciones: [] }; }
}
const loadKbApps = () => loadRegistry().aplicaciones || [];
// mi clave de generador: env (prod, desde Secret Manager) o el registro (local). El front nunca la ve.
const myKbKey = () => process.env.KB_CLAVE_MEDIASTUDIO || loadRegistry().generadores?.[KB_GENERATOR]?.clave || '';

async function fetchKbFor(app) {
  const base = (app.servidor || '').replace(/\/+$/, '');
  if (!base) throw new Error(`${app.nombre || app.id}: sin servidor en el registro`);
  const r = await fetch(`${base}/api/knowledge-base`, { headers: { 'X-KB-Key': myKbKey() } });
  if (!r.ok) throw new Error(`${app.nombre || app.id}: HTTP ${r.status}${r.status === 401 || r.status === 403 ? ' (clave inválida)' : ''}`);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error(`${app.nombre || app.id}: la URL no devolvió JSON (¿el servidor apunta al front en vez del backend?)`);
  return await r.json();
}

// inspecciona una URL de asset (logo SVG o pantalla HTML): ¿está subida de verdad o cae al
// index de look-guides (fallback)? Devuelve { ok, reason }. El front pinta el semáforo.
async function inspectUrl(url, expect) {
  try {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    const bodyText = await r.text();
    if (bodyText.includes('Centro de Documentaci')) return { ok: false, reason: 'no subido (cae al index de look-guides)' };
    if (expect === 'svg') {
      const t = bodyText.trimStart();
      if (!t.startsWith('<svg') && !t.startsWith('<?xml')) return { ok: false, reason: 'la URL no devuelve un SVG' };
    }
    return { ok: true, bytes: bodyText.length };
  } catch (e) { return { ok: false, reason: e instanceof Error ? e.message : 'error' }; }
}

// extrae el primer objeto JSON de una respuesta de IA (que a veces trae texto alrededor).
function extractJson(text) {
  const s = (text || '').indexOf('{'); const e = (text || '').lastIndexOf('}');
  if (s === -1 || e <= s) throw new Error('la IA no devolvió JSON');
  return JSON.parse(text.slice(s, e + 1));
}

// Prompt: del KB → prospecto (resumen del negocio) + propuesta de trabajo (qué campaña).
// NO genera los reels (eso es la 2da etapa); arma la propuesta para que el dueño la apruebe.
const KB_PLAN_PROMPT = (kb) => `Sos un estratega de marketing de video. Te paso el Knowledge Base de un negocio. Devolvé SOLO un JSON (sin texto alrededor, sin markdown) con:
{
  "prospecto": "resumen claro del negocio en 3-4 frases: qué hace, a quién, su dolor, su diferenciador",
  "publico": ["1-3 segmentos objetivo, una linea cada uno"],
  "propuesta": {
    "perfil": "awareness | demo | conversion | campaña | solo-mockups",
    "piezas": [ { "objetivo": "awareness|consideracion|conversion", "angulo": "el angulo", "formato": "reel 9:16", "duracionSeg": 18 } ],
    "resumen": "1-2 frases de por que esta propuesta para este negocio"
  }
}
Reglas: español rioplatense, sin emojis, una pieza = un angulo = un objetivo. Para 'campaña' proponé ~3 awareness + 1 demo + 1 conversion. No inventes numeros/precios como reales.

KNOWLEDGE BASE:
${JSON.stringify(kb).slice(0, 9000)}`;

// ── Claude headless (local) ──────────────────────────────────────────────────
function runClaude(prompt, { cwd = REPO_CWD, allowedTools = 'Read,Grep,Glob,Bash,Edit,Write', timeout = 900_000 } = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.CLAUDECODE; delete env.CLAUDE_CODE_ENTRYPOINT;
    const args = ['-p', '--output-format', 'stream-json', '--verbose', '--allowedTools', allowedTools, '--permission-mode', 'bypassPermissions'];
    const proc = spawn(IS_WIN ? 'claude.cmd' : 'claude', args, { cwd, env, shell: IS_WIN });
    let out = '', errb = '';
    const killer = setTimeout(() => { proc.kill(); reject(new Error(`claude timeout (${timeout / 1000}s)`)); }, timeout);
    proc.on('error', (e) => { clearTimeout(killer); reject(new Error(`no se pudo lanzar claude: ${e.message}`)); });
    proc.stdout.on('data', (d) => (out += d));
    proc.stderr.on('data', (d) => (errb += d));
    proc.on('close', (code) => {
      clearTimeout(killer);
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${(errb || out).slice(0, 600)}`));
      let text = '', cost = 0; const tools = [];
      for (const raw of out.split('\n')) {
        const line = raw.trim(); if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'result') { text = ev.result || ''; cost = ev.total_cost_usd || ev.cost_usd || 0; }
        else if (ev.type === 'assistant') { for (const c of ev.message?.content || []) if (c.type === 'tool_use') tools.push(c.name); }
      }
      if (!text) return reject(new Error('respuesta vacía (sin evento result)'));
      resolve({ text: text.trim(), cost, tools });
    });
    proc.stdin.write(prompt); proc.stdin.end();
  });
}

// ── Gemini (prod) ────────────────────────────────────────────────────────────
async function runGemini(prompt) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY no configurada');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { thinkingConfig: { thinkingBudget: 0 } } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, cost: 0, tools: [] };
}

// ── IA: UNA interfaz, un solo switch (local → Claude headless · prod → Gemini) ──
// runAI({prompt, imageBuffer?}) es el único punto donde se decide el proveedor.
// Con imageBuffer = visión (en local, Claude lo lee con Read; en prod, Gemini inline).
async function runAI({ prompt, imageBuffer = null, cwd, allowedTools }) {
  if (IS_PROD) {
    if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY no configurada');
    const parts = [{ text: prompt }];
    if (imageBuffer) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBuffer.toString('base64') } });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { thinkingConfig: { thinkingBudget: 0 } } }) }
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '', cost: 0, tools: [] };
  }
  // local → Claude headless. Con imagen: la dejo en un temp y la lee con Read.
  if (imageBuffer) {
    const tmp = path.join(os.tmpdir(), `mstudio-ai-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
    fs.writeFileSync(tmp, imageBuffer);
    try { return await runClaude(`Mirá la imagen en "${tmp.replace(/\\/g, '/')}" usando la tool Read. ${prompt}`, { allowedTools: 'Read', timeout: 120_000 }); }
    finally { try { fs.unlinkSync(tmp); } catch { /* noop */ } }
  }
  return await runClaude(prompt, { cwd, allowedTools });
}

// ── Clasificación de video por IA sobre el thumbnail (los videos viven en Cloudinary) ──
const DEFAULT_VIDEO_TYPES = ['modelo', 'close-up', 'people', 'office', 'producto', 'exterior', 'interior', 'manos', 'pantalla', 'naturaleza'];

function parseTags(text, allowed) {
  let tags = [];
  const m = (text || '').match(/\[[\s\S]*?\]/);
  try { tags = JSON.parse(m ? m[0] : text); } catch { tags = []; }
  const set = new Set(allowed);
  return Array.isArray(tags)
    ? tags.filter((t) => typeof t === 'string' && set.has(t.toLowerCase().trim())).map((t) => t.toLowerCase().trim()).slice(0, 4)
    : [];
}

async function classifyVideoThumb(thumbUrl, types) {
  const allowed = (Array.isArray(types) && types.length ? types : DEFAULT_VIDEO_TYPES);
  const imgRes = await fetch(thumbUrl);
  if (!imgRes.ok) throw new Error(`no se pudo leer el thumbnail (${imgRes.status})`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const ask = `Es un frame de un video promocional. Devolvé SOLO un JSON array con 1 a 4 etiquetas de ESTA lista (exactas, minúscula, sin inventar otras): ${JSON.stringify(allowed)}. Únicamente el array.`;
  const { text } = await runAI({ prompt: ask, imageBuffer: buf });
  return parseTags(text, allowed);
}

// ── RENDER del montaje a mp4 (ffmpeg) ─────────────────────────────────────────
// MVP: secuencia de escenas (imagen + duración) → video 9:16 + pista de audio
// (ya mezclada por el editor: voz + música). Siguiente: video-clips, transiciones,
// efectos y texto como filtros. Las fuentes llegan como dataURL o URL (Cloudinary).
async function fetchToBuffer(src) {
  if (typeof src !== 'string') throw new Error('fuente inválida');
  if (src.startsWith('data:')) return Buffer.from(src.split(',')[1] || '', 'base64');
  const r = await fetch(src);
  if (!r.ok) throw new Error(`no se pudo bajar (${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

// resuelve los `file` de un plan de ensamblado: URL/dataURL → baja a un temp; path local → lo deja.
let _refSeq = 0;
async function resolveFileRefs(node, dir) {
  if (Array.isArray(node)) { for (const x of node) await resolveFileRefs(x, dir); return; }
  if (node && typeof node === 'object') {
    if (typeof node.file === 'string' && /^(https?:|data:)/i.test(node.file)) {
      const ext = node.file.startsWith('data:')
        ? (node.file.slice(5).split(';')[0].split('/')[1] || 'bin')
        : (node.file.split('?')[0].split('.').pop() || 'bin').slice(0, 4);
      const f = path.join(dir, `in-${_refSeq++}.${ext}`);
      fs.writeFileSync(f, await fetchToBuffer(node.file));
      node.file = f;
    }
    for (const k of Object.keys(node)) if (k !== 'file') await resolveFileRefs(node[k], dir);
  }
}
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let err = '';
    proc.stderr.on('data', (d) => (err += d));
    proc.on('error', (e) => reject(new Error(`no se pudo lanzar ffmpeg: ${e.message}`)));
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${err.slice(-500)}`))));
  });
}
// efectos soportados (mismos ids que el editor) y mapeo transición→nombre de xfade.
const EFFECT_IDS = new Set(['kenburns', 'vignette', 'grain', 'glow', 'bw', 'sepia', 'vivid', 'blur']);
const XFADE_MAP = { fade: 'fade', crossfade: 'dissolve', wipe: 'wipeleft', zoom: 'zoomin' };

// cadena de filtros de UNA escena: la encuadra a WxH (cover) y le aplica el efecto.
// kenburns hace un zoom-in lento (zoompan sobre la imagen sobredimensionada).
function sceneFilterChain(effect, w, h, fps) {
  if (effect === 'kenburns') {
    const ew = Math.ceil((w * 1.25) / 2) * 2, eh = Math.ceil((h * 1.25) / 2) * 2;
    return `scale=${ew}:${eh}:force_original_aspect_ratio=increase,crop=${ew}:${eh},`
      + `zoompan=z='min(1+0.0010*in\\,1.18)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${w}x${h}:fps=${fps},`
      + `setsar=1,format=yuv420p`;
  }
  const base = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps}`;
  const fx = {
    bw: 'hue=s=0,eq=contrast=1.05', glow: 'eq=brightness=0.06:saturation=1.35', vignette: 'vignette', grain: 'noise=alls=16:allf=t',
    sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131', vivid: 'eq=saturation=1.5:contrast=1.12', blur: 'gblur=sigma=6',
  }[effect] || '';
  return `${base}${fx ? ',' + fx : ''},format=yuv420p`;
}

// scenes: [{ image, dur, effect?, transition? }]. effect = efecto de ESA escena;
// transition = transición de ENTRADA a esa escena (la primera la ignora). Sin
// efectos ni transiciones cae al concat demuxer (rápido). Con ellos arma xfade.
async function renderMp4({ width = 1080, height = 1920, fps = 30, scenes, audio }) {
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('sin escenas para renderizar');
  const W = width, H = height, F = fps;
  const durs = scenes.map((s) => Math.max(0.3, Number(s.dur) || 2.5));
  const effects = scenes.map((s) => (EFFECT_IDS.has(s.effect) ? s.effect : null));
  const transitions = scenes.map((s) => s.transition || null);
  const hasFx = effects.some(Boolean) || transitions.slice(1).some((t) => t && t !== 'cut');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mstudio-render-'));
  try {
    for (let i = 0; i < scenes.length; i++) fs.writeFileSync(path.join(dir, `s${i}.jpg`), await fetchToBuffer(scenes[i].image));
    let audioFile = null;
    if (audio) { audioFile = path.join(dir, 'audio.bin'); fs.writeFileSync(audioFile, await fetchToBuffer(audio)); }
    const out = path.join(dir, 'out.mp4');

    // ── Camino simple: sin efectos ni transiciones → concat demuxer ──
    if (!hasFx) {
      const list = [];
      for (let i = 0; i < scenes.length; i++) list.push(`file '${path.join(dir, `s${i}.jpg`).replace(/\\/g, '/')}'`, `duration ${durs[i].toFixed(2)}`);
      list.push(`file '${path.join(dir, `s${scenes.length - 1}.jpg`).replace(/\\/g, '/')}'`);
      const listFile = path.join(dir, 'list.txt');
      fs.writeFileSync(listFile, list.join('\n'));
      const vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${F},format=yuv420p`;
      const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listFile];
      if (audioFile) args.push('-i', audioFile);
      args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
      if (audioFile) args.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
      args.push('-movflags', '+faststart', out);
      await runFfmpeg(args);
      return fs.readFileSync(out);
    }

    // ── Camino con efectos + transiciones: filter_complex + xfade encadenado ──
    const args = ['-y'];
    for (let i = 0; i < scenes.length; i++) args.push('-loop', '1', '-t', durs[i].toFixed(2), '-i', path.join(dir, `s${i}.jpg`));
    const audioIdx = scenes.length;
    if (audioFile) args.push('-i', audioFile);

    const parts = [];
    for (let i = 0; i < scenes.length; i++) parts.push(`[${i}:v]${sceneFilterChain(effects[i], W, H, F)}[v${i}]`);

    // encadena xfade: cada uno mezcla el acumulado con la escena k. offset/duración
    // se derivan de la duración acumulada (cut = solape mínimo ≈ corte seco).
    let chain = '[v0]', prevDur = durs[0], lastLabel = 'v0';
    for (let k = 1; k < scenes.length; k++) {
      const isCut = !transitions[k] || transitions[k] === 'cut';
      const dt = isCut ? Math.min(0.08, durs[k] * 0.4, prevDur * 0.4) : Math.min(0.6, durs[k] * 0.5, prevDur * 0.5);
      const off = Math.max(0, prevDur - dt);
      const t = XFADE_MAP[transitions[k]] || 'fade';
      lastLabel = (k === scenes.length - 1) ? 'outv' : `x${k}`;
      parts.push(`${chain}[v${k}]xfade=transition=${t}:duration=${dt.toFixed(3)}:offset=${off.toFixed(3)}[${lastLabel}]`);
      chain = `[${lastLabel}]`;
      prevDur = prevDur + durs[k] - dt;
    }
    const vOut = `[${lastLabel}]`;
    args.push('-filter_complex', parts.join(';'), '-map', vOut);
    if (audioFile) args.push('-map', `${audioIdx}:a`);
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(F));
    if (audioFile) args.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
    args.push('-movflags', '+faststart', out);
    await runFfmpeg(args);
    return fs.readFileSync(out);
  } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } }
}

// ── Videos locales (dev) ─────────────────────────────────────────────────────
function listLocalVideos() {
  const files = fs.existsSync(VIDEOS_DIR) ? fs.readdirSync(VIDEOS_DIR) : [];
  return files
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .map((name) => {
      const st = fs.statSync(path.join(VIDEOS_DIR, name));
      return { name, size: st.size, mtime: st.mtimeMs, url: `/api/videos/file/${encodeURIComponent(name)}` };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function streamVideo(req, res, name) {
  const file = path.join(VIDEOS_DIR, path.basename(name));
  if (!fs.existsSync(file)) return json(res, 404, { error: 'no existe' });
  const st   = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m     = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? Number(m[1]) : 0;
    const end   = m && m[2] ? Number(m[2]) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(file).pipe(res);
  }
}

// ── Cloudinary upload ────────────────────────────────────────────────────────
async function uploadToCloudinary(buffer, filename, folder = CLD_FOLDER) {
  if (!CLD_CLOUD || !CLD_KEY || !CLD_SECRET) throw new Error('Cloudinary no configurado (faltan CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)');

  const { createHash } = await import('node:crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const params    = { folder, timestamp };
  const sigStr    = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + CLD_SECRET;
  const signature = createHash('sha1').update(sigStr).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'video/mp4' }), filename);
  form.append('api_key', CLD_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('resource_type', 'video');

  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLD_CLOUD}/video/upload`, { method: 'POST', body: form });
  if (!r.ok) { const e = await r.text(); throw new Error(`Cloudinary error ${r.status}: ${e}`); }
  return await r.json();
}

// ── Storage de assets: LOCAL (disco) en dev, Cloudinary en prod (switch por IS_PROD) ──
// saveAsset devuelve el MISMO shape que Cloudinary (secure_url, public_id, bytes…) para no tocar
// el front. En local los archivos viven en STORAGE_DIR y se sirven por /api/storage/<ruta>.
// El día que vayas online: IS_PROD=true → Cloudinary; o el botón "Actualizar nube" sincroniza.
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve('server/storage');
const MIME_MORE = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4' };

async function saveAsset(buffer, filename, folder = CLD_FOLDER, contentType = '') {
  if (IS_PROD) return uploadToCloudinary(buffer, filename, folder);   // online → Cloudinary
  const dir = path.join(STORAGE_DIR, folder);                          // local → disco
  fs.mkdirSync(dir, { recursive: true });
  const safe = `${Date.now()}-${path.basename(filename).replace(/[^\w.\-]+/g, '_')}`;
  fs.writeFileSync(path.join(dir, safe), buffer);
  const rel = `${folder}/${safe}`.replace(/\\/g, '/');
  const url = `http://localhost:${PORT}/api/storage/${rel}`;
  return { secure_url: url, url, public_id: rel, bytes: buffer.length, duration: null, local: true,
    resource_type: /^video/.test(contentType) ? 'video' : /^audio/.test(contentType) ? 'video' : 'image' };
}

// stream genérico de un archivo del disco (con range para seek de video/audio).
function streamFile(req, res, file) {
  const st = fs.statSync(file);
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || MIME_MORE[ext] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? Number(m[1]) : 0;
    const end = m && m[2] ? Number(m[2]) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(file).pipe(res);
  }
}

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p   = url.pathname;

  try {
    // ── health ──────────────────────────────────────────────────────────────
    if (p === '/api/health') {
      return json(res, 200, { ok: true, env: IS_PROD ? 'prod' : 'local', videosDir: VIDEOS_DIR, db: DB_PATH, cloudinary: !!CLD_CLOUD, gemini: !!GEMINI_KEY, functions: IMPLEMENTED_FUNCTIONS, storage: IS_PROD ? 'cloudinary' : 'local' });
    }

    // ── assets locales (storage en dev) — sirve lo que guardó saveAsset ───────
    if (p.startsWith('/api/storage/') && req.method === 'GET') {
      const rel = decodeURIComponent(p.slice('/api/storage/'.length));
      const file = path.join(STORAGE_DIR, rel);
      if (!path.resolve(file).startsWith(path.resolve(STORAGE_DIR))) return json(res, 403, { error: 'ruta inválida' });
      if (!fs.existsSync(file)) return json(res, 404, { error: 'no existe' });
      return streamFile(req, res, file);
    }

    // ── AI pipeline ──────────────────────────────────────────────────────────
    if (p === '/api/claude' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (!body.prompt?.trim()) return json(res, 400, { error: 'prompt vacío' });
      const r = IS_PROD
        ? await runGemini(body.prompt)
        : await runClaude(body.prompt, { cwd: body.cwd, allowedTools: body.allowedTools });
      return json(res, 200, r);
    }

    // ── videos locales (dev) ─────────────────────────────────────────────────
    if (p === '/api/videos' && req.method === 'GET') {
      return json(res, 200, { dir: VIDEOS_DIR, videos: IS_PROD ? [] : listLocalVideos() });
    }
    if (p.startsWith('/api/videos/file/') && req.method === 'GET') {
      return streamVideo(req, res, decodeURIComponent(p.slice('/api/videos/file/'.length)));
    }

    // ── cloud videos ─────────────────────────────────────────────────────────
    if (p === '/api/cloud-videos' && req.method === 'GET') {
      return json(res, 200, { videos: listCloudVideos() });
    }

    if (p === '/api/cloud-videos/upload' && req.method === 'POST') {
      // Recibe multipart/form-data con el video
      // Usamos una implementación simple de lectura de body binario
      const chunks = [];
      await new Promise((resolve) => { req.on('data', (c) => chunks.push(c)); req.on('end', resolve); });
      const raw = Buffer.concat(chunks);

      // Extraer filename del Content-Disposition (simplificado)
      const contentType = req.headers['content-type'] || '';
      const boundary    = contentType.split('boundary=')[1];
      let filename      = 'video.mp4';
      if (boundary) {
        const match = raw.toString('latin1').match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }

      // Extraer el body del archivo (parte del multipart)
      let fileBuffer = raw;
      if (boundary) {
        const sep   = `--${boundary}`;
        const parts = raw.toString('latin1').split(sep);
        for (const part of parts) {
          if (part.includes('Content-Disposition') && part.includes('name="file"')) {
            const idx = part.indexOf('\r\n\r\n');
            if (idx !== -1) {
              const content = part.slice(idx + 4, -2);
              fileBuffer = Buffer.from(content, 'latin1');
            }
          }
        }
      }

      const cldRes = await saveAsset(fileBuffer, filename, CLD_FOLDER, 'video/mp4');
      const saved  = saveCloudVideo({
        public_id:    cldRes.public_id,
        name:         filename,
        url:          cldRes.secure_url,
        thumbnail:    cldRes.local ? cldRes.secure_url : cldRes.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg'),
        duration_sec: cldRes.duration,
        size_bytes:   cldRes.bytes,
        source:       cldRes.local ? 'local' : 'cloudinary',
      });
      return json(res, 200, { video: saved });
    }

    if (p.startsWith('/api/cloud-videos/') && req.method === 'DELETE') {
      const id  = decodeURIComponent(p.slice('/api/cloud-videos/'.length));
      const ok  = deleteCloudVideo(id);
      return json(res, ok ? 200 : 404, { ok });
    }

    // ── clasificación de video por IA (auto-tags por tipo) ────────────────────
    if (p === '/api/classify-video' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (!body.thumbnail) return json(res, 400, { error: 'falta thumbnail' });
      const tags = await classifyVideoThumb(body.thumbnail, body.types);
      return json(res, 200, { tags });
    }

    // ── render del montaje a mp4 (ffmpeg) ─────────────────────────────────────
    if (p === '/api/render' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const mp4 = await renderMp4(body);
      res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': mp4.length, 'Access-Control-Allow-Origin': '*' });
      return res.end(mp4);
    }

    // ── ENSAMBLADO del reel final (familias A/B del mkreels) a mp4 ─────────────
    // body.plan = { family:'A'|'B', presenter/mid/broll/music/voice/logo: {file} }. Cada `file`
    // puede ser path local, URL (Cloudinary) o dataURL → se baja a temp. Devuelve el mp4.
    if (p === '/api/assemble' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mstudio-asmin-'));
      try {
        await resolveFileRefs(body.plan, dir);
        const mp4 = await assemble(body.plan, runFfmpeg);
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': mp4.length, 'Access-Control-Allow-Origin': '*' });
        return res.end(mp4);
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error ensamblando' }); }
      finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } }
    }

    // ── TTS (ElevenLabs, LOCAL) ───────────────────────────────────────────────
    // Antes salía a un Cloud Run (tts-service); ahora el backend pega directo a ElevenLabs con tu key.
    // Lista de voces de TU API key — mapea las labels de ElevenLabs al shape plano que usa el front.
    if (p === '/api/tts/voices' && req.method === 'GET') {
      if (!ELEVEN_KEY) return json(res, 503, { error: 'falta ELEVENLABS_API_KEY (.env)' });
      try {
        const r = await fetch(`${ELEVEN_API}/voices`, { headers: { 'xi-api-key': ELEVEN_KEY } });
        if (!r.ok) return json(res, 502, { error: `ElevenLabs ${r.status}` });
        const d = await r.json();
        const voices = (d.voices || []).map((v) => ({
          voice_id: v.voice_id, name: v.name,
          accent: v.labels?.accent || '', gender: v.labels?.gender || '', age: v.labels?.age || '',
          use_case: v.labels?.use_case || v.labels?.['use case'] || '',
          description: v.labels?.description || v.description || '',
          preview_url: v.preview_url || '',
        }));
        return json(res, 200, { voices });
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error voces' }); }
    }
    // Genera el audio de una voz — mismo body que iba al Cloud Run; devuelve audio/mpeg.
    if (p === '/api/tts/generate' && req.method === 'POST') {
      if (!ELEVEN_KEY) return json(res, 503, { error: 'falta ELEVENLABS_API_KEY (.env)' });
      const b = JSON.parse((await readBody(req)) || '{}');
      if (!b.text || !b.voice_id) return json(res, 400, { error: 'faltan text/voice_id' });
      try {
        const r = await fetch(`${ELEVEN_API}/text-to-speech/${b.voice_id}`, {
          method: 'POST',
          headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({
            text: b.text,
            model_id: b.model_id || 'eleven_multilingual_v2',
            voice_settings: {
              stability: b.stability ?? 0.4,
              similarity_boost: b.similarity_boost ?? 0.8,
              style: b.style ?? 0.5,
              use_speaker_boost: b.use_speaker_boost ?? true,
              speed: b.speed ?? 1.0,
            },
          }),
        });
        if (!r.ok) { const t = await r.text(); return json(res, 502, { error: `ElevenLabs ${r.status} · ${t.slice(0, 160)}` }); }
        const buf = Buffer.from(await r.arrayBuffer());
        res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length, 'Access-Control-Allow-Origin': '*' });
        return res.end(buf);
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error generando' }); }
    }
    // "Agregar vida": toma el guion plano y le mete cadencia (pausas …, ÉNFASIS, tags de tono) que el
    // VoiceStudio ya convierte a <break>/mayúsculas para ElevenLabs. On-demand, 1 llamada a Claude headless.
    if (p === '/api/tts/cadence' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req)) || '{}');
      const src = (b.text || '').trim();
      if (!src) return json(res, 400, { error: 'falta text' });
      const prompt = `Sos director de doblaje. Te paso un guion para voz en off (TTS). Devolvé TRES variantes del MISMO texto "actuado" con marcas, cada una con un carácter distinto:
- Variante 1 — LOCUCIÓN sobria: pausas justas, énfasis solo en lo esencial, poco o ningún tag de tono.
- Variante 2 — VENDEDORA enérgica: más énfasis y ritmo, [excited] donde sube la energía.
- Variante 3 — CERCANA/intrigante: tonos variados ([curious], [whispers], [sighs]) y pausas más dramáticas.
Marcas que entiende el motor de voz:
- Pausas: poné "…" en los cortes naturales (respiración, antes de un giro o del cierre).
- Énfasis: palabras CLAVE en MAYÚSCULAS.
- Tono: arrancá una frase con UN tag entre corchetes: [excited], [serious], [whispers], [curious], [sighs].
En las TRES: NO cambies las palabras, el orden ni agregues frases — SOLO agregás marcas. Una frase por línea (mantené los saltos). Rioplatense, sin emojis.
Devolvé SOLO JSON: { "variants": ["variante 1 con \\n entre frases", "variante 2", "variante 3"] }

GUION:
${src}`;
      try {
        const { text } = await runAI({ prompt, allowedTools: 'Read' });
        const o = extractJson(text);
        const variants = Array.isArray(o?.variants) ? o.variants.filter((v) => typeof v === 'string' && v.trim())
          : (o && typeof o.text === 'string' && o.text.trim() ? [o.text] : []);
        return json(res, 200, { variants: variants.length ? variants : [src] });
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error cadencia' }); }
    }
    // REEL ANIMADO (mockup reel) — genera el boceto en VIDEO desde la metadata 1.2 que MANDA LA APP
    // (slides del mockup + brand del KB). NADA hardcodeado. Render HTML→mp4 (Playwright + ffmpeg).
    if (p === '/api/mockup-reel' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req)) || '{}');
      const slides = Array.isArray(b.slides) ? b.slides : [];
      if (!slides.length) return json(res, 400, { error: 'sin slides en la metadata' });
      const badge = (s) => String(s || '').split(/[—·-]/)[0].trim()
        .replace(/^(list|timeline|grid|form|detail|view|screen)[_\s]/i, '').replace(/_/g, ' ').toUpperCase().slice(0, 20);
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mreel-'));
      try {
        const data = {
          brand: b.brand || {},
          footer: b.footer || '',
          slides: slides.map((s) => ({
            badge: badge(s.badge || s.screen || s.label),
            title: s.title || s.highlight || s.copy || '',
            accent: s.accent || s.copy || '',
          })),
        };
        const out = path.join(dir, 'reel.mp4');
        await renderMockupReel(data, out, { runFfmpeg, tmpDir: dir });
        const mp4 = fs.readFileSync(out);
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': mp4.length, 'Access-Control-Allow-Origin': '*' });
        return res.end(mp4);
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error render reel animado' }); }
      finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } }
    }

    // ── proyectos ────────────────────────────────────────────────────────────
    if (p === '/api/projects' && req.method === 'GET')  return json(res, 200, { projects: listProjects(url.searchParams.get('full') === '1') });
    if (p === '/api/projects' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      return json(res, 200, { project: saveProject({ id: body.id, name: body.name, data: body.data }) });
    }

    // assets por proyecto — MÁS ESPECÍFICO que /{id}, va primero
    if (p.match(/^\/api\/projects\/[^/]+\/assets$/) && req.method === 'GET') {
      const projId = decodeURIComponent(p.replace(/^\/api\/projects\//, '').replace(/\/assets$/, ''));
      const proj = getProject(projId);
      if (!proj) return json(res, 404, { error: 'proyecto no existe' });
      return json(res, 200, { assets: proj.data.assets || [] });
    }

    if (p.match(/^\/api\/projects\/[^/]+\/assets$/) && req.method === 'POST') {
      const projId = decodeURIComponent(p.replace(/^\/api\/projects\//, '').replace(/\/assets$/, ''));
      const proj = getProject(projId);
      if (!proj) return json(res, 404, { error: 'proyecto no existe' });

      const chunks = [];
      await new Promise((resolve) => { req.on('data', (c) => chunks.push(c)); req.on('end', resolve); });
      const raw = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundary = contentType.split('boundary=')[1];
      let filename = 'asset'; let fileBuffer = raw;
      if (boundary) {
        const m = raw.toString('latin1').match(/filename="([^"]+)"/);
        if (m) filename = m[1];
        const parts = raw.toString('latin1').split(`--${boundary}`);
        for (const part of parts) {
          if (part.includes('Content-Disposition') && part.includes('name="file"')) {
            const idx = part.indexOf('\r\n\r\n');
            if (idx !== -1) fileBuffer = Buffer.from(part.slice(idx + 4, -2), 'latin1');
          }
        }
      }
      const ext = path.extname(filename).toLowerCase();
      const tipo = ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext) ? 'audio' : ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? 'image' : 'video';
      const folder = `${CLD_FOLDER}/${projId}`;
      const mime = tipo === 'video' ? 'video/mp4' : tipo === 'audio' ? 'audio/mpeg' : 'image/png';
      const cldRes = await saveAsset(fileBuffer, filename, folder, mime);
      const asset = { tipo, name: filename, cloudinaryUrl: cldRes.secure_url, createdAt: Date.now() };
      const assets = [...(proj.data.assets || []), asset];
      saveProject({ id: projId, name: proj.name, data: { ...proj.data, assets } });
      return json(res, 200, { asset });
    }

    // actualizar proyecto por id
    if (p.startsWith('/api/projects/') && req.method === 'POST') {
      const id = decodeURIComponent(p.slice('/api/projects/'.length));
      const existing = getProject(id);
      if (!existing) return json(res, 404, { error: 'proyecto no existe' });
      const body = JSON.parse((await readBody(req)) || '{}');
      return json(res, 200, { project: saveProject({ id, name: body.name ?? existing.name, data: body.data !== undefined ? body.data : existing.data }) });
    }

    if (p.startsWith('/api/projects/') && req.method === 'GET') {
      const proj = getProject(decodeURIComponent(p.slice('/api/projects/'.length)));
      return proj ? json(res, 200, { project: proj }) : json(res, 404, { error: 'no existe' });
    }
    if (p.startsWith('/api/projects/') && req.method === 'DELETE') {
      const ok = deleteProject(decodeURIComponent(p.slice('/api/projects/'.length)));
      return json(res, ok ? 200 : 404, { ok });
    }

    // ── app configs (voice settings por app) ─────────────────────────────────
    if (p === '/api/apps' && req.method === 'GET') {
      return json(res, 200, { apps: listAppConfigs() });
    }
    if (p.startsWith('/api/apps/') && req.method === 'GET') {
      const app_id = decodeURIComponent(p.slice('/api/apps/'.length));
      const cfg    = getAppConfig(app_id);
      return cfg ? json(res, 200, { config: cfg }) : json(res, 404, { error: 'app no configurada' });
    }
    if (p.startsWith('/api/apps/') && req.method === 'POST') {
      const app_id = decodeURIComponent(p.slice('/api/apps/'.length));
      const body   = JSON.parse((await readBody(req)) || '{}');
      const saved  = saveAppConfig({ app_id, ...body });
      return json(res, 200, { config: saved });
    }
    if (p.startsWith('/api/apps/') && req.method === 'DELETE') {
      const app_id = decodeURIComponent(p.slice('/api/apps/'.length));
      const ok     = deleteAppConfig(app_id);
      return json(res, ok ? 200 : 404, { ok });
    }

    // ── Integraciones (KSP): lista del registro + traer el KB ────────────────
    if (p === '/api/kb/apps' && req.method === 'GET') {
      const apps = loadKbApps().map((a) => ({ id: a.id, name: a.nombre, base_url: a.servidor || '', ready: !!a.servidor }));
      return json(res, 200, { apps });
    }
    if (p === '/api/kb/fetch' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const app = loadKbApps().find((a) => a.id === body.appId);
      if (!app) return json(res, 404, { error: 'esa Integración no está en el registro' });
      try { return json(res, 200, { app: { id: app.id, name: app.nombre }, kb: await fetchKbFor(app) }); }
      catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error trayendo el KB' }); }
    }
    // trae el KB + chequea la salud (1.2: pantallas = METADATA descriptiva, no URLs; logo inline/URL).
    if (p === '/api/kb/inspect' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const app = loadKbApps().find((a) => a.id === body.appId);
      if (!app) return json(res, 404, { error: 'esa Integración no está en el registro' });
      try {
        const kb = await fetchKbFor(app);
        // logo: 1.2 puede venir SVG inline (brand.logo.svg) o URL propia. inline = ok directo.
        const logoSvg = kb.brand?.logo?.svg;
        const logoUrl = kb.brand?.logo?.primary || kb.brand?.logo?.isotype || '';
        const logo = logoSvg ? { ok: true, inline: true }
          : logoUrl ? { url: logoUrl, ...(await inspectUrl(logoUrl, 'svg')) }
          : { ok: false, reason: 'sin logo en el KB' };
        // screens 1.2 = metadata: ok si está bien descrita (kind + components/data/layout). NO se chequea URL.
        const screens = (kb.screens || []).map((s) => {
          const dataN = Array.isArray(s.data) ? s.data.length : (s.data ? 1 : 0);
          const ok = !!(s.kind && ((s.components || []).length || dataN || s.layout));
          return { label: s.label, kind: s.kind, headline: s.headline, components: (s.components || []).length, data: dataN, ok, reason: ok ? undefined : 'falta metadata (kind/components/data)' };
        });
        const encodingOk = !JSON.stringify(kb).includes('â€');
        return json(res, 200, { app: { id: app.id, name: app.nombre }, kb, health: { logo, screens, encodingOk } });
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error inspeccionando' }); }
    }
    // del KB → prospecto + propuesta de trabajo (con IA).
    if (p === '/api/kb/plan' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (!body.kb) return json(res, 400, { error: 'falta el kb' });
      try {
        const { text } = await runAI({ prompt: KB_PLAN_PROMPT(body.kb), allowedTools: 'Read' });
        return json(res, 200, { plan: extractJson(text) });
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error armando el plan' }); }
    }

    // ── Proceso guiado: corre UNA función del catálogo on-demand (1 llamada IA) ───
    // El front manda { functionId, context, options, regenerate }. El backend arma el
    // prompt (molde de la función) y lo corre con la IA. regenerate = { clipId, sequence }
    // rehace solo ese ítem. Barato: 1 llamada por botón, nunca el panel completo.
    if (p === '/api/run-function' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (!body.functionId) return json(res, 400, { error: 'falta functionId' });
      try {
        const { prompt, mode } = buildFunctionPrompt(body);
        const { text } = await runAI({ prompt, allowedTools: 'Read' });
        return json(res, 200, { functionId: body.functionId, mode, result: parseFunctionResult(body.functionId, text, body) });
      } catch (e) { return json(res, 502, { error: e instanceof Error ? e.message : 'error corriendo la función' }); }
    }

    return json(res, 404, { error: 'not found' });
  } catch (e) {
    console.error('[media-studio]', e);
    return json(res, 500, { error: e instanceof Error ? e.message : 'error' });
  }
});

server.listen(PORT, () => {
  console.log(`[media-studio] backend en http://localhost:${PORT} (${IS_PROD ? 'PROD/Gemini' : 'LOCAL/Claude'})`);
  if (!IS_PROD) console.log(`[media-studio] videos dir: ${VIDEOS_DIR}`);
  if (CLD_CLOUD) console.log(`[media-studio] cloudinary: ${CLD_CLOUD}/${CLD_FOLDER}`);
  console.log(`[media-studio] sqlite: ${DB_PATH}`);
});
