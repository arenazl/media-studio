# Plan de cableado IA/algoritmos — WOs para Opus (seguir al pie de la letra)

## Para el dueño — qué va a hacer este plan (resumen en criollo)

El rediseño dejó la interfaz completa y navegable, pero con cables sueltos. Este plan le ordena a
Opus conectarlos: **(1)** que el formato que elegís al crear una pieza (reel, cuadrado de Meta, spot
de YouTube/TV) deje de ser decorativo y realmente cambie cómo se escribe el guion y en qué medidas
sale el video final; **(2)** que el editor de video **guarde lo que editás** (hoy al salir se pierde
todo) y esas ediciones lleguen al mp4; **(3)** un botón "Auto-armar" que arma la línea de tiempo
sola con todo lo ya generado — clips, voz, música y textos —, sin gastar IA porque es puro
acomodamiento; **(4)** detalles: arrastrar cosas de la biblioteca a la timeline, ver qué prompt
originó cada video, y un generador de prompts de Flow suelto (fuera de un proyecto). Son 7 pasos en
orden, cada uno verificado en el ambiente real antes de seguir, **todo implementado por Opus solo**.

> **Autor:** Fable (director), 2026-07-12. **Implementa: OPUS, y SOLO Opus.** Directiva explícita del
> dueño: **PROHIBIDO delegar a Sonnet o Haiku** (la delegación a modelos menores trajo problemas y el
> balance dio pérdida). Si usás subagentes, tienen que correr con Opus. Todo lo demás del flujo de la
> casa aplica igual: español rioplatense, sin emojis (solo SVG/lucide), no inventar datos.
>
> Este doc RESUELVE las decisiones abiertas de `06-PENDIENTE-MODELO-SUPERIOR.md` (T1–T4). Cada duda
> tiene su decisión tomada (sección "Decisiones") y su work order (WO-0 a WO-6) con archivos, cambios,
> criterios de aceptación y gates. No hay que re-decidir nada: si algo de acá contradice tu intuición,
> vale el doc. Si encontrás un impedimento REAL (el código no es como se describe), frená ese WO,
> anotalo y seguí con el siguiente — no improvises un diseño alternativo.

## Invariantes (idénticos al 06, no re-negociables)

- **`src/App.tsx` = dueño único del estado** (`updateProject`/`persistNow`/`scheduleSave`). Toda
  persistencia nueva pasa por ahí (el editor va a recibir un callback cableado a `updateProject`,
  NUNCA va a escribir localStorage/server por su cuenta).
- **`VEO_RULES` (`server/functions.mjs:33-45`) NO se toca.** Es calibración battle-tested.
- **Gate por WO:** `npx tsc --noEmit` 0 · `npx eslint src/ --ext .ts,.tsx` 0 ·
  `npx vitest run --pool=vmThreads` verde (297 + los nuevos) · `npm run build` sin warnings nuevos ·
  verificación en ambiente real (back `:5301` con `npm run server` + front `npm run dev`), nunca mock.
- **Un commit por WO** (`feat(...)`/`fix(...)`), mensaje corto en español.
- **No inventar datos** (regla dura de la casa): placeholder = vacío y marcado, jamás un valor plausible.

## Hechos del código que fundamentan las decisiones (verificados 2026-07-12)

Para que no re-explores: esto ya se midió leyendo el código real.

1. El server persiste el proyecto como **blob JSON verbatim, sin validación de shape**
   (`server/db.mjs:80-91`, columna `data TEXT`). Agregar campos a `Project`/`Comercial` NO toca server.
2. **PERO** `saveProject` del front arma el objeto **campo por campo** (`src/lib/projects.ts:132-142`):
   un campo nuevo top-level de `Project` se PIERDE al guardar salvo que se agregue al builder. En
   cambio, campos nuevos **dentro de `reels[]`/`comercial`** viajan solos (spread en `normReel`,
   `projects.ts:77-80`).
3. El `tipo` de cada pieza hoy está **hardcodeado `'filmado'`** en la siembra
   (`src/ProjectWizard.tsx:58`); el molde `strategy` NO decide tipo (su shape ni lo tiene,
   `server/functions.mjs:102-107`).
