// Hook de proyectos server-first (Fase 2): estado inicial SÍNCRONO desde localStorage (la app
// arranca sin esperar red) + sync async al montar (fetch del server → merge por updated_at →
// setState + persist local). Si el server no responde, sigue andando solo con localStorage.
import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { listProjects, mergeServerProjects, type Project } from './projects';

interface ServerRow { id: string; data?: Project }

export function useProjects(): { projects: Project[]; refresh: () => void } {
  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const refresh = useCallback(() => setProjects(listProjects()), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/projects?full=1`);
        if (!r.ok) return;
        const d = await r.json();
        const fromServer = ((d.projects as ServerRow[]) || [])
          .map((row) => row.data)
          .filter((p): p is Project => !!p && !!p.id);
        if (!fromServer.length) return;
        const merged = mergeServerProjects(fromServer);
        if (alive) setProjects(merged);
      } catch { /* server opcional: la app anda solo con localStorage */ }
    })();
    return () => { alive = false; };
  }, []);

  return { projects, refresh };
}
