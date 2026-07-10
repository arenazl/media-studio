# Copiloto del pipeline — panel de guía contextual a la derecha

> **Para quién:** Opus implementador. Autosuficiente. **Fable especifica; Opus implementa.**
> **Origen (2026-07-10):** el dueño en Pack Flow — "media pantalla vacía al pedo" + "no entiendo qué
> tengo que hacer, hay un master y abajo más cosas… necesito que me vaya guiando paso a paso, qué
> copio y dónde lo pego en Flow". Dos problemas de una: (a) el contenido del paso deja mucho vacío a
> la derecha/abajo; (b) la app no explica el proceso. El copiloto resuelve ambos.

## Qué es

Un **panel lateral fijo a la derecha** (aside sticky) que acompaña TODO el pipeline y, para el paso
activo, explica en criollo: **qué es**, **qué hizo la IA**, y sobre todo **qué tenés que hacer vos**
(pasos numerados). Es **dinámico**: refleja el estado real (progreso, si falta elegir, cuántos clips
copiaste) y resalta el próximo paso concreto. Llena el vacío horizontal Y da la guía que falta.

## Restricción

Toca SOLO presentación + un componente nuevo + contenido. NO toca lógica de estado/persistencia/
endpoints/moldes. Los tests siguen verdes sin modificarlos. Gates + 5 reglas de contingencia
(`base-compartida/8-REGLAS-CALIDAD-CODIGO.md` §Regla 2) — incluido capturar el estado PERSISTIDO, no
solo el happy path, y probar con datos reales (paso con contenido y paso vacío).

## Layout (WO-C1)

- El área del paso pasa a **2 columnas**: contenido principal (izquierda, flexible) + **copiloto**
  (derecha, ancho fijo ~340-380px, `position: sticky; top` bajo el stepper). Contenedor a
  `max-width` amplio (~1440px) para que las dos columnas respiren en monitores anchos.
- **Responsive:** < ~1100px el copiloto pasa ABAJO del contenido (no al costado) o a un drawer
  colapsable. Nunca tapa el contenido ni fuerza scroll horizontal.
- **Toggle:** botón para ocultar/mostrar el copiloto (algunos lo van a querer plegado). Persistir el
  estado abierto/cerrado en `settings.ts` (patrón de `getAiModel`). Default: **abierto**.
- Estilo: tokens `--st-*`. El panel es una superficie elevada (`--st-bg-1`/`bg-2`), con secciones
  claras. Ícono lucide por sección. Cero emojis. Se integra con la "consola de estudio".

## Estructura del panel (WO-C2)

Por paso, el copiloto muestra estas secciones (las que apliquen):

1. **Encabezado** — nombre del paso + una línea de "qué es".
2. **Qué hizo la IA** — 1-2 líneas (aparece solo si el paso ya generó contenido).
3. **Qué tenés que hacer** — LISTA NUMERADA de pasos concretos. Los ítems ya cumplidos se marcan
   (check); el próximo se resalta. Acá está el valor.
4. **Tip** — 1 consejo de calidad (del reporte de mejores prácticas, docs/reportes/02).
5. **Estado/progreso** — cuando aplica, un contador dinámico (ej. Pack Flow "2/4 copiados").

El contenido vive en un mapa por `PasoId` (`src/lib/copiloto.ts`, datos puros, con test). Los pasos
que dependen del estado reciben el `comercial`/`estado` para calcular el progreso y qué ítem resaltar.

## Contenido por paso (texto base — el implementador lo puede pulir, NO inventar el proceso)

**Negocio** · Qué es: los hechos del negocio, la materia prima de todo. · Hacé: 1) Revisá que el
brief tenga la propuesta completa y la marca fonética. 2) Cuanto más concreto, mejor sale todo. ·
Tip: si el brief es flojo, las piezas salen genéricas.

**Concepto** · Qué es: la idea del comercial (2-3 propuestas). · Hizo la IA: propuso ideas con tono,
estética y referencia. · Hacé: 1) Tocá "Generar con IA" si está vacío. 2) Compará las propuestas.
3) Elegí una (es TU decisión creativa, la IA no elige). 4) Definí Filmado o Animado. · Tip: si las
propuestas se parecen, regenerá.