4. El molde de guion se llama **`script`** (no "guion") en `RUNNERS` (`server/functions.mjs:119-148`).
   Recibe duración (`:125`) y tono/ángulo, pero **"reel 9:16" está hardcodeado** (`:133`) y NO recibe
   plataforma. `storyboard` (`:262`, `:272`) y `flowpack` (`:314`, `:322`, `:327`) también tienen
   9:16 hardcodeado.
5. `MontajePlan` **ya tiene `width/height/fps`** (`src/lib/montajePlan.ts:22-30`) pero el render
   **los ignora**: `renderComercial.mjs:12` tiene `scale=1080:1920...crop=1080:1920,fps=30` clavado.
6. El render SÍ ejecuta hoy: transiciones por tipo (`XFADE_MAP`, `renderComercial.mjs:16`),
   `audioGain` por escena (`:150`), `music.gain`/`music.duck` (`:156-158`), silencios (`:157`),
   textos con `text/at/dur/nx/ny` (`:130-140`). **NO ejecuta:** opacidad, transform/escala por clip,
   rotación, fades de audio por clip, volumen de voz (fijo 1.4, `:154`), alineación/color de texto
   (preset drawtext único: blanco 54px borde negro, `:140`).
7. Los overrides del inspector (transform/opacidad/color/volumen/ducking/fades) son **estado local
   de sesión** en `src/EditorInspector.tsx:43-45`, con hint honesto "(vista previa — no persiste aún)".
8. `splitClip` (`src/lib/editorEdits.ts:52-63`) **NO ajusta el offset de origen de la parte B**: hoy
   ambas mitades apuntarían al mismo `in` del archivo. Gap real a arreglar en WO-4.
9. La voz del reel vive en `reel.voiceConfig.audioRef` (`src/lib/editorLibrary.ts:64`,
   `src/pasos/PasoMontaje.tsx:49`); PasoMontaje ya sabe ponerla en el plan (`:78-81`).
10. Rodaje importa tomas por `POST /api/projects/:id/assets` (storage local,
    `src/pasos/PasoRodaje.tsx:32`); los cloud-videos (Cloudinary, `server/index.mjs:583-634`) son un
    registro SEPARADO — hoy no hay ningún vínculo entre ambos.
11. El modelo por molde lo decide el FRONT (`src/lib/settings.ts:41-43` + tiers en
    `src/lib/functionCatalog.ts`); el server solo whitelistea (`server/index.mjs:216`, `:222`).

---

## Decisiones (las dudas de Opus, resueltas)

**D1 — Alcance de `Formato`: implementar la entidad SIN renombrar `Comercial`→`Pieza`.**
El rename es churn puro sobre el core con 297 tests encima y no desbloquea nada funcional. Queda
diferido sine die. `Formato` entra como entidad tipada nueva + campo `formatoId` en `Comercial`.

**D2 — Mapeo `tecnicaProduccion` → `tipo` (la duda del prototipo):**
`filmado → 'filmado'` · `animado → 'animado'` · `mixto → 'filmado'` (el 1:1 recorta el reel filmado;
usa cast/rodaje) · `slideshow → 'animado'` (piezas fijas sin rodaje = pipeline animado: sin
cast/pack/rodaje, con paso render) · `3D → 'filmado'` (no hay formato 3D en el catálogo hoy; default
conservador). Solo existen 2 pipelines (`TipoComercial`, `comercial.ts:14`) y NO se agregan más.

**D3 — Dónde vive el formato:** `formatoId` **por `Comercial`** (canónico — HANDOFF §8: "reutilizar
en otro formato = nueva pieza") + `formatoId` a nivel `Project` (el default que eligió el wizard, para
la siembra). El de Project REQUIERE tocar el builder de `saveProject` (hecho 2); el de Comercial viaja solo.

**D4 — Parametrización de moldes: conservadora.** Se interpola el formato (aspecto, plataforma,
duración objetivo) EXACTAMENTE donde hoy hay "reel 9:16"/duración hardcodeados. NO se reescriben los
cuerpos de los prompts (están calibrados). Sin formato (proyectos viejos) el prompt resultante tiene
que ser **byte-idéntico al actual** (retrocompatibilidad verificable).

