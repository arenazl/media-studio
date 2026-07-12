// Rutas del shell nuevo (rediseño F1, docs/rediseno/HANDOFF.md §2). Router por estado —
// vive en App (dueño único), lo consumen Rail/Home/Integrar. 'project'/'wizard'/'editor' son
// CONTEXTUALES (se abren desde otra vista) y no tienen ítem propio en el rail.
export type Route = 'home' | 'formats' | 'ksp' | 'videos' | 'audio' | 'project' | 'wizard' | 'editor';

// Ítems del rail, en el orden fijo del prototipo. Los contextuales agrupan bajo 'home'
// (si estás viendo un proyecto o el wizard, el rail resalta "Inicio" — de ahí saliste).
export const RAIL_ROUTES: { id: Route; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'formats', label: 'Formatos' },
  { id: 'ksp', label: 'Integrar' },
  { id: 'videos', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
];

// A qué ítem del rail pertenece (resalta) cada ruta activa.
export function railGroupFor(route: Route): Route {
  if (route === 'project' || route === 'wizard') return 'home';
  return route;
}
