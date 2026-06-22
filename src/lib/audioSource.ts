// Fuente de audio del estudio: lógica PURA (peaks, validación, formato) testeable +
// store IndexedDB del "audio real" (locutor) por reel. El audio real no entra a
// localStorage (es pesado): metadata/segmentos van en VoiceConfig; el blob acá.

// ---------- lógica pura (unit-testeable) ----------

// Reduce un canal de audio a N picos normalizados 0..1 para dibujar la onda.
// Misma lógica que tenía VoiceStudio inline; extraída para reuso (TTS + audio real) y test.
export function computePeaks(channel: ArrayLike<number>, n = 260): number[] {
  const len = channel.length;
  if (!len || n <= 0) return [];
  const step = Math.max(1, Math.floor(len / n));
  const pk: number[] = [];
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (let j = 0; j < step; j++) {
      const v = Math.abs(channel[i * step + j] || 0);
      if (v > m) m = v;
    }
    pk.push(m);
  }
  const mx = Math.max(...pk, 0.001);
  return pk.map((v) => v / mx);
}

export const ACCEPTED_AUDIO = '.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac';
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|oga|webm|flac)$/i;

// ¿Es un archivo de audio? Acepta por MIME o por extensión (algunos navegadores no
// setean type en archivos locales).
export function isAudioFile(file: { type?: string; name?: string }): boolean {
  if (file.type && file.type.startsWith('audio/')) return true;
  return !!file.name && AUDIO_EXT.test(file.name);
}

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

// segundos → "m:ss" (cronómetro). Negativos/NaN → "0:00".
export function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------- store IndexedDB del audio real por reel ----------

interface RealAudioRec { reelId: string; blob: Blob; mime: string; dur: number; createdAt: number }

const DB_NAME = 'ms-realaudio';
const STORE = 'audio';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'reelId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putRealAudio(reelId: string, blob: Blob, dur: number): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ reelId, blob, mime: blob.type, dur, createdAt: Date.now() } as RealAudioRec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getRec(reelId: string): Promise<RealAudioRec | undefined> {
  const db = await openDB();
  const rec = await new Promise<RealAudioRec | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(reelId);
    req.onsuccess = () => resolve(req.result as RealAudioRec | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rec;
}

// objectURL del audio real del reel (para reproducir/pintar). Recordá revocarlo.
export async function getRealAudioUrl(reelId: string): Promise<string | null> {
  const rec = await getRec(reelId);
  return rec?.blob ? URL.createObjectURL(rec.blob) : null;
}

export async function getRealAudioBlob(reelId: string): Promise<Blob | null> {
  const rec = await getRec(reelId);
  return rec?.blob ?? null;
}

export async function delRealAudio(reelId: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(reelId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
