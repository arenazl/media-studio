# Traspaso 2026-10-09: laboratorio de animación (personajes, captura, skill)

**Para el dueño.** No le agarré la vuelta a la animación con personajes. En tres días probé bajar
avatares, personas realistas, capturar la actuación de videos filmados y, al final, el método del
skill todo por código. Lo mejor que salió quedó en un seis sobre diez; los videos del amigo de Lucas,
hechos con el mismo skill, están en otra liga: paleta pensada, sombras de contacto, contornos limpios,
bokeh, manos con dedos que tipean y una cara que actúa. Además cometí errores de criterio: me desvié a
bajar librerías en vez de reconocer que había corrido mal el skill, entregué cosas sin revisarlas en
movimiento y defendí resultados que se veían inferiores a la legua. Lo que sí queda útil está listado
abajo con su ruta. La recomendación para quien siga está en la última sección.

## Qué se pidió

1. Un video corto de "última milla" para Munify, mejor que el del amigo (`D:\Code\reel-prueba\dummy-serio-10s.mp4`).
2. Una biblioteca local de assets sin cuenta, y una galería con filtros y etiquetas para elegir.
3. Entender cómo se vuelve esto un proceso determinístico dentro de Media Studio.
4. Pruebas puntuales: rehacer el reel del intendente con una presentadora animada, y una mujer de pelo
   largo caminando por la playa que lanza un frisbee, todo por código.

## Qué se hizo, en orden, con resultado honesto

| Intento | Resultado | Por qué |
|---|---|---|
| Correr el skill con Sonnet, una sola vuelta (07/10) | "Minecraft": muñecos de cajas | Modelo chico, sin rondas, la corrida murió a los 53 min. El amigo usó Opus y varias rondas. |
| Bajar modelos (VRM, Quaternius, Ready Player Me como prueba) | Chica rosa estilo anime para Munify | Desvío iniciado por mí; casting fuera de tono. |
| Biblioteca masiva de avatares por IPFS | Colgó la máquina; Lucas la cortó | Descarga sin control de concurrencia. Quedó parcial (unos 600 de 4274). |
| Personas realistas Rocketbox (MIT) con boca por sonido | Vecina realista de 10 s; storyboard de 6 escenas | Funciona técnicamente; Lucas aclaró que para Munify no busca realismo sino estilo avatar. |
| Captura de actuación con MediaPipe sobre el reel del intendente | Impresentable | La cámara seguía la cabeza: el fondo se deslizaba con ella. Lo revisé sólo en cuadros fijos. |
| Playa y frisbee, todo por código con el método del skill (7 rondas) | Seis sobre diez | Escena coherente; personaje armado con piezas sueltas, manos de mitón, cara simple. |

## Lo que quedó útil (rutas)

Todo el laboratorio vive **fuera del repo**, en `D:\Code\reel-prueba\`.

- **Motor de render del skill**, adaptado: `scene.js` (cabecera), `cdp.mjs`, y los armadores por escena
  `armar-r.py` (realista), `armar-p.py` (playa). Render: `node render-r.mjs full` / `node render-p.mjs full`.
- **Catálogo consultable sin descargas masivas**: `D:\Code\reel-prueba\catalogo\catalogo.py`.
  `buscar "café de día" --tipo fondo`, `traer polyhaven/<id>` o `traer rocketbox/<Nombre>`.
  997 fondos de Poly Haven (CC0) y las personas indexadas; se baja sólo lo elegido, con procedencia.
- **Galería "Casting"**: `D:\Code\reel-prueba\galeria\` (`node galeria/servidor.mjs`, puerto 5320).
  Filtros por colección y etiqueta, corazón, etiquetas propias y botón "Traer" con cola de a uno.
  Las marcas de Lucas quedan en `galeria\marcas.json`.
- **Rocketbox (realistas, MIT)**: `assets\rocketbox\bajar-lote.py` y `preparar.py`. Listas en disco:
  Female_Adult_01, Female_Adult_08, Female_Adult_11, Male_Adult_08, Business_Male_02, Business_Female_02,
  Construction_Male_02. Cada una trae 175 gestos de cara (visemas Oculus, ARKit, FACS).
- **Captura de actuación**: `captura\captura.py` (cara: 52 gestos ARKit + giro) y `captura\captura-pose.py`
  (brazos), con MediaPipe (instalado con pip). Soportan varias personas por video.
- **Sonido ambiente**: `sonido\generar.mjs` (ElevenLabs, lee la clave del `.env` sin imprimirla).
- **Páginas publicadas** (bajo clave) en `https://looklogic.com.ar/docs/mediastudio/`:
  `muestra-cara-realista`, `storyboard-munify`, `presentadora-animada` (impresentable, reemplazar o borrar),
  `playa-frisbee`. Copias locales en `D:\Code\media-studio\docs\15-personajes-realistas\`.

## Lecciones (también en memoria)

1. Un mal resultado de una herramienta casi siempre es mala ejecución: antes de cambiar de herramienta,
   comparar contra quien sí lo logró con la misma herramienta.
2. Nada de video se entrega revisado sólo en cuadros fijos; la cámara nunca va pegada a un hueso.
3. El personaje se elige por la audiencia de la app, no por el que hay a mano.
4. El juez de las caras y del acabado es Lucas, no el agente: mi autoevaluación fue indulgente.
5. Cuando algo no me sale, decirlo así: "no le agarré la vuelta". Sin excusas ni comparaciones a favor.

## Recomendación para quien siga

1. **Pedirle al amigo el código de sus escenas** (`duenio.js`, `rebeca.js`, `set.js`, `auto.js` y el del
   depósito). Ahí está el oficio que falta: cómo armó la cabeza continua, las manos, las sombras de contacto
   y la paleta. Es la referencia concreta que no tuvimos.
2. **Seguir el skill al pie de la letra** con modelo grande y su orden: guion, voces, hoja de cuadros,
   OK de Lucas, render. Con la receta del amigo: luz baja o contraluz, tres cuartos, rasgos que se leen
   por forma (barba, anteojos), una mascota tipo Rebeca para los momentos de cara.
3. **Para caras de frente y de día**: una cabeza base hecha una vez por alguien con oficio (Blender) que el
   código reuse, como un componente del kit v3.
4. **No bajar bibliotecas masivas**: catálogo consultable y descarga a pedido.

## Pendientes y decisiones abiertas

- Borrar o reemplazar la página `presentadora-animada` (Lucas la calificó impresentable).
- `D:\Code\media-studio\docs\15-personajes-realistas\` tiene videos mp4 (unos 40 MB): decidir si se
  versionan o quedan sólo locales. Por ahora no están en git.
- En disco quedan pesados que se pueden limpiar: la biblioteca VRM parcial (`assets\vrm`, unos 1,5 GB),
  el repositorio del nodo IPFS (`tools\ipfs-repo`) y las texturas TGA de Rocketbox (`assets\rocketbox\fbx`).
- De sesiones anteriores, siguen abiertas tres decisiones: el test de "captura en ronda", el pensamiento
  0 o 2000 en lo creativo y los hooks condicionales de `App.tsx`.
- Fase 8 (motor animado dentro de Media Studio): no se integró nada al producto.

## Qué queda corriendo

En esta sesión quedaron levantados Media Studio (servidor en 5301, interfaz en 5180) y la galería (5320).
Se cortan al cerrar la sesión. No queda ninguna descarga en curso.