**D5 — Shape de `MontajePlan`: NO se agregan campos que el render no ejecute.** Persistir un
`opacity` que el mp4 final ignora es mentirle al usuario (regla de honestidad). Se persiste TODO lo
ejecutable (hecho 6): orden/in/out/transition/audioGain de escenas, texts completos, voice, music
gain+duck. Transform/opacidad/rotación, align/color de texto y fades por clip **quedan como preview
de sesión con el hint honesto que ya tienen** (hecho 7). Si algún día el render los soporta, se
agregan campo y control juntos — nunca el campo solo.

**D6 — Flujo de persistencia del editor:** inverso puro `tracksToMontaje(draft, base)` (nuevo,
testeable, espejo de `buildEditorTimeline`) + prop `onSaveMontaje(plan)` que App cablea a
`updateProject` (dueño único intacto). **El render sigue teniendo UN solo dueño: PasoMontaje** (ahí
está la UI de insumos/progreso/QA; un render puede tardar minutos y necesita esa pantalla).
"Listo → Publicar" = guardar el plan + navegar (como hoy); NO dispara render escondido sin UI de progreso.

**D7 — Auto-armado del editor: determinístico, SIN molde de IA nuevo.** Los insumos (storyboard,
guion, voz, publicación) YA son producto de moldes IA; el armado es layout puro sobre datos reales.
Algorítmico = testeable, gratis, sin latencia. `storyboardToMontaje` ya hace el 80% (transición fade
pre-CTA, silencio pre-gag, música por mood, ducking); falta sumarle voz + textos de datos reales.
Si a futuro se quiere criterio creativo de IA para el orden, será un molde aparte — fuera de alcance.

**D8 — Link video↔escena: snapshot `promptUsado` en la `Toma` al importar.** El prompt es derivable
de `packFlow.escenas[escenaN].prompt`, PERO el packFlow se puede regenerar después: el snapshot
preserva el prompt que ORIGINÓ ese clip (dato histórico real, no derivación frágil). No se hace
dual-write a Cloudinary (costo duplicado sin valor); el workspace Videos suma las tomas de proyectos
como fuente adicional de solo lectura.

**D9 — Único molde de IA NUEVO de toda la ronda: `videoprompt`** (generar prompt de Flow standalone,
T4). Reusa `VEO_RULES` verbatim. Tier `sonnet` en el catálogo (es una llamada corta; el tier lo
decide el catálogo como siempre, hecho 11 — esto NO contradice "solo Opus implementa": Opus escribe
el código, el molde en runtime corre con el tier que le toca).

---

## WO-0 — Check en ambiente real del molde `strategy` (antes de todo)

**Qué:** el agente de F5 no vio resolver `strategy` al final del wizard en su sandbox (headless
anidado +100s). Verificarlo en la máquina real ANTES de tocar nada, para no atribuirle al rediseño
un problema preexistente.
**Cómo:** levantar back (`npm run server`, :5301) + front (`npm run dev`), correr el wizard completo
con un KB real (munify): elegir formato → app → Crear pieza → perfil → esperar `strategy` → el
proyecto abre con las piezas sembradas.
**Criterio:** el flujo completa. Si falla, diagnosticar y anotar en este doc antes de seguir (puede
ser entorno, no código).

## WO-1 — Entidad `Formato` + cableado de `tipo` (T1a) · el norte

**Archivos:** `src/lib/formato.ts` (NUEVO) · `src/lib/formatosCatalog.ts` · `src/lib/comercial.ts` ·
`src/lib/projects.ts` · `src/Wizard.tsx` · `src/ProjectWizard.tsx` · `src/FormatsCatalog.tsx` · `src/App.tsx`.

