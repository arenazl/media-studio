// AUTO-ARMADO determinístico de la timeline del editor (WO-5, docs/rediseno/07-PLAN-OPUS-CABLEADO.md
// D7). Los insumos (storyboard, guion, voz, publicación) YA son producto de moldes de IA; el armado es
// LAYOUT puro sobre datos reales — algorítmico, testeable, gratis, sin latencia. NO inventa texto: la
// posición/duración es criterio de layout (permitido), pero el TEXTO sale siempre de datos reales
// (publicacion.hookOnScreen/cta). Sin esos datos → sin textos (vacío honesto).
import type { Comercial } from './comercial';
import type { ProjectReel } from './projects';
import { storyboardToMontaje, sceneStarts, type MontajePlan } from './montajePlan';

const HOOK_MAX_DUR = 3;      // el hook no tapa toda la escena 1
const HOOK_AT = 0.3;         // entra apenas arranca la pieza

// Arma el MontajePlan completo desde los artefactos ya generados: storyboard (escenas + transiciones
// + silencio + música por mood, vía storyboardToMontaje) + voz en off (si se grabó) + textos del
// hook/CTA (solo si existe la publicación). Puro: mismos insumos → mismo plan (idempotente).
export function autoArmarPlan(comercial: Comercial, reel?: ProjectReel): MontajePlan {
  const base = storyboardToMontaje(comercial);

  // + Voz: la voz en off persistida del reel (mismo origen que PasoMontaje).
  const audioRef = reel?.voiceConfig?.audioRef;
  const voice = audioRef ? { src: audioRef, at: 0 } : base.voice;

  // + Textos SOLO de datos reales (el TEXTO nunca se inventa; la posición sí es layout).
  const pub = comercial.publicacion;
  const texts: MontajePlan['texts'] = [];
  if (pub?.hookOnScreen && base.scenes.length) {
    const durEscena1 = Math.max(0.1, base.scenes[0].out - base.scenes[0].in);
    texts.push({ text: pub.hookOnScreen, preset: 'titulo', at: HOOK_AT, dur: Math.min(HOOK_MAX_DUR, durEscena1) });
  }
  if (pub?.cta && base.scenes.length) {
    // CTA: desde el inicio de la escena con rol 'cta' hasta el final de la pieza.
    const starts = sceneStarts(base);
    const idxCta = base.scenes.findIndex((s) => s.rol === 'cta');
    const i = idxCta === -1 ? base.scenes.length - 1 : idxCta;   // sin escena cta → la última
    const total = starts[starts.length - 1] + Math.max(0.1, base.scenes[base.scenes.length - 1].out - base.scenes[base.scenes.length - 1].in);
    const at = starts[i];
    texts.push({ text: pub.cta, preset: 'cta', at, dur: Math.max(0.5, total - at) });
  }

  return { ...base, voice, texts };
}
