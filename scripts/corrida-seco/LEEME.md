# Corrida en seco

**Para el dueño:** un test que recorre la cadena creativa entera como la app (estrategia, concepto, guion, personajes,
storyboard, pedidos a Flow y director de montaje) para varios casos, y guarda lo que sale de cada paso. No evalúa nada,
no genera mockups ni videos (que tardan) y no crea proyectos en la app. Cada caso tarda unos 3 minutos; los 10, de a 4,
unos 8 minutos.

## Cómo se corre

Con el backend levantado (`npm run server` o `npm run studio`):

```bash
npm run corrida-seco                         # los casos de casos.json
npm run corrida-seco -- --casos 1,4,7        # sólo esos
npm run corrida-seco -- --concurrencia 4     # de a 4 (por defecto 3)
```

Deja todo en `docs/22-corridas-en-seco/<fecha_hora>/`:

- `caso-NN.json`: todo lo que salió de cada paso, tal cual.
- `caso-NN.md`: lo mismo para leer.
- `LEEME.md`: los casos, el tiempo por paso y las fallas.

## Los casos

En `casos.json`: cada caso es una app integrada con el objetivo, el tipo de historia y el clima que elegiría el usuario.
Se cambian ahí, sin tocar código.

## Para que lo evalúe ChatGPT (aparte)

```bash
node scripts/corrida-seco/pedido-chatgpt.mjs docs/22-corridas-en-seco/<fecha_hora>
```

Arma `pedido-chatgpt.md` en la carpeta de la corrida (y una copia en `base-compartida/mediastudio/curaciones/pedidos/`)
con el contexto, lo que se le pide y los casos. Se sube a ChatGPT a mano.
