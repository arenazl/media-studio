// CORRIDA EN SECO (2026-10-13, Lucas: "un test que recorra y guarde datos, nada más; sin evaluaciones; todo menos
// mockups y videos, que tardan"). Recorre la cadena creativa como la app y guarda lo que sale de cada paso.
//
// Cada caso de casos.json es UN spot de una app integrada con el objetivo, el tipo de historia y el clima elegidos:
// KB → Estrategia (objetivo) → Concepto (tipo de historia + clima; toma la primera propuesta) → Guion → Personajes →
// Storyboard → Pedidos a Flow → Director de montaje (sobre las escenas del storyboard: su diálogo hace de transcripción,
// porque en seco no hay tomas). No evalúa, no genera mockups ni videos y no guarda proyectos en la app.
//
// Salida: docs/22-corridas-en-seco/<fecha_hora>/ con caso-NN.json (todo lo que salió) y caso-NN.md (para leer), más
// LEEME.md (casos, tiempos por paso y fallas).
//
// Uso (con el backend levantado):  npm run corrida-seco                      → los casos de casos.json
//                                  npm run corrida-seco -- --casos 1,4,7     → sólo esos
//                                  npm run corrida-seco -- --concurrencia 2  → de a 2 (por defecto 3)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { casoMd, eleccionEnPalabras } from './informe.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');
const API = process.env.MEDIA_STUDIO_API || 'http://localhost:5301';
const arg = (k, def) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : def; };
const CONC = Number(arg('concurrencia', '3')) || 3;
const SOLO = String(arg('casos', '')).split(',').map(Number).filter(Boolean);
const MODELO = { strategy: 'opus', concept: 'opus', script: 'opus', cast: 'sonnet', storyboard: 'sonnet', flowpack: 'sonnet', montageDirection: 'opus' };   // el preset 'intermedio' de la app

const cfg = JSON.parse(fs.readFileSync(path.join(AQUI, 'casos.json'), 'utf8'));
const FORMATO_ID = cfg.formatoId || 'reel-hibrido-9-16';
const CASOS = cfg.casos.filter((c) => !SOLO.length || SOLO.includes(c.n));
const sello = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).slice(0, 16).replace(' ', '_').replace(':', '');
const SALIDA = path.resolve(arg('salida', path.join(RAIZ, 'docs', '22-corridas-en-seco', sello)));
const hora = () => new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false });

// las funciones del front que usa la app para armar cada pedido, tal cual (empaquetadas para node)
const AYUDANTES = path.join(AQUI, '.ayudantes.mjs');
await build({ entryPoints: [path.join(AQUI, 'ayudantes.ts')], bundle: true, platform: 'node', format: 'esm', outfile: AYUDANTES, logLevel: 'error', define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE: API, DEV: true }) } });
const A = await import(pathToFileURL(AYUDANTES).href);

try { await fetch(`${API}/api/kb/apps`); } catch { console.error(`No responde el backend en ${API}: levantalo con "npm run server" y volvé a correr.`); process.exit(1); }
fs.mkdirSync(SALIDA, { recursive: true });
const T0 = Date.now();
const tiempos = [];

const post = async (url, body) => {
  const r = await fetch(`${API}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${url}: ${d.error || r.status}`);
  return d;
};

// la integración de cada app, una sola vez
const proyectos = new Map();
function proyectoDe(appId) {
  if (!proyectos.has(appId)) proyectos.set(appId, (async () => {
    const { kb } = await post('/api/kb/fetch', { appId });
    const inp = A.kbToProjectInput(kb);
    let delKit = {};
    if (kb.media_kit_id) {
      const r = await fetch(`${API}/api/media-kit/${encodeURIComponent(kb.media_kit_id)}`);
      const d = await r.json().catch(() => ({}));
      const kit = d?.kit ?? d;
      if (r.ok && A.isValidMediaKit(kit)) { const mk = A.mediaKitToProjectInput(kit); delKit = { marcaKit: mk.marcaKit, mediaKitId: mk.mediaKitId, cta: mk.cta, momentos: mk.momentos, pantallasKit: mk.pantallasKit }; }
    }
    return { id: `seco-${appId}`, name: inp.name, type: inp.type || '', brief: inp.brief, kb: inp.kb, brandKit: inp.brandKit, formatoId: FORMATO_ID, ...delKit };
  })());
  return proyectos.get(appId);
}

