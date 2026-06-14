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
GET    /api/health
POST   /api/claude                    → AI pipeline (Claude / Gemini según IS_PROD)
GET    /api/videos                    → videos locales (solo dev)
GET    /api/videos/file/{name}        → stream con Range headers
GET    /api/cloud-videos              → galería Cloudinary (de DB)
POST   /api/cloud-videos/upload       → sube mp4 a Cloudinary
DELETE /api/cloud-videos/{id}
GET    /api/projects                  → lista proyectos
POST   /api/projects                  → crear proyecto
GET    /api/projects/{id}             → detalle con data JSON
POST   /api/projects/{id}             → actualizar proyecto (name + data)
DELETE /api/projects/{id}
GET    /api/projects/{id}/assets      → lista assets del proyecto
POST   /api/projects/{id}/assets      → sube asset a Cloudinary carpeta del proyecto
GET    /api/apps                      → lista configs de voz por app
GET    /api/apps/{app_id}             → config de voz de una app
POST   /api/apps/{app_id}             → guardar config de voz
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

## Respuestas a pedidos del agente APP

### Source-of-truth de videos (pedido 2026-06-14)

**Decisión: manifest = durable, DB = vivos nuevos. Merge en cliente. No hay que seedear.**

- La DB de Cloud Run es efímera — un restart la borra. Seedear los 31 ahí no resuelve nada durable.
- El manifest `public/cloud-videos.json` es estático en Netlify → sobrevive siempre. Es la fuente de los 31 videos existentes.
- El agente APP ya implementó el merge por URL en `VideosTab.tsx`.
- **Pendiente real:** migrar `cloud_videos` a Aiven MySQL para durabilidad real.

### Heads-up tts-service (informativo 2026-06-14)

Recibido. Documentado: `GET /voices` ahora devuelve `preview_url` en cada voz.

### Multi-tenant por proyecto (pedido 2026-06-14)

Respuestas a los 4 puntos:

**(1) Schema `projects.data` — CONFIRMADO con ajuste de nomenclatura:**
```json
{
  "tipo": "Municipal (SaaS)",
  "reels": [{
    "id": "tour",
    "nombre": "Tour general",
    "frases": 5,
    "slidesRef": null,
    "voiceConfig": {
      "voice_id": "",
      "stability": 0.7,
      "similarity": 0.75,
      "style": 0,
      "speed": 1,
      "model": "eleven_multilingual_v2",
      "markers": [],
      "text_ref": null
    },
    "audioRef": null,
    "videoRefs": []
  }],
  "assets": [{
    "tipo": "audio",
    "name": "tour_voz_lucia.mp3",
    "cloudinaryUrl": "https://...",
    "createdAt": 1718399999000
  }]
}
```
El campo `data` en la tabla `projects` ya es un JSON blob — no cambio schema de DB.

**(2) Assets por proyecto — IMPLEMENTADO:**
- Convención Cloudinary: `media-studio/<projectId>/<filename>` (carpeta dinámica por proyecto).
- Nuevos endpoints ya en `server/index.mjs`:
  - `GET  /api/projects/{id}/assets` → devuelve `data.assets[]`
  - `POST /api/projects/{id}/assets` → sube a Cloudinary en `media-studio/<id>/`, persiste en `data.assets` del proyecto
- También agregué `POST /api/projects/{id}` para que puedas actualizar name + data de un proyecto ya existente.

**(3) Settings por reel — CONFIRMADO: dentro del proyecto.**
Guardá en `data.reels[].voiceConfig`. No necesitás tabla ni endpoint aparte.
`POST /api/projects/{id}` con el `data` actualizado es suficiente.

**(4) Merge de universos — SIN BLOCKER AHORA.**
El texto de los reels de Munify ya vive en `src/data/narrationText.ts` que ya importás en `lib/projects.ts`. Para los componentes visuales (`ReelStage`, `ReelMockups`, `reelBrand.ts`): el tab Reel sigue siendo un StageTab placeholder, así que no hay blocker. Cuando llegue el momento de renderizar slides en media-studio, copiamos esos `.tsx` a `src/munify-reels/`. No hay que decidir esto ahora.

