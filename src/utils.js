import { CURRENCY } from './constants.js';

export const fmt = (n) => `${CURRENCY}${(Math.round(Number(n) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const sumSpent = (tx = []) => tx.reduce((a, t) => a + Number(t.amount || 0), 0);

export const remaining = (bucket) => Number(bucket.budget) - sumSpent(bucket.transactions);

export const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const isToday = (iso) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const haptic = (ms = 12) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
};
