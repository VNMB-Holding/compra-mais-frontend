import { TourDefinition } from "@/contexts/TourContext";

export const fornecedoresTour: TourDefinition = {
  id: "fornecedores-intro",
  steps: [
    {
      target: '[data-tour="fornecedores-kpis"]',
      title: "Indicadores de Fornecedores 🏢",
      description:
        "Consulte parceiros homologados, em processo de certificação e a média de pontuação de performance dos seus fornecedores.",
      placement: "bottom",
    },
    {
      target: '[data-tour="fornecedores-toolbar"]',
      title: "Busca e Filtro por Praça",
      description:
        "Encontre parceiros comerciais filtrando por segmento de atuação, cidade/estado e status no ERP.",
      placement: "bottom",
    },
    {
      target: '[data-tour="fornecedores-table"]',
      title: "Diretório Completo",
      description:
        "Acesse contatos comerciais, CNPJ, avaliação e histórico de fornecimento clicando em qualquer parceiro da lista.",
      placement: "top",
    },
  ],
};
