# 12 — Media Studio consume el MEDIA KIT de las apps

> **Para el dueño:** hoy los reels animados salen 1/10 porque el pipeline nunca tuvo imágenes
> reales de las apps — solo descripciones de texto. El nuevo contrato (base-compartida/16)
> hace que cada app deje `media-kit/` en su repo con capturas reales + marca completa +
> momentos. Esta spec son los arreglos para que Media Studio lo DESCUBRA, lo importe al crear
> el proyecto, lo MUESTRE en los pasos intermedios (nada de sorpresas al final) y lo use en
> los moldes. El render con las capturas (v1.5) va en la tanda siguiente, contra el primer
> kit real.

Contrato fuente: `D:\Code\base-compartida\16-MEDIA-KIT-DIAGNOSTICO.md` (leerlo ENTERO antes de tocar código).
Contexto de la fuga que esto arregla: reporte `docs/reportes/07-curaduria-circuito.html` + el análisis
del reel de sinvueltas (storyboard con `dialogo:""` en todas las escenas; render sin assets).

## WO-K1 — Server: descubrir y servir los kits

- `GET /api/media-kit` → lista de kits descubiertos escaneando `D:\Code\<carpeta>\media-kit\media-kit.json`
  (solo primer nivel de D:\Code, sin recursión profunda). Devuelve por kit: `id`, `app`, `generado`,
  cantidad de pantallas/momentos, y si el JSON es válido contra el contrato (campos mínimos:
  id, negocio, marca, pantallas). Sin cache persistente: se escanea on-demand (mismo espíritu que el KSP).
- `GET /api/media-kit/:id` → el JSON completo del kit.
- `GET /api/media-kit/:id/file/<relpath>` → sirve logo/capturas/fonts desde la carpeta del kit.
  Sanitizar `relpath` (prohibido `..`/absolutos — anti path traversal) y solo extensiones de
  imagen/fuente. El front SIEMPRE referencia las imágenes vía este endpoint (nunca file://).
- El `id` del kit debe matchear el id del registro KSP; si un kit no matchea ninguna app del
  registro, igual se lista (marcado `sinRegistro: true`) — el kit puede llegar antes que el KSP.

## WO-K2 — Tipos + import en el Wizard

- Tipo `MediaKit` en `src/lib/` espejando el contrato (campos opcionales tolerantes: el kit
  puede venir incompleto; validar lo mínimo y degradar con gracia).
- Wizard (paso app fuente): si la app elegida tiene kit descubierto → badge "Media kit ·
  N capturas" + **preview de las capturas en grilla chica** (el dueño VE la materia prima
  antes de crear). Si no hay kit, todo sigue como hoy (KSP on-demand).
- Al crear el proyecto con kit: además de lo que ya se guarda (brief/screens/brandKit del KSP),
  estampar en el Project: `mediaKitId`, `cta`, `momentos`, y las pantallas del kit con su
  `archivo` (URL al endpoint), `zonaClave`, `microAnimacion`, `datosVisibles`. El `brandKit`
  actual ({name,color,logoUrl,phonetic,logoPos}) NO cambia de shape — se agrega un campo
  opcional `marcaKit` con la ficha completa (colores, tipografías, estiloUI, variantes de logo).
  RETROCOMPAT DURA: proyectos existentes sin estos campos siguen funcionando idénticos.
- Si el kit trae `negocio` (hechos crudos), el brief del proyecto se arma desde ahí
  (mismo formato markdown que hoy genera el KSP), con las `sugerencias` en una sección aparte
  claramente marcada como opinión de la app.

## WO-K3 — Las piezas VISIBLES en los pasos intermedios (pedido explícito del dueño)

- **PasoStoryboard**: cada escena que referencia una pantalla muestra el THUMBNAIL de la
  captura asociada (clickeable para verla grande). Selector simple por escena para
  cambiar/asignar la pantalla del kit.
- **PasoConcepto y PasoGuion**: tira horizontal chica con las capturas disponibles del kit
  ("estas son las piezas con las que se arma el video"), solo lectura.
- Sin kit: los pasos se ven exactamente como hoy.
- Estilo: tokens `--rd-*`/paso-* existentes, iconos lucide, CERO emojis.

## WO-K4 — Moldes que usan el kit + fix de la fuga narración→storyboard

- `concept`, `script`, `storyboard` (server/functions.mjs): si `piece.mediaKit` está presente,
  interpolar las pantallas REALES (label + queDemuestra + microAnimacion) y los `momentos`
  como insumo del prompt. RETROCOMPAT byte-idéntica sin kit (mismo criterio que el molde
  concept del commit `0d0f014` — verificar con test).
- **FIX CRÍTICO (independiente del kit): el molde `storyboard` debe PROPAGAR la narración del
  guion** — cada escena sale con `dialogo` = la narration del bloque correspondiente del guion
  (hoy llega `""` en todas y el render queda mudo). Test que lo verifique.
- Escena del storyboard: campo nuevo opcional `archivoCaptura` (relpath del kit) para que el
  render sepa qué imagen usar. El molde lo asigna matcheando `screen`/momento.

## WO-K5 — Render v1.5 (NO en esta tanda; se implementa contra el primer kit real)

Escena con `archivoCaptura` → la captura como fondo con zoompan (Ken Burns) hacia `zonaClave`,
texto en pantalla = copy del guion (JAMÁS la dirección técnica), narración TTS del `dialogo`
con loudness normalizado. Sin captura → comportamiento actual. Queda especificado para
diseñarlo con las capturas reales de sinvueltas sobre la mesa.

## Gates y cierre (regla dura 21)

- `npx tsc --noEmit` + `npx eslint src/ --ext .ts,.tsx` (0 errores, warnings sin crecer) +
  `npm test -- --pool=vmThreads` todo verde.
- Kit DEMO de fixtures para tests (marcado `[DEMO]` en textos, imágenes placeholder generadas,
  regla dura 11), en la carpeta de tests — NO en D:\Code suelto.
- Verificación en vivo por el implementador con capturas; smoke test final del director aparte.
- Working tree con WIP ajeno: commits con `git add` explícito de archivos propios; técnica
  quirúrgica si un archivo tiene WIP mezclado (patrón commit `0d0f014`). PROHIBIDO `git add -A`.
