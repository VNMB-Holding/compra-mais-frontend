import { describe, it, expect } from 'vitest';
import { getApprovalChainForRequest, getApprovalChainForOrder, isUserEligibleToApprove } from '@/features/aprovacoes';

describe('Approval Limits Workflow', () => {
  describe('Requisições - VB AGRO', () => {
    it('deve requerer apenas nível 1 (Henrique) para compras até R$ 10.000', () => {
      const chain = getApprovalChainForRequest('VB AGRO', 5000);
      expect(chain).toHaveLength(1);
      expect(chain[0].roleOrName).toBe('Henrique');
      expect(chain[0].maxLimit).toBe(10000);
    });

    it('deve requerer 2 níveis (Henrique e Celso) para compras entre R$ 10.001 e R$ 100.000', () => {
      const chain = getApprovalChainForRequest('VB AGRO', 50000);
      expect(chain).toHaveLength(2);
      expect(chain[0].roleOrName).toBe('Henrique');
      expect(chain[1].roleOrName).toBe('Celso');
      expect(chain[1].maxLimit).toBe(100000);
    });

    it('deve escalar para cadeia completa (Celso, Vanessa, JAB, Andressa) acima de R$ 100.000', () => {
      const chain = getApprovalChainForRequest('VB AGRO', 600000);
      expect(chain).toHaveLength(4);
      expect(chain[0].roleOrName).toBe('Celso');
      expect(chain[1].roleOrName).toBe('Vanessa');
      expect(chain[2].roleOrName).toBe('JAB');
      expect(chain[3].roleOrName).toBe('Andressa');
      expect(chain[3].maxLimit).toBeNull();
    });
  });

  describe('Requisições - IMÓVEIS / LORENA', () => {
    it('deve limitar primeiro nível a R$ 5.000 (Paula)', () => {
      const chain = getApprovalChainForRequest('LORENA IMÓVEIS', 4000);
      expect(chain).toHaveLength(1);
      expect(chain[0].roleOrName).toBe('Paula');
    });

    it('deve escalar acima de R$ 5.000 para Paula, Vanessa, JAB, Andressa', () => {
      const chain = getApprovalChainForRequest('LORENA IMÓVEIS', 15000);
      expect(chain).toHaveLength(4);
      expect(chain[0].roleOrName).toBe('Paula');
      expect(chain[1].roleOrName).toBe('Vanessa');
      expect(chain[2].roleOrName).toBe('JAB');
      expect(chain[3].roleOrName).toBe('Andressa');
    });
  });

  describe('Requisições - PURA / IGREJA', () => {
    it('deve limitar primeiro nível a R$ 1.000 (Jane) e segundo nível Bispo Bruno', () => {
      const smallChain = getApprovalChainForRequest('IGREJA DA CIDADE', 800);
      expect(smallChain).toHaveLength(1);
      expect(smallChain[0].roleOrName).toBe('Jane');

      const bigChain = getApprovalChainForRequest('IGREJA DA CIDADE', 2500);
      expect(bigChain).toHaveLength(2);
      expect(bigChain[0].roleOrName).toBe('Jane');
      expect(bigChain[1].roleOrName).toBe('Bispo Bruno');
      expect(bigChain[1].maxLimit).toBeNull();
    });
  });

  describe('Pedidos de Compra - VB AGRO', () => {
    it('deve requerer apenas Celso até R$ 10.000', () => {
      const chain = getApprovalChainForOrder('VB AGRO', 8000);
      expect(chain).toHaveLength(1);
      expect(chain[0].roleOrName).toBe('Celso');
      expect(chain[0].maxLimit).toBe(10000);
    });

    it('deve requerer Celso e Eduardo entre R$ 10.001 e R$ 100.000', () => {
      const chain = getApprovalChainForOrder('VB AGRO', 45000);
      expect(chain).toHaveLength(2);
      expect(chain[0].roleOrName).toBe('Celso');
      expect(chain[1].roleOrName).toBe('Eduardo');
      expect(chain[1].maxLimit).toBe(100000);
    });

    it('deve requerer cadeia completa acima de R$ 100.000 (Celso, Eduardo, Vanessa, JAB, Andressa)', () => {
      const chain = getApprovalChainForOrder('VB AGRO', 200000);
      expect(chain).toHaveLength(5);
      expect(chain[0].roleOrName).toBe('Celso');
      expect(chain[1].roleOrName).toBe('Eduardo');
      expect(chain[2].roleOrName).toBe('Vanessa');
      expect(chain[3].roleOrName).toBe('JAB');
      expect(chain[4].roleOrName).toBe('Andressa');
      expect(chain[4].maxLimit).toBeNull();
    });
  });

  describe('Pedidos de Compra - Imóveis e Igreja', () => {
    it('deve requerer Eduardo até R$ 10.000 em Imóveis e escalar acima', () => {
      const small = getApprovalChainForOrder('LORENA IMÓVEIS', 7000);
      expect(small).toHaveLength(1);
      expect(small[0].roleOrName).toBe('Eduardo');

      const big = getApprovalChainForOrder('LORENA IMÓVEIS', 15000);
      expect(big).toHaveLength(4);
      expect(big[0].roleOrName).toBe('Eduardo');
      expect(big[1].roleOrName).toBe('Vanessa');
    });

    it('deve requerer Jane e Bispo Bruno para Igreja', () => {
      const small = getApprovalChainForOrder('IGREJA PURAFÉ', 500);
      expect(small).toHaveLength(1);
      expect(small[0].roleOrName).toBe('Jane');

      const big = getApprovalChainForOrder('IGREJA PURAFÉ', 1500);
      expect(big).toHaveLength(2);
      expect(big[0].roleOrName).toBe('Jane');
      expect(big[1].roleOrName).toBe('Bispo Bruno');
    });
  });

  describe('isUserEligibleToApprove matcher', () => {
    it('deve autorizar administradores incondicionalmente', () => {
      expect(isUserEligibleToApprove({ role: 'admin' }, 'Vanessa')).toBe(true);
      expect(isUserEligibleToApprove({ scopes: ['admin'] }, 'Henrique')).toBe(true);
    });

    it('deve reconhecer o aprovador por primeiro nome', () => {
      expect(isUserEligibleToApprove({ name: 'Henrique Silva' }, 'Henrique')).toBe(true);
      expect(isUserEligibleToApprove({ name: 'Celso Ferreira' }, 'Celso')).toBe(true);
      expect(isUserEligibleToApprove({ name: 'Paula Santos' }, 'Paula')).toBe(true);
      expect(isUserEligibleToApprove({ name: 'Eduardo Costa' }, 'Eduardo')).toBe(true);
    });

    it('deve reconhecer o aprovador por e-mail ou role', () => {
      expect(isUserEligibleToApprove({ email: 'vanessa@vnmb.com.br' }, 'Vanessa')).toBe(true);
      expect(isUserEligibleToApprove({ roles: ['Bispo Bruno'] }, 'Bispo Bruno')).toBe(true);
    });

    it('deve negar quando o usuário não corresponder à alçada', () => {
      expect(isUserEligibleToApprove({ name: 'João Comprador' }, 'Henrique')).toBe(false);
      expect(isUserEligibleToApprove({ name: 'Paula' }, 'Celso')).toBe(false);
    });
  });
});
