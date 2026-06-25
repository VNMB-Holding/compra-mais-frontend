"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, Icon, Button } from "@/components/ui";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedor-detail.module.css";

export default function FornecedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("visao-geral");

  interface HistoricoRow {
    data: string;
    tipo: string;
    descricao: string;
    valor: string;
    status: string;
  }

  const historico: HistoricoRow[] = [
    { data: "15/06/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4521", valor: "R$ 22.400,00", status: "Entregue" },
    { data: "02/06/2024", tipo: "RFQ", descricao: "Cotação de Combustíveis - Mês de Junho", valor: "-", status: "Fechada" },
    { data: "22/05/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4489", valor: "R$ 18.700,00", status: "Entregue" },
    { data: "10/05/2024", tipo: "Avaliação", descricao: "Avaliação de desempenho trimestral", valor: "-", status: "Concluída" },
    { data: "28/04/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4401", valor: "R$ 15.400,00", status: "Entregue" },
    { data: "15/04/2024", tipo: "RFQ", descricao: "Cotação de Combustíveis - Abastecimento", valor: "-", status: "Fechada" },
    { data: "01/04/2024", tipo: "Contrato", descricao: "Renovação de contrato - Categoria Combustíveis", valor: "R$ 240.000,00", status: "Ativo" },
    { data: "18/03/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4322", valor: "R$ 14.800,00", status: "Entregue" },
  ];

  const renderStars = (count: number) => {
    return (
      <div className={styles.starRow}>
        {[...Array(5)].map((_, i) => (
          <Icon key={i} name="star-01" size={14} className={i < count ? styles.starFilled : styles.starEmpty} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* 1. NAVEGAÇÃO E CABEÇALHO */}
      <div className={styles.topSection}>
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/diretorio")}>
          <Icon name="arrow-left" size={16} /> Voltar ao diretório
        </button>

        <div className={styles.headerRow}>
          <div className={styles.headerTitles}>
            <h1>Detalhes do Fornecedor</h1>
            <p>Perfil de performance, dados cadastrais e histórico comercial do parceiro.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline}>
              <Icon name="edit-02" size={16} /> Editar
            </button>
            <button className={styles.btnOutline}>
              <Icon name="file-02" size={16} /> Documentos
            </button>
            <Button variant="primary" className={styles.btnPrimary}>
              <Icon name="clock-refresh" size={16} /> Histórico
            </Button>
          </div>
        </div>
      </div>

      {/* 2. CARD SUPERIOR TRIPLO (DASHBOARD SUMMARY) */}
      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>
          
          {/* Coluna 1: Info Base */}
          <div className={styles.summaryColBase}>
            <div className={`${styles.avatarBig} ${styles.avatarGreen}`}>FB</div>
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>Fornecedor Bravo LTDA</h2>
                <Badge variant="success" className={styles.badgeVerificado}>CNPJ verificado</Badge>
              </div>
              <p className={styles.docInfo}>CNPJ: 22.333.444/0001-82 <span className={styles.divider}>|</span> Combustíveis</p>
              <div className={styles.updateInfo}>
                <span>Última atualização: 24/06/2026 às 14:11</span>
                <button className={styles.btnRefresh}>
                  <Icon name="refresh" size={14} /> Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 2: Performance (Score & Stars) */}
          <div className={styles.summaryColScore}>
            <div className={styles.scoreHeader}>
              <span>Nota de Performance</span>
              <Icon name="star-01" size={16} />
            </div>
            <div className={styles.scoreValue}>
              <strong className={styles.textGreen}>9,2</strong>
              <small>/10</small>
            </div>
            <div className={styles.titleRow}>
              {renderStars(4)}
              <Badge variant="success" className={styles.badgeScore}>Excelente</Badge>
            </div>
          </div>

          {/* Coluna 3: Status da Homologação */}
          <div className={styles.summaryColStatus}>
            <div className={styles.statusRow}>
              <span>Situação Cadastral</span>
              <Badge variant="success" className={styles.badgeHomologado}>Homologado</Badge>
            </div>
            <p className={styles.etapaText}>Status do Contrato: Ativo</p>
            <p className={styles.subStatusText}>Parceiro homologado desde 18/08/2023</p>
          </div>

        </div>
      </Card>

      {/* 3. SISTEMA DE ABAS */}
      <div className={styles.tabsContainer}>
        <button className={activeTab === "visao-geral" ? styles.tabActive : ""} onClick={() => setActiveTab("visao-geral")}>Visão geral</button>
        <button className={activeTab === "dados-cadastrais" ? styles.tabActive : ""} onClick={() => setActiveTab("dados-cadastrais")}>Dados cadastrais</button>
      </div>

      {/* 4. CONTEÚDO DAS ABAS */}
      <div className={styles.tabContent}>
        
        {activeTab === "visao-geral" && (
          <>
            {/* KPIs */}
            <div className={styles.kpiGrid}>
              <KpiCard title="OTIF" value="94%" icon="truck-01" description="Entregas no prazo" />
              <KpiCard title="Qualidade" value="98%" icon="award-01" description="Conformidade dos itens" />
              <KpiCard title="Volume negociado (12m)" value="R$ 1,2M" icon="bank-note-01" />
              <KpiCard title="Pedidos atendidos (12m)" value="128" icon="shopping-cart-01" />
            </div>

            {/* Histórico de Atividades Estilizado como a itemsTable */}
            <div className={styles.itemsCard}>
              <div className={styles.itemsCardHeader}>
                <h3><Icon name="clock-refresh" size={18} /> Histórico de atividades com o fornecedor</h3>
              </div>
              <div className={styles.itemsTableWrapper}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Data / Tipo</th>
                      <th>Descrição</th>
                      <th style={{ width: "160px", textAlign: "right" }}>Valor</th>
                      <th style={{ width: "160px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((item, index) => {
                      let iconName = "clock";
                      if (item.tipo === "Pedido") iconName = "shopping-cart-01";
                      else if (item.tipo === "RFQ") iconName = "file-02";
                      else if (item.tipo === "Avaliação") iconName = "award-01";
                      else if (item.tipo === "Contrato") iconName = "clipboard";

                      return (
                        <tr key={index}>
                          <td>
                            <div className={styles.itemDesc}>
                              <div className={styles.itemIconWrapper}>
                                <Icon name={iconName} size={20} />
                              </div>
                              <div className={styles.itemDescText}>
                                <strong>{item.data}</strong>
                                <small>{item.tipo}</small>
                              </div>
                            </div>
                          </td>
                          <td>{item.descricao}</td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>{item.valor}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`${styles.historicoBadge} ${item.status === "Entregue" || item.status === "Concluída" || item.status === "Fechada" ? styles.badgeHistoricoGreen : item.status === "Ativo" ? styles.badgeHistoricoBlue : styles.badgeHistoricoYellow}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "dados-cadastrais" && (
          <Card className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Informações completas do fornecedor</h3>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Icon name="building-01" size={20} />
                <div className={styles.infoText}>
                  <small>Razão Social</small>
                  <span>Fornecedor Bravo LTDA</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="file-check-01" size={20} />
                <div className={styles.infoText}>
                  <small>CNPJ</small>
                  <span>22.333.444/0001-82</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="tag-01" size={20} />
                <div className={styles.infoText}>
                  <small>Categoria</small>
                  <span>Combustíveis</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="calendar" size={20} />
                <div className={styles.infoText}>
                  <small>Fornecedor desde</small>
                  <span>18/08/2023</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Icon name="user-01" size={20} />
                <div className={styles.infoText}>
                  <small>Contato principal</small>
                  <span>João Silva</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="mail-01" size={20} />
                <div className={styles.infoText}>
                  <small>E-mail</small>
                  <span>vendas@bravo.com.br</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="phone" size={20} />
                <div className={styles.infoText}>
                  <small>Telefone</small>
                  <span>(11) 99999-9999</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="globe-01" size={20} />
                <div className={styles.infoText}>
                  <small>Website</small>
                  <span>www.bravo.com.br</span>
                </div>
              </div>

              <div className={`${styles.infoItem} ${styles.colSpanFull}`}>
                <Icon name="marker-pin-01" size={20} />
                <div className={styles.infoText}>
                  <small>Endereço</small>
                  <span>Av. das Nações Unidas, 12.345, Conj. 1201 — São Paulo - SP, 04578-000</span>
                </div>
              </div>
            </div>
          </Card>
        )}

      </div>

    </div>
  );
}
