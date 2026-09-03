"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, 
  Card, 
  Icon, 
  Select, 
  TableSkeleton, 
  Badge, 
  ErrorState, 
  QuickDetailDrawer 
} from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./solicitacoes.module.css";
import { purchaseRequestsApi, PurchaseRequest, PurchaseRequestKpis } from "@/lib/api/purchase-requests";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/auth";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getCompanyFilterOptions, formatCorporateBranch } from "@/lib/utils/tenant";

import { PURCHASE_REQUEST_STATUS_MAP as STATUS_MAP, getStatusBadgeVariant } from "@/lib/constants/status";
import { formatUserDisplayName } from "@/lib/utils/format-display";
import { usePurchaseRequests } from "@/hooks/useQueries";

interface SolicitationCorporateRow {
  id: string;
  codigo: string;
  descricao: string;
  empresa: string;
  centroCusto: string;
  localEstoque: string;
  solicitante: string;
  qtdItens: number;
  data: string;
  status: string;
  statusRaw: string;
}

function mapToCorporateRow(pr: PurchaseRequest, currentUser?: User | null): SolicitationCorporateRow {
  const empresaFilial = formatCorporateBranch(pr.corporateColigada, pr.corporateFilial || pr.filialCode || pr.companyCode, pr.tenantId, currentUser);

  const codigo = pr.corporateCode ? `#${pr.corporateCode}` : pr.code || "";
  const descricao = pr.description || pr.notes || "Solicitação de Compra";
  const centroCusto = pr.costCenterCode
    ? `${pr.costCenterCode} — ${pr.costCenterName || ""}`
    : pr.costCenterName || "Geral";
  const localEstoque = pr.corporateStockLocation || "Almoxarifado Geral";
  const solicitante = pr.corporateRequester || pr.requesterName || formatUserDisplayName(pr.requesterId, currentUser);
  const data = new Date(pr.createdAt).toLocaleDateString("pt-BR");
  const status = STATUS_MAP[pr.status] || pr.status;

  return {
    id: pr.id,
    codigo,
    descricao,
    empresa: empresaFilial,
    centroCusto,
    localEstoque,
    solicitante,
    qtdItens: pr.items?.length || 1,
    data,
    status,
    statusRaw: pr.status,
  };
}

