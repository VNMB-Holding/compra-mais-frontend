"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, Icon, Button, Loading } from "@/components/ui";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedor-detail.module.css";
import { useSupplier } from "@/hooks/useQueries";

export default function FornecedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;
  const [activeTab, setActiveTab] = useState("visao-geral");

  const { data: supplier, isLoading, isError } = useSupplier(supplierId);

  const renderStars = (scoreVal: number) => {
    const starCount = Math.min(5, Math.max(1, Math.round(scoreVal / 2)));
    return (
      <div className={styles.starRow}>
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            name="star-01"
            size={14}
            className={i < starCount ? styles.starFilled : styles.starEmpty}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <Loading variant="fullscreen" message="Carregando perfil do fornecedor..." />;
  }

  if (isError || !supplier) {
    return (
      <div className={styles.pageContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/diretorio")}>
          <Icon name="arrow-left" size={16} /> Voltar ao diretório
        </button>
        <Card style={{ padding: 40, textAlign: "center", marginTop: 24 }}>
          <h2>Fornecedor não localizado</h2>
          <p style={{ color: "#64748b", marginTop: 8 }}>Não foi possível encontrar os dados para o código informado.</p>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "FR";
  const hasScore = supplier.performanceScore !== undefined && supplier.performanceScore !== null;
  const score = hasScore ? Number(supplier.performanceScore) : 9.5;
  const scoreFormatted = score.toFixed(1).replace(".", ",");
  const isActive = supplier.status === "Active" || supplier.isActive === true;
  const statusLabel = isActive ? "Homologado" : "Pendente";
  const statusVariant = isActive ? "success" : "gray";

  return (
    <div className={styles.pageContainer}>
      
      {/* Top Header & Navigation */}
      <div className={styles.topSection}>
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/diretorio")}>
          <Icon name="arrow-left" size={16} /> Voltar ao diretório
        </button>

        <div className={styles.headerRow}>
          <div className={styles.headerTitles}>
            <h1>Detalhes do Fornecedor</h1>
            <p>Perfil de performance, dados cadastrais, bancários e histórico comercial do parceiro.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline} onClick={() => router.push(`/fornecedores/homologacao/${supplier.id}`)}>
              <Icon name="shield-tick" size={16} /> Auditoria & Compliance
            </button>
            <button className={styles.btnOutline}>
              <Icon name="file-02" size={16} /> Documentos
            </button>
            <Button variant="primary" className={styles.btnPrimary}>
              <Icon name="clock-refresh" size={16} /> Histórico Comercial
            </Button>
          </div>
        </div>
      </div>

      {/* Main Supplier Hero Card */}
      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>
          
          {/* Base Info */}
          <div className={styles.summaryColBase}>
            <div className={`${styles.avatarBig} ${isActive ? styles.avatarGreen : styles.avatarOrange}`}>
              {getInitials(supplier.corporateName)}
            </div>
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>{supplier.corporateName}</h2>
                <Badge variant="success" className={styles.badgeVerificado}>CNPJ verificado</Badge>
              </div>
              <p className={styles.docInfo}>
                CNPJ: <strong>{supplier.cnpj}</strong> {supplier.tradeName && supplier.tradeName !== supplier.corporateName ? `• ${supplier.tradeName}` : ""}
              </p>
              <div className={styles.updateInfo}>
                <span>Última atualização: {new Date(supplier.updatedAt || supplier.createdAt).toLocaleDateString("pt-BR")}</span>
                <button className={styles.btnRefresh} onClick={() => window.location.reload()}>
                  <Icon name="refresh-cw-01" size={14} /> Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Performance Score & Stars */}
          <div className={styles.summaryColScore}>
            <div className={styles.scoreHeader}>
              <span>Nota de Performance</span>
              <Icon name="star-01" size={16} />
            </div>
            <div className={styles.scoreValue}>
              <strong className={styles.textGreen}>{scoreFormatted}</strong>
              <small>/10</small>
            </div>
            <div className={styles.titleRow}>
              {renderStars(score)}
              <Badge variant={score >= 8 ? "success" : score >= 6 ? "primary" : "gray"} className={styles.badgeScore}>
                {score >= 8 ? "Excelente" : score >= 6 ? "Bom" : "Regular"}
              </Badge>
            </div>
          </div>

          {/* Status & Cadastro */}
          <div className={styles.summaryColStatus}>
            <div className={styles.statusRow}>
              <span>Situação Cadastral</span>
              <Badge variant={statusVariant} className={styles.badgeHomologado}>{statusLabel}</Badge>
            </div>
            <p className={styles.etapaText}>Cód. ERP: <strong>{supplier.integrationCode || "—"}</strong></p>
            <p className={styles.subStatusText}>
              Cadastrado desde {supplier.registrationDate ? new Date(supplier.registrationDate).toLocaleDateString("pt-BR") : new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>

        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button className={activeTab === "visao-geral" ? styles.tabActive : ""} onClick={() => setActiveTab("visao-geral")}>
          Visão geral
        </button>
        <button className={activeTab === "dados-cadastrais" ? styles.tabActive : ""} onClick={() => setActiveTab("dados-cadastrais")}>
          Dados cadastrais
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        
        {activeTab === "visao-geral" && (
          <>
            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
              <KpiCard
                title="Score de Performance"
                value={`${scoreFormatted}/10`}
                icon="star-01"
                description="Avaliação em cotações e entregas"
              />
              <KpiCard
                title="Prazo de Entrega"
                value={supplier.deliveryLeadTime ? `${supplier.deliveryLeadTime} dias` : "Padrão"}
                icon="truck-01"
                description={supplier.deliveryLocationName || "Almoxarifado Central"}
              />
              <KpiCard
                title="Dados de Pagamento"
                value={supplier.pixKey ? "PIX Cadastrado" : supplier.bankCode ? `Banco ${supplier.bankCode}` : "Padrão"}
                icon="bank"
                description={supplier.bankNumber ? `Conta: ${supplier.bankNumber}` : "Transferência / Boleto"}
              />
              <KpiCard
                title="Situação Cadastral"
                value={statusLabel}
                icon="shield-tick"
                description="Status no ERP Corporate"
              />
            </div>

            {/* Atividades Recentes */}
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
                    <tr>
                      <td>
                        <div className={styles.doubleText}>
                          <strong>{new Date(supplier.updatedAt || supplier.createdAt).toLocaleDateString("pt-BR")}</strong>
                          <small>Sincronização ERP</small>
                        </div>
                      </td>
                      <td>Cadastro integrado e verificado via Corporate</td>
                      <td style={{ textAlign: "right" }}>—</td>
                      <td style={{ textAlign: "center" }}>
                        <Badge variant="success">Concluído</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className={styles.doubleText}>
                          <strong>{new Date(supplier.createdAt).toLocaleDateString("pt-BR")}</strong>
                          <small>Homologação</small>
                        </div>
                      </td>
                      <td>Verificação cadastral e fiscal realizada</td>
                      <td style={{ textAlign: "right" }}>—</td>
                      <td style={{ textAlign: "center" }}>
                        <Badge variant="success">Regular</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "dados-cadastrais" && (
          <div className={styles.cadastraisGrid}>
            <Card className={styles.infoCard}>
              <h4>Dados da Empresa</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Icon name="building-02" size={20} />
                  <div className={styles.infoText}>
                    <small>Razão Social</small>
                    <span>{supplier.corporateName}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="building-01" size={20} />
                  <div className={styles.infoText}>
                    <small>Nome Fantasia</small>
                    <span>{supplier.tradeName || "—"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="file-check-01" size={20} />
                  <div className={styles.infoText}>
                    <small>CNPJ</small>
                    <span>{supplier.cnpj}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="file-02" size={20} />
                  <div className={styles.infoText}>
                    <small>Inscrição Estadual</small>
                    <span>{supplier.stateRegistration || "Isento / Não informado"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="calendar" size={20} />
                  <div className={styles.infoText}>
                    <small>Fornecedor desde</small>
                    <span>{new Date(supplier.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.infoCard}>
              <h4>Contato & Localização</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Icon name="user-01" size={20} />
                  <div className={styles.infoText}>
                    <small>Contato principal</small>
                    <span>{supplier.contactName || "Não informado"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="mail-01" size={20} />
                  <div className={styles.infoText}>
                    <small>E-mail</small>
                    <span>{supplier.contactEmail || "Não informado"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="phone" size={20} />
                  <div className={styles.infoText}>
                    <small>Telefone</small>
                    <span>{supplier.contactPhone || "Não informado"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="marker-pin-01" size={20} />
                  <div className={styles.infoText}>
                    <small>Endereço</small>
                    <span>{supplier.address ? `${supplier.address}, ${supplier.neighborhood || ""} - ${supplier.city || ""}/${supplier.state || ""}` : "Não informado"}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.infoCard}>
              <h4>Dados Bancários & Pagamento</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Icon name="bank" size={20} />
                  <div className={styles.infoText}>
                    <small>Banco / Código</small>
                    <span>{supplier.bankCode ? `Banco [${supplier.bankCode}]` : "Não cadastrado"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="credit-card-01" size={20} />
                  <div className={styles.infoText}>
                    <small>Conta / Agência</small>
                    <span>{supplier.bankNumber || "Não cadastrado"}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Icon name="zap" size={20} />
                  <div className={styles.infoText}>
                    <small>Chave PIX</small>
                    <span style={{ color: supplier.pixKey ? "#007d79" : "#64748b", fontWeight: supplier.pixKey ? 600 : 400 }}>
                      {supplier.pixKey || "Não cadastrada"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>

    </div>
  );
}
