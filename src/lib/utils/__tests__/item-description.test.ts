import { describe, it, expect } from "vitest";
import { parseItemDescription, sanitizeUrl } from "../item-description";

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

    it("deve rejeitar javascript: ou strings maliciosas", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeUndefined();
      expect(sanitizeUrl("")).toBeUndefined();
      expect(sanitizeUrl(null)).toBeUndefined();
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
      expect(res.referenceUrl).toBe("https://mercadolivre.com.br/item/123?tracking=abc");
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
});
