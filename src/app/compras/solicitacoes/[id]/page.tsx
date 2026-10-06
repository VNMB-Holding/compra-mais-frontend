"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading, Skeleton, CardSkeleton } from "@/components/ui";

import { useToast } from "@/contexts/ToastContext";
import styles from "./solicitacoes-detail.module.css";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { formatUserDisplayName, isUuid } from "@/lib/utils/format-display";
import { getApprovalChainForRequest, calculateChainFromRules, isUserEligibleToApprove } from "@/lib/utils/approval-limits";
import { useAuth } from "@/hooks/useAuth";
import { logError, getErrorMessage } from "@/lib/utils/error";
import { getTenantDisplayName, formatCorporateBranch, resolvePurchaseRequestBranch } from "@/lib/utils/tenant";
import { findCompanyBranch } from "@/lib/constants/companies";
import { formatPriority, PURCHASE_REQUEST_STATUS_MAP as STATUS_LABEL_MAP } from "@/lib/constants/status";

import { usePurchaseRequest, useApprovePurchaseRequest, useRejectPurchaseRequest } from "@/hooks/useQueries";

type DialogType = "approve" | "reject" | "cancel" | null;

export default function SolicitacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const solId = params.id as string;
  const isCode = solId.startsWith("SOL-");

  const { data: querySol, isLoading: queryLoading, error: queryError } = usePurchaseRequest(isCode ? "" : solId);

  const [solOverride, setSolOverride] = useState<PurchaseRequest | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setSolOverride(null);
    setApproved(null);
  }, [solId]);

  const sol = solOverride || querySol || null;
  const loading = isCode ? codeLoading : queryLoading && !solOverride;

  useEffect(() => {
    if (isCode) {
      let cancelled = false;
      setCodeLoading(true);
      (async () => {
        try {
          const list = await purchaseRequestsApi.list({ companyCode: "TODAS" });
          const found = list.find((item) => item.code === solId || item.id === solId);
          if (cancelled) return;
          setSolOverride(found || null);
          if (!found) {
            toast({ variant: "error", title: "Solicitação não encontrada", message: `Não foi possível localizar ${solId}.` });
          }
        } catch (err) {
          logError("solicitacoes/[id]/load", err);
          if (!cancelled) toast({ variant: "error", title: "Erro ao carregar solicitação", message: getErrorMessage(err) });
        } finally {
          if (!cancelled) setCodeLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [solId, isCode, toast]);

  useEffect(() => {
    if (queryError && !querySol) {
      logError("solicitacoes/[id]/load", queryError);
      toast({ variant: "error", title: "Erro ao carregar solicitação", message: getErrorMessage(queryError) });
    }
  }, [queryError, querySol, toast]);

  useEffect(() => {
    if (sol) {
      if (sol.status === "Approved" || sol.status === "InQuote" || sol.status === "Finished") setApproved(true);
      if (sol.status === "Rejected") setApproved(false);
    }
  }, [sol]);

  const approveMutation = useApprovePurchaseRequest();
  const rejectMutation = useRejectPurchaseRequest();

  const handleApprove = async () => {
    if (sol) {
      try {
        await approveMutation.mutateAsync({ id: sol.id });
        const fresh = await purchaseRequestsApi.getById(sol.id);
        setSolOverride(fresh);

        const isFinal = fresh.status === "Approved" || fresh.status === "InQuote" || fresh.status === "Finished";

        if (isFinal) {
          setApproved(true);
          toast({
            variant: "success",
            title: "Solicitação aprovada!",
            message: `${fresh.code || solId} foi totalmente aprovada e está liberada para abertura de RFQ.`,
          });
        } else {
          toast({
            variant: "success",
            title: "Alçada aprovada!",
            message: `Sua aprovação foi registrada na alçada atual. A solicitação avançou para o próximo nível.`,
          });
        }
      } catch (e) {
        logError("solicitacoes/[id]/approve", e);
        toast({ variant: "error", title: "Erro ao aprovar", message: getErrorMessage(e) });
        return;
      }
    }
    setDialog(null);
  };

  const handleReject = async () => {
    if (sol) {
      try {
        await rejectMutation.mutateAsync({ id: sol.id });
        const fresh = await purchaseRequestsApi.getById(sol.id);
        setSolOverride(fresh);
        setApproved(false);
      } catch (e) {
        logError("solicitacoes/[id]/reject", e);
        toast({ variant: "error", title: "Erro ao rejeitar", message: getErrorMessage(e) });
        return;
      }
    }
    setDialog(null);
    toast({
      variant: "warning",
      title: "Solicitação rejeitada",
      message: `${sol?.code || solId} foi rejeitada. O solicitante será notificado.`,
    });
  };

  const [cancelling, setCancelling] = useState(false);
  const handleCancel = async () => {
    if (!sol) return;
    if (isInQuote) {
      toast({
        variant: "warning",
        title: "Cancelamento bloqueado",
        message: "N�o � poss�vel cancelar uma solicita��o que j� est� em processo de cota��o.",
      });
      setDialog(null);
      return;
    }
    const reason = cancelReason.trim();
    if (!reason) {
      toast({
        variant: "warning",
        title: "Motivo obrigatório",
        message: "Por favor, informe a justificativa do cancelamento.",
      });
      return;
    }
    setCancelling(true);
    try {
      await purchaseRequestsApi.updateStatus(sol.id, "Cancelled", reason);
      const fresh = await purchaseRequestsApi.getById(sol.id);
      setSolOverride(fresh);
      setApproved(false);
      setCancelReason("");
      toast({
        variant: "warning",
        title: "Solicitação cancelada",
        message: `A solicitação ${fresh.code || solId} foi cancelada com sucesso.`,
      });
    } catch (e) {
      logError("solicitacoes/[id]/cancel", e);
      toast({ variant: "error", title: "Erro ao cancelar", message: getErrorMessage(e) });
    } finally {
      setCancelling(false);
      setDialog(null);
    }
  };

  const isDraft = sol?.status === "Draft";
  const isApproved = approved === true || sol?.status === "Approved";
  const activeRfqs = (sol?.rfqs ?? []).filter((r: any) => r.status !== "Cancelled");
  const hasActiveRfq = activeRfqs.length > 0;
  const isInQuote = sol?.status === "InQuote" || hasActiveRfq;
  const isFinished = sol?.status === "Finished";
  const isRejected = approved === false || sol?.status === "Rejected";
  const isCancelled = sol?.status === "Cancelled";

  const isEligibleForRfq = isApproved && !hasActiveRfq && !isFinished && !isCancelled;
  const hasApprovedGovernance = isApproved || isInQuote || isFinished;
  const isFullyApproved = hasApprovedGovernance && !isCancelled;
  const isAwaitingApproval = !isDraft && !isFullyApproved && !isRejected && !isCancelled;
  const currentStatus = isCancelled ? "Cancelada" : isDraft ? "Rascunho" : (STATUS_LABEL_MAP[sol?.status || ""] || sol?.status || "Pendente");

  const [sendingApproval, setSendingApproval] = useState(false);
  const [remoteChain, setRemoteChain] = useState<any[] | null>(null);
  const [isChainLoading, setIsChainLoading] = useState(true);

  const budget = Number(sol?.estimatedBudget || 0);
  const rawBranchCode = sol?.companyCode || sol?.corporateFilial || (sol as any)?.filialCode;
  const companyCode = rawBranchCode ? String(rawBranchCode).trim() : undefined;

  useEffect(() => {
    if (!sol) return;
    let cancelled = false;
    setIsChainLoading(true);
    purchaseRequestsApi
      .getApprovalChain(companyCode, budget)
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res) && res.length > 0) {
          const activeRules = res.filter((r: any) => r.active !== false && (r.flowType === "solicitacao" || !r.flowType));
          const calculated = calculateChainFromRules(activeRules, budget, companyCode, "solicitacao");
          const finalChain = calculated.length > 0 ? calculated : activeRules.map((r: any) => ({
            level: r.level,
            roleOrName: r.approverName || r.approverIdentifier,
            maxLimit: r.maxAmount,
            approverType: "user",
            approverIdentifier: r.approverIdentifier,
          }));
          setRemoteChain(finalChain);
        }
      })
      .catch((err) => {
        console.warn("Falha ao carregar cadeia dinâmica de aprovação:", err);
      })
      .finally(() => {
        if (!cancelled) setIsChainLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sol?.id, companyCode, budget]);

  const handleSendToApproval = async () => {
    if (!sol) return;
    setSendingApproval(true);
    try {
      await purchaseRequestsApi.update(sol.id, { status: "AwaitingApproval" });
      const fresh = await purchaseRequestsApi.getById(sol.id);
      setSolOverride(fresh);
      toast({
        variant: "success",
        title: "Solicitação Enviada",
        message: `Solicitação ${fresh.code || solId} enviada para aprovação com sucesso!`,
      });
    } catch (err) {
      logError("solicitacoes/[id]/sendToApproval", err);
      toast({
        variant: "error",
        title: "Erro ao enviar",
        message: getErrorMessage(err),
      });
    } finally {
      setSendingApproval(false);
    }
  };

  const companyName = resolvePurchaseRequestBranch(sol, user);
  
  const chain = remoteChain ?? getApprovalChainForRequest(companyName, budget);

  const pendingHistories = (sol?.approvalHistories || []).filter((h) => h.status === "Pending");
  const approvedHistories = (sol?.approvalHistories || []).filter((h) => h.status === "Approved");
  const currentStepIndex = approvedHistories.length;
  const activePendingHistory = pendingHistories[0];
  const currentPendingLevel = chain[currentStepIndex] || chain[chain.length - 1];
  const currentApproverName =
    (activePendingHistory as any)?.approverName ||
    (activePendingHistory?.approverId && !isUuid(activePendingHistory.approverId) ? activePendingHistory.approverId : "") ||
    currentPendingLevel?.roleOrName ||
    "Gestor";
  const currentApproverIdentifier =
    activePendingHistory?.approverId ||
    currentPendingLevel?.approverIdentifier ||
    currentApproverName;

  const handleCopyApprovalLink = (tokenOverride?: string) => {
    const activePending = pendingHistories[0];
    const activeToken = tokenOverride || activePending?.id || sol?.id;
    if (!activeToken) return;
    const link = `${window.location.origin}/aprovacao/${activeToken}`;
    navigator.clipboard.writeText(link);
    toast({
      variant: "success",
      title: "Link Copiado!",
      message: "Link de aprovação copiado para a área de transferência.",
    });
  };

  
  const currentAssignedApproverId = pendingHistories[0]?.approverId;
  const canUserApproveCurrentLevel =
    !isChainLoading &&
    isUserEligibleToApprove(user, currentApproverIdentifier, currentAssignedApproverId);

  return (
    <div className={styles.detailContainer}>

      <ConfirmDialog
        open={dialog === "approve"}
        variant="success"
        icon="check-circle"
        title="Aprovar esta solicitação?"
        message={
          <>
            A solicitação <strong>{sol?.code || solId}</strong> será aprovada como <strong>{currentApproverName}</strong> na alçada de governança.
          </>
        }
        confirmLabel="Sim, aprovar"
        onConfirm={handleApprove}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "reject"}
        variant="danger"
        icon="x-circle"
        title="Rejeitar esta solicitação?"
        message={
          <>
            A solicitação <strong>{sol?.code || solId}</strong> será rejeitada na alçada de <strong>{currentApproverName}</strong>.
          </>
        }
        confirmLabel="Sim, rejeitar"
        onConfirm={handleReject}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "cancel"}
        variant="danger"
        icon="trash-01"
        title="Cancelar Solicitação de Compra?"
        loading={cancelling}
        loadingConfirmLabel="Cancelando..."
        confirmDisabled={!cancelReason.trim()}
        message={
          <>
            Tem certeza de que deseja cancelar a solicitação <strong>{sol?.code || solId}</strong>? Esta ação interromperá o fluxo de compras e arquivará a demanda.
          </>
        }
        confirmLabel="Sim, cancelar solicitação"
        onConfirm={handleCancel}
        onCancel={() => {
          setDialog(null);
          setCancelReason("");
        }}
      >
        <div style={{ marginTop: 12, textAlign: "left" }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            Motivo do cancelamento <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Descreva detalhadamente a justificativa para o cancelamento..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </ConfirmDialog>

      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitações
      </button>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <Skeleton variant="title" width="30%" />
            <Skeleton variant="text" width="60%" style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <Skeleton width={140} height={28} />
              <Skeleton width={140} height={28} />
              <Skeleton width={140} height={28} />
            </div>
          </div>
          <div className={styles.layoutSingleCol}>
            <div className={styles.colMain}>
              <CardSkeleton height={200} />
              <div style={{ marginTop: 20 }}>
                <CardSkeleton height={320} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{sol?.code || solId}</h1>
            <Badge variant={isFullyApproved ? "success" : isRejected ? "danger" : isDraft ? "gray" : "warning"}>
              {currentStatus}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{sol?.description || "Solicitação de Compra"}</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}><Icon name="building-01" /> {companyName}</span>
            <span className={styles.infoTag}><Icon name="archive" /> Estoque: {sol?.corporateStockLocation || "Almoxarifado Principal"}</span>
            {Boolean((sol as any)?.priority || (sol as any)?.prioridade) && (
              <span className={styles.infoTag}>
                <Icon name="clock" /> Prioridade: {formatPriority((sol as any)?.priority || (sol as any)?.prioridade)}
              </span>
            )}
          </div>
        </div>

        {isDraft ? (
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => router.push(`/compras/solicitacoes/nova?editId=${sol?.id || solId}`)}>
              <Icon name="edit-01" /> Editar Rascunho
            </Button>
            <Button variant="primary" disabled={sendingApproval} onClick={handleSendToApproval}>
              <Icon name="send-01" /> {sendingApproval ? "Enviando..." : "Enviar para Aprovação"}
            </Button>
          </div>
        ) : isEligibleForRfq ? (
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={() => router.push(`/compras/rfqs/nova?solicitationId=${sol?.id || solId}`)}>
              <Icon name="plus" /> Criar Cotação (RFQ)
            </Button>
          </div>
        ) : isInQuote ? (
          <div className={styles.headerActions}>
            {activeRfqs.length > 0 ? (
              <Button variant="primary" onClick={() => router.push(`/compras/rfqs/${activeRfqs[0]?.id || activeRfqs[0]?.code}`)}>
                <Icon name="arrow-right" /> Ver Cotação ({activeRfqs[0]?.code || "RFQ"})
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => router.push(`/compras/rfqs`)}>
                <Icon name="arrow-right" /> Ver Cotações em Aberto
              </Button>
            )}
          </div>
        ) : isFinished ? (
          <div className={styles.headerActions}>
            <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", padding: "6px 12px", borderRadius: 6, border: "1px solid #bbf7d0" }}>
              <Icon name="check-circle" size={16} /> Demanda Atendida
            </span>
          </div>
        ) : !isRejected && (
          <div className={styles.headerActions}>
            {canUserApproveCurrentLevel ? (
              <>
                <Button variant="secondary" onClick={() => handleCopyApprovalLink()} title="Copiar link desta aprovação">
                  <Icon name="copy-01" /> Copiar Link
                </Button>
                <Button variant="secondary" onClick={() => setDialog("reject")}>
                  <Icon name="x-close" /> Rejeitar Demanda
                </Button>
                <Button variant="primary" onClick={() => setDialog("approve")}>
                  <Icon name="check" /> Aprovar como {currentApproverName}
                </Button>
              </>
            ) : (
              <div className={styles.waitingApproverInfo}>
                <span className={styles.waitingBadge}>
                  <Icon name="clock" size={14} /> Aguardando aprovação de <strong>{currentApproverName}</strong>
                </span>
                <Button
                  variant="secondary"
                  onClick={() => handleCopyApprovalLink()}
                  title="Copiar link de aprovação para enviar ao gestor"
                >
                  <Icon name="copy-01" /> Copiar Link
                </Button>
              </div>
            )}
          </div>
        )}

        {!isCancelled && !isFinished && !isInQuote && (
          <div className={styles.headerActions}>
            <Button
              variant="danger"
              onClick={() => setDialog("cancel")}
              title="Cancelar esta solicitação de compra"
            >
              <Icon name="x-close" /> Cancelar Solicitação
            </Button>
          </div>
        )}
      </div>

      {isDraft && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 13 }}>
          <Icon name="info-circle" size={18} style={{ color: "#0284c7", flexShrink: 0 }} />
          <span>
            Esta solicitação está salva como <strong>rascunho</strong> e ainda não entrou na esteira de governança. Você pode continuar editando os itens e prazos ou clicar em <strong>Enviar para Aprovação</strong> para iniciar a análise dos gestores.
          </span>
        </div>
      )}

      <div className={styles.layoutSingleCol}>

        <div className={styles.colMain}>

          <Card className={styles.flowCard}>
            <div className={styles.flowCardHeader}>
              <h4>Fluxo de Alçadas de Aprovação ({chain.length} alçada{chain.length !== 1 ? "s" : ""})</h4>
            </div>
            <div className={styles.stepperContainer}>

              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>
                  <Icon name="file-01" />
                  <div className={styles.checkBadge}><Icon name="check" /></div>
                </div>
                <div className={styles.stepInfo}>
                  <strong>Solicitante</strong>
                  <span>{sol?.requesterName || formatUserDisplayName(sol?.requesterId, user)}</span>
                  <small>{sol?.createdAt ? new Date(sol.createdAt).toLocaleDateString("pt-BR") : "—"}</small>
                </div>
              </div>

              {chain.map((lvl, index) => {
                const approvedHistory = approvedHistories[index];
                const isLevelDone = isFullyApproved || !!approvedHistory;
                const isLevelActive = !isDraft && !isLevelDone && !isRejected && index === currentStepIndex;

                return (
                  <React.Fragment key={lvl.level}>
                    <div className={`${styles.stepLine} ${isLevelDone || isLevelActive ? styles.lineActive : ""}`} />

                    <div className={`${styles.step} ${isLevelDone ? styles.completed : isRejected && isLevelActive ? styles.pending : isLevelActive ? styles.active : styles.pending}`}>
                      <div className={styles.stepIcon}>
                        {isLevelDone ? (
                          <>
                            <Icon name="users-01" />
                            <div className={styles.checkBadge}><Icon name="check" /></div>
                          </>
                        ) : isRejected && isLevelActive ? (
                          <Icon name="x-close" />
                        ) : (
                          <Icon name="users-01" />
                        )}
                      </div>
                      <div className={styles.stepInfo}>
                        <strong>Alçada {lvl.level}</strong>
                        <span>
                          {isLevelDone
                            ? (approvedHistory as any)?.approverName ||
                              (approvedHistory?.approverId && !isUuid(approvedHistory.approverId)
                                ? approvedHistory.approverId
                                : lvl.roleOrName)
                            : isRejected && isLevelActive
                            ? `Rejeitado por ${(activePendingHistory as any)?.approverName || lvl.roleOrName}`
                            : isLevelActive
                            ? `Aguardando ${(activePendingHistory as any)?.approverName || lvl.roleOrName}`
                            : `Pendente (${lvl.roleOrName})`}
                        </span>
                        {isLevelActive && !isLevelDone && !isRejected ? (
                          <div className={styles.stepActiveRow}>
                            <span className={styles.stepWarningBadge}>Falta aprovar</span>
                          </div>
                        ) : isLevelDone ? (
                          <small>
                            {approvedHistory?.actionDate
                              ? new Date(approvedHistory.actionDate).toLocaleDateString("pt-BR")
                              : new Date().toLocaleDateString("pt-BR")}
                          </small>
                        ) : (
                          <small style={{ color: "#94a3b8" }}>Pendente</small>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}


              <div className={`${styles.stepLine} ${isFullyApproved ? styles.lineActive : ""}`} />

              <div className={`${styles.step} ${hasApprovedGovernance ? styles.completed : styles.pending}`}>
                <div className={styles.stepIcon}>
                  {isInQuote ? (
                    <>
                      <Icon name="trend-up-01" />
                      <div className={styles.checkBadge}><Icon name="check" /></div>
                    </>
                  ) : isFinished ? (
                    <>
                      <Icon name="check-circle" />
                      <div className={styles.checkBadge}><Icon name="check" /></div>
                    </>
                  ) : isEligibleForRfq ? (
                    <>
                      <Icon name="check-circle" />
                      <div className={styles.checkBadge}><Icon name="check" /></div>
                    </>
                  ) : (
                    <Icon name="rocket-01" />
                  )}
                </div>
                <div className={styles.stepInfo}>
                  <strong>Liberação para RFQ</strong>
                  <span>
                    {isInQuote
                      ? "Cotação em andamento"
                      : isFinished
                      ? "Demanda finalizada"
                      : isEligibleForRfq
                      ? "Pronta para cotação"
                      : "Aguardando aprovação"}
                  </span>
                </div>
              </div>

            </div>
          </Card>

          <Card className={styles.infoCard} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="file-02" size={18} /> Detalhamento da Solicitação
              </h4>
              {sol?.corporateCode ? (
                <Badge variant="primary">Sincronizado do ERP Corporate</Badge>
              ) : (
                <Badge variant="gray">Origem Interna</Badge>
              )}
            </div>

            <div className={styles.infoGrid}>
              <div className={`${styles.infoItem} ${styles.span2}`}>
                <label>Observação Geral / Demanda</label>
                <span style={{ fontSize: 14, color: "#1e293b", fontWeight: 500, lineHeight: 1.5 }}>
                  {sol?.notes || sol?.description || "—"}
                </span>
              </div>

              <div className={styles.infoItem}>
                <label>Empresa / Unidade</label>
                <strong>{companyName || "—"}</strong>
              </div>

              <div className={styles.infoItem}>
                <label>Solicitante</label>
                <span>{sol?.corporateRequester || sol?.requesterName || formatUserDisplayName(sol?.requesterId, user)}</span>
              </div>

              {sol?.corporateCode && (
                <>
                  <div className={styles.infoItem}>
                    <label>Cód. Solicitação ERP</label>
                    <strong style={{ color: "#007d79", fontSize: 14 }}>#{sol.corporateCode}</strong>
                  </div>

                  {(sol?.corporateColigada || sol?.corporateFilial || sol?.companyCode) && (() => {
                    const branch = findCompanyBranch(sol?.companyCode || sol?.corporateFilial);
                    return (
                      <div className={styles.infoItem}>
                        <label>Unidade ERP (Filial / Coligada)</label>
                        <span>
                          {branch ? (
                            <>
                              <strong>{branch.name}</strong> ({branch.acronym}) — Cód. <strong>{branch.code}</strong>
                            </>
                          ) : (
                            <>Coligada: <strong>{sol?.corporateColigada || "1"}</strong> | Filial: <strong>{sol?.corporateFilial || sol?.companyCode || "1"}</strong></>
                          )}
                        </span>
                      </div>
                    );
                  })()}

                  <div className={styles.infoItem}>
                    <label>Local de Estoque</label>
                    <span>{sol?.corporateStockLocation || "—"}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <label>Requisição de Origem</label>
                    <span>{sol?.corporateOriginReq || "—"}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <label>Código de Integração</label>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{sol?.corporateIntegration || "—"}</span>
                  </div>
                </>
              )}

              <div className={styles.infoItem}>
                <label>Data de Abertura</label>
                <span>{sol?.createdAt ? new Date(sol.createdAt).toLocaleDateString("pt-BR") : "—"}</span>
              </div>

              <div className={styles.infoItem}>
                <label>Total de Itens</label>
                <strong>{sol?.items?.length || 0} produto(s)</strong>
              </div>
            </div>
          </Card>

          {sol?.items && sol.items.length > 0 && (
            <Card noPadding className={styles.itemsTableCard}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="package" size={18} /> Produtos / Materiais Solicitados ({sol.items.length})
                </h4>
              </div>
              <div className={styles.itemsTableWrapper}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px", textAlign: "center" }}>#</th>
                      <th style={{ width: "120px" }}>Cód. ERP</th>
                      <th>Descrição do Material / Serviço</th>
                      <th style={{ width: "120px", textAlign: "right" }}>Quantidade</th>
                      <th style={{ width: "80px", textAlign: "center" }}>Unidade</th>
                      <th style={{ width: "120px", textAlign: "center" }}>Necessidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sol.items.map((item: any, idx: number) => (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 12 }}>
                          {item.corporateItemNumber || idx + 1}
                        </td>
                        <td>
                          {item.corporateItemCode ? (
                            <Badge variant="gray">Cód: {item.corporateItemCode}</Badge>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong style={{ color: "#0f172a", fontSize: 13 }}>{item.description}</strong>
                            {item.notes && <small style={{ color: "#64748b", marginTop: 2 }}>{item.notes}</small>}
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                          {item.quantity}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569", fontWeight: 600 }}>
                            {item.unit}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontSize: 12, color: "#475569" }}>
                          {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString("pt-BR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
