/**
 * Share of the project budget that one activity carries.
 *
 * This is the only ratio the client works out, and the handoff sanctions it explicitly
 * (§3.6): it is presentation arithmetic over two figures the report already brought
 * (`indicators.budgetAtCompletion` of the activity and of the project), not an EVM
 * indicator. A project with no budget has no shares to speak of, so the answer is `null`
 * and every reader shows it as the not-computable mark instead of `0 %`.
 */

const NO_BUDGET = 0;
const PERCENT_SCALE = 100;

/** Percentage (0-100 scale, ready for `formatPercent`) or `null` when there is no budget. */
export function budgetSharePercent(activityBudget: number, projectBudget: number): number | null {
  if (projectBudget <= NO_BUDGET) {
    return null;
  }
  return (activityBudget / projectBudget) * PERCENT_SCALE;
}
