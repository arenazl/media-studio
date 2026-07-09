# Fase 4 — Montaje profesional + Export (salida 2)

> **Prerrequisito:** Fases 1-3 (hay storyboard con tomas importadas y vinculadas).
> **Shippable:** al terminar, "Exportar" produce el mp4 final 9:16 con clips + voz + música con
> ducking + silencio estratégico + transiciones, y queda registrado en el comercial.
> **Es la fase más técnica.** Leé los hallazgos primero: explican por qué no alcanza con "cablear
> un botón".

## Hallazgos de la auditoría (los "no produce salidas profesionales")

1. **El editor NO produce ningún mp4.** No existe botón de render: NINGÚN componente llama a
   `/api/render` ni `/api/assemble` (verificado por grep). `buildPlan` (reelTimeline.ts) alimenta
   SOLO el preview de audio del navegador. (El doc de editor v2 marca el render como "hecho" — es
   falso en HEAD.)
2. **Hay TRES sistemas de montaje incompatibles**: el editor front (timeline por píxeles), 
   `/api/render` (solo IMÁGENES jpg + 1 audio ya mezclado), y `/api/assemble` (2 familias con
   tiempos HARDCODEADOS — familia B = 18.0s exactos). Ninguno recibe el shape del editor.
3. **El ducking existe SOLO en el preview** (`montageAudio.ts`, DUCK_GAIN=0.4): ni `exportMix`
   (música a volumen fijo) ni `renderMp4` ni `assemble` lo aplican. **Lo que escuchás no es lo que
   exportás.**
4. **No hay trim (in/out)**: los clips de Flow entran enteros (offset=0 fijo en buildPlan) y
   siempre traen colas para descartar.
5. **Las transiciones son clips flotantes** que el usuario posiciona a ojo — no están atadas a los
   cortes reales, se desalinean al mover cualquier cosa.
6. **No existe "silencio estratégico"** — la música es un bed continuo con loop.
7. El montaje se persiste **en píxeles** (`x/w` a PX_PER_SEC=80) por canal, sin concepto de escena.

## Diseño

### 1. El plan semántico (`src/lib/montajePlan.ts` — NUEVO)

La pieza central que falta: un plan **en SEGUNDOS, por escena** — el shape único que entienden el
preview Y el render (mata la incompatibilidad de los 3 sistemas):

```ts
interface MontajePlan {
  width: 1080; height: 1920; fps: 30;
  scenes: {                    // en orden; los tiempos se DERIVAN (acumulando dur), no se guardan
    escenaN: number;
    src: string;               // fileRef RELATIVO de la toma activa (public_id de saveAsset)
    in: number; out: number;   // trim dentro del clip crudo (default: 0 → durSec de la escena)
    audio: 'keep' | 'mute';    // ⚠ CLAVE: los talking heads de Flow traen el DIÁLOGO lip-synced
                               //   EN el audio del clip — 'keep' lo mezcla al master (default para
                               //   escenas con dialogo), 'mute' para b-roll con sonido sucio
    audioGain?: number;        // default 1
    transition?: 'cut'|'fade'|'crossfade'|'wipe'|'zoom';   // hacia la escena SIGUIENTE
    effect?: string;           // los 8 efectos existentes de renderMp4
  }[];
  voice?: { src: string; at: number };                       // voz en off de VoiceStudio (opcional)
  music?: { src: string; gain: number; duck: boolean };
  // silencios ANCLADOS A ESCENA (sobreviven a trims/reordenes): from/to absolutos se derivan al armar
  silences: { antesDeEscena: number; durSec: number }[];     // el corte de música antes del gag
  texts: { text: string; preset: string; at: number; dur: number; nx?: number; ny?: number }[];
  logo?: { src: string };
}
```

**Regla de audio (fix del bloqueante "talking heads mudos"):** el audio del comercial es la mezcla
de TRES fuentes — (1) el audio propio de cada escena con `audio:'keep'` (el diálogo de los actores),
(2) la voz en off (si hay), (3) la música. Los rangos de **ducking** de la música se derivan de la
voz en off **Y de las escenas cuyo storyboard tiene `dialogo`** (la música baja debajo de TODO lo
hablado). `storyboardToMontaje` setea `audio:'keep'` en escenas con `dialogo` y `'mute'` en b-roll.

- `storyboardToMontaje(comercial)` → `MontajePlan` inicial: escenas en orden del storyboard, cada
  una con su toma activa, `out = min(durSec de la escena, durSec real de la toma)`,
  `audio:'keep'` si la escena tiene `dialogo` (si no `'mute'`), transición default `cut` (y `fade`
  hacia el CTA), un silencio sugerido de 0.8s ANTES de la escena `gag` (el "toque final" del
  workflow de referencia — el usuario lo puede quitar), y **preselección de música**: el track de
  `music.ts` que mejor matchee el `guion.music.mood` (por keyword; si no matchea, ninguno — cubre
  la "música elegida por ritmo" del workflow de referencia como sugerencia, no imposición).
- `montajeToScheduled(plan)` → los `ScheduledClip[]` de `montageAudio.ts` para que el preview del
  editor (que YA tiene ducking real) suene EXACTAMENTE como el export.
- **Persistencia (decisión fijada):** la fuente de verdad del montaje es
  `comercial.montaje = { plan: MontajePlan; exports: [...] }`, persistido vía `saveProject` como
  todo lo demás (regla server-first de fase 2). `montageStore` (localStorage en px) queda SOLO como
  cache de UI derivada del plan — nunca al revés. Conversores px↔plan para el editor actual.
