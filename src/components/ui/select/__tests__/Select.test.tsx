import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "@/components/ui";

describe("Select Component", () => {
  const mockOptions = [
    { label: "Opção 1", value: "1" },
    { label: "Opção 2", value: "2" },
    { label: "Opção 3", value: "3" },
  ];

  it("deve exibir o placeholder quando nenhum valor estiver selecionado", () => {
    render(
      <Select options={mockOptions} value="" onChange={() => {}} placeholder="Escolha uma opção" />,
    );

    expect(screen.getByText("Escolha uma opção")).toBeInTheDocument();
  });

  it("deve exibir o label da opção selecionada", () => {
    render(<Select options={mockOptions} value="2" onChange={() => {}} />);

    expect(screen.getByText("Opção 2")).toBeInTheDocument();
  });

  it("deve abrir o menu de opções ao clicar no trigger e selecionar uma opção", () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} value="1" onChange={handleChange} />);

    fireEvent.click(screen.getByText("Opção 1"));

    expect(screen.getByText("Opção 3")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Opção 3"));

    expect(handleChange).toHaveBeenCalledWith("3");
  });

  it("não deve abrir o menu quando desabilitado", () => {
    render(<Select options={mockOptions} value="1" onChange={() => {}} disabled />);

    fireEvent.click(screen.getByText("Opção 1"));
    expect(screen.queryByText("Opção 3")).not.toBeInTheDocument();
  });
  it("deve exibir busca e paginação quando houver muitas opções", () => {
    const manyOptions = Array.from({ length: 12 }, (_, index) => ({
      label: `Opção ${index + 1}`,
      value: String(index + 1),
    }));

    render(<Select options={manyOptions} value="1" onChange={() => {}} />);

    fireEvent.click(screen.getByText("Opção 1"));

    expect(screen.getByPlaceholderText("Buscar opção...")).toBeInTheDocument();
    expect(screen.getByText("1-8 de 12")).toBeInTheDocument();
    expect(screen.queryByText("Opção 9")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Próxima página"));
    expect(screen.getByText("Opção 9")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Buscar opção..."), { target: { value: "12" } });
    expect(screen.getByText("Opção 12")).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();
  });
});