1. **Crear `src/lib/formato.ts`** — la entidad (HANDOFF §8, acotada a lo que el sistema ejecuta hoy):
   ```ts
   export type Aspecto = '9:16' | '1:1' | '4:5' | '16:9';
   export type TecnicaProduccion = 'filmado' | 'animado' | 'mixto' | 'slideshow' | '3D';
   export interface Formato {
     id: string; nombre: string;
     aspecto: Aspecto;
     dims: { width: number; height: number };   // 9:16=1080×1920 · 1:1=1080×1080 · 4:5=1080×1350 · 16:9=1920×1080
     fps: number;                               // 30 en todos por ahora
     plataforma: string;                        // texto para prompts/UI ("Instagram / TikTok", "Meta Ads", "YouTube", "TV")
     tecnicaProduccion: TecnicaProduccion;
     duracion: { min: number; max: number; default: number };  // seg
   }
   ```
   `FORMATOS_DEF: Formato[]` con los 6 del catálogo actual (mismos ids/nombres/aspectos/plataformas/
   técnicas de `formatosCatalog.ts:18-49`; duración: default 20 en todos salvo `spot-tv-16-9` default
   25 con rango 20–30; el resto rango 15–30). `specsEntrega`/`moldeGuion`/`moldeRender` del HANDOFF §8
   NO se agregan todavía (nada los consume — YAGNI; se suman cuando exista el consumidor).
   Helpers puros: `getFormato(id?: string): Formato | undefined` ·
   `tipoDesdeFormato(f?: Formato): TipoComercial` (mapeo D2, default `'filmado'` sin formato) ·
   `FORMATO_DEFAULT_ID = 'reel-9-16'`.
2. **`formatosCatalog.ts` pasa a derivar de `formato.ts`** (que queda como fuente única): conserva
   SOLO la capa de presentación (accent, `Icon`, `nota`) mapeada por id sobre `FORMATOS_DEF`, y borra
   su TODO de la línea 7. `FormatoCard` mantiene su shape actual para no tocar las pantallas que lo consumen.
3. **`comercial.ts`:** agregar `formatoId?: string` a `Comercial` (`:114-131`). NADA más — no tocar
   `pasosVisibles`/`pasoHabilitado`/`nuevoComercial`.
4. **`projects.ts`:** agregar `formatoId?: string` a `Project` (`:59-72`) **Y al builder de
   `saveProject`** (`:132-142`) — si no, se pierde (hecho 2). También al type del input.
5. **`Wizard.tsx`:** en `crear()` (`:48-66`) pasar `formatoId: formato.id` al `saveProject` y borrar
   el TODO de `:58-60`. Prop nueva opcional `formatoIdInicial?: string` para preseleccionar el paso 1.
6. **`ProjectWizard.tsx:58`:** la siembra deriva el tipo:
   `nuevoComercial(titulo, tipoDesdeFormato(getFormato(project.formatoId)))` y estampa
   `formatoId: project.formatoId` en cada comercial (junto a `angulo`/`creativeBrief`). El fallback
   sin formato (`:64`) queda `'filmado'` como hoy.
7. **`FormatsCatalog.tsx`:** habilitar "Usar este formato" → navega al wizard con ese formato
   preseleccionado (App agrega el estado de ruta que haga falta para pasar `formatoIdInicial`; es
   estado de navegación, no de datos — permitido en App.tsx). Borrar el TODO de `:8-10`.
8. **Tests nuevos** (`src/lib/formato.test.ts` + tocar el de projects si hay round-trip):
   mapeo D2 completo (5 técnicas → tipo), dims por aspecto exactas, `getFormato` con id inexistente,
   round-trip de `formatoId` por `saveProject` (Project) y dentro de `comercial` (reel).

**Criterio de aceptación:** crear una pieza con "Reel animado" en el wizard → las piezas sembradas
salen `tipo: 'animado'` y el spine del proyecto muestra los 7 pasos de animado (sin cast/pack/rodaje).
Con "Reel vertical" → 9 pasos de filmado. Proyectos viejos (sin formatoId) abren idénticos a hoy.

## WO-2 — Moldes parametrizados por formato (T1b)

**Archivos:** `server/functions.mjs` · el armador del payload en el front (buscar los callers de
`/api/run-function`, patrón `runFn`/`runMolde` en `src/` — p. ej. `src/ProjectWizard.tsx:51` y los
`Paso*.tsx`) · tests de prompts del server si existen.

