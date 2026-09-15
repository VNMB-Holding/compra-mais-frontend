import { describe, it, expect, vi, beforeEach } from 'vitest';
import { solicitacoesService } from '@/features/solicitacoes';
import { purchaseRequestsApi } from '@/lib/api/purchase-requests';
import { apiClient } from '@/lib/api-client';

describe('TC-USR-05 / TC-ADM-02: Solicitações Workflow & Ciclo de Vida', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Criação e Cálculo Consolidado', () => {
    it('deve submeter solicitação com múltiplos itens e validar payload completo', async () => {
      const payload = {
        description: 'Aquisição de Monitores e Periféricos',
        companyCode: 'VB AGRO',
        estimatedBudget: 4500,
        items: [
          { description: 'Monitor UltraWide 34"', quantity: 2, unit: 'UN', estimatedUnitPrice: 2000 },
          { description: 'Teclado Mecânico', quantity: 2, unit: 'UN', estimatedUnitPrice: 250 },
        ],
      };

      const mockResponse = {
        id: 'sol-2026-001',
        code: 'SOL-2026-001',
        status: 'Draft',
        ...payload,
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse as any);

      const result = await solicitacoesService.create(payload as any);

      expect(postSpy).toHaveBeenCalledWith('/api/purchase-requests', payload);
      expect(result.id).toBe('sol-2026-001');
      expect(result.status).toBe('Draft');
      expect(result.items).toHaveLength(2);
    });
  });

  describe('Transições de Status e Decisões de Aprovação', () => {
    it('deve aprovar solicitação com sucesso atualizando status para Approved', async () => {
      const mockUpdated = {
        id: 'sol-100',
        status: 'Approved',
        updatedAt: new Date().toISOString(),
      };

      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockUpdated as any);

      const result = await solicitacoesService.updateStatus('sol-100', 'Approved', 'Orçamento dentro do limite de alçada');

      expect(patchSpy).toHaveBeenCalledWith('/api/purchase-requests/sol-100/status', {
        status: 'Approved',
        comments: 'Orçamento dentro do limite de alçada',
      });
      expect(result.status).toBe('Approved');
    });

    it('deve reprovar solicitação exigindo justificativa/comentário', async () => {
      const mockRejected = {
        id: 'sol-101',
        status: 'Rejected',
        notes: 'Preço acima da cotação de mercado',
      };

      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockRejected as any);

      const result = await solicitacoesService.updateStatus('sol-101', 'Rejected', 'Preço acima da cotação de mercado');

      expect(patchSpy).toHaveBeenCalledWith('/api/purchase-requests/sol-101/status', {
        status: 'Rejected',
        comments: 'Preço acima da cotação de mercado',
      });
      expect(result.status).toBe('Rejected');
    });

    it('deve aprovar via token seguro de link externo de e-mail', async () => {
      const token = 'token-seguro-email-xyz-987';
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true, message: 'Aprovado via token' } as any);

      const result = await purchaseRequestsApi.approveByToken(token, 'Aprovado via mobile/e-mail');

      expect(postSpy).toHaveBeenCalledWith(`/api/purchase-requests/approval-link/${token}/approve`, {
        comments: 'Aprovado via mobile/e-mail',
      });
      expect(result.success).toBe(true);
    });

    it('deve rejeitar via token seguro de link externo de e-mail', async () => {
      const token = 'token-seguro-email-xyz-987';
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true, message: 'Rejeitado via token' } as any);

      const result = await purchaseRequestsApi.rejectByToken(token, 'Fora de planejamento');

      expect(postSpy).toHaveBeenCalledWith(`/api/purchase-requests/approval-link/${token}/reject`, {
        comments: 'Fora de planejamento',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Filtros Avançados e KPIs', () => {
    it('deve construir query string completa ao filtrar por status, busca e tenant', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue([] as any);

      await solicitacoesService.list({
        companyCode: 'VB_AGRO',
        status: 'AwaitingApproval',
        search: 'Computadores',
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/api/purchase-requests?companyCode=VB_AGRO&status=AwaitingApproval&search=Computadores'
      );
    });

    it('deve consultar KPIs filtrando por tenantId', async () => {
      const mockKpis = {
        total: 45,
        awaitingApproval: 8,
        approved: 25,
        inQuote: 10,
        finished: 2,
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockKpis as any);

      const result = await solicitacoesService.getKpis('tenant-vb-agro');

      expect(getSpy).toHaveBeenCalledWith('/api/purchase-requests/kpis?tenantId=tenant-vb-agro');
      expect(result.awaitingApproval).toBe(8);
      expect(result.total).toBe(45);
    });
  });
});
