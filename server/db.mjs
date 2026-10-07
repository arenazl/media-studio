// Persistencia LOCAL del media-studio — SQLite nativo (node:sqlite, Node 22+).
// Tablas:
//   projects     — estado del pipeline (audio, reel, videos, montaje, export) por proyecto
//   cloud_videos — metadata de videos subidos a Cloudinary (dev: URL local; prod: URL CDN)
//   app_configs  — configuración de voz guardada por app_id (salesbot, munify, etc.)
//   generation_runs — una fila por llamada a la IA (Fase 9, observabilidad) y la caché por generationKey (Fase 6)
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.STUDIO_DB || path.join(HERE, 'media-studio.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    data       TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cloud_videos (
    id           TEXT PRIMARY KEY,
    public_id    TEXT NOT NULL,
    name         TEXT NOT NULL,
    url          TEXT NOT NULL,
    thumbnail    TEXT,
    duration_sec REAL,
    size_bytes   INTEGER,
    source       TEXT NOT NULL DEFAULT 'cloudinary',
    created_at   INTEGER NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_configs (
    app_id     TEXT PRIMARY KEY,
    name       TEXT NOT NULL DEFAULT '',
    api_url    TEXT NOT NULL DEFAULT '',
    voice_id   TEXT NOT NULL DEFAULT '',
    stability  REAL NOT NULL DEFAULT 0.5,
    similarity REAL NOT NULL DEFAULT 0.75,
    style      REAL NOT NULL DEFAULT 0.15,
    speed      REAL NOT NULL DEFAULT 1.0,
    model      TEXT NOT NULL DEFAULT 'eleven_v3',
    extra      TEXT NOT NULL DEFAULT '{}',
    updated_at INTEGER NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS generation_runs (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL DEFAULT '',
    piece_id        TEXT NOT NULL DEFAULT '',
    function_id     TEXT NOT NULL,
    prompt_version  TEXT NOT NULL DEFAULT '',
    provider        TEXT NOT NULL DEFAULT 'claude',
    model           TEXT NOT NULL DEFAULT '',
    model_real      TEXT NOT NULL DEFAULT '',
    generation_key  TEXT NOT NULL DEFAULT '',
    started_at      INTEGER NOT NULL,
    finished_at     INTEGER NOT NULL,
    duration_ms     INTEGER NOT NULL DEFAULT 0,
    api_ms          INTEGER NOT NULL DEFAULT 0,
    input_chars     INTEGER NOT NULL DEFAULT 0,
    output_chars    INTEGER NOT NULL DEFAULT 0,
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    thinking_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd        REAL NOT NULL DEFAULT 0,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'ok',
    error_type      TEXT NOT NULL DEFAULT '',
    validation_json TEXT NOT NULL DEFAULT '[]',
    result_json     TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS generation_runs_key ON generation_runs (generation_key, finished_at);
  CREATE INDEX IF NOT EXISTS generation_runs_fn ON generation_runs (function_id, finished_at);
`);

// ── GENERATION RUNS (Fase 9) ────────────────────────────────────────────────
export function saveGenerationRun(r) {
  const id = randomUUID();
  db.prepare(`INSERT INTO generation_runs (id, project_id, piece_id, function_id, prompt_version, provider, model, model_real, generation_key,
    started_at, finished_at, duration_ms, api_ms, input_chars, output_chars, input_tokens, output_tokens, thinking_tokens, cost_usd, retry_count, status, error_type, validation_json, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, r.project_id || '', r.piece_id || '', r.function_id, r.prompt_version || '', r.provider || 'claude', r.model || '', r.model_real || '', r.generation_key || '',
    r.started_at, r.finished_at, r.duration_ms || 0, r.api_ms || 0, r.input_chars || 0, r.output_chars || 0, r.input_tokens || 0, r.output_tokens || 0, r.thinking_tokens || 0,
    r.cost_usd || 0, r.retry_count || 0, r.status || 'ok', r.error_type || '', JSON.stringify(r.validation || []), r.result_json || '');
  return id;
}
export function listGenerationRuns({ limit = 50, functionId } = {}) {
  const cols = 'id, project_id, piece_id, function_id, prompt_version, provider, model, model_real, generation_key, started_at, finished_at, duration_ms, api_ms, input_chars, output_chars, input_tokens, output_tokens, thinking_tokens, cost_usd, retry_count, status, error_type, validation_json';
  return functionId
    ? db.prepare(`SELECT ${cols} FROM generation_runs WHERE function_id = ? ORDER BY finished_at DESC LIMIT ?`).all(functionId, limit)
    : db.prepare(`SELECT ${cols} FROM generation_runs ORDER BY finished_at DESC LIMIT ?`).all(limit);
}
// Fase 6: la última corrida VÁLIDA con la misma clave (mismo molde, misma versión, mismo input, mismo modelo).
export function findCachedRun(generationKey) {
  // OJO: en este Node, `.get()` sin match devuelve un objeto con todo null (no undefined): rowOrNull lo filtra.
  const row = rowOrNull(db.prepare(`SELECT result_json, finished_at, model_real FROM generation_runs WHERE generation_key = ? AND status = 'ok' AND validation_json = '[]' AND result_json != '' ORDER BY finished_at DESC LIMIT 1`).get(generationKey), 'finished_at');
  if (!row || !row.result_json) return null;
  try { return { result: JSON.parse(row.result_json), finished_at: row.finished_at, model_real: row.model_real }; } catch { return null; }
}

// ── PROJECTS ────────────────────────────────────────────────────────────────
// `full` incluye `data` (el proyecto entero) — lo usa la hidratación server-first del front
// (GET /api/projects?full=1). Sin `full`, solo el resumen (más liviano para listar).
export function listProjects(full = false) {
  const cols = full ? 'id, name, data, created_at, updated_at' : 'id, name, created_at, updated_at';
  const rows = db.prepare(`SELECT ${cols} FROM projects ORDER BY updated_at DESC`).all();
  return full ? rows.map((r) => ({ ...r, data: JSON.parse(r.data || '{}') })) : rows;
}

// OJO node:sqlite (Node 22.5.x): `.get()` devuelve una fila con TODAS las columnas en null en vez
// de `undefined` cuando no hay match (bug de esa versión, arreglado más adelante). Por eso NO
// alcanza con la truthiness de `.get()` — hay que chequear la PK. `rowOrNull` lo centraliza.
const rowOrNull = (row, pk) => (row && row[pk] != null ? row : null);
function existsBy(table, pk, val) {
  return rowOrNull(db.prepare(`SELECT ${pk} FROM ${table} WHERE ${pk} = ?`).get(val), pk) != null;
}

export function getProject(id) {
  const row = rowOrNull(db.prepare('SELECT * FROM projects WHERE id = ?').get(id), 'id');
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data || '{}') };
}

