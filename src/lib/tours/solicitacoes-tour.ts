import { TourDefinition } from "@/contexts/TourContext";

export const solicitacoesTour: TourDefinition = {
  id: "solicitacoes-intro",
  steps: [
    {
      target: '[data-tour="solicitacoes-kpis"]',
      title: "Visão Geral de Solicitações 📋",
      description:
        "Acompanhe o funil de demandas sincronizadas do ERP: total de solicitações, prontas para cotação, em andamento e finalizadas.",
      placement: "bottom",
    },
    {
      target: '[data-tour="solicitacoes-search"]',
      title: "Busca Rápida de Demandas",
      description:
        "Localize qualquer solicitação instantaneamente buscando pelo número de SC Corporate, solicitante ou descrição do item.",
      placement: "bottom",
    },
    {
      target: '[data-tour="solicitacoes-filters"]',
      title: "Filtros por Empresa e Status",
      description:
        "Filtre por filial/coligada ou isole por status (Aprovadas, Em Cotação, Finalizadas) para focar nas suas prioridades de compra.",
      placement: "bottom",
    },
    {
      target: '[data-tour="solicitacoes-table"]',
      title: "Lista de Requisições",
      description:
        "Visualize os dados detalhados, centro de custo e local de estoque. Clique em qualquer linha para abrir a gaveta de detalhes rápidos.",
      placement: "top",
    },
  ],
};
