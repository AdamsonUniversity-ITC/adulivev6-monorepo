import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import Sidebar from '../components/Sidebar';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout design tokens — every token used in this file is defined here
// ─────────────────────────────────────────────────────────────────────────────

const L = {
  dark: {
    // Background
    base:            '#080e1a',
    gridLine:        'rgba(59, 130, 246, 0.03)',
    glowLeft:        'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
    glowRight:       'radial-gradient(circle, rgba(30, 64, 175, 0.05) 0%, transparent 70%)',
    // Header
    headerBg:        'rgba(11, 20, 38, 0.85)',
    headerBorder:    'rgba(255, 255, 255, 0.06)',
    headerRule:      'linear-gradient(90deg, transparent, rgba(59,130,246,0.22) 40%, rgba(37,99,235,0.1) 70%, transparent)',
    titleColor:      '#f1f5f9',
    subColor:        '#94a3b8',
    // Theme toggle
    toggleBg:        'rgba(29, 78, 216, 0.12)',
    toggleBorder:    'rgba(59, 130, 246, 0.28)',
    toggleColor:     '#60a5fa',
    toggleHoverBg:   'rgba(29, 78, 216, 0.22)',
    // User chip
    userNameColor:   '#e2e8f0',
    userRoleColor:   '#64748b',
    avatarBorder:    'rgba(59, 130, 246, 0.3)',
    avatarGlow:      '0 0 16px rgba(37, 99, 235, 0.25)',
    avatarGradient:  'linear-gradient(135deg, #1e293b, #0f172a)',
    avatarText:      '#60a5fa',
    // Online indicator
    onlineDot:       '#22c55e',
    onlineBorder:    '#080e1a',
    onlineGlow:      '0 0 6px rgba(34, 197, 94, 0.75)',
    // Content scroll
    scrollThumb:     'rgba(37, 99, 235, 0.2)',
    // Status bar
    statusBarBg:     '#0b1426',
    statusBorder:    'rgba(255, 255, 255, 0.05)',
    statusOnline:    'rgba(34, 197, 94, 0.55)',
    statusText:      '#475569',
  },
  light: {
    // Background
    base:            '#f8fafc',
    gridLine:        'rgba(0, 48, 135, 0.03)',
    glowLeft:        'radial-gradient(circle, rgba(191, 219, 254, 0.3) 0%, transparent 70%)',
    glowRight:       'radial-gradient(circle, rgba(219, 234, 254, 0.2) 0%, transparent 70%)',
    // Header
    headerBg:        'rgba(252, 253, 254, 0.85)',
    headerBorder:    '#e2e8f0',
    headerRule:      'linear-gradient(90deg, transparent, rgba(0,48,135,0.14) 40%, rgba(0,48,135,0.07) 70%, transparent)',
    titleColor:      '#0f172a',
    subColor:        '#64748b',
    // Theme toggle
    toggleBg:        'rgba(0, 48, 135, 0.06)',
    toggleBorder:    'rgba(0, 48, 135, 0.18)',
    toggleColor:     '#003087',
    toggleHoverBg:   'rgba(0, 48, 135, 0.12)',
    // User chip
    userNameColor:   '#1e293b',
    userRoleColor:   '#475569',
    avatarBorder:    '#cbd5e1',
    avatarGlow:      '0 0 12px rgba(0, 48, 135, 0.08)',
    avatarGradient:  'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    avatarText:      '#003087',
    // Online indicator
    onlineDot:       '#16a34a',
    onlineBorder:    '#f8fafc',
    onlineGlow:      '0 0 5px rgba(22, 163, 74, 0.6)',
    // Content scroll
    scrollThumb:     'rgba(0, 48, 135, 0.15)',
    // Status bar
    statusBarBg:     '#f1f5f9',
    statusBorder:    '#e2e8f0',
    statusOnline:    'rgba(22, 163, 74, 0.55)',
    statusText:      '#94a3b8',
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
// Placeholder shown when no children are passed
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderState({ isDark, t }: { isDark: boolean; t: typeof L.dark }) {
  const bars = [38, 58, 34, 72, 48, 64, 42, 55];
  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-5"
    >
      {/* Rotating crest rings */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="w-20 h-20 rounded-full border"
          style={{
            borderColor: isDark ? 'rgba(37,99,235,0.25)' : 'rgba(0,48,135,0.15)',
            borderStyle: 'dashed',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-14 h-14 rounded-full border"
          style={{
            borderColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(0,48,135,0.12)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <div
          className="absolute w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #0c1e38, #071428)'
              : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
            border: isDark
              ? '1px solid rgba(59,130,246,0.35)'
              : '1px solid rgba(0,48,135,0.22)',
            boxShadow: isDark
              ? '0 0 20px rgba(37,99,235,0.3)'
              : '0 0 12px rgba(0,48,135,0.1)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2.5L17 16.5H3L10 2.5Z"
              stroke={isDark ? '#60a5fa' : '#003087'}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M6.2 12.5h7.6"
              stroke={isDark ? '#60a5fa' : '#003087'}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <h2
          className="text-lg font-bold tracking-[0.18em] uppercase"
          style={{ color: isDark ? 'rgba(96,165,250,0.65)' : 'rgba(0,48,135,0.55)' }}
        >
          System Initialized
        </h2>
        <p
          className="text-sm"
          style={{ color: isDark ? 'rgba(51,78,114,0.9)' : 'rgba(148,163,184,0.9)' }}
        >
          Select a module from the sidebar to begin.
        </p>
      </div>

      {/* Equalizer bars */}
      <div className="flex items-end gap-1 mt-1">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full"
            style={{
              background: isDark ? 'rgba(37,99,235,0.35)' : 'rgba(0,48,135,0.22)',
            }}
            animate={{ height: [h * 0.3, h, h * 0.45] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout — wraps every page; renders children or fallback placeholder
// ─────────────────────────────────────────────────────────────────────────────

const AdamsonBudgetLayout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(true);

  const t = isDark ? L.dark : L.light;

  return (
    <motion.div
      className="min-h-screen flex overflow-hidden"
      animate={{ background: t.base }}
      transition={{ duration: 0.35 }}
      style={{ fontFamily: "'Sora', 'DM Sans', sans-serif" }}
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
      />

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.header
          className="h-[72px] flex items-center justify-between px-8 shrink-0"
          animate={{ background: t.headerBg }}
          transition={{ duration: 0.35 }}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${t.headerBorder}`,
          }}
        >
          {/* Title */}
          <div>
            <h2
              className="text-[15px] font-bold tracking-wide leading-none"
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
              onToggle={() => setIsDark(p => !p)}
              t={t}
            />

            {/* Divider */}
            <div
              className="w-px h-8"
              style={{ background: t.headerBorder }}
            />

            {/* User chip */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p
                  className="text-sm font-semibold leading-none"
                  style={{ color: t.userNameColor }}
                >
                  System Admin
                </p>
                <p
                  className="text-[10px] tracking-widest uppercase mt-[4px]"
                  style={{ color: t.userRoleColor }}
                >
                  Access Level 1
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
                  <AvatarImage src="" alt="Admin" />
                  <AvatarFallback
                    className="rounded-xl text-sm font-bold"
                    style={{ background: t.avatarGradient, color: t.avatarText }}
                  >
                    NA
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
          Always renders children when provided.
          Falls back to PlaceholderState when no children are passed.
          The AnimatePresence key is "children" when content exists
          and "placeholder" when it doesn't, giving a clean crossfade
          when navigating between a page and the empty shell.
        */}
        <div
          className="flex-1 overflow-y-auto p-8"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${t.scrollThumb} transparent`,
          }}
        >
          <AnimatePresence mode="wait">
            {children != null ? (
              <motion.div
                key="page-content"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                {children}
              </motion.div>
            ) : (
              <PlaceholderState isDark={isDark} t={t} />
            )}
          </AnimatePresence>
        </div>

        {/* ── Status bar ────────────────────────────────────────── */}
        <motion.div
          className="h-8 flex items-center justify-between px-8 shrink-0"
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
              AduLive v2.0
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
  );
};

export default AdamsonBudgetLayout;