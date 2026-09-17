import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TourProvider, useTourContext, TourDefinition } from "@/contexts/TourContext";
import GuidedTour from "../GuidedTour";

// Mock Tour Definition
const mockTour: TourDefinition = {
  id: "test-tour",
  steps: [
    {
      target: "#step-1",
      title: "Primeiro Passo",
      description: "Explicação do primeiro passo.",
      placement: "bottom",
    },
    {
      target: "#step-2",
      title: "Segundo Passo",
      description: "Explicação do segundo passo.",
      placement: "top",
    },
  ],
};

function TestConsumer() {
  const { startTour, isActive, currentStep, endTour } = useTourContext();
  return (
    <div>
      <div id="step-1" style={{ width: "100px", height: "40px" }}>
        Elemento 1
      </div>
      <div id="step-2" style={{ width: "100px", height: "40px" }}>
        Elemento 2
      </div>
      <button onClick={() => startTour(mockTour)}>Iniciar Tour</button>
      <button onClick={endTour}>Finalizar Tour</button>
      <span data-testid="status">{isActive ? `Passo ${currentStep + 1}` : "Inativo"}</span>
    </div>
  );
}

describe("GuidedTour Component & TourContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("não deve renderizar tooltip se tour estiver inativo", () => {
    render(
      <TourProvider>
        <TestConsumer />
        <GuidedTour />
      </TourProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("Inativo");
    expect(screen.queryByText("Primeiro Passo")).toBeNull();
  });

  it("deve iniciar tour e exibir tooltip do primeiro passo", async () => {
    render(
      <TourProvider>
        <TestConsumer />
        <GuidedTour />
      </TourProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Iniciar Tour"));
    });

    expect(screen.getByTestId("status").textContent).toBe("Passo 1");
    expect(await screen.findByText("Primeiro Passo")).toBeDefined();
    expect(screen.getByText("Explicação do primeiro passo.")).toBeDefined();
    expect(screen.getByText("1 de 2")).toBeDefined();
  });

  it("deve avançar passos e concluir o tour", async () => {
    render(
      <TourProvider>
        <TestConsumer />
        <GuidedTour />
      </TourProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Iniciar Tour"));
    });

    // Próximo
    const nextBtn = await screen.findByRole("button", { name: /próximo/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    expect(screen.getByTestId("status").textContent).toBe("Passo 2");
    expect(await screen.findByText("Segundo Passo")).toBeDefined();
    expect(screen.getByText("2 de 2")).toBeDefined();

    // Botão Concluir no último passo
    const finishBtn = screen.getByRole("button", { name: /concluir/i });
    act(() => {
      fireEvent.click(finishBtn);
    });

    expect(screen.getByTestId("status").textContent).toBe("Inativo");
    expect(localStorage.getItem("compra-tour-done-test-tour")).toBe("1");
  });

  it("deve permitir pular o tutorial", async () => {
    render(
      <TourProvider>
        <TestConsumer />
        <GuidedTour />
      </TourProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Iniciar Tour"));
    });

    const skipBtn = await screen.findByText("Pular tutorial");
    act(() => {
      fireEvent.click(skipBtn);
    });

    expect(screen.getByTestId("status").textContent).toBe("Inativo");
    expect(localStorage.getItem("compra-tour-done-test-tour")).toBe("1");
  });
});
