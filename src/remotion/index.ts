// Punto de entrada del empaquetador de Remotion (server/renderRemotion.mjs). El front NO importa este archivo.
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
