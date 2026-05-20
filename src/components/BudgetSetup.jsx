import { motion } from 'framer-motion';
import { useState } from 'react';
import { DEFAULT_BUCKETS } from '../constants.js';
import { fmt } from '../utils.js';

export default function BudgetSetup({ initial = DEFAULT_BUCKETS, onSave }) {
  const [drafts, setDrafts] = useState(initial.map((b) => ({ ...b, budget: String(b.budget) })));

  const total = drafts.reduce((a, b) => a + (Number(b.budget) || 0), 0);

  const update = (id, val) => {
    setDrafts((d) => d.map((b) => (b.id === id ? { ...b, budget: val } : b)));
  };

  const save = () => {
    const cleaned = drafts.map((b) => ({
      ...b,
      budget: Math.max(0, Number(b.budget) || 0),
      transactions: Array.isArray(b.transactions) ? b.transactions : [],
    }));
    onSave(cleaned);
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
        <h1 className="text-3xl font-bold tracking-tight text-grad">5-Bucket Tracker</h1>
        <p className="text-platinum/60 text-sm mt-2">Set your monthly bucket budgets. You can change these later.</p>
      </div>

      <div className="glass rounded-3xl p-5 space-y-3">
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
            <div className="flex-1">
              <div className="text-sm text-platinum">{b.name}</div>
              <div className="text-[11px] text-platinum/50">Recommended {fmt(DEFAULT_BUCKETS.find((d) => d.id === b.id)?.budget ?? 0)}</div>
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
          <div className="text-xs uppercase tracking-widest text-platinum/50">Total</div>
          <div className="text-lg font-semibold text-platinum">{fmt(total)}</div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        onClick={save}
        className="w-full mt-5 py-3.5 rounded-2xl font-semibold text-amethyst"
        style={{ background: 'linear-gradient(135deg, #1dd561, #7b2cbf)', boxShadow: '0 14px 30px -10px #1dd561' }}
      >
        Start tracking
      </motion.button>
    </motion.div>
  );
}
