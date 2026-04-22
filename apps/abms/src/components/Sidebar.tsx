import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, Menu, LogOut, LucideIcon
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NavSubItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface NavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  href?: string;
  children?: NavSubItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — every token used in the file is defined here
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  dark: {
    // Layout
    sidebar:       'linear-gradient(180deg, #0b1426 0%, #080e1a 100%)',
    border:        'rgba(59, 130, 246, 0.12)',
    borderVivid:   'rgba(59, 130, 246, 0.25)',
    // Brand
    brandBg:       '#0f1a30',
    brandBorder:   'rgba(59, 130, 246, 0.3)',
    brandGlow:     '0 4px 20px rgba(0, 0, 0, 0.4)',
    logoA:         '#60a5fa',
    logoB:         '#3b82f6',
    subTitle:      '#64748b',
    // Nav section label
    sectionLabel:  '#64748b',
    // Nav items
    textMuted:     '#b1b8c2',
    textHover:     '#f8fafc',
    activeBg:      'rgba(59, 130, 246, 0.15)',
    activeBorder:  'rgba(59, 130, 246, 0.4)',
    activeShadow:  'inset 0 0 20px rgba(59, 130, 246, 0.06)',
    activeBar:     '#3b82f6',
    activeBarGlow: '0 0 12px rgba(59, 130, 246, 0.5)',
    activeIcon:    '#60a5fa',
    activeText:    '#f8fafc',
    hoverBg:       'rgba(255, 255, 255, 0.03)',
    hoverBorder:   'rgba(59, 130, 246, 0.2)',
    shimmer:       'rgba(59, 130, 246, 0.1)',
    // Sub-items
    subBorder:     'rgba(59, 130, 246, 0.2)',
    subText:       '#b1b8c2',
    subHoverText:  '#f8fafc',
    subHoverBg:    'rgba(59, 130, 246, 0.08)',
    // Footer
    footerBorder:  'rgba(255, 255, 255, 0.05)',
    logoutColor:   '#475569',
    logoutHover:   'rgba(239, 68, 68, 0.1)',
    // Collapsed expand pill
    toggleBg:      'linear-gradient(135deg, #0c1e38, #071428)',
    toggleBorder:  'rgba(59, 130, 246, 0.45)',
    toggleGlow:    '0 0 12px rgba(37, 99, 235, 0.28)',
  },
  light: {
    // Layout
    sidebar:       '#fcfdfe',
    border:        '#e2e8f0',
    borderVivid:   '#cbd5e1',
    // Brand
    brandBg:       '#ffffff',
    brandBorder:   '#d1d5db',
    brandGlow:     '0 2px 10px rgba(0, 48, 135, 0.05)',
    logoA:         '#003087',
    logoB:         '#0046c7',
    subTitle:      '#64748b',
    // Nav section label
    sectionLabel:  '#94a3b8',
    // Nav items
    textMuted:     '#64748b',
    textHover:     '#003087',
    activeBg:      '#eff6ff',
    activeBorder:  '#bfdbfe',
    activeShadow:  'inset 0 0 18px rgba(0, 48, 135, 0.04)',
    activeBar:     '#003087',
    activeBarGlow: '0 0 8px rgba(0, 48, 135, 0.2)',
    activeIcon:    '#003087',
    activeText:    '#003087',
    hoverBg:       '#f1f5f9',
    hoverBorder:   'rgba(0, 48, 135, 0.18)',
    shimmer:       'rgba(0, 48, 135, 0.06)',
    // Sub-items
    subBorder:     '#e2e8f0',
    subText:       '#94a3b8',
    subHoverText:  '#003087',
    subHoverBg:    'rgba(0, 48, 135, 0.055)',
    // Footer
    footerBorder:  '#e2e8f0',
    logoutColor:   '#94a3b8',
    logoutHover:   'rgba(239, 68, 68, 0.06)',
    // Collapsed expand pill
    toggleBg:      'linear-gradient(135deg, #dbeafe, #eff6ff)',
    toggleBorder:  'rgba(0, 48, 135, 0.35)',
    toggleGlow:    '0 0 10px rgba(0, 48, 135, 0.12)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Nav items — self-contained
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    active: true,
  },
  {
    icon: Settings,
    label: 'Administration',
    children: [
      { label: 'Budget Overview'     },
      { label: 'Department Funds'    },
      { label: 'Personnel & Payroll' },
      { label: 'Reports & Audit'     },
      { label: 'System Config'       },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shimmer sweep
// ─────────────────────────────────────────────────────────────────────────────

const ShimmerSweep: React.FC<{ color: string }> = ({ color }) => (
  <motion.div className="absolute inset-0 rounded-md pointer-events-none overflow-hidden">
    <motion.div
      className="absolute inset-0"
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
    />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Adamson "A" monogram SVG
// The `themeKey` is included in the gradient ID so the SVG paint server
// re-registers when the theme changes — prevents gradient caching.
// ─────────────────────────────────────────────────────────────────────────────

function AdamsonMonogram({ a, b, uid }: { a: string; b: string; uid: string }) {
  const gradId = `adm-grad-${uid}`;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.5L17 16.5H3L10 2.5Z"
        stroke={`url(#${gradId})`}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 12.5h7.6"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={gradId} x1="3" y1="2" x2="17" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavButton — standalone active/inactive button
// ─────────────────────────────────────────────────────────────────────────────

function NavButton({
  item,
  isOpen,
  t,
}: {
  item: NavItem;
  isOpen: boolean;
  t: typeof T.dark;
}) {
  const Icon = item.icon;
  return (
    <button
      className={`relative w-full h-11 rounded-lg overflow-hidden flex items-center transition-all duration-200 border
        ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'}
      `}
      style={
        item.active
          ? {
              background: t.activeBg,
              border: `1px solid ${t.activeBorder}`,
              boxShadow: t.activeShadow,
            }
          : { background: 'transparent', border: '1px solid transparent' }
      }
      onMouseEnter={e => {
        if (!item.active) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = t.hoverBg;
          el.style.borderColor = t.hoverBorder;
        }
      }}
      onMouseLeave={e => {
        if (!item.active) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = 'transparent';
          el.style.borderColor = 'transparent';
        }
      }}
    >
      {item.active && (
        <>
          <div
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
            style={{ background: t.activeBar, boxShadow: t.activeBarGlow }}
          />
          <ShimmerSweep color={t.shimmer} />
        </>
      )}
      <Icon
        className="w-[18px] h-[18px] shrink-0 transition-colors"
        style={{ color: item.active ? t.activeIcon : t.textMuted }}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden"
            style={{ color: item.active ? t.activeText : t.textMuted }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isDark }) => {
  const t = isDark ? T.dark : T.light;

  // Used in keys to force remount of gradient-text elements on theme change.
  // Without this, the -webkit-background-clip: text gradient doesn't repaint
  // when isDark flips because framer-motion keeps the same DOM node.
  const themeKey = isDark ? 'dark' : 'light';

  return (
    <motion.aside
      animate={{ width: isOpen ? 256 : 72 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-20 flex flex-col h-screen shrink-0 overflow-hidden"
      style={{
        background: t.sidebar,
        borderRight: `1px solid ${t.border}`,
        boxShadow: isDark
          ? '4px 0 40px rgba(0,0,0,0.65)'
          : '4px 0 24px rgba(0,48,135,0.06)',
      }}
    >
      {/* Right-edge gradient rule */}
      <div
        className="absolute right-0 top-0 bottom-0 w-px pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent, ${t.borderVivid} 35%, ${t.border} 100%)`,
        }}
      />

      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div
        className="h-[72px] flex items-center justify-between px-3 shrink-0"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              // themeKey in key forces a full remount when isDark changes,
              // which guarantees the gradient text colour repaints immediately.
              key={`brand-open-${themeKey}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 min-w-0"
            >
              <div
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  background: t.brandBg,
                  border: `1px solid ${t.brandBorder}`,
                  boxShadow: t.brandGlow,
                }}
              >
                <AdamsonMonogram a={t.logoA} b={t.logoB} uid={`open-${themeKey}`} />
              </div>
              <div>
                <h1
                  className="text-sm font-extrabold tracking-[0.14em] uppercase leading-none"
                  style={{
                    background: `linear-gradient(90deg, ${t.logoA}, ${t.logoB})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    // Standard property fallback
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  ABMS
                </h1>
                <p
                  className="text-[9px] tracking-[0.22em] uppercase mt-[3px]"
                  style={{ color: t.subTitle }}
                >
                  {/* Adamson Budget Monitoring System */}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`brand-closed-${themeKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  background: t.brandBg,
                  border: `1px solid ${t.brandBorder}`,
                  boxShadow: t.brandGlow,
                }}
              >
                <AdamsonMonogram a={t.logoA} b={t.logoB} uid={`closed-${themeKey}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
          <button
            onClick={onToggle}
            className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: t.subTitle }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLElement).style.background = t.hoverBg)
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLElement).style.background = 'transparent')
            }
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Section label ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-5 pb-1.5 text-[9px] font-bold tracking-[0.26em] uppercase"
            style={{ color: t.sectionLabel }}
          >
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <Accordion type="multiple" className="w-full border-none space-y-0.5">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;

            if (!hasChildren) {
              return (
                <motion.div
                  key={index}
                  whileHover={{ x: isOpen ? 2 : 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <NavButton item={item} isOpen={isOpen} t={t} />
                </motion.div>
              );
            }

            return (
              <AccordionItem key={index} value={`nav-${index}`} className="border-none">
                <AccordionTrigger
                  className={`relative flex items-center h-11 w-full rounded-lg hover:no-underline transition-all duration-200 border border-transparent
                    ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'}
                  `}
                  style={{ color: t.textMuted }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = t.hoverBg;
                    el.style.borderColor = t.hoverBorder;
                    el.style.color = t.textHover;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'transparent';
                    el.style.borderColor = 'transparent';
                    el.style.color = t.textMuted;
                  }}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium tracking-wide flex-1 text-left"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </AccordionTrigger>

                {isOpen && (
                  <AccordionContent className="pb-1.5 pt-0.5 overflow-hidden">
                    <div
                      className="ml-[23px] pl-3 space-y-0.5"
                      style={{ borderLeft: `1px solid ${t.subBorder}` }}
                    >
                      {item.children?.map((child, ci) => (
                        <motion.button
                          key={ci}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ci * 0.05, duration: 0.18 }}
                          className="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-xs font-medium tracking-wide transition-all duration-150 border border-transparent"
                          style={{ color: child.active ? t.activeIcon : t.subText }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = t.subHoverBg;
                            el.style.borderColor = t.hoverBorder;
                            el.style.color = t.subHoverText;
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = 'transparent';
                            el.style.borderColor = 'transparent';
                            el.style.color = child.active ? t.activeIcon : t.subText;
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full shrink-0 opacity-70"
                            style={{ background: child.active ? t.activeBar : t.subText }}
                          />
                          {child.label}
                        </motion.button>
                      ))}
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
{/* 
      ── Footer ────────────────────────────────────────────────── */}
      <div className="shrink-0 p-2" style={{ borderTop: `1px solid ${t.footerBorder}` }}>
        {/* <button
          className={`w-full h-10 flex items-center gap-3 rounded-lg transition-all duration-200 border border-transparent text-sm
            ${!isOpen ? 'justify-center px-0' : 'px-3'}`}
          style={{ color: t.logoutColor }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = t.logoutHover;
            el.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color = t.logoutColor;
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button> */}
      </div>

      {/* Collapsed expand pill */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          onClick={onToggle}
          className="absolute top-[26px] -right-[13px] w-[26px] h-[26px] rounded-full flex items-center justify-center z-30"
          style={{
            background: t.toggleBg,
            border: `1px solid ${t.toggleBorder}`,
            boxShadow: t.toggleGlow,
          }}
        >
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <path
              d="M2 2L6 5L2 8"
              stroke={t.logoA}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      )}
    </motion.aside>
  );
};

export default Sidebar;