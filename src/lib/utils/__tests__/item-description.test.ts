import { describe, it, expect } from "vitest";
import {
  parseItemDescription,
  sanitizeUrl,
  deriveTitleFromUrl,
  extractItemReferenceUrlsFromNotes,
  cleanNotesDisplay,
  detectMarketplaceFromUrl,
  extractProposalOfferUrl,
  isMarketplaceOrLocalSupplier,
} from "../item-description";

describe("item-description utility", () => {
  describe("sanitizeUrl", () => {
    it("deve aceitar URLs https válidas", () => {
      expect(sanitizeUrl("https://mercadolivre.com.br/item/123")).toBe(
        "https://mercadolivre.com.br/item/123"
      );
    });

    it("deve adicionar https se digitado sem protocolo", () => {
      expect(sanitizeUrl("www.kalunga.com.br/produto")).toBe(
        "https://www.kalunga.com.br/produto"
      );
    });

    it("deve remover pontuação residual no final da URL", () => {
      expect(sanitizeUrl("https://mercadolivre.com.br/item/123.")).toBe(
        "https://mercadolivre.com.br/item/123"
      );
      expect(sanitizeUrl("https://mercadolivre.com.br/item/123);")).toBe(
        "https://mercadolivre.com.br/item/123"
      );
    });

    it("deve rejeitar javascript: ou strings maliciosas", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeUndefined();
      expect(sanitizeUrl("")).toBeUndefined();
      expect(sanitizeUrl(null)).toBeUndefined();
    });
  });

  describe("deriveTitleFromUrl", () => {
    it("deve derivar título a partir do slug do produto", () => {
      expect(
        deriveTitleFromUrl(
          "https://www.mercadolivre.com.br/mouse-gamer-redragon-cobra-m711-chroma-rgb/p/MLB123"
        )
      ).toBe("Mouse gamer redragon cobra m711 chroma rgb");
    });

    it("deve usar o domínio caso não haja slug legível", () => {
      expect(deriveTitleFromUrl("https://www.dell.com.br/")).toBe(
        "Item Referenciado (dell.com.br)"
      );
    });
  });

  describe("parseItemDescription", () => {
    it("deve manter descrição pura quando não houver link", () => {
      const res = parseItemDescription("Cadeira Presidente Ergonômica");
      expect(res.cleanDescription).toBe("Cadeira Presidente Ergonômica");
      expect(res.referenceUrl).toBeUndefined();
    });

    it("deve extrair link embutido no padrão (Ref: https://...)", () => {
      const res = parseItemDescription(
        "Cadeira Giratória NR17 (Ref: https://mercadolivre.com.br/item/123?tracking=abc)"
      );
      expect(res.cleanDescription).toBe("Cadeira Giratória NR17");
      expect(res.referenceUrl).toBe(
        "https://mercadolivre.com.br/item/123?tracking=abc"
      );
    });

    it("deve extrair link embutido no padrão (Link: https://...)", () => {
      const res = parseItemDescription(
        "Monitor Dell 27 4K (Link: https://dell.com/br/monitor)"
      );
      expect(res.cleanDescription).toBe("Monitor Dell 27 4K");
      expect(res.referenceUrl).toBe("https://dell.com/br/monitor");
    });

    it("deve extrair link cru no final entre parênteses", () => {
      const res = parseItemDescription(
        "Teclado Sem Fio (https://amazon.com.br/dp/B08XYZ)"
      );
      expect(res.cleanDescription).toBe("Teclado Sem Fio");
      expect(res.referenceUrl).toBe("https://amazon.com.br/dp/B08XYZ");
    });

    it("deve extrair link com prefixo sem parênteses", () => {
      const res = parseItemDescription(
        "Mouse Gamer Ref: https://mercadolivre.com.br/mouse-gamer-redragon/p/123"
      );
      expect(res.cleanDescription).toBe("Mouse Gamer");
      expect(res.referenceUrl).toBe(
        "https://mercadolivre.com.br/mouse-gamer-redragon/p/123"
      );
    });

    it("deve extrair link no meio do texto e limpar os conectores", () => {
      const res = parseItemDescription(
        "Cadeira Giratória https://mercadolivre.com.br/item para o setor administrativo"
      );
      expect(res.cleanDescription).toBe(
        "Cadeira Giratória para o setor administrativo"
      );
      expect(res.referenceUrl).toBe("https://mercadolivre.com.br/item");
    });

    it("NÃO DEVE deixar a URL no nome quando a descrição for apenas a URL", () => {
      const res = parseItemDescription(
        "https://www.mercadolivre.com.br/mouse-gamer-redragon-cobra-m711-chroma-rgb/p/MLB123"
      );
      expect(res.cleanDescription).toBe(
        "Mouse gamer redragon cobra m711 chroma rgb"
      );
      expect(res.referenceUrl).toBe(
        "https://www.mercadolivre.com.br/mouse-gamer-redragon-cobra-m711-chroma-rgb/p/MLB123"
      );
    });

    it("deve lidar com URLs www. sem protocolo", () => {
      const res = parseItemDescription(
        "Papel Sulfite A4 (Link: www.kalunga.com.br/item)"
      );
      expect(res.cleanDescription).toBe("Papel Sulfite A4");
      expect(res.referenceUrl).toBe("https://www.kalunga.com.br/item");
    });

    it("deve priorizar explicitUrl se fornecido", () => {
      const res = parseItemDescription(
        "Papel Sulfite A4",
        "https://kalunga.com.br/papel-a4"
      );
      expect(res.cleanDescription).toBe("Papel Sulfite A4");
      expect(res.referenceUrl).toBe("https://kalunga.com.br/papel-a4");
    });

    it("lida com string vazia ou nula graciosamente", () => {
      const res = parseItemDescription(null);
      expect(res.cleanDescription).toBe("Item sem descrição");
      expect(res.referenceUrl).toBeUndefined();
    });
  });

  describe("extractItemReferenceUrlsFromNotes and cleanNotesDisplay", () => {
    it("deve extrair mapeamento de links de referência das observações", () => {
      const notes =
        "Demanda prioritária.\n\nLinks de referência:\n• Mouse Sem Fio: https://mercadolivre.com.br/mouse\n• Teclado USB: https://amazon.com.br/teclado";

      const map = extractItemReferenceUrlsFromNotes(notes);
      expect(map.get("mouse sem fio")).toBe(
        "https://mercadolivre.com.br/mouse"
      );
      expect(map.get("teclado usb")).toBe("https://amazon.com.br/teclado");
    });

    it("deve limpar bloco de links da exibição das notas", () => {
      const notes =
        "Demanda prioritária.\n\nLinks de referência:\n• Mouse Sem Fio: https://mercadolivre.com.br/mouse";
      expect(cleanNotesDisplay(notes)).toBe("Demanda prioritária.");
    });
  });

  describe("detectMarketplaceFromUrl", () => {
    it("deve identificar Mercado Livre corretamente", () => {
      const ml = detectMarketplaceFromUrl(
        "https://produto.mercadolivre.com.br/MLB-123456-microfone-sem-fio",
      );
      expect(ml?.id).toBe("mercadolivre");
      expect(ml?.label).toBe("Mercado Livre");
      expect(ml?.isMercadoLivre).toBe(true);
    });

    it("deve identificar Amazon, Shopee e outros marketplaces", () => {
      const amz = detectMarketplaceFromUrl("https://www.amazon.com.br/dp/B09XYZ");
      expect(amz?.id).toBe("amazon");
      expect(amz?.label).toBe("Amazon");
      expect(amz?.isMercadoLivre).toBe(false);

      const shp = detectMarketplaceFromUrl("https://shopee.com.br/item-123");
      expect(shp?.id).toBe("shopee");
      expect(shp?.label).toBe("Shopee");
    });

    it("deve retornar ecommerce genérico para outros domínios", () => {
      const web = detectMarketplaceFromUrl("https://www.lojaespecializada.com.br/produto");
      expect(web?.id).toBe("ecommerce");
      expect(web?.isMercadoLivre).toBe(false);
    });
  });

  describe("extractProposalOfferUrl", () => {
    it("deve extrair o link da oferta a partir das notas ou marca/modelo da proposta", () => {
      const url = extractProposalOfferUrl(
        "Frete grátis Full\nLink da Oferta: https://produto.mercadolivre.com.br/MLB-999",
        "Shure",
      );
      expect(url).toBe("https://produto.mercadolivre.com.br/MLB-999");
    });

    it("deve retornar undefined quando não houver URL", () => {
      expect(extractProposalOfferUrl("Entrega imediata em mãos", "Marca Local")).toBeUndefined();
    });
  });

  describe("isMarketplaceOrLocalSupplier", () => {
    it("deve identificar fornecedores de marketplaces e compras locais", () => {
      expect(isMarketplaceOrLocalSupplier("Mercado Livre")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Mercado Livre (Site)")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Amazon Brasil")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Shopee")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Magalu")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Magazine Luiza")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Comércio Local")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Comércio Local 1")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Loja Local")).toBe(true);
      expect(isMarketplaceOrLocalSupplier("Orçamento Balcão")).toBe(true);
    });

    it("deve retornar false para fornecedores convencionais B2B", () => {
      expect(isMarketplaceOrLocalSupplier("Tech Distribuidora Ltda")).toBe(false);
      expect(isMarketplaceOrLocalSupplier("Kalunga")).toBe(false);
      expect(isMarketplaceOrLocalSupplier("")).toBe(false);
      expect(isMarketplaceOrLocalSupplier(null)).toBe(false);
      expect(isMarketplaceOrLocalSupplier(undefined)).toBe(false);
    });
  });
});
