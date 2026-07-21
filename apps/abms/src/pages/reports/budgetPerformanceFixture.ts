export type BudgetReportDetail = {
  code: string;
  name: string;
};

export type BudgetReportAccount = {
  code: string;
  name: string;
  classification: 'NON-CAPEX' | 'CAPEX';
  details: BudgetReportDetail[];
};

// Temporary presentation-only data. Financial values intentionally remain zero
// until the report calculation contract is supplied by the finance service.
export const budgetPerformanceAccounts: BudgetReportAccount[] = [
  {
    code: '965',
    name: 'ACTIVITIES & REP.',
    classification: 'NON-CAPEX',
    details: [
      { code: 'X11', name: 'ENROLLMENT' },
      { code: 'X20', name: 'MEETINGS' },
      { code: 'X22', name: 'PLANNING/TEAMBUILDING' },
      { code: 'X3', name: 'BENCHMARKING' },
    ],
  },
  { code: '964', name: 'DUES, PER. & SUBS.', classification: 'NON-CAPEX', details: [{ code: '3', name: 'SUBSCRIPTIONS' }] },
  { code: '968', name: 'FACULTY EMP. DEV.', classification: 'NON-CAPEX', details: [{ code: '8', name: 'SEMINARS' }] },
  {
    code: '952',
    name: 'REPAIRS AND MAINT.',
    classification: 'NON-CAPEX',
    details: [
      { code: '19', name: 'REPAIRS & MAINTENANCE (19)' },
      { code: '22', name: 'REPAIRS & MAINTENANCE (22)' },
      { code: '23', name: 'REPAIRS & MAINTENANCE (23)' },
    ],
  },
  { code: '992', name: 'SALARIES, WAGES & BEN.', classification: 'NON-CAPEX', details: [{ code: '5', name: 'SALARIES REGULAR' }] },
  { code: '979', name: 'SCHO. & STUD. DEV.', classification: 'NON-CAPEX', details: [{ code: '3', name: 'BASIC ALLOWANCE' }] },
  {
    code: '954',
    name: 'SUPPLIES OFFICE & LAB',
    classification: 'NON-CAPEX',
    details: [{ code: '3', name: 'LABORATORY' }, { code: '5', name: 'OFFICE' }],
  },
  { code: '956', name: 'TELEPHONE', classification: 'NON-CAPEX', details: [{ code: '1', name: 'TELEPHONE' }] },
  { code: '963', name: 'TRANSPO & TRAVELLING', classification: 'NON-CAPEX', details: [{ code: '1', name: 'TRANSPORTATION' }] },
  { code: '355', name: 'CAPITAL EXPENDITURES', classification: 'CAPEX', details: [{ code: '355', name: 'CAPITAL EXPENDITURES' }] },
];

export const zeroAmount = '0.00';
