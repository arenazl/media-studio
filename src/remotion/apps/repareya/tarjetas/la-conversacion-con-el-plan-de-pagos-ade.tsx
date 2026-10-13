// RepareHoy · 03 · La conversación con el plan de pagos adentro.
// Los mensajes entran de a uno, llega la "Propuesta de pago 1" con los tres montos y el acceso "Plan de pagos enviado";
// el cliente firma y la tarjeta del hilo y el acceso pasan a "Plan de pagos acordado" en verde.
// Datos de los estados 03-a / 03-b / 03-c (Nicolás Romero · Carpintería Marcelo · $620.000).
import React from 'react';
import { Aviso, Fila, Pastilla, Tarjeta, Toque, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) los dos mensajes del pago entran de a uno
  const q1 = momento(dur, 0.1), q2 = momento(dur, 0.26);
  // 2) llega la propuesta al hilo y el acceso de arriba
  const q3 = momento(dur, 0.44);
  // 3) el cliente la toca y firma: todo pasa a acordado
  const qt = momento(dur, 0.62), qf = momento(dur, 0.72), qc = momento(dur, 0.88);
  const firmado = ease(f, qf, qf + 10);
  const apreta = ease(f, qt, qt + 6) * (1 - ease(f, qt + 12, qt + 20));
  const dedo = ease(f, qt - 10, qt) * (1 - ease(f, qt + 16, qt + 24));
  const color = firmado < 0.5 ? m.acento : m.exito;
  return (
    <>
      <Tarjeta
        f={f} m={m} icono="chat"
        titulo="Mensajes directos con el proveedor"
        bajada="Conversación · 4 mensajes"
        derecha={<Pastilla m={m} texto="A 2 km" color={m.texto2} />}
      >
        <Fila
          m={m} icono="usuario"
          etiqueta="¿Cómo manejás el pago?"
          detalle="No quiero adelantar todo."
          style={entra(f, q1)}
        />
        <Fila
          m={m} icono="herramienta"
          etiqueta="Te armo un plan en tres pagos:"
          detalle="una parte para arrancar, otra cuando instalo"
          style={entra(f, q2)}
        />
        <Fila
          m={m} icono={firmado < 0.5 ? 'tarjeta' : 'documento'}
          etiqueta={firmado < 0.5 ? 'Propuesta de pago 1' : 'Plan de pagos acordado'}
          detalle="$124.000 + $248.000 + $248.000"
          valor={pesos(cuenta(f, q3, qc, 0, 620000))}
          destacada color={color}
          pastilla={firmado < 0.5
            ? <Pastilla m={m} texto="3 pagos" color={m.acento} style={{ opacity: 0.65 + 0.35 * pulso(f, 26) }} />
            : <Pastilla m={m} texto="Acordado" color={m.exito} style={{ transform: `scale(${0.8 + 0.2 * firmado})` }} />}
          style={{ ...entra(f, q3), transform: `${entra(f, q3).transform} scale(${1 - 0.04 * apreta})` }}
        />
        <Aviso
          m={m}
          icono={firmado < 0.5 ? 'rayo' : 'check'}
          titulo={firmado < 0.5 ? 'Plan de pagos enviado' : 'Plan de pagos acordado'}
          texto="3 pagos · $620.000 · Ver detalle"
          color={color}
          style={entra(f, q3 + 8)}
        />
      </Tarjeta>
      <Toque x={860} y={872} apreta={apreta} visible={dedo} />
    </>
  );
};
