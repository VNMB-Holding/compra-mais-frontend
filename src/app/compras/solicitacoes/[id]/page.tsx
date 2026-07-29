"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./solicitacoes-detail.module.css";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { getCategoryIcon } from "@/lib/utils/category-icon";

type DialogType = "approve" | "reject" | null;

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

const PRIORITY_LABEL_MAP: Record<string, string> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
  Urgent: "Urgente",
  Critical: "Crítica",
};

export default function SolicitacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const solId = params.id as string;

  const [sol, setSol] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        // Tenta buscar por ID direto ou pela lista caso seja pelo código (ex: SOL-000001)
        if (solId.startsWith("SOL-")) {
          const list = await purchaseRequestsApi.list();
          const found = list.find((item) => item.code === solId || item.id === solId);
          if (found) {
            setSol(found);
          } else {
            const data = await purchaseRequestsApi.getById(solId);
            setSol(data);
          }
        } else {
          const data = await purchaseRequestsApi.getById(solId);
          setSol(data);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes da solicitação:", err);
      } finally {
        setLoading(false);
      }
    }
    if (solId) {
      loadDetail();
    }
  }, [solId]);

  const handleApprove = async () => {
    if (!sol) return;
    setIsUpdating(true);
    try {
      await purchaseRequestsApi.updateStatus(sol.id, "Approved");
      setSol((prev) => (prev ? { ...prev, status: "Approved" } : null));
      setDialog(null);
      toast({
        variant: "success",
        title: "Solicitação aprovada!",
        message: `${sol.code} foi aprovada com sucesso e liberada para abertura de RFQ.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "error",
        title: "Erro ao aprovar",
        message: "Não foi possível atualizar o status da solicitação.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!sol) return;
    setIsUpdating(true);
    try {
      await purchaseRequestsApi.updateStatus(sol.id, "Rejected");
      setSol((prev) => (prev ? { ...prev, status: "Rejected" } : null));
      setDialog(null);
      toast({
        variant: "error",
        title: "Solicitação rejeitada",
        message: `${sol.code} foi marcada como rejeitada.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "error",
        title: "Erro ao rejeitar",
        message: "Não foi possível atualizar o status da solicitação.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (val?: number) =>
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className={styles.detailContainer} style={{ padding: 40, textAlign: "center" }}>
        <p>Carregando detalhes da solicitação...</p>
      </div>
    );
  }

  if (!sol) {
    return (
      <div className={styles.detailContainer} style={{ padding: 40, textAlign: "center" }}>
        <p>Solicitação não encontrada.</p>
        <Button variant="secondary" style={{ marginTop: 16 }} onClick={() => router.push("/compras/solicitacoes")}>
          Voltar para Solicitações
        </Button>
      </div>
    );
  }

  // Análise de categoria dos itens
  const itemCategories = sol.items?.map((i) => (i as any).category).filter(Boolean) || [];
  const uniqueCategories = Array.from(new Set(itemCategories));
  const categoryName =
    uniqueCategories.length > 1
      ? "Mista"
      : uniqueCategories.length === 1
      ? uniqueCategories[0]
      : typeof sol.category === "object"
      ? (sol.category as any).name || "Geral"
      : sol.category || "Geral";

  const totalCalculated = sol.items && sol.items.length > 0
    ? sol.items.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.estimatedUnitPrice || 0)), 0)
    : Number(sol.estimatedBudget || 0);

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
            A solicitação <strong>{sol.code}</strong> será aprovada e liberada para abertura de RFQ.
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
            A solicitação <strong>{sol.code}</strong> será rejeitada e o solicitante será notificado.
          </>
        }
        confirmLabel="Sim, rejeitar"
        onConfirm={handleReject}
        onCancel={() => setDialog(null)}
      />

      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitações
      </button>

      {/* Feedback de resultado */}
      {sol.status === "Approved" && (
        <div className={styles.resultBanner} style={{ background: "#d1fae5", borderColor: "#6ee7b7", color: "#065f46" }}>
          <Icon name="check-circle" /> Solicitação <strong>{sol.code}</strong> aprovada com sucesso. Você pode abrir uma RFQ para esta demanda.
        </div>
      )}
      {sol.status === "Rejected" && (
        <div className={styles.resultBanner} style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}>
          <Icon name="x-circle" /> Solicitação <strong>{sol.code}</strong> foi rejeitada.
        </div>
      )}

      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{sol.code}</h1>
            <Badge variant={sol.status === "Approved" ? "success" : sol.status === "Rejected" ? "gray" : "warning"}>
              {STATUS_LABEL_MAP[sol.status] || sol.status}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{sol.description}</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}>
              <Icon name="building-01" /> Centro de custo: {sol.costCenter || "Operações"}
            </span>
            <span className={styles.infoTag}>
              <Icon name={getCategoryIcon(categoryName)} /> Categoria: {categoryName}
            </span>
            <span className={`${styles.infoTag} ${styles.tagHigh}`}>
              <Icon name="chevron-up-double" /> Prioridade: {PRIORITY_LABEL_MAP[sol.priority] || sol.priority}
            </span>
          </div>
        </div>

        {sol.status === "AwaitingApproval" && (
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => setDialog("reject")} disabled={isUpdating}>
              <Icon name="x-close" /> Rejeitar Demanda
            </Button>
            <Button variant="primary" onClick={() => setDialog("approve")} disabled={isUpdating}>
              <Icon name="check" /> Aprovar Solicitação
            </Button>
          </div>
        )}

        {sol.status === "Approved" && (
          <div className={styles.headerActions}>
            <Button
              variant="primary"
              onClick={() => router.push(`/compras/rfqs/nova?solicitacao=${sol.id}`)}
            >
              <Icon name="send-03" /> Abrir RFQ Agora
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
                  <span>{sol.requesterId && sol.requesterId.length > 20 ? "Solicitante registrado" : sol.requesterId}</span>
                  <small>{new Date(sol.createdAt).toLocaleDateString("pt-BR")}</small>
                </div>
              </div>

              <div className={`${styles.stepLine} ${sol.status !== "AwaitingApproval" ? styles.lineActive : ""}`}></div>

              <div className={`${styles.step} ${sol.status === "Approved" || sol.status === "Rejected" ? styles.completed : styles.active}`}>
                <div className={styles.stepIcon}>
                  {sol.status === "Approved"
                    ? <><Icon name="users-01" /><div className={styles.checkBadge}><Icon name="check" /></div></>
                    : <Icon name="users-01" />
                  }
                </div>
                <div className={styles.stepInfo}>
                  <strong>Aprovação de Alçada</strong>
                  <span>{sol.status === "Approved" ? "Aprovado" : sol.status === "Rejected" ? "Rejeitado" : "Em Análise"}</span>
                  {sol.status === "AwaitingApproval" ? (
                    <span className={styles.warningBadgeHint}>Aguardando</span>
                  ) : (
                    <small>{new Date(sol.updatedAt).toLocaleDateString("pt-BR")}</small>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ITENS DA SOLICITAÇÃO */}
          {sol.items && sol.items.length > 0 && (
            <Card className={styles.infoCard}>
              <h4>Itens Solicitados ({sol.items.length})</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                {sol.items.map((item, idx) => (
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
                        Qtd: {item.quantity} {item.unit} {(item as any).category ? `• Categoria: ${(item as any).category}` : ""}
                      </div>
                    </div>
                    {item.estimatedUnitPrice ? (
                      <strong style={{ fontSize: 14, color: "#007d79" }}>
                        {formatCurrency(Number(item.quantity) * Number(item.estimatedUnitPrice))}
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
                <label>Título / Descrição</label>
                <span>{sol.description}</span>
              </div>
              <div className={`${styles.infoItem} ${styles.span2}`}>
                <label>Justificativa de Aquisição</label>
                <span>{sol.justification || "Atendimento de demanda operacional."}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Orçamento Previsto</label>
                <strong className={styles.textPrimary}>{formatCurrency(totalCalculated)}</strong>
              </div>
              <div className={styles.infoItem}>
                <label>Local de Entrega</label>
                <span>{sol.deliveryLocation || "A definir"}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Data Limite Desejada</label>
                <span>{sol.deadline ? new Date(sol.deadline).toLocaleDateString("pt-BR") : "-"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Lateral (Direita) */}
        <div className={styles.colSide}>
          {/* TIMELINE VERTICAL */}
          <Card className={styles.sideCard}>
            <h4>Rastreabilidade</h4>
            <div className={styles.verticalTimeline}>
              <div className={`${styles.vtItem} ${styles.vtDone}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Solicitação criada</strong>
                  <span>{sol.code}</span>
                  <small>{new Date(sol.createdAt).toLocaleDateString("pt-BR")}</small>
                </div>
              </div>
              <div className={`${styles.vtItem} ${sol.status !== "AwaitingApproval" ? styles.vtDone : styles.vtCurrent}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>
                    {sol.status === "Approved"
                      ? "Aprovada"
                      : sol.status === "Rejected"
                      ? "Rejeitada"
                      : "Aguardando aprovação"}
                  </strong>
                  <small>{new Date(sol.updatedAt).toLocaleDateString("pt-BR")}</small>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
