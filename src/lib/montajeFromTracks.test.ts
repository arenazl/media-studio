// WO-4: la inversión draft→MontajePlan (montajeFromTracks) es el espejo de buildEditorTimeline.
// Invariante clave: sin ediciones, invertir el timeline construido de un plan devuelve un plan
// EQUIVALENTE al original (round-trip identidad). + un caso por edición del NLE.
import { describe, it, expect } from 'vitest';
import { buildEditorTimeline } from './editorTracks';
import { tracksToMontaje } from './montajeFromTracks';
import { splitClip, duplicateClip, deleteClip } from './editorEdits';
import { transitionDur, type MontajePlan } from './montajePlan';
import { nuevoComercial, type Comercial } from './comercial';

// comercial con montaje persistido = un plan conocido (para round-trip exacto).
function comercialConPlan(plan: MontajePlan): Comercial {
  return { ...nuevoComercial('demo', 'filmado'), montaje: { plan, exports: [] } };
}

const planBase: MontajePlan = {
  width: 1080, height: 1920, fps: 30,
  scenes: [
    { escenaN: 1, src: 'a.mp4', in: 0, out: 8, audio: 'keep', audioGain: 1, transition: 'fade', rol: 'hook', dialogo: 'Hola' },
    { escenaN: 2, src: 'b.mp4', in: 0, out: 6, audio: 'mute', audioGain: 1, transition: 'cut', rol: 'cta', dialogo: '' },
  ],
  voice: { src: 'voz.mp3', at: 0 },
  music: { src: 'https://m.mp3', gain: 0.28, duck: true },
  silences: [{ antesDeEscena: 2, durSec: 0.8 }],
  texts: [{ text: 'Hook!', preset: 'titulo', at: 0.3, dur: 3, nx: 0.1, ny: 0.2 }],
  logo: { src: 'logo.png' },
};

describe('round-trip identidad (sin ediciones)', () => {
  const c = comercialConPlan(planBase);
  const tl = buildEditorTimeline(c);
  const back = tracksToMontaje(tl.tracks, planBase);

  it('preserva dims/fps/logo', () => {
    expect([back.width, back.height, back.fps]).toEqual([1080, 1920, 30]);
    expect(back.logo).toEqual({ src: 'logo.png' });
  });
  it('preserva las escenas (src/in/out/escenaN/audio)', () => {
    expect(back.scenes).toHaveLength(2);
    expect(back.scenes[0]).toMatchObject({ escenaN: 1, src: 'a.mp4', in: 0, out: 8, audio: 'keep' });
    expect(back.scenes[1]).toMatchObject({ escenaN: 2, src: 'b.mp4', in: 0, out: 6, audio: 'mute' });
    expect(back.scenes[1].transition).toBeUndefined();   // el último no lleva transición
    // El editor distingue 3 kinds (cut/dissolve/slide); 'fade' del plan colapsa a la familia
    // "disolvencia" y vuelve como su representante canónico 'crossfade' — MISMA duración de xfade en el
    // render (equivalencia de comportamiento, no de etiqueta). No es pérdida real: el mp4 sale igual.
    expect(back.scenes[0].transition).toBe('crossfade');
    expect(transitionDur(back.scenes[0].transition)).toBe(transitionDur('fade'));
  });
  it('preserva voice/music/silences/texts', () => {
    expect(back.voice).toEqual({ src: 'voz.mp3', at: 0 });
    expect(back.music).toEqual({ src: 'https://m.mp3', gain: 0.28, duck: true });
    expect(back.silences).toEqual([{ antesDeEscena: 2, durSec: 0.8 }]);
    expect(back.texts[0]).toMatchObject({ text: 'Hook!', at: 0.3, dur: 3, nx: 0.1, ny: 0.2 });
  });
});

describe('ediciones del NLE', () => {
  const c = comercialConPlan(planBase);
  const tracks = buildEditorTimeline(c).tracks;

  it('split: las dos mitades tienen in/out correctos y ambas apuntan al mismo archivo', () => {
    // parte la escena 1 (0-8) en el segundo 3 (playhead absoluto).
    const edited = splitClip(tracks, 'video-1', 3);
    const back = tracksToMontaje(edited, planBase);
    const s = back.scenes;
    expect(s).toHaveLength(3);   // A + B + escena 2
    // A: in 0, out 3. B: in 3 (srcIn corrido), out 3+5=8.
    expect(s[0]).toMatchObject({ src: 'a.mp4', in: 0, out: 3 });
    expect(s[1]).toMatchObject({ src: 'a.mp4', in: 3, out: 8 });
    expect(s[0].escenaN).toBe(s[1].escenaN);   // ambas comparten el escenaN del origen
  });

  it('eliminar una escena se lleva su silencio anclado', () => {
    const edited = deleteClip(tracks, 'video-2');   // borra la escena 2 (a la que apunta el silencio)
    const back = tracksToMontaje(edited, planBase);
    expect(back.scenes).toHaveLength(1);
    expect(back.silences).toEqual([]);   // el silencio antesDeEscena:2 desaparece con la escena
  });

  it('duplicar añade una escena con el mismo origen', () => {
    const edited = duplicateClip(tracks, 'video-1');
    const back = tracksToMontaje(edited, planBase);
    expect(back.scenes).toHaveLength(3);
    expect(back.scenes.filter((s) => s.src === 'a.mp4')).toHaveLength(2);
  });

  it('editar un texto se refleja en texts', () => {
    const edited = tracks.map((t) => (t.id === 'texto'
      ? { ...t, clips: t.clips.map((cl) => ({ ...cl, label: 'Nuevo hook' })) }
      : t));
    const back = tracksToMontaje(edited, planBase);
    expect(back.texts[0].text).toBe('Nuevo hook');
  });

  it('cambiar la transición del primer clip', () => {
    const edited = tracks.map((t) => (t.id === 'video'
      ? { ...t, clips: t.clips.map((cl) => (cl.id === 'video-1' ? { ...cl, transitionAfter: 'cut' as const } : cl)) }
      : t));
    const back = tracksToMontaje(edited, planBase);
    expect(back.scenes[0].transition).toBe('cut');
  });

  it('volumen del clip de video → audioGain persistido', () => {
    const edited = tracks.map((t) => (t.id === 'video'
      ? { ...t, clips: t.clips.map((cl) => (cl.id === 'video-1' ? { ...cl, audioGain: 0.5 } : cl)) }
      : t));
    const back = tracksToMontaje(edited, planBase);
    expect(back.scenes[0].audioGain).toBe(0.5);
  });

  it('ducking de la música (meta) → music.duck', () => {
    const edited = tracks.map((t) => (t.id === 'musica'
      ? { ...t, clips: t.clips.map((cl) => ({ ...cl, meta: 'sin ducking' })) }
      : t));
    const back = tracksToMontaje(edited, planBase);
    expect(back.music?.duck).toBe(false);
  });
});

describe('pista video vacía → scenes []', () => {
  it('sin clips de video, scenes queda vacío (el render lo rechaza, honesto)', () => {
    const c = comercialConPlan({ ...planBase, scenes: [] });
    const tl = buildEditorTimeline(c);
    const back = tracksToMontaje(tl.tracks, { ...planBase, scenes: [] });
    expect(back.scenes).toEqual([]);
  });
});
