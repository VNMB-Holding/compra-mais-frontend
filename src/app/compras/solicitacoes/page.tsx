"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select, Loading, ErrorState } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./solicitacoes.module.css";
import { purchaseRequestsApi, PurchaseRequest, PurchaseRequestKpis } from "@/lib/api/purchase-requests";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/auth";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser } from "@/lib/utils/tenant";

interface SolicitationRow {
  id: string;
  codigo: string;
  descricao: string;
  solicitante: string;
  data: string;
  status: string;
  prioridade: string;
  categoria: string;
  empresa: string;
}

const STATUS_MAP: Record<string, string> = {
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

const PRIORITY_MAP: Record<string, string> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
  Urgent: "Urgente",
  Critical: "Crítica",
};

import { formatUserDisplayName } from "@/lib/utils/format-display";

function mapToRow(pr: PurchaseRequest, currentUser?: User | null): SolicitationRow {
  const itemCategories = pr.items?.map((i: any) => i.category).filter(Boolean) || [];
  const uniqueCategories = Array.from(new Set(itemCategories));

  let finalCategory = "Geral";
  if (uniqueCategories.length > 1) {
    finalCategory = "Mista";
  } else if (uniqueCategories.length === 1) {
    finalCategory = uniqueCategories[0];
  } else if (pr.category) {
    finalCategory = typeof pr.category === "object" ? (pr.category as any).name || "Geral" : pr.category;
  }

  // Busca estrita do nome do Tenant/Empresa pelo ID cadastrado no banco para este registro
  const foundTenant = currentUser?.availableTenants?.find((t) => t.id === pr.tenantId);
  const empresaFilial = foundTenant?.name || (pr as any).tenantName || (pr as any).tenant?.name || "—";

  return {
    id: pr.id,
    codigo: pr.code,
    descricao: pr.description,
    solicitante: pr.requesterName || formatUserDisplayName(pr.requesterId, currentUser),
    data: new Date(pr.createdAt).toLocaleDateString("pt-BR"),
    status: STATUS_MAP[pr.status] || pr.status,
    prioridade: PRIORITY_MAP[pr.priority] || pr.priority,
    categoria: finalCategory,
    empresa: empresaFilial,
  };
}

