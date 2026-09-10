import { describe, it, expect } from 'vitest';
import { getApprovalChainForRequest } from '@/features/aprovacoes';

describe('Approval Limits Workflow', () => {
  describe('VB AGRO', () => {
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

  describe('IMÓVEIS / LORENA', () => {
    it('deve limitar primeiro nível a R$ 5.000 (Paula)', () => {
      const chain = getApprovalChainForRequest('LORENA IMÓVEIS', 4000);
      expect(chain).toHaveLength(1);
      expect(chain[0].roleOrName).toBe('Paula');
    });

    it('deve escalar acima de R$ 5.000', () => {
      const chain = getApprovalChainForRequest('LORENA IMÓVEIS', 15000);
      expect(chain.length).toBeGreaterThan(1);
      expect(chain[0].roleOrName).toBe('Paula');
    });
  });

  describe('PURA / IGREJA', () => {
    it('deve limitar primeiro nível a R$ 1.000 (Jane) e segundo nível Bispo Bruno', () => {
      const smallChain = getApprovalChainForRequest('IGREJA DA CIDADE', 800);
      expect(smallChain).toHaveLength(1);
      expect(smallChain[0].roleOrName).toBe('Jane');

      const bigChain = getApprovalChainForRequest('IGREJA DA CIDADE', 2500);
      expect(bigChain).toHaveLength(2);
      expect(bigChain[1].roleOrName).toBe('Bispo Bruno');
      expect(bigChain[1].maxLimit).toBeNull();
    });
  });
});
