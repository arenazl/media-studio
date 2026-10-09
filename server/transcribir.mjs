// Transcripción palabra por palabra de un clip (ElevenLabs Scribe), con caché al lado del archivo
// (`<clip>.words.json`): el mismo clip no se transcribe dos veces. La clave nunca se imprime.
import fs from 'node:fs';
import path from 'node:path';

export async function transcribirArchivo(file, { apiKey, idioma = 'spa' } = {}) {
  const cache = `${file}.words.json`;
  if (fs.existsSync(cache)) {
    try { return JSON.parse(fs.readFileSync(cache, 'utf8')); } catch { /* caché rota: se regenera */ }
  }
  if (!apiKey) throw new Error('falta ELEVENLABS_API_KEY para transcribir los clips');
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', idioma);
  fd.append('timestamps_granularity', 'word');
  fd.append('tag_audio_events', 'false');
  fd.append('file', await fs.openAsBlob(file), path.basename(file));
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': apiKey }, body: fd });
  if (!r.ok) throw new Error(`ElevenLabs STT ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const words = (j.words || []).filter((w) => w.type === 'word').map((w) => ({ text: w.text, start: w.start, end: w.end }));
  const out = { text: j.text || '', words, modelo: 'scribe_v1', creado: Date.now() };
  fs.writeFileSync(cache, JSON.stringify(out));
  return out;
}
