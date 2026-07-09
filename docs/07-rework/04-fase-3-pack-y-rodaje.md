# Fase 3 — Pack Flow (salida 1) + Rodaje (importar los clips)

> **Prerrequisito:** Fases 1-2 mergeadas (moldes + pipeline hasta storyboard).
> **Shippable:** al terminar, la SALIDA 1 está completa: el usuario genera el pack, copia cada
> prompt a Flow, baja los clips, los importa Y cada clip queda vinculado a su escena.

## Hallazgos de la auditoría que esta fase arregla

1. **El "rodaje" hoy es un upload suelto**: los prompts Veo solo se copian uno a uno al
   portapapeles; el clip que volvés a subir cae en una biblioteca GLOBAL de Cloudinary (VideosTab
   se monta sin `project`) sin ningún vínculo con la escena/prompt que lo originó.
2. **No hay estado de rodaje**: nada dice "escena 3: clip pendiente / importado".
3. **`duration_sec=null` en local**: `saveAsset` (server/index.mjs:443) no llena la duración en
   dev → el editor cae a 3s por defecto. Para montar por escenas necesitamos la duración REAL.

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/pasos/PasoPack.tsx` (+ css) | **NUEVO** — pantalla del Pack Flow |
| `src/pasos/PasoRodaje.tsx` (+ css) | **NUEVO** — checklist de escenas + import por escena |
| `server/index.mjs` | EXTENDER — ffprobe de duración en el upload; endpoint de upload de toma |
| `src/lib/comercial.ts` | EXTENDER helpers — estados de clip, progreso de rodaje |

## Paso PACK (6a — solo comerciales tipo `filmado`)

**Pantalla:**
- Botón "Generar pack" → molde `flowpack` (Fase 1) → persiste `comercial.packFlow`.
- **Bloque MASTER** arriba (colapsable) con botón Copiar — es el prompt de estilo/personajes/locación.
- **Lista de clips** (uno por escena): `escenaN`, rol, durSec objetivo, el prompt completo
  (colapsable), y acciones:
  - **Copiar** → al portapapeles + marca `estado: 'copiado'` (persiste). El usuario lo pega en Flow.
  - **Regenerar** → `flowpack` con `regenerate:{escenaN}` (la Fase 1 garantiza: JAMÁS cambia el
    personaje — solo la idea visual).
- **Exportar pack completo** → arma un `.txt` (master + cada clip numerado con su duración) y lo
  descarga (`downloadBlob`, patrón existente en VoiceStudio). Es lo que el usuario se lleva a Flow.
- Barra de progreso del pack: `N copiados / M importados / total`.

**Instrucción visible en la pantalla** (1 línea): "Pegá cada prompt en Google Flow (Veo 3, 9:16,
8s), bajá el clip y volvé a RODAJE para importarlo."

## Paso RODAJE (7)

**Pantalla:** una fila por escena del storyboard:

```
Escena 3 · gag · 8s · "¿te suena?…"        [estado]
  [Importar clip ▾] [ver prompt]           pendiente → importado ✓ (con thumb + duración real)
```

- **Importar clip** (input file mp4/mov/webm) → **`POST /api/projects/<id>/assets`** (multipart,
  existe huérfano — ES el único camino: ya carpetea por proyecto, index.mjs:735). NO usar
  `/api/cloud-videos/upload`: ignora cualquier `folder` (hardcodea `CLD_FOLDER`, index.mjs:545) y
  tira todo a la biblioteca global — justo el hallazgo 1. El backend guarda vía `saveAsset` →
  `server/storage`; la respuesta debe incluir `duration_sec` real (ffprobe, ver abajo) y el
  `public_id` RELATIVO (que es lo que se persiste como `Toma.fileRef` — visión §5).
- Al subir se crea la `Toma { id, escenaN, fileRef, durSec }` en `comercial.rodaje` y el clip del
  pack pasa a `estado:'importado'` con `tomaId`. Persistir en el acto.
- **Varias tomas por escena** permitidas (el usuario puede generar 2-3 variantes en Flow): la última
  importada queda activa; las otras se listan y se puede elegir cuál usar (el montaje usa la activa).
- Preview inline: `<video src="/api/storage/...">` (el streaming con range ya existe).
- Aviso si `durSec` real difiere de la `durSec` objetivo de la escena en >1.5s ("el clip dura 6.2s,
  la escena pide 8s — se estira el montaje o regenerá en Flow").

## Backend: duración real en el upload

En el handler de upload (ambos: `/api/cloud-videos/upload` y `/api/projects/<id>/assets`), si el
archivo es video, correr **ffprobe** (ya hay ffmpeg en PATH; usar
`ffprobe -v error -show_entries format=duration -of csv=p=0 <tmp>`) sobre un temp antes de
`saveAsset`, y devolver `duration_sec` real. Helper `probeDuration(filePath)` en `server/index.mjs`
(o `server/media.mjs` nuevo si index ya está muy largo — preferí extraer).

## Qué NO hacer

- NO tocar VideosTab (la biblioteca global sigue para material suelto/b-roll; el rodaje por escena
  es un flujo aparte). Deuda anotada: pasarle `project` para filtrar.
- NO intentar integrarse con Flow por API/scraping — NO existe API; el copy-paste manual es el diseño.
- NO empezar el montaje (fase 4) — acá solo se deja todo listo: escenas con tomas vinculadas.

## Verificación

1. Suite estándar verde (`tsc`, `eslint`, `vitest`, `build`).
2. Manual: generar pack → verificar que CADA prompt del pack contiene el `fisicoEn` del cast
   (garantizado por parse de Fase 1, verificar visualmente 2-3) → copiar → exportar .txt y abrirlo.
3. Importar un mp4 cualquiera como toma de la escena 1 → la fila pasa a `importado` con thumb y
   **duración real** (no 3s default) → F5 → sigue todo (persistencia server-first de Fase 2).
4. Importar 2 tomas a la misma escena → se puede alternar la activa.
5. `curl localhost:5301/api/projects` muestra `packFlow.clips[].estado` y `rodaje[]` correctos.
