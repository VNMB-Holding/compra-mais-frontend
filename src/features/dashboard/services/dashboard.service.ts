import {
  dashboardApi,
  type DashboardKpis,
  type CategoryBreakdown,
  type MonthlyEconomy,
  type RecentRfqItem,
  type SpendAnalyticsResponse,
  type EconomyAnalyticsResponse,
  type FilterOptionsResponse,
} from "@/lib/api/dashboard";

export const dashboardService = {
  getKpis: (companyCode?: string) => dashboardApi.getKpis(companyCode),
  getCategories: (companyCode?: string) => dashboardApi.getCategories(companyCode),
  getFilterOptions: (companyCode?: string) => dashboardApi.getFilterOptions(companyCode),
  getMonthlyEconomy: (companyCode?: string, period?: string, startDate?: string, endDate?: string) =>
    dashboardApi.getMonthlyEconomy(companyCode, period, startDate, endDate),
  getRecentRfqs: (companyCode?: string) => dashboardApi.getRecentRfqs(companyCode),
  getSpendAnalytics: (companyCode?: string, category?: string, supplier?: string, period?: string) =>
    dashboardApi.getSpendAnalytics(companyCode, category, supplier, period),
  getEconomyAnalytics: (companyCode?: string, category?: string, supplier?: string, period?: string) =>
    dashboardApi.getEconomyAnalytics(companyCode, category, supplier, period),
};

export type {
  DashboardKpis,
  CategoryBreakdown,
  MonthlyEconomy,
  RecentRfqItem,
  SpendAnalyticsResponse,
  EconomyAnalyticsResponse,
  FilterOptionsResponse,
};
