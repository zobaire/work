import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useCurrency } from '../CurrencyContext.jsx';
import { fmt, fmtDateFull, isInMonth, monthKey, monthLabel, parseMonthKey } from '../utils.js';

const TYPE_META = {
  income:           { icon: '💰', label: 'Income',      color: '#1dd561', sign: '+' },
  spend:            { icon: '🛒', label: 'Spend',       color: '#cbd5e1', sign: '−' },
  other:            { icon: '🧾', label: 'Other',       color: '#cbd5e1', sign: '−' },
  savings_in:       { icon: '🏦', label: 'To Savings',  color: '#1dd561', sign: '−' },
  savings_out:      { icon: '🏦', label: 'From Savings',color: '#1dd561', sign: '+' },
  emergency_in:     { icon: '🚨', label: 'To Emergency',color: '#ef4444', sign: '−' },
  emergency_out:    { icon: '🚨', label: 'From Emergency', color: '#ef4444', sign: '+' },
};

export function buildLedger(state) {
  const events = [];
  for (const t of state.income?.transactions ?? []) {
    events.push({ id: t.id, date: t.date, type: 'income', amount: +t.amount, mainDelta: +t.amount, note: t.note, label: t.source || 'Income' });
  }
  for (const b of state.buckets ?? []) {
    for (const t of b.transactions ?? []) {
      events.push({ id: t.id, date: t.date, type: 'spend', amount: +t.amount, mainDelta: -t.amount, note: t.note, label: b.name, color: b.color, emoji: b.emoji, source: { kind: 'bucket', bucketId: b.id } });
    }
  }
  for (const t of state.other?.transactions ?? []) {
    events.push({ id: t.id, date: t.date, type: 'other', amount: +t.amount, mainDelta: -t.amount, note: t.note, label: 'Other', source: { kind: 'other' } });
  }
  for (const t of state.savings?.transactions ?? []) {
    const isDep = t.type === 'deposit';
    events.push({
      id: t.id, date: t.date,
      type: isDep ? 'savings_in' : 'savings_out',
      amount: +t.amount,
      mainDelta: isDep ? -t.amount : +t.amount,
      note: t.note,
      label: isDep ? 'To Savings' : 'From Savings',
      source: { kind: 'savings' },
    });
  }
  for (const t of state.emergency?.transactions ?? []) {
    const isDep = t.type === 'deposit';
    events.push({
      id: t.id, date: t.date,
      type: isDep ? 'emergency_in' : 'emergency_out',
      amount: +t.amount,
      mainDelta: isDep ? -t.amount : +t.amount,
      note: t.note,
      label: isDep ? 'To Emergency' : 'From Emergency',
      source: { kind: 'emergency' },
    });
  }
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  let running = Number(state.startingBalance) || 0;
  const withRunning = events.map((e) => {
    running += e.mainDelta;
    return { ...e, runningMain: running };
  });
  return withRunning;
}

export default function Ledger({ state, onEditEvent, onDeleteEvent, onClearAll }) {
  const cur = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

  const allEvents = useMemo(() => buildLedger(state), [state]);

  const months = useMemo(() => {
    const set = new Set([monthKey()]);
    for (const e of allEvents) set.add(monthKey(new Date(e.date)));
    return [...set].sort().reverse();
  }, [allEvents]);

  const { year, month } = parseMonthKey(selectedMonth);
  const monthEvents = useMemo(() => allEvents.filter((e) => isInMonth(e.date, year, month)).reverse(), [allEvents, year, month]);

  const monthIn = monthEvents.filter((e) => e.mainDelta > 0).reduce((a, e) => a + e.mainDelta, 0);
  const monthOut = monthEvents.filter((e) => e.mainDelta < 0).reduce((a, e) => a - e.mainDelta, 0);
  const monthNet = monthIn - monthOut;

  return (
    <div className="glass rounded-3xl p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-platinum/50">Ledger</div>
          <div className="text-lg font-semibold text-platinum mt-0.5">{monthLabel(selectedMonth)}</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-amethyst/70 border border-white/10 text-platinum/90 text-xs rounded-xl px-2 py-1.5"
          >
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          {onClearAll && (
            <button
              onClick={onClearAll}
              title="Wipe all history (cannot be undone)"
              className="text-[11px] px-2.5 py-1.5 rounded-xl text-red-300/80 hover:text-red-200 hover:bg-red-500/10 border border-red-400/20"
            >
              Wipe all
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-black/30 p-2 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-platinum/50">In</div>
          <div className="text-sm font-semibold text-malachite">+{fmt(monthIn, cur)}</div>
        </div>
        <div className="rounded-2xl bg-black/30 p-2 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-platinum/50">Out</div>
          <div className="text-sm font-semibold text-platinum">−{fmt(monthOut, cur)}</div>
        </div>
        <div className="rounded-2xl bg-black/30 p-2 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-platinum/50">Net</div>
          <div className="text-sm font-semibold" style={{ color: monthNet >= 0 ? '#1dd561' : '#ef4444' }}>
            {monthNet >= 0 ? '+' : '−'}{fmt(Math.abs(monthNet), cur)}
          </div>
        </div>
      </div>

      <div className="mt-4 max-h-96 overflow-auto scroll-hidden divide-y divide-white/5">
        {monthEvents.length === 0 && (
          <div className="text-platinum/50 text-sm italic py-6 text-center">No activity this month.</div>
        )}
        <AnimatePresence>
          {monthEvents.map((e) => {
            const meta = TYPE_META[e.type];
            const positive = e.mainDelta >= 0;
            return (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-3 py-2.5 px-1 hover:bg-white/5 rounded-xl cursor-pointer"
                onClick={() => onEditEvent?.(e)}
              >
                <div
                  className="grid place-items-center h-9 w-9 rounded-xl text-base shrink-0"
                  style={{
                    background: `${meta.color}22`,
                    border: `1px solid ${meta.color}44`,
                  }}
                >
                  {e.emoji || meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-platinum truncate">
                    <span className="font-medium">{e.label}</span>
                    {e.note ? <span className="text-platinum/60"> · {e.note}</span> : null}
                  </div>
                  <div className="text-[11px] text-platinum/50">
                    {fmtDateFull(e.date)} · Main → {fmt(e.runningMain, cur)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold" style={{ color: positive ? '#1dd561' : '#f0f0f0cc' }}>
                    {positive ? '+' : '−'}{fmt(e.amount, cur)}
                  </div>
                  {onDeleteEvent && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); onDeleteEvent(e); }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-platinum/60 hover:text-red-400 transition mt-0.5"
                    >
                      delete
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
