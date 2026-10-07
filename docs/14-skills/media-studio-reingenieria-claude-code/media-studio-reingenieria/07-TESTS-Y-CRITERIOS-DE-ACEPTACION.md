# 07 — Tests y criterios de aceptación

## Estrategia

Tres niveles:

1. unit tests;
2. contract/golden tests;
3. end-to-end de una pieza real.

---

## A. Unit tests

### Contexto
- ProjectFacts desde KB;
- scriptToText legacy;
- scriptToText blocks;
- screen matcher;
- CTA extraction;
- claim validator.

### Prompt builders
Snapshot por versión:
- concept;
- script;
- cast;
- storyboard;
- publish;
- qa.

El snapshot no debe incluir:
- brief truncado por accidente;
- campos ajenos;
- reglas contradictorias.

### Parsers
- JSON limpio;
- markdown wrapper;
- texto antes/después;
- JSON roto reparable;
- schema inválido;
- arrays vacíos.

### Flow compiler
Golden outputs por:
- talking head;
- b-roll;
- CTA;
- escena sin actor;
- screen;
- personaje por imagen.

---

## B. Golden fixtures

Crear `/server/tests/fixtures/media-studio/`.

### Fixture 1 — Brief largo
- > 8.000 caracteres;
- facts importantes tanto al principio como al final.

Acceptance:
- los facts del final llegan a Concept y Strategy a través del KB/ProjectFacts.

### Fixture 2 — Guion nuevo
```json
{"blocks":[...]}
```
Acceptance:
- publish y qa leen el guion;
- jamás caen silenciosamente al brief.

### Fixture 3 — Animado con Media Kit
- screens reales;
- moments;
- CTA.

Acceptance:
- storyboard usa labels reales;
- screenshot assignment correcto;
- animation-job contiene assets reales.

### Fixture 4 — Filmado con cast
Acceptance:
- storyboard referencia sólo ids existentes;
- FlowPack no repite `fisicoEn` largo si se usa image entity.

### Fixture 5 — Regeneración
Regenerar escena 3.

Acceptance:
- no cambia escena 1/2/4;
- no vuelve a generar cast;
- generation key distinta sólo para ese item.

---

## C. E2E real

Usar una pieza conocida, por ejemplo Munify.

Flujo:
1. project;
2. strategy;
3. concept;
4. choose;
5. script;
6. cast/skip según técnica;
7. storyboard;
8. pack/render;
9. publish;
10. QA.

Guardar:
- output;
- tiempo;
- tokens/costo;
- screenshots;
- errores.

Comparar contra baseline actual.

---

## Acceptance global

### Calidad funcional
- 0 pérdidas silenciosas de campos;
- 0 fallback silencioso brief↔guion;
- 0 contradicciones canónicas en Veo;
- 0 ids rotos;
- 0 screen refs inexistentes salvo `[demo]`;
- outputs parseables >= 99% con un retry.

### Performance
- reducir mediana de latencia de etapas estructuradas;
- FlowPack determinístico prácticamente inmediato;
- reducir uso de Opus;
- cache hits al renavegar.

### UX
- no cambia el orden del pipeline;
- no cambia el concepto de las pantallas;
- regeneración granular;
- errores visibles y accionables;
- animación muestra stills antes de render.

### Render animado
Antes de `done`:
- GPU check;
- QA motion clean;
- contact sheet aprobada;
- ffprobe correcto;
- audio/video sincronizados;
- frame 1 no negro;
- output versionado.
