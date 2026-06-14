import {
  AWOL_NOTICE,
  GuidelinesBullet,
  GuidelinesBulletList,
  GuidelinesFooterNote,
  GuidelinesInstructionsSection,
  GuidelinesNoticeCard,
  GuidelinesNumberedInstructionItem,
  GuidelinesPageShell,
  GuidelinesPlainInstructionItem,
  GuidelinesSummaryCard,
  GuidelinesSummaryGrid,
} from "./-guidelines-layout"

export function SilGuidelines() {
  return (
    <GuidelinesPageShell
      badge="Leave Guidelines"
      title="Service Incentive Leave (SIL) Guidelines"
      subtitle="Filing rules and reminders for academic contractual employees who file Service Incentive Leave through eLeave."
    >
      {/* <GuidelinesNoticeCard notice={AWOL_NOTICE}>
        <GuidelinesSummaryGrid>
          <GuidelinesSummaryCard
            label="Filing"
            text="File SIL through eLeave as early as practicable before your intended absence."
          />
          <GuidelinesSummaryCard
            label="Coverage"
            text="Applies to academic contractual employees. Only SIL is available in eLeave for this employment status."
          />
          <GuidelinesSummaryCard
            label="Support"
            text="HRMDO may request supporting documents and official approval before leave is granted."
          />
        </GuidelinesSummaryGrid>

        <GuidelinesInstructionsSection description="Review each item carefully before filing your SIL request.">
          <GuidelinesPlainInstructionItem>
            An employee who is absent without approved leave shall not be entitled
            to receive his/her salary corresponding to the period of his/her
            unauthorized leave of absence.
          </GuidelinesPlainInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={1}
            title="Who this applies to"
          >
            <GuidelinesBulletList>
              <GuidelinesBullet>
                These guidelines apply to academic contractual employees with an
                active HR record, academic employment type, non-admin status, and
                employment status that is not permanent.
              </GuidelinesBullet>
              <GuidelinesBullet>
                In eLeave, only Service Incentive Leave (SIL) can be filed. Other
                leave types are not available for this employment status.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={2}
            title="Filing Service Incentive Leave (SIL)"
          >
            <GuidelinesBulletList>
              <GuidelinesBullet>
                File your SIL application through eLeave before your intended
                absence whenever practicable.
              </GuidelinesBullet>
              <GuidelinesBullet>
                SIL may be filed anytime through the system; submit complete and
                accurate details for HRMDO review.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Wait for official HRMDO approval before treating your absence as
                authorized leave.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem number={3} title="Leave credits and balances">
            <GuidelinesBulletList>
              <GuidelinesBullet>
                SIL is not displayed as a standard leave credit balance in eLeave
                the same way as vacation or sick leave credits.
              </GuidelinesBullet>
              <GuidelinesBullet>
                HRMDO determines eligibility and approval based on your employment
                record and applicable policies.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem number={4} title="Approval and unauthorized absence">
            <GuidelinesBulletList>
              <GuidelinesBullet>
                All absences without official leave approval from HRMDO are
                unauthorized and may be considered absence without official leave
                (AWOL).
              </GuidelinesBullet>
              <GuidelinesBullet>
                AWOL may be a sufficient cause for dismissal and may affect salary
                for the unauthorized period of absence.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>
        </GuidelinesInstructionsSection>

      </GuidelinesNoticeCard> */}
        <GuidelinesFooterNote note="If without justifiable reason whatsoever I failed to report after the expiration of the period of my leave, it is clearly understood that I have resigned voluntarily." />

    </GuidelinesPageShell>
  )
}
