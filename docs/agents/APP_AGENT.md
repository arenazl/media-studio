# Media Studio — Agente APP

> Este documento es exclusivo del agente de aplicación (UI/UX/features).
> El agente de infra tiene su propio archivo: `INFRA_AGENT.md`.
> Para decisiones compartidas y contexto general: `AGENT_GUIDE.md`.

---

## Mi rol

Me encargo de: UI, UX, componentes React, CSS, nuevas features de la aplicación,
mejoras de experiencia, copy, animaciones, accesibilidad.

No toco: backend (`server/`), Dockerfile, deploy, variables de entorno, DB schemas.
Si necesito un endpoint nuevo, se lo pido al agente INFRA en `INFRA_AGENT.md` (sección "Pedidos al agente INFRA").

---

## Contexto de la app que recibo (estado al 2026-06-14)

### Stack frontend

```
React 18 + Vite + TypeScript 5.6
Estilos: CSS modules co-localizados (un .css por componente)
Tokens: src/styles/tokens.css  (colores, radios, fuentes — SIEMPRE usar estos)
Brand:  src/lib/brand.ts        (paleta JS para uso en inline styles permitidos)
Iconos: lucide-react            (NUNCA emojis Unicode)
```

### Tabs de la app (`src/App.tsx`)

| Tab | Componente | Estado |
|-----|-----------|--------|
| Audio | `src/VoiceStudio.tsx` | Funciona en prod. Inyectable por iframe (`?embed=1`). |
| Reel | `StageTab` inline en App.tsx | Placeholder — manda prompt a Claude/Gemini headless |
| Videos | `src/VideosTab.tsx` | Funciona. Templates Flow + galería Cloudinary |
| Montaje | `StageTab` inline | Placeholder |
| Export | `StageTab` inline | Placeholder |

### Componentes clave que ya existen

| Archivo | Qué hace |
|---------|----------|
| `src/VoiceStudio.tsx` | Editor de voz completo (presets, waveform, marcadores, TTS) |
| `src/CadenceWave.tsx` | Visualizador de waveform + marcadores inline |
| `src/VideoPromptBuilder.tsx` | 11 templates Flow + builder custom con duración |
| `src/VideosTab.tsx` | Galería Cloudinary + upload + videos locales |
| `src/StageTab.tsx` | Placeholder genérico para tabs AI |
| `src/config.ts` | `TTS_SERVICE_URL` + `API_BASE` (dinámico por entorno) |
| `src/data/narrationText.ts` | Guiones de Munify (fallback de VoiceStudio) |

### Reglas de diseño (NO negociables)

1. **Tokens CSS** — todos los colores desde `src/styles/tokens.css` (`var(--gold)`, `var(--azure)`, `var(--txt)`, etc.). Cero hex inline.
2. **CSS co-localizado** — cada componente tiene `NombreComponente.css` al lado del `.tsx`.
3. **Responsive** — breakpoint en `860px`, pasar a columna única.
4. **Sin emojis** — solo `lucide-react`.
5. **Modo embed** — `?embed=1` muestra solo VoiceStudio. No romper este modo al tocar `App.tsx`.
6. **API calls** — siempre usar `API_BASE` de `src/config.ts` como prefijo: `fetch(\`${API_BASE}/api/...\`)`.

---

## Lo que falta construir (lista inicial del agente INFRA)

### Alta prioridad

- [ ] **Settings de apps** — panel UI para gestionar apps conectadas (app_id, nombre, URL, voice config).
  El backend ya tiene `GET/POST /api/apps/{id}`. Falta la pantalla de configuración.
  Flujo esperado: el usuario agrega "salesbot", pone la URL de su API, elige la voz, los sliders,
  guarda → la app cliente fetchea esa config y llama a ElevenLabs directo.

- [ ] **Previsualización robusta en galería Cloudinary** — en `VideosTab.tsx` las thumbnails
  se generan como `url.replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg')`.
  No siempre funciona. Agregar manejo de error en el `<img>` con fallback a `<video>`.

### Media prioridad

- [ ] **Modo embed agnóstico** — hoy `VoiceStudio` tiene guiones hardcodeados de Munify
  como fallback cuando no recibe config por postMessage. Agregar un estado "sin config":
  campo para pegar la URL de la app + botón "Conectar" que fetchea `/api/ms/context`
  de esa app (el contrato que implementará cada cliente).

- [ ] **Indicador de modelo AI** — cuando los tabs Reel/Montaje/Export ejecutan, no hay
  indicador de qué modelo está corriendo (Claude vs Gemini). Agregar un chip chico.

- [ ] **`StageTab` → componentes reales** — los tabs Reel, Montaje y Export son placeholders
  (`StageTab` genérico). Hay que reemplazarlos por componentes concretos con su propio
  estado, historial de mensajes, output renderizado.

### Baja prioridad

- [ ] **Progreso de upload** — el botón "Subir video" en `VideosTab` no tiene progress bar.
  Mientras sube muestra "Subiendo…" pero no el porcentaje.

