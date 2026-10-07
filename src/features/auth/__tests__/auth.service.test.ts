import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/features/auth/services/auth.service";
import { apiClient } from "@/lib/api-client";

describe("TC-USR-01 / TC-USR-02: Auth Service & Session Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deve realizar login com sucesso e retornar tokens e dados do usuário", async () => {
    const mockLoginResponse = {
      access_token: "jwt-access-token-123",
      refresh_token: "jwt-refresh-token-456",
      token_type: "Bearer",
      expires_in: "3600",
      user: {
        id: "usr-001",
        name: "Carlos Comprador",
        email: "carlos@empresa.com.br",
        tenant_id: "tenant-vb",
        roles: ["COMPRADOR"],
      },
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockLoginResponse as any);

    const result = await authService.login("carlos@empresa.com.br", "SenhaForte#2026");

    expect(postSpy).toHaveBeenCalledWith(
      "/api/auth/login",
      {
        email: "carlos@empresa.com.br",
        password: "SenhaForte#2026",
        client_id: "compra-mais",
      },
      { auth: true },
    );
    expect(result).toEqual(mockLoginResponse);
    expect(result.access_token).toBeDefined();
    expect(result.user.roles).toContain("COMPRADOR");
  });

  it("deve renovar token com sucesso através do refresh token", async () => {
    const mockRefreshResponse = {
      access_token: "new-jwt-access-token-789",
      refresh_token: "new-jwt-refresh-token-012",
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockRefreshResponse as any);

    const result = await authService.refreshToken("old-refresh-token");

    expect(postSpy).toHaveBeenCalledWith(
      "/api/auth/refresh",
      { refresh_token: "old-refresh-token" },
      { auth: true },
    );
    expect(result.access_token).toBe("new-jwt-access-token-789");
  });

  it("deve realizar logout revogando a sessão remota", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(undefined as any);

    await authService.logout("current-refresh-token");

    expect(postSpy).toHaveBeenCalledWith(
      "/api/auth/logout",
      { refresh_token: "current-refresh-token" },
      { auth: true },
    );
  });

  it("deve consultar lista de tenants disponíveis para o usuário autenticado", async () => {
    const mockTenants = [
      {
        id: "t-1",
        name: "VB AGRO Matriz",
        slug: "vb-agro",
        document_number: "12345678000199",
        status: "Active",
        type: "Matriz",
      },
      {
        id: "t-2",
        name: "LORENA Filial",
        slug: "lorena",
        document_number: "98765432000188",
        status: "Active",
        type: "Filial",
      },
    ];

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockTenants as any);

    const result = await authService.getTenants();

    expect(getSpy).toHaveBeenCalledWith("/api/tenants", { auth: true });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("VB AGRO Matriz");
  });

  it("deve consultar permissões e acessos específicos do usuário por ID", async () => {
    const mockAccess = [
      { module: "SOLICITACOES", canRead: true, canWrite: true },
      { module: "APROVACOES", canRead: true, canWrite: false },
    ];

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockAccess as any);

    const result = await authService.getUserAccess("usr-001");

    expect(getSpy).toHaveBeenCalledWith("/api/users/usr-001/access", { auth: true });
    expect(result).toEqual(mockAccess);
  });

  describe("Facial Authentication & Biometrics API", () => {
    it("deve autenticar por biometria facial 1:N (sem email)", async () => {
      const mockAuthResponse = {
        access_token: "jwt-face-token",
        refresh_token: "refresh-face-token",
        token_type: "Bearer",
        expires_in: "3600",
        similarity: 0.94,
        user: { id: "usr-001", name: "Breno Souza", email: "breno@vnmb.com.br" },
      };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockAuthResponse as any);

      const result = await authService.facialAuthenticate("data:image/jpeg;base64,abc123");

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/authenticate",
        {
          image: "data:image/jpeg;base64,abc123",
          client_id: "compra-mais",
        },
        { auth: true },
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it("deve autenticar por biometria facial 1:1 passando email para correspondência rápida", async () => {
      const mockAuthResponse = {
        access_token: "jwt-face-token",
        refresh_token: "refresh-face-token",
        token_type: "Bearer",
        expires_in: "3600",
        user: { id: "usr-002", name: "Maria Silva", email: "maria@vnmb.com.br" },
      };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockAuthResponse as any);

      const result = await authService.faceLogin(
        "data:image/jpeg;base64,xyz789",
        "maria@vnmb.com.br",
      );

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/authenticate",
        {
          image: "data:image/jpeg;base64,xyz789",
          client_id: "compra-mais",
          email: "maria@vnmb.com.br",
        },
        { auth: true },
      );
      expect(result.user.email).toBe("maria@vnmb.com.br");
    });

    it("deve consultar o status de cadastro biométrico do usuário autenticado", async () => {
      const mockStatus = {
        enrolled: true,
        provider: "insightface",
        model_version: "buffalo_l",
        enrolled_at: "2026-10-01T12:00:00Z",
      };
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockStatus as any);

      const result = await authService.getFacialStatus();

      expect(getSpy).toHaveBeenCalledWith("/api/auth/facial/status", { auth: true });
      expect(result.enrolled).toBe(true);
    });

    it("deve cadastrar biometria facial do usuário autenticado", async () => {
      const mockEnroll = {
        message: "Biometria cadastrada com sucesso",
        enrolled_at: "2026-10-07T12:00:00Z",
      };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockEnroll as any);

      const result = await authService.enrollFacial("data:image/jpeg;base64,face-enroll");

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/enroll",
        { image: "data:image/jpeg;base64,face-enroll" },
        { auth: true },
      );
      expect(result.message).toBe("Biometria cadastrada com sucesso");
    });

    it("deve remover biometria facial do usuário autenticado", async () => {
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined as any);

      await authService.deleteFacial();

      expect(deleteSpy).toHaveBeenCalledWith("/api/auth/facial/enroll", { auth: true });
    });

    it("deve verificar correspondência facial 1:1 do usuário logado (re-autenticação)", async () => {
      const mockVerify = { matched: true, similarity: 0.88, threshold: 0.65 };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockVerify as any);

      const result = await authService.verifyFacial("data:image/jpeg;base64,verify-face", 0.65);

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/verify",
        { image: "data:image/jpeg;base64,verify-face", similarity_threshold: 0.65 },
        { auth: true },
      );
      expect(result.matched).toBe(true);
    });

    it("deve gerar link de cadastro facial externo", async () => {
      const mockGen = {
        token: "enroll-token-123",
        url: "https://identity.vnmbholding.com/facial-enroll?token=enroll-token-123",
        expires_at: "2026-10-08T12:00:00Z",
      };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockGen as any);

      const result = await authService.generateFacialEnrollLink({
        email: "joao@vnmb.com.br",
        expiresInHours: 24,
      });

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/enroll-link/generate",
        { email: "joao@vnmb.com.br", expires_in_hours: 24 },
        { auth: true },
      );
      expect(result.token).toBe("enroll-token-123");
    });

    it("deve verificar token do link de cadastro facial externo", async () => {
      const mockVerify = {
        valid: true,
        expires_at: "2026-10-08T12:00:00Z",
        user: { id: "u-1", name: "Joao", email: "joao@vnmb.com.br" },
      };
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockVerify as any);

      const result = await authService.verifyFacialEnrollLink("enroll-token-123");

      expect(getSpy).toHaveBeenCalledWith(
        "/api/auth/facial/enroll-link/verify?token=enroll-token-123",
        { auth: true },
      );
      expect(result.valid).toBe(true);
    });

    it("deve submeter foto através do link de cadastro facial externo", async () => {
      const mockSubmit = { success: true, message: "Foto enviada com sucesso" };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockSubmit as any);

      const result = await authService.submitFacialEnrollLink(
        "enroll-token-123",
        "data:image/jpeg;base64,link-photo",
      );

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/enroll-link",
        { token: "enroll-token-123", image: "data:image/jpeg;base64,link-photo" },
        { auth: true },
      );
      expect(result.success).toBe(true);
    });

    it("deve comparar biometria facial com o tenant", async () => {
      const mockCompare = {
        face_detected: true,
        total_comparisons: 5,
        matches: [],
      };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockCompare as any);

      const result = await authService.compareFacial(
        "data:image/jpeg;base64,compare",
        "tenant-1",
        5,
      );

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/facial/compare",
        { image: "data:image/jpeg;base64,compare", tenant_id: "tenant-1", top_k: 5 },
        { auth: true },
      );
      expect(result.face_detected).toBe(true);
    });

    it("deve permitir administradores gerenciarem biometria por ID de usuário", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ enrolled: false } as any);
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ message: "OK" } as any);
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined as any);

      await authService.getUserFacialStatus("usr-999");
      expect(getSpy).toHaveBeenCalledWith("/api/users/usr-999/facial-status", { auth: true });

      await authService.enrollUserFacial("usr-999", "data:image/jpeg;base64,admin-enroll");
      expect(postSpy).toHaveBeenCalledWith(
        "/api/users/usr-999/facial-enroll",
        { image: "data:image/jpeg;base64,admin-enroll" },
        { auth: true },
      );

      await authService.deleteUserFacial("usr-999");
      expect(deleteSpy).toHaveBeenCalledWith("/api/users/usr-999/facial-enroll", { auth: true });
    });
  });
});