export default function SolicitacoesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [kpis, setKpis] = useState<PurchaseRequestKpis | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);

  // Paginação e densidade
  const [currentPage, setCurrentPage] = useState(1);
  const [density, setDensity] = useState<"normal" | "compact">("normal");
  const [selectedDrawerRequest, setSelectedDrawerRequest] = useState<PurchaseRequest | null>(null);
  const itemsPerPage = density === "compact" ? 15 : 10;

  const companyOptions = getCompanyFilterOptions();

  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  const queryParams = React.useMemo(() => ({
    companyCode: queryCompanyCode,
    status: statusFilter !== "Todos" ? statusFilter : undefined,
    search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
  }), [queryCompanyCode, statusFilter, searchQuery]);

  const { data: rawRequests = [], isLoading: loadingRequests, error: queryError } = usePurchaseRequests(queryParams);

  const solicitacoes: SolicitationCorporateRow[] = React.useMemo(() => {
    return rawRequests.map((pr) => mapToCorporateRow(pr, user));
  }, [rawRequests, user]);

  const loading = loadingRequests;
  const error = queryError ? getErrorMessage(queryError) : null;

  useEffect(() => {
    async function fetchKpis() {
      setLoadingKpis(true);
      try {
        const kpisData = await purchaseRequestsApi.getKpis(queryCompanyCode);
        setKpis(kpisData);
      } catch (err) {
        logError("solicitacoes/kpis", err);
      } finally {
        setLoadingKpis(false);
      }
    }
    fetchKpis();
  }, [queryCompanyCode]);


  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Aprovada / Pronta p/ Cotação", value: "Aprovada" },
    { label: "Em Cotação", value: "Em Cotação" },
    { label: "Finalizada", value: "Finalizada" },
    { label: "Cancelada", value: "Cancelada" },
  ];

  const filtered = solicitacoes;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns: ColumnDef<SolicitationCorporateRow>[] = [
    {
      header: "Nº SC Corporate",
      cell: (row) => <span className={styles.boldCode}>{row.codigo}</span>,
      width: "140px",
    },
    {
      header: "Descrição da Demanda",
      accessorKey: "descricao",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong style={{ fontSize: 13, color: "#0f172a" }}>{row.descricao}</strong>
        </div>
      ),
    },
    {
      header: "Empresa / Filial",
      accessorKey: "empresa",
      cell: (row) => <span style={{ fontSize: 13, color: "#475569" }}>{row.empresa}</span>,
    },
    {
      header: "Local de Estoque",
      accessorKey: "localEstoque",
      cell: (row) => <span style={{ fontSize: 13, color: "#475569" }}>{row.localEstoque}</span>,
    },
    {
      header: "Solicitante ERP",
      accessorKey: "solicitante",
      cell: (row) => <span style={{ fontSize: 13, color: "#334155" }}>{row.solicitante}</span>,
    },
    {
      header: "Data Emissão",
      accessorKey: "data",
      cell: (row) => <span style={{ fontSize: 13, color: "#64748b" }}>{row.data}</span>,
      width: "110px",
    },
    {
      header: "Status",
      cell: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>,
      width: "140px",
    },
    {
      header: "",
      width: "60px",
      cell: (row) => (
        <button
          className={styles.iconBtn}
          title="Ver detalhes rápidos"
          onClick={(e) => {
            e.stopPropagation();
            const matched = rawRequests.find((r) => r.id === row.id);
            if (matched) setSelectedDrawerRequest(matched);
          }}
        >
          <Icon name="eye" size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Solicitações de Compra</h1>
          <p>Demandas e requisições sincronizadas do ERP Corporate para cotação e compras.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => router.push("/compras/rfqs/nova")}>
            <Icon name="plus" size={16} /> Criar Cotação (RFQ)
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total de Solicitações"
          value={String(kpis?.total ?? rawRequests.length)}
          icon="file-02"
          loading={loadingKpis}
        />
        <KpiCard
          title="Prontas para Cotação"
          value={String(kpis?.approved ?? rawRequests.filter((r) => r.status === "Approved").length)}
          icon="check-circle"
          loading={loadingKpis}
        />
        <KpiCard
          title="Em Cotação (RFQ)"
          value={String(kpis?.inQuote ?? rawRequests.filter((r) => r.status === "InQuote").length)}
          icon="clock"
          loading={loadingKpis}
        />
        <KpiCard
          title="Finalizadas"
          value={String(kpis?.finished ?? rawRequests.filter((r) => r.status === "Finished").length)}
          icon="check-verified-01"
          loading={loadingKpis}
        />
      </div>

      <Card noPadding className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" size={16} />
            <input
              type="text"
              placeholder="Buscar por Nº SC, Solicitante ou Descrição..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.densityToggle} title="Densidade da tabela">
              <button
                type="button"
                className={`${styles.densityBtn} ${density === "normal" ? styles.activeDensity : ""}`}
                onClick={() => setDensity("normal")}
                title="Visualização padrão"
              >
                <Icon name="rows-01" size={14} /> Normal
              </button>
              <button
                type="button"
                className={`${styles.densityBtn} ${density === "compact" ? styles.activeDensity : ""}`}
                onClick={() => setDensity("compact")}
                title="Visualização compacta com mais linhas"
              >
                <Icon name="grid-01" size={14} /> Compacto
              </button>
            </div>

            <Select
              options={companyOptions}
              value={selectedCompanyId}
              onChange={(v) => {
                setSelectedCompanyId(v);
                setCurrentPage(1);
              }}
              icon="building-07"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <TableSkeleton rows={6} columns={8} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="file-search-02" size={32} />
            </div>
            <h4>Nenhuma solicitação encontrada</h4>
            <p>Não encontramos registros com os filtros aplicados. Tente alterar os critérios de busca.</p>
            <Button variant="secondary" onClick={() => { setSearchQuery(""); setStatusFilter("Todos"); setSelectedCompanyId("TODAS"); }}>Limpar Filtros</Button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedData}
              density={density}
              onRowClick={(row) => {
                const matched = rawRequests.find((r) => r.id === row.id);
                if (matched) setSelectedDrawerRequest(matched);
              }}
            />

            <div className={styles.tableFooter}>
              <span>
                Mostrando {paginatedData.length} de {filtered.length} solicitações
              </span>
              <div className={styles.paginationControls}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={styles.pageBtn}
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                <span style={{ fontSize: 13, color: "#475569", alignSelf: "center", margin: "0 8px" }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={styles.pageBtn}
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Drawer de Detalhes Rápidos */}
      {selectedDrawerRequest && (
        <QuickDetailDrawer
          open={!!selectedDrawerRequest}
          onClose={() => setSelectedDrawerRequest(null)}
          title={selectedDrawerRequest.code || `#${selectedDrawerRequest.corporateCode || selectedDrawerRequest.id}`}
          subtitle={selectedDrawerRequest.description || "Solicitação de Compra"}
          badge={
            <Badge variant={getStatusBadgeVariant(STATUS_MAP[selectedDrawerRequest.status] || selectedDrawerRequest.status)}>
              {STATUS_MAP[selectedDrawerRequest.status] || selectedDrawerRequest.status}
            </Badge>
          }
          primaryActionLabel="Abrir Detalhes Completos"
          onPrimaryAction={() => router.push(`/compras/solicitacoes/${selectedDrawerRequest.id}`)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Informações Gerais */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Unidade / Empresa</span>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>
                  {formatCorporateBranch(selectedDrawerRequest.corporateColigada, selectedDrawerRequest.corporateFilial || selectedDrawerRequest.filialCode, selectedDrawerRequest.tenantId, user)}
                </strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Solicitante</span>
                <span style={{ fontSize: 13, color: "#0f172a" }}>
                  {selectedDrawerRequest.corporateRequester || selectedDrawerRequest.requesterName || formatUserDisplayName(selectedDrawerRequest.requesterId, user)}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Centro de Custo</span>
                <span style={{ fontSize: 13, color: "#334155" }}>
                  {selectedDrawerRequest.costCenterCode ? `[${selectedDrawerRequest.costCenterCode}] ` : ""}{selectedDrawerRequest.costCenterName || "Geral"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Local de Estoque</span>
                <span style={{ fontSize: 13, color: "#334155" }}>
                  {selectedDrawerRequest.corporateStockLocation || "Almoxarifado Geral"}
                </span>
              </div>
              {selectedDrawerRequest.notes && (
                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Justificativa / Observação</span>
                  <span style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.4 }}>{selectedDrawerRequest.notes}</span>
                </div>
              )}
            </div>

            {/* Tabela Rápida de Itens */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="package" size={16} /> Itens da Solicitação ({selectedDrawerRequest.items?.length || 0})
              </h4>
              {selectedDrawerRequest.items && selectedDrawerRequest.items.length > 0 ? (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "8px 12px", width: "40px", textAlign: "center" }}>#</th>
                        <th style={{ padding: "8px 12px" }}>Item / Material</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", width: "80px" }}>Qtd</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", width: "60px" }}>Un</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDrawerRequest.items.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <strong style={{ color: "#0f172a", display: "block" }}>{item.description}</strong>
                            {item.corporateItemCode && <small style={{ color: "#64748b" }}>Cód: {item.corporateItemCode}</small>}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>{item.quantity}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#475569" }}>{item.unit || "UN"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  Nenhum item específico listado nesta solicitação.
                </div>
              )}
            </div>
          </div>
        </QuickDetailDrawer>
      )}
    </div>
  );
}
