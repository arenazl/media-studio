# Workspace — el paso como PANEL de trabajo (lavada de cara estructural)

> **Para quién:** Opus implementador. Autosuficiente. **Fable especifica; Opus implementa.**
> **NO ejecutar en paralelo con el agente del copiloto (docs/10)** — comparten `pasoKit.tsx`,
> `Pipeline.tsx/.css`. Este WO arranca cuando C1–C4 estén commiteados, y se construye SOBRE eso:
> **releé `pasoKit.tsx`, `Pipeline.tsx/.css` y `Copiloto.tsx` ANTES de diseñar el diff** — el
> copiloto pudo haber movido cosas; esta spec define el DESTINO, no asume el punto de partida.
>
> **Origen (2026-07-10, crítica del dueño con captura):** *"¿te parece una interfaz profesional?
> ese botón abajo suelto, sin layout simétrico, sin información de contexto… son como 4 o 5
> aplicaciones que se unieron, retazos. Necesito estructura, contenedores, que parezca LA MISMA
> aplicación. No es elástico, no es responsivo, no es una aplicación."*
>
> **Diagnóstico estructural (la causa raíz, no el síntoma):** las pantallas del pipeline no tienen
> MARCO. El título, las acciones, el contenido, el CTA de aprobar y el copiloto son **islas sueltas
> sobre el fondo de la página**: con poco contenido (1 tarjeta) queda un agujero muerto en el medio
> y el CTA "…listo, al siguiente" flota solo a media página, desanclado de todo. Cada rework agregó
> piezas sin un contenedor que las una. Esto lo arregla UN cambio de arquitectura visual: el PANEL.

## La idea (una sola): todo paso vive dentro de UN panel de trabajo

```
┌─ RIEL (stepper) ────────────────────────────────────────────────────────┐
│                                                                          │
┌─ PANEL DEL PASO ────────────────────────────┐  ┌─ COPILOTO ─────────────┐
│ CABECERA: Título serif + sub   [Regenerar]  │  │ (panel HERMANO: mismo  │
│           (hint IA)              [Generar]  │  │  borde/radio/sombra,   │
│──────────────────────────────────────────────│  │  cabecera a la misma  │
│ CUERPO: el contenido del paso                │  │  altura, alineado     │
│   (tarjetas/grids/timeline — DENTRO,         │  │  arriba con el panel) │
│    nunca sobre el fondo de la página)        │  │                        │
│                                              │  │                        │
│──────────────────────────────────────────────│  └────────────────────────┘
│ PIE: estado del paso (contexto)   [CTA →]   │
└──────────────────────────────────────────────┘
```

- **Panel** = superficie `--st-bg-1`, borde `--st-line-1`, radio `--st-r-l`, sombra `--st-shadow-1`.
  El fondo de la página (bg-0 con la textura) queda como MESA; los paneles son las hojas de trabajo.
  Las tarjetas internas (conceptos, bloques, escenas) van sobre `--st-bg-2` DENTRO del panel — la
  jerarquía de 3 capas se ve, y una tarjeta sola ya no queda perdida en un océano: está contenida.
- **Cabecera del panel** (con separador): título display + subtítulo a la izquierda; a la derecha
  las acciones del paso (Generar/Regenerar + hint IA). Nada de acciones flotando fuera del marco.
- **Pie del panel** (con separador, SIEMPRE al fondo — `margin-top: auto`):
  - Izquierda: **línea de estado/contexto** (la "información de contexto" que pide el dueño), ej.:
    Concepto → "Elegiste 1 propuesta · podés regenerar antes de seguir" · Pack → "2/4 copiados" ·
    Rodaje → "3/4 escenas con clip" · vacío → "Generá para arrancar". Derivada del estado real
    (helpers puros en `lib/`, con test).
  - Derecha: el **CTA de aprobar** ("Concepto listo, al guion →") — anclado acá para siempre.
- **Altura estable:** el panel tiene `min-height` (~ `60vh` en desktop) y estructura flex column →
  con poco contenido el pie queda abajo del panel (no hay agujero en el medio de la página; el
  cuerpo puede centrar el empty state). Con mucho contenido, crece normal.
- **El copiloto es panel HERMANO**: misma familia visual (borde/radio/sombra/altura de cabecera),
  columnas alineadas arriba, mismo gap. Dos hojas sobre la misma mesa = simetría.

## Elástico de verdad (responsive por contrato)

| Ancho | Layout |
|---|---|
| ≥ 1500px | panel del paso (fluido) + copiloto 360px, contenedor total ~1440px centrado |
| 1100–1500px | panel + copiloto 320px |
| < 1100px | copiloto pasa ABAJO del panel (o drawer); panel a columna completa |
| < 860px | cabecera del panel apila (título arriba, acciones abajo); pie apila (estado arriba, CTA ancho completo) |

Regla dura: **nunca** scroll horizontal, **nunca** una isla suelta sobre el fondo, **nunca** un CTA
fuera del pie del panel. El interior del panel usa el ancho disponible (los grids internos ya tienen
el fix de 1-ítem `:has(:only-child)` — se conserva).

## Dónde se implementa (la gracia: UN lugar propaga a todo)

- **`PasoShell` (`pasoKit.tsx`)** es el molde de todos los pasos → el panel se construye AHÍ:
  cabecera/cuerpo/pie. Los 9 pasos lo heredan gratis. Los pasos que no usan PasoShell
  (`PasoMontaje`, `PasoRodaje`, `PasoPack` si tienen markup propio) se migran AL MISMO panel
  (compartir clases `.panel`, `.panel-head`, `.panel-body`, `.panel-foot` — CSS común, no copias).
