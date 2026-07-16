import {
  AWOL_NOTICE,
  GuidelinesFooterNote,
  GuidelinesInstructionsSection,
  GuidelinesNoticeCard,
  GuidelinesNumberedInstructionItem,
  GuidelinesPageShell,
  GuidelinesSummaryCard,
  GuidelinesSummaryGrid,
} from "./-guidelines-layout"

export function SilGuidelines() {
  return (
    <GuidelinesPageShell
      badge="Leave Guidelines"
      title="Application for Service Incentive Leave (SIL)"
      subtitle="Official HRMDO filing rules for academic contractual faculty."
    >
      <GuidelinesNoticeCard notice={AWOL_NOTICE}>
        <GuidelinesSummaryGrid>
          <GuidelinesSummaryCard
            label="Eligibility"
            text="After one (1) year of service, contractual faculty are entitled to five (5) days of SIL with pay per year, accrued from the date of hiring."
          />
          <GuidelinesSummaryCard
            label="Usage"
            text="SIL credits may be used for leave applications, converted to cash upon permanency, or credited to final pay after university clearance upon separation."
          />
          <GuidelinesSummaryCard
            label="Filing"
            text="File at least three (3) days before the scheduled leave, or immediately upon return to work for sickness or emergency."
          />
        </GuidelinesSummaryGrid>

        <GuidelinesInstructionsSection description="Service Incentive Leave (SIL)">
          <GuidelinesNumberedInstructionItem
            number={1}
            title="Eligibility and benefit computation"
          >
            <p className="mt-3 text-sm leading-6 text-slate-700">
              A faculty member with contractual employment who has rendered at
              least one (1) year of service shall be entitled to a yearly service
              incentive leave of five (5) days with pay. The benefit computation
              of SIL is from the date of hiring and it is accumulated for a total
              of 5 days per year.
            </p>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={2}
            title="Usage and conversion"
          >
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The available service incentive leave credits may be used for
              employee&apos;s leave application, or they can be converted to cash
              upon permanency or be credited to the employee&apos;s final pay after
              processing the university clearance in case of separation.
            </p>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={3}
            title="Filing requirements"
          >
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Service Incentive Leave (SIL) shall be filed at least 3 days before
              the scheduled date of leave or immediately upon employee&apos;s return
              to work in case of sickness or emergency reason.
            </p>
          </GuidelinesNumberedInstructionItem>
        </GuidelinesInstructionsSection>

        <GuidelinesFooterNote note="If without justifiable reason whatsoever I failed to report after the expiration of the period of my leave, it is clearly understood that I have resigned voluntarily." />
      </GuidelinesNoticeCard>
    </GuidelinesPageShell>
  )
}
