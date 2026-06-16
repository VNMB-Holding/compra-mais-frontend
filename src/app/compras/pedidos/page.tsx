"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./pedidos.module.css";

interface PedidoRow {
  numero: string;
  fornecedor: string;
  emissao: string;
  valorTotal: string;
  entrega: string;
  status: "Emitido" | "Faturado" | "Entregue";
}

export default function PedidosPage() {
  const router = useRouter();

  const listaPedidos: PedidoRow[] = [
    { numero: "PED-000234", fornecedor: "Fornecedor Alfa", emissao: "22/05/2024", valorTotal: "R$ 15.400,00", entrega: "30/05/2024", status: "Emitido" },
    { numero: "PED-000233", fornecedor: "Distribuidora Beta", emissao: "20/05/2024", valorTotal: "R$ 8.900,00", entrega: "25/05/2024", status: "Faturado" },
    { numero: "PED-000232", fornecedor: "Serviços Omega", emissao: "18/05/2024", valorTotal: "R$ 4.500,00", entrega: "18/05/2024", status: "Entregue" }
  ];

  const columns: ColumnDef<PedidoRow>[] = [
    { header: "Número", cell: (row) => <span className={styles.boldCode}>{row.numero}</span> },
    { header: "Fornecedor", accessorKey: "fornecedor" },
    { header: "Data de Emissão", accessorKey: "emissao" },
    { header: "Valor Total", cell: (row) => <strong>{row.valorTotal}</strong> },
    { header: "Entrega Prevista", accessorKey: "entrega" },
    {
      header: "Status",
      cell: (row) => (
        <span className={`${styles.statusBadge} ${row.status === "Entregue" ? styles.badgeGreen : row.status === "Faturado" ? styles.badgeBlue : styles.badgeYellow}`}>
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
          <h1>Pedidos de Compra</h1>
          <p>Acompanhe o faturamento, prazos de entrega e formalização dos contratos com fornecedores.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport}><span className="material-symbols-outlined">download</span> Exportar</button>
          <Button variant="primary" className={styles.btnAdd}>
            <span className="material-symbols-outlined">add</span> Novo Pedido
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Total de pedidos" value="3" icon="shopping_cart" description="Este mês" />
        <KpiCard title="Pendentes" value="1" icon="schedule" description="Aguardando entrega" />
        <KpiCard title="Entregues" value="1" icon="check_circle" description="Finalizados" />
        <KpiCard title="Valor total" value="R$ 28,8K" icon="payments" description="Em pedidos" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Buscar pedido..." />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.selectWrapper}>
              <span className="material-symbols-outlined">filter_list</span>
              <select defaultValue="Todas"><option value="Todas">Todos os fornecedores</option></select>
            </div>
            <div className={styles.selectWrapper}>
              <select defaultValue="Todos"><option value="Todos">Status: Todos</option></select>
            </div>
          </div>
        </div>

        <DataTable data={listaPedidos} columns={columns} onRowClick={(row) => router.push(`/compras/pedidos/${row.numero}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando {listaPedidos.length} de {listaPedidos.length} pedidos</span>
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
