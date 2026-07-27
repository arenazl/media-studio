// MEDIA KIT — descubrimiento y lectura de los kits que cada app deja EN SU REPO.
// Contrato fuente: D:\Code\base-compartida\16-MEDIA-KIT-DIAGNOSTICO.md — cada app versiona una
// carpeta `media-kit/` en la raíz de su repo con `media-kit.json` + `screens/*.png` + logo/fonts.
// Media Studio NO es dueño del dato: lo LEE on-demand (mismo espíritu que el KSP, sin cache).
//
// Módulo PURO respecto de la red (solo fs) y con `root` inyectable → testeable con un kit DEMO de
// fixtures (src/lib/__fixtures__/kits-root) sin tocar D:\Code.
import fs from 'node:fs';
import path from 'node:path';

// Raíz donde viven los repos de las apps. Override por env (los tests pasan su propio root).
export const MEDIA_KIT_ROOT = process.env.MEDIA_KIT_ROOT || 'D:/Code';

const KIT_DIR = 'media-kit';
const KIT_JSON = 'media-kit.json';

// Lo ÚNICO que el endpoint de archivos puede servir: imágenes + fuentes. Nada de .json/.mjs/.env —
// la carpeta del kit vive dentro del repo de la app y no queremos convertirla en un file server.
const EXT_MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

// Campos MÍNIMOS del contrato (§"El contrato"): sin estos el kit no sirve para armar un proyecto.
// El resto es tolerante: el kit puede venir incompleto y se degrada con gracia (WO-K2).
export function validarMediaKit(kit) {
  const faltantes = [];
  if (!kit || typeof kit !== 'object') return { valido: false, faltantes: ['json inválido'] };
  if (!kit.id || typeof kit.id !== 'string') faltantes.push('id');
  if (!kit.app && !kit.negocio) faltantes.push('app');
  if (!kit.marca || typeof kit.marca !== 'object') faltantes.push('marca');
  if (!Array.isArray(kit.pantallas) || !kit.pantallas.length) faltantes.push('pantallas');
  return { valido: faltantes.length === 0, faltantes };
}

// Resumen de UN kit (lo que lista el endpoint): identidad + cuántas piezas trae + si valida.
function resumen(kit, carpeta) {
  const { valido, faltantes } = validarMediaKit(kit);
  return {
    id: String(kit?.id || carpeta),
    app: String(kit?.app || kit?.negocio?.queEs || carpeta),
    generado: kit?.generado || '',
    ambiente: kit?.ambiente || '',
    carpeta,
    pantallas: Array.isArray(kit?.pantallas) ? kit.pantallas.length : 0,
    momentos: Array.isArray(kit?.momentos) ? kit.momentos.length : 0,
    valido,
    faltantes,
  };
}

// Escanea el PRIMER NIVEL de `root` buscando <carpeta>/media-kit/media-kit.json. Sin recursión
// profunda (207 repos en D:\Code: un readdir + un statSync por carpeta, on-demand por request).
// Un JSON roto NO tumba el escaneo: entra a la lista con valido:false y su error.
export function scanMediaKits(root = MEDIA_KIT_ROOT) {
  let entries = [];
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return []; }
  const kits = [];
  const vistos = new Set();
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const file = path.join(root, e.name, KIT_DIR, KIT_JSON);
    if (!fs.existsSync(file)) continue;
    let kit = null, error = '';
    try { kit = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (err) { error = err instanceof Error ? err.message : 'json ilegible'; }
    const r = kit ? resumen(kit, e.name) : { id: e.name, app: e.name, generado: '', ambiente: '', carpeta: e.name, pantallas: 0, momentos: 0, valido: false, faltantes: ['json inválido'] };
    if (error) r.error = error;
    // id duplicado entre dos repos: gana el primero (orden alfabético del readdir) y el otro se
    // ignora — el id es la LLAVE contra el registro KSP, no puede apuntar a dos carpetas.
    if (vistos.has(r.id)) continue;
    vistos.add(r.id);
    kits.push(r);
  }
  return kits;
}

// La carpeta REAL de un kit, resuelta SIEMPRE por el escaneo (nunca concatenando el id que mandó el
// cliente): un id tipo "../../secretos" no existe en la lista y devuelve null. Es la 1ª barrera del
// anti path traversal — la 2ª es la validación del relpath en resolveKitFile.
function kitDir(id, root = MEDIA_KIT_ROOT) {
  const found = scanMediaKits(root).find((k) => k.id === id);
  return found ? path.join(root, found.carpeta, KIT_DIR) : null;
}

// El JSON completo de un kit (o null si no existe / está roto). El `id` sale RESUELTO siempre: el
// primer kit real (sinvueltas) vino SIN el campo `id` del contrato, y el front lo necesita para
// armar las URLs de sus capturas (sin esto quedaban en /api/media-kit/undefined/file/...).
export function readMediaKit(id, root = MEDIA_KIT_ROOT) {
  const found = scanMediaKits(root).find((k) => k.id === id);
  if (!found) return null;
  const file = path.join(root, found.carpeta, KIT_DIR, KIT_JSON);
  try { return { ...JSON.parse(fs.readFileSync(file, 'utf8')), id: found.id }; } catch { return null; }
}

// Resuelve un archivo del kit (`screens/01-home.png`, `logo.svg`, `fonts/x.woff2`) a un path absoluto
// SEGURO. Devuelve { ok:false, code } con el status HTTP que corresponde:
//   400 relpath malformado (vacío, absoluto, con "..", extensión no permitida)
//   403 el path resuelto se escapa de la carpeta del kit (garantía redundante, defensa en profundidad)
//   404 el kit o el archivo no existen
export function resolveKitFile(id, relpath, root = MEDIA_KIT_ROOT) {
  const raw = String(relpath || '');
  if (!raw.trim()) return { ok: false, code: 400, error: 'ruta vacía' };
  if (raw.includes('\0')) return { ok: false, code: 400, error: 'ruta inválida' };
  const norm = raw.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[a-zA-Z]:/.test(norm)) return { ok: false, code: 400, error: 'ruta absoluta no permitida' };
  if (norm.split('/').some((seg) => seg === '..')) return { ok: false, code: 400, error: 'ruta con ".." no permitida' };
  const ext = path.extname(norm).toLowerCase();
  if (!EXT_MIME[ext]) return { ok: false, code: 400, error: `extensión no permitida: ${ext || '(ninguna)'}` };

  const dir = kitDir(id, root);
  if (!dir) return { ok: false, code: 404, error: 'kit no encontrado' };
  const file = path.resolve(dir, norm);
  const base = path.resolve(dir);
  if (file !== base && !file.startsWith(base + path.sep)) return { ok: false, code: 403, error: 'ruta fuera del kit' };
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return { ok: false, code: 404, error: 'archivo no encontrado' };
  return { ok: true, file, mime: EXT_MIME[ext] };
}
