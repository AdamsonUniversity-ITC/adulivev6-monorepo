import type { DocumentRuleRow } from './types.ts';

/** Replace with OLLMS / `App\Models\Student` once graduate + enrollment are wired. */
export type StudentEligibilityStub = {
  isGraduate: boolean;
  isEnrolled: boolean;
};

export const PLACEHOLDER_STUDENT_CONTEXT: StudentEligibilityStub = {
  isGraduate: false,
  isEnrolled: true,
};

function ruleNamesFromRows(rules: DocumentRuleRow[] | null | undefined): string[] {
  if (!Array.isArray(rules) || rules.length === 0) {
    return [];
  }

  const names: string[] = [];

  for (const row of rules) {
    const name = row.rule?.rule_name;
    if (typeof name === 'string' && name.length > 0) {
      names.push(name);
    }
  }

  return names;
}

function matchesRule(ruleName: string, ctx: StudentEligibilityStub): boolean {
  switch (ruleName) {
    case 'undergraduate':
      return !ctx.isGraduate;
    case 'graduate':
      return ctx.isGraduate;
    case 'enrolled':
      return ctx.isEnrolled;
    case 'unenrolled':
      return !ctx.isEnrolled;
    default:
      return true;
  }
}

/**
 * No rules → visible. Otherwise every rule must pass (AND).
 */
export function itemVisibleForRules(
  rules: DocumentRuleRow[] | null | undefined,
  ctx: StudentEligibilityStub,
): boolean {
  const names = ruleNamesFromRows(rules);

  if (names.length === 0) {
    return true;
  }

  return names.every((name) => matchesRule(name, ctx));
}
