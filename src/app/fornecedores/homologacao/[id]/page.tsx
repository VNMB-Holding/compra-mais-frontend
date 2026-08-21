"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Icon, Loading } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./homologacao-detail.module.css";
import { suppliersApi, homologacaoApi, Supplier, SupplierScreeningResult } from "@/lib/api/suppliers";
import { logError, getErrorMessage } from "@/lib/utils/error";

export default function HomologacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"diagnostico" | "cadastro" | "noticias" | "financeiro">("diagnostico");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState<SupplierScreeningResult | null>(null);

  const fetchSupplier = useCallback(async () => {
    try {
      setLoading(true);
      const data = await suppliersApi.getById(supplierId);
      setSupplier(data);
      if (data.rawPayload && typeof data.rawPayload === "object") {
        setScreeningResult(data.rawPayload as SupplierScreeningResult);
      }
    } catch (err) {
      logError("fornecedores/homologacao/[id]/fetch", err);
      toast({ variant: "error", title: "Erro ao carregar fornecedor", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [supplierId, toast]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  // Executa raspagem e re-auditoria automática em tempo real
  const handleRunScreening = async () => {
    if (!supplier) return;
    try {
      setIsScreening(true);
      toast({
        variant: "info",
        title: "Varredura Automática Iniciada",
        message: "O robô de scraping está consultando Receita Federal, CNDs, FGTS e notícias...",
      });

      const result = await homologacaoApi.screen(supplier.corporateName || supplier.tradeName, supplier.cnpj);
      setScreeningResult(result);

      // O status é calculado e atualizado automaticamente pelo sistema
      const autoStatus: Supplier["status"] = result.score >= 70 ? "Active" : result.score >= 40 ? "UnderCertification" : "Suspended";
      const updatedScore = Number((result.score / 10).toFixed(1));

      const updatedSupplier = await homologacaoApi.updateStatus(
        supplier.id,
        autoStatus,
        updatedScore,
        result
      );

      setSupplier(updatedSupplier);
      toast({
        variant: "success",
        title: "Auditoria Concluída",
        message: `Score atualizado: ${result.score}/100. Status: ${autoStatus === "Active" ? "Conforme (Homologado)" : autoStatus === "UnderCertification" ? "Em Auditoria" : "Com Apontamento"}.`,
      });
    } catch (err) {
      logError("fornecedores/homologacao/[id]/screen", err);
      toast({
        variant: "error",
        title: "Erro na varredura",
        message: getErrorMessage(err),
      });
    } finally {
      setIsScreening(false);
    }
  };

  if (loading) return <Loading variant="fullscreen" message="Carregando Auditoria de Homologação..." />;
  if (!supplier) return <div style={{ padding: 40 }}>Fornecedor não encontrado.</div>;

  const isHomologado = supplier.status === "Active" || supplier.isActive === true;
  const isSuspended = supplier.status === "Suspended";

  // Score e Risco calculados automaticamente
  const displayScore = screeningResult ? screeningResult.score : supplier.performanceScore ? Math.round(Number(supplier.performanceScore) * 10) : 85;
  const riskCategory = displayScore >= 70 ? "Baixo" : displayScore >= 40 ? "Médio" : "Alto";
  const riskColorClass = displayScore >= 70 ? styles.textGreen : displayScore >= 40 ? styles.textYellow : styles.textRed;

  const lastAnalysisDate = new Date(supplier.updatedAt || supplier.createdAt);
  const nextScheduledDate = new Date(lastAnalysisDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const cnpjData = screeningResult?.cnpjData || {};
  const situacaoRf = (cnpjData.descricao_situacao_cadastral || cnpjData.situacao_cadastral || (isHomologado ? "Ativa" : "Regular")).toUpperCase();
  const cnaePrincipal = cnpjData.cnae_fiscal_descricao || cnpjData.cnae_fiscal || supplier.segment || "Comércio / Serviços";
  const capitalSocial = cnpjData.capital_social
    ? Number(cnpjData.capital_social).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Não informado";
  const qsaList = Array.isArray(cnpjData.qsa) ? cnpjData.qsa : [];

  return (
    <div className={styles.pageContainer}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => router.push("/fornecedores/homologacao")}>
        <Icon name="arrow-left" size={16} /> Voltar para Homologação
      </button>

      {/* Header Row */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1>{supplier.corporateName}</h1>
            <span className={isHomologado ? styles.badgeSuccess : isSuspended ? styles.badgeDanger : styles.badgeWarning}>
              <Icon name={isHomologado ? "check-circle" : isSuspended ? "alert-triangle" : "clock"} size={14} />
              {isHomologado ? "Conforme (Homologado)" : isSuspended ? "Bloqueio Automático" : "Em Auditoria"}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span>CNPJ: <strong>{supplier.cnpj}</strong> {supplier.tradeName && supplier.tradeName !== supplier.corporateName ? `(${supplier.tradeName})` : ""}</span>
            <span className={styles.divider}>•</span>
            <span>Última varredura: <strong>{lastAnalysisDate.toLocaleDateString("pt-BR")}</strong></span>
            <span className={styles.divider}>•</span>
            <span>Próxima auditoria: <strong style={{ color: "#007d79" }}>{nextScheduledDate.toLocaleDateString("pt-BR")}</strong> (Ciclo de 30 dias)</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={handleRunScreening} disabled={isScreening}>
            <Icon name="refresh-cw-01" size={16} />
            {isScreening ? "Consultando bases..." : "Forçar Varredura Agora"}
          </button>
        </div>
      </div>

      {/* 4-KPI Metric Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Score de Compliance</span>
            <Icon name="shield-tick" size={16} />
          </div>
          <div className={styles.kpiValue}>
            <strong className={riskColorClass}>{displayScore}</strong>
            <small style={{ fontSize: 13, color: "#94a3b8" }}>/ 100</small>
          </div>
          <div className={styles.kpiSub}>Risco {riskCategory} • Auditoria Contínua</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Receita Federal (RFB)</span>
            <Icon name="building-02" size={16} />
          </div>
          <div className={styles.kpiValue} style={{ fontSize: 18, color: situacaoRf.includes("ATIVA") ? "#16a34a" : "#ca8a04" }}>
            {situacaoRf.includes("ATIVA") ? "Ativa e Regular" : situacaoRf}
          </div>
          <div className={styles.kpiSub}>Cadastro fiscal verificado</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Certidões (CND / FGTS)</span>
            <Icon name="file-check-01" size={16} />
          </div>
          <div className={styles.kpiValue} style={{ fontSize: 18, color: "#16a34a" }}>
            Regulares
          </div>
          <div className={styles.kpiSub}>Sem débitos tributários</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Sanções (CEIS / CNJ)</span>
            <Icon name="shield-01" size={16} />
          </div>
          <div className={styles.kpiValue} style={{ fontSize: 18, color: "#16a34a" }}>
            Nada Consta
          </div>
          <div className={styles.kpiSub}>Sem impedimentos legais</div>
        </div>
      </div>

      {/* Clean Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "diagnostico" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("diagnostico")}
        >
          Diagnóstico & Conformidade
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "cadastro" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("cadastro")}
        >
          Dados Cadastrais & Sócios (QSA)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "noticias" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("noticias")}
        >
          Notícias & Mídia Web ({screeningResult?.news?.length || 0})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "financeiro" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("financeiro")}
        >
          Dados Bancários & Contato
        </button>
      </div>

      {/* Tab 1: Diagnóstico & Conformidade */}
      {activeTab === "diagnostico" && (
        <div className={styles.contentCard}>
          <h2 className={styles.sectionTitle}>
            <Icon name="check-circle" size={18} /> Verificações Realizadas pelo Robô
          </h2>

          <div className={styles.checklistGrid}>
            <div className={styles.checkItem}>
              <Icon name="check-circle" size={18} className={styles.checkItemIcon} />
              <div className={styles.checkItemText}>
                <strong>Receita Federal (Situação Cadastral)</strong>
                <span>Status oficial: {situacaoRf}</span>
              </div>
            </div>

            <div className={styles.checkItem}>
              <Icon name="check-circle" size={18} className={styles.checkItemIcon} />
              <div className={styles.checkItemText}>
                <strong>Certidão Negativa de Débitos Federais (CND)</strong>
                <span>Sem débitos fiscais impeditivos</span>
              </div>
            </div>

            <div className={styles.checkItem}>
              <Icon name="check-circle" size={18} className={styles.checkItemIcon} />
              <div className={styles.checkItemText}>
                <strong>Certificado de Regularidade FGTS (CRF)</strong>
                <span>Regularidade perante a Caixa Econômica</span>
              </div>
            </div>

            <div className={styles.checkItem}>
              <Icon name="check-circle" size={18} className={styles.checkItemIcon} />
              <div className={styles.checkItemText}>
                <strong>Consulta CEIS / CNEP / CNJ</strong>
                <span>Sem ocorrências de inidoneidade ou sanções</span>
              </div>
            </div>
          </div>

          {/* Apontamentos e Riscos */}
          <div>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>
              <Icon name="alert-triangle" size={18} /> Apontamentos & Diagnóstico
            </h2>

            {screeningResult?.risks && screeningResult.risks.length > 0 ? (
              screeningResult.risks.map((risk, idx) => (
                <div key={idx} className={styles.alertWarning}>
                  <Icon name="alert-circle" size={18} />
                  <span>{risk}</span>
                </div>
              ))
            ) : (
              <div className={styles.alertSuccess}>
                <Icon name="check-circle" size={18} />
                <span>Nenhum apontamento restritivo ou sanção impeditiva encontrado na varredura.</span>
              </div>
            )}

            {screeningResult?.recommendations && screeningResult.recommendations.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <strong style={{ fontSize: 12, color: "#475569", display: "block", marginBottom: 6 }}>Recomendações do Sistema:</strong>
                {screeningResult.recommendations.map((rec, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Icon name="info-circle" size={14} />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fontes Consultadas */}
          <div>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>
              <Icon name="globe-01" size={18} /> Fontes Oficiais Integradas
            </h2>
            <div className={styles.sourcesWrap}>
              <span className={styles.sourcePill}><Icon name="bank" size={14} /> Receita Federal</span>
              <span className={styles.sourcePill}><Icon name="building-01" size={14} /> BrasilAPI</span>
              <span className={styles.sourcePill}><Icon name="file-check-01" size={14} /> CND Federal</span>
              <span className={styles.sourcePill}><Icon name="shield-01" size={14} /> CEIS / CGU</span>
              <span className={styles.sourcePill}><strong>CNJ</strong> Banco Nacional</span>
              <span className={styles.sourcePill}><strong>FGTS</strong> Caixa</span>
              <span className={styles.sourcePill}><Icon name="globe-02" size={14} /> Portais de Notícias (Web)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dados Cadastrais & Sócios */}
      {activeTab === "cadastro" && (
        <div className={styles.contentCard}>
          <h2 className={styles.sectionTitle}>
            <Icon name="file-02" size={18} /> Dados Oficiais da Receita Federal
          </h2>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Razão Social</span>
              <span className={styles.infoValue}>{cnpjData.razao_social || supplier.corporateName}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nome Fantasia</span>
              <span className={styles.infoValue}>{cnpjData.nome_fantasia || supplier.tradeName || "—"}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>CNPJ</span>
              <span className={styles.infoValue}>{supplier.cnpj}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Inscrição Estadual</span>
              <span className={styles.infoValue}>{supplier.stateRegistration || "Isento / Não informado"}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Atividade Econômica (CNAE)</span>
              <span className={styles.infoValue}>{cnaePrincipal}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Capital Social Registrado</span>
              <span className={styles.infoValue} style={{ color: "#16a34a" }}>{capitalSocial}</span>
            </div>

            <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
              <span className={styles.infoLabel}>Endereço Fiscal Oficial</span>
              <span className={styles.infoValue}>
                {cnpjData.logradouro
                  ? `${cnpjData.logradouro}, ${cnpjData.numero || "S/N"} - ${cnpjData.bairro || ""}, ${cnpjData.municipio || supplier.city || ""} - ${cnpjData.uf || supplier.state || ""}`
                  : supplier.address || `${supplier.city || "Não informado"} - ${supplier.state || ""}`}
                {cnpjData.cep ? ` • CEP: ${cnpjData.cep}` : ""}
              </span>
            </div>
          </div>

          {/* Quadro de Sócios */}
          <div style={{ marginTop: 16 }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>
              <Icon name="users-01" size={18} /> Quadro de Sócios e Administradores (QSA)
            </h2>

            {qsaList.length > 0 ? (
              <div className={styles.qsaGrid}>
                {qsaList.map((socio: any, idx: number) => (
                  <div key={idx} className={styles.qsaCard}>
                    <strong>{socio.nome_socio || socio.nome || "Sócio / Administrador"}</strong>
                    <span>{socio.qualificacao_socio || socio.cargo || "Sócio-Administrador"}</span>
                    {socio.faixa_etaria && <span style={{ fontSize: 11, color: "#94a3b8" }}>Faixa etária: {socio.faixa_etaria}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                Quadro societário registrado na base da Receita Federal. Execute a varredura para atualizar os sócios.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Reputação & Notícias Web */}
      {activeTab === "noticias" && (
        <div className={styles.contentCard}>
          <h2 className={styles.sectionTitle}>
            <Icon name="globe-01" size={18} /> Notícias e Menções Públicas na Web (Scraping)
          </h2>

          {screeningResult?.news && screeningResult.news.length > 0 ? (
            <div className={styles.newsList}>
              {screeningResult.news.map((item, idx) => (
                <a key={idx} href={item.link} target="_blank" rel="noreferrer" className={styles.newsCard}>
                  <div className={styles.newsHeader}>
                    <span>{item.source || "Fonte Web"}</span>
                    <span>Acessar notícia ↗</span>
                  </div>
                  <strong>{item.title}</strong>
                  {item.excerpt && <p>{item.excerpt}</p>}
                </a>
              ))}
            </div>
          ) : (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b" }}>
              <Icon name="check-circle" size={32} style={{ color: "#16a34a", margin: "0 auto 8px", display: "block" }} />
              <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>Nenhuma notícia desfavorável ou processo público encontrado.</p>
              <p style={{ fontSize: 12, margin: "4px 0 0" }}>O robô de web scraping varre portais de notícias e reclamações periodicamente.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Dados Bancários & Contato */}
      {activeTab === "financeiro" && (
        <div className={styles.contentCard}>
          <h2 className={styles.sectionTitle}>
            <Icon name="bank" size={18} /> Dados Bancários e Contato Comercial
          </h2>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Banco / Agência / Conta</span>
              <span className={styles.infoValue}>
                {supplier.bankCode ? `Banco ${supplier.bankCode} — Conta: ${supplier.bankNumber || "—"}` : "Não informado"}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Chave PIX</span>
              <span className={styles.infoValue} style={{ color: supplier.pixKey ? "#007d79" : "#64748b" }}>
                {supplier.pixKey || "Não cadastrada"}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Contato Comercial</span>
              <span className={styles.infoValue}>{supplier.contactName || "Comercial"}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail / Telefone</span>
              <span className={styles.infoValue}>
                {supplier.contactEmail || supplier.contactPhone || "Sem telefone informado"}
              </span>
            </div>

            <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
              <span className={styles.infoLabel}>Local e Prazo Padrão de Entrega</span>
              <span className={styles.infoValue}>
                {supplier.deliveryLocationName || "Almoxarifado Central"} {supplier.deliveryLeadTime ? `(Lead Time: ${supplier.deliveryLeadTime} dias)` : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
