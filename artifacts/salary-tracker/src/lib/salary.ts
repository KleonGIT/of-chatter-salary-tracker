export const TIER_COLORS = [
  "text-amber-600 dark:text-amber-400",
  "text-blue-600 dark:text-blue-400",
  "text-emerald-600 dark:text-emerald-400",
];

export interface CommissionTierConfig {
  min: number;
  max: number | null;
  rate: number;
}

export interface SalarySettings {
  hourlyRate: number;
  hoursPerDay: number;
  commissionTiers: CommissionTierConfig[];
  phpUsdRate: number;
}

export const DEFAULT_SETTINGS: SalarySettings = {
  hourlyRate: 2,
  hoursPerDay: 8,
  commissionTiers: [
    { min: 0, max: 499.99, rate: 0.03 },
    { min: 500, max: 999.99, rate: 0.04 },
    { min: 1000, max: null, rate: 0.05 },
  ],
  phpUsdRate: 56,
};

export type CommissionTier = {
  label: string;
  min: number;
  max: number | null;
  rate: number;
  color: string;
};

export function buildTiers(configs: CommissionTierConfig[]): CommissionTier[] {
  return configs.map((t, i) => ({
    ...t,
    label: t.max === null ? `${t.min}+` : `${t.min} – ${t.max}`,
    color: TIER_COLORS[i % TIER_COLORS.length],
  }));
}

export function getBasePay(settings: SalarySettings = DEFAULT_SETTINGS): number {
  return settings.hourlyRate * settings.hoursPerDay;
}

export function getCommissionRate(netSales: number, settings: SalarySettings = DEFAULT_SETTINGS): number {
  const sorted = [...settings.commissionTiers].sort((a, b) => b.min - a.min);
  for (const tier of sorted) {
    if (netSales >= tier.min) return tier.rate;
  }
  return settings.commissionTiers[0]?.rate ?? 0.03;
}

export function getCommissionTier(netSales: number, settings: SalarySettings = DEFAULT_SETTINGS): CommissionTier {
  const tiers = buildTiers(settings.commissionTiers);
  const sorted = [...tiers].sort((a, b) => b.min - a.min);
  for (const tier of sorted) {
    if (netSales >= tier.min) return tier;
  }
  return tiers[0];
}

export function calculateDailyEarnings(netSales: number, settings: SalarySettings = DEFAULT_SETTINGS) {
  const basePay = getBasePay(settings);
  const rate = getCommissionRate(netSales, settings);
  const commission = netSales * rate;
  const total = basePay + commission;
  return { basePay, commissionRate: rate, commission, total };
}

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type DayEntry = {
  day: DayOfWeek;
  netSales: number;
  worked: boolean;
};

export type WeekRecord = {
  id: string;
  label: string;
  chatterName: string;
  weekStart: string;
  days: DayEntry[];
  createdAt: string;
};

export function createEmptyWeek(): DayEntry[] {
  return DAYS_OF_WEEK.map((day) => ({ day, netSales: 0, worked: true }));
}

export function calculateWeekSummary(days: DayEntry[], settings: SalarySettings = DEFAULT_SETTINGS) {
  const workedDays = days.filter((d) => d.worked);
  const basePay = getBasePay(settings);
  const totalNetSales = workedDays.reduce((sum, d) => sum + d.netSales, 0);
  const totalBasePay = workedDays.length * basePay;
  const totalCommission = workedDays.reduce((sum, d) => {
    return sum + calculateDailyEarnings(d.netSales, settings).commission;
  }, 0);
  const totalEarnings = totalBasePay + totalCommission;
  const avgNetSales = workedDays.length > 0 ? totalNetSales / workedDays.length : 0;
  return { workedDays: workedDays.length, totalNetSales, totalBasePay, totalCommission, totalEarnings, avgNetSales };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toPHP(amountUSD: number, phpUsdRate: number): number {
  return amountUSD * phpUsdRate;
}

export function formatCurrency(amount: number): string {
  return formatUSD(amount);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function generateId(): string {
  return `week-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const BASE_PAY_DAILY = DEFAULT_SETTINGS.hourlyRate * DEFAULT_SETTINGS.hoursPerDay;
export const COMMISSION_TIERS = buildTiers(DEFAULT_SETTINGS.commissionTiers);
