import { useEffect, useRef } from 'react';
import { MAX_SNAPSHOTS, SNAPSHOT_KEY } from '../constants.js';

const MIN_INTERVAL_MS = 60_000;

export function useAutoBackup(state) {
  const lastStampRef = useRef(0);

  useEffect(() => {
    if (!state || !state.setupComplete) return;
    const now = Date.now();
    if (now - lastStampRef.current < MIN_INTERVAL_MS) return;
    lastStampRef.current = now;

    try {
      const raw = window.localStorage.getItem(SNAPSHOT_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push({ savedAt: new Date().toISOString(), state });
      while (list.length > MAX_SNAPSHOTS) list.shift();
      window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));
    } catch {}
  }, [state]);
}

export function loadSnapshots() {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSnapshots() {
  try { window.localStorage.removeItem(SNAPSHOT_KEY); } catch {}
}
