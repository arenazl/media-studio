# Media Studio — Guía de agentes

> Documento de entrada. Leer PRIMERO antes de ir a los archivos individuales.
> Cada agente tiene su propio archivo para evitar conflictos de edición.

---

## Cómo funciona este sistema

Somos dos agentes trabajando en el mismo repo de forma asíncrona:

| Agente | Archivo propio | Área de trabajo |
|--------|---------------|-----------------|
| **INFRA** | [`INFRA_AGENT.md`](INFRA_AGENT.md) | Backend, deploy, DB, integraciones |
| **APP** | [`APP_AGENT.md`](APP_AGENT.md) | UI, componentes React, UX, features |

**Regla principal:** cada agente escribe SOLO en su propio archivo.
Si necesitás algo del otro agente, lo pedís en la sección "Pedidos" de TU archivo.
El otro agente lee esa sección antes de arrancar y responde ahí.

---

## Estado del proyecto hoy (2026-06-14)

### Qué está vivo en producción

| Cosa | URL / Path |
|------|-----------|
| App | https://media-studio-arenazl.netlify.app |
| Backend API | https://media-studio-api-1060106389361.southamerica-east1.run.app |
| Repo | https://github.com/arenazl/media-studio |

### Qué funciona

- Tab Audio: editor de voz + TTS ElevenLabs
- Tab Videos: templates Flow (11 escenarios municipales) + galería Cloudinary + upload
- Backend: endpoints de app configs, cloud-videos, proyectos

### Qué falta

- **Settings UI** para configurar apps conectadas (panel de config de voz por app) — backend `/api/apps/*` listo
- **Gemini** no activo en prod (pendiente de infra — `gcloud run services update ... --update-secrets`)
- Tabs **Reel / Montaje / Export** son StageTab placeholders
- **DB ephemeral** en Cloud Run — migrar a Aiven para persistir `app_configs` y `cloud_videos`
- **Botón "Grabar"** en VoiceStudio (settings por reel → `data.reels[].voiceConfig`)
- **Settings de apps** (Settings UI para `/api/apps/*`)

---

## Contexto del negocio

Media Studio es una herramienta para:
1. **Curar voces** — elegir voz, ajustar cadencia/timbre, probar con texto real
2. **Guardar esa config** por app cliente (salesbot, munify, etc.) — las apps la fetchean una vez y llaman a ElevenLabs directo, sin pasar por Media Studio en el loop
3. **Generar reels** — prompts para Flow/Veo (la IA de video de Google), pipeline de montaje
4. **Biblioteca de videos** — subir los mp4 de Flow a Cloudinary, tenerlos disponibles online

El cliente de audio más inmediato es **SalesBot** — un bot de WhatsApp que responde con audio.
No queremos latencia adicional: Media Studio configura la voz, Salesbot llama a ElevenLabs solo.

---

## Stack técnico resumido

```
Frontend:  React 18 + Vite + TypeScript — src/
Backend:   Node.js 22, HTTP nativo, SQLite — server/
Estilos:   CSS co-localizado + tokens en src/styles/tokens.css
Deploy:    Netlify (front) + Cloud Run munify-api (back)
TTS:       ElevenLabs vía tts-service (Cloud Run externo, GET /voices devuelve preview_url)
Videos:    Cloudinary (prod) / carpeta local (dev) — manifest public/cloud-videos.json como fallback estático
AI:        Claude CLI headless (dev) / Gemini 2.0 Flash (prod — pendiente activar secret)
```

---

## Log de decisiones

| Fecha | Decisión | Motivo |
|-------|----------|--------|
| 2026-06-14 | Backend en Cloud Run (Node 22, no FastAPI) | Node nativo para SQLite y Claude headless sin overhead Python |
| 2026-06-14 | Frontend en Netlify, backend en Cloud Run separados | Front estático; back necesita procesos largos |
| 2026-06-14 | App configs en SQLite por ahora | Simple para arrancar; migrar a Aiven cuando la efimeriedad sea un problema |
| 2026-06-14 | Media Studio NO hace de proxy TTS | Sin latencia extra; las apps fetchean config una vez y llaman a ElevenLabs directo |
| 2026-06-14 | AI routing por IS_PROD env var | Mismo código, distinto comportamiento por entorno — sin feature flags |
| 2026-06-14 | Source-of-truth videos: manifest durable + DB viva, merge por URL en cliente | DB Cloud Run efímera; manifest en Netlify siempre disponible. Sync periódico vía commit |
| 2026-06-14 | Shell multi-tenant: sidebar colapsable + ABM de proyectos como pantalla inicial | Norte nuevo — la app se organiza por proyecto, no por tabs sueltos |
| 2026-06-14 | Store de proyectos en localStorage (frontend-first) | Funciona sin backend; migrar a /api/projects cuando se necesite persistencia en cloud |
| 2026-06-14 | Assets por proyecto en Cloudinary carpeta media-studio/{id}/ | Cada proyecto tiene su namespace propio en Cloudinary |
| 2026-06-14 | VoiceConfig por reel dentro de projects.data.reels[].voiceConfig | No se necesita tabla aparte; POST /api/projects/{id} actualiza el JSON completo |
