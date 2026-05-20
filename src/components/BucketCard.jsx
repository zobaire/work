import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState } from 'react';
import { fmt, remaining, sumSpent, fmtDate } from '../utils.js';

export default function BucketCard({ bucket, onAddExpense, onDeleteTx, expanded, onToggleExpand }) {
  const spent = sumSpent(bucket.transactions);
  const left = remaining(bucket);
  const pct = Math.max(0, Math.min(100, (spent / Math.max(bucket.budget, 1)) * 100));
  const isLow = left <= bucket.budget * 0.2 && left > 0;
  const isOver = left < 0;

  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 200, damping: 18 });
  const springY = useSpring(rotY, { stiffness: 200, damping: 18 });
  const tiltX = useTransform(springX, (v) => `${v}deg`);
  const tiltY = useTransform(springY, (v) => `${v}deg`);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotY.set(px * 10);
    rotX.set(-py * 10);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }}
      className="relative"
    >
      <div
        className="relative glass rounded-3xl p-5 overflow-hidden shadow-glow"
        style={{
          boxShadow: `0 18px 50px -20px ${bucket.color}55, 0 0 0 1px rgba(240,240,240,0.06) inset`,
        }}
      >
        <div className="sheen-overlay" />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-30 blur-2xl"
             style={{ background: bucket.color }} />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="grid place-items-center h-12 w-12 rounded-2xl text-2xl no-select"
              style={{ background: `linear-gradient(135deg, ${bucket.color}33, ${bucket.color}10)`, border: `1px solid ${bucket.color}55` }}
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.6 } }}
            >
              <span className="drop-shadow">{bucket.emoji}</span>
            </motion.div>
            <div>
              <div className="text-platinum text-base font-semibold tracking-tight">{bucket.name}</div>
              <div className="text-platinum/60 text-xs">Budget {fmt(bucket.budget)}</div>
            </div>
          </div>
          <div className="text-right">
            <motion.div
              key={left}
              initial={{ scale: 1.25, color: bucket.color }}
              animate={{ scale: 1, color: '#f0f0f0' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="text-2xl font-bold tracking-tight"
            >
              {fmt(left)}
            </motion.div>
            <div className="text-[10px] uppercase tracking-widest text-platinum/50">left</div>
          </div>
        </div>

        <div className="mt-5 relative h-2.5 rounded-full bg-black/40 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="h-full rounded-full relative"
            style={{ background: `linear-gradient(90deg, ${bucket.color}, ${bucket.color}aa)` }}
          >
            <div className="absolute inset-0 opacity-60"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', mixBlendMode: 'overlay' }} />
          </motion.div>
          {isOver && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ boxShadow: ['0 0 0 0 #ef444466', '0 0 14px 0 #ef444400'] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => onToggleExpand(bucket.id)}
            className="text-xs text-platinum/70 hover:text-platinum transition px-2 py-1 rounded-lg hover:bg-white/5"
          >
            {expanded ? 'Hide' : `History (${bucket.transactions.length})`}
          </button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => onAddExpense(bucket)}
            className="relative px-4 py-2 rounded-2xl font-semibold text-sm no-select"
            style={{
              background: `linear-gradient(135deg, ${bucket.color}, ${bucket.color}cc)`,
              color: '#10002b',
              boxShadow: `0 8px 24px -10px ${bucket.color}`,
            }}
          >
            <span className="relative z-10">+ Add expense</span>
            <span className="absolute inset-0 rounded-2xl animate-pulseRing" style={{ ['--tw-shadow-color']: bucket.color }} />
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="hist"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5 max-h-72 overflow-auto scroll-hidden">
                {bucket.transactions.length === 0 && (
                  <div className="text-platinum/50 text-sm italic">No transactions yet.</div>
                )}
                <AnimatePresence>
                  {[...bucket.transactions].reverse().map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-white/5 group"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-platinum truncate">
                          {t.note || <span className="italic text-platinum/50">no note</span>}
                        </div>
                        <div className="text-[11px] text-platinum/50">{fmtDate(t.date)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-sm font-semibold" style={{ color: bucket.color }}>
                          -{fmt(t.amount)}
                        </div>
                        <button
                          onClick={() => onDeleteTx(bucket.id, t.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-platinum/60 hover:text-red-400 transition px-2 py-1 rounded-md"
                          aria-label="Delete transaction"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLow && !isOver && (
          <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-200 border border-yellow-300/20">
            Low
          </div>
        )}
        {isOver && (
          <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-400/30">
            Over
          </div>
        )}
      </div>
    </motion.div>
  );
}
