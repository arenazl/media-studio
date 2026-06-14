# Media Studio — Agente INFRA

> Este documento es exclusivo del agente de infraestructura.
> El agente de aplicación tiene su propio archivo: `APP_AGENT.md`.
> Para decisiones compartidas y contexto general: `AGENT_GUIDE.md`.

---

## Mi rol

Me encargo de: arquitectura, deploy, backend, DB, integraciones externas (Cloudinary, Gemini, ElevenLabs),
variables de entorno, Dockerfile, pipelines CI/CD.

No toco: UI, CSS, lógica de componentes React, copy, UX.

---

## Estado actual del stack (2026-06-14)

### URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend (Netlify) | https://media-studio-arenazl.netlify.app |
| Backend (Cloud Run) | https://media-studio-api-1060106389361.southamerica-east1.run.app |
| TTS service (externo) | https://tts-service-1060106389361.southamerica-east1.run.app |
| Repo GitHub | https://github.com/arenazl/media-studio |

### Health check
```bash
curl https://media-studio-api-1060106389361.southamerica-east1.run.app/api/health
# → { ok: true, env: "prod", cloudinary: true, gemini: false }
```

`gemini: false` — pendiente adjuntar el secret (ver abajo).

---

## Arquitectura de entornos

```
dev (npm run studio)
  ├── Frontend: http://localhost:5180  (Vite, proxy /api/* → :5301)
  ├── Backend:  http://localhost:5301  (Node 22, SQLite local)
  ├── AI:       Claude CLI headless
  └── Videos:   D:/Code/sugerenciasMun/reels/videos (local)

prod (Cloud Run + Netlify)
  ├── Frontend: Netlify (build estático, VITE_API_BASE → Cloud Run)
  ├── Backend:  Cloud Run media-studio-api (IS_PROD=true)
  ├── AI:       Gemini 2.0 Flash via REST
  └── Videos:   Cloudinary (cloud name en env.yaml)
```

---

## Backend — endpoints completos

```
GET  /api/health
POST /api/claude                      → AI pipeline (Claude / Gemini según IS_PROD)
GET  /api/videos                      → videos locales (solo dev)
GET  /api/videos/file/{name}         → stream con Range headers
GET  /api/cloud-videos                → galería Cloudinary (de DB)
POST /api/cloud-videos/upload         → sube mp4 a Cloudinary
DELETE /api/cloud-videos/{id}
GET  /api/projects
POST /api/projects
GET  /api/projects/{id}
DELETE /api/projects/{id}
GET  /api/apps                        → lista configs de voz por app
GET  /api/apps/{app_id}              → config de voz de una app
POST /api/apps/{app_id}              → guardar config de voz
DELETE /api/apps/{app_id}
```

---

## DB SQLite — tablas

**Archivo:** `server/media-studio.db`
**En Cloud Run:** `/app/server/media-studio.db` (efímero — se borra en restart)

```sql
projects     (id, name, data JSON, created_at, updated_at)
cloud_videos (id, public_id, name, url, thumbnail, duration_sec, size_bytes, source, created_at)
app_configs  (app_id PK, name, api_url, voice_id, stability, similarity, style, speed, model, extra JSON, updated_at)
```

---

## Deploy

### Frontend (push → Netlify auto-build)
```bash
cd d:\Code\media-studio
npm run build          # verificar antes de pushear
git push origin master # Netlify reconstruye solo
```

### Backend (Cloud Run)
```powershell
cd d:\Code\media-studio

# 1. Build imagen
gcloud builds submit --region=southamerica-east1 `
  --tag=southamerica-east1-docker.pkg.dev/munify-api/media-studio/api:latest `
  --project=munify-api .

# 2. Deploy
$secrets = "CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"
gcloud run deploy media-studio-api `
  --image=southamerica-east1-docker.pkg.dev/munify-api/media-studio/api:latest `
  --region=southamerica-east1 --allow-unauthenticated --port=8080 `
  --env-vars-file=server/env.yaml `
  --set-secrets=$secrets `
  --project=munify-api
```

### Variables de entorno del backend (server/env.yaml + Secret Manager)

| Variable | Fuente | Valor |
|----------|--------|-------|
| `NODE_ENV` | env.yaml | `production` |
| `IS_PROD` | env.yaml | `true` |
| `STUDIO_PORT` | env.yaml | `8080` |
| `CLOUDINARY_CLOUD_NAME` | env.yaml | (completar) |
| `CLOUDINARY_API_KEY` | env.yaml | (completar) |
| `CLOUDINARY_FOLDER` | env.yaml | `media-studio` |
| `CLOUDINARY_API_SECRET` | Secret Manager | `CLOUDINARY_API_SECRET:latest` |
| `GEMINI_API_KEY` | Secret Manager | `GEMINI_API_KEY:latest` |

### Variable del frontend (Netlify)

| Variable | Valor |
|----------|-------|
| `VITE_API_BASE` | `https://media-studio-api-1060106389361.southamerica-east1.run.app` |

---

## Pendientes de infra

- [ ] **Activar Gemini** — el secret existe en munify-api pero no se adjuntó. Correr:
  ```bash
  gcloud run services update media-studio-api \
    --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
    --region=southamerica-east1 --project=munify-api
  ```
- [ ] **Persistencia real de DB** — migrar `cloud_videos` y `app_configs` a Aiven MySQL
  para que sobrevivan restarts de Cloud Run.
- [ ] **Webhook Netlify↔GitHub** — verificar que el auto-deploy esté activo en
  https://app.netlify.com/projects/media-studio-arenazl
- [ ] **Contrato Salesbot** — crear `d:\Code\salesbot\mediastudio\SPEC.md` con los
  endpoints que Salesbot tiene que implementar para conectarse a Media Studio.
- [ ] **completar `server/env.yaml`** — poner los valores reales de CLOUDINARY_CLOUD_NAME y
  CLOUDINARY_API_KEY (sacarlos de `.env.master` de APP_GUIDE).

---

## Log de cambios

| Fecha | Cambio | Archivos tocados |
|-------|--------|-----------------|
| 2026-06-14 | Setup inicial: repo GitHub, Netlify, Cloud Run, Artifact Registry | `Dockerfile`, `netlify.toml`, `server/env.yaml` |
| 2026-06-14 | Backend: endpoints cloud-videos, app-configs, Cloudinary upload, Gemini routing | `server/index.mjs` |
| 2026-06-14 | DB: tablas cloud_videos y app_configs | `server/db.mjs` |
| 2026-06-14 | Frontend: API_BASE dinámico por env var | `src/config.ts` |
