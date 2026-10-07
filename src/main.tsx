import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/studio.css';
import './styles/tokens.css';
import './styles/rediseno.css';
// El puente va DESPUÉS de los dos sistemas de tokens: redeclara los de la app en términos
// de los que escribe el framework de tema, y por orden de cascada tiene que ganarles.
import './styles/tema-puente.css';
// Importar el store PINTA el tema elegido (su módulo llama a tema.aplicar()): tiene que
// pasar antes del primer render o el primer frame sale con los colores del CSS y se ve el salto.
import './tema/store';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
