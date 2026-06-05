import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/guidelines")({
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fffdf7_48%,_#fff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm backdrop-blur">
            Leave Guidelines
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Guidelines for leave applications
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Clear rules, filing timelines, and required supporting documents
              in one place so employees can scan the policy quickly.
            </p>
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] ring-1 ring-black/5">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-100 via-yellow-50 to-white px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Important Notice
                </p>
                <p className="max-w-4xl text-sm font-semibold leading-6 text-slate-950 sm:text-base">
                  Except for sick leave and emergency leave applications, all
                  absences without official leave approval from HRMDO are
                  unauthorized and shall be considered as absence without
                  official leave (AWOL), which shall be a sufficient cause for
                  dismissal.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                Ref. VPA Memo #32 s. 2000
              </div>
            </div>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Filing
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Submit early and complete the required forms.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Coverage
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Applies to sick, emergency, vacation, educational, and family
                  leave types.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Support
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  HRMDO may request certificates, clearances, and agreements.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Instructions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review each item carefully before filing your leave request.
                </p>
              </div>

              <ol className="space-y-4">
                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <p className="font-medium text-slate-900">
                    An employee who is absent without approved leave shall not
                    be entitled to receive his/her salary corresponding to the
                    period of his/her unauthorized leave of absence.
                  </p>
                </li>

                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      1
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-950">
                        Sick Leave (SL) / Emergency Leave (EL)
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application for such leave shall be filed
                            immediately upon employee&apos;s return.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application for SL for four days or more shall be
                            charged against SSS Benefits and is considered leave
                            without pay.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            SSS form should be sent to the employer within five
                            days of sickness or injury. A medical certificate
                            from the University Physician is required by HRMDO
                            prior to approval of sick leave.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      2
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-950">
                        Emergency Leave (EL)
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Permanent Faculty Member or employee shall be
                            allowed an emergency leave with pay of five(5) days.
                            Leaves shall be considered emergency only in the
                            following cases:
                          </span>
                        </li>
                        <li className="ml-5 flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          <span>
                            Accident, illness, death of immediate family member
                            i.e. spouse, child, parent, brother, sister,
                            immediate grandparent, grandchild, spouse&apos;s
                            parent.
                          </span>
                        </li>
                        <li className="ml-5 flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          <span>
                            Due to natural calamities or force majeure i.e.
                            typhoon, flooded area, jeepney strike, burglary or
                            fire in one&apos;s residence, 9th day of death, 40th
                            day of death.
                          </span>
                        </li>
                        <li className="ml-5 flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          <span>
                            On year death anniversary of immediate family
                            member.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      3
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-950">
                        Vacation Leave (VL) / Special Purpose Leave (SPL) /
                        Birthday Leave (BL)
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application for VL, SPL and BL shall be filed in
                            advance or at least{" "}
                            <span className="font-semibold text-slate-950">
                              three (3) days before
                            </span>{" "}
                            the scheduled date of leave.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Faculty member/employee shall avail of/use only
                            his/her{" "}
                            <span className="font-semibold text-slate-950">
                              earned VL credit
                            </span>{" "}
                            for a given period i.e. 2.75 days of leave credit
                            for each month of active service.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application for BL is for full-time and part-time
                            employees who hold permanent status.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application of BL can be availed any day within
                            his/her birth month.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      4
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-950">
                        Leave of Absence (LOA) / Educational Leave (EDL)
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            An application for LOA for one semester or more
                            shall be accompanied by a letter of request from the
                            employee and shall accomplish a University Clearance
                            Form.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Educational Leave application shall be supported
                            with three(3) copies of Educational Leave agreement.
                            Forms are available at HRMDO.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      5
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-950">
                        Paternity Leave (PL) / Maternity Leave (ML)
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application for paternity leave shall be supported
                            with birth certificate of legitimate child.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            Application for maternity leave shall be filed
                            one(1) month before the expected delivery.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Note
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  If without justifiable reason whatsoever I failed to report
                  after the expiration of the period of my leave, it is clearly
                  understood that I have resigned voluntarily.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200">
                Please see any of the regular staff of the HRMDO for inquiries.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
