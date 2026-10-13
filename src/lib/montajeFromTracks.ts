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
import { TRANSITION_KIND_REP, transitionKind } from './editorTracks';
import { sceneStarts, type InsertoPantalla, type MontajePlan, type MontajeScene } from './montajePlan';

const clipsDe = (tracks: EditorTrack[], id: string) => tracks.find((t) => t.id === id)?.clips ?? [];

// Invierte el draft a un MontajePlan, tomando de `base` (el plan de origen del editor) TODO lo que el
// draft no modela. 2026-10-11 (Lucas: "el montaje por default me lo tiene que trasladar perfecto al multipista"):
// antes la vuelta rearmaba el plan y la escena desde cero y se perdían la placa final (endCard), el estilo de
// marca, el motor de render, y por escena los acercamientos (punchFrom/punchTo), los insertos de pantalla
// (mockups), las palabras con tiempo y la captura. Ahora se parte de la base y se pisa sólo lo editado.
export function tracksToMontaje(tracks: EditorTrack[], base: MontajePlan): MontajePlan {
  // índice de escenas base por escenaN → PRIMERA ocurrencia (fuente de fallback para campos de escena).
  const baseScenePorN = new Map<number, MontajeScene>();
  for (const s of base.scenes) if (!baseScenePorN.has(s.escenaN)) baseScenePorN.set(s.escenaN, s);

  // ── scenes ← pista video ordenada por startSec ──
  // la placa final viaja en la pista de video pero no es una escena
  const esPlaca = (c: { id: string; meta?: string }) => c.id === 'placa-final' || c.meta === 'placa';
  // las escenas que son un mockup viven en la pista Mockups (marcadas esEscena): vuelven a la secuencia por su tiempo
  const videoClips = [...clipsDe(tracks, 'video').filter((c) => !esPlaca(c)), ...clipsDe(tracks, 'pantallas').filter((c) => c.esEscena)]
    .sort((a, b) => a.startSec - b.startSec);
  const scenes: MontajeScene[] = videoClips.map((c, i) => {
    const escenaN = c.escenaN ?? i + 1;
    const baseScene = baseScenePorN.get(escenaN);
    const inSec = c.srcIn ?? 0;
    const esUltimo = i === videoClips.length - 1;
    // la transición marca hacia el SIGUIENTE clip; el último no tiene (como en el render). Si el editor no la cambió
    // (mismo tipo), queda la etiqueta original: 'fade' o 'zoom' no se convierten en 'crossfade'.
    const tipo = c.transitionAfter ?? 'cut';
    const transition = esUltimo ? undefined : (baseScene?.transition && transitionKind(baseScene.transition) === tipo ? baseScene.transition : TRANSITION_KIND_REP[tipo]);
    return {
      ...(baseScene || {}),   // acercamientos, insertos, palabras, captura, placa, efecto: lo que el clip no modela
      escenaN,
      src: c.fileRef || baseScene?.src || '',
      in: inSec,
      out: inSec + c.durSec,
      transition,
      audio: c.audio ?? baseScene?.audio ?? (c.dialogo || baseScene?.dialogo ? 'keep' : 'mute'),
      audioGain: c.audioGain ?? baseScene?.audioGain ?? 1,
      rol: c.rol ?? baseScene?.rol,
      dialogo: c.dialogo ?? baseScene?.dialogo,
      // fades: los manda el clip (el menú los pone y los saca); sin fade en el clip, la escena no lo tiene
      fadeIn: c.fadeIn || undefined,
      fadeOut: c.fadeOut || undefined,
    };
  });

  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  const hay = (id: string) => tracks.some((t) => t.id === id);
  const starts = sceneStarts({ ...base, scenes });

  // ── insertos ← pista "Pantallas": cada clip cae en la escena que lo cubre (tiempo del reel → tiempo del clip crudo) ──
  if (hay('pantallas')) {
    const porEscena = new Map<number, InsertoPantalla[]>();
    for (const c of clipsDe(tracks, 'pantallas').filter((x) => !x.esEscena).sort((a, b) => a.startSec - b.startSec)) {
      let i = scenes.findIndex((s, k) => c.startSec >= starts[k] - 1e-6 && c.startSec < starts[k] + (s.out - s.in));
      if (i < 0) i = scenes.length - 1;
      if (i < 0) continue;
      const s = scenes[i];
      const ins: InsertoPantalla = { atSec: r3(s.in + (c.startSec - starts[i])), durSec: r3(c.durSec), src: c.fileRef || '', ...(c.label && c.label !== 'Pantalla' ? { nombre: c.label } : {}), ...(c.meta ? { tarjeta: c.meta as InsertoPantalla['tarjeta'] } : {}), ...(/\.(mp4|webm|mov)$/i.test(c.fileRef || '') ? { video: true } : {}), ...(c.fadeIn != null ? { fadeIn: c.fadeIn } : {}), ...(c.fadeOut != null ? { fadeOut: c.fadeOut } : {}) };
      porEscena.set(i, [...(porEscena.get(i) || []), ins]);
    }
    scenes.forEach((s, i) => {
      const lista = porEscena.get(i);
      if (lista?.length) s.inserts = lista; else delete s.inserts;
    });
  }

  // ── acercamientos ← pista de efectos: el que se borró en el editor deja la escena sin zoom ──
  if (hay('fx')) {
    const conZoom = new Set(clipsDe(tracks, 'fx').filter((c) => c.id.startsWith('zoom-') || c.meta === 'acercamiento').map((c) => c.escenaN));
    for (const s of scenes) if ((s.punchFrom != null || s.punchTo != null) && !conZoom.has(s.escenaN)) { delete s.punchFrom; delete s.punchTo; }
    // efectos ← sus clips (fx-<escena>, meta = el efecto): el que se soltó lo pone, el que se borró lo saca
    const efectos = new Map(clipsDe(tracks, 'fx').filter((c) => c.id.startsWith('fx-') && c.meta && c.escenaN != null).map((c) => [c.escenaN, c.meta as string]));
    for (const s of scenes) { const fx = efectos.get(s.escenaN); if (fx) s.effect = fx; else delete s.effect; }
  }

  // ── placa final ← su clip en la pista de video (duración ajustable); si se borró, el reel termina sin placa ──
  const placa = clipsDe(tracks, 'video').find(esPlaca);
  const endCard = base.endCard ? (placa ? { ...base.endCard, durSec: r3(placa.durSec) } : (hay('video') ? undefined : base.endCard)) : undefined;

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
  const voice = vozClip?.fileRef
    ? { src: vozClip.fileRef, at: vozClip.startSec, ...(vozClip.fadeIn ? { fadeIn: vozClip.fadeIn } : {}), ...(vozClip.fadeOut ? { fadeOut: vozClip.fadeOut } : {}), ...(base.voice?.durSec != null && base.voice.src === vozClip.fileRef ? { durSec: base.voice.durSec } : {}) }
    : base.voice;

  // ── sfx ← pista SFX: cada clip es un efecto en su momento (si la pista está, manda; si no, los de base) ──
  const sfx = hay('sfx')
    ? clipsDe(tracks, 'sfx').filter((c) => c.fileRef).map((c) => ({ src: c.fileRef as string, at: r3(c.startSec), durSec: r3(c.durSec), ...(c.audioGain != null ? { gain: c.audioGain } : {}), ...(c.label ? { nombre: c.label } : {}) }))
    : base.sfx;

  // ── music ← pista música (clip único). gain/duck salen del clip si el inspector los editó
  //    (audioGain del clip / meta 'con ducking'|'sin ducking'), si no de base. ──
  const musClip = clipsDe(tracks, 'musica')[0];
  const music = musClip?.fileRef
    ? {
      src: musClip.fileRef,
      gain: musClip.audioGain ?? base.music?.gain ?? 0.28,
      duck: musClip.meta != null ? musClip.meta === 'con ducking' : (base.music?.duck ?? true),
      ...(musClip.fadeIn != null ? { fadeIn: musClip.fadeIn } : {}),
      ...(musClip.fadeOut != null ? { fadeOut: musClip.fadeOut } : {}),
      // la compuesta a medida conserva con qué duración y clima se pidió (el armado la reusa si alcanza)
      ...(base.music?.generada && base.music.src === musClip.fileRef ? { generada: true, durSec: base.music.durSec, mood: base.music.mood } : {}),
    }
    : base.music;

  // ── mezcla ← cabecera de cada pista con sonido (volumen, mute, solo); la que quedó en 1/sin mute/sin solo no se guarda ──
  const mezcla: NonNullable<MontajePlan['mezcla']> = {};
  for (const t of tracks) {
    if (!t.mix || !(['video', 'voz', 'musica', 'sfx'] as string[]).includes(t.id)) continue;
    const { gain, mute, solo } = t.mix;
    if (gain !== 1 || mute || solo) mezcla[t.id as keyof typeof mezcla] = { gain, ...(mute ? { mute } : {}), ...(solo ? { solo } : {}) };
  }

  return {
    ...base,   // placa final, estilo de marca, motor de render, kit, cta: el editor no los toca
    width: base.width, height: base.height, fps: base.fps,
    scenes, silences, texts, voice, music, ...(sfx?.length ? { sfx } : {}),
    logo: base.logo,
    endCard,
    mezcla: Object.keys(mezcla).length ? mezcla : undefined,
  };
}
