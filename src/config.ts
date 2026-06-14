// Config del media-studio.
// En dev: /api/* va por proxy de Vite → localhost:5301
// En prod (Netlify): VITE_API_BASE apunta al Cloud Run del backend
export const TTS_SERVICE_URL = 'https://tts-service-1060106389361.southamerica-east1.run.app';
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';
