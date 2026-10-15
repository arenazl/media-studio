// Compilador PURO del animatic: sin IA, TTS ni Flow. Cada escena toma una
// captura real, un mockup ya existente o una tarjeta estática del storyboard.
import type { Project } from './projects';
import type { Comercial, Concepto, Escena, GuionEstructurado, MockupApp, Prototipo } from './comercial';
import { getFormato } from './formato';
import { API_BASE } from '../config';

export interface AnimaticSlide {
  n: number;
  titulo: string;
  descripcion: string;
  actor: string;
  dialogo: string;
  durSec: number;
  imagen?: string;
  video?: string;   // mockup del motor local, NUNCA generación Flow
  audio?: string;   // ElevenLabs existente, generado sólo mediante acción explícita
}

export interface PlanAnimatic {
  width: number;
  height: number;
  fps: number;
  marca: string;
  logo?: string;
  color: string;
  escenas: AnimaticSlide[];
}

export function vozDelStoryboard(escena: Escena, guion?: GuionEstructurado): string {
  if (escena.dialogo?.trim()) return escena.dialogo.trim();
  if (escena.rol === 'cta') return '';
  return guion?.blocks?.find((b) => b.role === escena.rol)?.narration?.trim() || '';
}

const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export function planAnimatic(project: Project, comercial: Comercial, concepto: Concepto, prototipo: Prototipo): PlanAnimatic {
  const formato = getFormato(comercial.formatoId || project.formatoId);
  const escenas = prototipo.storyboard || [];
  const pantallas = project.pantallasKit || [];
  const mockups: MockupApp[] = comercial.mockups || [];
  const nombres = new Map((prototipo.cast?.personajes || []).map((p) => [p.id, p.nombre]));
  const audios = prototipo.audios || [];
  const clips: AnimaticSlide[] = escenas.map((e) => {
    const texto = vozDelStoryboard(e, prototipo.guion);
    const cap = pantallas.find((p) => p.archivo === e.archivoCaptura)
      || pantallas.find((p) => e.pantalla && norm(p.nombre) === norm(e.pantalla))
      || pantallas.find((p) => e.screen && norm(p.nombre) === norm(e.screen));
    const mk = (e.pantalla || e.screen) && mockups.find((m) => norm(m.nombre) === norm(e.pantalla || e.screen || ''));
    const actor = e.personajes?.map((id) => nombres.get(id) || id).join(', ') || '';
    const vozElegida = prototipo.vozPorActor?.[actor];
    const audio = audios.find((a) => a.escenaN === e.n && a.texto === texto
      && (!vozElegida || a.voiceId === vozElegida));
    return {
      n: e.n,
      titulo: e.rol === 'cta' ? 'Cierre' : (e.accion || concepto.topico || `Escena ${e.n}`),
      descripcion: [e.plano, e.accion, e.continuidad].filter(Boolean).join(' · '),
      actor,
      dialogo: texto,
      durSec: Math.max(2.5, e.durSec || 4, (audio?.durSec || 0) + (audio ? 0.6 : 0)),
      ...(cap?.url ? { imagen: cap.url } : {}),
      ...(mk?.fileRef ? { video: `${API_BASE}/api/storage/${mk.fileRef.split('/').map(encodeURIComponent).join('/')}` } : {}),
      ...(audio?.src ? { audio: audio.src } : {}),
    };
  });
  return {
    width: formato?.dims.width || 1080, height: formato?.dims.height || 1920,
    fps: formato?.fps || 30, marca: project.marcaKit?.nombreExacto || project.brandKit?.name || project.name,
    logo: project.marcaKit?.logoUrl || project.brandKit?.logoUrl,
    color: project.marcaKit?.colores?.primario || project.brandKit?.color || '#7C3AED',
    escenas: clips,
  };
}

export function numeroAudiosPendientes(plan: PlanAnimatic): number {
  return plan.escenas.filter((e) => e.dialogo && !e.audio).length;
}
