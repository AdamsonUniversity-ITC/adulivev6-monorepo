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

export function GeneralGuidelines() {
  return (
    <GuidelinesPageShell
      badge="Leave Guidelines"
      title="Guidelines for leave applications"
      subtitle="Clear rules, filing timelines, and required supporting documents in one place so employees can scan the policy quickly."
    >
      <GuidelinesNoticeCard notice={AWOL_NOTICE} reference="Ref. VPA Memo #32 s. 2000">
        <GuidelinesSummaryGrid>
          <GuidelinesSummaryCard
            label="Filing"
            text="Submit early and complete the required forms."
          />
          <GuidelinesSummaryCard
            label="Coverage"
            text="Applies to sick, emergency, vacation, educational, and family leave types."
          />
          <GuidelinesSummaryCard
            label="Support"
            text="HRMDO may request certificates, clearances, and agreements."
          />
        </GuidelinesSummaryGrid>

        <GuidelinesInstructionsSection>
          <GuidelinesPlainInstructionItem>
            An employee who is absent without approved leave shall not be entitled
            to receive his/her salary corresponding to the period of his/her
            unauthorized leave of absence.
          </GuidelinesPlainInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={1}
            title="Sick Leave (SL) / Emergency Leave (EL)"
          >
            <GuidelinesBulletList>
              <GuidelinesBullet>
                Application for such leave shall be filed immediately upon
                employee&apos;s return.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Application for SL for four days or more shall be charged against
                SSS Benefits and is considered leave without pay.
              </GuidelinesBullet>
              <GuidelinesBullet>
                SSS form should be sent to the employer within five days of
                sickness or injury. A medical certificate from the University
                Physician is required by HRMDO prior to approval of sick leave.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem number={2} title="Emergency Leave (EL)">
            <GuidelinesBulletList>
              <GuidelinesBullet>
                Permanent Faculty Member or employee shall be allowed an emergency
                leave with pay of five(5) days. Leaves shall be considered
                emergency only in the following cases:
              </GuidelinesBullet>
              <GuidelinesBullet nested>
                Accident, illness, death of immediate family member i.e. spouse,
                child, parent, brother, sister, immediate grandparent, grandchild,
                spouse&apos;s parent.
              </GuidelinesBullet>
              <GuidelinesBullet nested>
                Due to natural calamities or force majeure i.e. typhoon, flooded
                area, jeepney strike, burglary or fire in one&apos;s residence, 9th
                day of death, 40th day of death.
              </GuidelinesBullet>
              <GuidelinesBullet nested>
                On year death anniversary of immediate family member.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={3}
            title="Vacation Leave (VL) / Special Purpose Leave (SPL) / Birthday Leave (BL)"
          >
            <GuidelinesBulletList>
              <GuidelinesBullet>
                Application for VL, SPL and BL shall be filed at least{" "}
                <span className="font-semibold text-slate-950">three (3) days before</span>{" "}
                the scheduled date of leave.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Faculty member/employee shall avail of/use only his/her{" "}
                <span className="font-semibold text-slate-950">earned VL credit</span>{" "}
                for a given period i.e. 2.75 days of leave credit for each month of
                active service.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Application for BL is for full-time and part-time employees who hold
                permanent status.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Application of BL can be availed any day within his/her birth month.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={4}
            title="Leave of Absence (LOA) / Educational Leave (EDL)"
          >
            <GuidelinesBulletList>
              <GuidelinesBullet>
                An application for LOA for one semester or more shall be accompanied
                by a letter of request from the employee and shall accomplish a
                University Clearance Form.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Educational Leave application shall be supported with three(3) copies
                of Educational Leave agreement. Forms are available at HRMDO.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>

          <GuidelinesNumberedInstructionItem
            number={5}
            title="Paternity Leave (PL) / Maternity Leave (ML)"
          >
            <GuidelinesBulletList>
              <GuidelinesBullet>
                Application for paternity leave shall be supported with birth
                certificate of legitimate child.
              </GuidelinesBullet>
              <GuidelinesBullet>
                Application for maternity leave shall be filed one(1) month before
                the expected delivery.
              </GuidelinesBullet>
            </GuidelinesBulletList>
          </GuidelinesNumberedInstructionItem>
        </GuidelinesInstructionsSection>

        <GuidelinesFooterNote note="If without justifiable reason whatsoever I failed to report after the expiration of the period of my leave, it is clearly understood that I have resigned voluntarily." />
      </GuidelinesNoticeCard>
    </GuidelinesPageShell>
  )
}
