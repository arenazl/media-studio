import React from 'react';
import { Aviso, Boton, Fila, Pastilla, Tarjeta, Toque, ease, entra, momento, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) entran los períodos con su estado
  const p1 = momento(dur, 0.1), p2 = momento(dur, 0.18), p3 = momento(dur, 0.26);
  // 2) aparece el botón y el dedo lo aprieta
  const bot = momento(dur, 0.34);
  const toca = momento(dur, 0.44);
  const apreta = ease(f, toca, toca + 7) * (1 - ease(f, toca + 12, toca + 20));
  const dedo = ease(f, toca - 10, toca - 2) * (1 - ease(f, toca + 18, toca + 26));
  // 3) se abre la hoja: elegir período, monto y foto del comprobante
  const hoja = momento(dur, 0.52);
  const abierta = ease(f, hoja, hoja + 10) * (1 - ease(f, momento(dur, 0.72), momento(dur, 0.76)));
  // 4) al volver, el de arriba pasa de rojo a "En revisión"
  const revisa = momento(dur, 0.78);
  const enRevision = ease(f, revisa, revisa + 10);

  return (
    <Tarjeta
      f={f}
      m={m}
      icono="documento"
      titulo="Detalle Período por Período"
      bajada="Buscar período"
      derecha={<Pastilla m={m} texto="Cuenta" color={m.acento} />}
    >
      <Fila
        m={m}
        icono={enRevision > 0.5 ? 'reloj' : 'documento'}
        etiqueta="Octubre 2026"
        detalle={enRevision > 0.5 ? 'Informar un pago' : 'Tocá para volver a subirlo'}
        valor="$85.000"
        destacada
        color={enRevision > 0.5 ? m.info : m.error}
        pastilla={enRevision > 0.5
          ? <Pastilla m={m} texto="En revisión" color={m.info} style={{ transform: `scale(${0.8 + 0.2 * enRevision})` }} />
          : <Pastilla m={m} texto="Rechazado" color={m.error} style={{ opacity: 0.6 + 0.4 * pulso(f, 26) }} />}
        style={entra(f, p1)}
      />
      <Fila m={m} icono="documento" etiqueta="Septiembre 2026" detalle="Tocá para volver a subirlo" valor="$85.000" pastilla={<Pastilla m={m} texto="Rechazado" color={m.error} />} style={entra(f, p2)} />
      <Fila m={m} icono="documento" etiqueta="Agosto 2026" detalle="Tocá para volver a subirlo" valor="$85.000" pastilla={<Pastilla m={m} texto="Rechazado" color={m.error} />} style={entra(f, p3)} />

      {abierta > 0.02 ? (
        <Aviso
          m={m}
          icono="tarjeta"
          titulo="Informar un pago"
          texto="Julio 2026 · $85.000 · foto del comprobante"
          color={m.acento}
          style={{ opacity: abierta, transform: `translateY(${(1 - abierta) * 26}px)` }}
        />
      ) : (
        <Boton m={m} texto="Informar un pago" icono="mas" apretado={apreta} style={{ ...entra(f, bot) }} />
      )}

      <Toque x={540} y={1070} apreta={apreta} visible={dedo} />
    </Tarjeta>
  );
};
