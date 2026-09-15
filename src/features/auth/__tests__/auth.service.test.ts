import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/features/auth/services/auth.service';
import { apiClient } from '@/lib/api-client';

describe('TC-USR-01 / TC-USR-02: Auth Service & Session Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve realizar login com sucesso e retornar tokens e dados do usuário', async () => {
    const mockLoginResponse = {
      access_token: 'jwt-access-token-123',
      refresh_token: 'jwt-refresh-token-456',
      token_type: 'Bearer',
      expires_in: '3600',
      user: {
        id: 'usr-001',
        name: 'Carlos Comprador',
        email: 'carlos@empresa.com.br',
        tenant_id: 'tenant-vb',
        roles: ['COMPRADOR'],
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockLoginResponse as any);

    const result = await authService.login('carlos@empresa.com.br', 'SenhaForte#2026');

    expect(postSpy).toHaveBeenCalledWith(
      '/api/auth/login',
      {
        email: 'carlos@empresa.com.br',
        password: 'SenhaForte#2026',
        client_id: 'compra-mais',
      },
      { auth: true }
    );
    expect(result).toEqual(mockLoginResponse);
    expect(result.access_token).toBeDefined();
    expect(result.user.roles).toContain('COMPRADOR');
  });

  it('deve renovar token com sucesso através do refresh token', async () => {
    const mockRefreshResponse = {
      access_token: 'new-jwt-access-token-789',
      refresh_token: 'new-jwt-refresh-token-012',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockRefreshResponse as any);

    const result = await authService.refreshToken('old-refresh-token');

    expect(postSpy).toHaveBeenCalledWith(
      '/api/auth/refresh',
      { refresh_token: 'old-refresh-token' },
      { auth: true }
    );
    expect(result.access_token).toBe('new-jwt-access-token-789');
  });

  it('deve realizar logout revogando a sessão remota', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined as any);

    await authService.logout('current-refresh-token');

    expect(postSpy).toHaveBeenCalledWith(
      '/api/auth/logout',
      { refresh_token: 'current-refresh-token' },
      { auth: true }
    );
  });

  it('deve consultar lista de tenants disponíveis para o usuário autenticado', async () => {
    const mockTenants = [
      { id: 't-1', name: 'VB AGRO Matriz', slug: 'vb-agro', document_number: '12345678000199', status: 'Active', type: 'Matriz' },
      { id: 't-2', name: 'LORENA Filial', slug: 'lorena', document_number: '98765432000188', status: 'Active', type: 'Filial' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockTenants as any);

    const result = await authService.getTenants();

    expect(getSpy).toHaveBeenCalledWith('/api/tenants', { auth: true });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('VB AGRO Matriz');
  });

  it('deve consultar permissões e acessos específicos do usuário por ID', async () => {
    const mockAccess = [
      { module: 'SOLICITACOES', canRead: true, canWrite: true },
      { module: 'APROVACOES', canRead: true, canWrite: false },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockAccess as any);

    const result = await authService.getUserAccess('usr-001');

    expect(getSpy).toHaveBeenCalledWith('/api/users/usr-001/access', { auth: true });
    expect(result).toEqual(mockAccess);
  });
});
