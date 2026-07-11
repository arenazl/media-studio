# Media Studio — Documento técnico del flujo completo

> **Propósito de este documento:** darle a otra IA (o a un ingeniero nuevo) el modelo mental completo
> del sistema: qué es, cómo obtiene la información de otras aplicaciones, cómo opera el motor paso a
> paso, y **hacia dónde va**. Escrito con los nombres reales del código (rutas, endpoints, tipos).
>
> **Fecha:** 2026-07-11 · **Repo:** `d:\Code\media-studio` (independiente) · **Stack:** React+Vite+TS (front) · Node HTTP nativo con `--experimental-sqlite` (back).

---

## 0. Qué es HOY y hacia dónde va (el norte)

**Hoy:** Media Studio es un **generador de comerciales/reels verticales 9:16**, *storyboard-driven*, que
se alimenta del conocimiento de **otras aplicaciones** (no de un formulario que llena el usuario). Toma
lo que una app "sabe de sí misma" (negocio, features, marca, pantallas) y produce el pipeline completo de
un comercial: concepto → guion → personajes → storyboard → prompts para generar el video → montaje final.

**El objetivo (norte explícito):** una **plataforma agnóstica de generación de contenido multimedia**, sin
límite de formato. El mismo motor debe producir:
- reels verticales (9:16) para Instagram/TikTok,
- spots publicitarios para **Meta Ads** (feed 1:1 / 4:5, stories/reels 9:16),
- **animaciones** / motion graphics,
- spots para YouTube/TV (16:9),
- piezas de display, carruseles, etc.

**No es eso todavía** — hoy la única salida "de fábrica" es el reel comercial. Pero la arquitectura ya
separa *qué se cuenta* (concepto/guion/estrategia, agnóstico) de *cómo se produce* (la capa de salida).
Llegar al norte = **abstraer el formato de salida** en un perfil configurable y sumar moldes/renders por
formato, reusando todo el cerebro y toda la ingesta de datos. Ver §8.

---

## 1. Arquitectura en capas

```
┌──────────────────────────────────────────────────────────────────────────┐
│ FRONTEND — React + Vite + TypeScript (SPA)                                 │
│  · Store local-first: localStorage (ms.projects.v3) + DUAL-WRITE a SQLite  │
│  · App.tsx = dueño único del estado del proyecto (un solo mutador)         │
│  · Pipeline.tsx = wizard de pasos (CONTROLLED) + Copiloto contextual       │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ HTTP /api/*
┌───────────────▼──────────────────────────────────────────────────────────┐
│ BACKEND — Node HTTP nativo (server/index.mjs), sin framework               │
│  · SQLite embebido (node:sqlite, --experimental-sqlite) — server/db.mjs    │
│  · Router manual por (pathname, method)                                    │
└──┬──────────┬───────────┬────────────┬───────────────┬────────────────────┘
   │          │           │            │               │
┌──▼───┐  ┌───▼────┐  ┌───▼─────┐  ┌───▼──────┐  ┌─────▼───────────────┐
│Claude│  │ffmpeg  │  │Playwright│  │ElevenLabs│  │ KSP (otras apps)    │
│headl.│  │(render │  │(mockups  │  │(TTS voz  │  │ GET /knowledge-base │
│moldes│  │comerc.)│  │de screens)│ │en off)   │  │ on-demand, sin cache│
└──────┘  └────────┘  └──────────┘  └──────────┘  └─────────────────────┘

   INTEGRACIÓN EXTERNA MANUAL: Google Flow / Veo 3.1 (el usuario genera los
   clips de video ahí con los prompts que produce Media Studio, y los reimporta).
```

**Persistencia (patrón clave):** el front es *local-first* — anda sin backend usando `localStorage`. Cada
`saveProject` hace **dual-write**: además de `localStorage`, un `POST /api/projects` (upsert por id en
SQLite). Al montar, `mergeServerProjects` hidrata **server-first** (el server es la fuente de verdad; los
locales huérfanos se descartan). `App.tsx` es el **dueño único** del proyecto (un solo `updateProject`),
y el `Pipeline` es *controlled* (recibe `project` + `onChange`) — no hay multi-writer.

---

## 2. Cómo obtenemos información de otras aplicaciones (el KSP)

Media Studio **no le pide datos al usuario**: los **importa de la app** vía el **Knowledge Share Protocol
(KSP)**. Es el 2º consumidor del protocolo (el 1º es SalesBot, que genera campañas de venta).

