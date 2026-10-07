import { describe, it, expect, vi, beforeEach } from "vitest";
import { solicitacoesService } from "@/features/solicitacoes";
import { rfqsService } from "@/features/rfqs/services/rfqs.service";
import { pedidosService } from "@/features/pedidos/services/pedidos.service";
import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { rfqsApi } from "@/lib/api/rfqs";
import { getApprovalChainForRequest, getApprovalChainForOrder } from "@/features/aprovacoes";
import { apiClient, ApiError } from "@/lib/api-client";

describe("Suíte Completa de Fluxos End-to-End da Aplicação (Caminho Feliz, Alternativo e Erro/Edge Cases)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Fluxo Completo de Suprimentos - Caminho Feliz (Happy Path: Demanda -> Aprovação -> RFQ -> Vencedor -> Pedido)", () => {
    it("deve executar o ciclo completo de aquisição com sucesso e consistência de dados", async () => {
      const demandPayload = {
        description: "Aquisição de Tratores e Implementos Agrícolas",
        companyCode: "2313",
        estimatedBudget: 350000,
        items: [
          {
            description: "Trator Cabinado 180CV",
            quantity: 1,
            unit: "UN",
            estimatedUnitPrice: 300000,
          },
          {
            description: "Plantadeira 12 Linhas",
            quantity: 1,
            unit: "UN",
            estimatedUnitPrice: 50000,
          },
        ],
      };

      const mockDemandCreated = {
        id: "sol-happy-1",
        code: "SOL-2026-0001",
        status: "AwaitingApproval",
        ...demandPayload,
      };

      const postSpy = vi.spyOn(apiClient, "post");
      const patchSpy = vi.spyOn(apiClient, "patch");
      const getSpy = vi.spyOn(apiClient, "get");

      postSpy.mockResolvedValueOnce(mockDemandCreated as any);
      const createdSol = await solicitacoesService.create(demandPayload as any);
      expect(createdSol.id).toBe("sol-happy-1");
      expect(createdSol.status).toBe("AwaitingApproval");

      const mockApprovedDemand = {
        ...mockDemandCreated,
        status: "Approved",
      };
      patchSpy.mockResolvedValueOnce(mockApprovedDemand as any);
      const approvedSol = await solicitacoesService.updateStatus(
        "sol-happy-1",
        "Approved",
        "Aprovado pelo Diretor de Operações",
      );
      expect(approvedSol.status).toBe("Approved");

      const rfqPayload = {
        requestId: "sol-happy-1",
        title: "Cotação de Maquinário Agrícola",
        closesAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        supplierIds: ["sup-valtra", "sup-john-deere"],
      };

      const mockRfqCreated = {
        id: "rfq-happy-1",
        code: "RFQ-2026-0001",
        status: "Open",
        ...rfqPayload,
      };

      postSpy.mockResolvedValueOnce(mockRfqCreated as any);
      const createdRfq = await rfqsService.create(rfqPayload);
      expect(createdRfq.id).toBe("rfq-happy-1");
      expect(createdRfq.status).toBe("Open");

      const proposalPayload = {
        supplierId: "sup-valtra",
        unitPrice: 340000,
        freightCost: 5000,
        paymentTerms: "45 dias DDL",
        deliveryTime: 10,
        notes: "Garantia estendida de 2 anos inclusa",
      };

      const mockProposalCreated = {
        id: "prop-valtra-1",
        rfqId: "rfq-happy-1",
        status: "Submitted",
        isWinner: false,
        ...proposalPayload,
      };

      postSpy.mockResolvedValueOnce(mockProposalCreated as any);
      const createdProp = await rfqsService.createProposal("rfq-happy-1", proposalPayload);
      expect(createdProp.id).toBe("prop-valtra-1");

      patchSpy.mockResolvedValueOnce({ isWinner: true, status: "Winner" } as any);
      const winnerResult: any = await rfqsService.selectWinner("rfq-happy-1", "prop-valtra-1");
      expect(winnerResult.status).toBe("Winner");

      const mockPoCreated = {
        id: "po-happy-1",
        code: "PO-3001",
        status: "Sent",
        companyCode: "2313",
        totalValue: 345000,
      };

      postSpy.mockResolvedValueOnce(mockPoCreated as any);
      const createdPo: any = await rfqsService.createPo("rfq-happy-1");
      expect(createdPo.id).toBe("po-happy-1");
      expect(createdPo.code).toBe("PO-3001");

      patchSpy.mockResolvedValueOnce({ ...mockPoCreated, status: "Delivered" } as any);
      const deliveredPo = await pedidosService.updateStatus(
        "po-happy-1",
        "Delivered",
        "Recebido na fazenda matriz",
      );
      expect(deliveredPo.status).toBe("Delivered");
    });
  });

  describe("2. Fluxos Alternativos (Alternative Workflows)", () => {
    it("deve aprovar solicitação remotamente via link de e-mail seguro (token-based)", async () => {
      const token = "token-auth-email-hash-uuid-555";
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        success: true,
        message: "Solicitação aprovada com sucesso!",
      } as any);

      const result = await purchaseRequestsApi.approveByToken(
        token,
        "Aprovado via smartphone em viagem",
      );
      expect(postSpy).toHaveBeenCalledWith(
        `/api/purchase-requests/approval-link/${token}/approve`,
        {
          comments: "Aprovado via smartphone em viagem",
        },
      );
      expect(result.success).toBe(true);
    });

    it("deve permitir submissão pública externa de proposta para fornecedor novo anexando documento bancário", async () => {
      const publicProposalData = {
        supplierCnpj: "44.555.666/0001-99",
        supplierName: "Agro Implementos do Cerrado Ltda",
        contactName: "Marcos Vendedor",
        contactEmail: "marcos@agrocerrado.com.br",
        contactPhone: "66999887766",
        items: [{ requestItemId: "req-item-1", unitPrice: 28000 }],
        freightCost: 1200,
        freightType: "CIF" as const,
        paymentTerms: "30 dias",
        deliveryTime: 5,
        bankCode: "001",
        bankNumber: "12345-6",
        pixKey: "44555666000199",
        bankDocumentImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        success: true,
        protocol: "prop-public-999",
        message: "Proposta recebida com sucesso!",
      } as any);

      const result = await rfqsApi.submitPublicProposal("RFQ-2026-0001", publicProposalData);
      expect(postSpy).toHaveBeenCalledWith(
        "/api/rfqs/public/RFQ-2026-0001/proposal",
        publicProposalData,
      );
      expect(result.success).toBe(true);
      expect(result.protocol).toBe("prop-public-999");
    });

    it("deve convidar fornecedor não cadastrado durante a cotação sem gerar IDs temporários fictícios", async () => {
      const invitePayload = {
        cnpj: "77.888.999/0001-11",
        corporateName: "Fornecedor Terceirizado S.A.",
        contactEmail: "comercial@terceirizado.com",
        contactName: "Beatriz Representante",
        contactPhone: "11987654321",
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        success: true,
        supplier: {
          id: "sup-real-db-uuid-888",
          cnpj: "77888999000111",
          corporateName: "Fornecedor Terceirizado S.A.",
          status: "Pending",
        },
      } as any);

      const res = await rfqsService.inviteUnregisteredSupplier("rfq-1", invitePayload);
      expect(res.success).toBe(true);
      expect(res.supplier.id).toBe("sup-real-db-uuid-888");
      expect(res.supplier.id).not.toContain("Date.now()");
    });

    it("deve calcular cadeia de aprovação com múltiplos níveis dinâmicos da empresa VB AGRO", () => {
      const rules = [
        {
          id: "r1",
          companyCode: "2313",
          flowType: "solicitacao" as const,
          level: 1,
          minAmount: 0,
          maxAmount: 10000,
          approverType: "user" as const,
          approverIdentifier: "henrique",
          approverName: "Henrique",
          active: true,
          order: 1,
        },
        {
          id: "r2",
          companyCode: "2313",
          flowType: "solicitacao" as const,
          level: 2,
          minAmount: 10000.01,
          maxAmount: 100000,
          approverType: "user" as const,
          approverIdentifier: "celso",
          approverName: "Celso",
          active: true,
          order: 2,
        },
        {
          id: "r3",
          companyCode: "2313",
          flowType: "solicitacao" as const,
          level: 3,
          minAmount: 100000.01,
          maxAmount: null,
          approverType: "user" as const,
          approverIdentifier: "vanessa",
          approverName: "Vanessa",
          active: true,
          order: 3,
        },
      ];

      const chainN1 = getApprovalChainForRequest("VB AGRO", 5000, rules);
      expect(chainN1).toHaveLength(1);
      expect(chainN1[0].roleOrName).toBe("Henrique");

      const chainN2 = getApprovalChainForRequest("VB AGRO", 50000, rules);
      expect(chainN2).toHaveLength(2);
      expect(chainN2.map((l) => l.roleOrName)).toEqual(["Henrique", "Celso"]);

      const chainN3 = getApprovalChainForRequest("VB AGRO", 250000, rules);
      expect(chainN3).toHaveLength(3);
      expect(chainN3.map((l) => l.roleOrName)).toEqual(["Henrique", "Celso", "Vanessa"]);
    });
  });

  describe("3. Cenários de Erro e Tratamento de Exceções (Error Handling)", () => {
    it("deve propagar erro HTTP 400 se o backend rejeitar criação de solicitação sem empresa", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError(
          "O código da empresa/unidade de faturamento (companyCode) é obrigatório.",
          400,
        ),
      );

      await expect(
        solicitacoesService.create({ description: "Sem Empresa", items: [] } as any),
      ).rejects.toThrow("O código da empresa/unidade de faturamento (companyCode) é obrigatório.");
    });

    it("deve propagar erro HTTP 404 se a cotação consultada não existir", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Cotação RFQ-9999 não encontrada.", 404),
      );

      await expect(rfqsApi.getPublicRfq("RFQ-9999")).rejects.toThrow(
        "Cotação RFQ-9999 não encontrada.",
      );
    });

    it("deve rejeitar submissão em RFQ já finalizada ou cancelada", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("Esta cotação já foi finalizada ou cancelada.", 400),
      );

      await expect(
        rfqsApi.submitPublicProposal("RFQ-ENCERRADA", {
          supplierCnpj: "11222333000199",
          items: [{ requestItemId: "item-1", unitPrice: 10 }],
        } as any),
      ).rejects.toThrow("Esta cotação já foi finalizada ou cancelada.");
    });

    it("deve tratar falha na emissão de PO se a RFQ não tiver proposta vencedora selecionada", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("Nenhuma proposta vencedora foi selecionada para esta RFQ.", 400),
      );

      await expect(rfqsService.createPo("rfq-sem-vencedor")).rejects.toThrow(
        "Nenhuma proposta vencedora foi selecionada para esta RFQ.",
      );
    });
  });

  describe("4. Casos de Borda (Edge Cases & Boundaries)", () => {
    it("deve retornar array vazio se não houver regras cadastradas (sem nomes hardcoded)", () => {
      const chain = getApprovalChainForRequest("EMPRESA_SEM_REGRAS", 10000, []);
      expect(chain).toEqual([]);
    });

    it("deve validar limites exatos de faixas monetárias (exato no limite vs centavo acima)", () => {
      const rules = [
        {
          id: "1",
          companyCode: "2313",
          flowType: "pedido" as const,
          level: 1,
          minAmount: 0,
          maxAmount: 10000,
          approverType: "user" as const,
          approverIdentifier: "aprovador-1",
          approverName: "Aprovador 1",
          active: true,
          order: 1,
        },
        {
          id: "2",
          companyCode: "2313",
          flowType: "pedido" as const,
          level: 2,
          minAmount: 10000.01,
          maxAmount: 50000,
          approverType: "user" as const,
          approverIdentifier: "aprovador-2",
          approverName: "Aprovador 2",
          active: true,
          order: 2,
        },
      ];

      const onBorder = getApprovalChainForOrder("VB AGRO", 10000.0, rules);
      expect(onBorder).toHaveLength(1);
      expect(onBorder[0].roleOrName).toBe("Aprovador 1");

      const overBorder = getApprovalChainForOrder("VB AGRO", 10000.01, rules);
      expect(overBorder).toHaveLength(2);
      expect(overBorder[1].roleOrName).toBe("Aprovador 2");
    });

    it("deve ignorar regras inativas (active: false) sem corromper a ordenação dos níveis válidos", () => {
      const rules = [
        {
          id: "1",
          companyCode: "2313",
          flowType: "solicitacao" as const,
          level: 1,
          minAmount: 0,
          maxAmount: 5000,
          approverType: "user" as const,
          approverIdentifier: "ativo-n1",
          approverName: "Ativo N1",
          active: true,
          order: 1,
        },
        {
          id: "2",
          companyCode: "2313",
          flowType: "solicitacao" as const,
          level: 2,
          minAmount: 5000.01,
          maxAmount: 20000,
          approverType: "user" as const,
          approverIdentifier: "inativo-n2",
          approverName: "Inativo N2 (Desligado)",
          active: false,
          order: 2,
        },
        {
          id: "3",
          companyCode: "2313",
          flowType: "solicitacao" as const,
          level: 3,
          minAmount: 20000.01,
          maxAmount: null,
          approverType: "user" as const,
          approverIdentifier: "ativo-n3",
          approverName: "Ativo N3 (Diretoria)",
          active: true,
          order: 3,
        },
      ];

      const chain = getApprovalChainForRequest("VB AGRO", 50000, rules);
      expect(chain.some((l) => l.roleOrName.includes("Desligado"))).toBe(false);
      expect(chain.map((l) => l.roleOrName)).toEqual(["Ativo N1", "Ativo N3 (Diretoria)"]);
    });
  });
});
