import { describe, it, expect } from 'vitest';
import { ROUTE_ROLES, mapApiRole } from '@/features/auth';

describe('Auth Roles and Permissions', () => {
  it('deve definir permissões para o dashboard', () => {
    expect(ROUTE_ROLES.dashboard).toContain('admin');
    expect(ROUTE_ROLES.dashboard).toContain('gerente');
    expect(ROUTE_ROLES.dashboard).toContain('procurist');
  });

  it('deve restringir solicitações rápidas a solicitante', () => {
    expect(ROUTE_ROLES.solicitacoesRapidas).toContain('solicitante');
  });

  it('deve conter papéis válidos para compras e fornecedores', () => {
    expect(ROUTE_ROLES.compras).toBeDefined();
    expect(ROUTE_ROLES.fornecedores).toBeDefined();
    expect(ROUTE_ROLES.compras.length).toBeGreaterThan(0);
  });

  it('deve mapear corretamente compradora especialista para procurist', () => {
    expect(mapApiRole(['compradora especialista'])).toBe('procurist');
    expect(mapApiRole(['Comprador Especialista'])).toBe('procurist');
    expect(mapApiRole(['compradora'])).toBe('procurist');
    expect(mapApiRole(['buyer'])).toBe('procurist');
    expect(mapApiRole(['procurist'])).toBe('procurist');
  });

  it('deve mapear administradores e gerentes corretamente', () => {
    expect(mapApiRole(['admin'])).toBe('admin');
    expect(mapApiRole(['gerente'])).toBe('gerente');
    expect(mapApiRole(['solicitante'])).toBe('solicitante');
    expect(mapApiRole([])).toBe('solicitante');
  });
});
