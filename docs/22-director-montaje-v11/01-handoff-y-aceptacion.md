# Media Studio · Director de montaje V1.1 + V2 (handoff Claude)
Fecha: 2026-10-16 · Rama: `feat/director-montaje-v11-audiovisual` · PR #4

## Decisión arquitectónica

Partimos del PR #2 (fusionado en master). **NO** mezclar el PR #3, que mantiene otra representación de automatización (`music.automation[]` absoluto). La fuente de verdad es `MontajePlan`: Player, multipista y render deben derivar el mismo sonido/imagen. El LLM propone operaciones del vocabulario cerrado y el compilador puro puede descartarlas.

## Estado implementado en V1.1

1. **No destructivo:** export preserva metadata de `MontajeState`. `aplicarPropuestaMontaje` conserva `musicCues` existentes. Botón de IA ahora muestra propuesta pendiente, permite seleccionar operaciones y compara en Player de Remotion el plan original/resultado sin persistir. Sólo `Aplicar seleccionadas` escribe el nuevo plan. Versionado por huella JSON para rechazar una propuesta generada sobre otra versión de la edición. El deshacer global se deshabilita si el montaje se modificó desde la aplicación (si se restaura todo, perdería cambios manuales).
2. **IDs estables:** nueva propiedad opcional `MontajeScene.clipId` / `MusicCue.clipId`. Claves determinísticas para planes viejos; nuevas instancias del editor guardan su identidad única. La cue legacy por `escenaN` todavía puede ser ambigua si una pieza vieja ya duplicó escenas: después de editar y re-guardar, preferir nuevas claves.
3. **Ducking:** `duckRanges` agrupa palabras ASR del clip según tiempos reales; añade padding antes/después y usa el plano completo sólo si no hay ASR. Se interpreta por el mismo `derivarRender` en Player/MP4. La normalización final a -14 LUFS **no nivela personas por separado**.
4. **Acciones acotadas:** `offsetSec` opcional para anclajes musicales respaldados por ASR; `show_face` pide `insertId` si hay más de un inserto, y sólo quita el elegido.
5. **Vision opt-in, local:** `POST /api/montage-evidence` extrae un fotograma por clip, máximo cuatro clips, mediante ffmpeg; sólo archivos de `STORAGE_DIR`, con control `realpath`. El LLM de imágenes devuelve una descripción observable, sin inferir movimiento. Caché temporal de hasta 100 resultados por archivo/mtime/segundo; si no se puede acceder a la imagen, la dirección sigue con ASR/texto. **No funciona sobre Cloudinary si no hay copia local**.
6. **QA posrender opt-in:** `POST /api/render-qa` analiza MP4 local mediante ffmpeg y devuelve LUFS, true peak, silencios y tramos negros. Es auditoría técnica, no sustituto de oído humano ni comprensión visual. Interpreta negro como advertencia, nunca error definitivo.

## Protocolo manual indispensable — siete casos

- **Persistencia**: aplicar IA, conservar cues manuales, exportar, volver al paso, cambiar variante, comprobar estado/undo. Con modificación manual posterior el undo global debe estar deshabilitado.
- **Concurrencia**: pulsar IA, editar el plan en multipista antes de respuesta; la versión propuesta queda desactualizada y no puede aplicarse.
- **Split/duplicación**: duplicar escena, añadir cue a instancia concreta; reordenar, guardar, revisar tiempo en Player y exportar. Dividir toma y comprobar que se ancla sólo a la primera mitad.
- **Spot sobrio**: sin whoosh arbitrario, sin pausas cómicas obligatorias, final legible, palabras claras.
- **Humor con reacción**: observar frame y palabras reales, A/B, aplicar una pausa breve, comprobar que música se atenúa sin cortar voz y que realmente mejora el chiste.
- **Demo de pantallas**: `show_face` jamás retira más de un inserto sin ID, interfaz visible suficiente tiempo, marca legible.
- **Cierre presentadora**: no se superpone TTS adicional. Normalización final medida por `render-qa`, comparar Player y MP4 en hardware real.

## Cómo verificar

```bash
npm ci
node --check server/index.mjs
node --check server/montageEvidence.mjs
node --check server/renderQa.mjs
npx tsc --noEmit
npm test
npm run build
```

CI `.github/workflows/director-montaje.yml` cubre esta rama, PRs y master. Revisar último run del head antes de fusionar. **Los tests automáticos no acreditan calidad auditiva.**

## V2 aún pendiente: tareas sobre material REAL

1. **Nivelación por clip/actor antes de la mezcla:** obtener loudness y true peak por cada fuente con ffmpeg, calcular una compensación limitada (dB) y probar que no distorsiona ni rompe lip sync. Aplicar en el motor de preview y render de la misma manera. No llevar fuentes diferentes a -14 LUFS individualmente de forma ciega: sonoridad objetivo depende de diálogo/SFX/música.
2. **Análisis temporal multimodal:** 3-5 cuadros por clip, interpretación de continuidad del gesto/acción y timestamps con incertidumbre; distinguir "lo que se ve" de "lo que se supone". Capturas de Flow provenientes de Cloudinary requieren acceso temporal seguro, caché/costos/consentimiento.
3. **Keyframes de música dentro del multipista:** representar cues y permitir arrastrar puntos con snapping de palabra/beat; los cambios deben persistir igual que el plan y conservar su anclaje al duplicar/dividir.
4. **QA audiovisual semántico:** lectura de texto real en interfaz, clipping por fuentes, frases inaudibles, CTA truncado, frame congelado, contraste y marcas. Calibrar umbrales con verdaderos export, etiquetar falsos positivos. La implementación actual sólo ofrece checks objetivos de audio y negro.
5. **Comparación subjetiva real:** prueba A/B ciega contra edición manual, evaluar claridad de mensaje, naturalidad, ritmo, humor y recordación del cierre. Guardar notas por spot en fixtures curados.
6. **Cierre de seguridad:** autenticación/permisos y limitación global de peticiones para endpoints costosos si se exponen públicamente. Actualmente los presupuestos son por pedido y se inspeccionan rutas locales.

**Definición de terminado para una V2:** tres comerciales reales, misma mezcla percibida entre Player/MP4, mediciones por fuente registradas, ningún fallo de persistencia y revisión humana positiva. Hasta entonces, mantener la PR como draft.
