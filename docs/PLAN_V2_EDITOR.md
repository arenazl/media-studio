# Plan v2 — Editor único de videos promocionales (agnóstico)

> Objetivo: un **integrador único** para armar videos promocionales de **cualquier
> cosa**, con **generadores satélite** separados (cada uno con su propio
> procesamiento). Todo lo visual se compone en UNA pantalla; lo que es "fábrica de
> material" vive aparte.

---

## 1. Arquitectura de pantallas

### Integrador (pantalla ÚNICA) — el "Editor"
Donde se arma el video. Timeline multi-capa + preview 9:16 + fuentes (paneles
colapsables, todos el control común `SourcePanel`). Capas (panel arriba + canal abajo):

| Capa | Vista panel | Canal timeline |
|---|---|---|
| **Animaciones / Mockups** | grid | sí |
| **Video** (b-roll) | grid | sí |
| **Música** | chips | sí |
| **Voz** | chips | sí |
| **Transiciones** *(nueva)* | chips (presets) | sí (en uniones) |
| **Efectos** *(nueva)* | chips (presets) | sí (rango) |
| **Texto / Títulos** *(nueva)* | chips (presets) | sí (rango) |

Más: regla de tiempo, playhead único, **Generar video** (render), guardar/retomar montaje.

### Generadores satélite (pantallas SEPARADAS — quedan aparte a propósito)
- **Generador de Audio** (VoiceStudio) — voz, markers, export mp3.
- **Generador de Mockups** (animaciones) — produce las plantillas/slides.
- **Generador de Prompts Flow** (VideoPromptBuilder) — prompts para Veo/Flow.

### Biblioteca de Videos (sección propia, MUY mejorada)
Se queda, pero rediseñada (ver Fase 3). También accesible como panel del editor.

---

## 2. Fases (orden de ejecución, ciclo codear→test→iterar)

### Fase 1 — Capas Transiciones + Efectos en el editor  ← EN CURSO
- Modelo de **transición** (entre clips: cut · fade · crossfade · wipe · zoom) y
  **efecto** (rango: ken burns · viñeta · grano · glow · B&N).
- Paneles `SourcePanel` (presets) + **canales** en la timeline.
- **Preview en vivo**: el efecto activo se ve aplicado al preview (filtro CSS) — feedback
  inmediato sin render server.
- Lógica pura (`effectAtPx`, presets) + unit tests.

### Fase 2 — Capa Texto / Títulos
- Canal de texto + panel (presets: título, lower-third, CTA, logo).
- Editor por clip: contenido, estilo (token de marca), posición, in/out.
- Render del texto en el preview (overlay) + en el plan de render.

### Fase 3 — Biblioteca de Videos: ORGANIZADOR (no editor)
> **Propósito**: ORGANIZAR el material, NO editar video. Los videos los genera Flow
> (mucho mejor que nosotros); acá se **catalogan, encuentran y reutilizan**. Que deje
> de ser "una marquesina de imágenes" y tenga utilidad real de gestor.
- **Categorización**: tags/carpetas, agrupado por categoría; **thumbs chicos**; varios
  menúes/filtros (tipo, proyecto, fecha, tag).
- **Selector de proyectos**: ver y **reutilizar videos de otros proyectos** en el actual.
- Búsqueda/orden (base con `SourcePanel`), subida, multiselección, renombrar/taggear,
  marcar favoritos, "mandar al editor".
- Crece sin volverse caótico (paginado/virtualizado si hace falta).

### Fase 4 — Navegación unificada
- Sidebar: **Editor · Audio · Mockups · Prompts · Videos**.
- "Reel" → "Editor"; absorber "Montaje" (ya migró a capas); "Export" → botón
  **Generar video** dentro del editor.

### Fase 5 — Render real + persistencia (endpoints)
- **Endpoint `/render`** (media-service, ffmpeg): recibe el **plan del montaje**
  (JSON: tracks + clips + transiciones + efectos + texto + audio) → devuelve **mp4**.
- El editor arma el plan completo (extiende `buildPlan`, hoy sólo audio).
- **Guardar/cargar** el montaje por proyecto (retomar donde dejaste).

### Fase 6 — Agnóstico / pulido
- Fuentes de animaciones/mockups **genéricas por config** (no atadas a Munify).
- Logo/marca overlay configurable. Plantillas de promo reutilizables.

---

## 3. Principios

- **Un solo control** de fuentes (`SourcePanel`): toda capa nueva es una instancia.
- **Lógica pura testeada** (`lib/*` + vitest) antes de cablear UI.
- **Agnóstico**: cero copy de app en los componentes; las fuentes entran por data.
- **Local-first**: se trabaja en local; deploy de media-studio es manual aparte.
- Ciclo **codear → build → unit tests → iterar** hasta que ande (incl. endpoints).

---

## 4. Estado

- [x] Control común `SourcePanel` + audio por frase + timeline base (commit 4f3e296).
- [ ] Fase 1 — Transiciones + Efectos (en curso).
- [ ] Fases 2–6.
