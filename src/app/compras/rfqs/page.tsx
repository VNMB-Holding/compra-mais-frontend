"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select, Loading, ErrorState } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./rfqs.module.css";
import { rfqsApi, Rfq, RfqKpis } from "@/lib/api/rfqs";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/auth";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser } from "@/lib/utils/tenant";

interface RFQRow {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  dataAbertura: string;
  dataEncerramento: string;
  tipoSegmento: string;
  status: "Aberta" | "Encerrando hoje" | "Encerrada";
  empresa: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mapRfqStatus(rfq: Rfq): "Aberta" | "Encerrando hoje" | "Encerrada" {
  if (rfq.status === "Closed") return "Encerrada";
  if (rfq.closesAt) {
    const today = new Date().toISOString().split("T")[0];
    const closes = new Date(rfq.closesAt).toISOString().split("T")[0];
    if (today === closes) return "Encerrando hoje";
  }
  return "Aberta";
}

function mapToRow(rfq: Rfq, currentUser: User | null): RFQRow {
  let empresaFilial = "—";
  const tenantId = rfq.purchaseRequest?.tenantId || rfq.tenantId;
  if (tenantId) {
    empresaFilial = currentUser?.availableTenants?.find(t => t.id === tenantId)?.name || "—";
  }

  return {
    id: rfq.id,
    codigo: rfq.code,
    descricao: rfq.title || rfq.purchaseRequest?.description || "Sem descrição",
    categoria: (rfq.purchaseRequest as any)?.category?.name || rfq.purchaseRequest?.category || "Geral",
    dataAbertura: formatDate(rfq.createdAt),
    dataEncerramento: formatDate(rfq.closesAt),
    tipoSegmento: "Menor Preço",
    status: mapRfqStatus(rfq),
    empresa: empresaFilial,
  };
}

export default function RfqsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const primaryCompanies = getPrimaryCompanyOptions(user);
  const showPrimaryCompanyFilter = primaryCompanies.length > 1 || isVnmbUser(user);

  const [selectedPrimaryCompanyId, setSelectedPrimaryCompanyId] = useState<string>("TODAS");
  const branchCompanies = getBranchCompanyOptions(user, selectedPrimaryCompanyId);
  const showBranchFilter = branchCompanies.length > 0;
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TODAS");

  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [rfqs, setRfqs] = useState<RFQRow[]>([]);
  const [kpis, setKpis] = useState<RfqKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        let queryTenantId: string | undefined = undefined;
        if (selectedBranchId !== "TODAS") {
          queryTenantId = selectedBranchId;
        } else if (selectedPrimaryCompanyId !== "TODAS") {
          queryTenantId = selectedPrimaryCompanyId;
        }

        const [list, kpisData] = await Promise.all([
          rfqsApi.list(queryTenantId),
          rfqsApi.getKpis(queryTenantId),
        ]);
        setRfqs(list.map(rfq => mapToRow(rfq, user)));
        setKpis(kpisData);
      } catch (err) {
        logError("rfqs/list", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, selectedPrimaryCompanyId, selectedBranchId]);

  const categoriasOptions = [
    { label: "Todas as categorias", value: "Todas" },
    ...Array.from(new Set(rfqs.map((r) => r.categoria)))
      .filter(Boolean)
      .map((c) => ({ label: c, value: c })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Aberta", value: "Aberta" },
    { label: "Encerrando hoje", value: "Encerrando hoje" },
    { label: "Encerrada", value: "Encerrada" },
  ];

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = rfqs.filter((r) => {
    if (categoria !== "Todas" && r.categoria !== categoria) return false;
    if (status !== "Todos" && r.status !== status) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchCodigo = r.codigo.toLowerCase().includes(q);
      const matchDesc = r.descricao.toLowerCase().includes(q);
      const matchCategoria = r.categoria.toLowerCase().includes(q);
      if (!matchCodigo && !matchDesc && !matchCategoria) return false;
    }
    return true;
  });

  const columns: ColumnDef<RFQRow>[] = [
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
        <span className={`${styles.statusBadge} ${row.status === "Aberta" ? styles.badgeGreen : row.status === "Encerrando hoje" ? styles.badgeYellow : styles.badgeGray}`}>
          {row.status}
        </span>
      )
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
        <KpiCard title="RFQs Abertas" value={loading ? "—" : String(kpis?.open || 0)} icon="hourglass-01" description="Em andamento" />
        <KpiCard title="Propostas Recebidas" value={loading ? "—" : String(kpis?.proposalCount || 0)} icon="file-01" description="Aguardando análise" />
        <KpiCard title="Finalizadas" value={loading ? "—" : String(kpis?.total || 0)} icon="check-circle" description="Concluídas" />
        <KpiCard title="Em Negociação" value={loading ? "—" : String(kpis?.total || 0)} icon="users-01" />
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
            {showPrimaryCompanyFilter && (
              <Select
                options={[
                  { label: "Empresas: Todas", value: "TODAS" },
                  ...primaryCompanies.map((c) => ({ label: c.name, value: c.id })),
                ]}
                value={selectedPrimaryCompanyId}
                onChange={(val) => {
                  setSelectedPrimaryCompanyId(val);
                  setSelectedBranchId("TODAS");
                  setCurrentPage(1);
                }}
                icon="building-07"
                className={styles.customSelectFilter}
              />
            )}

            {showBranchFilter && (
              <Select
                options={[
                  { label: "Filiais: Todas", value: "TODAS" },
                  ...branchCompanies.map((c) => ({ label: c.name, value: c.id })),
                ]}
                value={selectedBranchId}
                onChange={(val) => {
                  setSelectedBranchId(val);
                  setCurrentPage(1);
                }}
                icon="building-07"
                className={styles.customSelectFilter}
              />
            )}
            <Select
              options={categoriasOptions}
              value={categoria}
              onChange={(val) => {
                setCategoria(val);
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
          <Loading variant="inline" message="Carregando RFQs..." size="medium" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="search-md" size={32} />
            </div>
            <h4>Nenhuma cotação encontrada</h4>
            <p>Não encontramos nenhum registro com os filtros e buscas atuais. Tente alterar os termos e tente novamente.</p>
            <Button variant="secondary" onClick={() => { setSearchQuery(""); setStatus("Todos"); setCategoria("Todas"); }}>Limpar Filtros</Button>
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
