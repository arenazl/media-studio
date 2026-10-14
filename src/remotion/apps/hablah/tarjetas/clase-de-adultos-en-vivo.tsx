import React from 'react';
import { Aviso, Fila, Subtitulo, Tarjeta, Voz, ease, entra, momento, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) el tutor habla: el aro late y la frase se escribe palabra por palabra
  const hablaIni = momento(dur, 0.1), hablaFin = momento(dur, 0.52);
  const habla = ease(f, hablaIni, hablaIni + 8) * (1 - ease(f, hablaFin, hablaFin + 10));
  const avance = ease(f, hablaIni + 4, hablaFin);
  // 2) el tutor calla: el rótulo pasa a TU TURNO
  const turno = ease(f, hablaFin + 6, hablaFin + 14);
  // 3) en Transcripción entra la burbuja del tutor y, debajo, la ayuda en castellano
  const burbuja = momento(dur, 0.3), ayuda = momento(dur, 0.62);
  // 4) la ayuda reemplaza a la burbuja de abajo (nada se monta)
  const segunda = momento(dur, 0.44);
  return (
    <Tarjeta f={f} m={m} icono="chat" titulo="Mi último viaje" bajada="Transcripción · te dijo el tutor:">
      <Voz
        m={m} f={f} habla={habla}
        color={turno > 0.5 ? m.secundario : m.acento}
        rotulo={turno > 0.5 ? 'Tu turno' : 'El tutor habla'}
      />
      <Subtitulo
        m={m} texto={'"Hi Matias, I\'m Sam. What was the last trip you took?"'}
        avance={avance} resaltar={['trip']} quien="Te dijo el tutor:"
      />
      {ayuda > 0 && f >= ayuda ? (
        <Aviso
          m={m} icono="estrella" color={m.secundario}
          titulo="Hi Matias, I'm Sam."
          texto="Es una forma común de presentarse: 'Hola [nombre], soy [tu nombre].'"
          style={entra(f, ayuda)}
        />
      ) : (
        <Fila
          m={m} icono="usuario" etiqueta="Hi Matias, I'm Sam." detalle="Tutor"
          destacada color={m.acento} style={entra(f, burbuja)}
        />
      )}
      {f >= segunda && f < ayuda ? (
        <Fila m={m} icono="chat" etiqueta="What was the last trip you took?" detalle="Tutor" style={entra(f, segunda)} />
      ) : null}
    </Tarjeta>
  );
};
