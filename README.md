# Media Studio

Generador **local** de kits de video de marketing para redes (reels 9:16). Consume el negocio de cada
app (vía **KSP**, on-demand) y lo convierte en **audio con voz**, **reels animados** (recrea la UI de la
app) y **prompts de reels humanos** (para Google Flow/Veo).

> **Corre local — no es un SaaS.** Se levanta en la máquina del operador. La IA (Claude headless), el
> motor de voz (ElevenLabs) y el render de video (Playwright + ffmpeg) corren todos localmente.

**Empezá por [`docs/01-proposito/01-que-es-y-como-se-enchufa.md`](docs/01-proposito/01-que-es-y-como-se-enchufa.md)** —
qué es, cómo se enchufa con las apps generadoras y cómo produce contenido (primero infra, después técnico).

## Correr (local)

```
npm install
npm run studio     # front (vite :5180) + backend (node :5301) juntos
# o por separado:  npm run dev   |   npm run server
npm run build      # build del front
npm test           # tests de lógica pura (vitest)
```

Necesita `.env` con `ELEVENLABS_API_KEY` (el motor de voz local pega directo a ElevenLabs).

## Cómo está armado

- **Front** — Vite + React + TS (`src/`): wizard de arranque, funciones guiadas, VoiceStudio (audio) y editor.
- **Backend** — Node (`server/`): IA (Claude headless local / Gemini en prod), TTS ElevenLabs (`/api/tts/*`),
  reel animado (`/api/mockup-reel`, Playwright → ffmpeg) y montaje/render (ffmpeg).
- **Entrada** — el KB de cada app (contrato KSP 1.2), traído on-demand con la clave de `base-compartida`.
- **Salidas** — audio (voz con cadencia), reel animado (motion graphics de la UI desde la metadata),
  prompts de reel humano (Flow/Veo).

## Documentación

Todo vive en [`docs/`](docs/) — índice en [`docs/README.md`](docs/README.md). El propósito completo, la
infraestructura y el pipeline técnico están en [`docs/01-proposito/`](docs/01-proposito/).

## Deploy

El uso es **local**. Existe una config de deploy en la nube (Netlify para el front + Cloud Run para el
backend) documentada en `docs/01-proposito` — hoy **no es el foco**.
