# Fase 2 — Pipeline UX: el stepper de producción reemplaza las tabs

> **Prerrequisito:** Fase 1 mergeada (tipos `Comercial` + moldes concept/cast/storyboard/flowpack).
> **Shippable:** al terminar, el journey KB → concepto → guion → cast → storyboard es navegable,
> TODO lo generado se persiste al instante, y el usuario siempre ve en qué paso está.

## Hallazgos de la auditoría que esta fase arregla (los "inusable")

1. **Las tabs son cajones de herramientas** (Negocio/Audio/Prompts/Videos/Editor), no un proceso.
   Nadie te dice el próximo paso ni qué falta.
2. **Lo generado se PIERDE**: `FunctionRunner` y `VeoPanel` guardan el resultado en `useState` y
   jamás llaman `saveProject` — regenerás un guion, cambiás de tab, y perdiste los tokens.
3. **Dos caminos de creación contradictorios**: el CTA de Integración (KB) y el "Nuevo" del ABM
   (proyecto en blanco que te tira a un Editor vacío). `NewProjectWizard` tiene además un paso
   muerto (`StepReels`) que no recolecta nada.
4. **Wizard todo-o-nada**: si falla la pieza 3 de 4, "Reintentar" re-corre TODO desde strategy.
5. **El audio es efímero**: el mp3 de VoiceStudio vive como objectURL en `App.useState` — F5 y no está.
6. **Doble persistencia desconectada**: el front NUNCA llama `/api/projects` (SQLite huérfano);
   todo vive en localStorage (~5MB, un "Clear site data" borra la campaña).

## Decisión de arquitectura (fijada — no re-discutir)

- `Comercial` vive DENTRO de `ProjectReel` (1 reel = 1 comercial; 3 approaches = 3 reels), como
  definió la Fase 1. **La fuente de verdad pasa a ser server-first**, con estos contratos EXACTOS
  (verificados contra el backend real):
  - **Escritura:** dual-write = localStorage + **`POST /api/projects` (SIN id en el path) con
    `{ id, name, data }`** — ese endpoint upsertea (`db.saveProject`, db.mjs:68-79). OJO: NO usar
    `POST /api/projects/<id>`: devuelve **404 si el proyecto no existe** en SQLite (index.mjs:745-748),
    y como SQLite está huérfano, el primer write de TODO proyecto fallaría.
  - **Lectura:** `GET /api/projects` hoy lista SOLO `id/name/created_at/updated_at` **SIN `data`**
    (db.mjs:58-60). Extender `listProjects()` del server para incluir `data` (o `?full=1`), o cargar
    como lista + `GET /api/projects/<id>` por proyecto. Elegir UNA y documentarla en el código.
  - **Hidratación (el store hoy es 100% SÍNCRONO y se consume EN RENDER** — `App.tsx:36` hace
    `listProjects()` por render): NO volver async las firmas. Patrón fijo: localStorage como estado
    inicial síncrono + **sync async al montar** (hook `useProjects`: fetch del server → merge por
    `updated_at` más nuevo → setState + persist local). `Topbar`/`ProjectsABM` consumen el hook.
  - Fallback: si el server no responde, todo sigue andando solo con localStorage (la app es local,
    el backend casi siempre está).
