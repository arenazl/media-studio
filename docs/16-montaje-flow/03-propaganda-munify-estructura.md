# La propaganda de Munify, como la pidió Lucas (2026-10-09, tarde)

**Para el dueño.** Es tu estructura, textual, sin chistes y sin buscar premios: el vecino carga el reclamo y
saca la foto, le llega la notificación de que su caso está en tratamiento, en el medio se ve al operario con el
poste de luz y un segundo de oficina contenta, le llega "su caso se resolvió", la persona contenta con el celular
en la mano, y cierra la modelo de siempre diciendo "Munify, para vos", logo y todos felices. Mockups al estilo de
los bocetos entre medio. Ciudad: una de Buenos Aires.

## El reel (24 a 28 segundos, 9:16)

| # | Qué se ve | Qué se oye | De dónde sale |
|---|---|---|---|
| 1 | Vecino en la vereda, de noche, frente a un poste de luz apagado. Saca el celular y le saca la foto. | Locución: "Un poste apagado en tu cuadra." | Flow, clip nuevo (persona + poste), 8 s |
| 2 | **Mockup**: la pantalla de carga del reclamo con la foto recién sacada, la IA lo clasifica como "Alumbrado público" y lo deriva. Botón "Enviar". | "Lo cargás con una foto. La IA lo clasifica y lo deriva sola." | Mockup animado (boceto) |
| 3 | **Notificación** en el celular, sobre fondo de noche: "Tu caso #1287 está en tratamiento". | Sonido de notificación + "Y te avisa." | Mockup animado |
| 4 | Operario de cuadrilla con el chaleco, trabajando en el poste de luz, de día. | "La cuadrilla sale." | Flow, clip nuevo (operario + poste), 8 s |
| 5 | Un segundo de oficina municipal: empleados contentos frente al tablero. | "El municipio ve todo en un tablero." | Flow, clip nuevo (oficina), 6 s |
| 6 | **Notificación**: "Tu caso #1287 se resolvió", con la foto del poste prendido. | Sonido + "Y cuando está, también te avisa." | Mockup animado |
| 7 | La persona contenta con el celular en la mano, mirando la luz prendida. | (música) | Flow, clip nuevo (persona feliz + poste prendido), 6 s |
| 8 | La modelo de siempre, a cámara, sonriendo: "Munify, para vos." | Ella, en cámara | Flow, clip nuevo con `@modelo`, 8 s |
| 9 | **Placa**: logo de Munify, "Chivilcoy, Buenos Aires" como ejemplo de ciudad, "Pedí una demo para tu municipio". | (música cierra) | Placa del motor |

Logo de Munify arriba en todo el reel. Ciudad en los mockups y en la placa: **Chivilcoy, Buenos Aires**
(ejemplo; se cambia por la del cliente).

## Lo que falta generar en Flow (con `@` al personaje donde corresponde, x1, 8 s, 9:16, Veo 3.1 Fast)

1. Vecino de noche con el celular frente al poste apagado (escena 1).
2. Operario con chaleco trabajando en el poste (escena 4).
3. Oficina municipal contenta, un segundo (escena 5).
4. Persona contenta con el celular, poste prendido (escena 7).
5. La modelo a cámara: "Munify, para vos." (escena 8). Es el personaje de siempre de Lucas: hay que crearlo en
   Flow con su foto de referencia antes.

## Lo que ya está

- Las tarjetas de mockup en el estilo de los bocetos (`src/remotion/munify/Tarjetas.tsx`) y el artefacto con
  seis mockups animados. Falta la tarjeta "carga del reclamo con foto" y las dos notificaciones.
- El motor de montaje con subtítulos, locución, insertos por tarjeta y placa.
