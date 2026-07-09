# Fase 5 — Comercial animado (6b) + QA holístico + Publicar + limpieza final

> **Prerrequisito:** Fases 1-4. **Shippable:** el producto queda redondo: los dos tipos de
> comercial salen end-to-end, hay control de calidad sobre el comercial ENTERO, y se retira todo
> el código muerto/confuso que la auditoría marcó.

## 1. Bifurcación ANIMADO (paso 6b)

Para `comercial.tipo === 'animado'` el pipeline salta Cast/Pack/Rodaje (`pasosVisibles`, fase 1):
el storyboard se renderiza DIRECTO con el motor existente de reel animado (`server/mockupReel.mjs`,
Playwright + ffmpeg).

- **El molde `storyboard` ya generó escenas orientadas a pantalla** para tipo animado (fase 1:
  `screen` del KB + `accion` = título ≤8 palabras + `continuidad` = palabra a resaltar). El mapper
  `escenasToSlides(storyboard, brand)` en `src/lib/montajePlan.ts` es entonces mecánico:
  `{ badge: escena.screen (o rol), title: escena.accion, accent: escena.continuidad, durSec }`.
- El paso 6b (pantalla `PasoRender.tsx`) llama `POST /api/mockup-reel` — **endpoint EXTENDIDO**:
  acepta `{ slides, brand, projectId?, reelId? }`; si vienen projectId/reelId, **persiste el mp4
  con `saveAsset` server-side y responde `{ fileRef }`** (patrón idéntico a `render-comercial` de
  fase 4) en vez de bytes. (Hoy devuelve bytes crudos y el resultado muere como objectURL — fix de
  auditoría.) El front guarda `comercial.renderRef = fileRef` (campo de la visión §5) y marca el
  paso `render` como `generado` → habilita MONTAJE (voz + música sobre el render, igual que filmado).
- Extender `mockupReel.buildHtml` para `durSec` por slide (hoy 3.4s fijo; cambio menor).

## 2. QA holístico (antes de exportar)

Extender el molde `qa` (existe, hoy evalúa SOLO el texto del guion) para recibir el comercial
COMPLETO (`concepto + guion + cast + storyboard + packFlow.master`) y evaluar los ejes que hacen
"profesional" la salida (la rúbrica actual de 10 ejes se conserva y se suman):

- **Continuidad**: ¿el `fisicoEn` aparece verbatim en todos los prompts? ¿la continuidad entre
  escenas cierra (ropa/luz/lugar)?
- **Arco**: hook ≤2s de gancho, gag antes del CTA, ¿cuenta TODA la propuesta (regla GLOBAL)?
- **Técnica**: talking heads ≥8s, diálogos 24-30 palabras, marca fonética en TODO lo hablado,
  suma de duraciones vs objetivo.
- Salida igual (`score/50 + verdict + issues`) — se muestra en MONTAJE antes del botón Exportar
  (advertencia si < 38, NO bloqueo).

## 3. Paso PUBLICAR (9)

Pantalla final simple: corre `publish` (molde existente — PERSISTIENDO el resultado, que hoy se
pierde), muestra caption/hashtags/CTA con Copiar, lista los exports del comercial
(`montaje.exports[]`) con link/descarga. "Paquete final" = el mp4 + el copy, todo en una pantalla.

## 4. Limpieza final (todo salió de la auditoría — retirar sin miedo, git guarda historial)

| Qué | Acción |
|-----|--------|
| `GuidedPanel.tsx`, `FunctionRunner.tsx`, `VeoPanel.tsx` | BORRAR (publish/qa ya viven en los pasos; era la UI de tabs) |
| Moldes `veo` y `mockup` + sus entradas de catálogo | BORRAR (`flowpack` y el render animado los absorbieron) |
| `strategy` | conservar (lo usa el arranque post-import) |
| `MontajeTab.tsx` | ya borrado en fase 4 (verificar) |
| `NewProjectWizard` paso muerto `StepReels` | ya reducido en fase 2 (verificar) |
| `extractJson` naive de `server/index.mjs` (~131-135, lo usan `/api/kb/plan` **y `/api/tts/cadence`**) | reemplazar por el balanceado de `functions.mjs` (importarlo) — re-testear AMBOS flujos (el plan del KB y "Agregar vida" de VoiceStudio) |
| `/api/render` (solo imágenes, sin caller) | BORRAR endpoint + `renderMp4`/`sceneFilterChain` SI `render-comercial` ya cubre efectos/xfade; si no, dejar deprecated |
| Campo `model` del catálogo (decorativo — runClaude no pasa `--model`) | decidir: implementarlo (agregar `--model` en runClaude, trivial) o quitarlo de la UI. Preferido: implementarlo |
| `sections.ts` LAYOUT por contentType viejo | simplificar: el pipeline es el layout |
| Tab `Videos` dentro del proyecto | pasarle `project` para filtrar por defecto (biblioteca global accesible con un toggle) |

## 5. Pulido de primera impresión

- **Empty states** con propósito: cada paso sin datos explica qué es y qué botón tocar (1 línea +
  CTA). Nada de paneles vacíos mudos.
- **Onboarding de 1 pantalla** al crear el primer proyecto: el pipeline dibujado (los pasos del
  tipo elegido — 9 filmado / 7 animado — con iconos) + "así se produce un comercial acá". Cerrable,
  no vuelve.
- Revisar textos de TODOS los botones: verbos de producción ("Armar el storyboard", "Exportar el
  comercial"), rioplatense, sin jerga interna ("kit", "pieza" → "comercial").

## Verificación

1. Suite estándar verde. Grep de los borrados: 0 referencias vivas a GuidedPanel/FunctionRunner/
   VeoPanel/MontajeTab/moldes veo|mockup.
2. End-to-end ANIMADO: importar KB → pipeline → tipo animado → render → montaje con voz+música →
   export mp4. Verificar estilo (colores de marca, tipografía editorial — comparar contra
   `public/bocetos/tesoreria.mp4`).
3. End-to-end FILMADO completo (el de las fases 3-4) sigue andando.
4. QA holístico devuelve issues coherentes ante un comercial con defectos plantados (probar:
   borrar el `fisicoEn` de un prompt a mano → QA lo detecta).
5. Los dos tests de humo del usuario: (a) una persona nueva entiende qué hacer sin explicación;
   (b) el mp4 final se puede subir a Instagram tal cual.
