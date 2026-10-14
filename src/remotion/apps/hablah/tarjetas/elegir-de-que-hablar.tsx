// Habláh · pantalla "Elegir de qué hablar" (05-adultos-elegir-tema).
// Lo que cuenta: la app recomienda un tópico para hoy, se toca y se empieza la charla con un toque.
import React from 'react';
import { Aviso, Boton, Fila, Pastilla, Tarjeta, ease, entra, momento, pulso, Toque, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) entran las tres opciones
  const o1 = momento(dur, 0.1), o2 = momento(dur, 0.18), o3 = momento(dur, 0.26);
  // 2) el dedo toca el recomendado y queda elegido
  const toca = momento(dur, 0.38);
  const apretaT = Math.max(0, 1 - Math.abs(f - (toca + 6)) / 8);
  const elegido = ease(f, toca + 6, toca + 18);
  // 3) 'Tema libre' sale y en su lugar sube la barra 'Tópico elegido' con el botón
  const barra = momento(dur, 0.52);
  const sale = 1 - ease(f, barra - 10, barra);
  // 4) se aprieta 'Empezar charla' y pasa a 'Arrancando…'
  const arranca = momento(dur, 0.78);
  const apretaB = Math.max(0, 1 - Math.abs(f - arranca) / 8);
  const arrancando = ease(f, arranca + 4, arranca + 14);

  return (
    <Tarjeta f={f} m={m} icono="chat" titulo="¿De qué charlamos hoy?" bajada="¿LISTO, MATIAS?" derecha={<Pastilla m={m} texto="12 tópicos" color={m.acento} />}>
      <Fila
        m={m} icono="pin" etiqueta="Mi último viaje" detalle="Todavía no lo tocaste. Buen momento para estrenarlo."
        destacada color={m.exito}
        pastilla={<Pastilla m={m} texto="~7 min · B1" color={m.exito} style={{ opacity: 0.6 + 0.4 * (elegido > 0.5 ? 1 : pulso(f, 28)) }} />}
        style={{ ...entra(f, o1), background: `${m.exito}${elegido > 0.5 ? '2E' : '14'}`, transform: `translateY(${(1 - ease(f, o1, o1 + 12)) * 26}px) scale(${1 + 0.02 * elegido})` }}
      />
      <Fila m={m} icono="estrella" etiqueta="Tópico al azar" detalle="SORPRENDEME" color={m.alerta} style={entra(f, o2)} />
      {sale > 0.02 ? (
        <Fila m={m} icono="campana" etiqueta="Se desbloquea más adelante" detalle="TEMA LIBRE" color={m.info} style={{ ...entra(f, o3), opacity: ease(f, o3, o3 + 12) * sale }} />
      ) : null}
      {f >= barra ? (
        <div style={entra(f, barra, 14)}>
          <Aviso m={m} icono="check" color={m.exito} titulo="TÓPICO ELEGIDO: Mi último viaje" texto="Cocinar en casa · Series de streaming · drama prestigio" />
        </div>
      ) : null}
      {f >= barra + 6 ? (
        <div style={entra(f, barra + 6, 12)}>
          <Boton m={m} texto={arrancando > 0.5 ? 'Arrancando…' : 'Empezar charla'} icono="rayo" color={m.exito} apretado={apretaB} />
        </div>
      ) : null}
      <Toque x={-80 + 560} y={-330 + 520} apreta={apretaT} visible={ease(f, toca - 6, toca) * (1 - ease(f, toca + 14, toca + 22))} />
      <Toque x={-80 + 540} y={-330 + 1000} apreta={apretaB} visible={ease(f, arranca - 8, arranca - 2) * (1 - ease(f, arranca + 12, arranca + 20))} />
    </Tarjeta>
  );
};
