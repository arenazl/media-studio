import React from 'react';
import { Aviso, Boton, Fila, Pastilla, Tarjeta, Toque, ease, entra, momento, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) entra la lista de la ronda: el lote en alarma y el botón de voz
  const a1 = momento(dur, 0.1);
  const a2 = momento(dur, 0.2);
  // 2) el dedo aprieta "Decilo": el botón late una vez y se hunde
  const toca = momento(dur, 0.42);
  const apreta = ease(f, toca, toca + 6) * (1 - ease(f, toca + 12, toca + 20));
  const dedo = ease(f, toca - 12, toca - 2) * (1 - ease(f, toca + 16, toca + 26));
  const late = 1 + 0.03 * pulso(f, 26) * (1 - ease(f, toca, toca + 8));
  // 3) se dicta la gestión: la fila sale y entra la gestión registrada
  const dicta = momento(dur, 0.58);
  const cierra = momento(dur, 0.72);
  const sinGestion = 1 - ease(f, cierra, cierra + 10);
  const registrada = ease(f, cierra + 12, cierra + 24);

  return (
    <Tarjeta
      f={f}
      m={m}
      icono="campana"
      titulo="Panel de Portería"
      bajada="Alarmas 8 · Sin gestionar · 6"
      derecha={<Pastilla m={m} texto="Portería" color={m.acento} />}
    >
      <div style={{ ...entra(f, a1), transform: `scale(${late})` }}>
        <Boton m={m} texto="Decilo" icono="chat" color={m.exito} apretado={apreta} />
      </div>

      <Fila
        m={m}
        icono="casa"
        etiqueta="M10-L018"
        detalle="8 períodos · en alarma desde 19/07/2026"
        valor="$680.000"
        destacada
        color={m.error}
        pastilla={<Pastilla m={m} texto="Sin gestionar" color={m.error} />}
        style={entra(f, a2)}
      />

      {sinGestion > 0.5 ? (
        <Fila
          m={m}
          icono="reloj"
          etiqueta="Sin gestiones aún"
          detalle="Llamar · WhatsApp · Registrar gestión"
          style={{ ...entra(f, a2 + 8), opacity: sinGestion }}
        />
      ) : (
        <Aviso
          m={m}
          icono="check"
          titulo="Registrar gestión"
          texto="En seguimiento · 2"
          color={m.exito}
          style={{ opacity: registrada, transform: `translateY(${(1 - registrada) * 20}px)` }}
        />
      )}

      {dicta > 0 ? null : null}
      <Toque x={820} y={560} apreta={apreta} visible={dedo} />
    </Tarjeta>
  );
};
