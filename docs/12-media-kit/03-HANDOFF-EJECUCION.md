# 12.03 — HANDOFF: terminar el circuito media-kit (prueba real + render v1.5)

> **Para el dueño:** este doc es el traspaso completo para que CUALQUIER agente (Antigravity,
> Opus, quien sea) termine lo que falta sin pedir contexto: (1) la prueba next-next con IA
> real sobre el kit de sinvueltas, y (2) el render v1.5 que usa las capturas. Todo lo previo
> ya está hecho, commiteado y verificado.

## Contexto en 5 líneas

media-studio (esta app, local, NO se deploya) genera kits de video de marketing. Hoy
(2026-07-26) se cableó el consumo del **media-kit**: cada app deja `media-kit/` en su repo
(contrato: `D:\Code\base-compartida\16-MEDIA-KIT-DIAGNOSTICO.md`) y media-studio lo descubre,
lo importa al crear el proyecto, lo muestra en los pasos y lo usa en los moldes de IA.
**Ya hay un kit REAL**: `D:\Code\EventMarker\media-kit\` (sin vueltas ¡YA!, id `eventmarker`,
9 capturas, 2 momentos, válido). Falta: la prueba punta a punta con IA real y que el RENDER
use las capturas (hoy el video sale como placas de texto mudas — por eso salía 1/10).

## Estado del repo (verificado 2026-07-26 ~21:30 ART)

- **Pusheado** hasta `0e24c2c` (curaduría del circuito, reporte 07).
- **Commits locales SIN pushear** (no pushear sin OK del dueño):
  `ed4ee09` (server descubre/sirve kits + wizard con preview) · `3319ea6` (capturas visibles
  en los pasos) · `0a13ac1` (moldes usan el kit + FIX: la narración del guion ahora llega al
  `dialogo` de cada escena del storyboard — antes salían mudas).
- **Gates al cierre**: tsc 0 errores · eslint 0 errores (12 warnings preexistentes) ·
  **437/437 tests** (`npm test -- --pool=vmThreads`) · build OK.
- **OJO — WIP AJENO sin commitear** de otra sesión (NO pisarlo, NO commitearlo): KbFromText,
  RailSettings, cambios en Integrar/KbInspector/ProjectInfo/Rail/rediseno.css y en los
  pasos (auto-generar). Si tocás un archivo que lo tenga mezclado: técnica quirúrgica del
  commit `0d0f014` (armar HEAD + solo tus cambios, commitear, restaurar el árbol). PROHIBIDO
  `git add -A` / `git add .` — siempre add explícito por archivo.

## Ambiente (los servers mueren con la sesión de quien los levanta)

- Back: `npm run server` → :5301 (health: `GET /api/health`). Tras tocar `server/*` hay que
  reiniciarlo (Node cachea módulos).
- Front: `npm run dev` → :5180 (Vite, HMR solo).
- Endpoints nuevos: `GET /api/media-kit` (lista) · `GET /api/media-kit/eventmarker` (kit) ·
  `GET /api/media-kit/eventmarker/file/screens/01-home.png` (capturas; traversal → 400).

## TAREA 1 — Prueba next-next con IA REAL (máx 5 llamadas)

Como lo haría el dueño, en :5180:
1. Inicio → Nueva pieza → formato **Reel animado** → app **sin vueltas ¡YA!** → verificar
   badge "Media kit · 9 capturas" + grilla de preview. **OJO: hay DOS wizards en el flujo**:
   `src/Wizard.tsx` (elige formato+app, acá vive el badge/preview) y después
   `src/ProjectWizard.tsx` (perfil de campaña → corre `strategy` y siembra los reels).
2. Crear → estrategia real (IA 1). Verificar por API que el proyecto tiene `mediaKitId`,
   `pantallasKit`, `cta`, `momentos`.
3. Abrir pieza 1 → Negocio → aprobar → **Concepto** (IA 2): ¿los conceptos referencian las
   pantallas/momentos REALES (buscador con autocomplete, perfil verificado, seña en
   garantía…)? Elegir el mejor.
4. **Guion** (IA 3): narración de VENTA (no direcciones técnicas), duración del formato.
5. **Storyboard** (IA 4): verificar (a) TODAS las escenas con `dialogo` NO vacío,
   (b) `archivoCaptura` asignado a las pantallas del kit, (c) miniaturas visibles y selector
   por escena funcionando.
6. **NO borrar el proyecto** — es el insumo del render. NO tocar los proyectos existentes
   del usuario (son datos reales; si se navegan, bloquear la generación).
7. Registrar: textos completos generados + capturas de pantalla + errores de consola +
   fricciones reales sin edulcorar.

## TAREA 2 — WO-K5: Render v1.5 (el video usa las capturas)

Implementar `docs/12-media-kit/02-spec-render-v15.md` AL PIE DE LA LETRA. Resumen: cada
escena con `archivoCaptura` → la captura de fondo con zoompan (Ken Burns) sesgado a la
`zonaClave`; texto en pantalla = `dialogo` (el copy — JAMÁS volver a dibujar `accion`);
TTS local de cada `dialogo` (motor ElevenLabs ya existe en el back) + ducking existente +
`loudnorm` (el render actual sale a -30dB, eso se mata); placa final logo + `cta.principal`.
Retrocompat dura: sin kit/capturas → render idéntico al actual.

**Verificación obligatoria del render** (no reportar "listo" sin esto — ver
`D:\Code\base-compartida\15-CIERRE-VERIFICADO.md`): renderizar la pieza de la Tarea 1,
extraer 6-8 frames y MIRARLOS (capturas visibles, texto = copy, logo, placa CTA), medir
audio con `volumedetect` (mean > -22dB), duración coherente. La vara de calidad es
`public/bocetos/tour.mp4` (mirarlo antes de empezar).

## Reglas de esta fase (del dueño, no negociables)

- **Prototipo funcional, CERO lustre**: nada de pulido visual; el criterio es "next, next,
  y ver un reel como la gente".
- Gates antes de cada commit: `npx tsc --noEmit` + `npx eslint src/ --ext .ts,.tsx` +
  `npm test -- --pool=vmThreads` todo verde.
- Cierre verificado con evidencia (doc 15 de base-compartida); lo no verificado se dice
  "no verificado".
- No pushear. No inventar datos como reales (regla dura 11). Cero emojis (iconos lucide).
- Al terminar, dejar los servers levantados y reportar QUÉ quedó corriendo.

## Referencias

- Contrato del kit: `base-compartida/16-MEDIA-KIT-DIAGNOSTICO.md` · Cierre verificado: `base-compartida/15-CIERRE-VERIFICADO.md`
- Specs: `docs/12-media-kit/01-spec.md` (K1-K4, ya implementada) · `02-spec-render-v15.md` (K5, a implementar)
- Diagnóstico de por qué el render salía 1/10: reporte `docs/reportes/07-curaduria-circuito.html` + kit real en `D:\Code\EventMarker\media-kit\`