**Guion** · Qué es: el guion por bloques (hook → desarrollo → remate → CTA). · Hizo la IA: escribió
la narración calibrada para que entre en el tiempo. · Hacé: 1) Generá si está vacío. 2) Leé cada
bloque EN VOZ ALTA. 3) Editá lo que no suene natural (se guarda solo). 4) Regenerá un bloque suelto
si no te cierra. · Tip: el hook son los primeros 2 segundos — sin logo, que enganche.

**Cast** · Qué es: los personajes y la locación, con descripción exacta. · Hizo la IA: definió cada
personaje con su ficha física (se pega igual en todos los prompts = misma cara en todos los clips).
· Hacé: 1) Generá. 2) Revisá que la descripción sea específica y con sentido para el rubro. 3)
Pulila una vez, con detalle. · Tip: "una mujer joven" no alcanza; cuanto más exacta la ficha, más
consistente el actor.

**Storyboard** · Qué es: las escenas numeradas con diálogo y tiempos. · Hizo la IA: armó el plano,
la duración, el diálogo y la continuidad de cada escena. · Hacé: 1) Generá. 2) Revisá que los
diálogos entren en su tiempo. 3) Regenerá una escena si hace falta. · Tip: los talking heads son 8s
mínimo — una frase entera se dice en 8 segundos.

**Pack Flow** (EL que disparó esto — que quede impecable) · Qué es: los prompts para pegar en Google
Flow (Veo 3) y generar los videos. · Hizo la IA: armó 1 prompt maestro + 1 por clip, con los
personajes consistentes. · Hacé (numerado, con progreso 0/N copiados): 1) Copiá el MASTER (botón
"Copiar master") y pegalo UNA vez en Google Flow. 2) Copiá el clip #1 (icono copiar de la fila),
pegalo en Flow, generá 2-3 veces y elegí la mejor toma, bajá el mp4. 3) Repetí con cada clip
(#2, #3, #4). 4) Con los clips bajados, pasá a Rodaje e importalos. · Tip: no edites los prompts a
mano en Flow — si querés otra idea visual, usá el botón Regenerar del clip (mantiene la cara del
actor). · Estado dinámico: "X/N copiados · Y importados"; resaltar el próximo clip sin copiar.

**Rodaje** · Qué es: importás acá los clips que bajaste de Flow, escena por escena. · Hacé: 1) En
cada escena, importá su clip. 2) La app avisa si un clip quedó más corto que la escena. 3) Elegí la
mejor toma. · Tip: en escenas con diálogo, el audio del clip es el audio del comercial — elegí voz
limpia. · Estado: "X/N escenas con clip".

**Montaje** · Qué es: se arma el comercial y se exporta el mp4. · Hizo la IA/app: ordenó las escenas,
puso la música según el mood, el silencio antes del remate y el ducking. · Hacé: 1) "Armar desde el
storyboard". 2) Sumá la voz en off (o "usar la voz grabada") y elegí música. 3) "Chequear calidad"
ANTES de exportar (apuntá a 38+). 4) Exportá el mp4. · Tip: el export se bloquea si falta un clip —
completá el rodaje primero.

**Publicar** · Qué es: el paquete para postear (caption, hashtags, CTA, hook en pantalla). · Hacé:
1) Generá. 2) Copiá cada bloque. · Tip: la primera línea del caption es el gancho.

## Assets de marca descargables (WO-C3)

Pedido del dueño (2026-07-10): *"todo lo que sea branding me lo tiene que dejar DENTRO de la
aplicación, no tengo que ir a una carpeta a buscar el logo — para poder mandárselo a Flow"*.

- **Bloque "Marca" en el Pack Flow** (arriba, cerca del MASTER) y también en el **copiloto**: muestra
  los assets del `project.brandKit`:
  - **Logo**: preview + botón **"Descargar logo"**. Si `logoUrl` es un dataURL → `<a download>`
    directo. Si es URL externa (caso Munify, host sin CORS — hallazgo conocido del rework UI) → un
    **proxy en el server** `GET /api/brand-asset?url=<encoded>` que descarga y lo sirve como
    `Content-Disposition: attachment` (whitelist de esquema http/https; NO SSRF a hosts internos —
    validar). Así el download nunca falla por CORS.
  - **Colores** de marca (accent/primary): chips con el hex, click = copiar al portapapeles.
  - **Marca fonética** (cómo se pronuncia): copiable — el usuario la puede necesitar.
