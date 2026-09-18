import { TourDefinition } from "@/contexts/TourContext";

function goToRfqStep(step: number, ensureDemandLinked = true) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rfq-tour-set-step", {
        detail: { step, ensureDemandLinked },
      })
    );
  }
}

function resetRfqTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rfq-tour-reset"));
  }
}

export const novaRfqTour: TourDefinition = {
  id: "nova-rfq-intro",
  onTourEnd: resetRfqTour,
  steps: [
    {
      target: '[data-tour="rfq-gate-card"]',
      title: "Vinculação de Demanda Aprovada 🔗",
      description:
        "Toda cotação nasce de uma solicitação de compra aprovada. Os itens, quantidades e especificações técnicas são importados diretamente para garantir integridade e governança.",
      placement: "bottom",
    },
    {
      target: '[data-tour="rfq-gate-select"]',
      title: "Seleção por Código ou Fila",
      description:
        "Selecione uma solicitação no menu de busca ou escolha diretamente um dos cards da fila de demandas prontas para cotação.",
      placement: "bottom",
    },
    {
      target: '[data-tour="rfq-stepper"]',
      title: "Visão Geral do Processo (4 Etapas)",
      description:
        "O processo de abertura é dividido em 4 etapas estruturadas: Parâmetros Gerais, Itens & Quantidades, Fornecedores Convidados e Compliance & Logística.",
      placement: "bottom",
      onBeforeStep: () => goToRfqStep(1, true),
    },
    {
      target: '[data-tour="rfq-step-indicator-1"]',
      title: "Etapa 1: Parâmetros Gerais ⚙️",
      description:
        "Aqui você define a estratégia da cotação (ex: Menor Preço Equalizado, Técnica e Preço), prazo final de resposta e título do processo.",
      placement: "bottom",
      onBeforeStep: () => goToRfqStep(1, true),
    },
    {
      target: '[data-tour="rfq-form-parameters"]',
      title: "Campos de Parâmetros",
      description:
        "Preencha o título e a data/hora limite para recebimento de propostas comerciais pelos fornecedores convidados.",
      placement: "top",
      onBeforeStep: () => goToRfqStep(1, true),
    },
    {
      target: '[data-tour="rfq-step-indicator-2"]',
      title: "Etapa 2: Itens e Quantidades 📦",
      description:
        "Veja os itens importados da demanda original e adicione itens complementares ao escopo se necessário.",
      placement: "bottom",
      onBeforeStep: () => goToRfqStep(2, true),
    },
    {
      target: '[data-tour="rfq-form-items"]',
      title: "Gestão dos Itens da RFQ",
      description:
        "Os itens vindos da solicitação vêm protegidos contra exclusão indevida. Você pode expandir detalhes, editar especificações complementares ou adicionar novos itens.",
      placement: "top",
      onBeforeStep: () => goToRfqStep(2, true),
    },
    {
      target: '[data-tour="rfq-step-indicator-3"]',
      title: "Etapa 3: Seleção de Fornecedores 🏢",
      description:
        "Convide parceiros comerciais homologados ou convide novas empresas externas não cadastradas para participar da concorrência.",
      placement: "bottom",
      onBeforeStep: () => goToRfqStep(3, true),
    },
    {
      target: '[data-tour="rfq-form-suppliers"]',
      title: "Filtro e Convocação de Fornecedores",
      description:
        "Filtre por razão social, CNPJ ou segmento. O sistema valida automaticamente a política de compras exigindo a quantidade mínima de fornecedores conforme o valor da demanda.",
      placement: "top",
      onBeforeStep: () => goToRfqStep(3, true),
    },
    {
      target: '[data-tour="rfq-step-indicator-4"]',
      title: "Etapa 4: Compliance e Logística 📜",
      description:
        "Equalize o processo estipulando termos comerciais claros de frete, pagamento e moeda base antes da publicação.",
      placement: "bottom",
      onBeforeStep: () => goToRfqStep(4, true),
    },
    {
      target: '[data-tour="rfq-form-compliance"]',
      title: "Condições Comerciais e Requisitos",
      description:
        "Defina o Incoterm (CIF, FOB ou EXW), as condições de pagamento (ex: 30 dias DDL), moeda base e requisitos técnicos essenciais.",
      placement: "top",
      onBeforeStep: () => goToRfqStep(4, true),
    },
    {
      target: '[data-tour="rfq-btn-publish"]',
      title: "Publicar ou Salvar Rascunho 🚀",
      description:
        "Você pode salvar o rascunho a qualquer momento para continuar depois, ou publicar a RFQ para enviar convites formais imediatos a todos os fornecedores selecionados.",
      placement: "top",
      onBeforeStep: () => goToRfqStep(4, true),
    },
  ],
};
