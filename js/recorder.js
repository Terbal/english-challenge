// recorder.js — 100% local audio recording using MediaRecorder.
// Audio blobs are stored in IndexedDB (localStorage isn't suited to binary data);
// nothing is ever uploaded anywhere.

const Recorder = (() => {
  const DB_NAME = "100days_english_audio";
  const STORE = "recordings";
  let db = null;
  let mediaRecorder = null;
  let chunks = [];
  let stream = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const _db = req.result;
        if (!_db.objectStoreNames.contains(STORE)) {
          _db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.start();
  }

  function stop() {
    return new Promise((resolve) => {
      if (!mediaRecorder) return resolve(null);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (stream) stream.getTracks().forEach(t => t.stop());
        resolve(blob);
      };
      mediaRecorder.stop();
    });
  }

  function isRecording() {
    return mediaRecorder && mediaRecorder.state === "recording";
  }

  async function save(day, blob) {
    const _db = await openDB();
    const id = `${day}-${Date.now()}`;
    const record = { id, day, blob, createdAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function listForDay(day) {
    const _db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter(r => r.day === day).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(id) {
    const _db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  function isSupported() {
    return !!(navigator.mediaDevices && window.MediaRecorder && window.indexedDB);
  }

  return { start, stop, isRecording, save, listForDay, remove, isSupported };
})();
