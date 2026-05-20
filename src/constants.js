export const STORAGE_KEY = 'fiveBucketTracker.v1';
export const SNAPSHOT_KEY = 'fiveBucketTracker.snapshots.v1';
export const MAX_SNAPSHOTS = 10;

export const DEFAULT_BUCKETS = [
  { id: 'food',      name: 'Food',         budget: 880, color: '#1dd561', emoji: '🥗', accent: 'food' },
  { id: 'transport', name: 'Transport',    budget: 140, color: '#3b82f6', emoji: '🚇', accent: 'transport' },
  { id: 'leisure',   name: 'Leisure',      budget: 160, color: '#a855f7', emoji: '🎮', accent: 'leisure' },
  { id: 'hygiene',   name: 'Hygiene/Misc', budget: 120, color: '#cbd5e1', emoji: '🧴', accent: 'hygiene' },
];

export const DEFAULT_STARTING_BALANCE = 2000;
export const DEFAULT_CURRENCY = '¥';

export const CURRENCIES = [
  { symbol: '¥', label: 'CNY ¥' },
  { symbol: '$', label: 'USD $' },
  { symbol: '€', label: 'EUR €' },
  { symbol: '£', label: 'GBP £' },
  { symbol: 'A$', label: 'AUD A$' },
];

export const APP_NAME = 'Budget Buckets';
