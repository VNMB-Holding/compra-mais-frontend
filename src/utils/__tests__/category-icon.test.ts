import { describe, it, expect } from 'vitest';
import {
  CategoryType,
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  getCategoryIcon,
} from '@/lib/utils/category-icon';

describe('Category Icon Utilities', () => {
  it('deve ter ícones mapeados para todos os tipos de enum', () => {
    Object.values(CategoryType).forEach((cat) => {
      expect(CATEGORY_ICON_MAP[cat]).toBeDefined();
      expect(CATEGORY_LABEL_MAP[cat]).toBeDefined();
    });
  });

  it('deve retornar o ícone correto para enum exato', () => {
    expect(getCategoryIcon(CategoryType.IT_SOFTWARE)).toBe('monitor-01');
    expect(getCategoryIcon(CategoryType.FUEL_LUBRICANTS)).toBe('drop');
    expect(getCategoryIcon(CategoryType.SERVICES)).toBe('briefcase-01');
  });

  it('deve inferir ícone a partir de palavras-chave textuais', () => {
    expect(getCategoryIcon('Notebooks e TI')).toBe('monitor-01');
    expect(getCategoryIcon('Diesel e Gasolina')).toBe('drop');
    expect(getCategoryIcon('Frete e Transporte')).toBe('truck-01');
  });

  it('deve retornar folder para categoria vazia ou desconhecida', () => {
    expect(getCategoryIcon()).toBe('folder');
    expect(getCategoryIcon('')).toBe('folder');
    expect(getCategoryIcon('Categoria Inexistente XYZ')).toBe('folder');
  });
});
