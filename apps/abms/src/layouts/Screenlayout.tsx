import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/useTheme';
import { useRouterState, useRouteContext } from '@tanstack/react-router';
import { abmsTheme } from '../theme/tokens';
import PageTransitionLoader from '../components/PageTransitionLoader';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children?: ReactNode | ((isDark: boolean) => ReactNode);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout design tokens (Modern Adamson Futuristic)
// ─────────────────────────────────────────────────────────────────────────────

const L = {
  dark: {
    base: abmsTheme.canvas,
    gridLine: abmsTheme.grid,
    glowLeft: 'radial-gradient(ellipse 60% 50% at 0% 40%, rgba(0,40,120,0.22) 0%, transparent 100%)',
    glowRight: 'radial-gradient(ellipse 50% 60% at 100% 60%, rgba(0,70,199,0.1) 0%, transparent 100%)',
    glowTop: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(79,168,255,0.07) 0%, transparent 100%)',

    headerBg: 'rgba(1,12,36,0.72)',
    headerBorder: 'rgba(255,255,255,0.04)',
    headerRule: 'linear-gradient(90deg, transparent 0%, rgba(79,168,255,0.18) 35%, rgba(0,40,120,0.12) 65%, transparent 100%)',
    headerGlow: '0 1px 0 rgba(79,168,255,0.06)',

    titleColor: abmsTheme.text,
    titleAccent: '#4FA8FF',
    subColor: abmsTheme.textMuted,

    toggleBg: 'rgba(0,40,120,0.25)',
    toggleBorder: 'rgba(79,168,255,0.22)',
    toggleColor: '#4FA8FF',
    toggleHoverBg: 'rgba(0,70,199,0.3)',

    userNameColor: abmsTheme.text,
    userRoleColor: '#3A5070',

    avatarBorder: 'rgba(79,168,255,0.35)',
    avatarGlow: '0 0 18px rgba(79,168,255,0.18)',
    avatarGradient: 'linear-gradient(135deg, #0A1535, #020818)',
    avatarText: '#4FA8FF',

    dividerColor: 'rgba(255,255,255,0.05)',

    onlineDot: '#10b981',
    onlineBorder: '#010818',
    onlineGlow: '0 0 10px rgba(16,185,129,0.5)',

    scrollThumb: 'rgba(79,168,255,0.12)',

    statusBarBg: 'rgba(1,8,24,0.85)',
    statusBorder: 'rgba(255,255,255,0.025)',
    statusOnline: '#10b981',
    statusText: abmsTheme.textMuted,

    contentBg: 'transparent',
    noise: 'rgba(79,168,255,0.008)',
  },

  light: {
    base: abmsTheme.canvas,
    gridLine: abmsTheme.grid,
    glowLeft: 'radial-gradient(ellipse 60% 50% at 0% 40%, rgba(0,70,199,0.13) 0%, transparent 100%)',
    glowRight: 'radial-gradient(ellipse 50% 60% at 100% 60%, rgba(0,26,94,0.11) 0%, transparent 100%)',
    glowTop: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(0,40,160,0.14) 0%, transparent 100%)',

    headerBg: 'rgba(255,255,255,0.96)',
    headerBorder: 'rgba(0,26,94,0.14)',
    headerRule: 'linear-gradient(90deg, transparent 0%, rgba(0,70,199,0.28) 35%, rgba(0,26,94,0.12) 65%, transparent 100%)',
    headerGlow: '0 2px 0 rgba(0,26,94,0.10)',

    titleColor: abmsTheme.text,
    titleAccent: '#0040C0',
    subColor: abmsTheme.textMuted,

    toggleBg: '#DDE8FF',
    toggleBorder: 'rgba(0,26,94,0.28)',
    toggleColor: '#0040C0',
    toggleHoverBg: 'rgba(0,70,199,0.16)',

    userNameColor: abmsTheme.text,
    userRoleColor: '#2C4A72',

    avatarBorder: 'rgba(0,26,94,0.35)',
    avatarGlow: '0 0 20px rgba(0,70,199,0.28)',
    avatarGradient: 'linear-gradient(135deg, #C8DCFF, #A8C4F8)',
    avatarText: '#00082E',

    dividerColor: 'rgba(0,26,94,0.14)',

    onlineDot: '#059669',
    onlineBorder: '#FFFFFF',
    onlineGlow: '0 0 10px rgba(5,150,105,0.55)',

    scrollThumb: 'rgba(0,26,94,0.22)',

    statusBarBg: 'rgba(255,255,255,0.92)',
    statusBorder: 'rgba(0,26,94,0.13)',
    statusOnline: '#059669',
    statusText: abmsTheme.textMuted,

    contentBg: 'transparent',
    noise: 'transparent',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Grid background
// ─────────────────────────────────────────────────────────────────────────────

