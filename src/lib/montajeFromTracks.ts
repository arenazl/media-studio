// INVERSO puro de buildEditorTimeline (editorTracks.ts): del DRAFT de pistas del editor → un
// MontajePlan persistible + ejecutable por el render (WO-4, docs/rediseno/07-PLAN-OPUS-CABLEADO.md D6).
// Espejo de buildEditorTimeline: lo que aquel expande del plan a pistas, esto lo colapsa de vuelta.
// Puro y testeable — sin IA, sin red. Persiste SOLO lo que el render EJECUTA (D5): orden/in/out/
// transición/audioGain de escenas, texts completos, voice, music gain+duck. Transform/opacidad/
// rotación, align/color de texto y fades por clip NO viven acá (son preview de sesión — el render no
// los ejecuta; agregarlos sería mentirle al usuario).
//
// NOTA (silencios con escenaN repetido): un split/duplicado comparte el escenaN del origen. Los
// silences se anclan por `antesDeEscena` (escenaN), y silenceRanges (montajePlan.ts) resuelve el
// inicio de la PRIMERA ocurrencia de ese escenaN (usa un Map). Comportamiento aceptado y documentado:
// si se parte la escena que precede a un silencio, el silencio queda anclado a la primera mitad.
//
// NOTA (etiqueta de transición): el editor distingue 3 kinds (cut/dissolve/slide), así que 'fade',
// 'crossfade' y 'zoom' del plan colapsan todos a 'dissolve' y vuelven como el representante canónico
// 'crossfade'. El render trata fade/crossfade con la MISMA duración de xfade → el mp4 es idéntico. Es
// una pérdida de ETIQUETA (no de comportamiento) intrínseca al inspector de 3 tipos, no un bug.
import type { EditorTrack } from './editorTracks';
import { TRANSITION_KIND_REP } from './editorTracks';
import type { MontajePlan, MontajeScene } from './montajePlan';

const clipsDe = (tracks: EditorTrack[], id: string) => tracks.find((t) => t.id === id)?.clips ?? [];

// Invierte el draft a un MontajePlan, tomando de `base` (el plan de origen del editor) todo lo que el
// draft no modela: width/height/fps/logo, y los datos de escena que el clip no lleva (dialogo/rol/
// audio/audioGain se completan del clip o, si no los tiene, de la escena base con el mismo escenaN).
export function tracksToMontaje(tracks: EditorTrack[], base: MontajePlan): MontajePlan {
  // índice de escenas base por escenaN → PRIMERA ocurrencia (fuente de fallback para campos de escena).
  const baseScenePorN = new Map<number, MontajeScene>();
  for (const s of base.scenes) if (!baseScenePorN.has(s.escenaN)) baseScenePorN.set(s.escenaN, s);

  // ── scenes ← pista video ordenada por startSec ──
  const videoClips = [...clipsDe(tracks, 'video')].sort((a, b) => a.startSec - b.startSec);
  const scenes: MontajeScene[] = videoClips.map((c, i) => {
    const escenaN = c.escenaN ?? i + 1;
    const baseScene = baseScenePorN.get(escenaN);
    const inSec = c.srcIn ?? 0;
    const esUltimo = i === videoClips.length - 1;
    return {
      escenaN,
      src: c.fileRef || baseScene?.src || '',
      in: inSec,
      out: inSec + c.durSec,
      // la transición marca hacia el SIGUIENTE clip; el último no tiene (como en el render).
      transition: esUltimo ? undefined : TRANSITION_KIND_REP[c.transitionAfter ?? 'cut'],
      audio: c.audio ?? baseScene?.audio ?? (c.dialogo || baseScene?.dialogo ? 'keep' : 'mute'),
      audioGain: c.audioGain ?? baseScene?.audioGain ?? 1,
      rol: c.rol ?? baseScene?.rol,
      dialogo: c.dialogo ?? baseScene?.dialogo,
    };
  });

  // ── silences ← los de base cuyo `antesDeEscena` siga existiendo en las scenes resultantes ──
  const escenasVivas = new Set(scenes.map((s) => s.escenaN));
  const silences = (base.silences || []).filter((sil) => escenasVivas.has(sil.antesDeEscena));

  // ── texts ← pista texto ──
  const texts = clipsDe(tracks, 'texto').map((c) => ({
    text: c.label,
    preset: c.meta || 'titulo',
    at: c.startSec,
    dur: c.durSec,
    ...(c.nx != null ? { nx: c.nx } : {}),
    ...(c.ny != null ? { ny: c.ny } : {}),
  }));

  // ── voice ← pista voz (clip único) ──
  const vozClip = clipsDe(tracks, 'voz')[0];
  const voice = vozClip?.fileRef ? { src: vozClip.fileRef, at: vozClip.startSec } : base.voice;

  // ── music ← pista música (clip único). gain/duck salen del clip si el inspector los editó
  //    (audioGain del clip / meta 'con ducking'|'sin ducking'), si no de base. ──
  const musClip = clipsDe(tracks, 'musica')[0];
  const music = musClip?.fileRef
    ? {
      src: musClip.fileRef,
      gain: musClip.audioGain ?? base.music?.gain ?? 0.28,
      duck: musClip.meta != null ? musClip.meta === 'con ducking' : (base.music?.duck ?? true),
    }
    : base.music;

  return {
    width: base.width, height: base.height, fps: base.fps,
    scenes, silences, texts, voice, music,
    logo: base.logo,
  };
}
