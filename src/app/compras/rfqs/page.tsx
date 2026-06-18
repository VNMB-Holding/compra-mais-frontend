"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./rfqs.module.css";

interface RFQ {
  codigo: string;
  descricao: string;
  categoria: string;
  dataAbertura: string;
  dataEncerramento: string;
  tipoSegmento: string;
  status: "Aberta" | "Encerrando hoje" | "Encerrada";
}

export default function RfqsPage() {
  const router = useRouter();

  const listaRfqs: RFQ[] = [
    { codigo: "RFQ-2026-001", descricao: "Aquisição de Motores Elétricos JBS Lins", categoria: "MRO", dataAbertura: "10/06/2026", dataEncerramento: "15/06/2026 18:00", tipoSegmento: "Menor Preço", status: "Aberta" },
    { codigo: "RFQ-2026-002", descricao: "Prestação de Serviço de Manutenção Preventiva", categoria: "Serviços", dataAbertura: "11/06/2026", dataEncerramento: "12/06/2026 16:00", tipoSegmento: "Técnica e Preço", status: "Encerrando hoje" },
    { codigo: "RFQ-2026-003", descricao: "Fornecimento de Embalagens de Papelão", categoria: "Matérias-Primas", dataAbertura: "01/06/2026", dataEncerramento: "08/06/2026 14:00", tipoSegmento: "Menor Preço", status: "Encerrada" },
  ];

  const columns: ColumnDef<RFQ>[] = [
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
          <Icon name="chevron-right" />
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
        <KpiCard title="RFQs abertas" value="1" icon="receipt-check" description="Aguardando propostas" />
        <KpiCard title="Encerrando hoje" value="1" icon="clock" description="Atenção necessária" />
        <KpiCard title="Propostas recebidas" value="4" icon="mail-01" description="Nesta rodada" />
        <KpiCard title="Categorias em jogo" value="3" icon="clipboard-check" description="MRO, Serviços, Matérias-Primas" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input type="text" placeholder="Buscar RFQ..." />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.selectWrapper}>
              <Icon name="filter-lines" />
              <select defaultValue="Todas"><option value="Todas">Todas as categorias</option></select>
            </div>
            <div className={styles.selectWrapper}>
              <select defaultValue="Todos"><option value="Todos">Status: Todos</option></select>
            </div>
          </div>
        </div>

        <DataTable data={listaRfqs} columns={columns} onRowClick={(row) => router.push(`/compras/rfqs/${row.codigo}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando {listaRfqs.length} de {listaRfqs.length} RFQs</span>
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
