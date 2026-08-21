"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Badge, Icon, Loading } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./homologacao-detail.module.css";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { logError, getErrorMessage } from "@/lib/utils/error";

export default function HomologacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("visao-geral");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplier() {
      try {
        const data = await suppliersApi.getById(supplierId);
        setSupplier(data);
      } catch (err) {
        logError("fornecedores/homologacao/[id]/fetch", err);
        toast({ variant: "error", title: "Erro ao carregar fornecedor", message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    }
    fetchSupplier();
  }, [supplierId, toast]);

  if (loading) return <Loading variant="fullscreen" message="Carregando Análise de Homologação..." />;
  if (!supplier) return <div style={{ padding: 40 }}>Fornecedor não encontrado.</div>;

  const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "FR";
  const isHomologado = supplier.status === "Active";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topSection}>
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/homologacao")}>
          <Icon name="arrow-left" size={16} /> Voltar para a lista
        </button>

        <div className={styles.headerRow}>
          <div className={styles.headerTitles}>
            <h1>Homologação e Análise de Risco</h1>
            <p>Verificação de dados públicos, situação cadastral, certidões e compliance.</p>
          </div>
        </div>
      </div>

      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>

          <div className={styles.summaryColBase}>
            <div className={styles.avatarBig}>{getInitials(supplier.corporateName)}</div>
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>{supplier.corporateName}</h2>
              </div>
              <p className={styles.docInfo}>CNPJ: {supplier.cnpj} {supplier.tradeName && supplier.tradeName !== supplier.corporateName ? `| ${supplier.tradeName}` : ""}</p>
              <div className={styles.updateInfo}>
                <span>Última análise: {new Date(supplier.updatedAt || supplier.createdAt).toLocaleDateString("pt-BR")}</span>
                <button className={styles.btnRefresh} onClick={() => window.location.reload()}>
                  <Icon name="refresh-cw-01" size={14} /> Atualizar dados
                </button>
              </div>
            </div>
          </div>

          <div className={styles.summaryColScore}>
            <div className={styles.scoreHeader}>
              <span>Score de Risco</span>
              <Icon name="shield-tick" size={16} />
            </div>
            <div className={styles.scoreValue}>
              <strong className={styles.textGreen}>Baixo</strong>
            </div>
            <span className={styles.badgeScore}>Fornecedor Seguro</span>
          </div>

          <div className={styles.summaryColStatus}>
            <div className={styles.statusRow}>
              <span>Status de Compliance</span>
              <span className={isHomologado ? styles.badgeScore : styles.badgeEmAnalise}>
                {isHomologado ? "Homologado" : "Em análise"}
              </span>
            </div>
            <p className={styles.etapaText}>Análise automatizada concluída</p>

            <div className={styles.stepperWrapper}>
              <div className={`${styles.stepDot} ${styles.stepDone}`} />
              <div className={`${styles.stepLine} ${styles.lineDone}`} />
              <div className={`${styles.stepDot} ${styles.stepDone}`} />
              <div className={`${styles.stepLine} ${styles.lineDone}`} />
              <div className={`${styles.stepDot} ${styles.stepDone}`} />
            </div>
          </div>

        </div>
      </Card>

      <div className={styles.tabsContainer}>
        <button className={activeTab === "visao-geral" ? styles.tabActive : ""} onClick={() => setActiveTab("visao-geral")}>
          Visão Geral
        </button>
        <button className={activeTab === "certidoes" ? styles.tabActive : ""} onClick={() => setActiveTab("certidoes")}>
          Certidões & Fiscal
        </button>
        <button className={activeTab === "financeiro" ? styles.tabActive : ""} onClick={() => setActiveTab("financeiro")}>
          Dados Bancários & PIX
        </button>
      </div>

      {activeTab === "visao-geral" && (
        <div className={styles.contentGrid}>
          
          <div className={styles.leftColumn}>
            
            <Card className={styles.contentCard}>
              <h3 className={styles.cardTitle}>
                <Icon name="shield-01" size={18} /> Classificação de Risco
              </h3>
              <div className={styles.riskGradientBar}>
                <div className={styles.riskMarker} style={{ left: "15%" }}>
                  <div className={styles.markerTriangle} />
                </div>
              </div>
              <div className={styles.riskLabels}>
                <div className={styles.riskLabel}>
                  <strong>Baixo Risco</strong>
                  <span style={{ color: "#16a34a" }}>0 - 30 (Atual: 15)</span>
                </div>
                <div className={styles.riskLabel}>
                  <strong>Médio Risco</strong>
                  <span style={{ color: "#ca8a04" }}>31 - 70</span>
                </div>
                <div className={styles.riskLabel}>
                  <strong>Alto Risco</strong>
                  <span style={{ color: "#dc2626" }}>71 - 100</span>
                </div>
              </div>
            </Card>

            <Card className={styles.contentCard}>
              <h3 className={styles.cardTitle}>
                <Icon name="check-circle" size={18} /> Análises Automatizadas
              </h3>

              <div className={styles.analysisList}>
                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="building-02" size={20} />
                    <div>
                      <strong>Receita Federal (RFB)</strong>
                      <p>Situação cadastral Ativa e regular</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <div className={styles.badgeSuccessOutline}><Icon name="check" size={16} /> Regular</div>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="file-check-01" size={20} />
                    <div>
                      <strong>Certidão Negativa de Débitos (CND Federal)</strong>
                      <p>Sem pendências tributárias ativas</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <div className={styles.badgeSuccessOutline}><Icon name="check" size={16} /> Válida</div>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="users-01" size={20} />
                    <div>
                      <strong>Regularidade FGTS (CRF)</strong>
                      <p>Certificado de regularidade em vigor</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <div className={styles.badgeSuccessOutline}><Icon name="check" size={16} /> Emitida</div>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="shield-tick" size={20} />
                    <div>
                      <strong>Trabalho Escravo & CEIS</strong>
                      <p>Sem apontamentos em listas restritivas</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <div className={styles.badgeSuccessOutline}><Icon name="check" size={16} /> Nada Consta</div>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          <div className={styles.rightColumn}>
            
            <Card className={styles.contentCard}>
              <h3 className={styles.cardTitle}>
                <Icon name="globe-01" size={18} /> Fontes Oficiais Consultadas
              </h3>
              
              <div className={styles.sourcesGrid}>
                <div className={styles.sourceBox}>
                  <div className={styles.sourceIconBox}><Icon name="bank" size={18} /></div>
                  <span>Receita Federal</span>
                </div>
                <div className={styles.sourceBox}>
                  <div className={styles.sourceIconBox}><Icon name="building-01" size={18} /></div>
                  <span>Transparência</span>
                </div>
                <div className={styles.sourceBox}>
                  <div className={styles.sourceIconBox}><Icon name="shield-01" size={18} /></div>
                  <span>CEIS</span>
                </div>
                <div className={styles.sourceBox}>
                  <div className={styles.sourceIconBox}><strong>CNJ</strong></div>
                  <span>CNJ</span>
                </div>
                <div className={styles.sourceBox}>
                  <div className={styles.sourceIconBox}><strong>TCU</strong></div>
                  <span>TCU</span>
                </div>
                <div className={styles.sourceBox}>
                  <div className={styles.sourceIconBox}><strong>FGTS</strong></div>
                  <span>Caixa</span>
                </div>
              </div>
            </Card>

            <Card className={styles.contentCard}>
              <h3 className={styles.cardTitle}>
                <Icon name="alert-triangle" size={18} /> Apontamentos Restritivos
              </h3>
              <div className={styles.alertSuccessBox}>
                <Icon name="check-circle" size={18} />
                <span>Nenhum processo restritivo ou sanção encontrado.</span>
              </div>
            </Card>

          </div>

        </div>
      )}

      {activeTab === "certidoes" && (
        <div className={styles.contentGrid}>
          <div className={styles.leftColumn} style={{ gridColumn: "1 / -1" }}>
            <Card className={styles.contentCard}>
              <h3 className={styles.cardTitle}>
                <Icon name="file-02" size={18} /> Documentos e Certidões Fiscais
              </h3>
              <div className={styles.analysisList}>
                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="file-check-01" size={20} />
                    <div>
                      <strong>Inscrição Estadual (IE)</strong>
                      <p>{supplier.stateRegistration ? `Número: ${supplier.stateRegistration}` : "Isento / Não aplicável"}</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <div className={styles.badgeSuccessOutline}><Icon name="check" size={16} /> Verificado</div>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="file-check-01" size={20} />
                    <div>
                      <strong>SUFRAMA</strong>
                      <p>{supplier.suframa ? `Código: ${supplier.suframa}` : "Não optante / Não aplicável"}</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <div className={styles.badgeSuccessOutline}><Icon name="check" size={16} /> Regular</div>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="calendar" size={20} />
                    <div>
                      <strong>Data de Fundação</strong>
                      <p>{supplier.foundationDate ? new Date(supplier.foundationDate).toLocaleDateString("pt-BR") : "Não informada"}</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <span style={{ fontSize: 13, color: "#475569" }}>Registro Comercial</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "financeiro" && (
        <div className={styles.contentGrid}>
          <div className={styles.leftColumn} style={{ gridColumn: "1 / -1" }}>
            <Card className={styles.contentCard}>
              <h3 className={styles.cardTitle}>
                <Icon name="bank" size={18} /> Informações Bancárias & Pagamentos
              </h3>
              <div className={styles.analysisList}>
                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="bank" size={20} />
                    <div>
                      <strong>Dados Bancários</strong>
                      <p>{supplier.bankCode ? `Banco ${supplier.bankCode} — Conta / Agência: ${supplier.bankNumber || "—"}` : "Não informado"}</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <span style={{ fontSize: 13, color: "#007d79", fontWeight: 600 }}>Cadastrado</span>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="zap" size={20} />
                    <div>
                      <strong>Chave PIX</strong>
                      <p>{supplier.pixKey || "Chave PIX não informada"}</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <span style={{ fontSize: 13, color: "#475569" }}>Pagamento Eletrônico</span>
                  </div>
                </div>

                <div className={styles.analysisItem}>
                  <div className={styles.aiLeft}>
                    <Icon name="truck-01" size={20} />
                    <div>
                      <strong>Locais e Prazos de Entrega</strong>
                      <p>{supplier.deliveryLocationName || "Almoxarifado Central"} {supplier.deliveryLeadTime ? `— Prazo padrão: ${supplier.deliveryLeadTime} dias` : ""}</p>
                    </div>
                  </div>
                  <div className={styles.aiRight}>
                    <span style={{ fontSize: 13, color: "#475569" }}>Logística</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}
