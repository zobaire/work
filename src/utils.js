import { DEFAULT_CURRENCY } from './constants.js';

export const fmt = (n, currency = DEFAULT_CURRENCY) =>
  `${currency}${(Math.round(Number(n) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

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

export const isInMonth = (iso, year, month) => {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month;
};

export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const parseMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m - 1 };
};

export const monthLabel = (key) => {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const fmtDateFull = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const haptic = (ms = 12) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
};
