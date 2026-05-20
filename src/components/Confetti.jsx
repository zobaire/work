import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const COLORS = ['#1dd561', '#5a189a', '#f0f0f0', '#7b2cbf', '#a855f7'];

export default function Confetti({ trigger }) {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const id = trigger.id;
    const x = trigger.x ?? window.innerWidth / 2;
    const y = trigger.y ?? window.innerHeight / 2;
    const pieces = Array.from({ length: 18 }).map((_, i) => ({
      i,
      angle: (Math.PI * 2 * i) / 18 + Math.random() * 0.4,
      distance: 80 + Math.random() * 90,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      rot: Math.random() * 360,
    }));
    const burst = { id, x, y, pieces };
    setBursts((b) => [...b, burst]);
    const t = setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 900);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[70]">
      <AnimatePresence>
        {bursts.map((b) => (
          <div key={b.id} style={{ position: 'absolute', left: b.x, top: b.y }}>
            {b.pieces.map((p) => {
              const dx = Math.cos(p.angle) * p.distance;
              const dy = Math.sin(p.angle) * p.distance;
              return (
                <motion.span
                  key={p.i}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                  animate={{ x: dx, y: dy + 40, opacity: 0, rotate: p.rot, scale: 0.6 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size * 0.4,
                    background: p.color,
                    borderRadius: 2,
                    boxShadow: `0 0 10px ${p.color}`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
