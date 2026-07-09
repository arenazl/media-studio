// Paso 4 — CAST (solo filmado). Corre el molde `cast`: personajes con descripción física EXACTA
// (fisicoEn, editable, con warning de que va VERBATIM a cada prompt) + la locación.
import { useState } from 'react';
import { PasoShell, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import type { Cast, CharacterSheet } from '../lib/comercial';

export default function PasoCast({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
      titulo="Cast" sub="Personajes con descripción física exacta (se pega verbatim en cada prompt) y la locación."
      hasContent={!!cast} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={!!cast?.personajes?.length} approveLabel="Cast listo, al storyboard"
    >
      <div className="paso-cards">
        {(cast?.personajes || []).map((p) => (
          <article key={p.id} className="paso-char">
            <div className="paso-char-h"><strong>{p.nombre}</strong> <span className="paso-char-rol">{p.rol}</span></div>
            {p.fisicoEs && <div className="paso-char-es">{p.fisicoEs}</div>}
            <label className="paso-char-lbl">fisicoEn <span className="paso-warn">se pega VERBATIM en todos los prompts</span></label>
            <InlineEdit value={p.fisicoEn} onChange={(v) => editFisico(p.id, v)} rows={3} />
          </article>
        ))}
        {cast?.lugar && (
          <article className="paso-char">
            <div className="paso-char-h"><strong>Locación:</strong> {cast.lugar.nombre} <span className="paso-char-rol">{cast.lugar.luz}</span></div>
            <div className="paso-block-visual">{cast.lugar.descripcionEn}</div>
          </article>
        )}
        {!cast && !busy && <div className="paso-empty">Generá el cast desde el concepto y el guion.</div>}
      </div>
    </PasoShell>
  );
}
