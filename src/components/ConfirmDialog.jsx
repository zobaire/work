import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmDialog({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', tone = 'velvet', onConfirm, onCancel }) {
  const accent = tone === 'danger' ? '#ef4444' : tone === 'malachite' ? '#1dd561' : '#5a189a';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative glass-strong rounded-3xl p-6 max-w-sm w-full"
            style={{ boxShadow: `0 20px 60px -20px ${accent}` }}
          >
            <div className="text-lg font-semibold text-platinum">{title}</div>
            <div className="mt-1 text-sm text-platinum/70">{message}</div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-platinum/80 hover:bg-white/5">
                {cancelText}
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: accent, color: '#10002b', boxShadow: `0 8px 24px -10px ${accent}` }}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
