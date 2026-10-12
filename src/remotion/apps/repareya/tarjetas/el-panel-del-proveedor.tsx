// RepareHoy · 07 El panel del proveedor
// Qué cuenta: el proveedor ve su mes en números y, cuando entra un trabajo nuevo, todo se recalcula solo:
// Solicitudes 12 → 14, Confirmadas 9 → 10, Ingresos est. $9.496.000 → $10.116.000 y la conversión baja de 75% a 71%
// porque el segundo pedido todavía no se aceptó. Datos tal cual los estados 07-a / 07-b.
import React from 'react';
import { Fila, Numero, Pastilla, Tarjeta, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) las métricas del mes entran de a una
  const k1 = momento(dur, 0.10), k2 = momento(dur, 0.20), k3 = momento(dur, 0.30), k4 = momento(dur, 0.40);
  // 2) entra el trabajo nuevo y los números se recalculan solos hasta el final
  const ca = momento(dur, 0.54), cb = momento(dur, 0.88);
  const cambiando = ease(f, ca, ca + 8) - ease(f, cb, cb + 10);
  const nuevo = ease(f, ca, ca + 10) > 0.5;

  const solicitudes = Math.round(cuenta(f, ca, cb, 12, 14));
  const confirmadas = Math.round(cuenta(f, ca, cb, 9, 10));
  const ingresos = cuenta(f, ca, cb, 9496000, 10116000);
  const conversion = Math.round(cuenta(f, ca, cb, 75, 71));
  const cotizaciones = Math.round(cuenta(f, ca, cb, 12, 14));
  const rating = cuenta(f, ca, cb, 4.78, 4.80).toFixed(2);
  const resenas = Math.round(cuenta(f, ca, cb, 9, 10));

  return (
    <Tarjeta
      f={f}
      m={m}
      icono="grafico"
      titulo="Hola Marcelo"
      bajada="Tu performance de los últimos 30 días."
      derecha={<Pastilla m={m} texto="Dom, 11 Oct" color={m.acento} style={{ opacity: 0.65 + 0.35 * pulso(f, 42) }} />}
    >
      <div style={{ display: 'flex', gap: 18, ...entra(f, k1) }}>
        <Numero m={m} etiqueta="Solicitudes" texto={String(solicitudes)} color={m.texto} style={{ flex: 1 }} />
        <Numero m={m} etiqueta="Confirmadas" texto={String(confirmadas)} color={m.exito} style={{ flex: 1 }} />
      </div>

      <Numero m={m} etiqueta="Ingresos est." texto={pesos(ingresos)} color={m.acento} style={entra(f, k2)} />

      <Fila
        m={m}
        icono="rayo"
        etiqueta="Conversión"
        detalle={nuevo ? '12 aceptadas de 14' : '11 aceptadas de 12'}
        valor={`${conversion}%`}
        destacada={cambiando > 0.1}
        color={nuevo ? m.alerta : m.exito}
        pastilla={<Pastilla m={m} texto="Comprometido en agenda" color={nuevo ? m.alerta : m.exito} />}
        style={entra(f, k3)}
      />

      <Fila
        m={m}
        icono="estrella"
        etiqueta="6 servicios activos"
        detalle={`${cotizaciones} cotizaciones`}
        valor={rating}
        pastilla={<Pastilla m={m} texto={`${resenas} reseñas totales`} color={m.info} />}
        style={entra(f, k4)}
      />
    </Tarjeta>
  );
};
