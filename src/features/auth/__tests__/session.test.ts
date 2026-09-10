import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, loadStoredSession, clearSession } from '@/features/auth';
import type { User } from '@/types/auth';

describe('Auth Session Storage', () => {
  const mockUser: User = {
    id: 'usr-123',
    email: 'teste@vnmb.com.br',
    name: 'Usuário Teste',
    role: 'admin',
    tenantId: 'tenant-1',
  };

  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  it('deve salvar e carregar a sessão no localStorage', () => {
    saveSession('mock-token-abc', 'mock-refresh-xyz', mockUser);

    const session = loadStoredSession();
    expect(session).not.toBeNull();
    expect(session?.accessToken).toBe('mock-token-abc');
    expect(session?.refreshToken).toBe('mock-refresh-xyz');
    expect(session?.user.name).toBe('Usuário Teste');
  });

  it('deve limpar a sessão completamente', () => {
    saveSession('mock-token-abc', 'mock-refresh-xyz', mockUser);
    clearSession();

    const session = loadStoredSession();
    expect(session).toBeNull();
    expect(localStorage.getItem('compra_access_token')).toBeNull();
  });

  it('deve retornar null se não houver dados de sessão', () => {
    expect(loadStoredSession()).toBeNull();
  });
});
