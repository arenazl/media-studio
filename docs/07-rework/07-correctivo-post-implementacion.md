# Correctivo post-implementación — 11 hallazgos del diagnóstico (2026-07-09)

> **Para quién:** el modelo (Opus) que va a ejecutar los fixes. Autosuficiente: no hace falta
> releer las fases, pero sí [`01-vision-y-pipeline.md`](./01-vision-y-pipeline.md) §4-5 si algún
> shape no cierra.
>
> **Contexto:** el rework (fases 1-5) quedó implementado y verificado el 2026-07-09 (~13 commits
> `feat(rework):` en master). El diagnóstico posterior encontró 11 hallazgos: 2 ALTOS (el flujo de
> voz en off quedó desconectado), 5 medios y 4 bajos. Este doc los convierte en WOs ejecutables.
>
> **Cómo ejecutar:** EN ORDEN (C1→C11), un commit por WO (`fix(rework): C<N> — <título>`), de
> corrido y SIN pedir OK por WO (autonomía ya otorgada para el rework). Checklist por WO:
> `npx tsc --noEmit` + `npx eslint src/` (0 errores) + `npm test` + `npm run build` + la prueba
> del WO. Las referencias archivo:línea son exactas al 2026-07-09.
>
> **Regla de estilo:** rioplatense, sin emojis, iconos lucide. Nada de reescrituras — cambios
> mínimos sobre lo que ya anda.

---

## ALTA

### C1 — Voz en off end-to-end (hoy el render la soporta pero la UI no la puede setear)

**Problema (2 mitades del mismo arco):**
1. `MontajePlan.voice` existe y `server/renderComercial.mjs` la mezcla (adelay + volumen + el
   ducking de la música se deriva de ella), pero **`PasoMontaje.tsx` no tiene ningún control** para
   setearla → el comercial con voz en off no sale desde la UI.
2. El mp3 que genera VoiceStudio **muere como objectURL** (`App.tsx` `onAudio` → `audioByReel`,
   estado en memoria): F5 y no está. Era el ítem "Audio persistente" del spec fase 2 §Audio.

**Fix:**
- **(a) Persistir la voz de VoiceStudio:** en el flujo `onAudio` de `App.tsx` (o dentro de
  VoiceStudio al generar), subir el blob a `POST /api/projects/<id>/assets` (multipart existente,
  campo `file`, devuelve `{ asset: { fileRef, duration_sec } }`) y guardar
  `voiceConfig.audioRef = fileRef` en el reel (vía `saveProject`). `audioByReel` queda como cache
  de sesión (rellenarlo desde `audioRef` al abrir proyecto: fetch `/api/storage/<fileRef>` →
  objectURL).
- **(b) UI en el Montaje:** en `PasoMontaje.tsx`, bloque "Voz en off" con: botón **"Usar la voz
  grabada del comercial"** (visible si `reel.voiceConfig?.audioRef`) que setea
  `plan.voice = { src: audioRef, at: 0 }`, un **input file** (mp3/wav) como alternativa (sube por
  el mismo endpoint de assets y setea `plan.voice`), un número editable `at` (segundos) y "quitar
  voz". Persistir con el mismo `patch()` que ya usa la música.
- **(c) ffprobe para audio:** en `server/index.mjs`, handler de assets (~:744), la condición
  `if (tipo === 'video' && cldRes.local)` pasa a `if ((tipo === 'video' || tipo === 'audio') && cldRes.local)`
  — así el upload de voz devuelve `duration_sec` real (ffprobe ya banca audio).

**Nota de acceso al reel:** `PasoMontaje` recibe `reelId` en `PasoProps`; el reel se obtiene de
`project.reels.find(r => r.id === reelId)`.

**Aceptación:** grabar voz en la tab Audio → F5 → la voz sigue (audioRef). En Montaje → "Usar la
voz grabada" → Exportar → el mp4 (ffprobe: stream de audio) **contiene la voz** y la música baja
debajo de ella (verificar a oído). El plan con `voice` sobrevive F5.

### C2 — El guion nuevo no baja al `reel.guion` legacy (VoiceStudio no lo ve)

**Problema:** `PasoGuion.tsx:19` (`applyGuion`) solo setea `comercial.guion`; el spec fase 2
§Molde-script pedía explícito llenar el `guion: string[]` legacy con las `narration` para que
VoiceStudio (tab Audio) funcione sin cambios. Hoy la tab Audio muestra el guion viejo o vacío →
no podés grabar la voz del comercial nuevo (agrava C1).

**Fix:** en `Pipeline.tsx` → `setComercial` (~:30), al armar el reel actualizado, si
`next.guion?.blocks` existe, sincronizar también los campos legacy:
```ts
const narraciones = next.guion?.blocks?.map((b) => b.narration).filter(Boolean);
const reels = project.reels.map((r) => (r.id === reel.id
  ? { ...r, comercial: next, ...(narraciones?.length ? { guion: narraciones, frases: narraciones.length } : {}) }
  : r));
```
(En `Pipeline` y no en `PasoGuion`, así CUALQUIER cambio del guion —editar, regenerar bloque—
sincroniza siempre.)

