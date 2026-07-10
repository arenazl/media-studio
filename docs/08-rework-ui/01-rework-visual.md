# Rework visual — el pipeline se ve como una consola de estudio, no como un formulario

> **Para quién:** Opus implementador. Autosuficiente — no hace falta releer el rework funcional
> (docs/07-rework) salvo que un shape no cierre. **Fable especifica, Opus implementa** (ruteo §7 del
> protocolo 13-REWORK).
>
> **Origen (2026-07-10):** el dueño entró a la app y la describió como "un ASP clásico de 2005".
> Diagnóstico: (a) un comentario CSS auto-cerrado mataba el bloque `.pipe` entero — ya corregido en
> un WO aparte; (b) el rework funcional (07) definió comportamiento y datos pero JAMÁS una dirección
> visual, y ningún gate obligaba a mirar la pantalla. Este doc cierra (b).
>
> **Cómo ejecutar:** WOs UI-1 → UI-5, EN ORDEN, un commit por WO (`feat(ui): UI-<N> — <título>`), de
> corrido y sin pedir OK por WO. Checklist por WO al final (§Gates — incluye las 5 reglas de
> contingencia de `base-compartida/8-REGLAS-CALIDAD-CODIGO.md` §Regla 2; la salida de CADA comando
> se lee COMPLETA, no el tail).

---

## 0. Restricción dura (no negociable)

**SOLO presentación.** Se tocan: CSS, estructura JSX/className, iconos, micro-interacciones.
**NO se toca:** lógica de estado, persistencia (App dueño único + mutador), endpoints, moldes,
tests, contratos de props funcionales (`PasoProps`, `setComercial`, `onChange`). Los 174 tests deben
seguir verdes SIN modificarlos. Si un cambio visual parece requerir tocar lógica → anotarlo como
hallazgo y seguir sin tocarla.

## 1. Dirección de arte (la vara)

**"Consola de estudio de producción"** — referencia mental: DaVinci Resolve / Frame.io / Linear.
El usuario produce COMERCIALES acá; la herramienta tiene que sentirse una mesa de dirección, no un
admin de formularios.

- **Dark cinematográfico con profundidad real:** base casi negra con tinte frío; las superficies se
  elevan por capas (fondo → panel → tarjeta → elemento activo) con bordes sutiles Y sombra — la
  jerarquía se tiene que VER. Nada de flat total ni de tarjetas que se funden con el fondo.
- **La marca ya tiene un lujo discreto:** el logo "Media Studio" es serif dorado. Explotarlo:
  **dorado = identidad/creativo** (títulos display, momentos de dirección creativa: el concepto
  elegido, el remate del guion). No pintarlo por todos lados — el dorado vale porque es escaso.
- **Acentos por semántica, no decoración:** azul eléctrico = acción/generación IA · verde = aprobado/
  listo · ámbar = atención/hook · violeta = animado/remate · rojo = error. SIEMPRE el mismo
  significado en todas las pantallas.
- **Tipografía con carácter:** serif display (la del logo — Playfair Display, ya usada en
  `server/mockupReel.mjs`) para los títulos de paso y números grandes; sans del sistema para UI;
  mono para prompts/tiempos (tabular). Escala real: título de paso 28-30px, no 20.
- **Anti-template (política del dueño, obligatoria):** cero uniformidad perezosa — jerarquía por
  escala, ritmo de espaciado intencional, hover/focus/active diseñados en TODO interactivo,
  profundidad por capas. Si una pantalla parece "un default de Tailwind", está mal.
- **Motion sobrio:** transiciones 150-200ms en hover/estado; el paso activo del stepper respira
  (elevación, no parpadeo). `prefers-reduced-motion` respetado.

## 2. Tokens (UI-1) — `src/styles/studio.css`

Archivo NUEVO de design tokens, importado una vez en `main.tsx` (antes que el resto). Todas las
pantallas consumen tokens; **prohibido hex suelto** en CSS de componentes (gate: grep). Definir en
`:root` con prefijo `--st-`:

```
Fondos:    --st-bg-0 (base casi negra ~#0b0e14) · --st-bg-1 (panel) · --st-bg-2 (tarjeta) · --st-bg-3 (elevado/activo)
Líneas:    --st-line-1 (sutil) · --st-line-2 (definida)
Texto:     --st-text-1 (alto) · --st-text-2 (medio) · --st-text-3 (dim)
Acentos:   --st-gold (identidad, el del logo) · --st-blue (acción IA) · --st-ok · --st-warn · --st-violet · --st-danger
Tipos:     --st-font-display (serif) · --st-font-sans · --st-font-mono
Forma:     --st-r-s/m/l (radios) · --st-shadow-1/2 (sombras de capa)
Espacio:   escala 4/8/12/16/24/32/48
```

