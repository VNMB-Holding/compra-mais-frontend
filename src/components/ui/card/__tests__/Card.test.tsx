import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui';

describe('Card Component', () => {
  it('deve renderizar o conteúdo interno', () => {
    render(<Card>Conteúdo do Card</Card>);
    expect(screen.getByText('Conteúdo do Card')).toBeInTheDocument();
  });

  it('deve suportar noPadding', () => {
    const { container } = render(<Card noPadding>Sem padding</Card>);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('noPadding');
  });

  it('deve aceitar className customizada', () => {
    const { container } = render(<Card className="minha-classe">Custom</Card>);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('minha-classe');
  });
});
