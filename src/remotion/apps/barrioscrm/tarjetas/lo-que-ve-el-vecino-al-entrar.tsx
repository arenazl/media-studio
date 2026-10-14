import React from 'react';
import { Aviso, Barra, Boton, Fila, Numero, Pastilla, Tarjeta, Toque, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) el estado de cuenta en el primer pantallazo: el saldo cuenta solo
  const n0 = momento(dur, 0.1), n1 = momento(dur, 0.45);
  // 2) el aviso del otro lote
  const avisoEn = momento(dur, 0.24);
  // 3) el botón de informar pago, con el dedo
  const botonEn = momento(dur, 0.38);
  const toca = momento(dur, 0.62);
  const apreta = ease(f, toca, toca + 7) * (1 - ease(f, toca + 14, toca + 22));
  // 4) la barra inferior se enciende ícono por ícono hasta el final
  const barraEn = momento(dur, 0.52), barraFin = momento(dur, 0.95);
  const menu: Array<[string, string]> = [['Inicio', 'casa'], ['Cuenta', 'tarjeta'], ['IA Coach', 'rayo'], ['Comunicados', 'campana'], ['Perfil', 'usuario']];

  return (
    <Tarjeta
      f={f} m={m} icono="casa" titulo="Panel Vecino"
      bajada="Estado de cuenta · Lote M10-L018"
      derecha={<Pastilla m={m} texto="8 pendientes" color={m.alerta} />}
    >
      <Aviso
        m={m} color={m.error} icono="campana"
        titulo="Tenés deuda en otro lote de tu cuenta"
        texto="Lote M05-L005 · 1 período · $85.000"
        style={entra(f, avisoEn)}
      />
      <Numero
        m={m} etiqueta="Saldo Adeudado"
        texto={pesos(cuenta(f, n0, n1, 0, 680000))}
        color={m.alerta}
        style={entra(f, n0)}
      />
      <Fila
        m={m} icono="documento" etiqueta="Saldo Pendiente" detalle="Debés 8 períodos"
        valor="$680.000" destacada color={m.alerta}
        pastilla={<Pastilla m={m} texto="En revisión" color={m.info} style={{ opacity: 0.6 + 0.4 * pulso(f, 26) }} />}
        style={entra(f, momento(dur, 0.16))}
      />
      <div style={{ position: 'relative', ...entra(f, botonEn) }}>
        <Boton m={m} texto="Informar Pago" icono="mas" color={m.exito} apretado={apreta} />
        <Toque x={700} y={52} apreta={apreta} visible={ease(f, toca - 10, toca)} />
      </div>
      <div style={{ ...entra(f, barraEn) }}>
        <Barra m={m} valor={ease(f, barraEn, barraFin)} tramos={5} color={m.acento} />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {menu.map(([t], i) => {
            const on = ease(f, barraEn + i * 7, barraEn + i * 7 + 10);
            return (
              <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: 26, fontWeight: 700, color: m.texto2, opacity: 0.25 + 0.75 * on, transform: `translateY(${(1 - on) * 8}px)` }}>{t}</div>
            );
          })}
        </div>
      </div>
    </Tarjeta>
  );
};
