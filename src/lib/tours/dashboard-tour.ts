import { TourDefinition } from "@/contexts/TourContext";

export const dashboardTour: TourDefinition = {
  id: "dashboard-intro",
  steps: [
    {
      target: '[data-tour="hero-banner"]',
      title: "Bem-vindo ao Compra+ 👋",
      description:
        "Este é o seu painel de controle. Aqui você acompanha KPIs, cotações urgentes e a performance de compras de todas as empresas do grupo.",
      placement: "bottom",
    },
    {
      target: '[data-tour="company-filter"]',
      title: "Filtro por Empresa",
      description:
        "Selecione uma empresa específica para visualizar os indicadores isolados ou mantenha \"Todas\" para o consolidado do grupo.",
      placement: "bottom",
    },
    {
      target: '[data-tour="kpi-grid"]',
      title: "Indicadores-Chave (KPIs)",
      description:
        "Acompanhe em tempo real: RFQs em andamento, economia acumulada, pedidos emitidos e fornecedores ativos. Clique em qualquer card para ir ao detalhe.",
      placement: "bottom",
    },
    {
      target: '[data-tour="urgent-quote"]',
      title: "Cotação Mais Urgente",
      description:
        "Este card destaca a cotação com prazo mais apertado. Fique atento para não perder o encerramento!",
      placement: "right",
    },
    {
      target: '[data-tour="economy-chart"]',
      title: "Evolução de Savings",
      description:
        "Gráfico mensal da economia gerada pelas suas negociações. Use para reportar resultados à diretoria.",
      placement: "left",
    },
    {
      target: '[data-tour="rfq-table"]',
      title: "Painel de Cotações",
      description:
        "Tabela com todas as RFQs ativas. Use as abas para filtrar por status e clique em qualquer linha para abrir os detalhes.",
      placement: "top",
    },
  ],
};
