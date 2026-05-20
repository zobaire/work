import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import AnimatedBackdrop from './components/AnimatedBackdrop.jsx';
import BucketCard from './components/BucketCard.jsx';
import AddExpenseModal from './components/AddExpenseModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import BudgetSetup from './components/BudgetSetup.jsx';
import Confetti from './components/Confetti.jsx';
import BalanceCard from './components/BalanceCard.jsx';
import BalanceModal from './components/BalanceModal.jsx';
import MainBalanceCard from './components/MainBalanceCard.jsx';
import IncomeModal from './components/IncomeModal.jsx';
import OtherExpenseModal from './components/OtherExpenseModal.jsx';
import EditEntryModal from './components/EditEntryModal.jsx';
import Ledger from './components/Ledger.jsx';
import { CurrencyContext } from './CurrencyContext.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useAutoBackup } from './hooks/useAutoBackup.js';
import { APP_NAME, DEFAULT_BUCKETS, DEFAULT_CURRENCY, DEFAULT_STARTING_BALANCE, STORAGE_KEY } from './constants.js';
import { fmt, haptic, isInMonth, isToday, sumSpent, uid } from './utils.js';

const emptyLedger = () => ({ transactions: [] });

const initialState = () => ({
  setupComplete: false,
  startingBalance: 0,
  currency: DEFAULT_CURRENCY,
  buckets: DEFAULT_BUCKETS.map((b) => ({ ...b, transactions: [] })),
  income: emptyLedger(),
  savings: emptyLedger(),
  emergency: emptyLedger(),
  other: emptyLedger(),
});