- **`ProjectInfo` (paso Negocio)** y **`ProjectWizard`** (la pantalla de arranque de campaña,
  también criticada como "suelto en una pantalla gigante"): mismo tratamiento — el contenido dentro
  de un panel centrado con cabecera/cuerpo/pie, no texto flotando.
- La **línea de estado del pie** por paso: helper `estadoDelPaso(paso, comercial): string` en
  `src/lib/` (puro, con test) — una frase por paso derivada del estado real.

### Especificación del panel (medidas, para no adivinar)

- Contenedor: `background: var(--st-bg-1)`, `border: 1px solid var(--st-line-1)`,
  `border-radius: var(--st-r-l)`, `box-shadow: var(--st-shadow-1)`.
- Cabecera: padding `var(--st-sp-5) var(--st-sp-6)`, separador `border-bottom: 1px solid var(--st-line-1)`.
- Cuerpo: padding `var(--st-sp-6)`; si el paso está VACÍO, el empty state se centra vertical
  (`flex: 1; display: grid; place-items: center`).
- Pie: padding `var(--st-sp-4) var(--st-sp-6)`, separador arriba, `margin-top: auto`;
  estado a la izquierda en `--st-text-3` 12.5px; CTA a la derecha.
- Panel: `display: flex; flex-direction: column; min-height: min(60vh, 720px)`.
- El copiloto hereda EXACTAMENTE la misma receta de superficie (auditar que ya la cumpla tras C1–C4).

### Tabla completa de líneas de estado (pie del panel) — implementar TODAS

| Paso | Sin contenido | Con contenido |
|---|---|---|
| Concepto | "Generá 2-3 propuestas para arrancar" | "N propuestas · {elegiste una ✓ / falta elegir una}" |
| Guion | "Generá el guion por bloques" | "N bloques · ~Xs totales" (suma de durSec) |
| Cast | "Generá los personajes y la locación" | "N personajes · locación definida" |
| Storyboard | "Generá las escenas del comercial" | "N escenas · ~Xs totales" |
| Pack Flow | "Generá el pack de prompts para Flow" | "X/N copiados · Y importados" |
| Rodaje | "Importá los clips que bajaste de Flow" | "X/N escenas con clip" |
| Montaje | "Armá el montaje desde el storyboard" | "N escenas · ~Xs · {con/sin} música · {con/sin} voz · QA X/50 si existe" |
| Publicar | "Generá el paquete de publicación" | "Paquete listo · N hashtags" |
| Negocio | — | "Brief de N caracteres · M pantallas" |

## Aceptación por WO (verificable, no interpretable)

- **W1:** en Concepto con 1 tarjeta elegida: el CTA está DENTRO del pie del panel, pegado abajo a la
  derecha; la línea de estado dice "1 propuesta · elegiste una"; NO existe ningún elemento del paso
  fuera del panel; el copiloto queda alineado arriba con el panel. El empty de un reel sin generar
  se ve centrado dentro del panel (no una página vacía).
- **W2:** recorrer los 9 pasos + Negocio + el wizard de campaña: TODOS dentro del mismo sistema de
  panel (mismas clases); cero pantallas "de otra aplicación".
- **W3:** las capturas de la matriz (4 anchos × 4 estados) no muestran islas, CTAs sueltos, agujeros
  ni scroll horizontal; el reporte 05 queda commiteado con el antes/después.

## WOs

| WO | Alcance | Toca |
|----|---------|------|
| **W1** | El PANEL en PasoShell (cabecera/cuerpo/pie + min-height + CTA anclado + línea de estado con helper testeado) + alineación panel↔copiloto en `pipe-work` | `pasoKit.tsx`, `Pipeline.css`, `src/lib/` (helper + test) |
| **W2** | Migrar al panel los pasos con markup propio (Montaje/Rodaje/Pack si aplica) + `ProjectInfo` + `ProjectWizard` — misma familia, cero retazos | pasos afectados + `ProjectWizard.tsx/.css` |
| **W3** | Barrido responsive por contrato (tabla de arriba) + gate visual EXHAUSTIVO + reporte de cierre `docs/reportes/05-workspace.html` (+PDF) | css + capturas |

## Gates (las 5 reglas de `base-compartida/8-REGLAS-CALIDAD-CODIGO.md` §Regla 2 + los aprendidos)

1. tsc 0 · eslint 0 errores · `npx vitest run --pool=vmThreads` verde (+ tests nuevos del helper) ·
   stylelint 0 · build con salida COMPLETA sin warnings nuevos (jamás el tail; ojo comentarios CSS
   con `*/` embebido).
2. **Gate visual EXHAUSTIVO (las lecciones de hoy, las tres):**
   - Capturar **estados PERSISTIDOS**, no happy path: paso con 1 tarjeta (concepto elegido), paso
     lleno (3 propuestas), paso VACÍO (sin generar), Pack con progreso.
   - Anchos: **1280, 1440, 1920 y 3440** — en TODOS: ¿hay alguna isla suelta? ¿algún CTA flotando
     fuera de un pie? ¿algún agujero muerto? ¿scroll horizontal?
   - Mirar cada captura y responder por escrito la pregunta del dueño: *"¿esto parece UNA
     aplicación profesional o retazos?"* — si hay duda, es retazo: arreglar antes de commitear.
   - Guardar en `docs/11-workspace/capturas/`, commiteadas por WO.
3. SOLO presentación (+ helper puro). Lógica/persistencia/endpoints/tests existentes: intactos.