1. **Front:** donde se arma el `piece` del body de run-function, sumar el formato resuelto:
   `formato: { aspecto, plataforma, durDefault }` (desde `getFormato(comercial.formatoId)`; ausente
   si no hay formato — NO mandar defaults inventados desde el front).
2. **`functions.mjs` — `ctx()` (`:48-64`):** derivar `x.aspecto = piece.formato?.aspecto || '9:16'`
   y `x.plataforma = piece.formato?.plataforma || 'Instagram / TikTok'`;
   `x.durationSec` pasa a preferir `piece.durationSec || piece.formato?.durDefault || 18`.
3. **Interpolar SOLO en los hardcodeos** (D4):
   - `script:133`: `"reel 9:16"` → `` `pieza ${x.aspecto} para ${x.plataforma}` `` (misma frase, dato variable).
   - `storyboard:262` y `:272`: `9:16` → `${x.aspecto}`.
   - `flowpack:314`, `:322`, `:327`: `9:16` → `${x.aspecto}`. **`VEO_RULES` intacto.**
   - `strategy:102-107`: en el shape de ejemplo, `format:"reel 9:16"` y `durationSec:20` →
     interpolar el formato del proyecto si vino (`context.project.formato`— sumarlo al payload del
     front igual que en piece); sin formato, queda como hoy.
4. **Retrocompat verificable:** sin `formato` en el body, cada prompt generado debe ser
   **byte-idéntico** al actual. Si hay tests de prompts en el server, agregar el caso con formato
   16:9; si no hay, agregar un test mínimo de `buildFunctionPrompt` para `script` con y sin formato
   (el runner se exporta — ver `:367-379`).

**Criterio:** con una pieza `spot-yt-16-9`, los prompts de script/storyboard/flowpack mencionan
16:9/YouTube y no queda NINGÚN "9:16" hardcodeado en esos tres moldes; una pieza vieja genera el
prompt de siempre.

## WO-3 — Render por aspecto (T1c)

**Archivos:** `server/renderComercial.mjs` · `src/lib/montajePlan.ts`.

1. **`renderComercial.mjs:12`:** `SC` deja de ser constante — se construye por render desde
   `plan.width/plan.height/plan.fps` con default 1080/1920/30 (los planes viejos no traen sorpresas:
   ya tienen los campos, hecho 5).
2. **Posiciones absolutas → relativas a dims:** el logo (`:127`) hoy es `scale=86:-1` +
   `overlay=46:1784`; pasar a margen izquierdo fijo 46 y `y = height - 136` (1784 = 1920−136, misma
   posición exacta en 9:16). El drawtext default ya es relativo (`h*0.78`, `:137-138`) — verificar,
   no tocar. `fontsize=54` queda fijo v1 (aceptable en todos los aspectos; anotar si en 16:9 se ve chico).
3. **`storyboardToMontaje` (`montajePlan.ts:87` y `:113`):** los `1080/1920` hardcodeados pasan a
   salir del formato del comercial (`getFormato(comercial.formatoId)?.dims`, default actual sin formato).
4. **Animado no-9:16 (documentar, no bloquear):** `mockupReel` sigue renderizando 9:16; la conversión
   al aspecto final la hace el `SC` del render (scale + crop centrado). Es un recorte real — anotarlo
   en el doc de la pieza, no "arreglarlo" inventando otro renderer.
5. **Verificación real (no mock):** armar un plan 1:1 de prueba con un clip real → `POST
   /api/render-comercial` → `ffprobe` del mp4 = 1080×1080. Ídem un 9:16 viejo = idéntico a hoy.

**Criterio:** el mp4 final respeta `plan.width/height/fps`; un proyecto viejo renderiza
byte-comparable a antes (mismas dims, mismo layout de logo/texto).

## WO-4 — Editor: cerrar el loop de persistencia (T2) · el más grande

**Archivos:** `src/lib/editorTracks.ts` · `src/lib/editorEdits.ts` ·
`src/lib/montajeFromTracks.ts` (NUEVO) · `src/Editor.tsx` · `src/EditorToolbar.tsx` ·
`src/EditorInspector.tsx` · `src/App.tsx`.

