// El ARMADO del montaje, en un solo lugar: lo usan el paso Montaje (armado automático y "Rearmar") y el "Auto-armar"
// del editor multipista. Antes el editor tenía su propia regla (sólo el storyboard, sin mockups ni montajista) y
// el mismo botón daba dos comerciales distintos según dónde se tocara.
// FILMADO/HÍBRIDO: el montajista lo afina con las palabras transcriptas de cada clip (recorta el aire, corta en frase,
// mete pantallas reales cuando la voz las nombra, placa final). En HÍBRIDO usa todos los mockups disponibles: cubre las
// escenas sin clip y el resto entra como insertos. ANIMADO: el reel ya viene renderizado; sólo voz y música.
import { API_BASE } from '../config';
import type { Comercial } from './comercial';
import type { Project } from './projects';
import { getFormato, mediosDeFormato } from './formato';
import { storyboardToMontaje, totalDuration, type MontajePlan, type PalabraTiempo } from './montajePlan';
import { afinarMontaje } from './montajista';
import { conMusicaPropia } from './musicaGenerada';
import { aplicarVariante } from './variantesMontaje';
import { asegurarLocutor } from './locutorCierre';
import { conEfectosDeSonido } from './efectosSonido';
import type { MontajeState } from './montajePlan';

export function esHibrido(comercial: Comercial): boolean {
  const medios = mediosDeFormato(getFormato(comercial.formatoId));
  return medios.includes('filmada') && medios.includes('mockup');
}

