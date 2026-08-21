"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select, Loading, ErrorState, Badge, TableSkeleton } from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./rfqs.module.css";
import { rfqsApi, Rfq, RfqKpis } from "@/lib/api/rfqs";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/auth";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getCompanyFilterOptions, formatCorporateBranch, getTenantDisplayName } from "@/lib/utils/tenant";

import { RfqRow } from "@/types/domain";
import { useRfqs } from "@/hooks/useQueries";
import { mapRfqStatus } from "@/lib/constants/status";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function mapToRow(rfq: Rfq, currentUser?: any): RfqRow {
  const pr = rfq.purchaseRequest;
  const empresa = formatCorporateBranch(
    (pr as any)?.corporateColigada,
    (pr as any)?.corporateFilial || (pr as any)?.filialCode || (pr as any)?.companyCode,
    rfq.tenantId,
    currentUser
  );

  const status = mapRfqStatus(rfq);
  const dataAbertura = formatDate(rfq.createdAt);
  const dataEncerramento = formatDate(rfq.closesAt);
  const descricao = rfq.title || rfq.purchaseRequest?.description || "Processo de Cotação";
  const categoria = (rfq.purchaseRequest as any)?.costCenterName || (rfq.purchaseRequest as any)?.category || "Geral";

  return {
    id: rfq.id,
    code: rfq.code,
    codigo: rfq.code,
    description: descricao,
    descricao,
    categoryName: categoria,
    categoria,
    openedAt: dataAbertura,
    dataAbertura,
    closesAt: dataEncerramento,
    dataEncerramento,
    segmentType: "Menor Preço",
    tipoSegmento: "Menor Preço",
    status,
    companyName: empresa,
    empresa,
  };
}

export default function RfqsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [kpis, setKpis] = useState<RfqKpis | null>(null);

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams = React.useMemo(() => ({
    companyCode: queryCompanyCode,
    status: status !== "Todos" ? status : undefined,
    category: category !== "Todas" ? category : undefined,
    search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
  }), [queryCompanyCode, status, category, searchQuery]);

  const { data: rawRfqs = [], isLoading: loadingRfqs, error: queryError } = useRfqs(queryParams);

  const rfqs: RfqRow[] = React.useMemo(() => {
    return rawRfqs.map((rfq) => mapToRow(rfq, user));
  }, [rawRfqs, user]);

  const loading = loadingRfqs;
  const error = queryError ? getErrorMessage(queryError) : null;

  useEffect(() => {
    async function fetchKpis() {
      try {
        const kpisData = await rfqsApi.getKpis(queryCompanyCode);
        setKpis(kpisData);
      } catch (err) {
        logError("rfqs/kpis", err);
      }
    }
    fetchKpis();
  }, [queryCompanyCode]);

  const categoryOptions = [
    { label: "Todas as categorias", value: "Todas" },
    ...Array.from(new Set(rfqs.map((r) => r.categoria)))
      .filter(Boolean)
      .map((c) => ({ label: c, value: c })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Aberta", value: "Aberta" },
    { label: "Em análise", value: "Em análise" },
    { label: "Encerrando hoje", value: "Encerrando hoje" },
    { label: "Encerrada", value: "Encerrada" },
  ];

  const filtered = rfqs;

  const columns: ColumnDef<RfqRow>[] = [
    { header: "Código", cell: (row) => <span className={styles.boldCode}>{row.codigo}</span> },
    { header: "Descrição", accessorKey: "descricao" },
    { header: "Empresa / Unidade", accessorKey: "empresa" },
    {
      header: "Categoria",
      cell: (row) => (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155" }}>
          <Icon name={getCategoryIcon(row.categoria)} size={16} />
          <span>{row.categoria}</span>
        </div>
      )
    },
    { header: "Abertura", accessorKey: "dataAbertura" },
    { header: "Encerramento", accessorKey: "dataEncerramento" },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          variant={
            row.status === "Aberta"
              ? "success"
              : row.status === "Encerrando hoje"
              ? "warning"
              : row.status === "Em análise"
              ? "primary"
              : row.status === "Cancelada"
              ? "danger"
              : "gray"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "",
      width: "40px",
      cell: () => (
        <button className={styles.iconBtn}>
          <Icon name="share-03" />
        </button>
      )
    }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className={styles.pageContainer}>

      <div className={styles.pageHeader}>
        <div>
          <h1>Processos de Cotação (RFQs)</h1>
          <p>Gerencie cotações com fornecedores, equalização de propostas e rodadas de negociação.</p>
        </div>
        <Button variant="primary" className={styles.btnAdd} onClick={() => router.push("/compras/rfqs/nova")}>
          <Icon name="plus" /> Nova RFQ
        </Button>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="RFQs Abertas" value={String(kpis?.open || 0)} icon="hourglass-01" description="Em andamento" loading={loading} />
        <KpiCard title="Propostas Recebidas" value={String(kpis?.proposalCount || 0)} icon="file-01" description="Aguardando análise" loading={loading} />
        <KpiCard title="Finalizadas" value={String(kpis?.total || 0)} icon="check-circle" description="Concluídas" loading={loading} />
        <KpiCard title="Em Negociação" value={String(kpis?.total || 0)} icon="users-01" loading={loading} />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input 
              type="text" 
              placeholder="Buscar RFQ por código, título..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={companyOptions}
              value={selectedCompanyId}
              onChange={(val) => {
                setSelectedCompanyId(val);
                setCurrentPage(1);
              }}
              icon="building-07"
              className={styles.customSelectFilter}
            />
            <Select
              options={categoryOptions}
              value={category}
              onChange={(val) => {
                setCategory(val);
                setCurrentPage(1);
              }}
              icon="filter-lines"
              className={styles.customSelectFilter}
            />
            <Select
              options={statusOptions}
              value={status}
              onChange={(val) => {
                setStatus(val);
                setCurrentPage(1);
              }}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="search-md" size={32} />
            </div>
            <h4>Nenhuma cotação encontrada</h4>
            <p>Não encontramos nenhum registro com os filtros e buscas atuais. Tente alterar os termos e tente novamente.</p>
            <Button variant="secondary" onClick={() => { setSearchQuery(""); setStatus("Todos"); setCategory("Todas"); }}>Limpar Filtros</Button>
          </div>
        ) : (
          <>
            <DataTable data={paginatedRows} columns={columns} onRowClick={(row) => router.push(`/compras/rfqs/${row.id}`)} />

            <div className={styles.tableFooter}>
              <span>
                Mostrando {filtered.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} RFQs
              </span>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageBtn}
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  style={{ opacity: currentPage <= 1 ? 0.5 : 1, cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
                >
                  <Icon name="chevron-left" />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", padding: "0 8px" }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  style={{ opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
                >
                  <Icon name="chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}

      </Card>
    </div>
  );
}
