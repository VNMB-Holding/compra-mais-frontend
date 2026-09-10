import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/ui';

describe('Tabs Component', () => {
  const mockTabs = [
    { id: 'todas', label: 'Todas', count: 15 },
    { id: 'abertas', label: 'Abertas', count: 4 },
    { id: 'fechadas', label: 'Fechadas' },
  ];

  it('deve renderizar todas as abas e contadores', () => {
    render(<Tabs tabs={mockTabs} activeTab="todas" onChange={() => {}} />);

    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Abertas')).toBeInTheDocument();
    expect(screen.getByText('Fechadas')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('deve chamar onChange ao clicar em uma aba', () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTab="todas" onChange={handleChange} />);

    fireEvent.click(screen.getByText('Abertas'));
    expect(handleChange).toHaveBeenCalledWith('abertas');
  });

  it('deve destacar visualmente a aba ativa', () => {
    render(
      <Tabs tabs={mockTabs} activeTab="abertas" onChange={() => {}} />
    );

    const abertasTab = screen.getByText('Abertas').closest('[class*="tab"]');
    expect(abertasTab?.className).toContain('active');
  });
});
