import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui';

describe('EmptyState Component', () => {
  it('deve renderizar o título e a descrição', () => {
    render(
      <EmptyState
        title="Nenhum registro encontrado"
        description="Tente ajustar os filtros para encontrar o que procura."
      />
    );

    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
    expect(
      screen.getByText('Tente ajustar os filtros para encontrar o que procura.')
    ).toBeInTheDocument();
  });

  it('deve renderizar e disparar o botão de ação principal', () => {
    const handleAction = vi.fn();

    render(
      <EmptyState
        title="Sem cotações"
        action={{
          label: 'Criar Nova Cotação',
          onClick: handleAction,
        }}
      />
    );

    const actionButton = screen.getByRole('button', { name: /criar nova cotação/i });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar ação secundária quando fornecida', () => {
    const handleSecondary = vi.fn();

    render(
      <EmptyState
        title="Sem solicitações"
        action={{ label: 'Principal', onClick: () => {} }}
        secondaryAction={{ label: 'Voltar ao Início', onClick: handleSecondary }}
      />
    );

    const secondaryButton = screen.getByRole('button', { name: /voltar ao início/i });
    expect(secondaryButton).toBeInTheDocument();

    fireEvent.click(secondaryButton);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });
});
