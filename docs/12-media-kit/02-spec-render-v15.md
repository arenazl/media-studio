# 12.02 — WO-K5: Render v1.5 — el video usa las capturas, el copy y la voz

> **Para el dueño:** esta es la última pata del arreglo. Hoy el render estampa direcciones
> técnicas sobre fondo vacío y sale mudo. Con esto, cada escena muestra TU captura real con
> movimiento (zoom suave hacia la zona clave), el texto en pantalla es el copy de venta,
> la narración va con voz TTS audible, y el cierre es tu logo + tu CTA. Es prototipo
> funcional: primero que el reel salga digno; el lustre fino viene después.

Vara de calidad: `public/bocetos/tour.mp4` (mockups reales + copy + atmósfera de marca).
Insumo de diseño: el proyecto de la prueba next-next (storyboard real de sinvueltas con
`archivoCaptura` + `dialogo` por escena + kit eventmarker con marca/cta).

## Alcance (prototipo funcional — directiva del dueño: cero lustre, que FUNCIONE)

**Por escena del plan de render (pieza animada):**
1. **Con `archivoCaptura`**: la captura (servida por `/api/media-kit/:id/file/...` o leída
   directo del disco en el server) como fondo 1080x1920 con **zoompan de ffmpeg** (Ken Burns
   suave: zoom 1.0→1.08 aprox). Si la pantalla del kit tiene `zonaClave`, sesgar el paneo
   hacia esa zona (mapeo grueso: "tercio superior" → paneo hacia arriba, etc.; si no se puede
   mapear, centro y listo — NO sobreingeniería de detección).
2. **Texto en pantalla = COPY, jamás la dirección técnica**: usar `dialogo` (la narración
   propagada) o un recorte corto de él. PROHIBIDO volver a dibujar `accion`. Tipografía y
   color de acento del `marcaKit` si están (fallback a los actuales). Escapar drawtext como
   ya se hace (apóstrofes — fix `b07f341`).
3. **Sin `archivoCaptura`**: placa como hoy PERO con el copy (`dialogo`) en vez de `accion`.
4. **Marca**: logo del kit en la posición de `brandKit.logoPos` como hoy; **placa final de
   CTA**: logo centrado + `cta.principal` del kit (si no hay kit, comportamiento actual).

**Audio (el fix del mudo, parte 2):**
5. **TTS de la narración**: generar la locución de cada `dialogo` con el motor TTS local que
   YA existe (ElevenLabs en el back, voces en español — ver módulo TTS del server). Colocar
   cada locución alineada al inicio de su escena; si la voz dura más que la escena, extender
   la escena hasta el fin de la voz (nunca cortar una frase).
6. **Mezcla audible**: música (si hay) con el ducking que ya existe + locución arriba, y
   **normalización final de loudness** (ffmpeg `loudnorm`, target I=-16 LUFS aprox). El
   render actual sale a -30dB — eso es el bug a matar. Verificar con `volumedetect`.

**Retrocompat dura:** piezas sin kit y sin `archivoCaptura`/`dialogo` → render byte-comparable
al actual (mismos filtros de siempre). Nada de lo nuevo rompe lo viejo.

## Dónde tocar (el implementador verifica contra el código real)

- El render por aspecto ya lee `plan.width/height/fps` (WO-3 del cableado). Buscar el
  ensamblador en `server/` (endpoint de render/montaje) y extender la construcción de
  filtros por escena. El molde ya asigna `archivoCaptura` (WO-K4, commit `0a13ac1`).
- El TTS local ya existe en el back (memoria: ElevenLabs, key en .env, voces filtradas a
  español) — reusar, no reinventar. Si el TTS no está configurado (sin key), degradar con
  gracia: render sin voz + WARNING explícito en la respuesta (jamás silencio silencioso).
- Timeouts: un render con zoompan + TTS tarda más — respetar/ajustar el timeout aprendido
  (C10 del correctivo: renders de miles de ms).

## Gates y cierre (regla 21 + prototipo)

- tsc + eslint (0 errores, warnings sin crecer) + vitest todo verde (tests de: construcción
  de filtros con/sin captura, copy nunca = accion, loudnorm presente, retrocompat sin kit).
- **Verificación real obligatoria**: renderizar la pieza de la prueba next-next (proyecto
  sinvueltas con kit) y (a) extraer 6-8 frames y MIRARLOS (capturas reales visibles, texto
  = copy, logo, placa CTA), (b) medir audio con volumedetect (mean > -22dB), (c) duración
  coherente con el plan. Evidencia en el reporte.
- Commits con add explícito (WIP ajeno intacto, técnica del `0d0f014` si hace falta). Sin push.
- Al terminar: avisar para que el director releve el server y haga el smoke test (nivel 3).
