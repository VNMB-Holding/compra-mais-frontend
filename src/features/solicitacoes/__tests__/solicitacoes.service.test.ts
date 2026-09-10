import { describe, it, expect, vi, beforeEach } from 'vitest';
import { solicitacoesService } from '@/features/solicitacoes';
import { apiClient } from '@/lib/api-client';

describe('Solicitações Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve listar solicitações com parâmetros corretos', async () => {
    const mockData = [
      { id: 'req-1', code: 'SOL-001', description: 'Compra de EPIs', estimatedBudget: 1500, status: 'Draft' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockData as any);

    const result = await solicitacoesService.list({ status: 'Draft', search: 'EPI' });

    expect(getSpy).toHaveBeenCalledWith('/api/purchase-requests?status=Draft&search=EPI');
    expect(result).toEqual(mockData);
  });

  it('deve buscar solicitação por ID', async () => {
    const mockDetail = { id: 'req-123', code: 'SOL-123', description: 'Monitor Dell', status: 'Approved' };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockDetail as any);

    const result = await solicitacoesService.getById('req-123');

    expect(getSpy).toHaveBeenCalledWith('/api/purchase-requests/req-123');
    expect(result).toEqual(mockDetail);
  });

  it('deve buscar KPIs da solicitação', async () => {
    const mockKpis = { total: 10, awaitingApproval: 2, approved: 5, inQuote: 2, finished: 1 };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockKpis as any);

    const result = await solicitacoesService.getKpis();

    expect(getSpy).toHaveBeenCalledWith('/api/purchase-requests/kpis');
    expect(result).toEqual(mockKpis);
  });

  it('deve criar solicitação via POST', async () => {
    const newRequest = { description: 'Nova solicitação de materiais', estimatedBudget: 5000 };
    const createdResponse = { id: 'req-999', ...newRequest };
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(createdResponse as any);

    const result = await solicitacoesService.create(newRequest as any);

    expect(postSpy).toHaveBeenCalledWith('/api/purchase-requests', newRequest);
    expect(result).toEqual(createdResponse);
  });
});