1. **`editorTracks.ts` — el clip lleva su identidad de origen:** `EditorClip` suma
   `srcIn?: number` (offset dentro del archivo = `s.in`) y `escenaN?: number`.
   `buildEditorTimeline` los puebla para la pista video. Sin esto la inversión es adivinanza.
2. **`editorEdits.ts` — arreglar el gap del split (hecho 8):** en `splitClip:52-63`, la parte B
   ajusta `srcIn: (clip.srcIn ?? 0) + (atSec - clip.startSec)`. Test que lo pruebe.
3. **NUEVO `src/lib/montajeFromTracks.ts`** — el inverso puro, espejo de `buildEditorTimeline`:
   `tracksToMontaje(tracks: EditorTrack[], base: MontajePlan): MontajePlan`. Reglas:
   - **scenes** ← pista `video` ordenada por `startSec`: `src = fileRef`, `in = srcIn ?? 0`,
     `out = in + durSec`, `transition = TRANSITION_KIND_REP[transitionAfter]`
     (`editorTracks.ts:70` — exportarla), `escenaN` PRESERVADO (splits/dups comparten el del origen —
     mantiene el vínculo con `rodaje[]`); `audio`/`dialogo`/`rol`/`audioGain` se completan del clip
     si los tiene o de la escena base con ese `escenaN` (primera ocurrencia).
   - **silences** ← los de `base` cuyo `antesDeEscena` siga existiendo en las scenes resultantes
     (una escena borrada se lleva su silencio). Nota consciente: con `escenaN` repetido (split/dup),
     `silenceRanges` ancla a la PRIMERA ocurrencia (`montajePlan.ts:169-179` usa Map) — comportamiento
     aceptado, documentarlo en el header del archivo.
   - **texts** ← pista `texto`: `text = label`, `at = startSec`, `dur = durSec`, `nx/ny`,
     `preset = meta`. **voice** ← pista `voz` (clip único: `src = fileRef`, `at = startSec`).
     **music** ← pista `musica` (`src = fileRef`; `gain`/`duck` del estado del inspector o de `base`).
   - **width/height/fps/logo** ← de `base`, intactos.
   - Pista video vacía → `scenes: []` (el render lo rechaza con su error real, `renderComercial.mjs:97` — honesto).
   - **Tests obligatorios:** round-trip identidad (`tracksToMontaje(buildEditorTimeline(c).tracks, plan)`
     equivalente a `plan` sin ediciones) + un caso por edición: split (in/out correctos en ambas
     mitades), duplicar, eliminar (la escena y su silencio), cambiar transición, editar texto, mover playhead no afecta.
4. **`Editor.tsx` — persistencia vía dueño único:** prop nueva
   `onSaveMontaje: (plan: MontajePlan) => void`; App la cablea en la ruta editor con `updateProject`:
   escribe `comercial.montaje = { plan, exports: (previos ?? []) }` y
   `avanzarEstado(c, 'montaje', 'editado')`. El editor NO conoce localStorage ni fetch.
   - Botón **Guardar** en la toolbar (el chip "Guardado" pasa a real: `dirty` → botón activo,
     guardado → chip). **"Listo → Publicar"** = guardar (si dirty) + `onPublish()` como hoy — el
     render queda en PasoMontaje (D6).
   - **Salir con cambios sin guardar** (`onBack` con `dirty`): confirmación con el patrón de modal
     que ya use la app (buscar ConfirmModal/equivalente); si no existe ninguno, `window.confirm`
     con un comentario de deuda. No inventar un modal nuevo de diseño.
5. **Inspector — cablear SOLO lo ejecutable (D5):**
   - Volumen sobre clip de **video** → `audioGain` (0–100 del slider ↔ 0–1 persistido, default 1):
     pasa del estado local al draft (callback nuevo `onMediaChange` estilo `onTransitionTypeChange`).
   - Volumen sobre **música** → `music.gain` (mostrar el valor real, default 0.28) · **ducking** →
     se simplifica a **toggle** on/off (`music.duck`; el render solo tiene DUCK_GAIN fijo 0.4 —
     etiqueta honesta: "baja al 40% bajo la voz"). El slider de ducking actual se reemplaza.
   - Volumen sobre **voz**: el render lo tiene fijo (1.4, hecho 6) → deshabilitar con hint honesto.
   - Transform/opacidad/rotación, align/color de texto, fades por clip: quedan EXACTAMENTE como
     están (preview de sesión + hint) — NO persistirlos (D5).
