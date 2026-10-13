// Los casos que ya se rompieron una vez (2026-10-12, Lucas: "¿vas aprendiendo o es un paso para adelante y dos para
// atrás?"). Cada prueba es un incidente real: si vuelve a pasar, falla acá antes de que lo encuentre el dueño. Sin red,
// sin Flow y sin IA: la rutina de Flow corre contra una extensión simulada.
// Ya cubiertos en otros archivos: la palabra "logo" en el pedido a Flow (moldeFormato), el caso de la demo de las
// capturas en los pedidos creativos (moldeMediaKit), "pantalla poco legible" contra "pantalla de espaldas"
// (flowCompiler) y la regeneración de escena con casting fijo (p0-datos).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// @ts-expect-error módulos del server .mjs sin tipos
import * as puente from '../../server/flowPuente.mjs';
// @ts-expect-error módulos del server .mjs sin tipos
import { ajustarAlGuion } from '../../server/functions.mjs';

type Paso = { id: string; accion: string; args: Record<string, unknown> };
interface Grilla { tiles: string[] }   // del más viejo al más nuevo: una URL si es video, '' si no

// Corre una rutina de Flow entera contra una extensión simulada. `generar(n, intento)` decide qué pasa con cada pedido de
// la escena n: 'error-antes' (no llegó a enviar), 'error-flow' (Flow deja un tile con error) o 'ok'.
async function correrRutina(escenas: number[], generar: (n: number, intento: number) => 'error-antes' | 'error-flow' | 'cargando' | 'ok', opciones: { videoAjenoEn?: number; rechazaConReferenciasEn?: number; famoso?: string; clipDeOtroPedido?: boolean; retomar?: boolean; sinUrlDelNuevo?: boolean } = {}) {
  const clip = path.join(os.tmpdir(), 'clip-prueba-media-studio.mp4');
  fs.writeFileSync(clip, 'clip');
  // la imagen del personaje; con clipDeOtroPedido, además un video que dejó un pedido anterior en el mismo proyecto de Flow
  const grilla: Grilla = { tiles: opciones.clipDeOtroPedido ? ['', 'https://clip/perros'] : [''] };
  const intentos: Record<number, number> = {};
  let ultima = 0, ultimoResultado: string = 'ok', ultimoTexto = '', rechazoBorrado = false;
  const creados = new Set<string>();
  const pedidosPorEscena: Record<number, string[][]> = {};
  const bajadas: [number, string][] = [];
  let ultimaBajada = '';   // la verificación corre justo después de cada bajada
  const importadas: number[] = [];
  const pack = { personajes: [{ id: 'p1', nombre: 'Ana', promptImagen: 'x' }], escenas: escenas.map((n) => ({ escenaN: n, rol: 'desarrollo', prompt: `escena ${n} con Ana` })) };
  const job = puente.iniciarJob({
    projectId: 'prueba', reelId: 'r', pack, escenasStoryboard: escenas.map((n) => ({ n, personajes: ['p1'], dialogo: `la frase de la escena ${n}` })), flowProjectUrl: 'https://flow.google.com/project/prueba', escenasConCrudo: [], retomar: opciones.retomar,
    guardarClip: async (_b: Buffer, nombre: string) => ({ fileRef: nombre, durSec: 8 }),
    agregarToma: async (n: number) => { importadas.push(n); }, guardarFlowUrl: async () => {},
    // la red: el clip dice su frase si es el de su escena; uno ajeno (un ejemplo de Flow) no
    verificarClip: async () => (/ajeno/.test(ultimaBajada) ? { parecido: 0, dice: 'Johnny, te estoy esperando' } : { parecido: 1, dice: 'la frase' }),
  });
  const responder = (p: Paso) => {
    switch (p.accion) {
      case 'estado': return { url: 'https://flow.google.com/project/prueba' };
      case 'personajeExiste': return { existe: p.args.nombre === 'Ana' || creados.has(String(p.args.nombre)) };
      case 'esperarPersonaje': return { arranco: true, seg: 30 };
      case 'renombrarUltimoPersonaje': creados.add(String(p.args.nombre)); return { ok: true };
      case 'ajustes': return { pastilla: 'Vídeo · 720p · 8 s · x1' };
      case 'generar': {
        const n = Number(/escena (\d+)/.exec(String(p.args.prompt))![1]); ultima = n;
        intentos[n] = (intentos[n] || 0) + 1;
        const refs = (Array.isArray(p.args.personajes) ? p.args.personajes : []) as string[];
        (pedidosPorEscena[n] ||= []).push(refs);
        const conRefs = refs.length > 0;
        const esFamoso = !!opciones.famoso && refs.includes(opciones.famoso);
        ultimoTexto = esFamoso ? 'Error Esta petición podría infringir nuestras políticas sobre personas famosas' : '';
        const r = esFamoso || (opciones.rechazaConReferenciasEn === n && conRefs) ? 'error-flow' : generar(n, intentos[n]);
        if (r === 'error-antes') throw new Error('[antes de enviar] no pude mencionar a @Ana: no apareció "Añadir a petición" en 15 s');
        const antes = grilla.tiles.length;
        grilla.tiles.push(r === 'error-flow' ? 'ERR' : `https://clip/esc${n}`);
        ultimoResultado = r;
        return { disparado: true, antes, tiles: grilla.tiles.length };
      }
      // 'cargando': la rutina lo ve sin terminar, pero en Flow termina igual (el clip queda como video): el caso de la escena 1
      // Flow real: después de refrescar, el clip rechazado ya no está y la espera no ve ni error ni porcentaje (prueba real 5)
      case 'esperarGeneracion': if (ultimoResultado === 'error-flow' && rechazoBorrado) { rechazoBorrado = false; return { seg: 60, terminado: true }; } return ultimoResultado === 'error-flow' ? { seg: 30, terminado: false, conError: true, texto: ultimoTexto } : ultimoResultado === 'cargando' ? { seg: 6, terminado: false, cargando: true } : { seg: 60, terminado: true };
      // Flow saca de la grilla el clip con error al recargar la pestaña (prueba real del 12/10)
      case 'recargar': rechazoBorrado = grilla.tiles.includes('ERR'); grilla.tiles = grilla.tiles.filter((t) => t !== 'ERR'); return { ok: true };
      case 'urlDelMasNuevo': { if (opciones.sinUrlDelNuevo) return { url: '' }; if (opciones.videoAjenoEn === ultima) return { url: 'https://ejemplo-de-flow/ajeno' }; const v = [...grilla.tiles].reverse().find((t) => t.startsWith('https://')); return { url: v || '' }; }
      case 'urlsDeClips': {
        const todos = [...grilla.tiles].reverse().map((t) => (t.startsWith('https://') ? t : ''));
        return { total: todos.filter(Boolean).length, urls: todos.filter(Boolean), todos, totalTiles: todos.length };
      }
      case 'descargarUrl': bajadas.push([Number(/esc(\d+)-/.exec(String(p.args.nombre))![1]), String(p.args.url)]); ultimaBajada = String(p.args.url); return { filename: clip };
      default: return { ok: true };
    }
  };
  void ultima;
  const fin = Date.now() + 25000;
  while (Date.now() < fin) {
    const paso = puente.proximoComando({ pestanas: 1, origen: 'background', version: 'prueba' }) as Paso | null;
    if (paso) { try { puente.resultado({ pasoId: paso.id, ok: true, data: responder(paso) }); } catch (e) { puente.resultado({ pasoId: paso.id, ok: false, error: (e as Error).message }); } }
    const j = puente.verJob(job.id);
    if (j.estado === 'listo' || j.estado === 'error') return { job: j, bajadas, intentos, importadas, pedidosPorEscena, creados };
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error('la rutina no terminó');
}

describe('rutina de Flow: los incidentes del 12/10', () => {
  it('la mención @ que no aparece se reintenta y la escena sale (antes cortaba la rutina entera)', async () => {
    const { job, intentos } = await correrRutina([1], (_n, intento) => (intento === 1 ? 'error-antes' : 'ok'));
    expect(job.estado).toBe('listo');
    expect(intentos[1]).toBe(2);
    expect(job.escenas[0].estado).toBe('importada');
  }, 30000);

  it('una escena que no sale no corta las demás, y cada escena se baja con SU clip aunque Flow deje errores en el medio', async () => {
    const { job, bajadas } = await correrRutina([1, 2, 3, 4], (n) => (n === 2 ? 'error-flow' : 'ok'));
    expect(job.estado).toBe('listo');
    expect(job.escenas.map((e: { estado: string }) => e.estado)).toEqual(['importada', 'falló', 'importada', 'importada']);
    expect(bajadas).toEqual([[1, 'https://clip/esc1'], [3, 'https://clip/esc3'], [4, 'https://clip/esc4']]);
    expect(job.fallas.length).toBe(1);
  }, 30000);

  it('un clip que la rutina ve "cargando" no se vuelve a pedir y se baja con su clip (la escena 1 de "El reclamo perdido" se pidió dos veces)', async () => {
    const { job, bajadas, intentos } = await correrRutina([1, 2, 3], (n) => (n === 2 ? 'cargando' : 'ok'));
    expect(intentos[2]).toBe(1);
    expect(bajadas).toEqual([[1, 'https://clip/esc1'], [2, 'https://clip/esc2'], [3, 'https://clip/esc3']]);
    expect(job.escenas.map((e: { estado: string }) => e.estado)).toEqual(['importada', 'importada', 'importada']);
  }, 30000);

  it('una escena que sale al segundo pedido se baja con su clip aunque el clip con error desaparezca al recargar (prueba real del 12/10)', async () => {
    const { job, bajadas } = await correrRutina([1, 2, 3], (n, intento) => (n === 2 && intento === 1 ? 'error-flow' : 'ok'));
    expect(job.escenas.map((e: { estado: string }) => e.estado)).toEqual(['importada', 'importada', 'importada']);
    expect(bajadas).toEqual([[1, 'https://clip/esc1'], [2, 'https://clip/esc2'], [3, 'https://clip/esc3']]);
  }, 30000);
  it('un video ajeno (un ejemplo de Flow) no entra a la pieza: el clip tiene que decir la frase de su escena (prueba real del 12/10)', async () => {
    const { job, importadas } = await correrRutina([1, 2], () => 'ok', { videoAjenoEn: 2 });
    expect(importadas).toEqual([1]);
    expect(job.escenas.map((e: { estado: string }) => e.estado)).toEqual(['importada', 'falló']);
    expect(job.fallas.join(' ')).toMatch(/no dice la frase/);
  }, 30000);

  it('si Flow rechaza el clip con las referencias @, el último intento va sin ellas y sale (prueba real del 12/10)', async () => {
    const { job, bajadas } = await correrRutina([1, 2], () => 'ok', { rechazaConReferenciasEn: 2 });
    expect(job.escenas.map((e: { estado: string }) => e.estado)).toEqual(['importada', 'importada']);
    expect(bajadas.map((b) => b[0])).toEqual([1, 2]);
    expect(job.escenas[1].aviso).toMatch(/sin (todas )?las referencias/);
  }, 30000);

  it('si Flow toma el retrato de un personaje por una persona famosa, se rehace con otra cara y se usa en esa escena y en las siguientes (prueba real del 12/10)', async () => {
    const { job, pedidosPorEscena, creados } = await correrRutina([1, 2], () => 'ok', { famoso: 'Ana' });
    expect([...creados]).toEqual(['Ana2']);
    expect(job.escenas.map((e: { estado: string }) => e.estado)).toEqual(['importada', 'importada']);
    expect(pedidosPorEscena[1]).toEqual([['Ana'], ['Ana2']]);
    expect(pedidosPorEscena[2]).toEqual([['Ana2']]);
  }, 30000);

  it('en un proyecto de Flow compartido entre pedidos (SalesBot), el clip de un pedido anterior no se entrega como el nuevo (la taza salió con los perros, 12/10)', async () => {
    const { job, bajadas, intentos } = await correrRutina([1], () => 'ok', { clipDeOtroPedido: true, retomar: false });
    expect(intentos[1]).toBe(1);
    expect(bajadas).toEqual([[1, 'https://clip/esc1']]);
    expect(job.escenas[0].estado).toBe('importada');
  }, 30000);

  it('en el proyecto compartido, si no se identifica el video nuevo no se adivina por posición: la escena falla (pedido 28, 13/10)', async () => {
    const { job, bajadas } = await correrRutina([1], () => 'ok', { clipDeOtroPedido: true, retomar: false, sinUrlDelNuevo: true });
    expect(bajadas).toEqual([]);
    expect(job.escenas[0].estado).toBe('falló');
  }, 30000);
});

describe('storyboard: dura lo que el guion (campaña del 12/10: piezas de 26 s salían de 34 a 59 s)', () => {
  const guion = { blocks: [{ durSec: 4 }, { durSec: 9 }, { durSec: 3 }, { durSec: 5 }, { durSec: 5 }] };
  const frase = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`).join(' ');
  it('ocho segundos por toma se achican al total del guion sin bajar de lo que tarda cada frase', () => {
    const escenas = [
      { n: 1, durSec: 8, dialogo: frase(9) }, { n: 2, durSec: 8, dialogo: frase(16) }, { n: 3, durSec: 2, pantalla: 'X' },
      { n: 4, durSec: 3, pantalla: 'Y' }, { n: 5, durSec: 3 }, { n: 6, durSec: 3, pantalla: 'Z' }, { n: 7, durSec: 8, dialogo: frase(6) },
      { n: 8, durSec: 1, pantalla: 'W' }, { n: 9, durSec: 8, dialogo: frase(8) }, { n: 10, durSec: 5 },
    ];
    const out = ajustarAlGuion(escenas, guion) as { durSec: number; dialogo?: string }[];
    const total = out.reduce((a, e) => a + e.durSec, 0);
    expect(total).toBeLessThanOrEqual(26 * 1.1);
    for (const e of out) if (e.dialogo) expect(e.durSec).toBeGreaterThanOrEqual(e.dialogo.split(' ').length / 2.7);
  });
  it('si ya dura lo que el guion, no lo toca', () => {
    const escenas = [{ n: 1, durSec: 13 }, { n: 2, durSec: 13 }];
    expect(ajustarAlGuion(escenas, guion)).toBe(escenas);
  });
});