async function caso(k) {
  const log = (...x) => console.log(`[${hora()}] [caso ${k.n} · ${k.app}]`, ...x);
  const project = await proyectoDe(k.app);
  const fmt = A.getFormato(FORMATO_ID);
  const formato = fmt ? { aspecto: fmt.aspecto, plataforma: fmt.plataforma, durDefault: fmt.duracion.default } : undefined;
  const pieceId = `seco-${sello}-${k.n}`;
  const correr = async (functionId, body) => {
    const t = Date.now();
    const d = await post('/api/run-function', { ...body, model: MODELO[functionId], projectId: project.id, pieceId });
    const fila = { caso: k.n, paso: functionId, seg: Math.round((Date.now() - t) / 100) / 10, modelo: d.meta?.modelReal || '', molde: d.promptVersion || '', reparado: !!d.validacion?.reparado, errores: (d.validacion?.errores || []).length };
    tiempos.push(fila);
    log(`${functionId} ${fila.seg}s${fila.reparado ? ' (reparado)' : ''}${fila.errores ? ` · ${fila.errores} avisos del validador` : ''}`);
    return d.result;
  };
  // Estrategia: sólo el objetivo (como el asistente)
  const base = { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', screens: [], ...(formato ? { formato } : {}) };
  const strat = await correr('strategy', { functionId: 'strategy', context: { project: base }, options: { perfil: k.objetivo } });
  const p0 = (strat?.pieces || [])[0] || {};
  const tipo = A.tipoDesdeFormato(fmt);
  const c = { ...A.nuevoComercial(p0.angle || p0.objective || project.name, tipo), formatoId: FORMATO_ID, angulo: p0.angle, creativeBrief: p0.creativeBrief, messageScope: p0.messageScope, primaryMessage: p0.primaryMessage, supportingFacts: p0.supportingFacts, perfilCampana: k.objetivo, enfoque: k.enfoque, tratamiento: k.tratamiento };
  const durationSec = Number(p0.durationSec) || formato?.durDefault || 20;
  const ctxProyecto = { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', kb: project.kb, type: project.type || '', screens: [], brand: project.brandKit, ...(formato ? { formato } : {}) };
  const cuerpo = (functionId, piece, options) => ({ functionId, context: { project: ctxProyecto, piece: { ...piece, ...(formato ? { formato } : {}) } }, options, cache: false });
  const mediaKit = A.mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
  // Concepto (PasoConcepto): objetivo heredado + tipo de historia + clima; se toma la primera propuesta
  const eleccion = { enfoque: k.enfoque, tratamiento: k.tratamiento, intensidadHumor: 'sutil', recursoHumorId: 'auto' };
  const rc = await correr('concept', cuerpo('concept', { angulo: c.angulo || c.titulo || '', creativeBrief: c.creativeBrief || '', messageScope: c.messageScope, primaryMessage: c.primaryMessage, durationSec: 20, tipo, ...eleccion, cierreMarca: '', ...(mediaKit ? { mediaKit } : {}) }, { perfil: k.objetivo === 'solo-mockups' ? 'demo' : k.objetivo, ...eleccion }));
  const conceptos = rc?.conceptos || [];
  if (!conceptos.length) throw new Error('el concepto no trajo propuestas');
  c.concepto = conceptos[0];
  // Guion, Personajes, Storyboard, Pedidos a Flow (como PasoGuion, PasoCast, PasoStoryboard, PasoPack)
  const rg = await correr('script', cuerpo('script', { concepto: c.concepto, durationSec, tipo, messageScope: c.messageScope, primaryMessage: c.primaryMessage, supportingFacts: c.supportingFacts, enfoque: c.enfoque, tratamiento: c.tratamiento, ...(mediaKit ? { mediaKit } : {}) }, { tono: c.tratamiento }));
  c.guion = { blocks: rg?.blocks || [], music: rg?.music };
  const rk = await correr('cast', cuerpo('cast', { concepto: c.concepto, guion: c.guion, enfoque: c.enfoque, tratamiento: c.tratamiento }, {}));
  c.cast = { personajes: rk?.personajes || [], lugar: rk?.lugar };
  const rs = await correr('storyboard', cuerpo('storyboard', { guion: c.guion, cast: c.cast, tipo, durationSec, enfoque: c.enfoque, tratamiento: c.tratamiento, ...(mediaKit ? { mediaKit } : {}) }, {}));
  c.storyboard = rs?.escenas || [];
  const rp = await correr('flowpack', cuerpo('flowpack', { storyboard: c.storyboard, cast: c.cast, guion: c.guion, cierreMarca: '', tipo }, {}));
  c.packFlow = { estilo: rp?.estilo || '', personajes: rp?.personajes || [], escenas: rp?.escenas || [] };
  // Director de montaje (PasoMontaje.dirigirConIA) sobre las escenas del storyboard
  const escenas = c.storyboard.filter((e) => e.rol !== 'cta' || (e.personajes || []).length).map((e) => ({
    escenaN: e.n, src: `crudo-escena-${e.n}.mp4`, rol: e.rol || '', dialogo: e.dialogo || '', durSec: Number(e.durSec) || 4,
    tieneInsertos: false, textoTranscripto: String(e.dialogo || '').slice(0, 280),
  }));
  const rm = await correr('montageDirection', cuerpo('montageDirection', { titulo: c.titulo, objetivo: c.primaryMessage || p0.objective || '', enfoque: c.enfoque, tratamiento: c.tratamiento, concepto: c.concepto, guion: c.guion, cierreTipo: 'logo', tieneMusica: true, tieneSfx: true, escenas }, {}));
  const salida = { caso: k, formatoId: FORMATO_ID, app: { id: k.app, nombre: project.name, rubro: project.type, brief: project.brief }, estrategia: { pieza: p0, piezasPropuestas: (strat?.pieces || []).length }, conceptosPropuestos: conceptos, comercial: c, montaje: rm };
  const nn = String(k.n).padStart(2, '0');
  fs.writeFileSync(path.join(SALIDA, `caso-${nn}.json`), JSON.stringify(salida, null, 1));
  fs.writeFileSync(path.join(SALIDA, `caso-${nn}.md`), `${casoMd(salida)}\n`);
  log('guardado');
}

console.log(`[${hora()}] corrida en seco: ${CASOS.length} casos, de a ${CONC} · salida ${SALIDA}`);
const pendientes = [...CASOS];
const fallas = [];
await Promise.all(Array.from({ length: CONC }, async () => {
  while (pendientes.length) {
    const k = pendientes.shift();
    try { await caso(k); } catch (e) { fallas.push({ caso: k.n, error: e.message }); console.log(`[${hora()}] [caso ${k.n}] FALLA`, e.message); }
  }
}));
const total = Math.round((Date.now() - T0) / 1000);
const porPaso = {};
for (const f of tiempos) (porPaso[f.paso] ||= []).push(f.seg);
fs.writeFileSync(path.join(SALIDA, 'tiempos.json'), JSON.stringify({ totalSeg: total, fallas, tiempos }, null, 1));
fs.writeFileSync(path.join(SALIDA, 'LEEME.md'), `# Corrida en seco ${sello.replace('_', ' ')}

Recorre la cadena creativa como la app (estrategia, concepto, guion, personajes, storyboard, pedidos a Flow y director de
montaje) y guarda lo que sale de cada paso. No evalúa, no genera mockups ni videos. Hecha con \`npm run corrida-seco\`.

- Casos: ${CASOS.length} · salieron ${CASOS.length - fallas.length} · tiempo total ${Math.floor(total / 60)} min ${total % 60} s (de a ${CONC}).
- Tiempo promedio por paso: ${Object.entries(porPaso).map(([k2, v]) => `${k2} ${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} s`).join(' · ')}.
${fallas.length ? `- Fallas: ${fallas.map((f) => `caso ${f.caso}: ${f.error}`).join(' · ')}\n` : ''}
| Caso | App | Objetivo · historia · clima | Archivo |
|---|---|---|---|
${CASOS.map((k) => `| ${k.n} | ${k.app} | ${eleccionEnPalabras(k)} | ${fallas.some((f) => f.caso === k.n) ? 'falló' : `caso-${String(k.n).padStart(2, '0')}.md`} |`).join('\n')}
`);
console.log(`[${hora()}] FIN en ${total}s · ${CASOS.length - fallas.length}/${CASOS.length} casos · ${SALIDA}`);
