# Reglas de implementación del rediseño — directiva del dueño (2026-07-12)

> Para TODOS los agentes que implementen el rediseño. El objetivo de esta ronda es **REPLICAR TODA LA
> INTERFAZ con navegación 100% funcional, SIN inventar la lógica de IA.** El cableado fino de
> prompts/algoritmos lo revisa el modelo superior (Opus/Fable) después.

## Qué SÍ hacer

- **Replicar TODAS las pantallas** del prototipo (`prototipo.dc.html`) fielmente — layout, densidad,
  jerarquía, estados, copy, colores, iconografía. El prototipo es la fuente de verdad.
- **Navegación 100% funcional:** todas las rutas del rail + los flujos (abrir pieza, wizard, editor,
  volver) andan de verdad. La app tiene que quedar **totalmente navegable**.
- **Cablear los DATOS REALES donde el camino esté CLARO y YA EXISTA en el código:**
  - Proyectos: `useProjects` / `saveProject` / los tipos de `src/lib/comercial.ts`.
  - KSP: `GET /api/kb/apps`, `POST /api/kb/fetch`, `src/lib/knowledgeBase.ts`.
  - **Moldes que YA EXISTEN:** `runMolde(<molde>, ...)` → `POST /api/run-function` (concepto, guion,
    cast, storyboard, flowpack, qa, publicar). **Ya están cableados y probados en los `Paso*.tsx`
    actuales — REUSAR ese cableado tal cual, no reescribirlo.**
  - Assets/render/TTS: los endpoints que ya existen (`/api/projects/:id/assets`, `/api/render-comercial`,
    `/api/tts/*`, `/api/mockup-reel`).

## Qué NO hacer — dejar marcado para el modelo superior

- **NO inventar ni suponer prompts, algoritmos o lógica de IA NUEVA.** Si el prototipo pide algo que
  necesita un molde/prompt/algoritmo que **no existe todavía** o del que **no estás 100% seguro** — por
  ejemplo: moldes de guion parametrizados por formato, la entidad `Formato` afectando los prompts, el
  aspect ratio dentro del `flowpack`, el auto-armado por IA del editor multipista — **NO lo implementes a
  medias ni lo adivines**:
  1. Armá la **UI completa** (que se vea y navegue).
  2. Marcá el punto exacto con `// TODO(modelo-superior): cablear <qué> — no inventar el prompt/algoritmo`.
  3. Dejá estado vacío o placeholder **marcado**, NUNCA datos inventados.
- **NO suponer datos.** Si un dato no existe en el proyecto/KB, mostralo vacío o derivado honestamente —
  jamás un valor falso (ni nombres, ni métricas, ni prompts plausibles).
- **NO perder tiempo/tokens** en lógica que no está clara. Preferí dejar la UI lista + el `TODO` y seguir.

## Resultado esperado de la ronda

Una app **100% navegable** con **toda la interfaz** del prototipo, los datos reales cableados donde el
camino es claro, y los puntos de IA sutil **marcados con `TODO(modelo-superior)`** para cablearlos después
con criterio. **Gates verdes siempre:** `tsc` 0 · `eslint` 0 · `vitest run --pool=vmThreads` (los ~240)
verde · `build` sin warnings nuevos. Español rioplatense, sin emojis (solo SVG/lucide), viewport PWA.
