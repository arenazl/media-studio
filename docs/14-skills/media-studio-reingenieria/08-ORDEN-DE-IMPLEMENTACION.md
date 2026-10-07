# 08 — Orden de implementación

## Fase 0 — Baseline

Antes de tocar:
- ejecutar una pieza completa;
- registrar tiempos manualmente;
- guardar outputs;
- guardar prompts efectivos;
- registrar modelo/costo.

No comparar luego contra memoria.

---

## Fase 1 — Bugs de datos (P0)

1. `scriptToText()` canónico.
2. arreglar publish.
3. arreglar QA.
4. eliminar `x.industry` fantasma.
5. eliminar reglas Veo contradictorias.
6. tests.

No optimizar prompts antes de asegurar que reciben los datos correctos.

---

## Fase 2 — ProjectFacts

1. KB → ProjectFacts.
2. mantener `rawBrief`.
3. selectors por molde.
4. retirar `.slice(0,2500)` de decisiones creativas.
5. golden test con brief largo.

---

## Fase 3 — Prompt Engine

1. versionado;
2. prompt builders por función;
3. límites explícitos;
4. schemas;
5. semantic lint;
6. repair retry.

Mantener las pantallas intactas.

---

## Fase 4 — Model routing

1. taskClass;
2. defaults backend;
3. conservar override del usuario;
4. mover Script/Cast/Storyboard a Sonnet;
5. medir;
6. Opus sólo si demuestra mejora material.

---

## Fase 5 — FlowPack

1. extraer `VEO_RULES` a módulo único;
2. crear compiler;
3. conservar shape y UI;
4. IA opcional para enriquecer, no para ensamblar reglas;
5. golden tests.

---

## Fase 6 — Idempotencia y cache

1. generationKey;
2. dedupe;
3. stale state;
4. cancel/ignore old responses;
5. cache hit al navegar.

No es necesario quitar el comportamiento automático si queda controlado.

---

## Fase 7 — QA determinístico

1. `lintCommercial`;
2. integrar con QA existente;
3. separar issues técnicos de juicio creativo.

---

## Fase 8 — Animation renderer

1. copiar SKILL como referencia, no ejecutarlo bruto;
2. crear versión generalizada;
3. `animation-job.json`;
4. workspace por pieza;
5. templates;
6. GPU probe;
7. voice/timeline;
8. scene;
9. stills;
10. contact sheet;
11. approval;
12. chunk render;
13. mux;
14. verify.

Primera prueba: una pieza real de Munify.

---

## Fase 9 — Observabilidad

Puede comenzar antes, pero no debe faltar al terminar:
- generation_runs;
- dev diagnostics;
- render metrics;
- baseline comparison.

---

## Definition of Done

No cerrar la reingeniería por "se ve mejor".

Cerrar cuando:
- los tests pasan;
- los bugs P0 están cubiertos;
- E2E real funciona;
- latencias están medidas;
- modelos están justificados;
- render animado tiene QA + approval;
- el usuario puede recorrer el pipeline normal sin enterarse de la reingeniería interna.
