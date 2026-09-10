import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suppliersApi } from '@/features/fornecedores';
import { apiClient } from '@/lib/api-client';

describe('Fornecedores Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve listar fornecedores com parâmetros de busca', async () => {
    const mockSuppliers = [
      { id: 'sup-1', corporateName: 'Fornecedor Alpha', cnpj: '12.345.678/0001-90', status: 'Active' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSuppliers as any);

    const result = await suppliersApi.list({ status: 'Active', search: 'Alpha' });

    expect(getSpy).toHaveBeenCalledWith('/api/suppliers?status=Active&search=Alpha');
    expect(result).toEqual(mockSuppliers);
  });

  it('deve buscar fornecedor por ID', async () => {
    const mockSupplier = { id: 'sup-1', corporateName: 'Fornecedor Alpha', cnpj: '12.345.678/0001-90' };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSupplier as any);

    const result = await suppliersApi.getById('sup-1');

    expect(getSpy).toHaveBeenCalledWith('/api/suppliers/sup-1');
    expect(result).toEqual(mockSupplier);
  });

  it('deve buscar KPIs dos fornecedores', async () => {
    const mockKpis = { total: 50, active: 45, withPix: 30, withBank: 40 };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockKpis as any);

    const result = await suppliersApi.getKpis();

    expect(getSpy).toHaveBeenCalledWith('/api/suppliers/kpis');
    expect(result).toEqual(mockKpis);
  });
});