**Aceptación:** generar/editar el guion en el paso GUION → ir a la tab Audio → VoiceStudio muestra
las frases nuevas. `npm test` verde (no toca `normReel`).

---

## MEDIA

### C3 — Pipeline stale al cambiar de proyecto

**Problema:** `Pipeline.tsx` hace `useState<Project>(initial)`; `App.tsx` → `SectionView` lo
renderiza sin `key` → al cambiar de proyecto en la Topbar estando en la sección Comercial, React
reusa la instancia y seguís viendo el proyecto anterior.

**Fix (1 línea):** en `App.tsx`, `SectionView`: `<Pipeline key={project.id} project={project} />`.
Revisar si `ReelTab`/`VoiceStudio` sufren lo mismo (si reciben `project` y cachean en useState,
mismo fix con `key`).

**Aceptación:** abrir proyecto A → sección Comercial → cambiar a proyecto B por la Topbar → el
pipeline muestra B (su stepper, sus comerciales).

### C4 — Persistencia POR TECLA sin debounce (spec pedía 500ms)

**Problema:** `pasoKit.tsx` `InlineEdit` dispara `onChange` por tecla → `setComercial` →
`saveProject` (write a localStorage + POST al server). Tipear 50 caracteres = 50 POSTs.

**Fix:** en `Pipeline.tsx`, separar estado de persistencia: `setComercial` actualiza el estado
local (`setProject` con el objeto armado en memoria, SIN llamar `saveProject`) y agenda la
persistencia con debounce trailing de 500ms (un `useRef` con `setTimeout`; cada llamada resetea el
timer; el timer vence → `saveProject(projectRef.current)`). **Flush obligatorio** en unmount y
antes de `goNext`/cambio de paso (useEffect cleanup + llamada directa). OJO: `saveProject` genera
`updated_at` — el estado local debe usar el objeto que persiste para no divergir; en el flush,
`setProject(saveProject(...))`.

**Aceptación:** tipear rápido en un textarea del guion → en la pestaña Network hay 1 POST (no N).
F5 a los 2 segundos → lo tipeado está. Los botones (Generar/Aprobar) persisten inmediato (flush).

### C5 — El regen de flowpack bypasea la garantía de consistencia

**Problema:** `server/functions.mjs` → `flowpack.parse` retorna temprano el clip regenerado
(`if (o && o.clip && o.clip.prompt) return ...`) SIN pasar por `verificarConsistenciaFlowpack` →
un prompt regenerado con la hoja de personaje resumida entra sin rechazo (el fix central de la
Fase 1, bypaseado en este path).

**Fix:** en ese early-return, correr la garantía sobre el clip suelto:
```js
if (o && o.clip && o.clip.prompt) {
  const piece = (body && body.context && body.context.piece) || {};
  const clip = { escenaN: Number(o.clip.escenaN), prompt: o.clip.prompt };
  verificarConsistenciaFlowpack([clip], Array.isArray(piece.storyboard) ? piece.storyboard : [], piece.cast || null);
  return { clip };
}
```
(`PasoPack.regenClip` ya manda `storyboard`/`cast` en el context — no hay cambio de front.)

**Aceptación:** `node --check server/functions.mjs`. Prueba API: regenerar un clip con un cast
cuyo `fisicoEn` la IA no pueda incluir (ej. editarlo a un string improbable) → el endpoint
devuelve el error de consistencia (502 con "resumió la hoja"), no un clip inválido.

### C6 — Escenas sin clip se filtran en silencio en el render (tiempos corridos)

**Problema:** `server/renderComercial.mjs` hace `plan.scenes.filter((s) => s.src)` — si una escena
del MEDIO no tiene clip importado, se descarta y los silencios/duración del mp4 se corren respecto
de lo que la UI estimó (la UI cuenta TODAS las escenas). Export "exitoso" pero distinto al plan.

**Fix (dos lados):**
- **Server:** en vez de filtrar, si alguna escena no tiene `src` → `throw new Error('faltan clips
  en las escenas <n1,n2> — importalos en Rodaje o sacalas del montaje')` (el handler ya lo mapea a
  502 con mensaje).
- **Front:** `PasoMontaje` deshabilita "Exportar mp4" si `conClip < plan.scenes.length` y muestra
  qué escenas faltan (ya existe el badge "falta clip"; sumar la condición al `disabled` y una línea
  de aviso).

**Aceptación:** plan con 2 escenas, 1 sin clip → el botón está deshabilitado con el aviso; forzando
el POST por curl → 502 con el mensaje claro. Con todas las escenas con clip → export OK como hoy.

### C7 — Falta el auto-seed "Comenzar" → strategy → 3 comerciales (concept recibe un proxy pobre)

