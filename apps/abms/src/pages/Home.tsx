import { useEffect, useState } from 'react';
import AdamsonBudgetLayout from '../layouts/Screenlayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@repo/ui/components/dialog';
import { Button } from '@repo/ui/components/button';
import {
  ShieldCheck,
  Info,
  FileText,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ReceiptText,
  Users,
  ArrowUpRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Static dashboard data
// ─────────────────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    label: 'Total Budget',
    value: '₱ 4,250,000.00',
    sub: 'FY 2024–2025',
    icon: Wallet,
    trend: null,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.18)',
  },
  {
    label: 'Total Disbursed',
    value: '₱ 2,134,800.00',
    sub: '50.2% utilized',
    icon: TrendingUp,
    trend: 'up',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.18)',
  },
  {
    label: 'Remaining Balance',
    value: '₱ 2,115,200.00',
    sub: '49.8% available',
    icon: TrendingDown,
    trend: 'down',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.18)',
  },
  {
    label: 'Pending RS',
    value: '12',
    sub: 'Awaiting approval',
    icon: Clock,
    trend: null,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.18)',
  },
];

const RECENT_TRANSACTIONS = [
  { id: 'RS-2025-0041', supplier: 'ABC Office Supplies Co.', amount: '₱ 18,500.00', date: 'Apr 20, 2025', status: 'approved' },
  { id: 'RS-2025-0040', supplier: 'XYZ Printing Services',   amount: '₱ 6,200.00',  date: 'Apr 19, 2025', status: 'approved' },
  { id: 'RS-2025-0039', supplier: 'Metro Catering Inc.',      amount: '₱ 32,000.00', date: 'Apr 18, 2025', status: 'pending'  },
  { id: 'RS-2025-0038', supplier: 'Tech Solutions Corp.',     amount: '₱ 74,800.00', date: 'Apr 17, 2025', status: 'approved' },
  { id: 'RS-2025-0037', supplier: 'Global Freight & Cargo',   amount: '₱ 9,150.00',  date: 'Apr 16, 2025', status: 'pending'  },
];

const BUDGET_BREAKDOWN = [
  { dept: 'Academic Affairs',       allocated: 1200000, used: 680000  },
  { dept: 'Student Services',       allocated: 850000,  used: 520000  },
  { dept: 'Administration',         allocated: 1100000, used: 610000  },
  { dept: 'Research & Development', allocated: 700000,  used: 234800  },
  { dept: 'Facilities Management',  allocated: 400000,  used: 90000   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div className="space-y-6">

      {/* ── Page title ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
          Overview · AY 2024–2025
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-5 flex flex-col gap-3 border"
              style={{ background: card.bg, borderColor: card.border }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {card.label}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}22`, border: `1px solid ${card.color}33` }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100 leading-none">{card.value}</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Bottom row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Budget breakdown — 3 cols */}
        <div
          className="xl:col-span-3 rounded-xl border p-5"
          style={{
            background: 'rgba(15,26,48,0.6)',
            borderColor: 'rgba(59,130,246,0.12)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">Budget by Department</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">FY 2024–2025</span>
          </div>

          <div className="space-y-4">
            {BUDGET_BREAKDOWN.map((row) => {
              const pct = Math.round((row.used / row.allocated) * 100);
              const barColor = pct > 75 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#3b82f6';
              return (
                <div key={row.dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{row.dept}</span>
                    <span className="text-slate-500">
                      ₱{(row.used / 1000).toFixed(0)}k / ₱{(row.allocated / 1000).toFixed(0)}k
                      <span className="ml-2 font-bold" style={{ color: barColor }}>{pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent transactions — 2 cols */}
        <div
          className="xl:col-span-2 rounded-xl border p-5"
          style={{
            background: 'rgba(15,26,48,0.6)',
            borderColor: 'rgba(59,130,246,0.12)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">Recent RS</span>
            </div>
            <button className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {RECENT_TRANSACTIONS.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start justify-between gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {tx.status === 'approved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-300 truncate">{tx.id}</p>
                    <p className="text-[10px] text-slate-500 truncate">{tx.supplier}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-200">{tx.amount}</p>
                  <p className="text-[10px] text-slate-600">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home page
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <>
      {/* ── Welcome dialog ───────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-xl p-0 overflow-hidden border-blue-500/20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

          <div className="px-8 pt-6 pb-2">
            <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  Institutional Reminders
                </DialogTitle>
                <p className="text-xs font-medium tracking-[0.15em] text-blue-600/70 dark:text-cyan-500/70 uppercase">
                  OVPFA Compliance Guidelines
                </p>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 dark:bg-blue-400/5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Payment & Documentation
                  </span>
                </div>

                <ol className="space-y-4">
                  {[
                    { text: 'RS for payment to supplier shall be prepared separately for each: ', highlight: 'One RS for One Supplier' },
                    { text: 'RS for Cash Advance shall be supported by details of every expense.', highlight: '' },
                    { text: "For all purchases, Invoice / Official Receipt shall be BIR registered with Supplier's Name and TIN.", highlight: '' },
                    { text: 'TIN shall be secured from all non-employee recipients (honorariums, talent fees, etc).', highlight: '' },
                    { text: 'Refer to OVPFA Memo 12 (Credit Card Usage) and OVPFA 14 (Modes of Payment).', highlight: '' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-blue-600/10 text-[10px] font-bold text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {item.text}
                        {item.highlight && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-700 dark:text-cyan-300 font-bold underline decoration-blue-500/30">
                            {item.highlight}
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center gap-2 px-1 italic">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[11px] text-slate-500 dark:text-slate-500">
                  By clicking "Acknowledge", you confirm that you have read the financial protocols.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-100/50 dark:bg-slate-900/50 border-t border-blue-500/10">
            <Button
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase transition-all shadow-lg shadow-blue-600/20"
            >
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Layout with dashboard as children ───────────────────── */}
      <AdamsonBudgetLayout>
        <Dashboard />
      </AdamsonBudgetLayout>
    </>
  );
}