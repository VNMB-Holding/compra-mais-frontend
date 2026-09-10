import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KpiCard } from '@/components/ui';

describe('KpiCard Component', () => {
  it('deve renderizar título e valor corretamente', () => {
    render(
      <KpiCard
        title="Total de Pedidos"
        value="128"
        icon="shopping-cart"
      />
    );

    expect(screen.getByText('Total de Pedidos')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('deve disparar evento de clique quando fornecido', () => {
    const handleClick = vi.fn();
    render(
      <KpiCard
        title="Total em Aberto"
        value="R$ 50.000"
        icon="cash"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('Total em Aberto'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar tendência (trend) se fornecida', () => {
    render(
      <KpiCard
        title="Economia"
        value="R$ 12.000"
        icon="trend-up"
        trend={{ value: '+15%', label: 'vs mês anterior' }}
      />
    );

    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('vs mês anterior')).toBeInTheDocument();
  });
});
