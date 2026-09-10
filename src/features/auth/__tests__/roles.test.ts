import { describe, it, expect } from 'vitest';
import { ROUTE_ROLES } from '@/features/auth';

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
});