- **En la guía del copiloto (Pack Flow)**, una línea honesta sobre el logo: *"Descargá el logo acá si
  querés subirlo a Flow como referencia de marca. Ojo: el logo FINAL se pega solo en el Montaje (el
  render lo sobreimprime en el mp4), así que no dependas de que Flow lo dibuje exacto."*
- Si el `brandKit` no tiene logo/colores → el bloque no aparece (o dice "este proyecto no cargó
  branding"). Nada de placeholders vacíos.

## Claridad del Pack Flow (WO-C4) — dudas reales del dueño (2026-07-10)

El dueño en el Pack Flow: *"¿por qué el master está ahí y los otros no tienen el mismo sistema para
abrir? ¿por qué dicen todos PENDIENTE? ¿cuál es la diferencia entre el master y los de abajo?"*. La
UI no comunica el modelo mental. Arreglar SIN tocar lógica:

- **Distinguir MASTER de CLIPS explícito.** El MASTER es la "biblia" (estilo + personajes + locación,
  se pega 1 vez para consistencia). Los #1..#N son los prompts POR ESCENA (1 video de 8s c/u). Hoy el
  usuario no lo entiende. Fix: un sub-encabezado/etiqueta clara — ej. sobre el master "PEGÁ ESTO
  PRIMERO — define el estilo y los personajes (una sola vez)"; sobre la lista de clips "UN PROMPT POR
  ESCENA — generá un video con cada uno". Una línea, no un párrafo.
- **Unificar el patrón visual master ↔ clips.** Hoy el master tiene un botón grande "Copiar master"
  y los clips iconitos chicos → parecen dos sistemas distintos aunque ambos colapsan/copian igual.
  Unificar: mismo componente de fila colapsable con las MISMAS acciones (copiar / [regenerar solo en
  clips] / expandir), el master como una fila destacada del mismo sistema, no un widget aparte.
- **Leyenda de estados.** PENDIENTE / COPIADO / IMPORTADO no se explican. Sumar una mini-leyenda (o
  tooltip en el badge): *"pendiente = sin copiar · copiado = ya lo pegaste en Flow · importado = ya
  trajiste el video a Rodaje"*. El copiloto lo refuerza.

## WOs

| WO | Alcance | Toca |
|----|---------|------|
| **C1** | Layout 2 columnas + panel sticky + toggle persistente + responsive | `Pipeline.tsx` (envoltura del paso), `Pipeline.css`, `settings.ts` |
| **C2** | Componente `Copiloto` + datos `src/lib/copiloto.ts` (mapa por paso, con test) + el progreso dinámico por paso | `src/Copiloto.tsx` (nuevo) + css, `src/lib/copiloto.ts` (nuevo + test) |
| **C3** | Bloque "Marca" con logo descargable (+ proxy server para CORS) + colores/fonética copiables | `src/pasos/PasoPack.tsx`, `server/index.mjs` (endpoint proxy, con validación anti-SSRF), css |
| **C4** | Claridad del Pack Flow: master vs clips explícito + unificar patrón visual + leyenda de estados | `src/pasos/PasoPack.tsx`, css |

## Gates (obligatorios)

- tsc 0 · eslint 0 · `npx vitest run --pool=vmThreads` verde (+ tests de copiloto.ts) · stylelint 0 ·
  build leyendo la salida COMPLETA sin warnings nuevos.
- **Gate visual (captura + mirar):** el paso Pack Flow del proyecto `munify-ejemplo` con el copiloto
  al costado a 1440 Y a ~1000px de ancho (responsive) — ¿el vacío de la derecha se llenó? ¿el
  ritual de Flow se entiende? ¿algún paso con poco contenido sigue dejando un hueco? Capturar Pack
  Flow (con contenido) y un paso vacío (empty). Guardar en `docs/10-copiloto/capturas/`.
- Cierra con reporte visual `docs/reportes/04-copiloto.html` (+PDF) mostrando el panel en 2-3 pasos.
