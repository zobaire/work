import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '../CurrencyContext.jsx';
import { fmt } from '../utils.js';

const SOURCES = ['Stipend', 'Parents', 'Part-time', 'Scholarship', 'Gift / 红包', 'Other'];

export default function IncomeModal({ open, mainBalance, onClose, onConfirm }) {
  const cur = useCurrency();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Stipend');
  const [note, setNote] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setSource('Stipend');
    setNote('');
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const numeric = Number(amount);
  const valid = !isNaN(numeric) && numeric > 0;

  const submit = () => {
    if (!valid) return;
    onConfirm({ amount: numeric, source, note: note.trim() });
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
            style={{ boxShadow: '0 -30px 80px -20px #1dd56155' }}
          >
            <div className="absolute -top-16 -right-12 h-44 w-44 rounded-full opacity-30 blur-3xl" style={{ background: '#1dd561' }} />
            <div className="relative flex items-center gap-3">
              <div className="grid place-items-center h-11 w-11 rounded-2xl text-2xl"
                   style={{ background: '#1dd56122', border: '1px solid #1dd56155' }}>💰</div>
              <div className="flex-1">
                <div className="text-platinum font-semibold">Add income</div>
                <div className="text-xs text-platinum/60">Main: <span className="text-malachite">{fmt(mainBalance, cur)}</span></div>
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
                <label className="text-xs uppercase tracking-widest text-platinum/50">Source</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      className="text-xs px-3 py-1.5 rounded-xl border transition"
                      style={{
                        background: source === s ? '#1dd56122' : 'rgba(16,0,43,0.55)',
                        borderColor: source === s ? '#1dd56188' : 'rgba(240,240,240,0.15)',
                        color: source === s ? '#1dd561' : '#f0f0f0bb',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-platinum/50">Note (optional)</label>
                <input
                  type="text"
                  className="glass-input mt-1"
                  placeholder="e.g. June stipend"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                />
              </div>

              <motion.button
                whileTap={valid ? { scale: 0.96 } : undefined}
                whileHover={valid ? { scale: 1.02 } : undefined}
                onClick={submit}
                disabled={!valid}
                className="w-full mt-2 py-3.5 rounded-2xl font-semibold text-base no-select transition"
                style={{
                  background: valid ? 'linear-gradient(135deg, #1dd561, #1dd561cc)' : 'rgba(240,240,240,0.08)',
                  color: valid ? '#10002b' : '#f0f0f088',
                  boxShadow: valid ? '0 12px 30px -10px #1dd561' : 'none',
                }}
              >
                {valid ? `Add ${fmt(numeric, cur)} from ${source}` : 'Enter an amount'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
