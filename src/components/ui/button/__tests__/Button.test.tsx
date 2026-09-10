import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui';

describe('Button Component', () => {
  it('deve renderizar o texto do botão corretamente', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button', { name: /clique aqui/i })).toBeInTheDocument();
  });

  it('deve disparar o evento onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Enviar</Button>);

    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('não deve disparar onClick quando estiver desabilitado', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Desabilitado</Button>);

    const button = screen.getByRole('button', { name: /desabilitado/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('deve aceitar classes customizadas adicionais', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button', { name: /custom/i });
    expect(button.className).toContain('custom-class');
  });
});