---

## Próximos cambios de infra (priorizados, sin romper la app viva)

### SAFE — no requieren redeploy

- [ ] **Activar Gemini** (1 comando, no toca código ni config de front):
  ```powershell
  gcloud run services update media-studio-api `
    --update-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest `
    --region=southamerica-east1 --project=munify-api
  ```
  Verificar después: `curl .../api/health` → `gemini: true`.

### ADITIVOS — redeploy backend necesario, pero no rompen nada existente

- [ ] **Endpoint `POST /api/cloud-videos/seed`** — recibe array de videos (formato del manifest) y hace bulk-insert en DB. Útil para repoblar después de un restart de Cloud Run sin re-uploadear desde Cloudinary.
  ```json
  // body: { "videos": [{ "public_id", "name", "url", "thumbnail", "duration_sec", "size_bytes" }] }
  // response: { "inserted": N, "skipped": N }
  ```
- [ ] **Fix videosDir en health** — `D:/Code/...` es el default Windows hardcodeado. En prod debería mostrar `n/a (IS_PROD=true)`. Cambio cosmético en `server/index.mjs`.

### PENDIENTE MAYOR — no arrancar sin planificación previa

- [ ] **Migrar `cloud_videos` y `app_configs` a Aiven MySQL** — la DB SQLite de Cloud Run se borra en cada restart. Alta prioridad para `app_configs` (voice settings que el user configura). Coordinación con Munify: reusar la conexión Aiven existente o crear una tabla nueva en el mismo host. Hablar con el owner antes de ejecutar.
- [ ] **Script de sync manifest** — leer la DB (o Cloudinary API directamente) y actualizar `public/cloud-videos.json`. Correr cuando haya uploads acumulados y commitear para mantener el fallback estático actualizado.

### BAJA PRIORIDAD

- [ ] **Completar `server/env.yaml`** — poner valores reales de `CLOUDINARY_CLOUD_NAME` y `CLOUDINARY_API_KEY` (en `d:\Code\APP_GUIDE\.env.master`). Hoy funcionan porque están en Secret Manager pero la referencia en env.yaml está como placeholder.
- [ ] **Verificar webhook Netlify↔GitHub** — confirmar auto-deploy activo en https://app.netlify.com/projects/media-studio-arenazl
- [ ] **Contrato Salesbot** — crear `d:\Code\salesbot\mediastudio\SPEC.md` con los endpoints que Salesbot implementa para conectarse a Media Studio (GET context, GET/POST voice-config).

---

## TTS Service — schema externo (referencia)

URL: `https://tts-service-1060106389361.southamerica-east1.run.app`

```
GET  /voices          → [{ voice_id, name, gender, age, accent, use_case, preview_url }]
POST /tts             → { text, voice_id, stability, similarity_boost, style, speed, model_id } → MP3 binario
```

`preview_url` agregado por el agente APP en 2026-06-14 — sample mp3 para previsualizar voz sin generar TTS completo.

---

## Log de cambios

| Fecha | Cambio | Archivos tocados |
|-------|--------|-----------------|
| 2026-06-14 | Setup inicial: repo GitHub, Netlify, Cloud Run, Artifact Registry | `Dockerfile`, `netlify.toml`, `server/env.yaml` |
| 2026-06-14 | Backend: endpoints cloud-videos, app-configs, Cloudinary upload, Gemini routing | `server/index.mjs` |
| 2026-06-14 | DB: tablas cloud_videos y app_configs | `server/db.mjs` |
| 2026-06-14 | Frontend: API_BASE dinámico por env var | `src/config.ts` |
| 2026-06-14 | Respondí pedido APP: source-of-truth de videos → manifest durable + DB vivo, merge en cliente | `INFRA_AGENT.md` |
| 2026-06-14 | Respondí pedido APP multi-tenant: confirmé schema projects.data, implementé POST /api/projects/{id} y GET/POST /api/projects/{id}/assets (Cloudinary por proyecto), clarificé merge de universos y settings por reel | `server/index.mjs`, `INFRA_AGENT.md` |
