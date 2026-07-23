import { motion, useReducedMotion } from 'framer-motion';

export default function LoadingScreen() {
  const reduceMotion = useReducedMotion();

  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[var(--abms-canvas)] px-6 text-[var(--abms-text)]"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,var(--abms-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--abms-grid)_1px,transparent_1px)] bg-[size:52px_52px] opacity-70" />
      <div aria-hidden="true" className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[var(--abms-primary-soft)] blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[var(--abms-accent-soft)] blur-3xl" />

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
        className="relative w-full max-w-md rounded-[var(--abms-radius-xl)] border border-[var(--abms-border)] bg-[var(--abms-surface-overlay)] px-8 py-9 text-center shadow-[var(--abms-shadow-lg)] backdrop-blur-xl"
      >
        <img src="/logos/adulogo.png" alt="Adamson University" className="mx-auto h-20 w-20 object-contain drop-shadow-md" />
        <p className="mt-5 font-[var(--abms-font-display)] text-lg font-extrabold tracking-tight">
          Adamson Budget Monitoring System
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--abms-text-muted)]">
          Adamson University
        </p>

        <div className="mx-auto mt-7 flex w-fit items-center gap-3">
          <div aria-hidden="true" className="relative h-9 w-9">
            <motion.span
              className="absolute inset-0 rounded-full border-[3px] border-[var(--abms-primary-soft)] border-t-[var(--abms-primary)]"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : { repeat: Infinity, duration: 0.85, ease: 'linear' }}
            />
            <span className="absolute inset-[9px] rounded-full bg-[var(--abms-accent)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Preparing your workspace</p>
            <p className="mt-0.5 text-xs text-[var(--abms-text-muted)]">Verifying access and loading permissions…</p>
          </div>
        </div>

        <div aria-hidden="true" className="mt-7 h-1.5 overflow-hidden rounded-full bg-[var(--abms-primary-soft)]">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-[var(--abms-primary)] to-[var(--abms-accent)]"
            animate={reduceMotion ? undefined : { x: ['-110%', '220%'] }}
            transition={reduceMotion ? undefined : { repeat: Infinity, duration: 1.15, ease: 'easeInOut' }}
          />
        </div>
        <span className="sr-only">Please wait while your ABMS access and permissions are verified.</span>
      </motion.section>
    </main>
  );
}
