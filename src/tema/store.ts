// El store de tema DE ESTA APP. Es lo único de src/tema/ que NO es copia del
// catálogo: acá se eligen la clave de persistencia y el arranque.
//
// Arranque: Tabaco (oscuro cálido) + Marfil (claro cálido) + acento verde. Es
// la apariencia que media-studio YA tenía — fondo tostado, acciones en verde —
// así que al usuario no le cambia nada hasta que elija; de ahí en más la luna
// y los seis fondos son los mismos que en SalesBot y Munify.
import { crearTemaStore } from './temaStore';

export const tema = crearTemaStore({
  prefijo: 'ms.tema',
  defaults: { claro: 'marfil', oscuro: 'tabaco', acento: 'verde', modo: 'dark' },
});

// Se pinta ANTES del primer render (main.tsx importa este módulo): si esperara
// a un useEffect, el primer frame saldría con los colores del CSS y se vería
// el salto.
tema.aplicar();
