import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, Menu, Receipt, FileText, Images
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import { useNavigate, useRouteContext, useRouterState } from '@tanstack/react-router';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NavSubItem {
  label: string;
  href?: string;
  active?: boolean;
  permissions?: string[];
}

export interface NavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  href?: string;
  permissions?: string[];
  children?: NavSubItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  isNavigating?: boolean;
  isOverlay?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — Sidebar (Modern Adamson Futuristic)
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  dark: {
    // Layout
    sidebar: 'linear-gradient(180deg, #070c1a 0%, #040812 100%)',
    border: 'rgba(56, 189, 248, 0.08)',
    borderVivid: 'rgba(56, 189, 248, 0.25)',
    // Brand
    brandBg: 'transparent',
    brandBorder: 'rgba(56, 189, 248, 0.15)',
    brandGlow: '0 4px 20px rgba(0, 0, 0, 0.6)',
    logoA: '#38bdf8', // Neon Cyan for dark mode contrast
    logoB: '#2563eb', // Royal Blue
    subTitle: '#475569',
    // Nav section label
    sectionLabel: '#475569',
    // Nav items
    textMuted: '#8b9cb6',
    textHover: '#e2e8f0',
    activeBg: 'rgba(37, 99, 235, 0.08)',
    activeBorder: 'rgba(56, 189, 248, 0.2)',
    activeShadow: 'inset 0 0 20px rgba(56, 189, 248, 0.03)',
    activeBar: '#38bdf8',
    activeBarGlow: '0 0 16px rgba(56, 189, 248, 0.6)',
    activeIcon: '#38bdf8',
    activeText: '#f8fafc',
    hoverBg: 'rgba(255, 255, 255, 0.02)',
    hoverBorder: 'rgba(56, 189, 248, 0.1)',
    shimmer: 'rgba(56, 189, 248, 0.05)',
    // Sub-items
    subBorder: 'rgba(56, 189, 248, 0.1)',
    subText: '#64748b',
    subHoverText: '#e2e8f0',
    subHoverBg: 'rgba(37, 99, 235, 0.05)',
    // Footer
    footerBorder: 'rgba(255, 255, 255, 0.03)',
    logoutColor: '#475569',
    logoutHover: 'rgba(239, 68, 68, 0.1)',
    // Collapsed expand pill
    toggleBg: '#0a1224',
    toggleBorder: 'rgba(56, 189, 248, 0.3)',
    toggleGlow: '0 0 15px rgba(56, 189, 248, 0.15)',
  },
  light: {
    // Layout
    sidebar: 'linear-gradient(180deg, #f0f5ff 0%, #d8e6ff 100%)',
    border: 'rgba(0, 48, 135, 0.14)',
    borderVivid: 'rgba(0, 48, 135, 0.32)',
    // Brand
    brandBg: 'transparent',
    brandBorder: 'rgba(0, 48, 135, 0.18)',
    brandGlow: '0 2px 16px rgba(0, 48, 135, 0.12)',
    logoA: '#001e6e',
    logoB: '#0040c0',
    subTitle: '#2C4A72',
    // Nav section label
    sectionLabel: '#5272A0',
    // Nav items
    textMuted: '#2C4272',
    textHover: '#00082E',
    activeBg: 'rgba(0, 70, 199, 0.13)',
    activeBorder: 'rgba(0, 70, 199, 0.32)',
    activeShadow: 'inset 0 0 18px rgba(0, 48, 135, 0.10)',
    activeBar: '#0040c0',
    activeBarGlow: '0 0 14px rgba(0, 70, 199, 0.60)',
    activeIcon: '#0040c0',
    activeText: '#00082E',
    hoverBg: 'rgba(0, 48, 135, 0.08)',
    hoverBorder: 'rgba(0, 48, 135, 0.20)',
    shimmer: 'rgba(0, 48, 135, 0.09)',
    // Sub-items
    subBorder: 'rgba(0, 48, 135, 0.16)',
    subText: '#2C4A72',
    subHoverText: '#0040c0',
    subHoverBg: 'rgba(0, 48, 135, 0.09)',
    // Footer
    footerBorder: 'rgba(0, 48, 135, 0.14)',
    logoutColor: '#2C4A72',
    logoutHover: 'rgba(239, 68, 68, 0.09)',
    // Collapsed expand pill
    toggleBg: '#dde8ff',
    toggleBorder: 'rgba(0, 48, 135, 0.35)',
    toggleGlow: '0 0 16px rgba(0, 48, 135, 0.18)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Nav items — self-contained
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/',
  },
  {
    icon: Settings,
    label: 'Administration',
    children: [
      { label: 'Budget Settings', href: '/admin/budget-settings', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Status', href: '/admin/budget-status', permissions: ['no-access'] },
      { label: 'Budget Review', href: '/admin/budget-review', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Transfer Account', href: '/admin/budget-transfer-account', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Adjustment Entry', href: '/admin/budget-adjustment-entry', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Departments and Sections', href: '/admin/department', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'User Department Access', href: '/admin/user-department-access', permissions: ['abms_user_department_access', 'controller-access'] },
      { label: 'Chart of Accounts', href: '/admin/chart-of-accounts', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      // Only show if user has the explicit permission.
      // (Admin/budget-access-only users should not see this.)
      { label: 'Office Supplies', href: '/admin/office-supplies', permissions: ['stockroom-access'] },
    ],
  },
  {
    icon: Receipt,
    label: 'Transactions',
    children: [
      { label: 'Budget Proposal Entry', href: '/transactions/budget-proposal-entry', permissions: ['allow-budget-proposal-entry'] },
      { label: 'Budget Request Entry', href: '/transactions/budget-request-entry', permissions: ['allow-budget-request-entry'] },
      { label: 'Requisition Process', href: '/transactions/requisition-process', permissions: ['budget-access', 'admin-access', 'accounting-access', 'cashier-access', 'logistics-access', 'stockroom-access', 'controller-access'] },
      { label: 'Liquidation Submission', href: '/transactions/liquidation-submission', permissions: ['allow-budget-request-entry', 'budget-access', 'admin-access'] },
    ],
  },
  {
    icon: FileText,
    label: 'Reports',
    children: [
      { label: 'Budget Performance Per Department', href: '/reports/budget-performance-department', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Performance Per Account', href: '/reports/budget-performance-account', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Performance University', href: '/reports/budget-performance-university', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Item Requested Per Account', href: '/reports/item-requested-per-account', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Items Requested by Payee', href: '/reports/items-requested-by-payee', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Adjustments Per Department', href: '/reports/adjustments-per-department', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Liquidation', href: '/reports/budget-liquidation', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Budget Proposal Reports', href: '/reports/budget-proposal-reports', permissions: ['admin-access', 'budget-access', 'controller-access'] },
      { label: 'Unserved RS', href: '/reports/unserved-rs', permissions: ['admin-access', 'budget-access', 'controller-access'] },
    ],
  },
  {
    icon: Images,
    label: 'Infographics',
    children: [
      {
        label: 'Budget User Guides',
        href: '/infographics/budget-user-guides',
        permissions: ['allow-budget-proposal-entry', 'allow-budget-request-entry',],
      },
    ],
  },


];

type AbmsPermission = {
  permission_id?: string | number;
  auth_permission?: {
    id?: string | number;
    name?: string;
  } | null;
};

type AbmsPermissionsPayload = {
  general_permissions?: AbmsPermission[];
  abms_permissions?: AbmsPermission[];
};

type AbmsRouteUser = {
  permissions?: string[];
  abmsPermissions?: AbmsPermissionsPayload | null;
};

const getPermissionName = (permission: AbmsPermission) => {
  // Some endpoints may return auth_permission as null; then we can't show a name.
  // We only use permission.auth_permission.name for filtering.
  return permission.auth_permission?.name;
};


const buildPermissionSet = (payload?: AbmsPermissionsPayload | null) => {
  const permissionNames = new Set<string>();

  payload?.general_permissions?.forEach(permission => {
    const name = getPermissionName(permission);
    if (name) permissionNames.add(name);
  });

  payload?.abms_permissions?.forEach(permission => {
    const name = getPermissionName(permission);
    if (name) permissionNames.add(name);
  });

  return permissionNames;
};

const canShowItem = (permissions: string[] | undefined, userPermissions: Set<string>) => {
  if (!permissions || permissions.length === 0) return true;

  return permissions.some(permission => userPermissions.has(permission));
};

const filterNavItems = (items: NavItem[], userPermissions: Set<string>) =>
  items
    .map(item => {
      const children = item.children?.filter(child => canShowItem(child.permissions, userPermissions));

      return {
        ...item,
        children,
      };
    })
    .filter(item => {
      const hasVisibleChildren = item.children && item.children.length > 0;
      return canShowItem(item.permissions, userPermissions) && (!item.children || hasVisibleChildren);
    });

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
// Adamson logo
// ─────────────────────────────────────────────────────────────────────────────

function AdamsonLogo({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/logos/adulogo.png"
      alt="Adamson University"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavButton — standalone active/inactive button
// ─────────────────────────────────────────────────────────────────────────────

function NavButton({
  item,
  isOpen,
  t,
  isActive,
  isNavigating,
}: {
  item: NavItem;
  isOpen: boolean;
  t: typeof T.dark;
  isActive: boolean;
  isNavigating: boolean;
}) {
  const Icon = item.icon;
  const navigate = useNavigate();
  return (
    <button
      disabled={isNavigating}
      className={`relative w-full h-11 rounded-lg overflow-hidden flex items-center transition-all duration-200 border
        ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'}
      `}
      style={
        isActive
          ? {
            background: t.activeBg,
            border: `1px solid ${t.activeBorder}`,
            boxShadow: t.activeShadow,
          }
          : { background: 'transparent', border: '1px solid transparent' }
      }
      onClick={() => item.href && navigate({ to: item.href })}
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = t.hoverBg;
          el.style.borderColor = t.hoverBorder;
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = 'transparent';
          el.style.borderColor = 'transparent';
        }
      }}
    >
      {isActive && (
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
        style={{ color: isActive ? t.activeIcon : t.textMuted }}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="min-w-0 truncate text-sm font-medium tracking-wide"
            style={{ color: isActive ? t.activeText : t.textMuted }}
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isDark, isNavigating = false, isOverlay = false }) => {
  const t = isDark ? T.dark : T.light;
  const themeKey = isDark ? 'dark' : 'light';
  const navigate = useNavigate();
  const { user } = useRouteContext({ strict: false });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Permissions shape comes from router protectedRoute loader:
  // user.abmsPermissions = financeSvc.get('/user/abmspermissions').data
  // Backend returns:
  // { general_permissions: Permission[], abms_permissions: Permission[] }
  // where each item has auth_permission resolved via authPermission().
  const routeUser = user as AbmsRouteUser | null | undefined;
  const userPermissions = buildPermissionSet(routeUser?.abmsPermissions);
  routeUser?.permissions?.forEach(permission => userPermissions.add(permission));
  // console.log(userPermissions)
  const navItems = filterNavItems(NAV_ITEMS, userPermissions);




  // Compute which accordion groups should be open by default (when a child matches)
  const defaultOpenAccordions = navItems
    .map((item, index) =>
      item.children?.some((child) => child.href === pathname) ? `nav-${index}` : null
    )
    .filter(Boolean) as string[];

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOverlay ? 288 : isOpen ? 288 : 72,
        x: isOverlay && !isOpen ? -288 : 0,
      }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      aria-hidden={isOverlay && !isOpen}
      inert={isOverlay && !isOpen ? true : undefined}
      className={`${isOverlay ? 'fixed inset-y-0 left-0' : 'relative'} z-20 flex h-screen h-dvh shrink-0 flex-col overflow-visible`}
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
        className="h-[80px] flex items-center justify-between px-3 shrink-0" // Increased height slightly for larger text
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key={`brand-open-${themeKey}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 min-w-0"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12">
                <AdamsonLogo size={48} /> {/* Slightly larger logo */}
              </div>
              <div className="flex flex-col justify-center">
                <h1
                  className="text-xl font-black tracking-[0.2em] uppercase leading-none" // Enlarged text and weight
                  style={{
                    background: `linear-gradient(135deg, ${t.logoA}, ${t.logoB})`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  ABMS
                </h1>
                {/* <p
                  className="text-[10px] font-bold tracking-[0.15em] uppercase mt-1 opacity-80"
                  style={{ color: t.subTitle }}
                >
                  SYSTEM
                </p> */}
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
              <div className="flex items-center justify-center w-12 h-12">
                <AdamsonLogo size={44} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
          <button
            disabled={isNavigating}
            onClick={onToggle}
            className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: t.subTitle }}
          // ... hover logic
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

      <nav className="flex-1 py-2 px-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <Accordion type="multiple" defaultValue={defaultOpenAccordions} className="w-full border-none space-y-0.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isActive = !hasChildren && item.href === pathname;

            if (!hasChildren) {
              return (
                <motion.div
                  key={index}
                  whileHover={{ x: isOpen ? 2 : 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <NavButton item={item} isOpen={isOpen} t={t} isActive={isActive} isNavigating={isNavigating} />
                </motion.div>
              );
            }

            return (
              <AccordionItem key={index} value={`nav-${index}`} className="border-none">
                <AccordionTrigger
                  disabled={isNavigating}
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
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium tracking-wide"
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
                      {item.children?.map((child, ci) => {
                        const isChildActive = child.href === pathname;
                        return (
                          <motion.button
                            key={ci}
                            disabled={isNavigating}
                            onClick={() => child.href && navigate({ to: child.href })}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ci * 0.05, duration: 0.18 }}
                            className="flex min-h-9 w-full items-start gap-2.5 rounded-md border border-transparent px-3 py-2 text-left text-xs font-medium leading-5 tracking-wide transition-all duration-150 disabled:cursor-wait disabled:opacity-65"
                            style={{ color: isChildActive ? t.activeIcon : t.subText }}
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
                              el.style.color = isChildActive ? t.activeIcon : t.subText;
                            }}
                          >
                            <span
                              className="mt-2 h-1 w-1 shrink-0 rounded-full opacity-70"
                              style={{ background: isChildActive ? t.activeBar : t.subText }}
                            />
                            <span className="min-w-0 flex-1 break-words">{child.label}</span>
                          </motion.button>
                        );
                      })}
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
      {!isOpen && !isOverlay && (
        <motion.button
          type="button"
          aria-label="Expand sidebar"
          title="Expand sidebar"
          disabled={isNavigating}
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
