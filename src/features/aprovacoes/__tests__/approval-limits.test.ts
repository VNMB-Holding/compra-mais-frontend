import { describe, it, expect } from 'vitest';
import { getApprovalChainForRequest, getApprovalChainForOrder, isUserEligibleToApprove } from '@/features/aprovacoes';

describe('Approval Limits Workflow', () => {
  const dynamicRulesVB = [
    { id: '1', companyCode: '2313', flowType: 'solicitacao' as const, level: 1, minAmount: 0, maxAmount: 10000, approverType: 'user' as const, approverIdentifier: 'henrique', approverName: 'Henrique', active: true, order: 1 },
    { id: '2', companyCode: '2313', flowType: 'solicitacao' as const, level: 2, minAmount: 10000.01, maxAmount: 100000, approverType: 'user' as const, approverIdentifier: 'celso', approverName: 'Celso', active: true, order: 2 },
    { id: '3', companyCode: '2313', flowType: 'solicitacao' as const, level: 3, minAmount: 100000.01, maxAmount: null, approverType: 'user' as const, approverIdentifier: 'vanessa', approverName: 'Vanessa', active: true, order: 3 },
  ];

  describe('Requisições - Dinâmico sem fallback estático', () => {
    it('deve retornar array vazio se não houver regras cadastradas (sem nomes hardcoded)', () => {
      const chain = getApprovalChainForRequest('VB AGRO', 5000);
      expect(chain).toEqual([]);
    });

    it('deve calcular níveis dinamicamente a partir das regras cadastradas', () => {
      const chainSmall = getApprovalChainForRequest('VB AGRO', 5000, dynamicRulesVB);
      expect(chainSmall).toHaveLength(1);
      expect(chainSmall[0].roleOrName).toBe('Henrique');

      const chainMedium = getApprovalChainForRequest('VB AGRO', 50000, dynamicRulesVB);
      expect(chainMedium).toHaveLength(2);
      expect(chainMedium[0].roleOrName).toBe('Henrique');
      expect(chainMedium[1].roleOrName).toBe('Celso');
    });

    it('deve respeitar alterações nas regras (ex: alterar aprovador no banco reflete na cadeia)', () => {
      const updatedRules = dynamicRulesVB.map((r) =>
        r.level === 1 ? { ...r, approverName: 'João Gestor', approverIdentifier: 'joao' } : r
      );
      const chain = getApprovalChainForRequest('VB AGRO', 5000, updatedRules);
      expect(chain).toHaveLength(1);
      expect(chain[0].roleOrName).toBe('João Gestor');
    });
  });

  describe('Pedidos - Dinâmico sem fallback estático', () => {
    const dynamicRulesPO = [
      { id: '10', companyCode: '2313', flowType: 'pedido' as const, level: 1, minAmount: 0, maxAmount: 50000, approverType: 'user' as const, approverIdentifier: 'andressa', approverName: 'Andressa', active: true, order: 1 },
      { id: '11', companyCode: '2313', flowType: 'pedido' as const, level: 2, minAmount: 50000.01, maxAmount: null, approverType: 'user' as const, approverIdentifier: 'diretoria', approverName: 'Diretoria Executiva', active: true, order: 2 },
    ];

    it('deve retornar array vazio se não houver regras para pedido', () => {
      const chain = getApprovalChainForOrder('VB AGRO', 25000);
      expect(chain).toEqual([]);
    });

    it('deve calcular cadeia de aprovação de pedido conforme regras cadastradas', () => {
      const chain = getApprovalChainForOrder('VB AGRO', 75000, dynamicRulesPO);
      expect(chain).toHaveLength(2);
      expect(chain[0].roleOrName).toBe('Andressa');
      expect(chain[1].roleOrName).toBe('Diretoria Executiva');
    });
  });

  describe('isUserEligibleToApprove matcher', () => {
    it('deve autorizar administradores incondicionalmente', () => {
      expect(isUserEligibleToApprove({ role: 'admin' }, 'Vanessa')).toBe(true);
      expect(isUserEligibleToApprove({ scopes: ['admin'] }, 'Henrique')).toBe(true);
    });

    it('deve reconhecer o aprovador por correspondência de nome exato ou e-mail/role', () => {
      expect(isUserEligibleToApprove({ name: 'Henrique' }, 'Henrique')).toBe(true);
      expect(isUserEligibleToApprove({ email: 'vanessa@vnmb.com.br' }, 'vanessa@vnmb.com.br')).toBe(true);
      expect(isUserEligibleToApprove({ roles: ['Bispo Bruno'] }, 'Bispo Bruno')).toBe(true);
    });

    it('NÃO deve autorizar apenas por semelhança de primeiro nome', () => {
      expect(isUserEligibleToApprove({ name: 'Henrique Silva' }, 'Henrique Costa')).toBe(false);
      expect(isUserEligibleToApprove({ name: 'Paula Santos' }, 'Paula Oliveira')).toBe(false);
    });

    it('deve negar quando o usuário não corresponder à alçada', () => {
      expect(isUserEligibleToApprove({ name: 'João Comprador' }, 'Henrique')).toBe(false);
      expect(isUserEligibleToApprove({ name: 'Paula' }, 'Celso')).toBe(false);
    });

    it('deve lidar de forma insensível a maiúsculas/minúsculas para e-mail e identificadores', () => {
      expect(isUserEligibleToApprove({ email: 'VANESSA@VNMB.COM.BR' }, 'vanessa@vnmb.com.br')).toBe(true);
      expect(isUserEligibleToApprove({ email: 'carlos@empresa.com' }, 'CARLOS@EMPRESA.COM')).toBe(true);
    });

    it('deve negar acesso se o usuário for nulo ou indefinido', () => {
      expect(isUserEligibleToApprove(null, 'Henrique')).toBe(false);
      expect(isUserEligibleToApprove(undefined, 'Henrique')).toBe(false);
    });
  });

  describe('Cenários de Fronteira e Inatividade (Boundary & Inactive Rules)', () => {
    const mixedRules = [
      { id: '1', companyCode: '2313', flowType: 'solicitacao' as const, level: 1, minAmount: 0, maxAmount: 1000, approverType: 'user' as const, approverIdentifier: 'aprovador-ativo', approverName: 'Aprovador Ativo', active: true, order: 1 },
      { id: '2', companyCode: '2313', flowType: 'solicitacao' as const, level: 1, minAmount: 0, maxAmount: 1000, approverType: 'user' as const, approverIdentifier: 'aprovador-inativo', approverName: 'Aprovador Inativo', active: false, order: 2 },
      { id: '3', companyCode: '2313', flowType: 'solicitacao' as const, level: 2, minAmount: 1000.01, maxAmount: 5000, approverType: 'user' as const, approverIdentifier: 'aprovador-n2', approverName: 'Aprovador N2', active: true, order: 1 },
    ];

    it('deve ignorar regras com active === false', () => {
      const chain = getApprovalChainForRequest('VB AGRO', 500, mixedRules);
      expect(chain).toHaveLength(1);
      expect(chain[0].roleOrName).toBe('Aprovador Ativo');
      expect(chain.some((l) => l.roleOrName === 'Aprovador Inativo')).toBe(false);
    });

    it('deve lidar corretamente com valor exatamente no limite superior (border limit)', () => {
      const chainBorder = getApprovalChainForRequest('VB AGRO', 1000, mixedRules);
      expect(chainBorder).toHaveLength(1);
      expect(chainBorder[0].roleOrName).toBe('Aprovador Ativo');

      const chainExceeded = getApprovalChainForRequest('VB AGRO', 1000.01, mixedRules);
      expect(chainExceeded).toHaveLength(2);
      expect(chainExceeded[1].roleOrName).toBe('Aprovador N2');
    });

    it('deve retornar array vazio se o valor for zero e não houver faixa cobrindo zero', () => {
      const positiveRulesOnly = [
        { id: '1', companyCode: '2313', flowType: 'solicitacao' as const, level: 1, minAmount: 100, maxAmount: 1000, approverType: 'user' as const, approverIdentifier: 'aprovador-100', approverName: 'Aprovador 100', active: true, order: 1 },
      ];
      const chain = getApprovalChainForRequest('VB AGRO', 50, positiveRulesOnly);
      expect(chain).toHaveLength(0);
    });

    it('não deve incluir aprovadores de faixas inferiores quando a faixa tiver sua própria alçada nível 1', () => {
      const discreteRangeRules = [
        { id: 'f1-1', companyCode: '2345', flowType: 'solicitacao' as const, level: 1, minAmount: 0, maxAmount: 10000, approverType: 'user' as const, approverIdentifier: 'coord', approverName: 'Coordenador', active: true, order: 1 },
        { id: 'f2-1', companyCode: '2345', flowType: 'solicitacao' as const, level: 1, minAmount: 10000.01, maxAmount: 50000, approverType: 'user' as const, approverIdentifier: 'gerente', approverName: 'Gerente da Filial', active: true, order: 1 },
        { id: 'f2-2', companyCode: '2345', flowType: 'solicitacao' as const, level: 2, minAmount: 10000.01, maxAmount: 50000, approverType: 'user' as const, approverIdentifier: 'diretor', approverName: 'Diretor de Operações', active: true, order: 2 },
        { id: 'f3-1', companyCode: '2345', flowType: 'solicitacao' as const, level: 1, minAmount: 50000.01, maxAmount: null, approverType: 'user' as const, approverIdentifier: 'ceo', approverName: 'Diretoria Executiva', active: true, order: 1 },
      ];

      const chain25k = getApprovalChainForRequest('Vargem Grande', 25000, discreteRangeRules);
      expect(chain25k).toHaveLength(2);
      expect(chain25k.map((l) => l.roleOrName)).toEqual(['Gerente da Filial', 'Diretor de Operações']);
      expect(chain25k.some((l) => l.roleOrName === 'Coordenador')).toBe(false);

      const chain80k = getApprovalChainForRequest('Vargem Grande', 80000, discreteRangeRules);
      expect(chain80k).toHaveLength(1);
      expect(chain80k[0].roleOrName).toBe('Diretoria Executiva');
    });

    it('deve priorizar regras da empresa específica e não vazar aprovadores de outras empresas', () => {
      const multiCompanyRules = [
        { id: 'c1', companyCode: '2313', flowType: 'solicitacao' as const, level: 1, minAmount: 0, maxAmount: null, approverType: 'user' as const, approverIdentifier: 'matriz-user', approverName: 'Aprovador Matriz', active: true, order: 1 },
        { id: 'c2', companyCode: '2345', flowType: 'solicitacao' as const, level: 1, minAmount: 0, maxAmount: null, approverType: 'user' as const, approverIdentifier: 'vba-user', approverName: 'Aprovador Vargem Grande', active: true, order: 1 },
      ];

      const chainVBA = getApprovalChainForRequest('Vargem Grande', 5000, multiCompanyRules);
      expect(chainVBA).toHaveLength(1);
      expect(chainVBA[0].roleOrName).toBe('Aprovador Vargem Grande');
      expect(chainVBA.some((l) => l.roleOrName === 'Aprovador Matriz')).toBe(false);
    });
  });
});
