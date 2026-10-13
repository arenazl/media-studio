// La VOZ del cierre, sola (Lucas, 2026-10-13: "la voz en off no la estamos ni creando ni agregando"). Agnóstico: la frase
// sale del kit de la marca que sea (su firma; si no, su nombre y el cierre del guion) y la voz es un locutor por defecto
// que cada proyecto puede cambiar (project.vozLocutor). El servidor reusa la misma frase con la misma voz: pedirla dos
// veces no cuesta dos veces.
import { API_BASE } from '../config';
import type { Comercial } from './comercial';
import type { Project } from './projects';

export const VOZ_LOCUTOR = 'rooCDyI2p1wGjgC5O5lH';   // "Maxi AR": locutor argentino de publicidad (ElevenLabs)

export const marcaDe = (project: Project): string => project.marcaKit?.nombreExacto || project.brandKit?.name || project.name || '';

export function fraseDeCierre(project: Project, comercial: Comercial): string {
  const firma = comercial.cierreMarca?.trim();
  if (firma) return firma;
  const marca = marcaDe(project);
  const cta = (comercial.guion?.blocks || []).find((b) => b.role === 'cta')?.narration?.trim() || '';
  return [marca && `${marca}.`, cta].filter(Boolean).join(' ');
}

export async function generarLocutor(texto: string, voiceId: string, nombre?: string): Promise<{ src: string; durSec?: number }> {
  const r = await fetch(`${API_BASE}/api/voz/generar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, voice_id: voiceId, nombre }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.src) throw new Error(d.error || `no se pudo generar la voz (${r.status})`);
  return { src: d.src, durSec: d.durSec || undefined };
}

// la pieza con su locutor: si ya lo tiene, la misma; si no, se genera con la frase de la marca y la voz del proyecto.
// Sin voz no se frena el armado: el paso Montaje muestra "sin locutor" y se puede rehacer a mano.
export async function asegurarLocutor(project: Project, comercial: Comercial): Promise<Comercial> {
  if (comercial.tipo === 'animado' || comercial.cierre?.tipo === 'presentadora' || comercial.cierre?.locutor?.src) return comercial;
  const texto = (comercial.cierre?.locutor?.texto || fraseDeCierre(project, comercial)).trim();
  if (!texto) return comercial;
  const voiceId = comercial.cierre?.locutor?.voiceId || (project as { vozLocutor?: string }).vozLocutor || VOZ_LOCUTOR;
  try {
    const v = await generarLocutor(texto, voiceId, `cierre-${marcaDe(project)}`);
    return { ...comercial, cierre: { ...(comercial.cierre || { tipo: 'logo' as const }), locutor: { texto, voiceId, src: v.src, durSec: v.durSec } } };
  } catch { return comercial; }
}
