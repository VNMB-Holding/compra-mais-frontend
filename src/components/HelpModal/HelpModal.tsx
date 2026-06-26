"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon/Icon";
import { Button } from "@/components/ui";
import styles from "./HelpModal.module.css";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Como cadastrar uma nova RFQ?",
    answer: "Acesse 'RFQs / Cotações' no menu lateral de Compras, clique no botão 'Nova RFQ', preencha as especificações do produto/serviço desejado, defina os prazos e submeta a requisição para publicação aos fornecedores cadastrados."
  },
  {
    question: "Como realizar a homologação de um fornecedor?",
    answer: "Vá para a seção 'Fornecedores > Homologação'. Selecione o fornecedor na lista de cadastros pendentes, revise os documentos enviados (CNPJ, Certidões, Contrato Social) e clique em 'Aprovar Cadastro' caso todas as exigências de compliance sejam atendidas."
  },
  {
    question: "Quais são as regras e limites de alçada de aprovação?",
    answer: "Os limites de alçada definem qual perfil de usuário (Comprador, Gerente, Diretor) pode autorizar pedidos de compra com base no valor total. Estas configurações podem ser visualizadas e gerenciadas no painel de 'Administração' por usuários com perfil Administrador."
  },
  {
    question: "Como exportar relatórios de Spend e Economia?",
    answer: "No menu lateral, clique em 'Analytics > Análise de Spend' ou 'Economia Gerada'. Utilize os filtros de período e departamento conforme necessário e clique no botão 'Exportar' no canto superior direito para fazer o download dos dados em formato CSV/Excel."
  },
  {
    question: "Como recuperar ou alterar minha senha de acesso?",
    answer: "Se você estiver conectado, acesse 'Meu Perfil' pelo menu do usuário no canto superior direito e use a aba de configurações de segurança. Se não conseguir efetuar login, clique em 'Esqueci minha senha' na página de login do sistema."
  }
];

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Filter FAQs based on query
  const filteredFAQs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalBox}>
        {/* Header */}
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

        {/* Body */}
        <div className={styles.modalBody}>
          
          {/* Support Cards Grid */}
          <div className={styles.supportGrid}>
            <a href="https://wa.me/mock" target="_blank" rel="noopener noreferrer" className={styles.supportCard}>
              <div className={styles.supportCardHeader}>
                <div className={`${styles.supportIconWrap} ${styles.whatsappBg}`}>
                  <Icon name="message-square-02" className={styles.supportIcon} />
                </div>
                <strong>WhatsApp Suporte</strong>
              </div>
              <p>Atendimento em tempo real das 08h às 18h.</p>
              <span className={styles.cardAction}>Iniciar conversa <Icon name="arrow-right" size={14} /></span>
            </a>

            <a href="mailto:suporte@compramais.com.br" className={styles.supportCard}>
              <div className={styles.supportCardHeader}>
                <div className={`${styles.supportIconWrap} ${styles.emailBg}`}>
                  <Icon name="mail-01" className={styles.supportIcon} />
                </div>
                <strong>E-mail de Suporte</strong>
              </div>
              <p>Envie sua dúvida e responderemos em até 2 horas.</p>
              <span className={styles.cardAction}>Enviar e-mail <Icon name="arrow-right" size={14} /></span>
            </a>

            <a href="#docs" className={styles.supportCard} onClick={(e) => { e.preventDefault(); alert("Direcionando para a Central de Documentação oficial..."); }}>
              <div className={styles.supportCardHeader}>
                <div className={`${styles.supportIconWrap} ${styles.docsBg}`}>
                  <Icon name="book-open-01" className={styles.supportIcon} />
                </div>
                <strong>Documentação</strong>
              </div>
              <p>Tutoriais passo a passo e guias de utilização.</p>
              <span className={styles.cardAction}>Ver manuais <Icon name="arrow-right" size={14} /></span>
            </a>
          </div>

          <hr className={styles.sectionDivider} />

          {/* FAQ Section */}
          <div className={styles.faqSection}>
            <h3 className={styles.sectionTitle}>Perguntas Frequentes (FAQ)</h3>

            {/* Search Input */}
            <div className={styles.searchContainer}>
              <Icon name="search-md" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Busque por termos ou dúvidas (ex: RFQ, alçada, relatórios...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setExpandedIndex(null); // Reset expand on search
                }}
                className={styles.searchInput}
              />
            </div>

            {/* Accordion */}
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
                  <p>Nenhum resultado encontrado para "{searchQuery}".</p>
                  <span>Tente buscar por termos mais genéricos.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
