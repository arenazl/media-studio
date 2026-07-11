// Paso 4 — CAST (solo filmado). Corre el molde `cast`: personajes con descripción física EXACTA
// (fisicoEn, editable, con warning de que va VERBATIM a cada prompt) + la locación.
import { useState } from 'react';
import { Users, MapPin, Sun, ChevronDown, ChevronRight } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import type { Cast, CharacterSheet } from '../lib/comercial';

export default function PasoCast({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});   // fisicoEn colapsado por personaje (default abierto)
  const cast = comercial?.cast;

  const generar = async () => {
    setBusy(true); setError('');
    try {
      const res = await runMolde('cast', project, { concepto: comercial?.concepto, guion: comercial?.guion });
      const nuevo: Cast = { personajes: (res.personajes as CharacterSheet[]) || [], lugar: res.lugar as Cast['lugar'] };
      setComercial((c) => ({ ...c, cast: nuevo, estados: { ...c.estados, cast: c.estados.cast === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const editFisico = (id: string, v: string) =>
    setComercial((c) => (c.cast
      ? { ...c, cast: { ...c.cast, personajes: c.cast.personajes.map((p) => (p.id === id ? { ...p, fisicoEn: v } : p)) }, estados: { ...c.estados, cast: 'editado' } }
      : c));

  return (
    <PasoShell
      titulo="Cast" sub="La ficha de cada personaje. La app la usa para generar su IMAGEN en el Pack Flow — vos no pegás esto en Flow."
      hasContent={!!cast} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={!!cast?.personajes?.length} approveLabel="Cast listo, al storyboard"
      functionId="cast" estado={estadoDelPaso('cast', comercial)}
    >
      {cast ? (
        <>
          <div className="cast-grid">
            {cast.personajes.map((p, i) => {
              const open = closed[p.id] !== true;
              return (
                <article key={p.id} className="cast-card">
                  <div className="cast-card-head">
                    <span className={`cast-avatar cast-avatar--${i % 2 === 0 ? 'gold' : 'violet'}`}>{(p.nombre || '?')[0]}</span>
                    <div className="cast-id">
                      <span className="cast-name">{p.nombre}</span>
                      <span className="cast-rol">{p.rol}</span>
                    </div>
                  </div>
                  {p.fisicoEs && <p className="cast-es">{p.fisicoEs}</p>}
                  <div className="cast-en">
                    <button className="cast-en-toggle" onClick={() => setClosed((s) => ({ ...s, [p.id]: !s[p.id] }))} aria-expanded={open}>
                      {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      <span className="cast-en-lbl">fisicoEn</span>
                      <span className="cast-en-badge">genera la imagen del personaje (Pack Flow)</span>
                    </button>
                    {open && <InlineEdit value={p.fisicoEn} onChange={(v) => editFisico(p.id, v)} rows={3} />}
                  </div>
                </article>
              );
            })}
          </div>
          {cast.lugar && (
            <article className="cast-loc">
              <div className="cast-loc-head">
                <span className="cast-loc-ico"><MapPin size={16} /></span>
                <span className="cast-loc-name">{cast.lugar.nombre}</span>
                {cast.lugar.luz && <span className="cast-loc-luz"><Sun size={12} /> {cast.lugar.luz}</span>}
              </div>
              {cast.lugar.descripcionEn && <p className="cast-loc-desc">{cast.lugar.descripcionEn}</p>}
            </article>
          )}
        </>
      ) : (
        !busy && <PasoEmpty icon={Users}>Generá el cast desde el concepto y el guion: cada personaje llega con su descripción física, que la app usa para generar su imagen de referencia en el Pack Flow.</PasoEmpty>
      )}
    </PasoShell>
  );
}
