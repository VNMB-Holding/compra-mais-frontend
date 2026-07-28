"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./solicitacoes.module.css";
import { purchaseRequestsApi, PurchaseRequest, PurchaseRequestKpis } from "@/lib/api/purchase-requests";

interface SolicitationRow {
  id: string;
  codigo: string;
  descricao: string;
  solicitante: string;
  data: string;
  status: string;
  prioridade: string;
  categoria: string;
}

const STATUS_MAP: Record<string, string> = {
  Draft: "Rascunho",
  AwaitingApproval: "Aguardando aprovação",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
};

const PRIORITY_MAP: Record<string, string> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
  Urgent: "Urgente",
};

function mapToRow(pr: PurchaseRequest): SolicitationRow {
  return {
    id: pr.id,
    codigo: pr.code,
    descricao: pr.description,
    solicitante: pr.requesterId,
    data: new Date(pr.createdAt).toLocaleDateString("pt-BR"),
    status: STATUS_MAP[pr.status] || pr.status,
    prioridade: PRIORITY_MAP[pr.priority] || pr.priority,
    categoria: pr.category,
  };
}

export default function SolicitacoesPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [prioridade, setPrioridade] = useState("Todos");
  const [solicitacoes, setSolicitacoes] = useState<SolicitationRow[]>([]);
  const [kpis, setKpis] = useState<PurchaseRequestKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [list, kpisData] = await Promise.all([
          purchaseRequestsApi.list(),
          purchaseRequestsApi.getKpis(),
        ]);
        setSolicitacoes(list.map(mapToRow));
        setKpis(kpisData);
      } catch (err) {
        console.error("Erro ao carregar solicitações:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Rascunho", value: "Rascunho" },
    { label: "Aguardando aprovação", value: "Aguardando aprovação" },
    { label: "Aprovada", value: "Aprovada" },
    { label: "Rejeitada", value: "Rejeitada" },
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
    { header: "Data", accessorKey: "data" },
    {
      header: "Prioridade",
      cell: (row) => (
        <span className={`${styles.statusBadge} ${row.prioridade === "Alta" || row.prioridade === "Urgente" ? styles.badgeRed : row.prioridade === "Média" ? styles.badgeYellow : styles.badgeGray}`}>
          {row.prioridade}
        </span>
      )
    },
    {
      header: "Status",
      cell: (row) => (
        <span className={`${styles.statusBadge} ${row.status === "Aprovada" ? styles.badgeGreen : row.status === "Aguardando aprovação" ? styles.badgeYellow : row.status === "Rejeitada" ? styles.badgeRed : styles.badgeGray}`}>
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
        <KpiCard title="Total de solicitações" value={loading ? "..." : String(kpis?.total || 0)} icon="clipboard" description="Neste mês" />
        <KpiCard title="Aguardando aprovação" value={loading ? "..." : String(kpis?.awaitingApproval || 0)} icon="hourglass-01" description="Pendente" />
        <KpiCard title="Aprovadas" value={loading ? "..." : String(kpis?.approved || 0)} icon="check-circle" description="Prontas para cotar" />
        <KpiCard title="Categorias" value={loading ? "..." : String(kpis?.categoryCount || 0)} icon="folder" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input 
              type="text" 
              placeholder="Buscar solicitação por código, descrição..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              icon="filter-lines"
              className={styles.customSelectFilter}
            />
            <Select
              options={prioridadesOptions}
              value={prioridade}
              onChange={setPrioridade}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} onRowClick={(row) => router.push(`/compras/solicitacoes/${row.id}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando {filtered.length} de {solicitacoes.length} solicitações</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn}><Icon name="chevron-left" /></button>
            <button className={`${styles.pageBtn} ${styles.pageActive}`}>1</button>
            <button className={styles.pageBtn}><Icon name="chevron-right" /></button>
          </div>
        </div>

      </Card>
    </div>
  );
}
