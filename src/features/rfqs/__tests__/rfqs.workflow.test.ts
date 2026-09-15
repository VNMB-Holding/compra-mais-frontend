import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rfqsService } from '@/features/rfqs/services/rfqs.service';
import { apiClient } from '@/lib/api-client';

describe('TC-USR-05 / TC-ADM-02: Cotações e RFQs (Request for Quotation) Workflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criar uma nova cotação vinculando solicitação e lista de fornecedores', async () => {
    const newRfqPayload = {
      requestId: 'req-200',
      title: 'Cotação de Insumos Agrícolas - Safra 2026',
      closesAt: '2026-04-30T18:00:00Z',
      supplierIds: ['sup-1', 'sup-2', 'sup-3'],
    };

    const mockResponse = {
      id: 'rfq-500',
      code: 'RFQ-2026-0050',
      status: 'Open',
      ...newRfqPayload,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse as any);

    const result = await rfqsService.create(newRfqPayload);

    expect(postSpy).toHaveBeenCalledWith('/api/rfqs', newRfqPayload);
    expect(result.id).toBe('rfq-500');
    expect(result.status).toBe('Open');
  });

  it('deve registrar proposta comercial enviada para a cotação', async () => {
    const proposalData = {
      supplierId: 'sup-1',
      unitPrice: 3450.50,
      freightCost: 150,
      paymentTerms: '28 DDL',
      deliveryTime: 7,
      notes: 'Garantia de 12 meses direto do fabricante',
    };

    const mockProposalResponse = {
      id: 'prop-10',
      rfqId: 'rfq-500',
      ...proposalData,
      status: 'Submitted',
      isWinner: false,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockProposalResponse as any);

    const result = await rfqsService.createProposal('rfq-500', proposalData);

    expect(postSpy).toHaveBeenCalledWith('/api/rfqs/rfq-500/proposals', proposalData);
    expect(result.id).toBe('prop-10');
    expect(result.status).toBe('Submitted');
  });

  it('deve selecionar a proposta vencedora e converter em Pedido de Compra (PO)', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({ success: true } as any);
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ orderId: 'po-777', code: 'PED-2026-0777' } as any);

    // 1. Seleciona proposta vencedora
    const winnerResult = await rfqsService.selectWinner('rfq-500', 'prop-10');
    expect(patchSpy).toHaveBeenCalledWith('/api/rfqs/rfq-500/winner', { proposalId: 'prop-10' });
    expect(winnerResult).toEqual({ success: true });

    // 2. Converte RFQ finalizada em Pedido de Compra
    const poResult = await rfqsService.createPo('rfq-500');
    expect(postSpy).toHaveBeenCalledWith('/api/rfqs/rfq-500/create-po', {});
    expect(poResult).toEqual({ orderId: 'po-777', code: 'PED-2026-0777' });
  });

  it('deve convidar fornecedor não homologado por e-mail', async () => {
    const inviteData = {
      cnpj: '11.222.333/0001-44',
      corporateName: 'Novo Fornecedor Especializado LTDA',
      contactEmail: 'contato@novofornecedor.com.br',
      contactName: 'Juliana Gestora',
      contactPhone: '11999998888',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      success: true,
      supplier: { id: 'sup-temp-9', corporateName: inviteData.corporateName },
    } as any);

    const result = await rfqsService.inviteUnregisteredSupplier('rfq-500', inviteData);

    expect(postSpy).toHaveBeenCalledWith('/api/rfqs/rfq-500/invite-unregistered', inviteData);
    expect(result.success).toBe(true);
    expect(result.supplier.id).toBe('sup-temp-9');
  });
});
