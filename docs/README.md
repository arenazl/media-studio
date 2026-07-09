# Media Studio — docs

Índice maestro de la documentación. **Si es tu primera vez, arrancá por
[`01-proposito/01-que-es-y-como-se-enchufa.md`](01-proposito/01-que-es-y-como-se-enchufa.md)** —
explica qué es la app, cómo se conecta con las apps generadoras de negocio y cómo produce contenido.

Organizado con el **criterio cross-app** (raíz de `docs/` solo este README; temas en carpetas numeradas
`NN-`; archivos numerados adentro; `handoffs/` e `historico/` por fecha). Fuente del criterio:
[`base-compartida/9-ORGANIZACION-DOCS.md`](../../base-compartida/9-ORGANIZACION-DOCS.md).

## Mapa de carpetas

| Carpeta | Qué contiene |
|---------|--------------|
| [`01-proposito/`](01-proposito/) | **Empezá acá.** Qué es, cómo se enchufa (KSP) y cómo genera. Infra → técnico. |
| [`02-integracion-apps/`](02-integracion-apps/) | La **entrada**: cómo cada app produce su brief/KB del negocio. |
| [`03-kit/`](03-kit/) | El **contrato del kit** (salida del orquestador → editor) + demo FitPass. |
| [`04-editor/`](04-editor/) | Plan del **editor único** de videos promocionales. |
| [`05-prompting-video/`](05-prompting-video/) | **Playbook Flow/Veo** (fuente única de prompting de reels humanos). |
| [`06-video-referencia-stotyboard/`](06-video-referencia-stotyboard/) | El workflow de referencia (storyboard → comercial IA) que inspira el rework. |
| [`07-rework/`](07-rework/) | **EL REWORK** — visión + 5 fases ejecutables: pipeline de producción KB→comercial (storyboard-driven). |
| [`agents/`](agents/) | Guías de agentes (App / Infra / Veo) — dominio base, sin numerar. |
| [`historico/`](historico/) | Docs superados o cerrados, por fecha. |

## Docs (uno por línea)

- [`01-proposito/01-que-es-y-como-se-enchufa.md`](01-proposito/01-que-es-y-como-se-enchufa.md) — propósito, KSP, infra y pipeline técnico.
- [`02-integracion-apps/01-prompt-para-apps.md`](02-integracion-apps/01-prompt-para-apps.md) — prompt que se le pasa a cada app para producir su brief.
- [`02-integracion-apps/02-brief-negocio.md`](02-integracion-apps/02-brief-negocio.md) — plantilla del brief (los hechos del negocio).
- [`03-kit/01-contrato-kit.md`](03-kit/01-contrato-kit.md) — forma del kit que consume el editor.
- [`03-kit/02-demo-fitpass.md`](03-kit/02-demo-fitpass.md) — kit de ejemplo end-to-end (datos crudos en `02-demo-fitpass.json`).
- [`04-editor/01-plan-v2-editor.md`](04-editor/01-plan-v2-editor.md) — integrador único de videos, agnóstico.
- [`05-prompting-video/01-playbook-flow.md`](05-prompting-video/01-playbook-flow.md) — todo lo aprendido generando reels en Flow/Veo.
- [`06-video-referencia-stotyboard/flujo_produccion_ia.md`](06-video-referencia-stotyboard/flujo_produccion_ia.md) — el workflow manual de referencia (ChatGPT + Flow + DaVinci) que el rework automatiza.
- [`07-rework/01-vision-y-pipeline.md`](07-rework/01-vision-y-pipeline.md) — **la visión del rework** (leer primero): pipeline de 9 pasos, storyboard como columna vertebral, modelo `Comercial`.
- [`07-rework/02..06-fase-*.md`](07-rework/) — las 5 fases ejecutables (datos+moldes, pipeline UX, pack+rodaje, montaje pro, animado+pulido).
- [`agents/`](agents/) — `AGENT_GUIDE`, `APP_AGENT`, `INFRA_AGENT`, `VEO_FLOW_PROMPTING`.
- [`historico/2026-06-variantes-narracion-munify.md`](historico/2026-06-variantes-narracion-munify.md) — 50 textos de narración Munify (enfoque viejo, referencia).

## ¿Dónde va un doc nuevo?

- **Tema de trabajo nuevo** → carpeta `NN-tema/` nueva (el número más alto = lo más reciente); archivos `01-…md`, `02-…md`.
- **Cierre de sesión / handoff** → `handoffs/YYYY-MM-DD_titulo.md`.
- **Doc superado** → NO se borra: va a `historico/YYYY-MM-DD-titulo.md` (si un doc nuevo lo reemplaza, decilo: "supera a X").
- **Nunca** suelto en la raíz de `docs/` (acá solo vive este README).
- Actualizá este índice en el **mismo commit** que agrega o mueve un doc.

> Nota: `PROMPTS_INTEGRACION.md` vive en la raíz del repo y está **gitignored** (local, punteros a `base-compartida/`) — no forma parte de este índice versionado.
