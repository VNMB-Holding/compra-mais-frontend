import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchApi, formatSearchStatus } from "../search";
import { apiClient } from "@/lib/api-client";
import { purchaseRequestsApi } from "../purchase-requests";
import { rfqsApi } from "../rfqs";
import { purchaseOrdersApi } from "../purchase-orders";
import { suppliersApi } from "../suppliers";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
  cleanCompanyParam: vi.fn((val) => (val && val !== "TODAS" ? val : undefined)),
}));

vi.mock("../purchase-requests", () => ({
  purchaseRequestsApi: {
    list: vi.fn(),
  },
}));

vi.mock("../rfqs", () => ({
  rfqsApi: {
    list: vi.fn(),
  },
}));

vi.mock("../purchase-orders", () => ({
  purchaseOrdersApi: {
    list: vi.fn(),
  },
}));

vi.mock("../suppliers", () => ({
  suppliersApi: {
    list: vi.fn(),
  },
}));

describe("searchApi (Global Real-time Search)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatSearchStatus", () => {
    it("deve mapear status conhecidos para rótulos em português e variantes do Badge", () => {
      expect(formatSearchStatus("Approved")).toEqual({ label: "Aprovado", variant: "success" });
      expect(formatSearchStatus("AwaitingApproval")).toEqual({ label: "Pendente", variant: "warning" });
      expect(formatSearchStatus("Open")).toEqual({ label: "Em Cotação", variant: "primary" });
      expect(formatSearchStatus("InTransit")).toEqual({ label: "Em Andamento", variant: "primary" });
      expect(formatSearchStatus("Cancelled")).toEqual({ label: "Cancelado / Inativo", variant: "danger" });
      expect(formatSearchStatus("Active")).toEqual({ label: "Aprovado", variant: "success" });
      expect(formatSearchStatus(undefined)).toEqual({ label: "N/A", variant: "gray" });
    });
  });

  describe("globalSearch", () => {
    it("deve retornar resultados vazios sem fazer requisições se query for vazia ou whitespace", async () => {
      const res = await searchApi.globalSearch("   ");
      expect(res).toEqual({
        solicitacoes: [],
        rfqs: [],
        pedidos: [],
        fornecedores: [],
      });
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it("deve priorizar chamada ao endpoint unificado /api/search quando disponível", async () => {
      const mockBackendResponse = {
        solicitacoes: [
          { id: "pr-1", code: "SOL-001", description: "Notebooks Dell", status: "Approved", url: "/compras/solicitacoes?id=pr-1" },
        ],
        rfqs: [
          { id: "rfq-1", code: "RFQ-001", title: "Cotação de Servidores", status: "Open", url: "/compras/rfqs/rfq-1" },
        ],
        pedidos: [
          { id: "po-1", code: "OC-001", supplierName: "Dell Brasil", status: "Signed", totalValue: 50000, createdAt: "2026-09-01", url: "/compras/pedidos/po-1" },
        ],
        fornecedores: [
          { id: "sup-1", corporateName: "Dell Computadores do Brasil", cnpj: "12.345.678/0001-90", status: "Active", url: "/fornecedores/sup-1" },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockBackendResponse);

      const res = await searchApi.globalSearch("Dell", "TENANT-1", 5);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/search?q=Dell&companyCode=TENANT-1&limit=5")
      );
      expect(res.solicitacoes).toHaveLength(1);
      expect(res.rfqs).toHaveLength(1);
      expect(res.pedidos).toHaveLength(1);
      expect(res.fornecedores).toHaveLength(1);
      expect(res.fornecedores[0].corporateName).toBe("Dell Computadores do Brasil");
    });

    it("deve realizar fallback resiliente e paralelo caso /api/search falhe", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("404 Not Found"));

      vi.mocked(purchaseRequestsApi.list).mockResolvedValueOnce([
        {
          id: "pr-10",
          code: "SOL-100",
          description: "Monitores 4K",
          status: "AwaitingApproval",
          requesterName: "Breno Souza",
          totalBudget: 12000,
          createdAt: "2026-09-10",
        } as any,
      ]);

      vi.mocked(rfqsApi.list).mockResolvedValueOnce([
        {
          id: "rfq-10",
          code: "RFQ-100",
          title: "Processo Cotação Monitores",
          status: "InQuote",
          endDate: "2026-09-20",
        } as any,
      ]);

      vi.mocked(purchaseOrdersApi.list).mockResolvedValueOnce([
        {
          id: "po-10",
          code: "OC-100",
          status: "Delivered",
          totalValue: 11500,
          createdAt: "2026-09-11",
          supplier: { corporateName: "LG Electronics", tradeName: "LG", cnpj: "99.888.777/0001-00" },
        } as any,
      ]);

      vi.mocked(suppliersApi.list).mockResolvedValueOnce([
        {
          id: "sup-10",
          corporateName: "LG Electronics do Brasil Ltda",
          tradeName: "LG",
          cnpj: "99.888.777/0001-00",
          status: "Homologated",
          segment: "Eletrônicos",
        } as any,
      ]);

      const res = await searchApi.globalSearch("LG", "TENANT-1");

      expect(res.solicitacoes).toHaveLength(1);
      expect(res.solicitacoes[0].code).toBe("SOL-100");
      expect(res.solicitacoes[0].url).toBe("/compras/solicitacoes?id=pr-10");

      expect(res.rfqs).toHaveLength(1);
      expect(res.rfqs[0].code).toBe("RFQ-100");
      expect(res.rfqs[0].url).toBe("/compras/rfqs/rfq-10");

      expect(res.pedidos).toHaveLength(1);
      expect(res.pedidos[0].code).toBe("OC-100");
      expect(res.pedidos[0].supplierName).toBe("LG");
      expect(res.pedidos[0].url).toBe("/compras/pedidos/po-10");

      expect(res.fornecedores).toHaveLength(1);
      expect(res.fornecedores[0].tradeName).toBe("LG");
      expect(res.fornecedores[0].url).toBe("/fornecedores/sup-10");
    });
  });
});