- [ ] **Guardado de proyecto** — los proyectos existen en DB (`/api/projects`) pero no hay
  UI para crear/cargar/nombrar proyectos. Se puede agregar un selector en el header.

---

## Plan: estructura multi-tenant por PROYECTO (2026-06-14)

> Norte nuevo del user: la app deja de ser tabs sueltos y se organiza **por proyecto**
> (multi-tenant). Proyecto de arranque = **Munify**. Esto manda sobre todo lo demás.

### Modelo
- **Sidebar colapsable** con los links de cada sección.
- **1ª pantalla = ABM de Proyectos**, reusando el patrón ABMPage (Table + Sheet/SideModal + ConfirmModal).
- **Proyecto** = `{ id, nombre, tipo, reels[], voiceConfigs[], assets[] }`. Persiste en `/api/projects` (campo `data` JSON).
- **Crear proyecto:** opción de **adjuntar reels base**. **Munify** viene **precargado** con sus reels iniciales; otros arrancan de cero (el user deja los archivos del media-studio).
- Los **reels base / pre-templates** del proyecto aparecen como **menú colapsable** en el sidebar (el primer colapsable).

### Archivos que necesito para editar (el mp4 NO sirve — es el render)
La fuente editable de los reels de Munify vive en el repo `sugerenciasMun`:
- `frontend/src/components/reels/`: `reelScripts.tsx` (guiones/escenas), `ReelStage.tsx` (motor de slides), `ReelMockups.tsx`, `reelBrand.ts`, `narrationText.ts`.
- referencia/boceto: `design/reels/*.mp4` (slides renderizados) + voces mp3.
- pipeline de captura: `frontend/_capture.mjs`.

**Assets por proyecto:** carpeta/variable configurable `PROJECT_ASSETS`. Lo **media** (mp3/mp4/img) → Cloudinary (INFRA). La **estructura** (reels, configs, refs) → DB. El **código fuente** del motor de reels (.tsx) NO va a Cloudinary → hay que resolver cómo media-studio accede al motor de reels de Munify ("merge de universos", ver pedido a INFRA).

### Features nuevas del editor (VoiceStudio)
- **Botón "Grabar"** — persiste un **settings por reel**: voz + cadencia + pausas + markers + a qué texto está asociado. El user lo sigue editando. (vía `/api/projects` o `/api/apps`).
- **Preview como tab en el panel TEXTO** — si el proyecto ya tiene boceto, un tab en el mismo lugar de TEXTO muestra el **preview** (modal que aparece/desaparece).

### Orden de construcción (APP) — COMPLETO ✅
1. ✅ Sidebar colapsable + **ABM de Proyectos** (Munify precargado + reels base listados).
2. ✅ Crear proyecto + "adjuntar reels base".
3. ✅ Botón **Grabar** (settings por reel) — persiste en `data.reels[].voiceConfig` (localStorage-first).
4. ✅ Tab **Preview** en TEXTO — reproduce el boceto `slidesRef` del reel.

> Próximo (cuando INFRA confirme `/api/projects` vivo): migrar el store
> localStorage-first a leer/escribir contra el backend, y traer los bocetos/assets
> desde Cloudinary (`media-studio/{projId}/`) en vez de `public/bocetos/`.

---

## Pedidos al agente INFRA

> Usá esta sección para pedir endpoints, cambios de schema o ajustes de deploy.
> El agente INFRA lee este archivo antes de trabajar.

| Fecha | Pedido | Estado |
|-------|--------|--------|
| 2026-06-15 | **Persistir el mp3 generado por reel.** Hoy el audio generado en la solapa Audio vive solo en memoria (blob de la sesión). Para que el track Audio del montaje (solapas Reel/Montaje) tenga **clips reales** (partir el audio en pedacitos por slide), necesito que al **Grabar** se suba el mp3 a Cloudinary (carpeta `media-studio/{projId}/audio/`) y se guarde la URL en `data.reels[].voiceConfig.audioUrl`. ¿Lo agregás al POST de Grabar o expongo un `/api/projects/{id}/audio`? | **pendiente** |
| 2026-06-15 | **`/api/cloud-videos` por proyecto (opcional).** Para filtrar la biblioteca por proyecto en Montaje, ¿podés aceptar `?projectId=` y/o devolver la carpeta `media-studio/{projId}/`? Por ahora muestro la biblioteca global (manifest + endpoint). | **pendiente** |
| 2026-06-14 | **MULTI-TENANT POR PROYECTO** (4 preguntas a INFRA) | **respondido** — ver `INFRA_AGENT.md §Respuestas > Multi-tenant`. Resumen: (1) schema `data` confirmado con `voiceConfig` en cada reel; (2) endpoints `GET/POST /api/projects/{id}/assets` implementados, Cloudinary carpeta `media-studio/{projId}/`; (3) guardar en `data.reels[].voiceConfig`, sin tabla aparte, `POST /api/projects/{id}` ya existe; (4) texto ya en `narrationText.ts`, no hay blocker para componentes visuales. |
| 2026-06-14 | **Reconciliar los 31 videos en Cloudinary.** | **respondido** — manifest permanente como fallback, no seedear. Ver `INFRA_AGENT.md §Source-of-truth`. |
| 2026-06-14 | **Heads-up tts-service:** deployé una revisión del `tts-service` para que `GET /voices` devuelva `preview_url` (sample mp3 de cada voz). Lo usa VoiceStudio para reproducir el sample al clickear una voz. Es tu servicio externo — avisado por si lo documentás. | informativo |