Elegir los valores exactos con criterio de contraste: tarjeta vs fondo debe distinguirse a simple
vista en un monitor común (el problema actual: superficies a 3% de delta que desaparecen).
`Pipeline.css`, `App.css` y los CSS de pasos MIGRAN a estos tokens (las variables `--pipe-*` mueren).

## 3. Shell + stepper (UI-1)

- **Topbar:** conservar estructura; subir presencia de marca (serif dorado), tabs de sección como
  segmented control con estado activo definido; altura contenida (~52px).
- **Columna de contenido:** SIEMPRE centrada, max-width ~1180px, padding lateral generoso. En
  ultrawide el fondo respira alrededor — jamás texto full-bleed (gate: medición a 3440px).
- **Stepper → riel de producción:** dejar de ser pills sueltas. Un riel horizontal conectado
  (línea de progreso que se va pintando), cada paso un NODO: círculo con número o check + label +
  color por estado (pendiente `text-3` · generado azul · editado ámbar · aprobado verde). El paso
  activo: nodo elevado (bg-3 + borde acento + sombra). Debe leerse de un vistazo "estoy en el paso
  5 de 9 y aprobé 4".

## 4. Patrón de pantalla de paso (UI-2, se replica en todos)

`PasoShell` (ya existe en `pasoKit.tsx`) es el molde visual único:

- **Header:** título en serif display 28-30px + subtítulo `text-2` · a la derecha las acciones:
  **"Generar con IA" = botón primario azul sólido** (el ÚNICO botón azul sólido de la pantalla),
  "Regenerar" = ghost con icono.
- **Cuerpo:** tarjetas elevadas (bg-2, borde line-1, radio l, sombra 1, hover: borde line-2 +
  lift sutil). Grid cuando hay N ítems comparables (conceptos, escenas, personajes) — no lista
  vertical infinita.
- **Footer:** CTA de aprobación ("X listo, al siguiente →") verde, outline → filled en hover,
  alineado a la derecha, siempre visible al final del contenido.
- **Empty state:** icono lucide grande + 1 línea de qué es el paso + el CTA que corresponde (ya
  especificado en 07/fase-5 — acá se le da el diseño).
- **Error:** banda roja con icono, texto claro, sin tecnicismos.

## 5. Las pantallas, una por una

| Paso | Diseño requerido |
|------|------------------|
| **Concepto** (UI-2) | Las 2-3 propuestas en GRID de tarjetas comparables (no bloques full-width). Cada tarjeta: la IDEA como texto protagonista (16-17px, `text-1`), meta en filas etiquetadas (TONO/ESTÉTICA/REFERENCIA como label mono 10px uppercase + valor `text-2`), "por qué funciona" como cita en italic con filete izquierdo dorado. La elegida: borde verde + badge check + glow sutil. Selector filmado/animado = segmented control real con iconos (users/monitor). |
| **Guion** (UI-2) | Los bloques como tarjetas de TIMELINE: filete lateral de color por rol (hook ámbar · desarrollo azul · remate violeta · cta verde), chip de duración mono tabular, la narración como textarea integrada (sin look de form: fondo bg-1, borde solo en focus), el "visual" como caption `text-3` con icono de cámara. La música al cierre como tarjeta con icono. |
| **Cast** (UI-3) | Tarjetas de personaje en grid 2 col: avatar circular con inicial sobre fondo dorado/violeta + nombre grande + rol; `fisicoEs` legible; el `fisicoEn` en bloque MONO colapsable con badge ámbar "se pega VERBATIM en todos los prompts". La locación: tarjeta ancha con icono map-pin y la luz como metadato. |
| **Storyboard** (UI-3) | FILMSTRIP: tarjetas numeradas en grid 2-3 col, "#N" grande en serif, badge de rol, chip durSec, el diálogo como cita entre comillas, la continuidad como nota al pie con icono link-2. Que se sienta una tira de escenas, no una lista. |
| **Pack Flow** (UI-4) | El MASTER como consola: bloque mono sobre bg-0 con header colapsable y botón COPIAR prominente (feedback "copiado" con check verde 2s). Los clips como filas de pipeline: #escena + estado (pendiente/copiado/importado como badges semánticos) + copiar + expandir. Export .txt como acción secundaria clara. |
| **Rodaje** (UI-4) | BINS de media: grid por escena; con clip = thumbnail del video con duración real (warn ámbar si < objetivo); sin clip = dropzone punteada con icono upload y el n° de escena. Variantes como chips. |
| **Montaje** (UI-5) | Lo más "NLE" posible sin tocar lógica: las escenas como MINI-TIMELINE horizontal (bloques proporcionales a duración, color por rol, iconito de audio on/mute); música y voz como "pistas" debajo (barras finas con label); silencios marcados en la pista. Export: tarjeta con el video enmarcado (9:16, sombra) + botón descargar; QA como tarjeta de score con gauge visual (n/50) y issues por severidad. |
| **Publicar** (UI-5) | Paquete de publicación como tarjetas copiables (hook en pantalla / caption / hashtags como chips / CTA), cada una con su botón copiar. |
| **Home/ABM + Wizard** (UI-5) | Pasada liviana con los mismos tokens: cards de proyecto con cover, hover lift, CTA de integración destacado. El wizard hereda tarjetas y botones del sistema (hoy usa clases `veo-*` viejas — migrarlas a tokens). |