- Tests puros de todo lo anterior (vitest) — incluye: rangos de ducking derivados de voz en off +
  escenas con diálogo replican la lógica de `scheduleDuck`; derivación from/to de los silencios
  `antesDeEscena`.

### 2. El render real (`server/renderComercial.mjs` — NUEVO + endpoint)

`POST /api/render-comercial { plan: MontajePlan, projectId, reelId }` → mp4 **persistido**.

Construcción ffmpeg (TODO reutilizado de lo battle-tested; requiere ffmpeg ≥ 4.2 por `-to` de input):
- **Video:** cada escena = input de VIDEO con `-ss in -to out` (trim de input; los timestamps se
  resetean, así los offsets acumulados cierran) + `SC` (scale/crop 1080×1920 + fps/setsar,
  assemble.mjs:12 — es lo que xfade exige entre inputs) → cadena `xfade` encadenada. Referencias:
  filtros por escena en `sceneFilterChain` (index.mjs:292-305); **la matemática de offsets del
  xfade está DENTRO de `renderMp4` (index.mjs:351-363)** — extenderla de inputs jpg a video.
- **Logo:** overlay abajo-izquierda (patrón assemble.mjs:40-43).
- **Textos:** `drawtext` con los presets del canal de texto del editor.
- **Audio (las TRES fuentes):**
  - **Audio de escenas** (`audio:'keep'`): por cada toma `[i:a]atrim=in:out,asetpts=PTS-STARTPTS,
    adelay=<offset acumulado de la escena>` → entra al `amix` (patrón assemble.mjs:45-55 — la
    familia A ya mezclaba así el audio del presenter).
  - **Voz en off** (si hay): `adelay` + volumen (patrón assemble.mjs:88).
  - **Música:** `volume=<gain>` base + **ducking** con rangos `[from,to]` derivados de la voz en
    off Y de las escenas con diálogo → cadena `volume=0.4:enable='between(t,from,to)'` (mismo
    DUCK_GAIN=0.4 del preview). Nota: los `enable` son escalones sin rampa → puede clickear en los
    bordes; aceptado en v1 (el preview usa linearRamp — mejora futura: micro-rampas con
    `volume=expr`). **Silencios:** `volume=0:enable='between(t,from,to)'` (from/to derivados de
    `antesDeEscena`).
  - Mezcla final `amix=inputs=N` + `afade=t=out` en el cierre (patrón assemble.mjs:53-55).
- **Archivos:** `src` es el `public_id` RELATIVO → mapear DIRECTO a `STORAGE_DIR/<rel>` (sin HTTP a
  sí mismo); `resolveFileRefs` (existente) queda solo para URLs externas/dataURLs. Ejecución con
  `runFfmpeg` (existente).
- **Persistir:** el mp4 va a `saveAsset(<buffer>, 'comercial-<reelId>-<n>.mp4', <projectId>)` y se
  registra `comercial.montaje.exports[] = { fileRef, createdAt }` (extender el tipo). La respuesta
  devuelve `{ fileRef }` — el front NO recibe bytes efímeros.

### 3. La pantalla MONTAJE (paso 8)

- Reusa `ReelEditor` como base, PERO se inicializa con `storyboardToMontaje` (botón "Armar desde el
  storyboard") en vez de nacer vacío. Los clips quedan ETIQUETADOS por escena (badge `E3 · gag`).
- Controles nuevos: trim de clip (in/out con drag en los bordes — el resize ya existe, hay que
  mapearlo a `in/out` en vez de solo `w`), toggle de ducking, y "Silencio" como elemento
  posicionable (se pinta sobre el canal de música).
- Las transiciones dejan de ser clips flotantes: selector de transición EN el corte entre escenas
  (click en la unión → menú). Migrar el canal de transiciones a esto.
- La voz: botón "Voz en off" abre VoiceStudio (flujo existente) y al volver usa `voiceConfig.audioRef`.
- **Botón "Exportar mp4"** → preview de confirmación (duración total, escenas, música) →
  `POST /api/render-comercial` → progreso → link al mp4 (`/api/storage/...`) + botón descargar.
  ESTE es el botón que hoy no existe.

### 4. Limpieza

- `MontajeTab.tsx` (placeholder muerto "Próximo bloque") → BORRAR.
- `/api/render` (solo imágenes) queda como está (lo usa… nadie; se marca deprecated en el header
  del handler y se elimina en fase 5 si nadie lo reclamó).
- `/api/assemble` + `assemble.mjs`: mantener (lo usa mkreels manual) pero anotar que el flujo
  nuevo NO pasa por ahí.

## Qué NO hacer

- NO reescribir el editor visual desde cero — se adapta el existente (drag/snap/preview andan).
- NO implementar sidechaincompress "de verdad" — los rangos con `enable=between` replican el
  preview y alcanzan; anotar como mejora futura.
- NO renderizar en el cliente (MediaRecorder/canvas) — el render es SIEMPRE ffmpeg server-side.

## Verificación

1. Suite estándar verde + `node --check server/renderComercial.mjs`.
2. Tests de `montajePlan` (derivación de tiempos, rangos de ducking = scheduleDuck, px↔seg).
3. **End-to-end real:** con 2-3 clips CON AUDIO HABLADO importados como tomas → "Armar desde el
   storyboard" → agregar música → exportar → verificar el mp4 con ffprobe (1080×1920, duración
   esperada) y A OÍDO: **el diálogo de los talking heads SE ESCUCHA en el mp4**, la música BAJA
   debajo de todo lo hablado (diálogo de clips Y voz en off), y hay SILENCIO antes del gag.
4. El preview del editor y el mp4 exportado suenan igual (misma estructura de ducking).
5. El export queda en `server/storage` y registrado en el comercial (F5 → sigue el link).
