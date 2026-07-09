# Media Studio — qué es, cómo se enchufa y cómo genera contenido

> **Propósito de este doc:** explicar de una sola vez qué es Media Studio, cómo se conecta con
> las apps que son dueñas del negocio, y cómo convierte esa información en reels, videos y contenido
> multimedia. Primero la **infraestructura** (dónde corre y cómo se conecta), después lo **técnico**
> (el pipeline interno). Es el punto de entrada de `docs/`.

---

## 1. Qué es (en una frase)

Media Studio es un **generador agnóstico de kits de video de marketing** para redes (reels 9:16).
**No es dueño de ningún dato de negocio**: los *consume* de las apps y los transforma en piezas —
guiones + voz, reels animados (motion graphics de la propia UI), y prompts para reels con presentador.

Dicho al revés: una app (Munify, FitPass, …) sabe **qué hace su producto**; Media Studio sabe **cómo
contarlo en video**. El puente entre ambos es un contrato de datos, no una integración a medida.

---

## 2. El ecosistema — dónde encaja (KSP)

El **Knowledge Share Protocol (KSP)** separa dos roles:

| Rol | Quiénes | Qué hacen |
|-----|---------|-----------|
| **Apps** (fuentes) | Munify, FitPass, EventMarket, … | Exponen su negocio como KB: `GET /api/knowledge-base` |
| **Generadores** (consumidores) | **Media Studio**, SalesBot | Traen ese KB y lo convierten: Media Studio → **video/contenido**; SalesBot → **venta** |

- Media Studio lee **su clave fija** de `D:\Code\base-compartida\2-APPS-ENTRADAS.json` (`generadores.mediastudio`)
  y la lista de apps con su `servidor` (URL del backend).
- **Consumo on-demand, sin cache:** cada vez que va a generar, trae el KB fresco. No hay push ni notificaciones.
  ```
  GET {servidor}/api/knowledge-base
  Header: X-KB-Key: {clave de mediastudio}
  ```
- **Contrato vigente: 1.2** (forward-compatible con 1.1). Lo que Media Studio usa del KB:
  - `business.value_story` + `key_messages` → el hilo narrativo (va en CADA reel).
  - `offerings` → qué ofrece el negocio.
  - `screens` como **metadata** (`kind`, `components`, `layout`, `style`, `data`, `flow` — ya NO HTML/URLs)
    → con esto **recrea las pantallas** en el reel animado.
  - `brand` (`colors`, `logo.svg`, `style`, fonética) → identidad visual + cómo se pronuncia la marca en TTS/Veo.
  - (Los campos `capabilities`/`entities`/`tools` son de SalesBot; Media Studio los ignora.)
- Si la app no responde o devuelve algo inválido, **no se genera a ciegas**: se avisa al operador.

> Detalle del protocolo: `base-compartida/1B-GENERADORES.md` y `base-compartida/3-PROTOCOLO-COMPLETO.md`
> (§4.10 screens, §7 consumo, §9 el GET). Cambios propuestos por esta app: `base-compartida/mediastudio/cambios.md`.

---

## 3. INFRAESTRUCTURA (dónde corre y cómo se conecta)

> **Media Studio corre LOCAL**, en la máquina del operador — **no es un SaaS deployado** para usuarios
> finales. El modo de uso real es levantarlo con `npm run studio` y trabajar en `localhost`. La IA
> (Claude headless), el motor de voz (ElevenLabs) y el render de video (Playwright + ffmpeg) corren
> todos en la máquina local. Existe una config de deploy en la nube (§3.2) por si algún día se publica,
> pero **hoy no es el foco: el uso es local**.

### 3.1 Local — así se usa (el modo real)

Un solo comando levanta todo:

```
npm run studio      # concurrently: FRONT (vite) + BACK (node)
```

| Pieza | Detalle |
|-------|---------|
| **Front** | Vite + React + TypeScript → `http://localhost:5180` |
| **Backend** | Node `--experimental-sqlite` → `http://localhost:5301` (`server/index.mjs`) |
| **Proxy dev** | Vite reenvía `/api/*` → `localhost:5301` (ver `vite.config`) |
| **IA** | **Claude headless** (`claude.cmd -p`, plan Claude Max — se paga por usage, no por API). Activo cuando `IS_PROD=false` (default). |
| **TTS** | **ElevenLabs directo desde el backend** (`/api/tts/*`). Key en `.env` (`ELEVENLABS_API_KEY`). |
| **Render de video** | **Playwright** (chromium headless) para el reel animado + **ffmpeg** para montaje/encode. |
| **Storage** | Disco local (`server/storage/`, servido por `/api/storage/…`). |

### 3.2 Deploy en la nube (opcional — config existente, hoy NO es el foco)

> Esto está configurado pero **el proyecto se usa local**. Documentado por si se retoma.

| Pieza | Detalle |
|-------|---------|
| **Front** | **Netlify** — `media-studio-arenazl.netlify.app` (build `npm run build`, publish `dist`, Node 22). Deploy **manual** por Netlify CLI. |
| **Backend** | **Cloud Run** — `media-studio-api-vmpxsxe7ra-rj.a.run.app` (proyecto GCP `munify-api`). |
| **Puente front↔back** | Proxy **same-origin** en `netlify.toml`: `/api/*` → Cloud Run. Así el bundle no lleva URL (sin secrets-scanning ni CORS). |
| **IA** | **Gemini** cuando `IS_PROD=true`. |
| **Storage** | **Cloudinary** (`saveAsset` devuelve el mismo shape que en local). |

