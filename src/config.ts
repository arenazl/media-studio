// Config del media-studio.
// En dev: /api/* va por proxy de Vite → localhost:5301
// En prod (Netlify): /api/* va por proxy same-origin del netlify.toml → Cloud Run.
//   API_BASE = '' (relativo) → sin URL en el bundle (sin secrets scanning) y sin CORS.
//   VITE_API_BASE queda como override opcional; si no existe, cae a relativo.
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';
// TTS LOCAL: el backend (server/index.mjs) pega directo a ElevenLabs con tu key — sin el Cloud Run
// intermedio (tts-service). El front sigue usando `${TTS_SERVICE_URL}/voices` y `/generate`.
export const TTS_SERVICE_URL = `${API_BASE}/api/tts`;