### El contrato
- Cada app del ecosistema expone **`GET /api/knowledge-base`** (+ `/health`), autenticado con header
  **`X-KB-Key`** contra el env `KB_SHARED_SECRET` de esa app.
- El KB se construye **en tiempo real desde la data REAL** de la app (su BD/catálogo/config) — **nada
  hardcodeado**; cada llamada refleja los cambios. **Obtención on-demand, SIN cache.**
- Contrato completo y versionado: `base-compartida/3-PROTOCOLO-COMPLETO.md` (v1.2).
- Registro de apps disponibles: `base-compartida/2-APPS-ENTRADAS.json` (cada app: `id`, `nombre`,
  `servidor`; los generadores —`mediastudio`, `salesbot`— con su `clave`). Apps registradas hoy:
  `munify`, `hablah`, `eventmarker`. (tasar/ACM tiene el endpoint pero **no está registrado** aún.)

### El shape del KB (lo que consumimos) — `src/lib/knowledgeBase.ts`
```ts
KnowledgeBase = {
  contract_version, last_updated,
  business: { name, tagline, description, value_story, industry, target_audience, website },
  key_messages[],            // mensajes que van en CADA pieza (enfoque global)
  offerings[]: { name, description, key_features[] },
  pricing: { model, summary, promotions[] },
  differentiators[], objections[]: {objection, response}, faq[], do_not_say[],
  screens[]: KBScreen,       // METADATA de pantallas (kind/nav/components/data/flow) — NO HTML ni URL
  brand: KBBrand,            // ver desglose completo abajo
}
```

### El bloque BRANDING / MARCA completo (lo que le pedimos a cada app)
`src/lib/knowledgeBase.ts` → `KBBrand`. **Esto es exactamente lo que cada app nos manda como identidad
visual**, y es lo que después alimenta el overlay de logo, los colores de los motion graphics y la
pronunciación de la marca en la voz en off:
```ts
KBBrand = {
  logo:   { primary, light, dark, isotype, svg },      // VARIANTES del logo (fondo claro/oscuro, isotipo, svg)
  colors: { primary, accent, secondary, ink, surface },// la PALETA completa (5 roles de color)
  fonts:  { display, text },                           // tipografías (título / cuerpo)
  style:  { radius, density, vibe },                   // radios, densidad y "vibe" visual
  icons,                                               // familia/estilo de iconos (string | string[])
  phonetic,                                            // cómo se PRONUNCIA la marca (clave para el TTS: "Munify" → "Munifai")
  tone,                                                // tono de comunicación de la marca
  avoid[],                                             // qué NO hacer / decir con la marca (do_not_brand)
}
```
- **Qué usamos HOY** (`kbToBrandKit`): `color = colors.accent || colors.primary`, `logoUrl =
  logo.primary || logo.isotype`, `phonetic`, y posición del logo. Lo demás (paleta completa, fonts,
  style, icons, tone, avoid) **ya llega** pero todavía no se explota en el render — es material disponible
  para cuando el motor pinte los motion graphics con la identidad completa de la app (parte del norte, §8).

**Pantallas como METADATA:** las `screens` viajan como descripción estructurada (`label, kind, headline,
framework, nav[], components[], layout, style, data, flow, route`), **no** como HTML ni screenshot. Media
Studio las **recrea** como motion graphics (§4, `mockup-reel`). Los campos `capabilities/entities/tools`
(1.2) son de SalesBot; Media Studio los ignora (*forward-compatible*).

### La transformación (KB → proyecto)
`kbToProjectInput(kb)` produce el input agnóstico del pipeline:
- `kbToBrief(kb)` → un **brief markdown** (los "hechos" del negocio: propuesta, mensajes clave, ofertas,
  diferenciadores, objeciones, oferta/CTA, do_not_say). Es la capa NEGOCIO.
- `kbToBrandKit(kb)` → el **BrandKit** del proyecto (logo + color + fonética para overlay/TTS).
- `screens[]` → quedan aparte para el reel **animado** (se renderizan como pantallas).

### Endpoints backend del KSP (consumo)
- `GET  /api/kb/apps` — lista las apps del registro (las que se pueden importar).
- `POST /api/kb/fetch` — trae el KB de una app (el server pone el `X-KB-Key`; el front nunca ve la clave).
- `POST /api/kb/inspect` — inspección/validación del KB recibido.
- `POST /api/kb/plan` — plan de piezas a partir del KB.
- UI: `src/KbInspector.tsx` / `src/KbImport.tsx` (botón **"Nuevo proyecto desde una Integración"**).

