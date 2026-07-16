import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"

export const AWOL_NOTICE =
  "Except for sick leave and emergency leave applications, all absences without official leave approval from HRMDO are unauthorized and shall be considered as absence without official leave (AWOL), which shall be a sufficient cause for dismissal."

export const HRMDO_CONTACT =
  "Please see any of the regular staff of the HRMDO for inquiries."

type GuidelinesPageShellProps = {
  badge: string
  title: string
  subtitle: string
  children: ReactNode
}

export function GuidelinesPageShell({
  badge,
  title,
  subtitle,
  children,
}: GuidelinesPageShellProps) {
  return (
    <div className="min-h-[calc(100vh-2rem)] bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fffdf7_48%,_#fff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm backdrop-blur">
            {badge}
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              {subtitle}
            </p>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

type GuidelinesNoticeCardProps = {
  notice: string
  reference?: string
  children: ReactNode
}

export function GuidelinesNoticeCard({
  notice,
  reference,
  children,
}: GuidelinesNoticeCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] ring-1 ring-black/5">
      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-100 via-yellow-50 to-white px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Important Notice
            </p>
            <p className="max-w-4xl text-sm font-semibold leading-6 text-slate-950 sm:text-base">
              {notice}
            </p>
          </div>

          {reference ? (
            <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
              {reference}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-8">{children}</div>
    </section>
  )
}

type GuidelinesSummaryCardProps = {
  label: string
  text: string
}

export function GuidelinesSummaryCard({ label, text }: GuidelinesSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{text}</p>
    </div>
  )
}

export function GuidelinesSummaryGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-3">{children}</div>
}

type GuidelinesInstructionsSectionProps = {
  description?: string
  children: ReactNode
}

export function GuidelinesInstructionsSection({
  description = "Review each item carefully before filing your leave request.",
  children,
}: GuidelinesInstructionsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Instructions
        </h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <ol className="space-y-4">{children}</ol>
    </div>
  )
}

export function GuidelinesPlainInstructionItem({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <p className="font-medium text-slate-900">{children}</p>
    </li>
  )
}

type GuidelinesNumberedInstructionItemProps = {
  number: number
  title: string
  children: ReactNode
}

export function GuidelinesNumberedInstructionItem({
  number,
  title,
  children,
}: GuidelinesNumberedInstructionItemProps) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {children}
        </div>
      </div>
    </li>
  )
}

type GuidelinesBulletProps = {
  children: ReactNode
  nested?: boolean
}

export function GuidelinesBullet({ children, nested = false }: GuidelinesBulletProps) {
  return (
    <li className={`flex gap-3${nested ? " ml-5" : ""}`}>
      <span
        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${nested ? "bg-slate-400" : "bg-amber-500"}`}
      />
      <span>{children}</span>
    </li>
  )
}

export function GuidelinesBulletList({ children }: { children: ReactNode }) {
  return <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{children}</ul>
}

type GuidelinesFooterNoteProps = {
  note: string
  contactText?: string
}

export function GuidelinesFooterNote({
  note,
  contactText = HRMDO_CONTACT,
}: GuidelinesFooterNoteProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Note
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{note}</p>
      </div>
      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200">
        {contactText}
      </div>
    </div>
  )
}

export function GuidelinesLoadingSkeleton() {
  return (
    <GuidelinesPageShell
      badge="Leave Guidelines"
      title="Guidelines for leave applications"
      subtitle="Loading leave guidelines..."
    >
      <section className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] ring-1 ring-black/5">
        <div className="border-b border-amber-100 bg-gradient-to-r from-amber-100 via-yellow-50 to-white px-5 py-4 sm:px-7">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-16 w-full max-w-4xl" />
        </div>
        <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </section>
    </GuidelinesPageShell>
  )
}
