export const BEP_STORAGE_KEY_PREFIX = 'smartstock_bep_config_';
export const BEP_UPDATED_EVENT = 'smartstock_bep_updated';

export interface CustomExpense {
  id: string;
  name: string;
  amount: number;
}

export interface BreakEvenConfig {
  rent: number;
  salaries: number;
  utilities: number;
  software: number;
  maintenance: number;
  operatingDays: number;
  customFixedList: CustomExpense[];
  coffeeBeans: number;
  milkSyrup: number;
  packaging: number;
  ice: number;
  tissueBag: number;
  customVariableList: CustomExpense[];
  sellingPrice: number;
  targetProfit: number;
}

export const DEFAULT_BEP_CONFIG: BreakEvenConfig = {
  rent: 15000,
  salaries: 18000,
  utilities: 4500,
  software: 890,
  maintenance: 1200,
  operatingDays: 30,
  customFixedList: [],
  coffeeBeans: 8.5,
  milkSyrup: 6.5,
  packaging: 3.5,
  ice: 1.0,
  tissueBag: 0.8,
  customVariableList: [],
  sellingPrice: 60,
  targetProfit: 30000,
};

export function calculateBreakEven(config: BreakEvenConfig) {
  const customFixed = (config.customFixedList || []).reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0
  );
  const totalFixedMonthly =
    (Number(config.rent) || 0) +
    (Number(config.salaries) || 0) +
    (Number(config.utilities) || 0) +
    (Number(config.software) || 0) +
    (Number(config.maintenance) || 0) +
    customFixed;

  const operatingDays = Math.max(1, Number(config.operatingDays) || 30);
  const totalFixedDaily = totalFixedMonthly / operatingDays;

  const customVariable = (config.customVariableList || []).reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0
  );
  const totalVariablePerCup =
    (Number(config.coffeeBeans) || 0) +
    (Number(config.milkSyrup) || 0) +
    (Number(config.packaging) || 0) +
    (Number(config.ice) || 0) +
    (Number(config.tissueBag) || 0) +
    customVariable;

  const sellingPrice = Math.max(1, Number(config.sellingPrice) || 60);
  const contributionMarginPerCup = Math.max(0, sellingPrice - totalVariablePerCup);
  const contributionMarginRatio =
    sellingPrice > 0 ? (contributionMarginPerCup / sellingPrice) * 100 : 0;

  const breakEvenCupsMonthly =
    contributionMarginPerCup > 0 ? Math.ceil(totalFixedMonthly / contributionMarginPerCup) : 0;
  const breakEvenCupsDaily =
    operatingDays > 0 && breakEvenCupsMonthly > 0
      ? Math.ceil(breakEvenCupsMonthly / operatingDays)
      : 0;

  const breakEvenRevenueMonthly = breakEvenCupsMonthly * sellingPrice;
  const breakEvenRevenueDaily = breakEvenCupsDaily * sellingPrice;

  const targetProfit = Number(config.targetProfit) || 0;
  const targetCupsMonthly =
    contributionMarginPerCup > 0
      ? Math.ceil((totalFixedMonthly + targetProfit) / contributionMarginPerCup)
      : 0;
  const targetCupsDaily =
    operatingDays > 0 && targetCupsMonthly > 0
      ? Math.ceil(targetCupsMonthly / operatingDays)
      : 0;
  const targetRevenueMonthly = targetCupsMonthly * sellingPrice;
  const targetRevenueDaily = targetCupsDaily * sellingPrice;

  return {
    totalFixedMonthly,
    totalFixedDaily,
    totalVariablePerCup,
    contributionMarginPerCup,
    contributionMarginRatio,
    breakEvenCupsMonthly,
    breakEvenCupsDaily,
    breakEvenRevenueMonthly,
    breakEvenRevenueDaily,
    targetProfit,
    targetCupsMonthly,
    targetCupsDaily,
    targetRevenueMonthly,
    targetRevenueDaily,
  };
}

export function getStoredBreakEvenConfig(storeId?: string | number | null): BreakEvenConfig {
  if (typeof window === 'undefined') return DEFAULT_BEP_CONFIG;
  const safeId = storeId ? String(storeId) : 'default';
  try {
    const raw = localStorage.getItem(`${BEP_STORAGE_KEY_PREFIX}${safeId}`);
    if (!raw) return DEFAULT_BEP_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_BEP_CONFIG, ...parsed };
  } catch {
    return DEFAULT_BEP_CONFIG;
  }
}

export function saveStoredBreakEvenConfig(
  config: BreakEvenConfig,
  storeId?: string | number | null
) {
  if (typeof window === 'undefined') return;
  const safeId = storeId ? String(storeId) : 'default';
  try {
    localStorage.setItem(`${BEP_STORAGE_KEY_PREFIX}${safeId}`, JSON.stringify(config));
    window.dispatchEvent(new Event(BEP_UPDATED_EVENT));
  } catch (e) {
    console.error('Failed to save BEP configuration', e);
  }
}

export const BEP_TAB_TOGGLE_EVENT = 'smartstock_bep_tab_toggle';
export const BEP_TAB_STORAGE_KEY_PREFIX = 'smartstock_bep_tab_enabled_';

export function isBreakEvenTabEnabled(
  storeId?: string | number | null,
  menuConfig?: any
): boolean {
  const safeId = storeId ? String(storeId) : 'default';
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`${BEP_TAB_STORAGE_KEY_PREFIX}${safeId}`);
    if (local !== null) {
      return local === 'true';
    }
  }
  if (menuConfig && menuConfig.enable_breakeven_tab !== undefined) {
    return menuConfig.enable_breakeven_tab !== false;
  }
  return true;
}

export function setBreakEvenTabEnabled(
  enabled: boolean,
  storeId?: string | number | null
) {
  const safeId = storeId ? String(storeId) : 'default';
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${BEP_TAB_STORAGE_KEY_PREFIX}${safeId}`, String(enabled));
    window.dispatchEvent(new CustomEvent(BEP_TAB_TOGGLE_EVENT, { detail: { enabled, storeId: safeId } }));
  }
}

