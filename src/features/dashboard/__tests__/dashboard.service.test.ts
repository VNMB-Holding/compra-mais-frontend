import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '@/features/dashboard';
import { apiClient } from '@/lib/api-client';

describe('Dashboard Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve buscar KPIs do dashboard', async () => {
    const mockKpis = {
      rfqsInProgress: 12,
      approvalsPending: 5,
      economy: 45000,
      ordersEmitted: 28,
      suppliersActive: 140,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockKpis as any);

    const result = await dashboardService.getKpis('01');

    expect(getSpy).toHaveBeenCalledWith('/api/dashboard/kpis?companyCode=01');
    expect(result).toEqual(mockKpis);
  });

  it('deve buscar detalhamento por categoria', async () => {
    const mockCategories = [
      { name: 'Tecnologia', value: 80000, count: 10 },
      { name: 'Serviços', value: 45000, count: 6 },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockCategories as any);

    const result = await dashboardService.getCategories();

    expect(getSpy).toHaveBeenCalledWith('/api/dashboard/categories');
    expect(result).toEqual(mockCategories);
  });
});
