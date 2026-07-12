# Media Studio — Handoff técnico para Claude Code

> Documento guía para implementar el rediseño (`prototipo.dc.html`) sobre el stack real.
> El prototipo es la **fuente de verdad visual y de interacción**. Este doc mapea cada pantalla
> a los endpoints, tipos y archivos reales, y marca qué reusar vs. qué construir.
>
> Stack: React + Vite + TS (front) · Node HTTP nativo + SQLite (`--experimental-sqlite`) (back).
> Local-first (`localStorage ms.projects.v3`) + dual-write a SQLite. `App.tsx` = dueño único del estado.

---

## 0. Regla de oro

**No tomes decisiones de diseño.** Todo está resuelto en el prototipo: layout, densidad, jerarquía,
estados, copy, colores, iconografía. Si algo no está en el prototipo, preguntá antes de inventar.
El prototipo prioriza *un solo sistema* — mismo shell, mismo lenguaje visual en todas las pantallas.

## 1. Sistema de diseño (tokens)

```
/* Fondo */
--bg-app:      #14110C   /* base de la app */
--bg-rail:     #100D09   /* rail, paneles laterales, timeline */
--surface-1:   #1C1811   /* cards, inputs */
--surface-2:   #2A241C   /* chips, tracks, hover */
--border:      rgba(255,255,255,0.06)
/* Texto */
--ink:         #F5F1E8 · --ink-2: #D8D2C6 · --ink-dim: #A69E8E · --ink-mute: #8A8375 · --ink-faint: #5A5348
/* Marca / roles (ESTRICTO) */
--green:  #00B37E   /* vos / sistema / progreso / acciones / "hecho" */
--gold:   #FFB800   /* momentos de IA + "elegido/generado" */
--blue:   #4AA3FF   /* estado "editado" / info */
--danger: #FF4D4D
/* Acentos de app externa (KSP) — del brand del KB, NO hardcodear salvo demo */
Munify #7C5CFF · Hablah #FF5C8A · EventMarker #00B37E · Tasar #4AA3FF
```
**Roles de color (no romper):** verde = usuario/sistema/progreso/acción; dorado = IA y selección;
azul = editado/info. El caos actual de "dorado en todos lados" fue el problema principal a corregir.
**Tipografía:** `Sora` (600/700) display/títulos/numerales. `Inter` (400/500/600) UI. `JetBrains Mono`
timecodes/prompts/archivos/valores. **Radios:** cards 12–16 · inputs/botones 9–11 · pills 999.
**Animación:** fades+slides `cubic-bezier(0.2,0.8,0.2,1)`, 150ms UI / 240ms paneles.

## 2. Arquitectura de navegación

Shell = **rail izquierdo (74px)** + **columna principal**. Rail = navegación global:

| Ítem | Ruta | Pantalla |
|------|------|----------|
| Inicio | `home` | Dashboard: piezas + integraciones KSP |
| Formatos | `formats` | Catálogo de formatos (el norte) |
| Integrar | `ksp` | Integraciones KSP |
| Videos | `videos` | Workspace de videos |
| Audio | `audio` | Workspace de audio |
| (contextual) | `project` | Workspace de proyecto (pipeline) |
| (contextual) | `wizard` | Nueva pieza |
| (contextual) | `editor` | Editor multipista |

`project`/`editor`/`wizard` se abren desde otras vistas, no viven en el rail. Router por estado (`route`).

## 3. Modelo de datos (tipos REALES)

`src/lib/comercial.ts` (`Comercial`, `EstadoPaso`, `pasosVisibles`, `pasoHabilitado`, `escenasAPrompts`).
No reescribir — el prototipo se monta encima.
```
negocio → concepto → guion → cast → storyboard → pack → (render) → rodaje → montaje → publicar
EstadoPaso: pendiente→--ink-faint · generado→--gold · editado→--blue · aprobado→--green
tipo 'filmado' → cast+pack+rodaje, SIN render (9) · 'animado' → render, SIN cast/pack/rodaje (7)
```
**tipo es POR PIEZA, no global.** Spine = `pasosVisibles(comercial.tipo)`. No toggle global.

## 4. Ingesta KSP (reusar)

`src/lib/knowledgeBase.ts` + `src/KbInspector.tsx`/`KbImport.tsx`.
```
GET /api/kb/apps · POST /api/kb/fetch (server pone X-KB-Key) · POST /api/kb/inspect|plan
```
KB on-demand sin cache. `kbToProjectInput` → `kbToBrief` (Negocio) + `kbToBrandKit` (Marca) + `screens[]`.
Pantalla Negocio&Marca = brief + KBBrand (paleta, fonts, phonetic, tono, do_not_say). Apps: munify,
hablah, eventmarker registradas; tasar/ACM tiene endpoint pero NO registrada (mostrar "Pendiente").

## 5. Motor de IA (moldes)

Pasos inteligentes → `POST /api/run-function` → `server/functions.mjs` (Claude headless, 1 llamada/molde).
Moldes: concepto, guion, cast, storyboard, flowpack, qa, publicar. Modelo por tier (settings). Botones
"Generar con IA" → run-function. `VEO_RULES` = calibración única de idioma/cámara (prompt inglés + diálogo
rioplatense). Motion graphics animado → `POST /api/mockup-reel` (Playwright) = pantalla Render.

