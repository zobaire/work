import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '../CurrencyContext.jsx';
import { fmt } from '../utils.js';

export default function BalanceModal({
  open,
  mode,
  title,
  emoji,
  color,
  balance,
  mainBalance,
  onClose,
  onConfirm,
}) {
  const cur = useCurrency();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [override, setOverride] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNote('');
    setOverride(false);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, mode]);

  if (!open) return null;

  const numeric = Number(amount);
  const valid = !isNaN(numeric) && numeric > 0;
  const isWithdraw = mode === 'withdraw';

  // Withdraw out of a reserve below zero is now hard-blocked — reserves can't go negative.
  const wouldOverflowOut = isWithdraw && valid && numeric > balance;
  const wouldOverflowMain = !isWithdraw && valid && typeof mainBalance === 'number' && numeric > mainBalance;
  const blocked = wouldOverflowOut || (wouldOverflowMain && !override);

  const accent = isWithdraw ? '#f0f0f0' : color;
  const verb = isWithdraw ? 'Withdraw from' : 'Deposit to';

  const submit = () => {
    if (!valid || blocked) return;
    onConfirm({ amount: numeric, note: note.trim() });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog" aria-modal="true"
            initial={{ y: 80, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="relative w-full sm:max-w-md mx-auto sm:rounded-3xl rounded-t-3xl glass-strong p-6 overflow-hidden"
            style={{ boxShadow: `0 -30px 80px -20px ${accent}55` }}
          >
            <div className="absolute -top-16 -right-12 h-44 w-44 rounded-full opacity-30 blur-3xl" style={{ background: accent }} />
            <div className="relative flex items-center gap-3">
              <div className="grid place-items-center h-11 w-11 rounded-2xl text-2xl"
                   style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}>
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-platinum font-semibold truncate">{verb} {title}</div>
                <div className="text-xs text-platinum/60 truncate">
                  Balance: <span style={{ color }}>{fmt(balance, cur)}</span>
                  {typeof mainBalance === 'number' && (
                    <> · Main: <span className="text-malachite">{fmt(mainBalance, cur)}</span></>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-platinum/70 hover:text-platinum px-2 py-1 rounded-lg hover:bg-white/5">✕</button>
            </div>

            <div className="relative mt-6 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-platinum/50">Amount</label>
                <input
                  ref={inputRef}
                  type="number" inputMode="decimal"
                  className="glass-input mt-1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-platinum/50">Note (optional)</label>
                <input
                  type="text"
                  className="glass-input mt-1"
                  placeholder={isWithdraw ? 'e.g. medical bill, transfer out' : 'e.g. month set-aside, parents'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                />
              </div>

              <AnimatePresence>
                {wouldOverflowOut && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-300 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2"
                  >
                    <b>{title}</b> only has {fmt(balance, cur)}. You can't withdraw more than the balance.
                  </motion.div>
                )}
                {!wouldOverflowOut && wouldOverflowMain && (
                  <motion.label
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2"
                  >
                    <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                    Main balance will go <b>negative</b>. Override?
                  </motion.label>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={!blocked && valid ? { scale: 0.96 } : undefined}
                whileHover={!blocked && valid ? { scale: 1.02 } : undefined}
                onClick={submit}
                disabled={!valid || blocked}
                className="w-full mt-2 py-3.5 rounded-2xl font-semibold text-base no-select transition"
                style={{
                  background: !valid || blocked
                    ? 'rgba(240,240,240,0.08)'
                    : isWithdraw
                      ? 'linear-gradient(135deg, #f0f0f0, #cbd5e1)'
                      : `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: !valid || blocked ? '#f0f0f088' : '#10002b',
                  boxShadow: !valid || blocked ? 'none' : `0 12px 30px -10px ${accent}`,
                }}
              >
                {blocked
                  ? (wouldOverflowOut ? 'Withdrawal too large' : 'Confirm override to continue')
                  : valid
                    ? (isWithdraw ? `Withdraw ${fmt(numeric, cur)}` : `Deposit ${fmt(numeric, cur)}`)
                    : 'Enter an amount'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