export default function SolicitacoesPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [prioridade, setPrioridade] = useState("Todos");
  const [solicitacoes, setSolicitacoes] = useState<SolicitationRow[]>([]);
  const [kpis, setKpis] = useState<PurchaseRequestKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const primaryCompanies = getPrimaryCompanyOptions(user);
  const showPrimaryCompanyFilter = primaryCompanies.length > 1 || isVnmbUser(user);

  const [selectedPrimaryCompanyId, setSelectedPrimaryCompanyId] = useState<string>("TODAS");
  const branchCompanies = getBranchCompanyOptions(user, selectedPrimaryCompanyId);
  const showBranchFilter = branchCompanies.length > 0;
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TODAS");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Determina qual tenantId enviar para a API: se houver filial selecionada usa ela, senão usa a empresa principal selecionada
        let queryTenantId: string | undefined = undefined;
        if (selectedBranchId !== "TODAS") {
          queryTenantId = selectedBranchId;
        } else if (selectedPrimaryCompanyId !== "TODAS") {
          queryTenantId = selectedPrimaryCompanyId;
        }

        const [list, kpisData] = await Promise.all([
          purchaseRequestsApi.list(queryTenantId),
          purchaseRequestsApi.getKpis(queryTenantId),
        ]);
        setSolicitacoes(list.map((pr) => mapToRow(pr, user)));
        setKpis(kpisData);
      } catch (err) {
        logError("solicitacoes/list", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, selectedPrimaryCompanyId, selectedBranchId]);

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Rascunho", value: "Rascunho" },
    { label: "Aguardando aprovação", value: "Aguardando aprovação" },
    { label: "Aprovada", value: "Aprovada" },
    { label: "Em Cotação", value: "Em Cotação" },
    { label: "Atendida", value: "Atendida" },
    { label: "Rejeitada", value: "Rejeitada" },
    { label: "Cancelada", value: "Cancelada" },
  ];

  const prioridadesOptions = [
    { label: "Prioridade: Todas", value: "Todos" },
    { label: "Baixa", value: "Baixa" },
    { label: "Média", value: "Média" },
    { label: "Alta", value: "Alta" },
    { label: "Urgente", value: "Urgente" },
  ];

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = solicitacoes.filter((s) => {
    if (statusFilter !== "Todos" && s.status !== statusFilter) return false;
    if (prioridade !== "Todos" && s.prioridade !== prioridade) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchCodigo = s.codigo.toLowerCase().includes(q);
      const matchDesc = s.descricao.toLowerCase().includes(q);
      const matchSolicitante = s.solicitante.toLowerCase().includes(q);
      const matchCategoria = (s.categoria || "").toLowerCase().includes(q);
      if (!matchCodigo && !matchDesc && !matchSolicitante && !matchCategoria) return false;
    }
    return true;
  });

  const columns: ColumnDef<SolicitationRow>[] = [
    { header: "Código", cell: (row) => <span className={styles.boldCode}>{row.codigo}</span> },
    { header: "Descrição", accessorKey: "descricao" },
    { header: "Empresa / Unidade", accessorKey: "empresa" },
    {
      header: "Categoria",
      cell: (row) => (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155" }}>
          <Icon name={getCategoryIcon(row.categoria)} size={16} />
          <span>{row.categoria || "Geral"}</span>
        </div>
      )
    },
    { header: "Data", accessorKey: "data" },
    {
      header: "Prioridade",
      cell: (row) => {
        const pClass =
          row.prioridade === "Urgente" || row.prioridade === "Crítica"
            ? styles.prioUrgent
            : row.prioridade === "Alta"
            ? styles.prioHigh
            : row.prioridade === "Média"
            ? styles.prioMedium
            : styles.prioLow;
        return (
          <span className={`${styles.statusBadge} ${pClass}`}>
            {row.prioridade}
          </span>
        );
      }
    },
    {
      header: "Status",
      cell: (row) => {
        const sClass =
          row.status === "Aprovada" || row.status === "Atendida"
            ? styles.badgeGreen
            : row.status === "Aguardando aprovação" || row.status === "Em Análise"
            ? styles.badgeYellow
            : row.status === "Em Cotação"
            ? styles.badgeBlue
            : row.status === "Rejeitada" || row.status === "Cancelada"
            ? styles.badgeRed
            : styles.badgeGray;

        return (
          <span className={`${styles.statusBadge} ${sClass}`}>
            {row.status}
          </span>
        );
      }
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
          <h1>Solicitações de Compra</h1>
          <p>Gerencie as demandas internas de materiais e serviços antes de abrir cotações.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport}><Icon name="download-01" /> Exportar</button>
          <Button variant="primary" className={styles.btnAdd} onClick={() => router.push("/compras/solicitacoes/nova")}>
            <Icon name="plus" /> Nova Solicitação
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Total de solicitações" value={loading ? "—" : String(kpis?.total || 0)} icon="clipboard" description="Neste mês" />
        <KpiCard title="Aguardando aprovação" value={loading ? "—" : String(kpis?.awaitingApproval || 0)} icon="hourglass-01" description="Pendente" />
        <KpiCard title="Aprovadas" value={loading ? "—" : String(kpis?.approved || 0)} icon="check-circle" description="Prontas para cotar" />
        <KpiCard title="Categorias" value={loading ? "—" : String(kpis?.categoryCount || 0)} icon="folder" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input 
              type="text" 
              placeholder="Buscar solicitação por código, descrição..." 
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
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              icon="filter-lines"
              className={styles.customSelectFilter}
            />
            <Select
              options={prioridadesOptions}
              value={prioridade}
              onChange={(val) => {
                setPrioridade(val);
                setCurrentPage(1);
              }}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        {loading ? (
          <Loading variant="inline" message="Carregando solicitações..." size="medium" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="search-md" size={32} />
            </div>
            <h4>Nenhuma solicitação encontrada</h4>
            <p>Não encontramos nenhum registro com os filtros e buscas atuais. Tente alterar os termos e tente novamente.</p>
            <Button variant="secondary" onClick={() => { setSearchQuery(""); setStatusFilter("Todos"); setPrioridade("Todos"); }}>Limpar Filtros</Button>
          </div>
        ) : (
          <>
            <DataTable data={paginatedRows} columns={columns} onRowClick={(row) => router.push(`/compras/solicitacoes/${row.id}`)} />

            <div className={styles.tableFooter}>
              <span>
                Mostrando {filtered.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} solicitações
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