**En una frase:** el KSP es cómo Media Studio *sabe de qué habla el video* sin que nadie tipee nada — y
por eso **no inventa datos**: todo sale de lo que la app declara de sí misma, al momento.

---

## 3. El motor paso a paso (el pipeline)

La entidad central es **`Comercial`** (`src/lib/comercial.ts`). Un proyecto puede tener varios (cada uno
es una versión/approach). Recorre un pipeline de pasos con **estados** y **gate secuencial**.

### Los pasos (orden canónico)
```
negocio → concepto → guion → cast → storyboard → pack → (render) → rodaje → montaje → publicar
```
**Bifurcación por `tipo`:**
- **`filmado`** (video real de personas): usa `cast` + `pack` (Flow) + `rodaje`; **sin** `render`. 9 pasos.
- **`animado`** (motion graphics de las pantallas del KB): usa `render`; **sin** `cast`/`pack`/`rodaje`.
  7 pasos. Recrea las `screens` del KB como video, no castea personas.

`pasosVisibles(tipo)` filtra; `pasoHabilitado(c, paso)` habilita un paso cuando el anterior visible está
≥ `generado` (gate). Estados por paso: **`pendiente → generado → editado → aprobado`** (`EstadoPaso`).

### Qué produce cada paso
| Paso | Molde | Artefacto (`Comercial.*`) | Qué es |
|------|-------|---------------------------|--------|
| **negocio** | — | `brief` (del proyecto) | Los hechos (del KSP o cargados). |
| **concepto** | `concepto` | `concepto: {idea, tono, estetica, referencia, porQueFunciona}` | 2-3 ideas; el usuario elige una y define `tipo` (filmado/animado). |
| **guion** | `guion` | `guion: {blocks[]: {role, narration, visual, durSec}, music}` | Guion por bloques: hook→desarrollo→gag→cta. |
| **cast** | `cast` | `cast: {personajes[]: CharacterSheet, lugar}` | Fichas físicas (`fisicoEn`) + locación. Solo *filmado*. |
| **storyboard** | `storyboard` | `storyboard[]: Escena{n, rol, plano, personajes[], accion, dialogo, continuidad}` | Escenas numeradas; reparte personajes y diálogo. |
| **pack** | `flowpack` | `packFlow: {estilo, personajes[], escenas[]}` | Prompts para Google Flow (ver §5). Solo *filmado*. |
| **render** | — | `renderRef` | mp4 del storyboard como motion graphics. Solo *animado*. |
| **rodaje** | — | `rodaje[]: Toma{escenaN, fileRef, durSec}` | Importa los clips generados en Flow (upload → SQLite/storage + `ffprobe` duración). |
| **montaje** | (ffmpeg) | `montaje`, `qa: QaResult` | Ensambla el comercial + QA holístico. Ver §6. |
| **publicar** | `publicar` | `publicacion: {hookOnScreen, caption, hashtags[], cta}` | El texto del posteo. |

**Validación cruzada:** `escenasAPrompts(storyboard, cast)` verifica que cada `Escena.personajes[]`
exista en el cast (integridad storyboard↔cast).

---

## 4. Los moldes — el cerebro de IA (Claude headless)

Los pasos "inteligentes" corren un **molde** vía **`POST /api/run-function`** → `server/functions.mjs`.

- **Mecanismo:** el backend **spawnea el CLI de Claude en headless** (`claude.cmd -p --output-format
  stream-json …`), 1 llamada por molde, y parsea el JSON de salida. No hay SDK ni API key en el front.
- **Selección de modelo por costo:** el server pasa `--model <tier>`. El tier sale de la config
  (`settings`): **auto por función** (cada molde declara el modelo más barato que le sirve) u **override
  global** desde el engranaje de la UI. (Origen: se detectó que sin `--model` todo corría con el default
  más caro del CLI.)
- **`VEO_RULES` (calibración battle-tested):** bloque de reglas de prompting para video, probado contra
  los videos reales en `shorts-nature/output/` (los `A_*` son talking-heads que funcionaron, `B_*`
  b-roll). Define: prompt **en inglés** salvo el **diálogo** (español rioplatense/voseo, con marca
  fonética), talking-head 8s mínimo, plano medio, push-in sutil, y **el acento se dispara nombrando la
  nacionalidad del personaje** ("a young Argentine woman…"). Es la fuente única de calibración de idioma.
- **MOLDES del rework (storyboard-driven)**, `server/functions.mjs` §"MOLDES DEL REWORK": `concepto`,
  `guion`, `cast`, `storyboard`, `flowpack`, `qa`, `publicar`.

