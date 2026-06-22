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

const PORT      = Number(process.env.STUDIO_PORT || 5301);
const VIDEOS_DIR = process.env.VIDEOS_DIR || 'D:/Code/sugerenciasMun/reels/videos';
const REPO_CWD  = process.env.STUDIO_CWD  || 'D:/Code';
const IS_WIN    = process.platform === 'win32';
const IS_PROD   = process.env.IS_PROD === 'true' || process.env.NODE_ENV === 'production';

// Cloudinary (solo en prod o si están las vars seteadas)
const CLD_CLOUD  = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLD_KEY    = process.env.CLOUDINARY_API_KEY    || '';
const CLD_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLD_FOLDER = process.env.CLOUDINARY_FOLDER     || 'media-studio';

// Gemini (prod)
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v']);
const MIME      = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4' };

if (!IS_PROD) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// ── helpers ─────────────────────────────────────────────────────────────────
const json    = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)); });

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
      return json(res, 200, { ok: true, env: IS_PROD ? 'prod' : 'local', videosDir: VIDEOS_DIR, db: DB_PATH, cloudinary: !!CLD_CLOUD, gemini: !!GEMINI_KEY });
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

      const cldRes = await uploadToCloudinary(fileBuffer, filename);
      const saved  = saveCloudVideo({
        public_id:    cldRes.public_id,
        name:         filename,
        url:          cldRes.secure_url,
        thumbnail:    cldRes.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg'),
        duration_sec: cldRes.duration,
        size_bytes:   cldRes.bytes,
        source:       'cloudinary',
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

    // ── proyectos ────────────────────────────────────────────────────────────
    if (p === '/api/projects' && req.method === 'GET')  return json(res, 200, { projects: listProjects() });
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
      const cldRes = await uploadToCloudinary(fileBuffer, filename, folder);
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
