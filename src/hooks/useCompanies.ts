import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, CompanyBranchConfig } from "@/lib/api/admin";
import { User } from "@/types/auth";
import { getCompanyFilterOptions } from "@/lib/utils/tenant";

export const COMPANIES_QUERY_KEY = ["admin", "companies"] as const;

export function useCompanies(enabled = true) {
  return useQuery<CompanyBranchConfig[]>({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: () => adminApi.getCompanies(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCompanyFilterOptions(user?: User | null) {
  const { data: companies = [] } = useCompanies();

  return useMemo(
    () => getCompanyFilterOptions(user, companies),
    [user, companies],
  );
}
