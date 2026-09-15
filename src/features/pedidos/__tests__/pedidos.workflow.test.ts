import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pedidosService } from '@/features/pedidos/services/pedidos.service';
import { apiClient } from '@/lib/api-client';

describe('TC-USR-05 / TC-ADM-02: Pedidos de Compra (Purchase Orders) Workflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve carregar pedido por ID incluindo fornecedor e itens vinculados', async () => {
    const mockOrder = {
      id: 'po-1001',
      code: 'PED-2026-0010',
      totalValue: 12500,
      paymentTerms: '30 dias DDL',
      estimatedDeliveryDate: '2026-04-15',
      shippingType: 'CIF',
      status: 'AwaitingSignature',
      supplier: {
        id: 'sup-55',
        tradeName: 'Distribuidora Tech Brasil',
        corporateName: 'Distribuidora Tech Brasil LTDA',
        cnpj: '12.345.678/0001-90',
      },
      items: [
        { id: 'it-1', description: 'Switch 24 Portas Gigabit', quantity: 5, unit: 'UN', unitPrice: 2500, totalPrice: 12500 },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockOrder as any);

    const result = await pedidosService.getById('po-1001');

    expect(getSpy).toHaveBeenCalledWith('/api/purchase-orders/po-1001');
    expect(result.code).toBe('PED-2026-0010');
    expect(result.supplier?.tradeName).toBe('Distribuidora Tech Brasil');
    expect(result.items).toHaveLength(1);
    expect(result.totalValue).toBe(12500);
  });

  it('deve atualizar status do pedido para "InTransit" e "Delivered"', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      id: 'po-1001',
      status: 'InTransit',
      updatedAt: new Date().toISOString(),
    } as any);

    const result = await pedidosService.updateStatus('po-1001', 'InTransit', 'Despachado pela transportadora XYZ');

    expect(patchSpy).toHaveBeenCalledWith('/api/purchase-orders/po-1001/status', {
      status: 'InTransit',
      notes: 'Despachado pela transportadora XYZ',
    });
    expect(result.status).toBe('InTransit');
  });

  it('deve atualizar status para "Cancelled" registrando motivo no cancelamento', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      id: 'po-1001',
      status: 'Cancelled',
      notes: 'Fornecedor sem estoque para entrega imediata',
    } as any);

    const result = await pedidosService.updateStatus(
      'po-1001',
      'Cancelled',
      'Fornecedor sem estoque para entrega imediata'
    );

    expect(patchSpy).toHaveBeenCalledWith('/api/purchase-orders/po-1001/status', {
      status: 'Cancelled',
      notes: 'Fornecedor sem estoque para entrega imediata',
    });
    expect(result.status).toBe('Cancelled');
  });

  it('deve chamar endpoint para gerar PDF oficial do pedido de compra', async () => {
    const mockBlob = new Blob(['%PDF-1.4 Mock Content'], { type: 'application/pdf' });
    const getRawSpy = vi.spyOn(apiClient, 'getRaw').mockResolvedValue(mockBlob as any);

    const result = await pedidosService.generatePdf('po-1001');

    expect(getRawSpy).toHaveBeenCalledWith('/api/purchase-orders/po-1001/pdf');
    expect(result).toBe(mockBlob);
  });

  it('deve filtrar pedidos com parâmetros combinados (fornecedor, status e pesquisa)', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue([] as any);

    await pedidosService.list({
      companyCode: 'VB_AGRO',
      status: 'AwaitingSignature',
      supplier: 'sup-55',
      search: 'Switch',
    });

    expect(getSpy).toHaveBeenCalledWith(
      '/api/purchase-orders?companyCode=VB_AGRO&status=AwaitingSignature&supplier=sup-55&search=Switch'
    );
  });
});