export default function App() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, initialState);
  const [expandedId, setExpandedId] = useState(null);
  const [editingBucket, setEditingBucket] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState(null);
  const [reserveAction, setReserveAction] = useState(null);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setState((s) => {
      const next = { ...s };
      let changed = false;
      if (typeof next.startingBalance !== 'number') { next.startingBalance = 0; changed = true; }
      if (!next.currency) { next.currency = DEFAULT_CURRENCY; changed = true; }
      if (!next.income?.transactions) { next.income = emptyLedger(); changed = true; }
      if (!next.savings?.transactions) { next.savings = emptyLedger(); changed = true; }
      if (!next.emergency?.transactions) { next.emergency = emptyLedger(); changed = true; }
      if (!next.other?.transactions) { next.other = emptyLedger(); changed = true; }
      if (Array.isArray(next.buckets) && next.buckets.some((b) => b.id === 'emergency')) {
        next.buckets = next.buckets.filter((b) => b.id !== 'emergency');
        changed = true;
      }
      return changed ? next : s;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useAutoBackup(state);

  const buckets = state.buckets;
  const income = state.income ?? emptyLedger();
  const savings = state.savings ?? emptyLedger();
  const emergency = state.emergency ?? emptyLedger();
  const other = state.other ?? emptyLedger();
  const startingBalance = Number(state.startingBalance) || 0;
  const currency = state.currency || DEFAULT_CURRENCY;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const allBucketTx = useMemo(() => buckets.flatMap((b) => b.transactions), [buckets]);
  const allOtherTx = other.transactions;

  // All-time totals (used for Main balance derivation)
  const totalSpendBuckets = useMemo(() => sumSpent(allBucketTx), [allBucketTx]);
  const totalOther = useMemo(() => sumSpent(allOtherTx), [allOtherTx]);
  const totalIncome = useMemo(() => income.transactions.reduce((a, t) => a + Number(t.amount), 0), [income]);
  const netReserve = (l) => l.transactions.reduce((a, t) => a + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0);
  const savingsBalance = useMemo(() => netReserve(savings), [savings]);
  const emergencyBalance = useMemo(() => netReserve(emergency), [emergency]);
  const mainBalance = startingBalance + totalIncome - totalSpendBuckets - totalOther - savingsBalance - emergencyBalance;

  // Monthly aggregates (current month only)
  const monthBucketSpent = useMemo(
    () => sumSpent(allBucketTx.filter((t) => isInMonth(t.date, curYear, curMonth))),
    [allBucketTx, curYear, curMonth]
  );
  const monthOtherSpent = useMemo(
    () => sumSpent(allOtherTx.filter((t) => isInMonth(t.date, curYear, curMonth))),
    [allOtherTx, curYear, curMonth]
  );
  const monthIncome = useMemo(
    () => income.transactions.filter((t) => isInMonth(t.date, curYear, curMonth)).reduce((a, t) => a + Number(t.amount), 0),
    [income, curYear, curMonth]
  );
  const monthSavingsIn = useMemo(
    () => savings.transactions.filter((t) => t.type === 'deposit' && isInMonth(t.date, curYear, curMonth)).reduce((a, t) => a + Number(t.amount), 0),
    [savings, curYear, curMonth]
  );
  const monthEmergencyIn = useMemo(
    () => emergency.transactions.filter((t) => t.type === 'deposit' && isInMonth(t.date, curYear, curMonth)).reduce((a, t) => a + Number(t.amount), 0),
    [emergency, curYear, curMonth]
  );
  const monthOutTotal = monthBucketSpent + monthOtherSpent + monthSavingsIn + monthEmergencyIn;

  // Today's net (combined across all event types)
  const todayNet = useMemo(() => {
    let n = 0;
    for (const t of income.transactions) if (isToday(t.date)) n += Number(t.amount);
    for (const t of allBucketTx) if (isToday(t.date)) n -= Number(t.amount);
    for (const t of allOtherTx) if (isToday(t.date)) n -= Number(t.amount);
    for (const t of savings.transactions) if (isToday(t.date)) n += (t.type === 'deposit' ? -Number(t.amount) : Number(t.amount));
    for (const t of emergency.transactions) if (isToday(t.date)) n += (t.type === 'deposit' ? -Number(t.amount) : Number(t.amount));
    return n;
  }, [income, allBucketTx, allOtherTx, savings, emergency]);

  const totalBudgets = buckets.reduce((a, b) => a + Number(b.budget || 0), 0);
  const monthBudgetUsedPct = Math.min(100, (monthBucketSpent / Math.max(totalBudgets, 1)) * 100);

  // -------- handlers --------

  const finishSetup = ({ buckets: cleaned, startingBalance: starting, currency: cur }) => {
    setState((s) => ({
      ...s,
      setupComplete: true,
      buckets: cleaned,
      startingBalance: starting,
      currency: cur || s.currency || DEFAULT_CURRENCY,
    }));
    setShowSetup(false);
  };

  const onAddExpense = (bucket) => setEditingBucket(bucket);

  const onConfirmExpense = ({ amount, note }) => {
    const id = editingBucket.id;
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
    setEditingBucket(null);
  };

  const onReserveConfirm = ({ amount, note }) => {
    const { which, mode } = reserveAction;
    setState((s) => ({
      ...s,
      [which]: {
        transactions: [
          ...(s[which]?.transactions ?? []),
          { id: uid(), type: mode, amount, note, date: new Date().toISOString() },
        ],
      },
    }));
    haptic(20);
    setConfettiTrigger({ id: uid(), x: window.innerWidth / 2, y: window.innerHeight / 3 });
    setReserveAction(null);
  };

  const onIncomeConfirm = ({ amount, source, note }) => {
    setState((s) => ({
      ...s,
      income: {
        transactions: [
          ...(s.income?.transactions ?? []),
          { id: uid(), amount, source, note, date: new Date().toISOString() },
        ],
      },
    }));
    haptic(25);
    setConfettiTrigger({ id: uid(), x: window.innerWidth / 2, y: 120 });
    setIncomeOpen(false);
  };

  const onOtherConfirm = ({ amount, note }) => {
    setState((s) => ({
      ...s,
      other: {
        transactions: [
          ...(s.other?.transactions ?? []),
          { id: uid(), amount, note, date: new Date().toISOString() },
        ],
      },
    }));
    haptic(20);
    setConfettiTrigger({ id: uid(), x: window.innerWidth / 2, y: window.innerHeight / 3 });
    setOtherOpen(false);
  };

  // Universal edit/delete entry
  const openEditEvent = (e) => setEditEntry(e);

  const saveEditedEvent = ({ amount, note }) => {
    const e = editEntry;
    if (!e) return;
    const updater = (tx) => (tx.id === e.id ? { ...tx, amount, note } : tx);

    setState((s) => {
      const next = { ...s };
      if (e.source?.kind === 'bucket') {
        next.buckets = s.buckets.map((b) =>
          b.id === e.source.bucketId ? { ...b, transactions: b.transactions.map(updater) } : b
        );
      } else if (e.source?.kind === 'other') {
        next.other = { transactions: s.other.transactions.map(updater) };
      } else if (e.source?.kind === 'savings') {
        next.savings = { transactions: s.savings.transactions.map(updater) };
      } else if (e.source?.kind === 'emergency') {
        next.emergency = { transactions: s.emergency.transactions.map(updater) };
      } else if (e.type === 'income') {
        next.income = { transactions: s.income.transactions.map(updater) };
      }
      return next;
    });
    setEditEntry(null);
  };

  const deleteEvent = (e) => {
    setState((s) => {
      const next = { ...s };
      const filt = (tx) => tx.id !== e.id;
      if (e.source?.kind === 'bucket') {
        next.buckets = s.buckets.map((b) =>
          b.id === e.source.bucketId ? { ...b, transactions: b.transactions.filter(filt) } : b
        );
      } else if (e.source?.kind === 'other') {
        next.other = { transactions: s.other.transactions.filter(filt) };
      } else if (e.source?.kind === 'savings') {
        next.savings = { transactions: s.savings.transactions.filter(filt) };
      } else if (e.source?.kind === 'emergency') {
        next.emergency = { transactions: s.emergency.transactions.filter(filt) };
      } else if (e.type === 'income') {
        next.income = { transactions: s.income.transactions.filter(filt) };
      }
      return next;
    });
    setEditEntry(null);
  };

  // -------- bucket entry click handlers ---------

  const onEditBucketTx = (bucket, t) => {
    openEditEvent({
      id: t.id,
      date: t.date,
      type: 'spend',
      amount: t.amount,
      note: t.note,
      label: bucket.name,
      color: bucket.color,
      emoji: bucket.emoji,
      source: { kind: 'bucket', bucketId: bucket.id },
    });
  };
  const onEditReserveTx = (which, t) => {
    openEditEvent({
      id: t.id,
      date: t.date,
      type: t.type === 'deposit' ? `${which}_in` : `${which}_out`,
      amount: t.amount,
      note: t.note,
      label: which === 'savings' ? 'Savings' : 'Emergency',
      color: which === 'savings' ? '#1dd561' : '#ef4444',
      source: { kind: which },
    });
  };

  // -------- export / import ---------

  const exportJSON = () => {
    const payload = {
      app: '5-bucket-tracker',
      version: 3,
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `budget-buckets-${stamp}.json`;
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
          throw new Error('Bucket is missing required fields.');
        }
      }
      setPendingImport(candidate);
    } catch (err) {
      setImportError(err.message || 'Could not read JSON.');
    }
  };

  const confirmImport = () => {
    const reserveFrom = (raw) =>
      Array.isArray(raw?.transactions)
        ? raw.transactions.map((t) => ({
            id: t.id || uid(),
            type: t.type === 'withdraw' ? 'withdraw' : 'deposit',
            amount: Number(t.amount) || 0,
            note: t.note || '',
            date: t.date || new Date().toISOString(),
          }))
        : [];
    const incomeFrom = (raw) =>
      Array.isArray(raw?.transactions)
        ? raw.transactions.map((t) => ({
            id: t.id || uid(),
            amount: Number(t.amount) || 0,
            source: t.source || 'Other',
            note: t.note || '',
            date: t.date || new Date().toISOString(),
          }))
        : [];
    const otherFrom = (raw) =>
      Array.isArray(raw?.transactions)
        ? raw.transactions.map((t) => ({
            id: t.id || uid(),
            amount: Number(t.amount) || 0,
            note: t.note || '',
            date: t.date || new Date().toISOString(),
          }))
        : [];

    setState({
      setupComplete: pendingImport.setupComplete !== false,
      startingBalance: Number(pendingImport.startingBalance) || 0,
      currency: pendingImport.currency || DEFAULT_CURRENCY,
      buckets: pendingImport.buckets
        .filter((b) => b.id !== 'emergency')
        .map((b) => ({
          ...b,
          budget: Number(b.budget) || 0,
          transactions: b.transactions.map((t) => ({
            id: t.id || uid(),
            amount: Number(t.amount) || 0,
            note: t.note || '',
            date: t.date || new Date().toISOString(),
          })),
        })),
      income: { transactions: incomeFrom(pendingImport.income) },
      savings: { transactions: reserveFrom(pendingImport.savings) },
      emergency: { transactions: reserveFrom(pendingImport.emergency) },
      other: { transactions: otherFrom(pendingImport.other) },
    });
    setPendingImport(null);
    haptic(20);
  };

  const wipeAll = () => {
    setState((s) => ({
      ...s,
      income: emptyLedger(),
      savings: emptyLedger(),
      emergency: emptyLedger(),
      other: emptyLedger(),
      buckets: s.buckets.map((b) => ({ ...b, transactions: [] })),
    }));
    setConfirmWipe(false);
    haptic(40);
    setConfettiTrigger({ id: uid(), x: window.innerWidth / 2, y: 120 });
  };

  if (!state.setupComplete || showSetup) {
    return (
      <CurrencyContext.Provider value={currency}>
        <div className="min-h-screen px-4 py-10">
          <AnimatedBackdrop />
          <BudgetSetup
            initial={buckets.map((b) => ({ ...b }))}
            initialStartingBalance={state.setupComplete ? startingBalance : DEFAULT_STARTING_BALANCE}
            initialCurrency={currency}
            firstRun={!state.setupComplete}
            onSave={finishSetup}
          />
          {state.setupComplete && (
            <div className="mt-4 text-center">
              <button onClick={() => setShowSetup(false)} className="text-xs text-platinum/60 hover:text-platinum">Cancel</button>
            </div>
          )}
        </div>
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={currency}>
      <div className="min-h-screen px-4 pt-8 pb-28 max-w-2xl mx-auto">
        <AnimatedBackdrop />
        <Confetti trigger={confettiTrigger} />

        <header className="flex items-center justify-between gap-3">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-grad">{APP_NAME}</h1>
            <div className="text-xs text-platinum/60 mt-0.5">
              {now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </motion.div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <button onClick={exportJSON} className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10" title="Download a JSON backup">Export</button>
            <button onClick={onPickFile} className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10" title="Restore from a JSON backup">Import</button>
            <button onClick={() => setShowSetup(true)} className="text-xs px-3 py-2 rounded-xl text-platinum/80 hover:text-platinum hover:bg-white/5 border border-white/10" title="Settings">Settings</button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onFileChosen} className="hidden" />
        </header>

        <div className="mt-5">
          <MainBalanceCard
            balance={mainBalance}
            monthIn={monthIncome}
            monthOut={monthOutTotal}
            todayNet={todayNet}
            onAddIncome={() => setIncomeOpen(true)}
            onOtherExpense={() => setOtherOpen(true)}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BalanceCard
            title="Savings"
            emoji="🏦"
            color="#1dd561"
            subtitle="Long-term"
            transactions={savings.transactions}
            onDeposit={() => setReserveAction({ which: 'savings', mode: 'deposit' })}
            onWithdraw={() => setReserveAction({ which: 'savings', mode: 'withdraw' })}
            onDeleteTx={(id) => deleteEvent({ id, source: { kind: 'savings' } })}
            onEditTx={(t) => onEditReserveTx('savings', t)}
            depositLabel="+ Set aside"
            withdrawLabel="− Withdraw"
          />
          <BalanceCard
            title="Emergency"
            emoji="🚨"
            color="#ef4444"
            subtitle="Reserve"
            transactions={emergency.transactions}
            onDeposit={() => setReserveAction({ which: 'emergency', mode: 'deposit' })}
            onWithdraw={() => setReserveAction({ which: 'emergency', mode: 'withdraw' })}
            onDeleteTx={(id) => deleteEvent({ id, source: { kind: 'emergency' } })}
            onEditTx={(t) => onEditReserveTx('emergency', t)}
            depositLabel="+ Set aside"
            withdrawLabel="− Use"
          />
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-5 glass rounded-3xl p-5 relative overflow-hidden"
        >
          <div className="sheen-overlay" />
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-platinum/50">Buckets · spent this month</div>
              <div className="text-2xl font-bold mt-1">
                <span className="text-platinum">{fmt(monthBucketSpent, currency)}</span>
                <span className="text-platinum/40 text-sm font-normal"> / {fmt(totalBudgets, currency)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-platinum/50">Used</div>
              <div className="text-xl font-semibold" style={{ color: monthBudgetUsedPct > 90 ? '#ef4444' : '#1dd561' }}>
                {monthBudgetUsedPct.toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-black/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${monthBudgetUsedPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              className="h-full rounded-full animate-gradientShift"
              style={{
                background: 'linear-gradient(90deg, #1dd561, #5a189a, #f0f0f0, #1dd561)',
                backgroundSize: '300% 100%',
              }}
            />
          </div>
        </motion.div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {buckets.map((b) => (
              <BucketCard
                key={b.id}
                bucket={b}
                expanded={expandedId === b.id}
                onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                onAddExpense={onAddExpense}
                onDeleteTx={(bucketId, txId) => deleteEvent({ id: txId, source: { kind: 'bucket', bucketId } })}
                onEditTx={(t) => onEditBucketTx(b, t)}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-6">
          <Ledger
            state={state}
            onEditEvent={openEditEvent}
            onDeleteEvent={deleteEvent}
            onClearAll={() => setConfirmWipe(true)}
          />
        </div>

        <footer className="mt-10 text-center text-[11px] text-platinum/40">
          Saved locally · auto-backed-up · {APP_NAME}
        </footer>

        <AddExpenseModal
          bucket={editingBucket}
          mainBalance={mainBalance}
          onClose={() => setEditingBucket(null)}
          onConfirm={onConfirmExpense}
        />

        <BalanceModal
          open={!!reserveAction}
          mode={reserveAction?.mode}
          title={reserveAction?.which === 'savings' ? 'Savings' : 'Emergency'}
          emoji={reserveAction?.which === 'savings' ? '🏦' : '🚨'}
          color={reserveAction?.which === 'savings' ? '#1dd561' : '#ef4444'}
          balance={reserveAction?.which === 'savings' ? savingsBalance : emergencyBalance}
          mainBalance={mainBalance}
          onClose={() => setReserveAction(null)}
          onConfirm={onReserveConfirm}
        />

        <IncomeModal
          open={incomeOpen}
          mainBalance={mainBalance}
          onClose={() => setIncomeOpen(false)}
          onConfirm={onIncomeConfirm}
        />

        <OtherExpenseModal
          open={otherOpen}
          mainBalance={mainBalance}
          onClose={() => setOtherOpen(false)}
          onConfirm={onOtherConfirm}
        />

        <EditEntryModal
          open={!!editEntry}
          entry={editEntry}
          title={editEntry?.label || 'Entry'}
          color={editEntry?.color}
          onClose={() => setEditEntry(null)}
          onSave={saveEditedEvent}
          onDelete={deleteEvent}
        />

        <ConfirmDialog
          open={!!pendingImport}
          title="Replace your data?"
          message={pendingImport ? `Overwrites everything: ${pendingImport.buckets.length} buckets, income, savings, emergency, and other expenses.` : ''}
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
          open={confirmWipe}
          title="Wipe ALL history?"
          message="Deletes every transaction: spending, income, savings, emergency, and other expenses. Starting cash and budgets stay. Cannot be undone."
          confirmText="Wipe everything"
          cancelText="Keep my data"
          tone="danger"
          onCancel={() => setConfirmWipe(false)}
          onConfirm={wipeAll}
        />
      </div>
    </CurrencyContext.Provider>
  );
}
