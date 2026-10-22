import { describe, it, expect, vi } from "vitest";
import { getPdfFilename, getPdfErrorMessage, downloadPdfResponse } from "../pdf";

describe("pdf utilities", () => {
  describe("getPdfFilename", () => {
    it("deve extrair o nome do arquivo a partir de filename* (UTF-8)", () => {
      const headers = new Headers({
        "content-disposition": "attachment; filename*=UTF-8''solicitacao-compra-123.pdf",
      });
      const res = new Response(null, { headers });
      expect(getPdfFilename(res, "fallback")).toBe("solicitacao-compra-123.pdf");
    });

    it("deve extrair o nome do arquivo a partir de filename com aspas", () => {
      const headers = new Headers({
        "content-disposition": 'attachment; filename="pedido-compra-456.pdf"',
      });
      const res = new Response(null, { headers });
      expect(getPdfFilename(res, "fallback")).toBe("pedido-compra-456.pdf");
    });

    it("deve sanitizar o fallbackCode quando Content-Disposition não estiver presente", () => {
      const res = new Response(null, { headers: new Headers() });
      expect(getPdfFilename(res, "SC 123/2026")).toBe("SC-123-2026.pdf");
    });
  });

  describe("getPdfErrorMessage", () => {
    it("deve retornar a mensagem contida no json de erro", async () => {
      const res = new Response(JSON.stringify({ message: "Solicitação não encontrada" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
      const msg = await getPdfErrorMessage(res);
      expect(msg).toBe("Solicitação não encontrada");
    });

    it("deve retornar o texto bruto quando não for json", async () => {
      const res = new Response("Erro interno do servidor", {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
      const msg = await getPdfErrorMessage(res);
      expect(msg).toBe("Erro interno do servidor");
    });
  });

  describe("downloadPdfResponse", () => {
    it("deve disparar download para uma resposta PDF válida", async () => {
      const mockPdfData = "%PDF-1.4 Mock";
      const headers = new Headers({
        "content-type": "application/pdf",
        "content-disposition": 'inline; filename="solicitacao.pdf"',
      });
      const res = new Response(mockPdfData, { status: 200, headers });

      const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
      const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
        set href(val: string) {},
        set target(val: string) {},
        set rel(val: string) {},
        set download(val: string) {},
        click: clickMock,
      } as any);

      await downloadPdfResponse(res, "fallback");

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();

      appendChildSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it("deve lançar erro quando status da resposta não for ok", async () => {
      const res = new Response(JSON.stringify({ message: "Sem permissão" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });

      await expect(downloadPdfResponse(res, "fallback")).rejects.toThrow("Sem permissão");
    });

    it("deve lançar erro se o Content-Type não for application/pdf", async () => {
      const res = new Response("Texto simples", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });

      await expect(downloadPdfResponse(res, "fallback")).rejects.toThrow(
        "O servidor não retornou um documento PDF válido.",
      );
    });
  });
});
