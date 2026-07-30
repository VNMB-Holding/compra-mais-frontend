"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./solicitacoes-detail.module.css";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { formatUserDisplayName } from "@/lib/utils/format-display";
import { useAuth } from "@/hooks/useAuth";

const PRIORITY_MAP: Record<string, string> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
  Urgent: "Urgente",
  Critical: "Crítica",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  Draft: "Rascunho",
  AwaitingApproval: "Aguardando aprovação",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
  InQuote: "Em Cotação",
  Finished: "Atendida",
  Pending: "Pendente",
  UnderAnalysis: "Em Análise",
  Cancelled: "Cancelada",
};

type DialogType = "approve" | "reject" | null;

export default function SolicitacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const solId = params.id as string;

  const [sol, setSol] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        if (solId.startsWith("SOL-")) {
          const list = await purchaseRequestsApi.list();
          const found = list.find((item) => item.code === solId || item.id === solId);
          if (found) {
            setSol(found);
            if (found.status === "Approved" || found.status === "InQuote" || found.status === "Finished") setApproved(true);
            if (found.status === "Rejected") setApproved(false);
          } else {
            const data = await purchaseRequestsApi.getById(solId);
            setSol(data);
            if (data.status === "Approved" || data.status === "InQuote" || data.status === "Finished") setApproved(true);
            if (data.status === "Rejected") setApproved(false);
          }
        } else {
          const data = await purchaseRequestsApi.getById(solId);
          setSol(data);
          if (data.status === "Approved" || data.status === "InQuote" || data.status === "Finished") setApproved(true);
          if (data.status === "Rejected") setApproved(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (solId) loadDetail();
  }, [solId]);

  const handleApprove = async () => {
    if (sol) {
      try {
        await purchaseRequestsApi.updateStatus(sol.id, "Approved");
      } catch (e) {
        console.error(e);
      }
    }
    setApproved(true);
    setDialog(null);
    toast({
      variant: "success",
      title: "Solicitação aprovada!",
      message: `${sol?.code || solId} foi aprovada e está liberada para abertura de RFQ.`,
    });
  };

  const handleReject = async () => {
    if (sol) {
      try {
        await purchaseRequestsApi.updateStatus(sol.id, "Rejected");
      } catch (e) {
        console.error(e);
      }
    }
    setApproved(false);
    setDialog(null);
    toast({
      variant: "error",
      title: "Solicitação rejeitada",
      message: `${sol?.code || solId} foi rejeitada. O solicitante será notificado.`,
    });
  };

  // Categoria calculada dinamicamente dos itens (se houver categorias diferentes, torna-se Mista)
  const itemCategories = sol?.items?.map((i: any) => i.category).filter(Boolean) || [];
  const uniqueCategories = Array.from(new Set(itemCategories));
  const categoryName =
    uniqueCategories.length > 1
      ? "Mista"
      : uniqueCategories.length === 1
      ? uniqueCategories[0]
      : typeof sol?.category === "object"
      ? (sol.category as any).name || "Geral"
      : sol?.category || "Geral";

  const priorityLabel = PRIORITY_MAP[sol?.priority || "Medium"] || sol?.priority || "Média";
  const currentStatus = sol?.status ? (STATUS_LABEL_MAP[sol.status] || sol.status) : "Aguardando aprovação";
  const isFullyApproved = approved === true || sol?.status === "Approved" || sol?.status === "InQuote" || sol?.status === "Finished";
  const isRejected = approved === false || sol?.status === "Rejected";

  return (
    <div className={styles.detailContainer}>

      {/* Dialog — Aprovar */}
      <ConfirmDialog
        open={dialog === "approve"}
        variant="success"
        icon="check-circle"
        title="Aprovar esta solicitação?"
        message={
          <>
            A solicitação <strong>{sol?.code || solId}</strong> será aprovada e liberada para abertura de RFQ.
            Esta ação ficará registrada no histórico de aprovações.
          </>
        }
        confirmLabel="Sim, aprovar"
        onConfirm={handleApprove}
        onCancel={() => setDialog(null)}
      />

      {/* Dialog — Rejeitar */}
      <ConfirmDialog
        open={dialog === "reject"}
        variant="danger"
        icon="x-circle"
        title="Rejeitar esta solicitação?"
        message={
          <>
            A solicitação <strong>{sol?.code || solId}</strong> será rejeitada e o solicitante será notificado.
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Sim, rejeitar"
        onConfirm={handleReject}
        onCancel={() => setDialog(null)}
      />

      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitações
      </button>

      {loading ? (
        <Loading variant="inline" message="Carregando solicitação..." size="large" />
      ) : (
        <>
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{sol?.code || solId}</h1>
            <Badge variant={isFullyApproved ? "success" : isRejected ? "gray" : "warning"}>
              {isFullyApproved ? "Aprovada" : isRejected ? "Rejeitada" : currentStatus}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{sol?.description || "Solicitação de Compra"}</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}><Icon name="building-01" /> Centro de custo: {sol?.costCenter || "Operações"}</span>
            <span className={styles.infoTag}><Icon name={getCategoryIcon(categoryName)} /> Categoria: {categoryName}</span>
            <span className={`${styles.infoTag} ${styles.tagHigh}`}><Icon name="chevron-up-double" /> Prioridade: {priorityLabel}</span>
          </div>
        </div>
        {!isFullyApproved && !isRejected && (
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => setDialog("reject")}>
              <Icon name="x-close" /> Rejeitar Demanda
            </Button>
            <Button variant="primary" onClick={() => setDialog("approve")}>
              <Icon name="check" /> Aprovar Solicitação
            </Button>
          </div>
        )}
      </div>

      {/* Layout de Duas Colunas */}
      <div className={styles.layout2Col}>

        {/* Coluna Principal (Esquerda) */}
        <div className={styles.colMain}>

          {/* STEPPER DE APROVAÇÃO HORIZONTAL */}
          <Card className={styles.flowCard}>
            <h4>Fluxo de Alçadas de Aprovação</h4>
            <div className={styles.stepperContainer}>

              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>
                  <Icon name="file-01" />
                  <div className={styles.checkBadge}><Icon name="check" /></div>
                </div>
                <div className={styles.stepInfo}>
                  <strong>Solicitante</strong>
                  <span>{sol?.requesterName || formatUserDisplayName(sol?.requesterId, user)}</span>
                  <small>{sol?.createdAt ? new Date(sol.createdAt).toLocaleDateString("pt-BR") : "22/05/2024"}</small>
                </div>
              </div>

              <div className={`${styles.stepLine} ${isFullyApproved || isRejected ? styles.lineActive : ""}`}></div>

              <div className={`${styles.step} ${isFullyApproved ? styles.completed : isRejected ? styles.pending : styles.active}`}>
                <div className={styles.stepIcon}>
                  {isFullyApproved
                    ? <><Icon name="users-01" /><div className={styles.checkBadge}><Icon name="check" /></div></>
                    : isRejected
                    ? <><Icon name="x-close" /></>
                    : <Icon name="users-01" />
                  }
                </div>
                <div className={styles.stepInfo}>
                  <strong>Gestão / Alçada de Aprovação</strong>
                  <span>{isFullyApproved ? "Aprovado" : isRejected ? "Rejeitado" : "Aguardando aprovação"}</span>
                  {!isFullyApproved && !isRejected ? (
                    <span className={styles.warningBadgeHint}>Pendente</span>
                  ) : (
                    <small>{new Date().toLocaleDateString("pt-BR")}</small>
                  )}
                </div>
              </div>

              <div className={`${styles.stepLine} ${isFullyApproved ? styles.lineActive : ""}`}></div>

              <div className={`${styles.step} ${isFullyApproved ? styles.completed : styles.pending}`}>
                <div className={styles.stepIcon}>
                  {isFullyApproved
                    ? <><Icon name="check-circle" /><div className={styles.checkBadge}><Icon name="check" /></div></>
                    : <Icon name="user-01" />
                  }
                </div>
                <div className={styles.stepInfo}>
                  <strong>Liberado para Cotação (RFQ)</strong>
                  <span>{isFullyApproved ? "Concluído" : "Pendente"}</span>
                </div>
              </div>

            </div>
          </Card>

          {/* LISTA COMPLETA DE ITENS SOLICITADOS */}
          {sol?.items && sol.items.length > 0 && (
            <Card className={styles.infoCard} style={{ marginBottom: 20 }}>
              <h4>Itens Solicitados ({sol.items.length})</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {sol.items.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: "#0f172a" }}>{item.description}</strong>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Quantidade: <strong>{item.quantity} {item.unit}</strong> {item.category ? `• Categoria: ${item.category}` : ""}
                      </div>
                    </div>
                    {item.estimatedUnitPrice ? (
                      <strong style={{ fontSize: 14, color: "#007d79" }}>
                        {(Number(item.quantity) * Number(item.estimatedUnitPrice)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </strong>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* FICHA TÉCNICA INFORMATIVA */}
          <Card className={styles.infoCard}>
            <h4>Ficha de Informações Técnicas</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Descrição do Item</label>
                <span>{sol?.description || "—"}</span>
              </div>
              <div className={`${styles.infoItem} ${styles.span2}`}>
                <label>Justificativa de Aquisição</label>
                <span>{sol?.justification || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Volume Estimado</label>
                <strong>
                  {sol?.items && sol.items.length > 0
                    ? `${sol.items.reduce((acc: number, i: any) => acc + Number(i.quantity), 0)} ${sol.items[0]?.unit || "UN"}`
                    : "—"}
                </strong>
              </div>
              <div className={styles.infoItem}>
                <label>Orçamento Previsto</label>
                <strong className={styles.textPrimary}>
                  {sol?.estimatedBudget
                    ? Number(sol.estimatedBudget).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : "—"}
                </strong>
              </div>
              <div className={styles.infoItem}>
                <label>Local de Entrega</label>
                <span>{sol?.deliveryLocation || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Data Limite Desejada</label>
                <span>{sol?.deadline ? new Date(sol.deadline).toLocaleDateString("pt-BR") : "—"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Lateral (Direita) */}
        <div className={styles.colSide}>

          {/* TIMELINE VERTICAL REAIS DE RASTREABILIDADE */}
          <Card className={styles.sideCard}>
            <h4>Rastreabilidade</h4>
            <div className={styles.verticalTimeline}>
              
              {/* Evento 1: Criação / Envio */}
              <div className={`${styles.vtItem} ${styles.vtDone}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Solicitação enviada</strong>
                  <span>Por {sol?.requesterName || formatUserDisplayName(sol?.requesterId, user)}</span>
                  <small>
                    {sol?.createdAt
                      ? `${new Date(sol.createdAt).toLocaleDateString("pt-BR")} às ${new Date(sol.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                      : "—"}
                  </small>
                </div>
              </div>

              {/* Eventos da API se existirem */}
              {sol?.approvalHistories && sol.approvalHistories.length > 0 ? (
                sol.approvalHistories.map((hist: any, index: number) => (
                  <div key={hist.id || index} className={`${styles.vtItem} ${styles.vtDone}`}>
                    <div className={styles.vtDot}></div>
                    <div className={styles.vtContent}>
                      <strong>{hist.action === "Approved" ? "Aprovado na alçada" : hist.action === "Rejected" ? "Rejeitado na alçada" : hist.action}</strong>
                      <span>{hist.comments || "Gestão da área"}</span>
                      <small>
                        {hist.actionDate
                          ? `${new Date(hist.actionDate).toLocaleDateString("pt-BR")} às ${new Date(hist.actionDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                          : "—"}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                /* Evento de Status Atual (se ainda não tem histórico explícito) */
                <div className={`${styles.vtItem} ${isFullyApproved || isRejected ? styles.vtDone : styles.vtCurrent}`}>
                  <div className={styles.vtDot}></div>
                  <div className={styles.vtContent}>
                    <strong>
                      {isFullyApproved
                        ? "Aprovada na Alçada"
                        : isRejected
                        ? "Rejeitada na Alçada"
                        : "Aguardando aprovação"}
                    </strong>
                    <span>{isFullyApproved ? "Liberada para cotação" : isRejected ? "Solicitação encerrada" : "Análise pendente"}</span>
                    {(isFullyApproved || isRejected) && (
                      <small>
                        {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    )}
                  </div>
                </div>
              )}

              {/* Evento 3: RFQ (se aplicável) */}
              {(isFullyApproved || sol?.status === "InQuote") && (
                <div className={`${styles.vtItem} ${sol?.status === "InQuote" ? styles.vtDone : styles.vtCurrent}`}>
                  <div className={styles.vtDot}></div>
                  <div className={styles.vtContent}>
                    <strong>{sol?.status === "InQuote" ? "Processo de Cotação Aberto" : "Pronta para Cotação"}</strong>
                    <span>Módulo de Mercado (RFQ)</span>
                  </div>
                </div>
              )}

            </div>
          </Card>

          {/* ANEXOS */}
          <Card className={styles.sideCard}>
            <h4>Arquivos e Termos Técnicos</h4>
            <div className={styles.fileRow}>
              <Icon name="file-01" />
              <div className={styles.fileInfo}>
                <strong>Especificacao_Tecnica_Diesel.pdf</strong>
                <small>PDF • 245 KB</small>
              </div>
              <button className={styles.downloadIconBtn} title="Baixar anexo">
                <Icon name="download-01" />
              </button>
            </div>
          </Card>

        </div>
      </div>
        </>
      )}
    </div>
  );
}
