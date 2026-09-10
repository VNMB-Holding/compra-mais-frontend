import { describe, it, expect } from 'vitest';
import {
  createSolicitacaoSchema,
  solicitacaoItemSchema,
} from '@/features/solicitacoes';

describe('Solicitação Zod Schemas', () => {
  describe('solicitacaoItemSchema', () => {
    it('deve validar um item correto', () => {
      const validItem = {
        description: 'Notebook Dell Latitude',
        quantity: 5,
        unit: 'UN',
        estimatedUnitPrice: 4500,
        costCenter: 'TI - 01',
      };

      const result = solicitacaoItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('deve falhar se a quantidade for menor ou igual a zero', () => {
      const invalidItem = {
        description: 'Mouse Óptico',
        quantity: 0,
        unit: 'UN',
        costCenter: 'TI - 01',
      };

      const result = solicitacaoItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('A quantidade deve ser maior que zero');
      }
    });

    it('deve falhar se a descrição tiver menos de 3 caracteres', () => {
      const invalidItem = {
        description: 'AB',
        quantity: 1,
        unit: 'UN',
        costCenter: 'TI - 01',
      };

      const result = solicitacaoItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('createSolicitacaoSchema', () => {
    const baseValidRequest = {
      description: 'Aquisição de equipamentos de TI para novas contratações',
      justification: 'Necessário para os colaboradores que iniciarão no próximo mês',
      estimatedBudget: 22500,
      deliveryLocation: 'Sede VB Agro - SP',
      deadline: '2026-10-15',
      priority: 'High' as const,
      items: [
        {
          description: 'Notebook Dell Latitude',
          quantity: 5,
          unit: 'UN',
          costCenter: 'TI - 01',
        },
      ],
    };

    it('deve validar uma solicitação completa e válida', () => {
      const result = createSolicitacaoSchema.safeParse(baseValidRequest);
      expect(result.success).toBe(true);
    });

    it('deve falhar se a lista de itens estiver vazia', () => {
      const invalidRequest = {
        ...baseValidRequest,
        items: [],
      };

      const result = createSolicitacaoSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('pelo menos 1 item');
      }
    });

    it('deve falhar se a justificativa tiver menos de 10 caracteres', () => {
      const invalidRequest = {
        ...baseValidRequest,
        justification: 'Curta',
      };

      const result = createSolicitacaoSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('deve falhar se o orçamento for negativo', () => {
      const invalidRequest = {
        ...baseValidRequest,
        estimatedBudget: -100,
      };

      const result = createSolicitacaoSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});
