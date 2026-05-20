import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import AnimatedBackdrop from './components/AnimatedBackdrop.jsx';
import BucketCard from './components/BucketCard.jsx';
import AddExpenseModal from './components/AddExpenseModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import BudgetSetup from './components/BudgetSetup.jsx';
import Confetti from './components/Confetti.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { DEFAULT_BUCKETS, STORAGE_KEY } from './constants.js';
import { fmt, haptic, isToday, sumSpent, uid } from './utils.js';

const initialState = () => ({
  setupComplete: false,
  buckets: DEFAULT_BUCKETS.map((b) => ({ ...b, transactions: [] })),
});

export default function App() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, initialState);
  const [expandedId, setExpandedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  const buckets = state.buckets;

  const totals = useMemo(() => {
    const budget = buckets.reduce((a, b) => a + Number(b.budget || 0), 0);
    const spent = buckets.reduce((a, b) => a + sumSpent(b.transactions), 0);
    const today = buckets.reduce((a, b) => a + sumSpent(b.transactions.filter((t) => isToday(t.date))), 0);
    return { budget, spent, today, left: budget - spent };
  }, [buckets]);

  const finishSetup = (cleaned) => {
    setState({ setupComplete: true, buckets: cleaned });
    setShowSetup(false);
  };

  const onAddExpense = (bucket) => setEditing(bucket);

  const onConfirmExpense = ({ amount, note }) => {
    const id = editing.id;
    setState((s) => ({
      ...s,
      buckets: s.buckets.map((b) =>
        b.id === id
          ? { ...b, transactions: [...b.transactions, { id: uid(), amount, note, date: new Date().toISOString() }] }
          : b
      ),
    }));
    haptic(20);
    const rect = document.activeElement?.getBoundingClientRect?.();
    setConfettiTrigger({
      id: uid(),
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
    });
    setEditing(null);
  };

  const onDeleteTx = (bucketId, txId) => {
    setConfirmDelete({ bucketId, txId });
  };

  const reallyDeleteTx = () => {
    const { bucketId, txId } = confirmDelete;
    setState((s) => ({
      ...s,
      buckets: s.buckets.map((b) =>
        b.id === bucketId ? { ...b, transactions: b.transactions.filter((t) => t.id !== txId) } : b
      ),
    }));
    setConfirmDelete(null);
  };

  const onReset = () => {
    setState((s) => ({
      ...s,
      buckets: s.buckets.map((b) => ({ ...b, transactions: [] })),
    }));
    setConfirmReset(false);
    haptic(30);
    setConfettiTrigger({ id: uid(), x: window.innerWidth / 2, y: 120 });
  };

  if (!state.setupComplete || showSetup) {
    return (
      <div className="min-h-screen px-4 py-10">
        <AnimatedBackdrop />
        <BudgetSetup initial={buckets.map((b) => ({ ...b }))} onSave={finishSetup} />
      </div>
    );
  }

  const pct = Math.min(100, (totals.spent / Math.max(totals.budget, 1)) * 100);

  return (
    <div className="min-h-screen px-4 pt-8 pb-28 max-w-2xl mx-auto">
      <AnimatedBackdrop />
      <Confetti trigger={confettiTrigger} />

      <header className="flex items-center justify-between gap-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-grad">5-Bucket Tracker</h1>
          <div className="text-xs text-platinum/60 mt-0.5">
            Today: <span className="text-platinum">{fmt(totals.today)}</span> · Left this month: <span className="text-malachite">{fmt(totals.left)}</span>
          </div>
        </motion.div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10"
            title="Edit budgets"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10"
            title="Reset month"
          >
            Reset
          </button>
        </div>
      </header>

      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mt-5 glass rounded-3xl p-5 relative overflow-hidden"
      >
        <div className="sheen-overlay" />
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-platinum/50">Spent this month</div>
            <div className="text-3xl font-bold mt-1">
              <span className="text-platinum">{fmt(totals.spent)}</span>
              <span className="text-platinum/40 text-base font-normal"> / {fmt(totals.budget)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-platinum/50">Used</div>
            <div className="text-2xl font-semibold" style={{ color: pct > 90 ? '#ef4444' : '#1dd561' }}>
              {pct.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-black/40 overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1dd561, #7b2cbf)' }}
          />
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
          {buckets.map((b) => (
            <BucketCard
              key={b.id}
              bucket={b}
              expanded={expandedId === b.id}
              onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              onAddExpense={onAddExpense}
              onDeleteTx={onDeleteTx}
            />
          ))}
        </AnimatePresence>
      </div>

      <footer className="mt-10 text-center text-[11px] text-platinum/40">
        Saved locally on this device · 5-Bucket Tracker
      </footer>

      <AddExpenseModal
        bucket={editing}
        onClose={() => setEditing(null)}
        onConfirm={onConfirmExpense}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset the month?"
        message="Budgets snap back and every transaction is cleared. This can't be undone."
        confirmText="Reset everything"
        cancelText="Keep my data"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={onReset}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete transaction?"
        message="It will be removed and your bucket balance refunded."
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={reallyDeleteTx}
      />
    </div>
  );
}
