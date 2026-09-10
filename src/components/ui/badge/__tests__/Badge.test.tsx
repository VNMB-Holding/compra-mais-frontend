import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui';

describe('Badge Component', () => {
  it('deve renderizar o conteúdo do badge', () => {
    render(<Badge>Aprovado</Badge>);
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });

  it('deve aceitar variantes de cor e classe customizada', () => {
    const { container } = render(
      <Badge variant="success" className="badge-custom">
        Sucesso
      </Badge>
    );

    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span?.className).toContain('badge-custom');
  });
});