async function transcribir(ref: string): Promise<readonly [string, PalabraTiempo[] | undefined]> {
  try {
    const r = await fetch(`${API_BASE}/api/transcribir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileRef: ref }) });
    const d = await r.json();
    return [ref, r.ok ? (d.words as PalabraTiempo[]) : undefined] as const;
  } catch { return [ref, undefined] as const; }
}

// el material con que se arma (las tomas importadas y los mockups): si cambia, el montaje automático quedó viejo
// (2026-10-13: la orquestación armó "Reclamo sin respuesta" antes de que terminaran sus 4 mockups y quedó sin pantallas)
export const materialDe = (comercial: Comercial): string => [
  ...(comercial.rodaje || []).map((t) => t.fileRef),
  ...(comercial.mockups || []).map((m) => m.fileRef),
  comercial.renderRef || '',
].filter(Boolean).sort().join('|');

// el clip de la PRESENTADORA del cierre: Flow lo genera junto con las demás escenas, como la escena 90 (flowCompiler.mjs,
// ESCENA_PRESENTADORA). El cierre "Presentadora" lo usa si no se eligió otro video a mano.
export const ESCENA_PRESENTADORA = 90;
export const tomaPresentadora = (comercial: Comercial) => [...(comercial.rodaje || [])].reverse().find((t) => t.escenaN === ESCENA_PRESENTADORA);

// los mockups de la pieza, como los usan el montajista y las versiones
export const mockupsDe = (comercial: Comercial) => (comercial.mockups || []).map((m) => ({ nombre: m.nombre, fileRef: m.fileRef, durSec: m.durSec }));

// el armado del montajista con su música compuesta a medida (musicaGenerada.ts): la BASE de las versiones
export async function armarBase(project: Project, comercial: Comercial): Promise<MontajePlan> {
  // la voz del cierre se crea sola si la pieza no la tiene (locutorCierre.ts); el paso Montaje la persiste en la pieza
  const c = await asegurarLocutor(project, comercial);
  // y los efectos de sonido solos (efectosSonido.ts): whoosh en los cambios de material, golpe al aterrizar el logo
  return conEfectosDeSonido(await conMusicaPropia(conLocutor(await armarSinMusica(project, c), c), c), mockupsDe(c));
}

// el LOCUTOR del cierre: su frase suena sobre la placa, que dura lo que dura la frase (y un respiro). Va en la pista de
// voz, salvo que la pieza ya tenga una voz en off propia.
function conLocutor(plan: MontajePlan, comercial: Comercial): MontajePlan {
  const loc = comercial.cierre?.locutor;
  if (!loc?.src || !plan.endCard || plan.voice || plan.endCard.tipo === 'presentadora') return plan;
  const dur = loc.durSec || 3;
  return {
    ...plan,
    endCard: { ...plan.endCard, durSec: Math.max(plan.endCard.durSec, Math.ceil((dur + 0.9) * 10) / 10) },
    voice: { src: loc.src, at: Math.round((totalDuration(plan) + 0.25) * 100) / 100, durSec: dur },
  };
}

// el armado con la versión que se eligió en el paso Montaje (la del montajista si no se eligió ninguna)
export async function armarMontaje(project: Project, comercial: Comercial): Promise<MontajePlan> {
  const variante = (comercial.montaje as MontajeState | undefined)?.variante;
  return aplicarVariante(await armarBase(project, comercial), variante, mockupsDe(comercial));
}

async function armarSinMusica(project: Project, comercial: Comercial): Promise<MontajePlan> {
  const base = storyboardToMontaje(comercial);
  const marca = { exacto: project.marcaKit?.nombreExacto || project.brandKit?.name, fonetica: project.marcaKit?.fonetica || project.brandKit?.phonetic };
  if (comercial.tipo === 'animado') {
    // el video de mockups ya trae logo y placa final: acá sólo se le suman voz y música, sin acercamientos
    const afinado = afinarMontaje(base, { palabrasPorToma: {}, marca });
    return { ...afinado, scenes: afinado.scenes.map((s) => ({ ...s, punchFrom: 1, punchTo: 1 })) };
  }
  const mockups = (comercial.mockups || []).map((m) => ({ nombre: m.nombre, fileRef: m.fileRef, durSec: m.durSec }));
  const refsMockup = new Set(mockups.map((m) => m.fileRef));
  // sólo se transcriben las tomas filmadas: los mockups no tienen voz
  const refs = [...new Set(base.scenes.map((s) => s.src).filter((r) => r && !refsMockup.has(r)))];
  const pares = await Promise.all(refs.map(transcribir));
  const colores = project.marcaKit?.colores;
  // la placa de cierre siempre se arma (el montajista la garantiza): CTA del proyecto, si no el bloque cta del guion, si no la marca
  const ctaGuion = (comercial.guion?.blocks || []).find((b) => b.role === 'cta')?.narration?.trim();
  // el cierre: 'pantalla' usa el mockup elegido o, si no hay, el de la última pantalla del storyboard; 'presentadora' su clip
  const elegido = comercial.cierre;
  const ultimaPantalla = [...(comercial.storyboard || [])].reverse().find((e) => e.pantalla)?.pantalla;
  const mkCierre = elegido?.tipo === 'pantalla'
    ? (mockups.find((m) => m.fileRef === elegido.mockup) || mockups.find((m) => ultimaPantalla && m.nombre === ultimaPantalla) || mockups[mockups.length - 1])
    : undefined;
  const presentadora = tomaPresentadora(comercial);
  const cierre = elegido
    ? elegido.tipo === 'pantalla'
      ? { tipo: elegido.tipo, videoRef: mkCierre?.fileRef, videoDurSec: mkCierre?.durSec }
      : { tipo: elegido.tipo, videoRef: elegido.video || presentadora?.fileRef, videoDurSec: elegido.video ? undefined : presentadora?.durSec }
    : undefined;
  // la placa va sobre fondo oscuro: el logo para fondo oscuro del kit (en PNG, que trae la tipografía real)
  const kitId = (project as { mediaKitId?: string }).mediaKitId;
  const raster = (project.marcaKit as { logo?: { paraFondoOscuroRaster?: string } } | undefined)?.logo?.paraFondoOscuroRaster;
  const logoPlaca = kitId && raster ? `${API_BASE}/api/media-kit/${encodeURIComponent(kitId)}/file/${raster}` : project.marcaKit?.logoOscuroUrl;
  return afinarMontaje(base, {
    palabrasPorToma: Object.fromEntries(pares),
    pantallas: project.pantallasKit,
    mockups,
    hibrido: esHibrido(comercial),
    cta: project.cta,
    ctaGuion,
    logoUrl: project.marcaKit?.logoUrl || project.brandKit?.logoUrl,
    logoPlaca,
    cierre,
    marca,
    estilo: colores?.primario
      ? { primario: colores.primario, acento: colores.acento || '#F59E0B', fondo: colores.fondo || '#FAF7FF', texto: colores.texto || '#1E1B2E' }
      : undefined,
  });
}