## 6. Gates por WO (checklist obligatorio — incluye las 5 reglas de contingencia)

1. `npx tsc --noEmit` + `npx eslint src/` — 0 errores.
2. `npx vitest run --pool=vmThreads` — 174 verdes (en esta máquina `npm test` a secas falla por
   saturación de workers; usar vmThreads).
3. `npm run build` — **leer la salida COMPLETA filtrada por `error|warning`**: cero warnings nuevos;
   warning sin clasificar = WO bloqueado. (Jamás decidir por el tail.)
4. **stylelint** (UI-1 lo instala: `stylelint` + config standard, script `lint:css`) — 0 errores en
   los CSS tocados.
5. **Gate visual (por CADA pantalla tocada):** screenshot Playwright a 1440px Y 3440px →
   auto-pregunta: ¿parece producto terminado o HTML sin estilos? ¿tarjetas/fondos/colores visibles?
   ¿columna centrada en ultrawide? ¿pasaría la política anti-template? Guardar las capturas en
   `docs/08-rework-ui/capturas/ui<N>-<pantalla>.png` y commitearlas con el WO.
6. Grep de tokens: `grep -nE '#[0-9a-fA-F]{3,8}' src/*.css src/pasos/*.css` (excluido studio.css) →
   0 hex sueltos nuevos.
7. **Licencia de reparación:** lo roto que aparezca fuera del scope (warning, bug evidente) se
   arregla si es ≤10 líneas o se reporta como hallazgo — jamás se ignora.

## 7. WOs

| WO | Alcance | Toca |
|----|---------|------|
| **UI-1** | Tokens (`studio.css`) + shell (topbar/columna/fondo) + stepper-riel + stylelint instalado | `src/styles/studio.css` (nuevo), `App.css`, `Pipeline.css`, `PipelineStepper.tsx/.css` |
| **UI-2** | PasoShell (patrón único) + Concepto + Guion | `pasoKit.tsx`, `PasoConcepto`, `PasoGuion`, CSS de pasos |
| **UI-3** | Cast + Storyboard | `PasoCast`, `PasoStoryboard` |
| **UI-4** | Pack Flow + Rodaje | `PasoPack`, `PasoRodaje` |
| **UI-5** | Montaje + Publicar + pasada Home/ABM/Wizard + **reporte visual de cierre** (estándar `14-REPORTES-VISUALES.md`: antes/después por pantalla con las capturas) en `docs/reportes/03-rework-ui.html` (+PDF; el 02 es el de mejores prácticas) | `PasoMontaje`, `PasoPublicar`, `ProjectsABM`, `ProjectWizard.css`, reporte |

## 8. Verificación final (después de UI-5)

1. Suite completa verde + build sin warnings (salida completa) + stylelint verde.
2. Recorrido Playwright del pipeline entero con el proyecto `munify-ejemplo` a 1440 y 3440:
   captura por paso, 0 errores de consola, columna centrada, tarjetas visibles.
3. El reporte 03 con el antes/después queda generado y commiteado — es el gate del dueño: él mira
   las capturas y decide si la vara se cumplió.
