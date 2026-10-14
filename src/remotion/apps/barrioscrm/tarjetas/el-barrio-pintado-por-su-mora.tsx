import React from 'react';
import { Aviso, Barra, Boton, Numero, Pastilla, Tarjeta, Toque, cuenta, ease, entra, lin, momento, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) el barrio se pinta manzana por manzana (M01 a M12)
  const pinta0 = momento(dur, 0.1), pinta1 = momento(dur, 0.56);
  // 2) entran los verdes y los ámbar, y cuentan solos
  const n1 = momento(dur, 0.28), n2 = momento(dur, 0.46), fin = momento(dur, 0.82);
  // 3) los ocho rojos quedan latiendo
  const alarma = momento(dur, 0.6);
  const late = ease(f, alarma, alarma + 10);
  // 4) el aviso del corte sale y entra el configurador
  const avisoIn = momento(dur, 0.06), avisoOut = momento(dur, 0.66);
  const botonIn = momento(dur, 0.74), tap = momento(dur, 0.84);
  const apreta = ease(f, tap, tap + 6) * (1 - ease(f, tap + 14, tap + 22));

  return (
    <Tarjeta
      f={f} m={m} icono="pin"
      titulo="El barrio, pintado por su mora"
      bajada="Finca Eugenio · 12 manzanas · 240 lotes"
      derecha={<Pastilla m={m} texto="Mora" color={m.acento} />}
    >
      {f < botonIn ? (
        <Aviso
          m={m} icono="casa" color={m.acento}
          titulo="240 lotes repartidos en 12 manzanas"
          texto="el color de cada uno cuenta su mora"
          style={{ ...entra(f, avisoIn), opacity: ease(f, avisoIn, avisoIn + 12) * (1 - lin(f, avisoOut, avisoOut + 10)) }}
        />
      ) : (
        <Boton m={m} texto="Configurador de mapa" icono="herramienta" color={m.secundario} apretado={apreta} style={entra(f, botonIn)} />
      )}

      <Barra m={m} valor={ease(f, pinta0, pinta1)} color={m.exito} tramos={12} />

      <div style={{ display: 'flex', gap: 18, ...entra(f, n1) }}>
        <Numero m={m} etiqueta="Al día" texto={String(Math.round(cuenta(f, n1, fin, 0, 196)))} color={m.exito} style={{ flex: 1 }} />
        <Numero m={m} etiqueta="1 período" texto={String(Math.round(cuenta(f, n1 + 8, fin, 0, 24)))} color={m.alerta} style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'flex', gap: 18, ...entra(f, n2) }}>
        <Numero m={m} etiqueta="2 períodos" texto={String(Math.round(cuenta(f, n2, fin, 0, 12)))} color={m.secundario} style={{ flex: 1 }} />
        <Numero
          m={m} etiqueta="3+ alarma" texto={String(Math.round(cuenta(f, n2 + 8, fin, 0, 8)))} color={m.error}
          style={{ flex: 1, border: `2px solid ${m.error}${late > 0.5 ? '99' : '00'}`, transform: `scale(${1 + 0.03 * late * pulso(f, 22)})`, boxShadow: `0 0 ${34 * late * pulso(f, 22)}px ${m.error}55` }}
        />
      </div>

      {f >= botonIn ? <Toque x={540} y={536} apreta={apreta} visible={ease(f, botonIn + 4, botonIn + 12)} /> : null}
    </Tarjeta>
  );
};