## 6. Pantalla por pantalla — ver prototipo. Resumen:

- **home:** grid piezas (`GET /api/projects`) + barra integraciones (`GET /api/kb/apps`) + CTA wizard.
- **wizard (Formato-primero):** paso1 Formato (§8), paso2 app fuente KSP. Al crear: `kbToProjectInput` +
  `tipo` derivado de `Formato.tecnicaProduccion`.
- **project:** spine izq = `pasosVisibles(tipo)` + gate `pasoHabilitado`. Copiloto der contextual. Centro
  por paso: Negocio(brief+brand)·Concepto·Guion·Cast·Storyboard·Pack·Render·Rodaje·Montaje·Publicar.
- **videos/audio:** workspaces independientes (lista+detalle) antes del multipista.
- **editor:** multipista (§9). **formats/ksp:** §8/§4.

## 7. Montaje = orquestador + render final

`POST /api/render-comercial` → `server/renderComercial.mjs` (ffmpeg): concatena tomas + voz off
(`audioRef`) + música con ducking + silencios + logo quemado (`/api/brand-asset` proxy) → mp4 9:16.
UI: insumos (checklist) + pipeline de render por etapa + QA holístico (molde `qa` → `QaResult`
persistido). `/api/render` DEPRECATED.

## 8. El norte — `Formato` entidad de primer nivel

```ts
interface Formato { id; nombre; aspecto:'9:16'|'1:1'|'4:5'|'16:9'; duracionObjetivo;
  plataforma:'instagram'|'meta-ads'|'youtube'|'tiktok'|'tv';
  tecnicaProduccion:'filmado'|'animado'|'mixto'|'slideshow'|'3D';
  specsEntrega:{bitrate;safeAreas;limitesTexto;ctaNativo}; moldeGuion; moldeRender; }
```
Se reusa: ingesta KSP + cerebro (concepto/guion/cast/storyboard agnósticos). Se agrega: perfil Formato al
crear (renombrar `Comercial`→`Pieza`); moldes guion por duración/plataforma; capas render (1:1/16:9/
slideshow/anim/Meta Ads); catálogo de formatos. En Publicar, "reutilizar en otro formato" = nueva pieza
reusando concepto+guion.

## 9. Editor multipista

Consolidación entre Montaje y Publicar. Auto-armado por IA; el usuario ajusta. 3 zonas + toolbar:
- **Toolbar:** back·undo/redo/split/duplicar/eliminar·Vista previa·"Listo→Publicar". Chips "Auto-armado",
  "Guardado".
- **Biblioteca (izq):** tabs Clips/Audio/Texto/Efectos/Marca + buscador + items arrastrables. Colapsable a
  riel + ancho arrastrable (190–420px).
- **Preview (centro):** frame 9:16 (video+texto+CTA+logo+safe-area) + transport.
- **Inspector (der):** contextual (transform/opacidad · texto · audio volumen/ducking/fades · transición).
  Colapsable + arrastrable (220–440px).
- **Timeline (abajo):** ruler+playhead + pistas Video/Texto/Voz/Música/SFX/Efectos. Clips con thumbnail,
  audio waveform, marcadores de transición (◇ disolvencia / ▮ corte). Colapsable + alto arrastrable
  (120–420px).
Estado UI (anchos/colapso/playhead) en localStorage propio. Pistas: video=`rodaje[]`/`renderRef`,
voz=`audioRef`, música+SFX (biblioteca), texto=overlays, efectos=transiciones/filtros del render.

## 10. Endpoints (`server/index.mjs`)
```
/api/run-function POST · /api/kb/apps GET · /api/kb/fetch POST · /api/kb/inspect|plan POST
/api/projects[/:id] CRUD · /api/projects/:id/assets POST (ffprobe) · /api/mockup-reel POST
/api/tts/voices|generate|cadence · /api/render-comercial POST · /api/brand-asset GET
/api/videos|/cloud-videos/*|/classify-video · /api/render|/assemble (DEPRECATED /render)
```
Archivos: `src/lib/comercial.ts`·`knowledgeBase.ts`·`projects.ts`·`App.tsx`·`Pipeline.tsx`·
`pasos/Paso*.tsx`·`server/functions.mjs`·`renderComercial.mjs`·`mockupReel.mjs`.

## 11. Orden de implementación
1. Shell + tokens + router (rail, columna, rutas). Sin lógica.
2. Inicio + Integrar (read-only sobre /api/projects y /api/kb/apps).
3. Proyecto: spine + Copiloto sobre `Comercial` existente.
4. Pasos read/edit: Negocio, Concepto, Guion.
5. Wizard Formato-first + entidad `Formato` mínima.
6. Cast/Storyboard/Pack/Render/Rodaje (contenido por tipo).
7. Workspaces Videos/Audio.
8. Montaje (orquestador) + Publicar.
9. Editor multipista (resizables/colapsables).
Cada punto: comparar 1:1 contra el prototipo antes de cerrar.
