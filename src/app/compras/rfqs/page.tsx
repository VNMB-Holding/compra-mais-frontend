"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Select } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./rfqs.module.css";
import { rfqsApi, Rfq, RfqKpis } from "@/lib/api/rfqs";

interface RFQRow {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  dataAbertura: string;
  dataEncerramento: string;
  tipoSegmento: string;
  status: "Aberta" | "Encerrando hoje" | "Encerrada";
}

function mapRfqStatus(rfq: Rfq): "Aberta" | "Encerrando hoje" | "Encerrada" {
  if (rfq.status === "Closed" || rfq.status === "Cancelled") return "Encerrada";
  
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

function mapToRow(rfq: Rfq): RFQRow {
  const categoryName = rfq.purchaseRequest?.category
    ? typeof rfq.purchaseRequest.category === "object"
      ? (rfq.purchaseRequest.category as any).name || "Sem Categoria"
      : rfq.purchaseRequest.category
    : "Sem Categoria";

  return {
    id: rfq.id,
    codigo: rfq.code,
    descricao: rfq.title || rfq.purchaseRequest?.description || "",
    categoria: categoryName,
    dataAbertura: new Date(rfq.createdAt).toLocaleDateString("pt-BR"),
    dataEncerramento: new Date(rfq.closesAt).toLocaleDateString("pt-BR"),
    tipoSegmento: "Menor Preço",
    status: mapRfqStatus(rfq),
  };
}

export default function RfqsPage() {
  const router = useRouter();

  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [rfqs, setRfqs] = useState<RFQRow[]>([]);
  const [kpis, setKpis] = useState<RfqKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [list, kpisData] = await Promise.all([
          rfqsApi.list(),
          rfqsApi.getKpis(),
        ]);
        setRfqs(list.map(mapToRow));
        setKpis(kpisData);
      } catch (err) {
        console.error("Erro ao carregar RFQs:", err);
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
    { header: "Categoria", accessorKey: "categoria" },
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

  return (
    <div className={styles.pageContainer}>

      <div className={styles.pageHeader}>
        <div>
          <h1>RFQs / Cotações</h1>
          <p>Gerencie os processos de cotação e negociação com fornecedores.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport}><Icon name="download-01" /> Exportar</button>
          <Button variant="primary" className={styles.btnAdd} onClick={() => router.push("/compras/rfqs/nova")}>
            <Icon name="plus" /> Nova RFQ
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="RFQs abertas" value={loading ? "..." : String(kpis?.open || 0)} icon="receipt-check" description="Aguardando propostas" />
        <KpiCard title="Encerrando hoje" value={loading ? "..." : String(kpis?.closingToday || 0)} icon="clock" description="Atenção necessária" />
        <KpiCard title="Propostas recebidas" value={loading ? "..." : String(kpis?.proposalCount || 0)} icon="mail-01" description="Nesta rodada" />
        <KpiCard title="Total de RFQs" value={loading ? "..." : String(kpis?.total || 0)} icon="clipboard-check" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input 
              type="text" 
              placeholder="Buscar RFQ por código, descrição..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={categoriasOptions}
              value={categoria}
              onChange={setCategoria}
              icon="filter-lines"
              className={styles.customSelectFilter}
            />
            <Select
              options={statusOptions}
              value={status}
              onChange={setStatus}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} onRowClick={(row) => router.push(`/compras/rfqs/${row.id}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando {filtered.length} de {rfqs.length} RFQs</span>
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