const GridBg: React.FC<{ color: string }> = ({ color }) => (
  <div
    className="fixed inset-0 pointer-events-none z-0"
    style={{
      backgroundImage: `
        linear-gradient(${color} 1px, transparent 1px),
        linear-gradient(90deg, ${color} 1px, transparent 1px)
      `,
      backgroundSize: '52px 52px',
    }}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// Theme toggle
// ─────────────────────────────────────────────────────────────────────────────

const ThemeToggle: React.FC<{
  isDark: boolean;
  onToggle: () => void;
  t: typeof L.dark;
}> = ({ isDark, onToggle, t }) => (
  <motion.button
    onClick={onToggle}
    whileTap={{ scale: 0.9 }}
    className="relative h-9 w-9 flex items-center justify-center rounded-xl border transition-colors duration-200"
    style={{
      background: t.toggleBg,
      borderColor: t.toggleBorder,
      color: t.toggleColor,
    }}
    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.toggleHoverBg)}
    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = t.toggleBg)}
    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
  >
    <AnimatePresence mode="wait">
      {isDark ? (
        <motion.div
          key="sun"
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.22 }}
        >
          <Sun className="w-4 h-4" />
        </motion.div>
      ) : (
        <motion.div
          key="moon"
          initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.22 }}
        >
          <Moon className="w-4 h-4" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Layout — wraps every page; renders children or fallback placeholder
// ─────────────────────────────────────────────────────────────────────────────

const AdamsonBudgetLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useRouteContext({ strict: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const { isDark, toggleTheme } = useTheme();
  const t = isDark ? L.dark : L.light;

  // Select only the pathname so loader status updates do not replay the page
  // transition during navigation.
  const { pathname, isNavigating } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      isNavigating: state.status !== 'idle',
    }),
  });
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <>
    <motion.div
      aria-busy={isNavigating}
      inert={isNavigating}
      className="min-h-screen flex overflow-hidden"
      animate={{ background: t.base }}
      transition={{ duration: 0.35 }}
      style={{ fontFamily: 'var(--abms-font-sans)' }}
    >
      {/* ── Backgrounds ─────────────────────────────────────────── */}
      <GridBg color={t.gridLine} />

      <div
        className="fixed top-[-12%] left-[-6%] w-[480px] h-[480px] pointer-events-none z-0"
        style={{ background: t.glowLeft, filter: 'blur(40px)' }}
      />
      <div
        className="fixed bottom-[-12%] right-[-6%] w-[440px] h-[440px] pointer-events-none z-0"
        style={{ background: t.glowRight, filter: 'blur(40px)' }}
      />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(p => !p)}
        isDark={isDark}
        isNavigating={isNavigating}
      />

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.header
          className="h-[72px] flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 shrink-0"
          animate={{ background: t.headerBg }}
          transition={{ duration: 0.35 }}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${t.headerBorder}`,
          }}
        >
          {/* Title */}
          <div className="min-w-0">
            <h2
              className="truncate font-[var(--abms-font-display)] text-sm font-bold tracking-wide leading-none sm:text-[15px]"
              style={{ color: t.titleColor }}
            >
              Adamson Budget Monitoring System
            </h2>
            <p
              className="text-[10px] tracking-[0.26em] uppercase mt-[5px] font-medium"
              style={{ color: t.subColor }}
            >
              Adamson University
            </p>
          </div>

          {/* Right: toggle + user */}
          <div className="flex items-center gap-4">
            <ThemeToggle
              isDark={isDark}
              onToggle={toggleTheme}
              t={t}
            />

            {/* Divider */}
            <div
              className="w-px h-8"
              style={{ background: t.headerBorder }}
            />

            {/* User chip */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p
                  className="text-sm font-semibold leading-none"
                  style={{ color: t.userNameColor }}
                >
                  {user ? user.name : 'Loading...'}
                </p>
              </div>

              <div className="relative">
                <div
                  className="absolute -inset-0.5 rounded-xl pointer-events-none"
                  style={{ boxShadow: t.avatarGlow }}
                />
                <Avatar
                  className="h-10 w-10 rounded-xl"
                  style={{ border: `1px solid ${t.avatarBorder}` }}
                >
                  <AvatarImage
                    src={user?.username ? `https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${user.username}_2` : ''}
                    alt={user?.name ?? 'User'}
                  />
                  <AvatarFallback
                    className="rounded-xl text-sm font-bold"
                    style={{ background: t.avatarGradient, color: t.avatarText }}
                  >
                    {user?.name
                      ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                      : 'NA'}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full border-2"
                  style={{
                    background: t.onlineDot,
                    borderColor: t.onlineBorder,
                    boxShadow: t.onlineGlow,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Header rule */}
        <div
          className="h-px w-full shrink-0"
          style={{ background: t.headerRule }}
        />

        {/* ── Content area ──────────────────────────────────────── */}
        {/*
          AnimatePresence mode="wait" exits the old page fully before the new
          one enters. Its key is the selected pathname; intermediate router
          status changes do not trigger this component to re-render.
          The sidebar, header, and status bar are outside AnimatePresence so
          they remain mounted and do not flicker or re-animate on navigation.
        */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${t.scrollThumb} transparent`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {typeof children === 'function' ? children(isDark) : children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Status bar ────────────────────────────────────────── */}
        <motion.div
          className="h-8 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0"
          animate={{ background: t.statusBarBg }}
          transition={{ duration: 0.35 }}
          style={{ borderTop: `1px solid ${t.statusBorder}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase"
              style={{ color: t.statusOnline }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: t.onlineDot, boxShadow: t.onlineGlow }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Systems Online
            </span>
            <span className="text-[10px]" style={{ color: t.statusText }}>·</span>
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{ color: t.statusText }}
            >
              AduLive v6.0
            </span>
          </div>
          <span
            className="text-[10px] tracking-widest uppercase"
            style={{ color: t.statusText }}
          >
            {new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </motion.div>
      </main>
    </motion.div>
    <AnimatePresence>{isNavigating && <PageTransitionLoader />}</AnimatePresence>
    </>
  );
};

export default AdamsonBudgetLayout;
