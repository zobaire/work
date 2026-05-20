import { motion } from 'framer-motion';

export default function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Flowing color-shifting base layer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, #10002b 0%, #1a0440 25%, #5a189a 50%, #1dd561 75%, #10002b 100%)',
          backgroundSize: '400% 400%',
          filter: 'blur(40px)',
          opacity: 0.55,
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 50%', '50% 100%', '0% 0%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Big amethyst blob — top-left */}
      <motion.div
        className="absolute -top-40 -left-32 h-[70vmax] w-[70vmax] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(90,24,154,0.65), transparent 60%)', filter: 'blur(20px)' }}
        animate={{
          x: [0, 180, -80, 60, 0],
          y: [0, 80, -120, 40, 0],
          scale: [1, 1.25, 0.85, 1.1, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Malachite blob — bottom-right */}
      <motion.div
        className="absolute -bottom-48 -right-32 h-[60vmax] w-[60vmax] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(29,213,97,0.45), transparent 60%)', filter: 'blur(20px)' }}
        animate={{
          x: [0, -150, 90, -40, 0],
          y: [0, -100, 60, -30, 0],
          scale: [1, 1.2, 0.9, 1.15, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Velvet blob — center drifting */}
      <motion.div
        className="absolute top-1/3 left-1/4 h-[50vmax] w-[50vmax] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(123,44,191,0.45), transparent 65%)', filter: 'blur(20px)' }}
        animate={{
          x: [0, 140, -100, 50, 0],
          y: [0, -140, 80, -40, 0],
          scale: [1, 0.85, 1.25, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Extra green accent — fast small orb */}
      <motion.div
        className="absolute top-1/2 right-1/4 h-[35vmax] w-[35vmax] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(29,213,97,0.35), transparent 65%)', filter: 'blur(20px)' }}
        animate={{
          x: [0, -120, 80, -60, 0],
          y: [0, 120, -80, 40, 0],
          scale: [0.9, 1.2, 0.8, 1.1, 0.9],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Extra violet accent — counter-orbit */}
      <motion.div
        className="absolute bottom-1/4 left-1/2 h-[30vmax] w-[30vmax] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.40), transparent 65%)', filter: 'blur(20px)' }}
        animate={{
          x: [0, 100, -140, 60, 0],
          y: [0, -90, 100, -50, 0],
          scale: [1, 1.15, 0.85, 1.2, 1],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated dot grid that breathes */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(240,240,240,0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        animate={{ opacity: [0.04, 0.09, 0.04], backgroundPosition: ['0px 0px', '22px 22px', '0px 0px'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle vignette so content stays readable */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(16,0,43,0.55) 100%)' }}
      />
    </div>
  );
}
