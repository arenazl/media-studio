# Rediseño — Pendiente para el modelo superior (handoff a Fable)

> **Para Fable / Opus.** El rediseño de UI está COMPLETO, navegable, con datos reales y pusheado (5 fases,
> 297 tests verdes, `65b3e79..4d8f9e0` en master). Lo que sigue es el **cableado de IA/algoritmos** que los
> agentes de implementación **NO inventaron** a propósito (directiva del dueño en `REGLAS-IMPLEMENTACION.md`).
> Este doc te deja cada pendiente masticado con su puntero exacto, qué reusar y qué decisión queda abierta —
> para que NO tengas que re-explorar el código. El diseño y el "qué" están resueltos; falta el "cómo cablear".

## Antes de tocar nada (invariantes que el rediseño respetó — no romperlos)
- **`src/App.tsx` = dueño único del estado** (`updateProject`/`persistNow`/`scheduleSave`/`flushPending`/
  `grabarReel`/`persistVoice`/`projectRef`). Blindado y verificado. Cualquier persistencia pasa por acá.
- **Moldes de IA existentes** (`runMolde` → `/api/run-function`, `server/functions.mjs`): reusarlos, no reescribir.
  `VEO_RULES` = calibración única de idioma/cámara.
- **Gate:** `tsc` 0 · `eslint` 0 · `npx vitest run --pool=vmThreads` (297) · `build` sin warnings nuevos.
  Verificá en **ambiente real** (back `:5301` + front), nunca mock — la regla de "verde = probado real" de la casa.
- Fuente del rediseño: `docs/rediseno/` (`prototipo.dc.html`, `HANDOFF.md`, `REGLAS-IMPLEMENTACION.md`).

---

## T1 — Entidad `Formato` (el norte multi-formato) · PRIORIDAD ALTA
**Punteros:** `src/Wizard.tsx:58` · `src/FormatsCatalog.tsx:8` · `src/lib/formatosCatalog.ts:7`
**Estado hoy:** el catálogo de 6 formatos (reel 9:16, reel animado, meta-feed 1:1/4:5, spot-yt/tv 16:9) vive
como data local en `formatosCatalog.ts`. El wizard te deja elegir uno, pero **es metadata cosmética: no
cambia nada de la generación**.
**Qué falta cablear:** el `Formato` elegido tiene que afectar `tipo` (filmado/animado) + los moldes de guion
(por duración/plataforma) + la capa de render (por aspecto).
**Qué reusar:** el shape de `Formato` ya está esbozado en `HANDOFF.md §8` (aspecto/duracionObjetivo/
plataforma/tecnicaProduccion/specsEntrega/moldeGuion/moldeRender).
**Decisión abierta (por eso es tuya):**
- *Mínimo* = derivar `Comercial.tipo` de `tecnicaProduccion` (filmado/animado). El prototipo lo hacía; el
  agente **NO lo copió** porque el mapeo `tecnica→tipo` era "inventar lógica". Vos decidís el mapeo correcto.
- *Completo* = moldes de guion parametrizados por duración/plataforma (un spot de 30s de Meta ≠ un reel de
  8s) + capas de render por aspecto (1:1/16:9, más allá del 9:16 actual). Implica renombrar `Comercial`→`Pieza`
  (HANDOFF §8) → **toca `src/lib/comercial.ts` (el core de datos): cuidado, hay 240 tests sobre eso.**

## T2 — Editor: cerrar el loop (persistir ediciones + render) · PRIORIDAD ALTA
**Punteros:** `src/Editor.tsx:12` · `src/lib/editorEdits.ts:5`
**Estado hoy:** las ediciones del editor (split/duplicar/eliminar/tipo de transición/texto + los overrides de
transform/opacidad/volumen/ducking/fades) viven en un **draft local de sesión** que **NO se escribe de vuelta
al proyecto**. El botón "Listo → Publicar" solo navega.
**Qué falta:** (1) mapear el draft del editor → un `MontajePlan` persistible en `Comercial.montaje`; (2) que
"Listo → Publicar" consolide ese plan y dispare el render.
**Qué reusar:** `src/lib/editorTracks.ts` hace `MontajePlan → pistas` (falta el inverso, `pistas → MontajePlan`);
el render final ya existe (`POST /api/render-comercial` → `server/renderComercial.mjs`).
**Decisión abierta:** el **shape definitivo de `MontajePlan`** — hoy es tipado laxo (`Comercial.montaje: unknown`,
deuda del rework original). Varios overrides del inspector (transform/opacidad/volumen/ducking/texto) hoy son
solo de sesión porque **no tienen campo en `MontajePlan`**; definir esos campos es parte de esta tarea.

## T3 — Editor: auto-armado por IA · PRIORIDAD MEDIA
**Puntero:** `src/Editor.tsx:10`
**Estado hoy:** la timeline se puebla **1:1 mecánico** desde el `MontajePlan`/storyboard (`storyboardToMontaje`).
Funciona como base.
**Qué falta:** el "auto-armado por IA" real — armar la timeline sola con todo lo generado (clips + voz +
música + texto) con criterio de orden/duración/transiciones/ducking.
**Decisión abierta:** ¿molde de IA nuevo o reglas determinísticas? El auto-armado puede ser **algorítmico**
(no necesariamente IA). Vos definís. Si es molde, va en `server/functions.mjs` (patrón de los otros).

## T4 — Menores (UI ya lista, falta el enganche) · PRIORIDAD BAJA
- **Drag biblioteca→timeline** (`src/EditorLibrary.tsx:4`): insertar un item de la biblioteca arrastrándolo a
  la timeline. Mecánico (no IA), pero requiere el modelo de inserción del T2.
- **Link video↔escena** (`src/VideoDetail.tsx:153`): cablear el vínculo cloud-video ↔ escena de Pack Flow que
  lo originó, para poblar "Prompt usado" con dato real. Hay que guardar el vínculo al importar en Rodaje.
- **Videos "Generar prompt"** (`src/VideosTab.tsx:136`): CTA hoy deshabilitado; falta un molde
  `veo-flow-prompter` standalone (fuera de un proyecto). El skill `veo-flow-prompter` ya existe como referencia.

---

## Check (no es TODO, es verificación en ambiente real)
**Molde `strategy` al final del wizard** (código preexistente, NO tocado por el rediseño): el agente no lo vio
resolver en su sandbox (Claude headless anidado tarda +100s). En la máquina real debería correr normal.
Verificá que crear una pieza en el wizard completa (corre `strategy` → abre el proyecto). Si tarda/falla, es
del entorno headless anidado, no del rediseño.

## Orden sugerido
T1 (desbloquea el multi-formato, el norte) → T2 (hace útil el editor) → T3 (pulido del editor) → T4 (detalles).
Cada uno es independiente y verificable solo. Ninguno requiere tocar la navegación (ya anda) ni el dueño único.
