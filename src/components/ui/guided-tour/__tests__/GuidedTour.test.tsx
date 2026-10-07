import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TourProvider, useTourContext, TourDefinition } from "@/contexts/TourContext";
import GuidedTour from "../GuidedTour";

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
      </TourProvider>,
    );

    expect(screen.getByTestId("status").textContent).toBe("Inativo");
    expect(screen.queryByText("Primeiro Passo")).toBeNull();
  });

  it("deve iniciar tour e exibir tooltip do primeiro passo", async () => {
    render(
      <TourProvider>
        <TestConsumer />
        <GuidedTour />
      </TourProvider>,
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
      </TourProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText("Iniciar Tour"));
    });

    const nextBtn = await screen.findByRole("button", { name: /próximo/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    expect(screen.getByTestId("status").textContent).toBe("Passo 2");
    expect(await screen.findByText("Segundo Passo")).toBeDefined();
    expect(screen.getByText("2 de 2")).toBeDefined();

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
      </TourProvider>,
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

  it("deve aplicar as classes corretas de caret para placements left e right", async () => {
    const sideTour: TourDefinition = {
      id: "side-tour",
      steps: [
        {
          target: "#step-1",
          title: "Passo Esquerda",
          description: "Posicionado à esquerda",
          placement: "left",
        },
        {
          target: "#step-2",
          title: "Passo Direita",
          description: "Posicionado à direita",
          placement: "right",
        },
      ],
    };

    function SideConsumer() {
      const { startTour } = useTourContext();
      return (
        <div>
          <div id="step-1" style={{ width: "100px", height: "40px" }}>
            El 1
          </div>
          <div id="step-2" style={{ width: "100px", height: "40px" }}>
            El 2
          </div>
          <button onClick={() => startTour(sideTour)}>Iniciar Side Tour</button>
        </div>
      );
    }

    render(
      <TourProvider>
        <SideConsumer />
        <GuidedTour />
      </TourProvider>,
    );

    const step1El = document.querySelector("#step-1")!;
    vi.spyOn(step1El, "getBoundingClientRect").mockReturnValue({
      top: 100,
      left: 600,
      width: 100,
      height: 40,
      bottom: 140,
      right: 700,
      x: 600,
      y: 100,
      toJSON: () => {},
    });

    const step2El = document.querySelector("#step-2")!;
    vi.spyOn(step2El, "getBoundingClientRect").mockReturnValue({
      top: 100,
      left: 100,
      width: 100,
      height: 40,
      bottom: 140,
      right: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    act(() => {
      fireEvent.click(screen.getByText("Iniciar Side Tour"));
    });

    await screen.findByText("Passo Esquerda");

    const caretEl = document.querySelector('[class*="caret"]');
    expect(caretEl).not.toBeNull();
    expect(caretEl?.className).toMatch(/caretLeft/);

    const nextBtn = await screen.findByRole("button", { name: /próximo/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    await screen.findByText("Passo Direita");

    const secondCaret = document.querySelector('[class*="caret"]');
    expect(secondCaret?.className).toMatch(/caretRight/);
  });
});
