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

## Pedidos al agente INFRA

> Usá esta sección para pedir endpoints, cambios de schema o ajustes de deploy.
> El agente INFRA lee este archivo antes de trabajar.

| Fecha | Pedido | Estado |
|-------|--------|--------|
| (pendiente) | | |

---

## Log de cambios del agente APP

| Fecha | Cambio | Archivos tocados |
|-------|--------|-----------------|
| (pendiente) | | |