- Los ARCHIVOS (mp3 de voz, clips, mp4) van a `server/storage` vía `saveAsset` — nunca a
  localStorage/IndexedDB como fuente de verdad (IndexedDB queda como cache de preview).

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/lib/sections.ts` | REESCRIBIR — las secciones pasan a ser los pasos del pipeline |
| `src/Topbar.tsx` | ADAPTAR — muestra el stepper (pasos + estado) en lugar de tabs planas |
| `src/PipelineStepper.tsx` (+ css) | **NUEVO** — el stepper renderiza `pasosVisibles(comercial.tipo)` (9 filmado / 7 animado), iconos lucide (SVG, jamás emojis), estado visual por paso (`pendiente/generado/editado/aprobado`), click navega; el slot 6 se rotula PACK o RENDER según tipo |
| `src/pasos/PasoConcepto.tsx` | **NUEVO** — corre `concept` (con el `angulo/creativeBrief` del comercial), muestra 2-3 tarjetas, "Elegir este" persiste; **acá vive el selector de TIPO** (filmado/animado, default `filmado`) — cambiarlo después del paso 5 conserva el storyboard y resetea pack/render |
| `src/pasos/PasoGuion.tsx` | **NUEVO** — guion estructurado editable (bloques con rol), regen por bloque |
| `src/pasos/PasoCast.tsx` | **NUEVO** — hojas de personaje + locación, `fisicoEn` visible y editable (con warning: "esto se pega VERBATIM en todos los prompts") |
| `src/pasos/PasoStoryboard.tsx` | **NUEVO** — tarjetas de escena (n, rol, plano, durSec, diálogo, continuidad), editable, regen por escena |
| `src/lib/projects.ts` | EXTENDER — dual-write + hook `useProjects` (hidratación async, ver arriba) |
| `server/db.mjs` + `server/index.mjs` | EXTENDER — `listProjects()` con `data` (o `?full=1`) |
| `src/ProjectsABM.tsx` | ADAPTAR — consume `useProjects` (hoy relee localStorage por render) |
| `src/App.tsx` | ADAPTAR — monta el paso activo; el flujo import→wizard aterriza en el paso `concepto` |
| `server/functions.mjs` | ADAPTAR el molde `script` — ver §Molde script |
| `src/ProjectWizard.tsx` | REESCRIBIR el interior — ver §Generación |
| `src/GuidedPanel.tsx`, `src/FunctionRunner.tsx`, `src/VeoPanel.tsx` | DEPRECAR gradual — quedan montados SOLO para `publish`/`qa` hasta la fase 5 (no borrar todavía) |

## La UX del paso (patrón único, se repite en los 4 pasos nuevos)

```
┌──────────────────────────────────────────────────────────┐
│ [Stepper: 1 Negocio ✓ · 2 Concepto ● · 3 Guion ○ · …]   │
├──────────────────────────────────────────────────────────┤
│  TÍTULO DEL PASO + 1 línea de qué es                     │
│                                                          │
│  [contenido generado, EDITABLE inline]                   │
│   · vacío → botón grande "Generar con IA"                │
│   · generado → contenido + "Regenerar" (+ regen por ítem)│
│                                                          │
│  [Aprobar y seguir →]   (persiste estado='aprobado',     │
│                          navega al paso siguiente)        │
└──────────────────────────────────────────────────────────┘
```

**Regla dura de persistencia:** TODA respuesta de `/api/run-function` y TODA edición inline llaman
`saveProject` en el acto (debounce 500ms para ediciones). Cero estado generativo que viva solo en
`useState`.

**Estados** (helpers de Fase 1): generar → `generado`; editar → `editado`; aprobar → `aprobado`.
El stepper pinta cada paso según `comercial.estados` y muestra el paso activo.

## Generación (reemplazo del wizard todo-o-nada)

- El "Comenzar" post-import ahora genera SOLO: `strategy` (los 3 approaches → 3 comerciales con
  `nuevoComercial(angle, 'filmado')` — tipo default filmado, el usuario lo cambia en CONCEPTO —
  guardando `angulo` y `creativeBrief` en cada uno) + el `concept` del primero (con SU angulo).
  Aterriza en el paso CONCEPTO. Rápido y barato.
- Cada paso se genera cuando el usuario llega (on-demand) o con **"Generar todo lo que falta"**
  (botón en el stepper): corre la cadena paso a paso, **persistiendo cada resultado apenas llega**
  (si falla el paso 4, los pasos 1-3 quedaron guardados y el retry arranca del 4). **La cadena
  FRENA en los pasos con elección humana pendiente** (concepto sin elegir) y lo señala en el
  stepper — JAMÁS auto-elige: elegir el concepto es EL momento de dirección creativa del usuario.
- La cadena pasa artefactos COMPLETOS: `concepto` elegido → `context.piece.concepto`; guion
  estructurado → `context.piece.guion`; cast → `context.piece.cast`; storyboard →
  `context.piece.storyboard`. (Los moldes de Fase 1 ya los leen así.)

## Molde script (adaptación — el único molde legacy que se toca en esta fase)

El molde `script` actual produce `blocks:[{role:'hook|funcionamiento|beneficio|cierre', narration, visual}]`.
Se adapta a `GuionEstructurado` (visión §5): roles **`hook|desarrollo|gag|cta`** + `durSec` estimado
por bloque, recibiendo `context.piece.concepto` (el elegido) como input principal. Conservar: regla
GLOBAL, calibración TTS ~2.7 palabras/seg, regen por bloque (`regenerate:{index,blocks}`), y el
`music.mood`. El bloque `gag` es obligatorio cuando el concepto es humorístico; si no, es el
"remate/prueba" (mismo rol narrativo: el momento fuerte ANTES del CTA). `PasoGuion` guarda el
resultado ENTERO en `comercial.guion` (no aplanar a `string[]` — ese era el bug de `kitToProject`);
el `guion: string[]` legacy del reel se sigue llenando con las `narration` para que VoiceStudio
funcione sin cambios.

## Creación de proyectos (unificar)

- El camino ÚNICO destacado: **"Nuevo desde una Integración (KB)"** → KbInspector → Comenzar.
- `NewProjectWizard` (proyecto en blanco) se reduce a un item secundario "Proyecto vacío (avanzado)"
  y se le elimina el paso muerto `StepReels`. NO invertir esfuerzo en él.

## Audio persistente (fix del objectURL efímero)

Al generar voz en VoiceStudio: subir el mp3 a `POST /api/projects/<id>/assets` (existe, huérfano —
revivirlo) o `saveAsset`, y guardar `voiceConfig.audioRef = <url /api/storage/...>`. `App.audioByReel`
se rellena desde `audioRef` al abrir el proyecto (fetch → objectURL solo como cache de sesión).

## Qué NO hacer

- NO tocar todavía el editor/montaje (fase 4) ni el render.
- NO borrar GuidedPanel/FunctionRunner/VeoPanel: `GuidedPanel`+`FunctionRunner` quedan accesibles
  desde un ítem provisorio "Herramientas" (para `publish`/`qa`, que recién tienen pantalla propia en
  fase 5); `VeoPanel` es la UI del molde `veo` legacy — queda hasta que `flowpack` lo reemplace (fase 3).
- NO agregar router/URLs (deseable, pero fuera de alcance — anotarlo como deuda).

## Verificación

1. `npx tsc --noEmit` + `npx eslint src/ --ext .ts,.tsx` + `npm test` + `npm run build` — verdes.
2. Manual end-to-end (backend levantado): importar Munify → Comenzar → caer en CONCEPTO →
   elegir → GUION → CAST → STORYBOARD, aprobando cada paso.
3. **Prueba de persistencia (la clave):** en cada paso, F5 → lo generado/editado SIGUE ahí.
   Además `curl localhost:5301/api/projects/<id>` devuelve `data` con el comercial completo
   (el endpoint por-id es el que trae `data`; el list solo si se extendió con `?full=1`).
4. Prueba de retry parcial: cortar el backend a mitad de "Generar todo lo que falta" → reintentar
   → NO re-corre los pasos ya guardados.
5. El stepper refleja los estados correctos tras cada acción (verificar los 4 estados).