export function saveProject({ id, name, data }) {
  const now = Date.now();
  const json = JSON.stringify(data ?? {});
  const safeName = (name && String(name).trim()) || 'Proyecto sin título';
  if (id && existsBy('projects', 'id', id)) {
    db.prepare('UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(safeName, json, now, id);
    return getProject(id);
  }
  const newId = id || randomUUID();
  db.prepare('INSERT INTO projects (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(newId, safeName, json, now, now);
  return getProject(newId);
}

export function deleteProject(id) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0;
}

// ── CLOUD VIDEOS ────────────────────────────────────────────────────────────
export function listCloudVideos() {
  return db.prepare('SELECT * FROM cloud_videos ORDER BY created_at DESC').all();
}

export function saveCloudVideo({ public_id, name, url, thumbnail, duration_sec, size_bytes, source = 'cloudinary' }) {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    'INSERT OR REPLACE INTO cloud_videos (id, public_id, name, url, thumbnail, duration_sec, size_bytes, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, public_id, name, url, thumbnail || null, duration_sec || null, size_bytes || null, source, now);
  return db.prepare('SELECT * FROM cloud_videos WHERE id = ?').get(id);
}

export function deleteCloudVideo(id) {
  return db.prepare('DELETE FROM cloud_videos WHERE id = ?').run(id).changes > 0;
}

// ── APP CONFIGS ─────────────────────────────────────────────────────────────
export function getAppConfig(app_id) {
  return rowOrNull(db.prepare('SELECT * FROM app_configs WHERE app_id = ?').get(app_id), 'app_id');
}

export function listAppConfigs() {
  return db.prepare('SELECT * FROM app_configs ORDER BY updated_at DESC').all();
}

export function saveAppConfig({ app_id, name, api_url, voice_id, stability, similarity, style, speed, model, extra }) {
  const now = Date.now();
  const extraJson = JSON.stringify(extra ?? {});
  const existing = existsBy('app_configs', 'app_id', app_id);
  if (existing) {
    db.prepare(
      'UPDATE app_configs SET name=?, api_url=?, voice_id=?, stability=?, similarity=?, style=?, speed=?, model=?, extra=?, updated_at=? WHERE app_id=?'
    ).run(name ?? '', api_url ?? '', voice_id ?? '', stability ?? 0.5, similarity ?? 0.75, style ?? 0.15, speed ?? 1.0, model ?? 'eleven_v3', extraJson, now, app_id);
  } else {
    db.prepare(
      'INSERT INTO app_configs (app_id, name, api_url, voice_id, stability, similarity, style, speed, model, extra, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(app_id, name ?? '', api_url ?? '', voice_id ?? '', stability ?? 0.5, similarity ?? 0.75, style ?? 0.15, speed ?? 1.0, model ?? 'eleven_v3', extraJson, now);
  }
  return getAppConfig(app_id);
}

export function deleteAppConfig(app_id) {
  return db.prepare('DELETE FROM app_configs WHERE app_id = ?').run(app_id).changes > 0;
}