### 3.3 Secrets / config (nunca en el código)

`ELEVENLABS_API_KEY` (Secret Manager `munify-api` / `.env` local), `KB_CLAVE_MEDIASTUDIO` (clave KSP),
`GEMINI_API_KEY`, `CLOUDINARY_*`. El switch de entorno es **`IS_PROD`** (`false` = local/Claude, `true` = prod/Gemini).

---

## 4. TÉCNICO (cómo convierte el KB en contenido)

### 4.1 El pipeline, de punta a punta

```
  App KB (1.2)          Media Studio
 ┌───────────┐   KSP   ┌──────────────────────────────────────────────────────────────┐
 │ business  │────────▶│ importar → wizard → TEMPLATE BASE → flujo de laburo → render │
 │ screens   │         └──────────────────────────────────────────────────────────────┘
 │ brand     │                │            │                       │
 └───────────┘        estrategia+guion   3 salidas paralelas    editor + ensamblado
```

1. **Importar**: se trae el KB (o se elige una integración). `src/lib/knowledgeBase.ts` lo parsea a 1.2.
2. **Wizard** (`src/ProjectWizard.tsx`): en 1 corrida arma el **template base** — estrategia (plan de piezas
   GLOBALES) + por pieza: guion de audio, mockups y prompts de video. Barato (llamadas simples a Claude headless).
3. **Flujo de laburo**: el usuario ve/edita lo generado y **regenera puntual** (una pieza, un ítem) sin re-gastar todo.

### 4.2 Las tres salidas de contenido

| Salida | Qué es | Cómo se produce |
|--------|--------|-----------------|
| **Audio / voz** | Narración TTS con cadencia (pausas, énfasis, tono) | `VoiceStudio` + `/api/tts/*` (ElevenLabs). Botón **"Agregar vida"** marca el guion con `…`/MAYÚSCULAS/`[tono]` (3 variantes). |
| **Reel ANIMADO** | Motion graphics que **recrea la UI de la app** (estilo `public/bocetos/*.mp4`) desde `screens` + `brand` | `server/mockupReel.mjs` (HTML/CSS → Playwright → ffmpeg) vía `POST /api/mockup-reel`. **Nada hardcodeado: sale de la metadata.** |
| **Reel HUMANO** | Presentador a cámara + b-roll (se genera en Google Flow/Veo 3) | Moldes en `server/functions.mjs` (`VEO_RULES`) → prompts listos para pegar en Flow. |

### 4.3 Funciones guiadas (el motor)

- El front dibuja botones desde un **catálogo** (`src/lib/functionCatalog.ts`).
- Cada función corre **on-demand**: `POST /api/run-function {functionId, context, options, regenerate}` →
  `server/functions.mjs` arma el prompt (moldes PUROS, testeables sin IA) → `runAI` (Claude/Gemini) → parseo.
- Moldes: `strategy`, `script`, `mockup`, `veo`, `publish`, `qa`.

### 4.4 Endpoints del backend (los que importan)

| Endpoint | Para qué |
|----------|----------|
| `POST /api/run-function` | Corre un molde (estrategia/guion/mockup/veo/…) con Claude/Gemini |
| `GET /api/tts/voices` · `POST /api/tts/generate` · `POST /api/tts/cadence` | Voces, síntesis y "agregar vida" (ElevenLabs) |
| `POST /api/mockup-reel` | Renderiza el reel animado (mp4) desde slides + brand |
| `POST /api/assemble` · `POST /api/render` | Ensambla/encodea el mp4 final (ffmpeg) |
| `GET/POST /api/projects` | Proyectos (SQLite; el front trabaja también con localStorage) |
| `GET /api/storage/…` | Sirve assets locales (dev) |

### 4.5 Mapa de archivos clave

```
server/
├── index.mjs        ← HTTP + dispatch de endpoints + runAI (Claude/Gemini) + saveAsset
├── functions.mjs    ← moldes de los prompts (PUROS) + VEO_RULES + extractJson
├── mockupReel.mjs   ← reel animado: HTML de marca → Playwright → mp4
└── assemble.mjs     ← montaje ffmpeg (familias A/B, portado de shorts-nature/mkreels.py)
src/
├── lib/knowledgeBase.ts   ← parseo del KB 1.2 → brief + brand + screens
├── ProjectWizard.tsx      ← importar → template base
├── FunctionRunner.tsx     ← corre las funciones + botón "Generar reel animado"
├── VoiceStudio.tsx        ← estudio de audio (voces, cadencia, presets)
└── VeoPanel.tsx           ← secuencia de prompts Veo
```

---

## 5. En una línea

**Las apps describen su negocio (KB 1.2 vía KSP); Media Studio lo trae on-demand y lo convierte en
audio con voz, reels animados de la propia UI y prompts de reels humanos — local con Claude headless,
en prod con Gemini + Cloud Run + Netlify.**
