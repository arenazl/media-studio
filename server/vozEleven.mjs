// La voz de Media Studio, igual que la de las personalidades de SalesBot (2026-10-16, Lucas: "que uses lo mismo"; detalle
// pasado por SalesBot desde backend/services/eleven_transport.py, ADR-031). Sin voice_settings propios: cada voz habla
// con los valores de su creador y el texto va tal cual. Lo único que se toca es técnico:
// - v4 Turbo corta con "input_text_empty" si hay emojis: se sacan, con los espacios dobles.
// - v4 no acepta SSML: <break .../> pasa a "...".
// - largo máximo por pedido: 2000 caracteres en v4 Turbo y 4500 en v3, cortado en un fin de oración.
// Juegan sólo los dos motores de SalesBot. El vigente allá es v4 Turbo; se cambia con MS_VOZ_MODELO.
const API = 'https://api.elevenlabs.io/v1';
export const MODELOS_VOZ = ['eleven_v4_turbo', 'eleven_v3_conversational'];
export const MODELO_VOZ = MODELOS_VOZ.includes(process.env.MS_VOZ_MODELO) ? process.env.MS_VOZ_MODELO : 'eleven_v4_turbo';
const FORMATO = 'mp3_44100_128';
const IDIOMAS = ['es', 'en', 'pt'];

const EMOJIS = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function cortar(texto, max) {
  if (texto.length <= max) return texto;
  const tramo = texto.slice(0, max);
  const fin = Math.max(tramo.lastIndexOf('. '), tramo.lastIndexOf('? '), tramo.lastIndexOf('! '), tramo.lastIndexOf('… '));
  return fin > max * 0.5 ? tramo.slice(0, fin + 1) : tramo;
}

export function textoParaVoz(texto, modelo = MODELO_VOZ) {
  let t = String(texto || '').replace(/<break[^>]*\/>/gi, '...');
  if (modelo === 'eleven_v4_turbo') t = t.replace(EMOJIS, '').replace(/ {2,}/g, ' ');
  return cortar(t.trim(), modelo === 'eleven_v4_turbo' ? 2000 : 4500);
}

async function porRest(texto, voiceId, idioma, key) {
  const r = await fetch(`${API}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${FORMATO}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ model_id: 'eleven_v3_conversational', text: texto, language_code: idioma }),
  });
  if (!r.ok) throw new Error(`ElevenLabs no generó la voz (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

function porWebSocket(texto, voiceId, idioma, key) {
  return new Promise((resolve, reject) => {
    const url = `wss://api.elevenlabs.io/v1/text-to-dialogue/stream-input?model_id=eleven_v4_turbo&output_format=${FORMATO}&language_code=${idioma}`;
    const ws = new WebSocket(url);
    const partes = [];
    let listo = false;
    const terminar = (err) => {
      if (listo) return;
      listo = true;
      clearTimeout(reloj);
      try { ws.close(); } catch { /* ya cerrado */ }
      if (err) reject(err);
      else if (!partes.length) reject(new Error('ElevenLabs no devolvió audio'));
      else resolve(Buffer.concat(partes));
    };
    const reloj = setTimeout(() => terminar(new Error('ElevenLabs tardó más de 65 s')), 65000);
    ws.onopen = () => {
      ws.send(JSON.stringify({ voices: [voiceId], xi_api_key: key }));
      ws.send(JSON.stringify({ inputs: [{ text: texto, voice_id: voiceId, new_turn: false }] }));
      ws.send(JSON.stringify({ close_socket: true }));
    };
    ws.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(String(ev.data)); } catch { return; }
      if (m.error) return terminar(new Error(`ElevenLabs: ${String(m.error.message || m.error).slice(0, 200)}`));
      if (m.audio) partes.push(Buffer.from(m.audio, 'base64'));
      if (m.is_final || m.isFinal) terminar();
    };
    ws.onerror = () => terminar(new Error('se cortó la conexión con ElevenLabs'));
    ws.onclose = () => terminar();
  });
}

// texto + voz -> mp3 (Buffer), con el motor de SalesBot.
export async function sintetizar({ texto, voiceId, idioma = 'es', modelo = MODELO_VOZ, key = process.env.ELEVENLABS_API_KEY }) {
  if (!key) throw new Error('falta ELEVENLABS_API_KEY (.env)');
  const m = MODELOS_VOZ.includes(modelo) ? modelo : MODELO_VOZ;
  const t = textoParaVoz(texto, m);
  if (!t) throw new Error('la frase quedó vacía');
  const lang = IDIOMAS.includes(idioma) ? idioma : 'es';
  return m === 'eleven_v4_turbo' ? porWebSocket(t, voiceId, lang, key) : porRest(t, voiceId, lang, key);
}
