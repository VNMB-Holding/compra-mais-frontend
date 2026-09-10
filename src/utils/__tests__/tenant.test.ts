import { describe, it, expect } from 'vitest';
import {
  isVnmbUser,
  getCompanyFilterOptions,
  getPrimaryCompanyOptions,
  getBranchCompanyOptions,
  getTenantDisplayName,
  formatCorporateBranch,
} from '@/utils';

describe('Tenant Utilities', () => {
  describe('isVnmbUser', () => {
    it('deve retornar true por padrão', () => {
      expect(isVnmbUser(null)).toBe(true);
    });
  });

  describe('getCompanyFilterOptions', () => {
    it('deve incluir a opção TODAS no início', () => {
      const options = getCompanyFilterOptions();
      expect(options.length).toBeGreaterThan(1);
      expect(options[0]).toEqual({
        label: 'Unidade: Todas as Unidades',
        value: 'TODAS',
      });
    });

    it('todas as opções devem conter label e value válidos', () => {
      const options = getCompanyFilterOptions();
      options.forEach((opt) => {
        expect(opt.label).toBeDefined();
        expect(opt.value).toBeDefined();
      });
    });
  });

  describe('getPrimaryCompanyOptions', () => {
    it('deve identificar a matriz pelo código 2313', () => {
      const options = getPrimaryCompanyOptions();
      const matriz = options.find((opt) => opt.code === '2313');
      expect(matriz).toBeDefined();
      expect(matriz?.type).toBe('Matriz');
    });

    it('as demais unidades devem ser filiais', () => {
      const options = getPrimaryCompanyOptions();
      const filiais = options.filter((opt) => opt.code !== '2313');
      expect(filiais.length).toBeGreaterThan(0);
      filiais.forEach((f) => {
        expect(f.type).toBe('Filial');
      });
    });
  });

  describe('getBranchCompanyOptions', () => {
    it('deve filtrar pela empresa selecionada quando informada', () => {
      const options = getBranchCompanyOptions(null, '01');
      expect(options.every((opt) => opt.code === '01')).toBe(true);
    });

    it('não deve incluir a matriz quando sem seleção específica', () => {
      const options = getBranchCompanyOptions();
      expect(options.some((opt) => opt.code === '2313')).toBe(false);
    });
  });

  describe('getTenantDisplayName', () => {
    it('deve retornar VB AGRO LTDA para tenant vazio ou TODAS', () => {
      expect(getTenantDisplayName()).toBe('VB AGRO LTDA');
      expect(getTenantDisplayName('TODAS')).toBe('VB AGRO LTDA');
    });

    it('deve retornar VB AGRO LTDA quando o ID contiver VNMB', () => {
      expect(getTenantDisplayName('VNMB-HOLDING')).toBe('VB AGRO LTDA');
    });
  });

  describe('formatCorporateBranch', () => {
    it('deve retornar fallback padrão quando nenhum parâmetro é passado', () => {
      expect(formatCorporateBranch()).toBe('VB AGRO LTDA');
    });

    it('deve formatar coligada e filial quando não encontrar branch mapeado', () => {
      expect(formatCorporateBranch(999, 888)).toBe('Coligada 999 / Filial 888');
    });
  });
});
