import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCurrency } from '../CurrencyContext.jsx';
import { APP_NAME, CURRENCIES, DEFAULT_BUCKETS, DEFAULT_STARTING_BALANCE } from '../constants.js';
import { fmt } from '../utils.js';

export default function BudgetSetup({
  initial = DEFAULT_BUCKETS,
  initialStartingBalance = DEFAULT_STARTING_BALANCE,
  initialCurrency,
  firstRun = true,
  onSave,
}) {
  const liveCurrency = useCurrency();
  const [drafts, setDrafts] = useState(initial.map((b) => ({ ...b, budget: String(b.budget) })));
  const [startingBalance, setStartingBalance] = useState(String(initialStartingBalance));
  const [currency, setCurrencyState] = useState(initialCurrency || liveCurrency);

  const totalBudgets = drafts.reduce((a, b) => a + (Number(b.budget) || 0), 0);

  const update = (id, val) => {
    setDrafts((d) => d.map((b) => (b.id === id ? { ...b, budget: val } : b)));
  };

  const save = () => {
    const cleaned = drafts.map((b) => ({
      ...b,
      budget: Math.max(0, Number(b.budget) || 0),
      transactions: Array.isArray(b.transactions) ? b.transactions : [],
    }));
    onSave({
      buckets: cleaned,
      startingBalance: Math.max(0, Number(startingBalance) || 0),
      currency,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="text-5xl mb-2"
        >🪣</motion.div>
        <h1 className="text-3xl font-bold tracking-tight text-grad">{APP_NAME}</h1>
        <p className="text-platinum/60 text-sm mt-2">
          {firstRun ? 'Set your starting cash, currency, and monthly budgets.' : 'Adjust your cash, currency, and budgets.'}
        </p>
      </div>

      <div className="glass rounded-3xl p-5 mb-4 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-platinum/50">Starting cash on hand</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-2xl">💰</div>
            <input
              type="number"
              inputMode="decimal"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className="glass-input !flex-1 text-right text-lg"
              style={{ borderColor: '#1dd56155' }}
            />
          </div>
          <div className="text-[11px] text-platinum/50 mt-2">
            Real cash now. Income adds to it. Spending, savings, and emergency all draw from it.
          </div>
        </div>

        <div className="pt-3 border-t border-white/5">
          <div className="text-xs uppercase tracking-widest text-platinum/50 mb-2">Currency</div>
          <div className="flex flex-wrap gap-1.5">
            {CURRENCIES.map((c) => (
              <button
                key={c.symbol}
                onClick={() => setCurrencyState(c.symbol)}
                className="text-xs px-3 py-1.5 rounded-xl border transition"
                style={{
                  background: currency === c.symbol ? '#1dd56122' : 'rgba(16,0,43,0.55)',
                  borderColor: currency === c.symbol ? '#1dd56188' : 'rgba(240,240,240,0.15)',
                  color: currency === c.symbol ? '#1dd561' : '#f0f0f0bb',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-5 space-y-3">
        <div className="text-xs uppercase tracking-widest text-platinum/50">Monthly budgets</div>
        {drafts.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center gap-3"
          >
            <div className="grid place-items-center h-11 w-11 rounded-2xl text-xl shrink-0"
                 style={{ background: `${b.color}22`, border: `1px solid ${b.color}55` }}>
              {b.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-platinum">{b.name}</div>
              <div className="text-[11px] text-platinum/50">
                Recommended {fmt(DEFAULT_BUCKETS.find((d) => d.id === b.id)?.budget ?? 0, currency)}
              </div>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={b.budget}
              onChange={(e) => update(b.id, e.target.value)}
              className="glass-input !w-28 text-right"
              style={{ borderColor: `${b.color}55` }}
            />
          </motion.div>
        ))}
        <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-platinum/50">Total budgets</div>
          <div className="text-lg font-semibold text-platinum">{fmt(totalBudgets, currency)}</div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        onClick={save}
        className="w-full mt-5 py-3.5 rounded-2xl font-semibold text-amethyst"
        style={{ background: 'linear-gradient(135deg, #1dd561, #7b2cbf)', boxShadow: '0 14px 30px -10px #1dd561' }}
      >
        {firstRun ? 'Start tracking' : 'Save changes'}
      </motion.button>
    </motion.div>
  );
}
