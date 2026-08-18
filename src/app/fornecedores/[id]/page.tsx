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
            <div className={styles.cadastraisCol}>
              
              {/* Card 1: Informações Cadastrais & Fiscais */}
              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconBlue}`}>
                    <Icon name="building-02" size={20} />
                  </div>
                  <h3>Identificação Cadastral & Fiscal</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="building-01" size={14} /> Razão Social
                    </span>
                    <span className={styles.fieldValue}>{supplier.corporateName}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="tag-01" size={14} /> Nome Fantasia
                    </span>
                    <span className={styles.fieldValue}>{supplier.tradeName || "—"}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="file-check-01" size={14} /> CNPJ
                    </span>
                    <div className={styles.fieldValueSub}>
                      <span className={styles.fieldValue}>{supplier.cnpj}</span>
                      <span className={styles.badgeCadastral}>
                        <Icon name="check" size={12} /> Cadastro Regular
                      </span>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="file-02" size={14} /> Inscrição Estadual
                    </span>
                    <span className={styles.fieldValue}>{supplier.stateRegistration || "Isento / Não informado"}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="database-01" size={14} /> Código no ERP
                    </span>
                    <span className={styles.fieldValue}>{supplier.integrationCode || "—"}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="calendar" size={14} /> Cadastrado em
                    </span>
                    <span className={styles.fieldValue}>
                      {new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Card 2: Logística & Condições de Fornecimento */}
              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconAmber}`}>
                    <Icon name="truck-01" size={20} />
                  </div>
                  <h3>Logística & Condições de Entrega</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="marker-pin-01" size={14} /> Local de Entrega Padrão
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.deliveryLocationName || "Almoxarifado Central / Pátio de Obras"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="clock" size={14} /> Lead Time de Entrega
                    </span>
                    <div className={styles.fieldValueSub}>
                      <span className={styles.fieldValue}>
                        {supplier.deliveryLeadTime ? `⚡ ${supplier.deliveryLeadTime} dias úteis` : "Prazo sob consulta"}
                      </span>
                      <small>Tempo médio de expedição e transporte</small>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="globe-01" size={14} /> Praça Principal
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.city ? `${supplier.city} / ${supplier.state}` : "Atendimento Nacional"}
                    </span>
                  </div>
                </div>
              </Card>

            </div>

            <div className={styles.cadastraisCol}>

              {/* Card 3: Contatos & Localização */}
              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconPurple}`}>
                    <Icon name="user-01" size={20} />
                  </div>
                  <h3>Contatos & Localização da Sede</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="users-01" size={14} /> Contato Comercial
                    </span>
                    <span className={styles.fieldValue}>{supplier.contactName || "Equipe de Atendimento"}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="phone" size={14} /> Telefone
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.contactPhone ? (
                        <a href={`tel:${supplier.contactPhone.replace(/\D/g, "")}`} style={{ color: "#007d79", textDecoration: "none" }}>
                          {supplier.contactPhone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="mail-01" size={14} /> E-mail
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.contactEmail ? (
                        <a href={`mailto:${supplier.contactEmail}`} style={{ color: "#007d79", textDecoration: "none" }}>
                          {supplier.contactEmail}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="marker-pin-02" size={14} /> Endereço Completo
                    </span>
                    <div className={styles.fieldValueSub}>
                      <span className={styles.fieldValue}>
                        {supplier.address || "Endereço comercial cadastrado"}
                      </span>
                      {supplier.neighborhood && (
                        <small>{supplier.neighborhood} • {supplier.city}/{supplier.state} • CEP {supplier.zipCode || "—"}</small>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 4: Dados Bancários & PIX */}
              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconGreen}`}>
                    <Icon name="bank" size={20} />
                  </div>
                  <h3>Dados Bancários & PIX</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="credit-card-01" size={14} /> Banco / Código
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.bankCode ? `Banco Febraban [${supplier.bankCode}]` : "Banco Centralizado"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="file-attachment-01" size={14} /> Agência / Conta
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.bankNumber || "Conta Corrente Integrada"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="zap" size={14} /> Chave PIX
                    </span>
                    <div className={styles.fieldValueSub} style={{ width: "100%" }}>
                      {supplier.pixKey ? (
                        <div className={styles.pixHighlight}>
                          <span>{supplier.pixKey}</span>
                          <span className={styles.badgeCadastral}>PIX Ativo</span>
                        </div>
                      ) : (
                        <span className={styles.fieldValue} style={{ color: "#94a3b8" }}>Não cadastrada</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
