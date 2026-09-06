// storage.js — all localStorage access goes through here.
// Keeps a single JSON "state" object under one key so we never
// scatter dozens of ad-hoc localStorage keys around the app.

const STORAGE_KEY = "100days_english_state_v1";

const DEFAULT_STATE = {
  currentDay: 1,
  completedDays: {},      // { [day]: { completedAt, difficulty, confidence, note } }
  streak: 0,
  bestStreak: 0,
  lastCompletedDate: null, // ISO date string (yyyy-mm-dd) of last completion
  vocabProgress: {},       // { "day-index": "new"|"learning"|"review"|"mastered" }
  quizStats: { attempts: 0, correct: 0 },
  settings: { voiceURI: null, rate: 0.95, theme: "dark" },
  recordings: {},          // { [day]: [{id, createdAt, note}] } (audio blobs live in IndexedDB, see recorder.js)
};

const Storage = (() => {
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredCloneSafe(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields introduced later don't break old saves.
      return { ...structuredCloneSafe(DEFAULT_STATE), ...parsed };
    } catch (e) {
      console.error("Storage load failed, resetting.", e);
      return structuredCloneSafe(DEFAULT_STATE);
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error("Storage save failed (quota or private mode?).", e);
      return false;
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return load();
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function daysBetween(isoA, isoB) {
    const a = new Date(isoA + "T00:00:00");
    const b = new Date(isoB + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }

  return { load, save, reset, todayISO, daysBetween, DEFAULT_STATE };
})();