**Motion graphics (reel animado):** `POST /api/mockup-reel` → `server/mockupReel.mjs` usa
**Playwright/chromium** para renderizar las `screens` del KB como video (estilo `public/bocetos`), no un
screenshot ni un dibujo — la pantalla real animada.

---

## 5. Integración con Google Flow / Veo 3.1 (flujo imagen-first)

El **paso `pack`** produce el `PackFlow` que el usuario lleva **manualmente** a Google Flow. Flow cambió a
un modelo *image-first* y el molde se adaptó a eso:

```ts
PackFlow = {
  estilo: string,                                   // estética global (sin personajes ni acción)
  personajes: [{ id, nombre, promptImagen }],       // 1 por personaje del cast
  escenas:    [{ escenaN, rol, prompt, estado }],   // 1 por escena del storyboard
}
```
- **`personajes[].promptImagen`** = prompt para **generar la IMAGEN de referencia** del personaje en Flow
  (Nano Banana): retrato cuerpo entero 9:16, del `fisicoEn`+vestuario del cast. La **consistencia la fija
  la imagen, no el texto** — por eso ya **no** se repite el `fisicoEn` verbatim en cada escena (eso, en el
  flujo viejo, hacía que Flow devolviera una imagen estática).
- **`escenas[].prompt`** = acción + cámara + **diálogo rioplatense** + referencia al personaje **por
  nombre** + locación (sigue `VEO_RULES`). Estado por escena: `pendiente → copiado → importado`.

**Operación del usuario:** (1) crea cada **Personaje** en Flow pegando su `promptImagen` → Flow fija la
cara; (2) crea una **escena por clip** pegando su `prompt` → Flow anima 8s manteniendo la cara; (3) **baja
los videos**; (4) los **importa** en el paso `rodaje`. El logo NO se depende de Flow — se quema en el
montaje.

---

## 6. Montaje y salida (post-producción)

**`POST /api/render-comercial`** → `server/renderComercial.mjs` (ffmpeg) ensambla el comercial final:
- concatena las **tomas** (`rodaje[]`, en orden de storyboard),
- superpone la **voz en off** (ElevenLabs, `/api/tts/generate` — español rioplatense, mejor que la voz
  sintética de Veo; persistida como `audioRef`),
- **música con ducking** (baja bajo la voz) y **silencios** estratégicos,
- **logo quemado** (overlay desde el BrandKit; `/api/brand-asset` es un proxy anti-SSRF para bajarlo),
- **export mp4 9:16** listo para publicar.

QA holístico: el molde `qa` (foco 'todo') evalúa el comercial y persiste `QaResult {score, verdict,
issues[]}` (no se reevalúa al volver al paso). `server/assemble.mjs` cubre el ensamblado legacy;
`/api/render` quedó **deprecated** (deuda).

---

## 7. Estado real: hecho vs. deuda (honesto)

**Hecho y verificado (en ambiente real, no mock):**
- Pipeline reel comercial storyboard-driven completo (los 9/7 pasos, gate, estados persistidos).
- KSP como consumidor (import de app → brief+brand+screens), on-demand.
- Flujo Flow imagen-first (personajes por imagen + escenas por nombre).
- Montaje ffmpeg (voz/música/ducking/silencios/logo/export).
- Selección de modelo por tier (ahorro de costo por molde).
- Copiloto contextual por paso + fuente única de reels (App dueño único; sin multi-writer).

**Deuda conocida:**
- Reintento automático del molde `flowpack` ante fallo (H1).
- `texts` sin UI; `/api/render` deprecated pendiente de remover.
- `npm test` en esta máquina requiere `npx vitest run --pool=vmThreads` (saturación de procesos node).
- El botón "Comenzar" del wizard duplicaba proyectos (recién mitigado con hidratación server-first).

---

## 8. El norte: de "generador de reels" a "plataforma de contenido multimedia"

El diseño ya separa **qué se cuenta** de **cómo se entrega**. Para llegar al objetivo:

**Eje de la abstracción — un `Formato` de salida configurable.** Hoy el formato está implícito (reel 9:16
talking-head). Debería ser una entidad de primer nivel:
```
Formato = {
  id, nombre,                 // "reel-ig", "meta-feed", "spot-yt", "animacion", "story"
  aspecto,                    // 9:16 | 1:1 | 4:5 | 16:9
  duracionObjetivo,           // 8s | 15s | 30s | 60s
  plataforma,                 // instagram | meta-ads | youtube | tiktok | tv
  tecnicaProduccion,          // filmado(Flow) | animado(mockup) | mixto | slideshow | 3D
  specsEntrega,               // bitrate, safe-areas, límites de texto de la plataforma
  moldeGuion, moldeRender,    // qué molde de guion y qué pipeline de render aplica
}
```

