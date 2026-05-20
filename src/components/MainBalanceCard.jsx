import { motion } from 'framer-motion';
import { useCurrency } from '../CurrencyContext.jsx';
import { fmt } from '../utils.js';

export default function MainBalanceCard({ balance, monthIn, monthOut, todayNet, onAddIncome, onOtherExpense }) {
  const cur = useCurrency();
  const low = balance < 0;
  const todayUp = todayNet > 0;
  const todayDown = todayNet < 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative glass-strong rounded-3xl p-6 overflow-hidden"
      style={{
        boxShadow: '0 30px 80px -30px #5a189a, 0 0 0 1px rgba(29,213,97,0.15) inset',
      }}
    >
      <div className="sheen-overlay" />
      <motion.div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(29,213,97,0.45), transparent 60%)', filter: 'blur(10px)' }}
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(123,44,191,0.55), transparent 60%)', filter: 'blur(10px)' }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-platinum/60">Cash on hand · Main</div>
          <motion.div
            key={balance}
            initial={{ scale: 1.12, color: '#1dd561' }}
            animate={{ scale: 1, color: low ? '#ef4444' : '#f0f0f0' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-5xl font-bold tracking-tight mt-1"
          >
            {fmt(balance, cur)}
          </motion.div>
          <div className="mt-2 text-xs text-platinum/70">
            This month: <span className="text-malachite">+{fmt(monthIn, cur)}</span> in · <span className="text-platinum/90">−{fmt(monthOut, cur)}</span> out
          </div>
          {(todayUp || todayDown) && (
            <div className="mt-1 text-xs text-platinum/70">
              Today:{' '}
              <span style={{ color: todayUp ? '#1dd561' : '#ef4444' }}>
                {todayUp ? '+' : '−'}{fmt(Math.abs(todayNet), cur)}
              </span>{' '}net
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }}
            onClick={onAddIncome}
            className="px-4 py-2.5 rounded-2xl font-semibold text-sm no-select whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #1dd561, #1dd561cc)',
              color: '#10002b',
              boxShadow: '0 12px 28px -10px #1dd561',
            }}
          >
            + Income
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }}
            onClick={onOtherExpense}
            className="px-4 py-2 rounded-2xl font-semibold text-xs no-select whitespace-nowrap border border-white/15 text-platinum/90 hover:bg-white/5"
          >
            − Other
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
