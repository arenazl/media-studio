import React from 'react';
import { Aviso, Fila, Numero, Pastilla, Tarjeta, cuenta, ease, entra, lin, momento, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) arranca analizando
  const analiza = momento(dur, 0.1);
  const listo = momento(dur, 0.3);
  const saleAnalisis = ease(f, listo, listo + 10);

  // 2) la frase destacada se escribe y los tres números cuentan
  const frase = momento(dur, 0.32);
  const fin = momento(dur, 0.55);
  const n0 = momento(dur, 0.38), n1 = momento(dur, 0.62);

  // 3) puntos a pulir: la dicha en rojo, después la corregida en verde
  const mal = momento(dur, 0.62);
  const bien = momento(dur, 0.72);

  // 4) entran los conectores y el vocabulario
  const c0 = momento(dur, 0.78);

  const DICHA = '"I really enjoyed to hike around"';
  const escrito = DICHA.slice(0, Math.round(lin(f, mal, mal + 20) * DICHA.length));

  return (
    <Tarjeta
      f={f} m={m} icono="grafico" titulo="Devolución de la charla" bajada="Sesión #822 · 4 min"
      derecha={<Pastilla m={m} texto={saleAnalisis < 1 ? 'Analizando' : 'Listo'} color={saleAnalisis < 1 ? m.alerta : m.exito} style={{ opacity: saleAnalisis < 1 ? 0.6 + 0.4 * pulso(f, 24) : 1 }} />}
    >
      {saleAnalisis < 1 ? (
        <div style={{ opacity: 1 - saleAnalisis }}>
          <Aviso m={m} titulo="¡Clase terminada con éxito!" texto="Analizando tu charla…" color={m.exito} icono="check" style={entra(f, analiza)} />
        </div>
      ) : (
        <>
          <Fila
            m={m} icono="estrella" destacada color={m.exito}
            etiqueta="¡Excelente cómo describiste los paisajes!"
            detalle={"'The views were incredible from the mountains'".slice(0, Math.round(lin(f, frase, fin) * 47))}
            style={entra(f, listo + 4)}
          />
          <div style={{ display: 'flex', gap: 18, ...entra(f, n0) }}>
            <Numero m={m} etiqueta="Palabras" texto={String(Math.round(cuenta(f, n0, n1, 0, 119)))} color={m.exito} style={{ flex: 1 }} />
            <Numero m={m} etiqueta="WPM" texto={String(Math.round(cuenta(f, n0, n1, 0, 60)))} style={{ flex: 1 }} />
            <Numero m={m} etiqueta="Keywords" texto={`${Math.round(cuenta(f, n0, n1, 0, 20))}/25`} color={m.acento} style={{ flex: 1 }} />
          </div>
          <Fila
            m={m} icono="herramienta" destacada={ease(f, bien, bien + 10) < 1} color={ease(f, bien, bien + 10) < 0.5 ? m.error : m.exito}
            etiqueta={ease(f, bien, bien + 10) < 0.5 ? escrito : '"I really enjoyed hiking around"'}
            detalle="Gramática · Verbos después de 'enjoy'"
            pastilla={<Pastilla m={m} texto={ease(f, bien, bien + 10) < 0.5 ? 'Puntos a pulir' : 'Corregida'} color={ease(f, bien, bien + 10) < 0.5 ? m.error : m.exito} style={{ transform: `scale(${0.8 + 0.2 * ease(f, bien, bien + 10)})` }} />}
            style={entra(f, mal)}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, ...entra(f, c0) }}>
            {['However', 'Therefore', 'In addition', 'breathtaking', 'stunning', 'explore', 'memorable'].map((p, i) => (
              <Pastilla key={p} m={m} texto={p} color={i < 3 ? m.acento : m.info} style={entra(f, c0 + i * 5, 10)} />
            ))}
          </div>
        </>
      )}
    </Tarjeta>
  );
};
