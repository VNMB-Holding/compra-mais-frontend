import { describe, it, expect } from 'vitest';
import {
  isUuid,
  formatCurrency,
  formatUserDisplayName,
  formatSupplierDisplayName,
  formatMonthLabel,
} from '@/utils';

describe('Format Display Utilities', () => {
  describe('isUuid', () => {
    it('deve validar UUIDs válidos v4', () => {
      expect(isUuid('c0b2d6a5-7140-4b82-8353-832f0d9c02d1')).toBe(true);
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('deve invalidar strings que não são UUIDs', () => {
      expect(isUuid('usuario-normal')).toBe(false);
      expect(isUuid('')).toBe(false);
      expect(isUuid(null)).toBe(false);
      expect(isUuid(undefined)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores monetários em padrão BRL', () => {
      const formatted = formatCurrency(1500.5).replace(/\u00a0/g, ' ');
      expect(formatted).toBe('R$ 1.500,50');
    });

    it('deve formatar valor zero', () => {
      const formatted = formatCurrency(0).replace(/\u00a0/g, ' ');
      expect(formatted).toBe('R$ 0,00');
    });

    it('deve lidar com null, undefined ou NaN retornando R$ 0,00', () => {
      expect(formatCurrency(null).replace(/\u00a0/g, ' ')).toBe('R$ 0,00');
      expect(formatCurrency(undefined).replace(/\u00a0/g, ' ')).toBe('R$ 0,00');
      expect(formatCurrency(NaN).replace(/\u00a0/g, ' ')).toBe('R$ 0,00');
    });

    it('deve formatar números negativos', () => {
      const formatted = formatCurrency(-50).replace(/\u00a0/g, ' ');
      expect(formatted).toContain('50,00');
    });
  });

  describe('formatUserDisplayName', () => {
    it('deve priorizar o nome do fallbackUser', () => {
      expect(formatUserDisplayName('qualquer-coisa', { name: 'João Silva' })).toBe('João Silva');
    });

    it('deve usar o email se rawNameOrId for um UUID e não houver nome', () => {
      const uuid = 'c0b2d6a5-7140-4b82-8353-832f0d9c02d1';
      expect(formatUserDisplayName(uuid, { email: 'joao@empresa.com' })).toBe('joao@empresa.com');
    });

    it('deve retornar o próprio valor se não for UUID', () => {
      expect(formatUserDisplayName('Carlos')).toBe('Carlos');
    });

    it('deve retornar traço para valores vazios', () => {
      expect(formatUserDisplayName('')).toBe('—');
      expect(formatUserDisplayName(null)).toBe('—');
    });
  });

  describe('formatSupplierDisplayName', () => {
    it('deve retornar o nome se for uma string comum', () => {
      expect(formatSupplierDisplayName('Fornecedor ABC')).toBe('Fornecedor ABC');
    });

    it('deve usar fallbackName se for UUID', () => {
      const uuid = 'c0b2d6a5-7140-4b82-8353-832f0d9c02d1';
      expect(formatSupplierDisplayName(uuid, 'Fornecedor Real')).toBe('Fornecedor Real');
    });
  });

  describe('formatMonthLabel', () => {
    it('deve traduzir meses em inglês para português', () => {
      expect(formatMonthLabel('jan')).toBe('Jan');
      expect(formatMonthLabel('feb')).toBe('Fev');
      expect(formatMonthLabel('aug')).toBe('Ago');
    });

    it('deve tratar rótulos compostos como jan/2026', () => {
      expect(formatMonthLabel('jan/2026')).toBe('Jan/2026');
    });
  });
});
