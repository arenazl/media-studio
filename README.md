# Media Studio — Voz & Video

App **standalone** (repo propio) para el trabajo de **voz** y **video**, reusable
entre todas las apps. UI del **media-service** (Cloud Run).

## Dos herramientas
- **Voz** — editor con marcadores inline (énfasis / pausas / tono v3). Genera
  audio real contra el media-service (la key vive allá, nunca acá) → reproducir + descargar mp3.
- **Video (prompts)** — **generador de prompts para Flow/Veo** (no genera video).
  Form con sujeto / escena / cámara / look (real-UGC vs cine) → arma el prompt
  óptimo en inglés y lo copiás. El video lo generás en **Flow** (tu PRO).

## Stack
Vite + React + TS. Sin backend propio: el frontend llama al **media-service**
(`TTS_SERVICE_URL` en `src/data/narrationText.ts`).

## Correr
```
npm install
npm run dev      # http://localhost:5180
npm run build
```

## Arquitectura
- **Motor / servicio** (con las keys como secreto): `D:\Code\tts-service\`
  (Cloud Run `tts-service`). Voz = ElevenLabs. Video = solo prompts (sin API paga).
- **Esta app** = la UI. Munify también consume el mismo servicio desde `/reels`.