6. **Gate visual obligatorio (ambiente real + Playwright o capturas miradas):** abrir editor con el
   proyecto `munify-ejemplo` → split de un clip + eliminar otro + cambiar una transición + editar un
   texto + Guardar → **recargar la app** → el editor re-muestra lo editado; el paso Montaje muestra
   el plan editado; disparar render desde Montaje usa ese plan.

**Criterio:** las ediciones sobreviven recarga y llegan al mp4. `resolvePlan`
(`editorTracks.ts:80-85`) ya prefiere el plan persistido — no tocarlo.

## WO-5 — Auto-armado determinístico del editor (T3)

**Archivos:** `src/lib/autoArmar.ts` (NUEVO) · `src/Editor.tsx`/`EditorToolbar.tsx` ·
`src/pasos/PasoMontaje.tsx` (reuso opcional).

1. **NUEVO `src/lib/autoArmar.ts`:** `autoArmarPlan(comercial, reel): MontajePlan` — puro:
   - Base = `storyboardToMontaje(comercial)` (ya resuelve escenas, transición pre-CTA, silencio
     pre-gag, música por mood, ducking — `montajePlan.ts:76-119`).
   - **+ Voz:** si `reel?.voiceConfig?.audioRef` → `voice = { src, at: 0 }` (mismo origen que
     PasoMontaje `:49,:79`).
   - **+ Textos SOLO de datos reales** (la POSICIÓN/duración es criterio de layout — permitido; el
     TEXTO jamás se inventa): si `comercial.publicacion?.hookOnScreen` → overlay en la primera
     escena (`at: 0.3`, `dur: min(3, dur escena 1)`, `preset: 'titulo'`); si
     `comercial.publicacion?.cta` → overlay desde el inicio de la escena `rol === 'cta'` hasta el
     final (`preset: 'cta'`). Sin `publicacion` → sin textos (vacío honesto).
2. **Editor:** botón "Auto-armar" en la toolbar (el chip "Auto-armado" del prototipo pasa a acción):
   reemplaza el draft con `buildEditorTimeline` sobre `autoArmarPlan(...)` vía `pushHistory` —
   **deshacible con undo**. Borrar el TODO de `Editor.tsx:10-11`.
3. **Coherencia (opcional, si es barato):** el "Armar" de PasoMontaje puede pasar a usar
   `autoArmarPlan` (hoy usa `storyboardToMontaje` pelado) — un solo armador en el sistema. Si toca
   más de lo esperado, dejarlo y anotar.
4. **Tests:** con/sin voz, con/sin publicacion, filmado/animado, idempotencia (correrlo dos veces = mismo plan).

**Criterio:** en `munify-ejemplo`, "Auto-armar" deja timeline con clips + voz + música + textos del
hook/CTA reales, y undo lo revierte. Cero llamadas de red.

## WO-6 — Menores (T4)

### 6a — Drag biblioteca → timeline (mecánico, requiere WO-4)
**Archivos:** `src/lib/editorLibrary.ts` · `src/EditorLibrary.tsx` · `src/EditorTimeline.tsx` · `src/Editor.tsx`.
- `LibItem` suma `durSec?: number`; `buildClipsBin` lo puebla de `Toma.durSec` (`editorLibrary.ts:53-59`).
- Drag HTML5 (`draggable` + `dataTransfer` con el id del item) SOLO en items con `fileRef`. Drops v1:
  **clips → pista video** (inserta en la posición del drop con ripple, `escenaN = max existente + 1`,
  `srcIn: 0`, `durSec` del item) · **voz → pista voz** (reemplaza el clip de voz) · **música → pista
  música** (reemplaza) · **texto → pista texto** (instancia en el playhead, `dur: 2.5`, contenido =
  label del preset, editable en el inspector). Todo entra por `mutate` → deshacible.
- **Efectos y Marca NO son droppables v1** (el render no ejecuta efectos por clip; el logo ya viene
  del brandKit): cursor not-allowed + tooltip honesto. Borrar el TODO de `EditorLibrary.tsx:4`.

