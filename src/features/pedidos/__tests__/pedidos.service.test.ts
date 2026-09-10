import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pedidosService } from '@/features/pedidos';
import { apiClient } from '@/lib/api-client';

describe('Pedidos Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve listar pedidos de compra com parâmetros', async () => {
    const mockOrders = [
      { id: 'po-1', code: 'PO-001', totalValue: 12000, status: 'Sent' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockOrders as any);

    const result = await pedidosService.list({ status: 'Sent', search: 'PO-001' });

    expect(getSpy).toHaveBeenCalledWith('/api/purchase-orders?status=Sent&search=PO-001');
    expect(result).toEqual(mockOrders);
  });

  it('deve buscar pedido de compra por ID', async () => {
    const mockOrder = { id: 'po-123', code: 'PO-123', totalValue: 8000 };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockOrder as any);

    const result = await pedidosService.getById('po-123');

    expect(getSpy).toHaveBeenCalledWith('/api/purchase-orders/po-123');
    expect(result).toEqual(mockOrder);
  });
});
