import { TourDefinition } from "@/contexts/TourContext";

export const rfqsTour: TourDefinition = {
  id: "rfqs-intro",
  steps: [
    {
      target: '[data-tour="rfqs-new-btn"]',
      title: "Criar Nova Cotação (RFQ) ⚡",
      description:
        "Inicie uma nova rodada de cotação com múltiplos fornecedores a partir das solicitações aprovadas.",
      placement: "bottom",
    },
    {
      target: '[data-tour="rfqs-kpis"]',
      title: "Painel de Indicadores de RFQs",
      description:
        "Monitore cotações abertas no prazo, propostas já recebidas dos fornecedores e processos concluídos com sucesso.",
      placement: "bottom",
    },
    {
      target: '[data-tour="rfqs-toolbar"]',
      title: "Pesquisa e Segmentação",
      description:
        "Encontre cotações específicas ou filtre por empresa e status para gerenciar prazos de resposta dos fornecedores.",
      placement: "bottom",
    },
    {
      target: '[data-tour="rfqs-table"]',
      title: "Mapa de Cotações",
      description:
        "Acompanhe data de encerramento e status. Clique em qualquer cotação para equalizar propostas, enviar convites ou encerrar a rodada.",
      placement: "top",
    },
  ],
};
