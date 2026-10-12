# 18 · Contrato de materia prima con ChatGPT

**Para el dueño.** ChatGPT escribe la idea, los personajes, el guion y el storyboard de cada pieza; Media Studio los
importa y hace lo mecánico: los pedidos a Flow, las pantallas animadas de la app y el montaje. El pedido lo arma Media
Studio con los datos reales del proyecto (botón **Importar de ChatGPT** en la barra del pipeline → "Copiar el pedido"); la
respuesta se pega en el mismo panel, se ve qué trajo cada pieza con los avisos del validador y se aplica. Lo que había en
cada pieza queda de respaldo.

Online: https://looklogic.com.ar/docs/mediastudio/contrato-chatgpt/ (el pedido de RepareHoy, con botón de copiar).

## Cómo nació (2026-10-11)

Lucas: *"un contrato con un JSON: vos me mandás el input donde le decís a ChatGPT qué tiene que hacer, él me arma los JSON
de salida con todo lo que necesitás (la idea, los personajes, el guion, el storyboard) y los importamos; vos hacés los
prompts de Flow, las animaciones y el montaje"*. Ahorra tokens de Opus/Sonnet en los moldes creativos y pone el criterio
artístico donde está.

## Qué lleva el pedido (`server/contratoMateriaPrima.mjs` → `armarPedido`)

- `marca`: nombre, cómo se dice, web, CTA verificado y la **ficha** de hechos (`projectFacts`), la misma que leen los moldes.
- `campana.piezas`: cada pieza del proyecto con su ángulo, brief, mensaje principal, hechos, enfoque, tratamiento,
  formato y duración (la idea anterior, si hay, va sólo como referencia).
- `material_disponible`: qué puede generar Flow, las pantallas reales del kit (nombre exacto + qué muestran) y la placa.
- `reglas_de_oficio`: producción, guion, personajes y storyboard. Salieron de siete vueltas con tres jueces externos
  (ChatGPT, Gemini y Qwen) sobre "Nadie te contesta": sin locutor, quién dice cada frase, frases en presente dichas en el
  momento, ninguna frase que explique la publicidad, una acción por escena, lo mecánico en una toma aparte sin frase,
  planos variados, pantallas encima de la frase que las nombra, etc.
- `salida_esperada`: la forma exacta del JSON de respuesta (un objeto por pieza).

## Qué hace la lectura (`leerRespuesta`)

Encuentra el JSON (con o sin bloque de código), une cada pieza con su reel por `id` (o por orden), la pasa a la forma de
Media Studio (`concepto`, `guion` con `quien`, `cast` con `lugarEn`/`vestuarioEn`, `storyboard` con `accionEn` y
`sobreEscena`), aplica las mismas duraciones por regla y la misma asignación de capturas que el molde storyboard, y corre
los validadores de guion, personajes y storyboard. Avisa (no corta) lo que no existe: pantallas fuera del kit y escenas que
piden gráficos o texto que Flow no puede dibujar.

Endpoints: `POST /api/contrato/pedido`, `POST /api/contrato/leer`, `POST /api/contrato/aplicado` (guarda pedido y
respuesta completos en `base-compartida/mediastudio/curaciones/`, doc 36). Tests: `src/lib/contratoMateriaPrima.test.ts`.

## Medido (mismo juez de materia prima, chat-latest)

| Camino | Materia prima | Pieza entera |
|---|---|---|
| Pieza original (prompts del 10/10) | 5 | 4 |
| Pipeline propio después de 7 vueltas (prompts 3.x) | 7 a 7,5 | 7 |
| ChatGPT con el contrato 1.0, de una | 6,5 | 6 |

Lo que el juez le marcó a ChatGPT (reacciones escritas para explicar la publicidad, el profesional mirando un teléfono)
entró como reglas en el contrato 1.1 y en los prompts de la app (script/3.6, storyboard/3.7).

## Pendiente

- El montaje fino ("sobreEscena": la pantalla entra sobre la frase y la voz sigue) lo tiene que respetar el montajista.
- Probar la respuesta de ChatGPT web (no API) pegada por Lucas.
