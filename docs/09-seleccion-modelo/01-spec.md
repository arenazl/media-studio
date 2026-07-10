# Selección de modelo para "Generar con IA" — spec

> **Para quién:** Sonnet implementador (tarea acotada, ~3 archivos). Autosuficiente.
> **Ruteo:** Sonnet (mecánico). **Fable especifica, no codea.**
>
> **NO EJECUTAR EN PARALELO con el rework visual (docs/08):** este WO toca `pasoKit.tsx` y
> `Topbar.tsx`, que el rework UI también toca. Se ejecuta DESPUÉS de que UI-1→UI-5 estén
> commiteados (lección del día: dos que escriben sobre lo mismo sin coordinación = datos pisados).

## Contexto (verificado contra el código, 2026-07-10)

- `server/index.mjs` → `runClaude()` (~:152) lanza `claude -p ...` **SIN `--model`** → toda
  generación corre con el default del CLI del usuario, que hoy es **Fable, el modelo más caro**
  (verificado en su settings). Un caption de Instagram está corriendo a precio Fable.
- `src/lib/functionCatalog.ts` ya tiene `model: 'opus'|'sonnet'|'haiku'` POR FUNCIÓN (strategy/
  script/concept/cast/storyboard/flowpack → opus · qa → sonnet · publish → haiku) con el comentario
  "overrideable desde settings" — **es metadata muerta**: `runMolde` (pasoKit) no la manda,
  `/api/run-function` no la lee, `runClaude` no la pasa.
- No existe UI de ajustes de modelo.

## Objetivo

1. Que cada función corra por default con SU tier del catálogo (la intención original — ahorro
   inmediato: publish deja de costar Fable y pasa a Haiku).
2. Que el usuario pueda FORZAR un modelo global ("estoy corto de créditos → todo Sonnet") desde
   un ajuste simple, persistente.

## Diseño (mínimo, retro-compatible)

### WO-M1 — Server (`server/index.mjs`)
- `runClaude(prompt, { model, ... })`: si `model` viene y está en la whitelist
  `['opus','sonnet','haiku']`, agregar `'--model', model` a los args (el CLI acepta esos alias).
  Valor fuera de whitelist → ignorar (cae al default, jamás inyectar strings arbitrarios al spawn).
- `runAI({ prompt, allowedTools, model })` lo pasa a `runClaude`. En modo prod (Gemini) se ignora.
- `/api/run-function`: leer `body.model` (string tier) y pasarlo a `runAI`. Sin `body.model` →
  comportamiento actual (default del CLI). Loguear a consola qué modelo corrió (1 línea).

### WO-M2 — Front
- **`src/lib/settings.ts` (NUEVO, puro):** `getAiModel(): 'auto'|'opus'|'sonnet'|'haiku'` /
  `setAiModel(v)` sobre localStorage `ms.settings.aiModel`, default `'auto'`. Con test unitario
  (patrón de los tests existentes de lib).
- **Resolución en `pasoKit.runMolde`:** `const tier = getAiModel(); body.model = tier === 'auto'
  ? getFunction(functionId)?.model : tier;`. Mismo cambio en los OTROS puntos que pegan a
  `/api/run-function`: `ProjectWizard.tsx` (strategy) y cualquier otro (grepear `run-function`).
- **UI del ajuste:** en el engranaje de la `Topbar` (si hoy no abre nada, crear un popover
  mínimo "Ajustes"): select "Modelo de IA" con 4 opciones y leyenda de costo:
  `Auto (recomendado — cada paso usa su modelo)` · `Opus (máxima calidad, caro)` ·
  `Sonnet (equilibrado)` · `Haiku (económico)`. Persistir con `setAiModel`. Estilo: tokens del
  sistema visual nuevo (`--st-*` si UI-1 ya está mergeado; NO inventar hex sueltos).
- **Transparencia de gasto:** bajo el botón "Generar con IA", hint chico con el modelo efectivo
  (ej. "IA: sonnet"). OPCIONAL (si sale barato): `/api/run-function` ya parsea `total_cost_usd`
  del stream — devolverlo como `cost` y mostrarlo tras generar ("~$0.12").

## Aceptación

1. Con ajuste en `auto`: generar Publicación → el server loguea `haiku`; generar Guion → `opus`.
2. Forzar `sonnet` global → TODAS las funciones loguean `sonnet`. F5 → el ajuste persiste.
3. Sin ajuste guardado (usuario nuevo) → `auto`. `body.model` ausente → el server no rompe.
4. Gates estándar + las 5 reglas de contingencia (`base-compartida/8-REGLAS-CALIDAD-CODIGO.md`
   §Regla 2): salida completa sin warnings nuevos, tsc/eslint 0, `npx vitest run --pool=vmThreads`
   verde (174 + los nuevos de settings), gate visual del popover (captura).
