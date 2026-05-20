import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import AnimatedBackdrop from './components/AnimatedBackdrop.jsx';
import BucketCard from './components/BucketCard.jsx';
import AddExpenseModal from './components/AddExpenseModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import BudgetSetup from './components/BudgetSetup.jsx';
import Confetti from './components/Confetti.jsx';
import SavingsCard from './components/SavingsCard.jsx';
import SavingsModal from './components/SavingsModal.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { DEFAULT_BUCKETS, STORAGE_KEY } from './constants.js';
import { fmt, haptic, isToday, sumSpent, uid } from './utils.js';

const emptySavings = () => ({ transactions: [] });

const initialState = () => ({
  setupComplete: false,
  buckets: DEFAULT_BUCKETS.map((b) => ({ ...b, transactions: [] })),
  savings: emptySavings(),
});

export default function App() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, initialState);
  const [expandedId, setExpandedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState(null);
  const [savingsMode, setSavingsMode] = useState(null);
  const [confirmDeleteSaving, setConfirmDeleteSaving] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!state.savings || !Array.isArray(state.savings.transactions)) {
      setState((s) => ({ ...s, savings: emptySavings() }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buckets = state.buckets;
  const savings = state.savings ?? emptySavings();
  const savingsBalance = useMemo(
    () => savings.transactions.reduce((a, t) => a + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0),
    [savings.transactions]
  );

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

  const exportJSON = () => {
    const payload = {
      app: '5-bucket-tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `5-bucket-tracker-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    haptic(15);
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const candidate = parsed?.state && Array.isArray(parsed.state.buckets) ? parsed.state : parsed;
      if (!candidate || !Array.isArray(candidate.buckets) || candidate.buckets.length === 0) {
        throw new Error('File does not contain bucket data.');
      }
      for (const b of candidate.buckets) {
        if (!b.id || !b.name || !Array.isArray(b.transactions)) {
          throw new Error('Bucket is missing required fields (id, name, transactions).');
        }
      }
      setPendingImport(candidate);
    } catch (err) {
      setImportError(err.message || 'Could not read JSON.');
    }
  };

  const confirmImport = () => {
    const importedSavingsTx = Array.isArray(pendingImport.savings?.transactions)
      ? pendingImport.savings.transactions.map((t) => ({
          id: t.id || uid(),
          type: t.type === 'withdraw' ? 'withdraw' : 'deposit',
          amount: Number(t.amount) || 0,
          note: t.note || '',
          date: t.date || new Date().toISOString(),
        }))
      : [];
    setState({
      setupComplete: true,
      buckets: pendingImport.buckets.map((b) => ({
        ...b,
        budget: Number(b.budget) || 0,
        transactions: b.transactions.map((t) => ({
          id: t.id || uid(),
          amount: Number(t.amount) || 0,
          note: t.note || '',
          date: t.date || new Date().toISOString(),
        })),
      })),
      savings: { transactions: importedSavingsTx },
    });
    setPendingImport(null);
    haptic(20);
  };

  const onSavingsConfirm = ({ amount, note }) => {
    const type = savingsMode;
    setState((s) => ({
      ...s,
      savings: {
        transactions: [
          ...(s.savings?.transactions ?? []),
          { id: uid(), type, amount, note, date: new Date().toISOString() },
        ],
      },
    }));
    haptic(20);
    setConfettiTrigger({ id: uid(), x: window.innerWidth / 2, y: window.innerHeight / 3 });
    setSavingsMode(null);
  };

  const onDeleteSavingTx = (id) => setConfirmDeleteSaving(id);
  const reallyDeleteSavingTx = () => {
    const id = confirmDeleteSaving;
    setState((s) => ({
      ...s,
      savings: { transactions: (s.savings?.transactions ?? []).filter((t) => t.id !== id) },
    }));
    setConfirmDeleteSaving(null);
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
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button
            onClick={exportJSON}
            className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10"
            title="Download a JSON backup"
          >
            Export
          </button>
          <button
            onClick={onPickFile}
            className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10"
            title="Restore from a JSON backup"
          >
            Import
          </button>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onFileChosen}
          className="hidden"
        />
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

      <div className="mt-5">
        <SavingsCard
          savings={savings}
          onDeposit={() => setSavingsMode('deposit')}
          onWithdraw={() => setSavingsMode('withdraw')}
          onDeleteTx={onDeleteSavingTx}
        />
      </div>

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

      <SavingsModal
        mode={savingsMode}
        balance={savingsBalance}
        onClose={() => setSavingsMode(null)}
        onConfirm={onSavingsConfirm}
      />

      <ConfirmDialog
        open={!!confirmDeleteSaving}
        title="Delete savings entry?"
        message="The balance will adjust automatically."
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
        onCancel={() => setConfirmDeleteSaving(null)}
        onConfirm={reallyDeleteSavingTx}
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
        open={!!pendingImport}
        title="Replace your data?"
        message={pendingImport ? `Importing ${pendingImport.buckets.length} buckets and ${pendingImport.buckets.reduce((a, b) => a + (b.transactions?.length || 0), 0)} transactions. This overwrites everything on this device.` : ''}
        confirmText="Replace with import"
        cancelText="Cancel"
        tone="malachite"
        onCancel={() => setPendingImport(null)}
        onConfirm={confirmImport}
      />

      <ConfirmDialog
        open={!!importError}
        title="Couldn't import that file"
        message={importError || ''}
        confirmText="OK"
        cancelText="Close"
        tone="danger"
        onCancel={() => setImportError(null)}
        onConfirm={() => setImportError(null)}
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