### 6b — Link video ↔ escena de Pack Flow (D8)
**Archivos:** `src/lib/comercial.ts` · `src/pasos/PasoRodaje.tsx` · `src/VideosTab.tsx` · `src/VideoDetail.tsx`.
- `Toma` suma `promptUsado?: string` (`comercial.ts:92-97`). Al importar en PasoRodaje, snapshot:
  `promptUsado = comercial.packFlow?.escenas.find(e => e.escenaN === escenaN)?.prompt` (puede quedar
  undefined si no hay packFlow — honesto).
- Workspace Videos: sumar sección/fuente "Tomas de proyectos" (derivada de los proyectos ya cargados
  — NADA se sube a Cloudinary) con badge de origen, además de los cloud-videos actuales.
- `VideoDetail`: si el video es una toma con `promptUsado`, mostrarlo real (+ proyecto/pieza/escena);
  si es un cloud video suelto, queda el "Sin registrar" actual. Borrar el TODO de `VideoDetail.tsx:152-154`.

### 6c — Molde `videoprompt` standalone (D9 — el único molde IA nuevo)
**Archivos:** `server/functions.mjs` · `src/lib/functionCatalog.ts` · `src/VideosTab.tsx`.
- RUNNER nuevo `videoprompt` en `RUNNERS` (patrón de los demás, `functions.mjs:88-365`):
  `build` = descripción libre del usuario (`options.brief`, obligatoria) + modo
  (`options.modo: 'talking-head' | 'b-roll'`) + **`VEO_RULES` verbatim** → pide UN prompt final en
  inglés listo para pegar en Flow (talking-head: con diálogo rioplatense como manda VEO_RULES).
  `parse` = texto plano (sin JSON).
- Entrada en `functionCatalog.ts` con tier `sonnet`.
- UI: habilitar el botón "Generar prompt" de `VideosTab.tsx:136-140` → modal simple (textarea
  descripción + toggle talking-head/b-roll) → resultado en bloque monoespaciado copiable (mismo
  patrón de copiado que PasoPack). Borrar el TODO.
- Test del prompt builder (con brief vacío → error claro, no llamada).

---

## Orden, commits y cierre

1. **Orden estricto:** WO-0 → WO-1 → WO-2 → WO-3 → WO-4 → WO-5 → WO-6 (a→b→c). WO-1..3 desbloquean
   el multi-formato (el norte); WO-4 hace útil el editor; WO-5/6 lo pulen. Cada WO es verificable solo.
2. Un commit por WO, gates verdes ANTES de cada commit (invariantes). Push a master al final de cada
   WO verde (deploy es manual por Netlify CLI — el push no dispara nada).
3. **Cierre de la ronda:** reporte visual (estándar `base-compartida/14-REPORTES-VISUALES.md`) en
   `docs/reportes/` consolidando: qué se cableó por WO, capturas del editor persistiendo y del
   multi-formato, y los datos de verificación reales (dims de ffprobe, tests). HTML autocontenido +
   PDF, dark-theme, iconos SVG, cero emojis.
4. Actualizar `docs/rediseno/06-PENDIENTE-MODELO-SUPERIOR.md` marcando cada T como resuelto con su
   commit, y borrar TODOS los `TODO(modelo-superior)` que cada WO cablea (quedan cero al final —
   verificar con grep).

## Qué NO hacer (lista negra explícita)

- NO delegar NADA a Sonnet/Haiku (directiva del dueño; subagentes solo Opus).
- NO renombrar `Comercial`→`Pieza` (D1, diferido).
- NO tocar `VEO_RULES` ni reescribir cuerpos de prompts calibrados (D4).
- NO agregar campos a `MontajePlan` que el render no ejecute (D5) — ni "para después".
- NO sacar la persistencia de App.tsx (dueño único) ni duplicar la UI de render fuera de PasoMontaje.
- NO inventar datos, textos, prompts ni posiciones "plausibles": vacío honesto + marcado.
- NO deployar: media-studio es trabajo local; el ciclo es codear→build→vitest→verificar en :5301/front.