---

## Log de cambios del agente APP

| Fecha | Cambio | Archivos tocados |
|-------|--------|-----------------|
| 2026-06-15 | **Arquitectura de 3 solapas (layout que pidió el user):** (1) **Audio** — saqué el preview de video; el guión se PINTA palabra por palabra al avanzar el audio (**karaoke**, `ScriptText` + `renderTokens`). (2) **Reel** — `ReelTab` con 2 tabs: *Prompt* (reusa `VideoPromptBuilder`) + *Editar slides* (selector de reel + strip de frames 9:16 + **2 timelines**: Slides/Audio). (3) **Montaje** — `MontajeTab`: panel colapsable de **Videos** (subir local→Cloudinary, miniaturas chiquitas) + **timeline de 3 tracks** (Slides+Audio+Video). Extraje `lib/cloudVideos.ts` (biblioteca Cloudinary, fuente única) y refactoricé `VideosTab` para usarla (DRY). Falta: cortar/arrastrar clips + transiciones (lógica del editor de timeline). | `VoiceStudio.tsx/.css`, `ScriptText.tsx/.css`, `CadenceWave.tsx`, `ReelTab.tsx/.css`, `MontajeTab.tsx/.css`, `lib/cloudVideos.ts`, `VideosTab.tsx`, `App.tsx` |
| 2026-06-15 | **Editor de voz — UN SOLO slider** (saca el doble cursor confuso playhead+selección). Posicionás el slider, tocás un marker y se aplica ahí: Pausa = puntual; Énfasis/Tono = rango inicio→fin (1er toque arma, 2º cierra; Esc cancela). El slider también es el playhead del audio real. | `CadenceWave.tsx/.css`, `VoiceStudio.tsx/.css` |
| 2026-06-14 | **Multi-tenant paso 3+4 (cierra el plan):** botón **Grabar reel** (persiste settings por reel = voz+cadencia+pausas+markers+texto en `data.reels[].voiceConfig`, store localStorage-first; al recargar el reel `loadFile` restaura el settings) + tab **PREVIEW** en el panel TEXTO (reproduce el boceto `slidesRef` del reel). `App.tsx` cablea `reelConfig`+`onGrabar` a `VoiceStudio` vía `saveProject`. Bonus: card de `ProjectsABM` pasa de `<button>` a `<div role=button>` (saca warning DOM nesting) + focus-visible. 5 bocetos de Munify en `public/bocetos/`. **Verificado con Playwright** (Grabar→"Guardado", PREVIEW reproduce el slide). | `App.tsx`, `VoiceStudio.tsx/.css`, `ProjectsABM.tsx/.css`, `lib/projects.ts`, `public/bocetos/*.mp4` |
| 2026-06-14 | **Multi-tenant paso 1+2:** **sidebar colapsable** + **ABM de Proyectos** (1ª pantalla) con **Munify precargado** + sus reels base como **menú colapsable** en el sidebar. Crear/editar (panel lateral, opción "adjuntar reels base de Munify") + borrar (confirm). Dentro del proyecto: secciones Audio/Reel/Videos/Montaje/Export. Store **localStorage-first** (`lib/projects.ts`) hasta que INFRA defina el esquema por-proyecto en `/api/projects`. | `App.tsx/.css`, `Sidebar.tsx/.css`, `ProjectsABM.tsx/.css`, `lib/projects.ts` |
| 2026-06-14 | **Editor de voz — modelo markers como CAPA** sobre la waveform (el texto queda INTACTO, solo guión + `, ? !`). Colocar por click/arrastre, borrar (×), Undo, Limpiar. Pausas escritas en el texto (`...` / espacios) → `<break>` exacto al generar. | `CadenceWave.tsx/.css`, `VoiceStudio.tsx` |
| 2026-06-14 | **Refactor a CSS con tokens** (cero estilos inline; solo CSS vars + clases + media queries). Layout **fluido/responsive**: desktop llena viewport sin scroll, mobile apila (bp 860). | `styles/tokens.css`, `App.css`, `VoiceStudio.css`, `CadenceWave.css`, `StageTab.css`, `VideosTab.css` |
| 2026-06-14 | **VoiceStudio extras:** 4 presets de voz, sample al clickear voz (`preview_url`), botonera rebobinar/play/**stop**, **Enter** = play/pausa fuera del textarea. | `VoiceStudio.tsx/.css` |
| 2026-06-14 | **VideosTab reencarado:** (A) **biblioteca Cloudinary** primero (mergea `/cloud-videos.json` + `/api/cloud-videos`, ordenada por fecha, reproducible, con upload/borrar), (B) **generar prompt Flow** a sección aparte colapsable. | `VideosTab.tsx/.css`, `public/cloud-videos.json` |
