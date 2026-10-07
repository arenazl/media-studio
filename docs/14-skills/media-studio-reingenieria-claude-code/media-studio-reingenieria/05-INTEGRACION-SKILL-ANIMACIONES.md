# 05 — Integración del SKILL de animaciones

## Principio

El `SKILL.md` recibido contiene dos cosas mezcladas:

1. **motor/mecánica excelente y reutilizable**;
2. una narrativa específica "developer ↔ Claude" que NO pertenece a Media Studio.

La integración debe reutilizar la mecánica y generalizar el contenido.

## Qué se conserva

Conservar como principios del motor:

- video vertical 1080x1920;
- 30 fps;
- render frame-by-frame;
- Three.js;
- Chrome/Edge headless;
- WebGL GPU real;
- abortar ante SwiftShader/software rendering;
- un solo browser;
- prioridad baja;
- no workers paralelos;
- `window.setT(t)` puro y determinístico;
- timeline como fuente única de timing;
- ElevenLabs con cache;
- word alignment;
- subtítulos;
- shots/cámara;
- grounding;
- penetration checks;
- motion lint;
- stills/contact sheet antes del full render;
- render resumible por chunks;
- ffmpeg + ffprobe;
- verificación de loudness y video final.

## Qué se elimina/generaliza

Eliminar del skill productivo:
- developer obligatorio;
- Claude character obligatorio;
- humor de programadores;
- diálogo ping-pong obligatorio;
- "open with Claude";
- identidad visual de Claude;
- obligación de dos personajes.

Sustituir por entrada del storyboard.

## Nuevo nombre sugerido

```yaml
name: media-studio-animation-renderer
description: Render a Media Studio animated reel from a validated storyboard, brand assets, screen captures and narration using Three.js, ElevenLabs, headless Chrome and ffmpeg.
```

## Contrato de entrada

Crear `animation-job.json`:

```json
{
  "jobVersion": "1.0",
  "projectId": "",
  "pieceId": "",
  "format": {"width":1080,"height":1920,"fps":30},
  "durationSec": 25,
  "brand": {},
  "voice": {
    "voiceId": "",
    "phoneticBrand": ""
  },
  "cast": [],
  "screens": [],
  "script": {"blocks":[]},
  "storyboard": {"escenas":[]},
  "assets": {
    "logo": "",
    "screenshots": []
  }
}
```

El skill NO vuelve a decidir:
- estrategia;
- concepto;
- mensaje;
- CTA;
- claims;
- texto aprobado.

## Flujo adaptado

```text
animation-job.json
   ↓
requirements + GPU probe
   ↓
audio/voices
   ↓
timeline
   ↓
scene construction
   ↓
stills
   ↓
automated QA
   ↓
contact sheet
   ↓
APPROVAL STATE
   ↓
full render in chunks
   ↓
mix
   ↓
mux
   ↓
ffprobe + final contact sheet
   ↓
MP4
```

## Integración con la UI

En el paso de producción animada:

Estados sugeridos:
```text
preparing
audio
timeline
scene
stills
needs_approval
rendering
mixing
verifying
done
error
```

Mostrar:
- progreso real;
- contact sheet;
- botón "Aprobar render";
- "Regenerar escena N";
- "Cambiar estilo";
- errores claros.

## Stills obligatorios

No permitir `full render` sin:
- frame 1;
- principio/final de cada shot;
- beats de movimiento relevantes;
- frame previo al cierre.

La aprobación puede persistirse:
```json
{
  "stillsVersion": "...",
  "approvedAt": "...",
  "approvedBy": "user"
}
```

Si cambia storyboard/timeline/scene config, invalidar aprobación.

## `setT(t)` como contrato no negociable

`window.setT(t)`:
- no `performance.now`;
- no `requestAnimationFrame`;
- no random sin seed;
- no physics acumulativa;
- no dependencia del frame anterior.

Esto hace posible:
- resume;
- stills baratos;
- regeneración parcial;
- QA frame-by-frame.

## Job workspace

Usar carpeta por pieza:

```text
server/storage/<project>/<piece>/animation/
    input/
        animation-job.json
        assets/
    work/
        film.html
        scene.js
        timeline.mjs
        ...
    vo/
    stills/
    frames/
    output/
```

No ensuciar la raíz del repo.

## Reutilización de templates

Extraer partes estables del skill a templates versionados:
- `film.html`;
- `cdp.mjs`;
- `render.mjs`;
- `check.mjs`;
- postprocessing;
- subtitle layout;
- audio utilities.

Claude sólo genera/configura lo específico del reel.

## QA obligatorio antes del render

Automatizar:
- teleports;
- acceleration spikes;
- jitter;
- grounding;
- penetration;
- duplicated key times;
- NaN;
- camera intersections;
- subtitle bounds;
- clipping;
- stale stems.

Bloquear render si hay errores severos.

## Relación con el render actual

No eliminar `mockupReel.mjs`.

Ofrecer dos motores debajo de la misma pieza animada:
- `mockup`: rápido;
- `full-animation`: skill adaptada.

El pipeline del usuario no cambia.
