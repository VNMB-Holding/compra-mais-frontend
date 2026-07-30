"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select, Loading } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./rfqs.module.css";
import { rfqsApi, Rfq, RfqKpis } from "@/lib/api/rfqs";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/auth";

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

function mapRfqStatus(rfq: Rfq): "Aberta" | "Encerrando hoje" | "Encerrada" {
  if (rfq.status === "Closed" || rfq.status === "Cancelled" || (rfq.status as string) === "Finished") return "Encerrada";
  
  const closes = new Date(rfq.closesAt);
  const now = new Date();
  
  // Se a data de encerramento já passou, está Encerrada
  if (closes < now && closes.toDateString() !== now.toDateString()) {
    return "Encerrada";
  }
  
  if (closes.toDateString() === now.toDateString()) {
    return "Encerrando hoje";
  }
  
  return "Aberta";
}

function mapToRow(rfq: Rfq, currentUser?: User | null): RFQRow {
  const categoryName = rfq.purchaseRequest?.category
    ? typeof rfq.purchaseRequest.category === "object"
      ? (rfq.purchaseRequest.category as any).name || "Sem Categoria"
      : rfq.purchaseRequest.category
    : "Sem Categoria";

  const isVnmbHolding = currentUser?.tenantName?.toLowerCase().includes("vnmb") || currentUser?.availableTenants?.some(t => t.name.toLowerCase().includes("vnmb"));
  
  let empresaFilial = "";
  if (isVnmbHolding) {
    empresaFilial = currentUser?.availableTenants?.find(t => t.id === (rfq.purchaseRequest as any)?.tenantId)?.name || "—";
  } else {
    empresaFilial = (rfq.purchaseRequest as any)?.department || (rfq.purchaseRequest as any)?.deliveryLocation || "Sede";
  }

  return {
    id: rfq.id,
    codigo: rfq.code,
    descricao: rfq.title || rfq.purchaseRequest?.description || "",
    categoria: categoryName,
    dataAbertura: new Date(rfq.createdAt).toLocaleDateString("pt-BR"),
    dataEncerramento: new Date(rfq.closesAt).toLocaleDateString("pt-BR"),
    tipoSegmento: "Menor Preço",
    status: mapRfqStatus(rfq),
    empresa: empresaFilial,
  };
}

export default function RfqsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [rfqs, setRfqs] = useState<RFQRow[]>([]);
  const [kpis, setKpis] = useState<RfqKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [list, kpisData] = await Promise.all([
          rfqsApi.list(),
          rfqsApi.getKpis(),
        ]);
        setRfqs(list.map(rfq => mapToRow(rfq, user)));
        setKpis(kpisData);
      } catch (err) {
        console.error("Erro ao carregar RFQs:", err);
        setError("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} style={{ background: "#fee2e2", color: "#ef4444" }}>
              <Icon name="alert-triangle" size={32} />
            </div>
            <h4>Erro ao carregar dados</h4>
            <p>{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
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
