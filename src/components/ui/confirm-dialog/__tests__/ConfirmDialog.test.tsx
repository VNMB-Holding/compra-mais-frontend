import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui';

describe('ConfirmDialog Component', () => {
  it('não deve renderizar nada quando open = false', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Deseja excluir?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar título e botões quando open = true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Deseja excluir este item?"
        message="Esta ação é irreversível."
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Deseja excluir este item?')).toBeInTheDocument();
    expect(screen.getByText('Esta ação é irreversível.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sim, excluir/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('deve disparar onConfirm e onCancel nos cliques dos respectivos botões', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Confirmação"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
