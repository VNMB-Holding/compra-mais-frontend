import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from '@/components/ui';

describe('SearchInput Component', () => {
  it('deve renderizar o input de busca com placeholder', () => {
    render(<SearchInput placeholder="Buscar fornecedor..." />);
    expect(screen.getByPlaceholderText('Buscar fornecedor...')).toBeInTheDocument();
  });

  it('deve disparar onSearch ao digitar', () => {
    const handleSearch = vi.fn();
    render(<SearchInput onSearch={handleSearch} placeholder="Buscar..." />);

    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'parafusos' } });

    expect(handleSearch).toHaveBeenCalledWith('parafusos');
  });
});
