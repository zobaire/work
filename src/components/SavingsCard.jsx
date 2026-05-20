import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { fmt, fmtDate } from '../utils.js';

export default function SavingsCard({ savings, onDeposit, onWithdraw, onDeleteTx }) {
  const [open, setOpen] = useState(false);

  const balance = useMemo(() => {
    return savings.transactions.reduce((acc, t) => acc + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0);
  }, [savings.transactions]);

  const totalIn = useMemo(
    () => savings.transactions.filter((t) => t.type === 'deposit').reduce((a, t) => a + Number(t.amount), 0),
    [savings.transactions]
  );
  const totalOut = useMemo(
    () => savings.transactions.filter((t) => t.type === 'withdraw').reduce((a, t) => a + Number(t.amount), 0),
    [savings.transactions]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative glass rounded-3xl p-5 overflow-hidden"
      style={{ boxShadow: '0 20px 50px -20px #1dd56155, 0 0 0 1px rgba(29,213,97,0.10) inset' }}
    >
      <div className="sheen-overlay" />
      <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full opacity-25 blur-3xl"
           style={{ background: '#1dd561' }} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="grid place-items-center h-12 w-12 rounded-2xl text-2xl no-select"
            style={{ background: 'linear-gradient(135deg, #1dd56133, #1dd56110)', border: '1px solid #1dd56155' }}
            whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.6 } }}
          >
            🏦
          </motion.div>
          <div>
            <div className="text-platinum font-semibold tracking-tight">Savings</div>
            <div className="text-platinum/60 text-xs">
              In <span className="text-malachite">{fmt(totalIn)}</span> · Out <span className="text-platinum/80">{fmt(totalOut)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <motion.div
            key={balance}
            initial={{ scale: 1.25, color: '#1dd561' }}
            animate={{ scale: 1, color: '#f0f0f0' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-3xl font-bold tracking-tight"
          >
            {fmt(balance)}
          </motion.div>
          <div className="text-[10px] uppercase tracking-widest text-platinum/50">balance</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-platinum/70 hover:text-platinum transition px-2 py-1 rounded-lg hover:bg-white/5"
        >
          {open ? 'Hide' : `History (${savings.transactions.length})`}
        </button>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            onClick={onWithdraw}
            className="px-4 py-2 rounded-2xl font-semibold text-sm border border-white/15 text-platinum/90 hover:bg-white/5 no-select"
          >
            − Withdraw
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            onClick={onDeposit}
            className="px-4 py-2 rounded-2xl font-semibold text-sm no-select"
            style={{
              background: 'linear-gradient(135deg, #1dd561, #1dd561cc)',
              color: '#10002b',
              boxShadow: '0 8px 24px -10px #1dd561',
            }}
          >
            + Deposit
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="hist"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5 max-h-72 overflow-auto scroll-hidden">
              {savings.transactions.length === 0 && (
                <div className="text-platinum/50 text-sm italic">No deposits or withdrawals yet.</div>
              )}
              <AnimatePresence>
                {[...savings.transactions].reverse().map((t) => {
                  const isDep = t.type === 'deposit';
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-white/5 group"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                              style={{
                                background: isDep ? '#1dd56122' : '#f0f0f015',
                                color: isDep ? '#1dd561' : '#f0f0f0aa',
                                border: `1px solid ${isDep ? '#1dd56144' : '#f0f0f022'}`
                              }}>
                          {isDep ? 'in' : 'out'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm text-platinum truncate">
                            {t.note || <span className="italic text-platinum/50">no note</span>}
                          </div>
                          <div className="text-[11px] text-platinum/50">{fmtDate(t.date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-sm font-semibold" style={{ color: isDep ? '#1dd561' : '#f0f0f0cc' }}>
                          {isDep ? '+' : '−'}{fmt(t.amount)}
                        </div>
                        <button
                          onClick={() => onDeleteTx(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-platinum/60 hover:text-red-400 transition px-2 py-1 rounded-md"
                          aria-label="Delete entry"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
