import { motion } from 'framer-motion';

export default function PageTransitionLoader() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[color:var(--abms-canvas)]/70 px-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex min-w-56 flex-col items-center gap-4 rounded-[var(--abms-radius-xl)] border border-[var(--abms-border)] bg-[var(--abms-surface-overlay)] px-8 py-7 shadow-[var(--abms-shadow-lg)]"
      >
        <div className="relative h-12 w-12">
          <motion.span
            className="absolute inset-0 rounded-full border-[3px] border-[var(--abms-primary-soft)] border-t-[var(--abms-primary)]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
          <motion.span
            className="absolute inset-[7px] rounded-full border-2 border-transparent border-b-[var(--abms-accent)]"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
          />
        </div>
        <div className="text-center">
          <p className="font-[var(--abms-font-display)] text-sm font-bold text-[var(--abms-text)]">
            Loading page
          </p>
          <p className="mt-1 text-xs text-[var(--abms-text-muted)]">
            Please wait while we prepare your data.
          </p>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--abms-primary-soft)]">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-[var(--abms-primary)] to-[var(--abms-accent)]"
            animate={{ x: ['-110%', '220%'] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
