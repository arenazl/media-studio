// Persistencia LOCAL del media-studio — SQLite nativo (node:sqlite, Node 22+).
// Tablas:
//   projects     — estado del pipeline (audio, reel, videos, montaje, export) por proyecto
//   cloud_videos — metadata de videos subidos a Cloudinary (dev: URL local; prod: URL CDN)
//   app_configs  — configuración de voz guardada por app_id (salesbot, munify, etc.)
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
