import { TourDefinition } from "@/contexts/TourContext";

export const pedidosTour: TourDefinition = {
  id: "pedidos-intro",
  steps: [
    {
      target: '[data-tour="pedidos-kpis"]',
      title: "Controle de Pedidos Emitidos 📦",
      description:
        "Acompanhe o volume financeiro total comprometido, pedidos pendentes de entrega e contratos formalizados com fornecedores.",
      placement: "bottom",
    },
    {
      target: '[data-tour="pedidos-toolbar"]',
      title: "Filtros de Pedidos",
      description:
        "Filtre pedidos por fornecedor homologado, filial compradora ou status de faturamento/entrega.",
      placement: "bottom",
    },
    {
      target: '[data-tour="pedidos-table"]',
      title: "Rastreabilidade de Pedidos",
      description:
        "Acompanhe prazos previstos de entrega e clique no pedido para visualizar espelho completo e histórico de aprovações.",
      placement: "top",
    },
  ],
};
