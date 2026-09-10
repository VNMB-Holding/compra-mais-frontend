import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rfqsApi } from '@/features/rfqs';
import { apiClient } from '@/lib/api-client';

describe('RFQs Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve listar RFQs montando query string com filtros', async () => {
    const mockRfqs = [
      { id: 'rfq-1', code: 'RFQ-001', title: 'Cotação de Fertilizantes', status: 'Open' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockRfqs as any);

    const result = await rfqsApi.list({ status: 'Open', category: 'Agro', search: 'Fertilizante' });

    expect(getSpy).toHaveBeenCalledWith('/api/rfqs?status=Open&category=Agro&search=Fertilizante');
    expect(result).toEqual(mockRfqs);
  });

  it('deve buscar RFQ detalhada por ID', async () => {
    const mockRfq = { id: 'rfq-99', code: 'RFQ-99', title: 'Cotação Combustível', status: 'Closed' };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockRfq as any);

    const result = await rfqsApi.getById('rfq-99');

    expect(getSpy).toHaveBeenCalledWith('/api/rfqs/rfq-99');
    expect(result).toEqual(mockRfq);
  });
});
