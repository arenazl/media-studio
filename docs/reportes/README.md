# Reportes — Media Studio

Reportes visuales del proyecto (estándar cross-app: dark-theme, cards de métricas, datos reales citados; HTML + PDF).

| # | Reporte | Fecha | Qué cubre |
|---|---------|-------|-----------|
| 01 | [Correctivo post-implementación (C1–C11)](01-correctivo-post-implementacion.html) · [PDF](01-correctivo-post-implementacion.pdf) | 2026-07-10 | Cierre del rework `docs/07-rework`: los 11 WOs correctivos, el test integral del sistema vivo (endpoints + Claude headless + pantallas) y el ejemplo Munify end-to-end. |
| 02 | [Mejores prácticas del pipeline](02-mejores-practicas.html) · [PDF](02-mejores-practicas.pdf) | 2026-07-10 | Cómo producir un comercial con calidad en cada paso (no tutorial): dónde se juega el resultado, errores típicos, el ritual de Google Flow, reglas transversales y referencias. |
| 03 | [Rework visual del pipeline](03-rework-ui.html) · [PDF](03-rework-ui.pdf) | 2026-07-10 | Cierre del rework `docs/08-rework-ui`: de "un ASP de 2005" a consola de estudio. Antes/después por pantalla (home + 9 pasos), el sistema de tokens `--st-*`, stepper-riel, y los gates (tsc/eslint/vitest/build/stylelint verdes, 174 tests intactos). |
| 04 | [Copiloto del pipeline](04-copiloto.html) · [PDF](04-copiloto.pdf) | 2026-07-10 | Cierre de `docs/10-copiloto` (C1–C4): panel de guía contextual que llena el vacío de la derecha y explica el ritual de Flow; bloque Marca con logo descargable (proxy anti-SSRF); claridad master↔clips + leyenda de estados. Capturas 1440/1040/820, proxy verificado end-to-end, 219 tests verdes. |
| 05 | [Workspace — el paso como panel de trabajo](05-workspace.html) · [PDF](05-workspace.pdf) | 2026-07-10 | Cierre de `docs/11-workspace` (W1–W3): lavada de cara estructural — cada paso pasa de "islas sueltas sobre el fondo" a UN panel (cabecera/cuerpo/pie anclado + línea de estado por paso, helper `estadoDelPaso` con 21 tests). Migra los retazos (Montaje/Rodaje/Render + Negocio + Wizard) al mismo sistema; responsive por contrato (4 tiers). Gate visual 4 estados × 4 anchos + tiers, 240 tests verdes. |
