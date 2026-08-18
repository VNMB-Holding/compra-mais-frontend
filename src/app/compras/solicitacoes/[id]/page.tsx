"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading, Skeleton, CardSkeleton } from "@/components/ui";

import { useToast } from "@/contexts/ToastContext";
import styles from "./solicitacoes-detail.module.css";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { formatUserDisplayName, isUuid } from "@/lib/utils/format-display";
import { getApprovalChainForRequest } from "@/lib/utils/approval-limits";
import { useAuth } from "@/hooks/useAuth";
import { logError, getErrorMessage } from "@/lib/utils/error";
import { getTenantDisplayName } from "@/lib/utils/tenant";
import { PRIORITY_MAP, PURCHASE_REQUEST_STATUS_MAP as STATUS_LABEL_MAP } from "@/lib/constants/status";
import { usePurchaseRequest, useApprovePurchaseRequest, useRejectPurchaseRequest } from "@/hooks/useQueries";

type DialogType = "approve" | "reject" | null;

export default function SolicitacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const solId = params.id as string;
  const isCode = solId.startsWith("SOL-");

  const { data: querySol, isLoading: queryLoading, error: queryError } = usePurchaseRequest(isCode ? "" : solId);

  const [solOverride, setSolOverride] = useState<PurchaseRequest | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogType>(null);
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
          const list = await purchaseRequestsApi.list();
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

  const isFullyApproved = approved === true || sol?.status === "Approved" || sol?.status === "InQuote" || sol?.status === "Finished";
  const currentStatus = STATUS_LABEL_MAP[sol?.status || ""] || sol?.status || "Pendente";
  const isRejected = approved === false || sol?.status === "Rejected";

  const budget = Number(sol?.estimatedBudget || 0);
  const companyName = getTenantDisplayName(sol?.tenantId, user);
  const chain = getApprovalChainForRequest(companyName, budget);

  const pendingHistoryCount = sol?.approvalHistories?.length || 0;
  const currentPendingLevel = chain[pendingHistoryCount];
  const currentApproverName = currentPendingLevel?.roleOrName || "Gestor";

  const loggedUserName = user?.name || "";
  const isUserAdmin = user?.role === "admin" || user?.roles?.includes("Admin") || user?.scopes?.includes("approver") || user?.scopes?.includes("admin");
  const canUserApproveCurrentLevel =
    isUserAdmin ||
    (currentPendingLevel &&
      (user?.roles?.some((r) => r.trim().toLowerCase() === currentApproverName.trim().toLowerCase()) ||
        (loggedUserName && loggedUserName.trim().toLowerCase() === currentApproverName.trim().toLowerCase())));

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
          <div className={styles.layout2Col}>
            <div className={styles.colMain}>
              <CardSkeleton height={200} />
              <div style={{ marginTop: 20 }}>
                <CardSkeleton height={320} />
              </div>
            </div>
            <div className={styles.colSide}>
              <CardSkeleton height={300} />
            </div>
          </div>
        </div>
      ) : (
        <>
      
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
            <span className={styles.infoTag}><Icon name="building-01" /> {companyName}</span>
            <span className={styles.infoTag}><Icon name="marker-pin-01" /> Centro de Custo: {sol?.costCenterName || sol?.costCenterCode || "Geral"}</span>
            <span className={styles.infoTag}><Icon name="archive" /> Estoque: {sol?.corporateStockLocation || "Almoxarifado Principal"}</span>
          </div>
        </div>
        {isFullyApproved ? (
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={() => router.push(`/compras/rfqs/nova?solicitationId=${sol?.id || solId}`)}>
              <Icon name="plus" /> Criar Cotação (RFQ)
            </Button>
          </div>
        ) : !isRejected && (
          <div className={styles.headerActions}>
            {canUserApproveCurrentLevel ? (
              <>
                <Button variant="secondary" onClick={() => setDialog("reject")}>
                  <Icon name="x-close" /> Rejeitar Demanda
                </Button>
                <Button variant="primary" onClick={() => setDialog("approve")}>
                  <Icon name="check" /> Aprovar como {currentApproverName}
                </Button>
              </>
            ) : (
              <div style={{ textAlign: "right", fontSize: 13, color: "#64748b" }}>
                <span className={styles.warningBadgeHint} style={{ background: "#fef3c7", color: "#92400e", padding: "6px 12px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="clock" size={14} /> Aguardando aprovação de <strong>{currentApproverName}</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      
      <div className={styles.layout2Col}>

        
        <div className={styles.colMain}>

          
          <Card className={styles.flowCard}>
            <h4>Fluxo de Alçadas de Aprovação ({chain.length} alçada{chain.length > 1 ? "s" : ""})</h4>
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
                const historyMatch = sol?.approvalHistories && sol.approvalHistories[index];
                const isLevelDone = isFullyApproved || !!historyMatch;
                const isLevelActive = !isLevelDone && !isRejected && (index === 0 || !!(sol?.approvalHistories && sol.approvalHistories[index - 1]));

                return (
                  <React.Fragment key={lvl.level}>
                    <div className={`${styles.stepLine} ${isLevelDone || isLevelActive ? styles.lineActive : ""}`} />

                    <div className={`${styles.step} ${isLevelDone ? styles.completed : isRejected ? styles.pending : isLevelActive ? styles.active : styles.pending}`}>
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
                            ? historyMatch?.approverId && !isUuid(historyMatch.approverId)
                              ? historyMatch.approverId
                              : lvl.roleOrName
                            : isRejected && isLevelActive
                            ? `Rejeitado por ${lvl.roleOrName}`
                            : isLevelActive
                            ? `Aguardando ${lvl.roleOrName}`
                            : `Pendente (${lvl.roleOrName})`}
                        </span>
                        {isLevelActive && !isLevelDone && !isRejected ? (
                          <div style={{ marginTop: 4 }}>
                            <span className={styles.warningBadgeHint}>Falta aprovar</span>
                            <button
                              onClick={() => {
                                const histories = (sol as any)?.approvalHistories || [];
                                const token = (historyMatch as any)?.id || histories[index]?.id || sol?.id;
                                const link = `${window.location.origin}/aprovacao/${token}`;
                                navigator.clipboard.writeText(link);
                                toast({ variant: "success", title: "Link Copiado!", message: "Link de aprovação copiado para a área de transferência." });
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginLeft: 8,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                borderRadius: 4,
                                border: "1px solid #0284c7",
                                background: "#f0f9ff",
                                color: "#0369a1",
                                cursor: "pointer",
                              }}
                            >
                              <Icon name="link-01" size={12} /> Copiar Link
                            </button>
                          </div>
                        ) : isLevelDone ? (
                          <small>
                            {historyMatch?.actionDate
                              ? new Date(historyMatch.actionDate).toLocaleDateString("pt-BR")
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

              
              <div className={`${styles.step} ${isFullyApproved ? styles.completed : styles.pending}`}>
                <div className={styles.stepIcon}>
                  {isFullyApproved ? (
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
                  <span>{isFullyApproved ? "Pronto para cotação" : "Aguardando aprovação"}</span>
                </div>
              </div>

            </div>
          </Card>

          {/* Card Consolidado: Dados da Demanda e Origem ERP */}
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

                  {(sol?.corporateColigada || sol?.corporateFilial) && (
                    <div className={styles.infoItem}>
                      <label>Coligada / Filial ERP</label>
                      <span>Coligada: <strong>{sol?.corporateColigada || "1"}</strong> | Filial: <strong>{sol?.corporateFilial || "1"}</strong></span>
                    </div>
                  )}

                  {(sol?.costCenterCode || sol?.costCenterName) && (
                    <div className={styles.infoItem}>
                      <label>Centro de Custo</label>
                      <span>{sol.costCenterCode ? `[${sol.costCenterCode}] ` : ""}{sol.costCenterName || "—"}</span>
                    </div>
                  )}

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

          {/* Itens Solicitados */}
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
                      <th>Centro de Custo / Obra Destino</th>
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
                        <td>
                          <span style={{ fontSize: 12, color: "#334155" }}>
                            {item.costCenterCode ? `[${item.costCenterCode}] ` : ""}{item.costCenterName || item.corporateWorkSite || sol?.costCenterName || "—"}
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

        
        <div className={styles.colSide}>

          
          <Card className={styles.sideCard}>
            <h4>Rastreabilidade</h4>
            <div className={styles.verticalTimeline}>
              
              
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

          
          <Card className={styles.sideCard}>
            <h4>Arquivos e Termos Técnicos</h4>
            <div style={{ fontSize: 13, color: "#64748b", padding: "12px 0", textAlign: "center" }}>
              <Icon name="file-01" size={24} style={{ marginBottom: 6, color: "#94a3b8" }} />
              <p>Nenhum anexo ou documento anexado a esta solicitação.</p>
            </div>
          </Card>

        </div>
      </div>
        </>
      )}
    </div>
  );
}
