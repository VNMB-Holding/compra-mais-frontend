import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpModal } from '@/components/modals';

describe('HelpModal Component', () => {
  it('não deve renderizar quando open = false', () => {
    const { container } = render(<HelpModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar perguntas frequentes quando open = true', () => {
    render(<HelpModal open={true} onClose={() => {}} />);

    expect(screen.getByText('Como cadastrar uma nova RFQ?')).toBeInTheDocument();
    expect(screen.getByText('Como realizar a homologação de um fornecedor?')).toBeInTheDocument();
  });

  it('deve filtrar perguntas ao digitar no campo de busca', () => {
    render(<HelpModal open={true} onClose={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/Busque por termos/i);
    fireEvent.change(searchInput, { target: { value: 'senha' } });

    expect(screen.getByText('Como recuperar ou alterar minha senha de acesso?')).toBeInTheDocument();
    expect(screen.queryByText('Como cadastrar uma nova RFQ?')).not.toBeInTheDocument();
  });

  it('deve disparar onClose ao clicar no botão de fechar', () => {
    const handleClose = vi.fn();
    render(<HelpModal open={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /^fechar$/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
