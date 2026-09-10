import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalModal } from '@/components/modals';

describe('ApprovalModal Component', () => {
  it('deve renderizar dados da solicitação aprovada', () => {
    render(
      <ApprovalModal
        title="Compra de Maquinário"
        code="SOL-2026-001"
        totalValue={150000}
        priority="High"
        priorityLabel="Alta"
        onGoToList={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Solicitação enviada para aprovação!')).toBeInTheDocument();
    expect(screen.getByText('SOL-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('deve acionar callbacks ao clicar nos botões de ação', () => {
    const handleGoToList = vi.fn();
    const handleClose = vi.fn();

    render(
      <ApprovalModal
        title="Compra de Notebooks"
        code="SOL-888"
        totalValue={25000}
        priority="Medium"
        onGoToList={handleGoToList}
        onClose={handleClose}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Entendido, ir para minhas solicitações/i })
    );
    expect(handleGoToList).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('dialog'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
