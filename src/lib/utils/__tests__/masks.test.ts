import { describe, it, expect } from "vitest";
import {
  maskCnpj,
  maskCpf,
  maskCpfCnpj,
  maskPhone,
  maskCep,
  maskDate,
  maskCurrency,
  parseCurrencyToNumber,
  unmask,
  maskNfeAccessKey,
} from "../masks";

describe("Mask Utilities", () => {
  describe("unmask", () => {
    it("deve remover caracteres não numéricos", () => {
      expect(unmask("12.345.678/0001-90")).toBe("12345678000190");
      expect(unmask("(67) 99999-1234")).toBe("67999991234");
      expect(unmask("")).toBe("");
      expect(unmask(null)).toBe("");
    });
  });

  describe("maskCnpj", () => {
    it("deve mascarar CNPJ parcial e completo", () => {
      expect(maskCnpj("12")).toBe("12");
      expect(maskCnpj("123")).toBe("12.3");
      expect(maskCnpj("12345")).toBe("12.345");
      expect(maskCnpj("12345678")).toBe("12.345.678");
      expect(maskCnpj("123456780001")).toBe("12.345.678/0001");
      expect(maskCnpj("12345678000190")).toBe("12.345.678/0001-90");
      expect(maskCnpj("12.345.678/0001-90")).toBe("12.345.678/0001-90");
    });
  });

  describe("maskCpf", () => {
    it("deve mascarar CPF parcial e completo", () => {
      expect(maskCpf("123")).toBe("123");
      expect(maskCpf("1234")).toBe("123.4");
      expect(maskCpf("123456")).toBe("123.456");
      expect(maskCpf("123456789")).toBe("123.456.789");
      expect(maskCpf("12345678901")).toBe("123.456.789-01");
    });
  });

  describe("maskCpfCnpj", () => {
    it("deve aplicar máscara de CPF até 11 dígitos e CNPJ acima disso", () => {
      expect(maskCpfCnpj("12345678901")).toBe("123.456.789-01");
      expect(maskCpfCnpj("12345678000190")).toBe("12.345.678/0001-90");
    });
  });

  describe("maskPhone", () => {
    it("deve mascarar telefone fixo (10 dígitos) e celular (11 dígitos)", () => {
      expect(maskPhone("67")).toBe("(67");
      expect(maskPhone("673322")).toBe("(67) 3322");
      expect(maskPhone("6733224455")).toBe("(67) 3322-4455");
      expect(maskPhone("67999887766")).toBe("(67) 99988-7766");
      expect(maskPhone("(67) 99988-7766")).toBe("(67) 99988-7766");
    });
  });

  describe("maskCep", () => {
    it("deve mascarar CEP com 8 dígitos", () => {
      expect(maskCep("79000")).toBe("79000");
      expect(maskCep("79000123")).toBe("79000-123");
      expect(maskCep("79000-123")).toBe("79000-123");
    });
  });

  describe("maskDate", () => {
    it("deve mascarar data DD/MM/AAAA", () => {
      expect(maskDate("01")).toBe("01");
      expect(maskDate("0105")).toBe("01/05");
      expect(maskDate("01052026")).toBe("01/05/2026");
    });
  });

  describe("maskCurrency & parseCurrencyToNumber", () => {
    it("deve mascarar moeda ao digitar centavos", () => {
      expect(maskCurrency("1")).toBe("0,01");
      expect(maskCurrency("10")).toBe("0,10");
      expect(maskCurrency("150")).toBe("1,50");
      expect(maskCurrency("125050")).toBe("1.250,50");
      expect(maskCurrency(1250.5)).toBe("1.250,50");
    });

    it("deve converter valor mascarado para float numérico", () => {
      expect(parseCurrencyToNumber("1.250,50")).toBe(1250.5);
      expect(parseCurrencyToNumber("R$ 1.250,50")).toBe(1250.5);
      expect(parseCurrencyToNumber("")).toBe(0);
    });
  });

  describe("maskNfeAccessKey", () => {
    it("deve agrupar chave de 44 dígitos em blocos de 4", () => {
      expect(maskNfeAccessKey("35240912")).toBe("3524 0912");
      expect(maskNfeAccessKey("35240912345678000199550010000048211000048210")).toBe(
        "3524 0912 3456 7800 0199 5500 1000 0048 2110 0004 8210",
      );
    });
  });
});
