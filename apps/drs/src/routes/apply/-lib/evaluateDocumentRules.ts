import type { DocumentRuleRow } from './types.ts';

export type StudentEligibilityContext = {
  isGraduate: boolean;
  isUndergraduate: boolean;
  isEnrolled: boolean;
};

/** Used when catalog meta.eligibility is missing (lookup failed). */
export const FAIL_CLOSED_STUDENT_CONTEXT: StudentEligibilityContext = {
  isGraduate: false,
  isUndergraduate: false,
  isEnrolled: false,
};

export function eligibilityFromApiMeta(
  eligibility:
    | {
        is_enrolled?: boolean;
        is_undergraduate?: boolean;
        is_graduate?: boolean;
      }
    | null
    | undefined,
): StudentEligibilityContext {
  if (!eligibility) {
    return { ...FAIL_CLOSED_STUDENT_CONTEXT };
  }

  return {
    isEnrolled: Boolean(eligibility.is_enrolled),
    isUndergraduate: Boolean(eligibility.is_undergraduate),
    isGraduate: Boolean(eligibility.is_graduate),
  };
}

function ruleNamesFromRows(
  rules: DocumentRuleRow[] | null | undefined,
): string[] {
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

function matchesRule(
  ruleName: string,
  ctx: StudentEligibilityContext,
): boolean {
  switch (ruleName) {
    case 'undergraduate':
      return ctx.isUndergraduate;
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
 * When ctx is fail-closed (all false), rule-gated items are hidden.
 */
export function itemVisibleForRules(
  rules: DocumentRuleRow[] | null | undefined,
  ctx: StudentEligibilityContext,
): boolean {
  const names = ruleNamesFromRows(rules);

  if (names.length === 0) {
    return true;
  }

  return names.every((name) => matchesRule(name, ctx));
}
