"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./solicitacoes.module.css";

interface SolicitationRow {
  codigo: string;
  descricao: string;
  solicitante: string;
  data: string;
  status: string;
  prioridade: "Alta" | "Média" | "Baixa";
}

export default function SolicitacoesPage() {
  const router = useRouter();

  const listaSolicitacoes: SolicitationRow[] = [
    { codigo: "SOL-000456", descricao: "Óleo Diesel S10", solicitante: "Breno Marques", data: "22/05/2024", status: "Aguardando aprovação", prioridade: "Alta" },
    { codigo: "SOL-000455", descricao: "Filtro de Ar de Cabine", solicitante: "Carlos Silva", data: "21/05/2024", status: "Aprovada", prioridade: "Média" },
    { codigo: "SOL-000454", descricao: "Serviço de Limpeza", solicitante: "Ana Paula", data: "20/05/2024", status: "Em cotação", prioridade: "Baixa" }
  ];

  const columns: ColumnDef<SolicitationRow>[] = [
    { header: "Código", cell: (row) => <span className={styles.boldCode}>{row.codigo}</span> },
    { header: "Descrição", accessorKey: "descricao" },
    { header: "Solicitante", accessorKey: "solicitante" },
    { header: "Data", accessorKey: "data" },
    {
      header: "Prioridade",
      cell: (row) => (
        <span className={`${styles.statusBadge} ${row.prioridade === "Alta" ? styles.badgeRed : row.prioridade === "Média" ? styles.badgeYellow : styles.badgeGray}`}>
          {row.prioridade}
        </span>
      )
    },
    {
      header: "Status",
      cell: (row) => (
        <span className={`${styles.statusBadge} ${row.status === "Aprovada" ? styles.badgeGreen : row.status === "Aguardando aprovação" ? styles.badgeYellow : styles.badgeGray}`}>
          {row.status}
        </span>
      )
    },
    {
      header: "",
      width: "40px",
      cell: () => (
        <button className={styles.iconBtn}>
          <span className="material-symbols-outlined">chevron_right</span>
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
          <button className={styles.btnExport}><span className="material-symbols-outlined">download</span> Exportar</button>
          <Button variant="primary" className={styles.btnAdd} onClick={() => router.push("/compras/solicitacoes/nova")}>
            <span className="material-symbols-outlined">add</span> Nova Solicitação
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Total de solicitações" value="3" icon="description" description="Neste mês" />
        <KpiCard title="Aguardando aprovação" value="1" icon="hourglass_top" description="Pendente" />
        <KpiCard title="Aprovadas" value="1" icon="check_circle" description="Prontas para cotar" />
        <KpiCard title="Categorias" value="3" icon="category" description="Combustível, MRO, Serviços" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Buscar solicitação..." />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.selectWrapper}>
              <span className="material-symbols-outlined">filter_list</span>
              <select defaultValue="Todas"><option value="Todas">Todas as categorias</option></select>
            </div>
            <div className={styles.selectWrapper}>
              <select defaultValue="Todos"><option value="Todos">Prioridade: Todas</option></select>
            </div>
          </div>
        </div>

        <DataTable data={listaSolicitacoes} columns={columns} onRowClick={(row) => router.push(`/compras/solicitacoes/${row.codigo}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando {listaSolicitacoes.length} de {listaSolicitacoes.length} solicitações</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn}><span className="material-symbols-outlined">chevron_left</span></button>
            <button className={`${styles.pageBtn} ${styles.pageActive}`}>1</button>
            <button className={styles.pageBtn}><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>

      </Card>
    </div>
  );
}