**Qué se reusa tal cual (la mitad cara ya está resuelta):**
- **La ingesta (KSP):** el KB de la app no cambia por formato — el `business`/`offerings`/`brand` sirven
  para un reel, un spot de Meta o una animación por igual.
- **El cerebro:** concepto, guion, estrategia, cast y storyboard son agnósticos al formato (solo cambia la
  duración/estructura objetivo, que ya es un parámetro).

**Qué hay que agregar por formato:**
- Un **perfil de formato** (lo de arriba) elegible al crear el `Comercial`/pieza (renombrarlo a `Pieza`).
- Moldes de guion **parametrizados por duración/plataforma** (un spot de 30s de Meta no es un reel de 8s).
- **Capas de render** adicionales: además de `render-comercial` (ffmpeg vertical) y `mockup-reel`
  (Playwright), sumar aspecto 1:1/16:9, slideshow, plantillas de animación, y las **specs de Meta Ads**
  (safe areas, límites de texto, CTA nativos).
- Un **catálogo de formatos** en la UI (hoy hay "catálogo de funciones guiadas" — misma idea, extendida).

**Resumen del norte:** la ingesta de datos (KSP) y el cerebro (concepto/guion) ya son agnósticos; lo que
falta para ser una plataforma de contenido multimedia sin límite es **promover el "formato de salida" a
una entidad configurable** y **sumar capas de producción/render por formato**. La arquitectura no se
opone — se extiende.

---

## Apéndice A — Endpoints del backend (`server/index.mjs`)

| Endpoint | Método | Rol |
|----------|--------|-----|
| `/api/health` | GET | healthcheck |
| `/api/claude` | POST | Claude headless crudo |
| `/api/run-function` | POST | **motor de moldes** (concepto/guion/cast/storyboard/flowpack/qa/publicar) |
| `/api/kb/apps` | GET | lista apps del registro KSP |
| `/api/kb/fetch` | POST | trae el KB de una app (server pone `X-KB-Key`) |
| `/api/kb/inspect`,`/api/kb/plan` | POST | inspección / plan de piezas del KB |
| `/api/apps`, `/api/apps/*` | GET/POST/DELETE | CRUD del registro de apps |
| `/api/projects`, `/api/projects/*` | GET/POST/DELETE | CRUD proyectos (dual-write SQLite) |
| `/api/projects/*/assets` | POST | upload de clip (rodaje) → storage + `ffprobe` |
| `/api/mockup-reel` | POST | motion graphics de pantallas (Playwright) |
| `/api/tts/voices`,`/generate`,`/cadence` | GET/POST | ElevenLabs (voz en off) |
| `/api/render-comercial` | POST | **render final** (ffmpeg) |
| `/api/brand-asset` | GET | proxy anti-SSRF para bajar el logo |
| `/api/storage/*` | GET | sirve los assets (clips, audios, mp4) |
| `/api/videos`,`/api/cloud-videos/*`,`/api/classify-video` | GET/POST/DELETE | biblioteca de videos |
| `/api/render`,`/api/assemble` | POST | ensamblado legacy (`/render` deprecated) |

## Apéndice B — Archivos clave

| Archivo | Rol |
|---------|-----|
| `src/lib/comercial.ts` | tipos + helpers puros del pipeline (la columna vertebral de datos) |
| `src/lib/knowledgeBase.ts` | consumidor del KSP (KB → brief/brand/screens) |
| `src/lib/projects.ts` | store local-first + dual-write + hidratación server-first |
| `src/App.tsx` | dueño único del proyecto (un solo mutador) |
| `src/Pipeline.tsx` | wizard de pasos (controlled) + copiloto |
| `src/pasos/Paso*.tsx` | un componente por paso del pipeline |
| `server/index.mjs` | router HTTP + SQLite |
| `server/functions.mjs` | moldes (Claude headless) + `VEO_RULES` |
| `server/renderComercial.mjs` | render final ffmpeg |
| `server/mockupReel.mjs` | motion graphics de pantallas (Playwright) |
| `base-compartida/3-PROTOCOLO-COMPLETO.md` | contrato KSP (v1.2) |
| `base-compartida/2-APPS-ENTRADAS.json` | registro de apps/generadores |
