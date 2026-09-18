"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Icon, Button } from "@/components/ui";
import { useTour } from "@/hooks/useTour";
import { 
  dashboardTour, 
  solicitacoesTour, 
  rfqsTour, 
  pedidosTour, 
  fornecedoresTour,
  novaRfqTour 
} from "@/lib/tours";
import styles from "./HelpModal.module.css";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  {
    category: "Processos de Compras",
    question: "Como cadastrar uma nova RFQ?",
    answer: "Acesse 'RFQs / Cotações' no menu lateral de Compras, clique no botão 'Nova RFQ', preencha as especificações do produto/serviço desejado, defina os prazos e submeta a requisição para publicação aos fornecedores cadastrados."
  },
  {
    category: "Fornecedores",
    question: "Como realizar a homologação de um fornecedor?",
    answer: "Vá para a seção 'Fornecedores > Homologação'. Selecione o fornecedor na lista de cadastros pendentes, revise os documentos enviados (CNPJ, Certidões, Contrato Social) e clique em 'Aprovar Cadastro' caso todas as exigências de compliance sejam atendidas."
  },
  {
    category: "Processos de Compras",
    question: "Como iniciar uma nova cotação (RFQ)?",
    answer: "Acesse o menu 'Cotações (RFQs)', clique no botão 'Nova RFQ' no canto superior direito e selecione a solicitação aprovada que deseja cotar. Em seguida, adicione os fornecedores participantes e defina o prazo de resposta."
  },
  {
    category: "Processos de Compras",
    question: "O que acontece após a aprovação de uma solicitação?",
    answer: "Assim que uma solicitação atinge todas as alçadas de aprovação necessárias, ela passa para o status 'Pronta para Cotação'. A equipe de compras poderá então agrupá-la ou vinculá-la diretamente a uma nova RFQ."
  },
  {
    category: "Fornecedores",
    question: "Como convidar um fornecedor que ainda não está cadastrado?",
    answer: "Durante a criação ou edição de uma RFQ, na etapa de seleção de fornecedores, clique no botão 'Convidar Não Cadastrado'. Informe o CNPJ, Razão Social e o e-mail de contato para enviar o link seguro de participação."
  },
  {
    category: "Fornecedores",
    question: "O que significa o Score de Risco no Diretório de Fornecedores?",
    answer: "O Score de Risco (0 a 100) é calculado com base em conformidade cadastral (Receita Federal, certidões negativas), histórico de entregas anteriores e saúde financeira. Notas acima de 70 indicam baixo risco operacional."
  },
  {
    category: "Pedidos & Pagamentos",
    question: "Como visualizar os comprovantes ou notas fiscais de um pedido?",
    answer: "Na tela de detalhes do Pedido de Compra, acesse a aba 'Documentos & Anexos'. Você poderá baixar os arquivos PDF ou XML anexados pelo fornecedor ou pela equipe fiscal."
  },
  {
    category: "Conta & Acesso",
    question: "Como recuperar ou alterar minha senha de acesso?",
    answer: "Se você estiver conectado, acesse 'Meu Perfil' pelo menu do usuário no canto superior direito e use a aba de configurações de segurança. Se não conseguir efetuar login, clique em 'Esqueci minha senha' na página de login do sistema."
  }
];

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { startTour, resetTour } = useTour();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFAQs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const AVAILABLE_TOURS = [
    {
      id: "dashboard-intro",
      title: "Visão Geral (Dashboard)",
      description: "Aprenda a navegar pelos KPIs, cotações e savings",
      icon: "layout-grid-01",
      path: "/dashboard",
      tour: dashboardTour,
    },
    {
      id: "solicitacoes-intro",
      title: "Solicitações de Compra",
      description: "Entenda o funil de demandas e filtros do ERP",
      icon: "file-02",
      path: "/compras/solicitacoes",
      tour: solicitacoesTour,
    },
    {
      id: "rfqs-intro",
      title: "Cotações / RFQs",
      description: "Como criar e gerenciar processos de cotação",
      icon: "hourglass-01",
      path: "/compras/rfqs",
      tour: rfqsTour,
    },
    {
      id: "pedidos-intro",
      title: "Pedidos de Compra",
      description: "Acompanhamento de entregas e contratos",
      icon: "shopping-cart-01",
      path: "/compras/pedidos",
      tour: pedidosTour,
    },
    {
      id: "fornecedores-intro",
      title: "Diretório de Fornecedores",
      description: "Consulta de homologação e scores de parceiros",
      icon: "users-01",
      path: "/fornecedores/diretorio",
      tour: fornecedoresTour,
    },
    {
      id: "nova-rfq-intro",
      title: "Criar Nova Cotação",
      description: "Passo a passo para abrir e publicar uma nova RFQ",
      icon: "plus-circle",
      path: "/compras/rfqs/nova",
      tour: novaRfqTour,
    },
  ];

  const handleLaunchTour = (item: typeof AVAILABLE_TOURS[0]) => {
    onClose();
    resetTour(item.id);
    if (pathname === item.path) {
      setTimeout(() => {
        startTour(item.tour);
      }, 200);
    } else {
      router.push(item.path);
      setTimeout(() => {
        startTour(item.tour);
      }, 800);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalBox}>
        
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconWrap}>
              <Icon name="help-circle" className={styles.headerIcon} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Central de Suporte & Ajuda</h2>
              <p className={styles.modalSubtitle}>
                Encontre respostas rápidas ou entre em contato com nosso time de atendimento.
              </p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Fechar modal">
            <Icon name="x-close" size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          
          <div className={styles.toursSection}>
            <div className={styles.toursHeader}>
              <h3 className={styles.toursTitle}>
                <Icon name="compass" size={18} style={{ color: "#007d79" }} />
                Tutoriais Interativos Guiados
              </h3>
            </div>
            <div className={styles.toursGrid}>
              {AVAILABLE_TOURS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={styles.tourCard}
                  onClick={() => handleLaunchTour(t)}
                >
                  <div className={styles.tourCardLeft}>
                    <div className={styles.tourIconWrap}>
                      <Icon name={t.icon} size={18} />
                    </div>
                    <div className={styles.tourCardInfo}>
                      <span className={styles.tourCardTitle}>{t.title}</span>
                      <span className={styles.tourCardDesc}>{t.description}</span>
                    </div>
                  </div>
                  <Icon name="play" size={16} className={styles.tourActionIcon} />
                </button>
              ))}
            </div>
          </div>

          <hr className={styles.sectionDivider} />
          
          <div className={styles.supportGrid}>
            <a href="https://wa.me/5511986055544?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20Compra%2B" target="_blank" rel="noopener noreferrer" className={styles.supportCard}>
              <div className={styles.supportCardHeader}>
                <div className={`${styles.supportIconWrap} ${styles.whatsappBg}`}>
                  <Icon name="message-square-02" className={styles.supportIcon} />
                </div>
                <strong>WhatsApp Suporte</strong>
              </div>
              <p>Atendimento em tempo real das 08h às 18h.</p>
              <span className={styles.cardAction}>Iniciar conversa <Icon name="arrow-right" size={14} /></span>
            </a>

            <a href="mailto:breno@vnmb.com.br" className={styles.supportCard}>
              <div className={styles.supportCardHeader}>
                <div className={`${styles.supportIconWrap} ${styles.emailBg}`}>
                  <Icon name="mail-01" className={styles.supportIcon} />
                </div>
                <strong>E-mail de Suporte</strong>
              </div>
              <p>Envie sua dúvida e responderemos em até 2 horas.</p>
              <span className={styles.cardAction}>Enviar e-mail <Icon name="arrow-right" size={14} /></span>
            </a>
          </div>

          <hr className={styles.sectionDivider} />

          <div className={styles.faqSection}>
            <h3 className={styles.sectionTitle}>Perguntas Frequentes (FAQ)</h3>

            <div className={styles.searchContainer}>
              <Icon name="search-md" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Busque por termos ou dúvidas (ex: RFQ, alçada, relatórios...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setExpandedIndex(null);
                }}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.accordion}>
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <div
                      key={index}
                      className={`${styles.accordionItem} ${isExpanded ? styles.activeItem : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(index)}
                        className={styles.accordionHeader}
                        aria-expanded={isExpanded}
                      >
                        <span>{faq.question}</span>
                        <Icon
                          name="chevron-down"
                          className={`${styles.chevron} ${isExpanded ? styles.chevronRotate : ""}`}
                        />
                      </button>
                      <div
                        className={styles.accordionCollapse}
                        style={{
                          maxHeight: isExpanded ? "200px" : "0",
                          opacity: isExpanded ? 1 : 0
                        }}
                      >
                        <div className={styles.accordionContent}>
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noResults}>
                  <Icon name="search-md" size={32} className={styles.noResultsIcon} />
                  <p>Nenhum resultado encontrado para &quot;{searchQuery}&quot;.</p>
                  <span>Tente buscar por termos mais genéricos.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