**Problema:** el spec fase 2 §Generación pedía: al terminar el import/wizard, correr `strategy`
1 vez y crear los 3 comerciales con su `angulo`/`creativeBrief`. No se implementó → `PasoConcepto`
manda `piece.angulo = comercial?.titulo` (proxy) → los conceptos de los 3 comerciales salen menos
diferenciados.

**Fix:**
- `src/lib/comercial.ts`: agregar a `Comercial` los campos opcionales `angulo?: string` y
  `creativeBrief?: string` (aditivo).
- `ProjectWizard.tsx` (el flujo post-import, `onDone`): antes de cerrar, correr el molde
  `strategy` (`/api/run-function`, level project — el patrón de fetch está en `pasoKit.runMolde`)
  y por cada `pieces[i]` crear un reel con
  `comercial = { ...nuevoComercial(p.angle, 'filmado'), angulo: p.angle, creativeBrief: p.creativeBrief }`
  (persistir con `saveProject`). Si strategy falla → seguir sin seed (el pipeline ya crea
  on-demand; no bloquear el import).
- `PasoConcepto.tsx`: `piece.angulo = comercial?.angulo || comercial?.titulo` y
  `piece.creativeBrief = comercial?.creativeBrief || ''`.

**Aceptación:** importar un KB → Comenzar → el proyecto queda con 3 reels, cada uno con su
comercial precargado (`angulo` distinto) → el paso CONCEPTO de cada uno genera conceptos
claramente diferenciados. Si el backend está caído, el import igual termina.

---

## BAJA

### C8 — `plan.logo` nunca se setea y `plan.texts` lo ignora el render

- **Logo:** en `storyboardToMontaje` no hay logo, y el render lo soporta (`overlay 46:1784`). Fix
  mínimo: si `project.brandKit.logoSvg` existe, `PasoMontaje.armar` sube el SVG UNA vez como asset
  (o lo escribe el server a tmp en el render — elegir lo más simple) y setea `plan.logo.src`.
- **Texts:** `renderComercial.mjs` ignora `plan.texts`. Como la UI nunca los llena, decidir:
  implementar `drawtext` básico (preset único: texto blanco, safe-area, `enable=between(t,at,at+dur)`)
  O borrar `texts` del shape hasta que exista UI. **Preferido: implementarlo** (el hook en pantalla
  del publish pide texto quemado).

**Aceptación:** export con logo → el mp4 lo muestra abajo-izquierda. Si se implementa texts: un
text de prueba en el plan aparece en el rango correcto.

### C9 — El QA holístico no se persiste

`PasoMontaje.setQa` es useState local. Fix: agregar `qa?: { score: number; verdict: string;
issues?: { severity: string; note: string }[] }` a `Comercial` (aditivo), persistirlo en
`chequear()` y mostrar el guardado al volver al paso. **Aceptación:** chequear calidad → navegar a
otro paso → volver → el score sigue.

### C10 — `durSec` por slide del animado se pasa pero mockupReel usa 3.4s fijo

`server/index.mjs` ya pasa `durSec` en la data (~:697). Fix en `server/mockupReel.mjs`: que
`buildHtml`/el timing de captura respete `slide.durSec` (fallback 3.4). **Aceptación:** render
animado con durSec 2 y 5 → el mp4 dura ~7s (ffprobe), no 6.8 fijo.

### C11 — Limpieza final (fase 5 §4, pendiente)

Borrar (git guarda historial; grep 0 referencias vivas después de cada borrado):
- `src/MontajeTab.tsx` (placeholder muerto — verificar que nadie lo importa).
- `src/GuidedPanel.tsx`, `src/FunctionRunner.tsx`, `src/VeoPanel.tsx` (+ sus css) y la sección
  `prompts` de `src/lib/sections.ts` — publish/qa ya viven en los pasos. OJO: `App.tsx` los importa.
- Moldes `veo` y `mockup` de `server/functions.mjs` + sus entradas en `functionCatalog.ts` (+
  ajustar el test del catálogo). `strategy` se CONSERVA (lo usa C7).
- Marcar deprecated el handler `/api/render` (comentario; no borrar todavía).

**Aceptación:** `grep -r "GuidedPanel\|FunctionRunner\|VeoPanel\|MontajeTab" src/` → 0 vivos;
suite completa verde; la app navega todas las secciones restantes sin errores de consola.

---

## Verificación final (después de C11)

1. Suite completa verde: `npx tsc --noEmit` + `npx eslint src/` + `npm test` + `npm run build`.
2. **E2E filmado CON VOZ:** KB → concepto → guion (→ tab Audio muestra el guion nuevo → grabar
   voz) → cast → storyboard → pack → rodaje (importar clips) → montaje ("usar la voz grabada" +
   música) → exportar → el mp4 tiene diálogo + voz en off + música con ducking + silencio.
3. **E2E animado:** storyboard animado → render (durSec respetado) → montaje (voz+música) → export.
4. Cambiar de proyecto en la Topbar dentro del pipeline → sin estados stale.
5. Tipear en un textarea → 1 POST debounced, no N.
