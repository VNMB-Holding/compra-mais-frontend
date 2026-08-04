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

  const renderStars = (score: number) => {
    const starCount = Math.min(5, Math.max(1, Math.round(score / 20)));
    return (
      <div className={styles.starRow}>
        {[...Array(5)].map((_, i) => (
          <Icon key={i} name="star-01" size={14} className={i < starCount ? styles.starFilled : styles.starEmpty} />
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
  const score = supplier.performanceScore ?? 0;
  const scoreFormatted = hasScore ? (score / 10).toFixed(1).replace(".", ",") : "—";
  const statusLabel = supplier.status === "Active" ? "Homologado" : supplier.status === "Pending" ? "Pendente" : supplier.status;
  const statusVariant = supplier.status === "Active" ? "success" : supplier.status === "Pending" ? "warning" : "gray";

  return (
    <div className={styles.pageContainer}>
      
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

      
      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>
          
          <div className={styles.summaryColBase}>
            <div className={`${styles.avatarBig} ${styles.avatarGreen}`}>{getInitials(supplier.corporateName)}</div>
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>{supplier.corporateName}</h2>
                <Badge variant="success" className={styles.badgeVerificado}>CNPJ verificado</Badge>
              </div>
              <p className={styles.docInfo}>CNPJ: {supplier.cnpj} <span className={styles.divider}>|</span> {supplier.segment || "Geral"}</p>
              <div className={styles.updateInfo}>
                <span>Última atualização: {new Date(supplier.updatedAt || supplier.createdAt).toLocaleDateString("pt-BR")}</span>
                <button className={styles.btnRefresh}>
                  <Icon name="refresh" size={14} /> Atualizar
                </button>
              </div>
            </div>
          </div>

          
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
              {hasScore ? renderStars(score) : null}
              <Badge variant={hasScore && score >= 80 ? "success" : hasScore && score >= 60 ? "primary" : "gray"} className={styles.badgeScore}>
                {hasScore ? (score >= 80 ? "Excelente" : score >= 60 ? "Bom" : "Atenção") : "Sem avaliação"}
              </Badge>
            </div>
          </div>

          
          <div className={styles.summaryColStatus}>
            <div className={styles.statusRow}>
              <span>Situação Cadastral</span>
              <Badge variant={statusVariant} className={styles.badgeHomologado}>{statusLabel}</Badge>
            </div>
            <p className={styles.etapaText}>Status do Contrato: {supplier.status === "Active" ? "Ativo" : "Em Análise"}</p>
            <p className={styles.subStatusText}>Cadastrado desde {new Date(supplier.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>

        </div>
      </Card>

      
      <div className={styles.tabsContainer}>
        <button className={activeTab === "visao-geral" ? styles.tabActive : ""} onClick={() => setActiveTab("visao-geral")}>Visão geral</button>
        <button className={activeTab === "dados-cadastrais" ? styles.tabActive : ""} onClick={() => setActiveTab("dados-cadastrais")}>Dados cadastrais</button>
      </div>

      
      <div className={styles.tabContent}>
        
        {activeTab === "visao-geral" && (
          <>
            
            <div className={styles.kpiGrid}>
              <KpiCard title="Score de Performance" value={`${score}/100`} icon="star-01" description="Avaliação geral" />
              <KpiCard title="Segmento / Categoria" value={supplier.segment || "Geral"} icon="tag-01" description="Ramo de atuação" />
              <KpiCard title="Situação Cadastral" value={statusLabel} icon="shield-tick" description="Status do contrato" />
              <KpiCard title="Data de Cadastro" value={new Date(supplier.createdAt).toLocaleDateString("pt-BR")} icon="calendar" description="Início da parceria" />
            </div>

            
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
                        <div className={styles.itemDesc}>
                          <div className={styles.itemIconWrapper}>
                            <Icon name="clipboard" size={20} />
                          </div>
                          <div className={styles.itemDescText}>
                            <strong>{new Date(supplier.createdAt).toLocaleDateString("pt-BR")}</strong>
                            <small>Cadastro</small>
                          </div>
                        </div>
                      </td>
                      <td>Homologação e registro inicial do fornecedor</td>
                      <td style={{ textAlign: "right", fontWeight: "600" }}>-</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`${styles.historicoBadge} ${styles.badgeHistoricoGreen}`}>
                          Concluído
                        </span>
                      </td>
                    </tr>
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
                  <span>{supplier.corporateName}</span>
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
                <Icon name="tag-01" size={20} />
                <div className={styles.infoText}>
                  <small>Categoria / Segmento</small>
                  <span>{supplier.segment || "Geral"}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="calendar" size={20} />
                <div className={styles.infoText}>
                  <small>Fornecedor desde</small>
                  <span>{new Date(supplier.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

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
                  <span>{supplier.contactEmail}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="phone" size={20} />
                <div className={styles.infoText}>
                  <small>Telefone</small>
                  <span>{supplier.contactPhone}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="file-02" size={20} />
                <div className={styles.infoText}>
                  <small>Inscrição Estadual</small>
                  <span>{supplier.stateRegistration || "Isento"}</span>
                </div>
              </div>

              <div className={`${styles.infoItem} ${styles.colSpanFull}`}>
                <Icon name="marker-pin-01" size={20} />
                <div className={styles.infoText}>
                  <small>Endereço</small>
                  <span>{supplier.address} — CEP: {supplier.zipCode}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

      </div>

    </div>
  );
}
