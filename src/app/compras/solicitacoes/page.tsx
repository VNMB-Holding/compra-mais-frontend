"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select, TableSkeleton, Badge, ErrorState } from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./solicitacoes.module.css";
import { purchaseRequestsApi, PurchaseRequest, PurchaseRequestKpis } from "@/lib/api/purchase-requests";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/auth";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser, getTenantDisplayName } from "@/lib/utils/tenant";

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
  const empresaFilial = pr.corporateColigada
    ? `Coligada ${pr.corporateColigada} / Filial ${pr.corporateFilial || "1"}`
    : getTenantDisplayName(pr.tenantId, currentUser);

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
  const [kpis, setKpis] = useState<PurchaseRequestKpis | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const primaryCompanies = getPrimaryCompanyOptions(user);
  const showPrimaryCompanyFilter = primaryCompanies.length > 1 || isVnmbUser(user);

  const [selectedPrimaryCompanyId, setSelectedPrimaryCompanyId] = useState<string>("TODAS");
  const branchCompanies = getBranchCompanyOptions(user, selectedPrimaryCompanyId);
  const showBranchFilter = branchCompanies.length > 0;
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TODAS");

  const queryTenantId = React.useMemo(() => {
    if (selectedBranchId !== "TODAS") return selectedBranchId;
    if (selectedPrimaryCompanyId !== "TODAS") return selectedPrimaryCompanyId;
    return undefined;
  }, [selectedPrimaryCompanyId, selectedBranchId]);

  const { data: rawRequests = [], isLoading: loadingRequests, error: queryError } = usePurchaseRequests(queryTenantId);

  const solicitacoes: SolicitationCorporateRow[] = React.useMemo(() => {
    return rawRequests.map((pr) => mapToCorporateRow(pr, user));
  }, [rawRequests, user]);

  const loading = loadingRequests;
  const error = queryError ? getErrorMessage(queryError) : null;

  useEffect(() => {
    async function fetchKpis() {
      try {
        const kpisData = await purchaseRequestsApi.getKpis(queryTenantId);
        setKpis(kpisData);
      } catch (err) {
        logError("solicitacoes/kpis", err);
      }
    }
    fetchKpis();
  }, [queryTenantId]);

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Aprovada / Pronta p/ Cotação", value: "Aprovada" },
    { label: "Em Cotação", value: "Em Cotação" },
    { label: "Finalizada", value: "Finalizada" },
    { label: "Cancelada", value: "Cancelada" },
  ];

  const filtered = solicitacoes.filter((s) => {
    if (statusFilter !== "Todos" && s.status !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchCodigo = s.codigo.toLowerCase().includes(q);
      const matchDesc = s.descricao.toLowerCase().includes(q);
      const matchCentro = s.centroCusto.toLowerCase().includes(q);
      const matchSolicitante = s.solicitante.toLowerCase().includes(q);
      if (!matchCodigo && !matchDesc && !matchCentro && !matchSolicitante) return false;
    }
    return true;
  });

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
          <small style={{ color: "#64748b" }}>{row.qtdItens} item(ns) solicitado(s)</small>
        </div>
      ),
    },
    {
      header: "Empresa / Filial",
      accessorKey: "empresa",
      cell: (row) => <span style={{ fontSize: 13, color: "#475569" }}>{row.empresa}</span>,
    },
    {
      header: "Centro de Custo / Obra",
      accessorKey: "centroCusto",
      cell: (row) => <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{row.centroCusto}</span>,
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
      width: "40px",
      cell: () => (
        <button className={styles.iconBtn}>
          <Icon name="dots-horizontal" size={16} />
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

      {showPrimaryCompanyFilter && (
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Empresa / Grupo:</span>
            <select
              value={selectedPrimaryCompanyId}
              onChange={(e) => {
                setSelectedPrimaryCompanyId(e.target.value);
                setSelectedBranchId("TODAS");
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                backgroundColor: "#fff",
                color: "#1e293b",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="TODAS">Todas as empresas</option>
              {primaryCompanies.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {showBranchFilter && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Filial:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  backgroundColor: "#fff",
                  color: "#1e293b",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="TODAS">Todas as filiais</option>
                {branchCompanies.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total de Solicitações"
          value={String(kpis?.total || rawRequests.length)}
          icon="file-02"
        />
        <KpiCard
          title="Prontas para Cotação"
          value={String(kpis?.approved || rawRequests.filter((r) => r.status === "Approved").length)}
          icon="check-circle"
        />
        <KpiCard
          title="Em Cotação (RFQ)"
          value={String(kpis?.inQuote || rawRequests.filter((r) => r.status === "InQuote").length)}
          icon="clock"
        />
        <KpiCard
          title="Finalizadas"
          value={String(kpis?.finished || rawRequests.filter((r) => r.status === "Finished").length)}
          icon="check-verified-01"
        />
      </div>

      {/* Tabela de Solicitações */}
      <Card noPadding className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" size={16} />
            <input
              type="text"
              placeholder="Buscar por Nº SC, Centro de Custo, Solicitante ou Descrição..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className={styles.filtersGroup}>
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
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedData}
              onRowClick={(row) => router.push(`/compras/solicitacoes/${row.id}`)}
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
    </div>
  );
}
