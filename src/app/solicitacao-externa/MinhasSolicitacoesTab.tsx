"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Badge,
  Icon,
  EmptyState,
  QuickDetailDrawer,
} from "@/components/ui";
import { User } from "@/types/auth";

import { usePurchaseRequests, usePurchaseRequest } from "@/hooks/useQueries";
import {
  PURCHASE_REQUEST_STATUS_MAP as STATUS_MAP,
  getStatusBadgeVariant,
  formatPriority,
} from "@/lib/constants/status";
import { formatCurrency } from "@/lib/utils/format-display";
import { useToast } from "@/contexts/ToastContext";
import styles from "./MinhasSolicitacoesTab.module.css";

interface MinhasSolicitacoesTabProps {
  user: User | null;
  onNewRequestClick: () => void;
  initialSelectedProtocol?: string | null;
  onClearInitialProtocol?: () => void;
}

export default function MinhasSolicitacoesTab({
  user,
  onNewRequestClick,
  initialSelectedProtocol,
  onClearInitialProtocol,
}: MinhasSolicitacoesTabProps) {
  const { toast } = useToast();
  const { data: allRequests = [], isLoading } = usePurchaseRequests();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data: selectedRequestDetail, isLoading: isLoadingDetail } = usePurchaseRequest(
    selectedRequestId || "",
  );

  const userRequests = useMemo(() => {
    if (!allRequests || !user) return [];
    const normalizedUserEmail = user.email?.trim().toLowerCase();
    const normalizedUserName = user.name?.trim().toLowerCase();

    return allRequests.filter((pr) => {
      if (pr.requesterId && pr.requesterId === user.id) return true;
      if (normalizedUserEmail && pr.requesterEmail?.trim().toLowerCase() === normalizedUserEmail) {
        return true;
      }
      if (normalizedUserName && pr.requesterName?.trim().toLowerCase() === normalizedUserName) {
        return true;
      }
      if (pr.corporateRequester) {
        const lowerCorp = pr.corporateRequester.toLowerCase();
        if (normalizedUserEmail && lowerCorp.includes(normalizedUserEmail)) return true;
        if (normalizedUserName && lowerCorp.includes(normalizedUserName)) return true;
      }
      return false;
    });
  }, [allRequests, user]);

  useEffect(() => {
    if (initialSelectedProtocol && userRequests.length > 0) {
      const match = userRequests.find(
        (r) =>
          r.code === initialSelectedProtocol ||
          r.corporateCode === initialSelectedProtocol ||
          r.id === initialSelectedProtocol,
      );
      if (match) {
        setSelectedRequestId(match.id);
      }
      onClearInitialProtocol?.();
    }
  }, [initialSelectedProtocol, userRequests, onClearInitialProtocol]);

  const filteredRequests = useMemo(() => {
    return userRequests.filter((pr) => {
      if (statusFilter !== "ALL") {
        if (pr.status !== statusFilter) return false;
      }

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const code = (pr.code || "").toLowerCase();
        const corpCode = (pr.corporateCode || "").toLowerCase();
        const desc = (pr.description || "").toLowerCase();
        const just = (pr.justification || "").toLowerCase();
        const dept = (pr.department || pr.costCenterName || "").toLowerCase();
        const hasItem = pr.items?.some((it) => it.description.toLowerCase().includes(query));

        if (
          !code.includes(query) &&
          !corpCode.includes(query) &&
          !desc.includes(query) &&
          !just.includes(query) &&
          !dept.includes(query) &&
          !hasItem
        ) {
          return false;
        }
      }

      return true;
    });
  }, [userRequests, statusFilter, search]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast({
      variant: "success",
      title: "Protocolo copiado",
      message: `${code} copiado para a área de transferência.`,
    });
  };

  const getTimelineStatus = (status: string) => {
    const s = status.toLowerCase();
    const isApprovedOrAhead = [
      "approved",
      "aprovada",
      "inquote",
      "finished",
      "atendida",
    ].includes(s);
    const isInQuoteOrAhead = ["inquote", "finished", "atendida"].includes(s);
    const isFinished = ["finished", "atendida"].includes(s);
    const isRejected = ["rejected", "rejeitada"].includes(s);

    return {
      created: true,
      approval: isRejected ? "rejected" : isApprovedOrAhead ? "done" : "active",
      quote: isInQuoteOrAhead ? (isFinished ? "done" : "active") : "pending",
      finished: isFinished ? "done" : "pending",
    };
  };

  const activeRequest = selectedRequestDetail || userRequests.find((r) => r.id === selectedRequestId);

  return (
    <div className={styles.container}>
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Icon name="search-lg" size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por código, título ou item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.selectWrap}>
          <select
            className={styles.statusFilterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="ALL">Todos os status</option>
            <option value="AwaitingApproval">Aguardando aprovação</option>
            <option value="Approved">Aprovada</option>
            <option value="InQuote">Em Cotação</option>
            <option value="Finished">Atendida</option>
            <option value="Rejected">Rejeitada</option>
            <option value="Cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.requestsGrid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: "30%" }} />
              <div className={styles.skeletonLine} style={{ width: "70%", height: 20 }} />
              <div className={styles.skeletonLine} style={{ width: "90%" }} />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          illustration="document-empty"
          title={
            search || statusFilter !== "ALL"
              ? "Nenhuma solicitação encontrada"
              : "Você ainda não possui solicitações"
          }
          description={
            search || statusFilter !== "ALL"
              ? "Tente ajustar seus termos de pesquisa ou remover os filtros."
              : "Envie sua primeira necessidade de compra para cotação e aprovação corporativa."
          }
          action={{
            label: "Criar Nova Solicitação",
            icon: "plus",
            onClick: onNewRequestClick,
          }}
        />
      ) : (
        <div className={styles.requestsGrid}>
          {filteredRequests.map((pr) => {
            const displayCode = pr.code || pr.corporateCode || `#${pr.id.slice(0, 8)}`;
            const statusLabel = STATUS_MAP[pr.status] || pr.status;
            const badgeVariant = getStatusBadgeVariant(pr.status);
            const dateStr = pr.createdAt
              ? new Date(pr.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            const timeline = getTimelineStatus(pr.status);

            return (
              <div
                key={pr.id}
                className={styles.requestCard}
                onClick={() => setSelectedRequestId(pr.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedRequestId(pr.id);
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <span
                      className={styles.protocolBadge}
                      title="Clique para copiar o protocolo"
                      onClick={(e) => handleCopyCode(e, displayCode)}
                    >
                      {displayCode}
                    </span>
                    <span className={styles.cardDate}>
                      <Icon name="calendar" size={14} /> {dateStr}
                    </span>
                  </div>
                  <Badge variant={badgeVariant}>{statusLabel}</Badge>
                </div>

                <h3 className={styles.cardTitle}>
                  {pr.description || "Solicitação de Compras & Suprimentos"}
                </h3>

                <div className={styles.cardMetaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Unidade:</span>
                    <span className={styles.metaValue}>{pr.branchName || "Matriz"}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Setor:</span>
                    <span className={styles.metaValue}>
                      {pr.department || pr.costCenterName || "Geral"}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Itens:</span>
                    <span className={styles.metaValue}>
                      {pr.items?.length || 1} item(ns)
                    </span>
                  </div>
                  {Number(pr.estimatedBudget) > 0 && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Valor Estimado:</span>
                      <span className={styles.metaValueHighlight}>
                        {formatCurrency(Number(pr.estimatedBudget))}
                      </span>
                    </div>
                  )}
                  {pr.priority && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Prioridade:</span>
                      <span className={styles.metaValue}>{formatPriority(pr.priority)}</span>
                    </div>
                  )}
                </div>

                <div className={styles.timelineCompact}>
                  <div className={styles.timelineCompactStep}>
                    <div
                      className={`${styles.timelineDot} ${
                        timeline.created ? styles.timelineDotDone : ""
                      }`}
                    />
                    <span className={styles.timelineStepTextDone}>Criada</span>
                  </div>
                  <div
                    className={`${styles.timelineLine} ${
                      timeline.approval === "done" ? styles.timelineLineDone : ""
                    }`}
                  />
                  <div className={styles.timelineCompactStep}>
                    <div
                      className={`${styles.timelineDot} ${
                        timeline.approval === "done"
                          ? styles.timelineDotDone
                          : timeline.approval === "active"
                            ? styles.timelineDotActive
                            : ""
                      }`}
                    />
                    <span
                      className={
                        timeline.approval === "done"
                          ? styles.timelineStepTextDone
                          : timeline.approval === "active"
                            ? styles.timelineStepTextActive
                            : ""
                      }
                    >
                      Aprovação
                    </span>
                  </div>
                  <div
                    className={`${styles.timelineLine} ${
                      timeline.quote === "done" ? styles.timelineLineDone : ""
                    }`}
                  />
                  <div className={styles.timelineCompactStep}>
                    <div
                      className={`${styles.timelineDot} ${
                        timeline.quote === "done"
                          ? styles.timelineDotDone
                          : timeline.quote === "active"
                            ? styles.timelineDotActive
                            : ""
                      }`}
                    />
                    <span
                      className={
                        timeline.quote === "done"
                          ? styles.timelineStepTextDone
                          : timeline.quote === "active"
                            ? styles.timelineStepTextActive
                            : ""
                      }
                    >
                      Cotação
                    </span>
                  </div>
                  <div
                    className={`${styles.timelineLine} ${
                      timeline.finished === "done" ? styles.timelineLineDone : ""
                    }`}
                  />
                  <div className={styles.timelineCompactStep}>
                    <div
                      className={`${styles.timelineDot} ${
                        timeline.finished === "done" ? styles.timelineDotDone : ""
                      }`}
                    />
                    <span
                      className={
                        timeline.finished === "done" ? styles.timelineStepTextDone : ""
                      }
                    >
                      Atendida
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.viewDetailsLink}>
                    Ver detalhes e histórico completo <Icon name="arrow-right" size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeRequest && (
        <QuickDetailDrawer
          open={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          title={`Solicitação ${activeRequest.code || activeRequest.corporateCode || ""}`}
          subtitle={`Registrada em ${new Date(activeRequest.createdAt).toLocaleDateString("pt-BR")}`}
          badge={
            <Badge variant={getStatusBadgeVariant(activeRequest.status)}>
              {STATUS_MAP[activeRequest.status] || activeRequest.status}
            </Badge>
          }
          primaryActionLabel="Copiar Protocolo"
          onPrimaryAction={() => {
            const c = activeRequest.code || activeRequest.corporateCode || activeRequest.id;
            navigator.clipboard.writeText(c);
            toast({
              variant: "success",
              title: "Protocolo copiado",
              message: `${c} copiado com sucesso.`,
            });
          }}
          secondaryActionLabel="Fechar"
        >
          <div className={styles.drawerContent}>
            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>
                <Icon name="clock-fast-forward" size={16} /> Linha do Tempo & Andamento
              </h4>
              <div className={styles.verticalTimeline}>
                <div className={styles.verticalStep}>
                  <div className={`${styles.verticalStepIcon} ${styles.verticalStepIconDone}`}>
                    <Icon name="check" size={13} />
                  </div>
                  <div className={styles.verticalStepHeader}>
                    <span className={styles.verticalStepTitle}>Solicitação Registrada</span>
                    <span className={styles.verticalStepDate}>
                      {new Date(activeRequest.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className={styles.verticalStepDesc}>
                    Demanda cadastrada com sucesso e enviada para a esteira de suprimentos.
                  </p>
                </div>

                <div className={styles.verticalStep}>
                  <div
                    className={`${styles.verticalStepIcon} ${
                      ["approved", "aprovada", "inquote", "finished", "atendida"].includes(
                        activeRequest.status.toLowerCase(),
                      )
                        ? styles.verticalStepIconDone
                        : ["rejected", "rejeitada"].includes(activeRequest.status.toLowerCase())
                          ? styles.verticalStepIconRejected
                          : styles.verticalStepIconActive
                    }`}
                  >
                    <Icon
                      name={
                        ["approved", "aprovada", "inquote", "finished", "atendida"].includes(
                          activeRequest.status.toLowerCase(),
                        )
                          ? "check"
                          : ["rejected", "rejeitada"].includes(activeRequest.status.toLowerCase())
                            ? "x"
                            : "clock"
                      }
                      size={13}
                    />
                  </div>
                  <div className={styles.verticalStepHeader}>
                    <span className={styles.verticalStepTitle}>Validação & Aprovação</span>
                  </div>
                  <p className={styles.verticalStepDesc}>
                    {["approved", "aprovada", "inquote", "finished", "atendida"].includes(
                      activeRequest.status.toLowerCase(),
                    )
                      ? "Solicitação aprovada pela alçada competente para cotação de mercado."
                      : ["rejected", "rejeitada"].includes(activeRequest.status.toLowerCase())
                        ? "A solicitação foi recusada no processo de aprovação."
                        : "Aguardando validação dos gestores de compras e alçada de aprovação."}
                  </p>
                </div>

                <div className={styles.verticalStep}>
                  <div
                    className={`${styles.verticalStepIcon} ${
                      ["finished", "atendida"].includes(activeRequest.status.toLowerCase())
                        ? styles.verticalStepIconDone
                        : activeRequest.status.toLowerCase() === "inquote"
                          ? styles.verticalStepIconActive
                          : ""
                    }`}
                  >
                    <Icon
                      name={
                        ["finished", "atendida"].includes(activeRequest.status.toLowerCase())
                          ? "check"
                          : "file-06"
                      }
                      size={13}
                    />
                  </div>
                  <div className={styles.verticalStepHeader}>
                    <span className={styles.verticalStepTitle}>Cotação com Fornecedores</span>
                  </div>
                  <p className={styles.verticalStepDesc}>
                    {activeRequest.status.toLowerCase() === "inquote"
                      ? "A equipe de suprimentos está cotando com fornecedores para equalização de propostas."
                      : ["finished", "atendida"].includes(activeRequest.status.toLowerCase())
                        ? "Cotação finalizada e propostas aprovadas."
                        : "Inicia após aprovação da alçada."}
                  </p>
                </div>

                <div className={styles.verticalStep}>
                  <div
                    className={`${styles.verticalStepIcon} ${
                      ["finished", "atendida"].includes(activeRequest.status.toLowerCase())
                        ? styles.verticalStepIconDone
                        : ""
                    }`}
                  >
                    <Icon name="shopping-bag-01" size={13} />
                  </div>
                  <div className={styles.verticalStepHeader}>
                    <span className={styles.verticalStepTitle}>Atendimento & Pedido de Compra</span>
                  </div>
                  <p className={styles.verticalStepDesc}>
                    {["finished", "atendida"].includes(activeRequest.status.toLowerCase())
                      ? "Pedido formalizado e solicitação atendida."
                      : "Geração de pedido de compra após equalização da cotação."}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>
                <Icon name="info-circle" size={16} /> Informações Gerais
              </h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Unidade / Empresa</span>
                  <span className={styles.infoValue}>
                    {activeRequest.branchName || activeRequest.companyCode || "Matriz"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Área / Centro de Custo</span>
                  <span className={styles.infoValue}>
                    {activeRequest.department || activeRequest.costCenterName || "Geral"}
                  </span>
                </div>
                {activeRequest.justification && (
                  <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
                    <span className={styles.infoLabel}>Justificativa</span>
                    <span className={styles.infoValue}>{activeRequest.justification}</span>
                  </div>
                )}
                {activeRequest.deliveryLocation && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Local de Entrega</span>
                    <span className={styles.infoValue}>{activeRequest.deliveryLocation}</span>
                  </div>
                )}
                {activeRequest.priority && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Prioridade</span>
                    <span className={styles.infoValue}>
                      {formatPriority(activeRequest.priority)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>
                <Icon name="package" size={16} /> Itens da Demanda ({activeRequest.items?.length || 0})
              </h4>
              {isLoadingDetail ? (
                <div className={styles.skeletonLine} style={{ height: 40 }} />
              ) : activeRequest.items && activeRequest.items.length > 0 ? (
                <div className={styles.itemsTableWrap}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qtd.</th>
                        <th>Unidade</th>
                        <th>Valor Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRequest.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td>
                            <strong>{it.description}</strong>
                          </td>
                          <td>{it.quantity}</td>
                          <td>{it.unit || "UN"}</td>
                          <td>
                            {it.estimatedUnitPrice
                              ? formatCurrency(it.estimatedUnitPrice * it.quantity)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                  Nenhum item discriminado nesta solicitação.
                </p>
              )}
            </div>

            {activeRequest.approvalHistories && activeRequest.approvalHistories.length > 0 && (
              <div className={styles.drawerSection}>
                <h4 className={styles.drawerSectionTitle}>
                  <Icon name="shield-tick" size={16} /> Registro de Aprovações
                </h4>
                <div className={styles.verticalTimeline}>
                  {activeRequest.approvalHistories.map((hist, idx) => (
                    <div key={hist.id || idx} className={styles.verticalStep}>
                      <div
                        className={`${styles.verticalStepIcon} ${
                          hist.status === "Approved"
                            ? styles.verticalStepIconDone
                            : hist.status === "Rejected"
                              ? styles.verticalStepIconRejected
                              : ""
                        }`}
                      >
                        <Icon
                          name={
                            hist.status === "Approved"
                              ? "check"
                              : hist.status === "Rejected"
                                ? "x"
                                : "clock"
                          }
                          size={12}
                        />
                      </div>
                      <div className={styles.verticalStepHeader}>
                        <span className={styles.verticalStepTitle}>
                          {hist.action || `Ação: ${hist.status || "Análise"}`}
                        </span>
                        <span className={styles.verticalStepDate}>
                          {new Date(hist.actionDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {hist.comments && (
                        <p className={styles.verticalStepDesc}>&quot;{hist.comments}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </QuickDetailDrawer>
      )}
    </div>
  );
}
