// Librería de VOCES generadas — store en IndexedDB (aguanta los blobs de audio sin el
// tope de localStorage). Se guarda el mp3 + metadata (nombre = primeras palabras del
// texto, voz, duración, fecha). Se reusa "del otro lado" (en el editor) ordenada por
// más recientes. El orden/búsqueda los hace SourcePanel (sortItems/filterItems).

export interface VoiceClipMeta {
  id: string;
  name: string;        // primeras palabras del texto (deriveName)
  voiceId: string;
  voiceName: string;   // nombre del narrador
  dur: number;         // segundos
  createdAt: number;
}
export interface VoiceClip extends VoiceClipMeta { blob: Blob }

const DB_NAME = 'ms-voicelib';
const STORE = 'clips';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addVoiceClip(clip: VoiceClip): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(clip);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// metadata de todos los clips, SIN el blob, ordenados por más recientes.
export async function listVoiceClips(): Promise<VoiceClipMeta[]> {
  const db = await openDB();
  const all = await new Promise<VoiceClip[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as VoiceClip[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all
    .map(({ blob: _blob, ...meta }) => meta)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// objectURL del blob de un clip (para reproducir / sumar al timeline). Recordá revocarlo.
export async function getVoiceBlobUrl(id: string): Promise<string | null> {
  const db = await openDB();
  const clip = await new Promise<VoiceClip | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as VoiceClip | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return clip?.blob ? URL.createObjectURL(clip.blob) : null;
}

export async function deleteVoiceClip(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
