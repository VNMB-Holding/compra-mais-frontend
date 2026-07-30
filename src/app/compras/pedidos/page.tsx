"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Icon, Select, Loading, ErrorState } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./pedidos.module.css";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage, logError } from "@/lib/utils/error";

interface PurchaseOrder {
  id: string;
  code: string;
  totalValue: number;
  estimatedDeliveryDate: string;
  status: string;
  createdAt: string;
  supplier?: { corporateName: string };
}

interface PedidoRow {
  id: string;
  numero: string;
  fornecedor: string;
  emissao: string;
  valorTotal: string;
  entrega: string;
  status: "Emitido" | "Faturado" | "Entregue";
}

const STATUS_MAP: Record<string, "Emitido" | "Faturado" | "Entregue"> = {
  AwaitingSignature: "Emitido",
  Signed: "Faturado",
  Delivered: "Entregue",
};

function formatCurrency(value: number): string {
  return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mapToRow(po: PurchaseOrder): PedidoRow {
  return {
    id: po.id,
    numero: po.code,
    fornecedor: po.supplier?.corporateName || "—",
    emissao: new Date(po.createdAt).toLocaleDateString("pt-BR"),
    valorTotal: formatCurrency(po.totalValue),
    entrega: new Date(po.estimatedDeliveryDate).toLocaleDateString("pt-BR"),
    status: STATUS_MAP[po.status] || "Emitido",
  };
}

export default function PedidosPage() {
  const router = useRouter();

  const [fornecedor, setFornecedor] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get<PurchaseOrder[]>("/api/purchase-orders");
      const rows = data.map(mapToRow);
      setPedidos(rows);
      setTotalValue(data.reduce((sum, po) => sum + Number(po.totalValue), 0));
    } catch (err) {
      logError("pedidos/fetchData", err);
      setError(getErrorMessage(err));
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fornecedoresOptions = [
    { label: "Todos os fornecedores", value: "Todas" },
    ...Array.from(new Set(pedidos.map((p) => p.fornecedor)))
      .filter((f) => f !== "—")
      .map((f) => ({ label: f, value: f })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Emitido", value: "Emitido" },
    { label: "Faturado", value: "Faturado" },
    { label: "Entregue", value: "Entregue" },
  ];

  const filtered = pedidos.filter((p) => {
    if (fornecedor !== "Todas" && p.fornecedor !== fornecedor) return false;
    if (status !== "Todos" && p.status !== status) return false;
    return true;
  });

  const entregueCount = pedidos.filter((p) => p.status === "Entregue").length;
  const pendentCount = pedidos.filter((p) => p.status !== "Entregue").length;

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
          <Icon name="share-03" />
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
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Total de pedidos" value={loading ? "—" : String(pedidos.length)} icon="shopping-cart-01" description="Este mês" />
        <KpiCard title="Pendentes" value={loading ? "—" : String(pendentCount)} icon="clock" description="Aguardando entrega" />
        <KpiCard title="Entregues" value={loading ? "—" : String(entregueCount)} icon="check-circle" description="Finalizados" />
        <KpiCard title="Valor total" value={loading ? "—" : formatCurrency(totalValue)} icon="currency-dollar-circle" description="Em pedidos" />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input type="text" placeholder="Buscar pedido..." />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={fornecedoresOptions}
              value={fornecedor}
              onChange={setFornecedor}
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

        {loading ? (
          <Loading variant="inline" message="Carregando pedidos..." size="medium" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            <DataTable data={filtered} columns={columns} onRowClick={(row) => router.push(`/compras/pedidos/${row.id}`)} />

            <div className={styles.tableFooter}>
              <span>Mostrando {filtered.length} de {pedidos.length} pedidos</span>
              <div className={styles.paginationControls}>
                <button className={styles.pageBtn}><Icon name="chevron-left" /></button>
                <button className={`${styles.pageBtn} ${styles.pageActive}`}>1</button>
                <button className={styles.pageBtn}><Icon name="chevron-right" /></button>
              </div>
            </div>
          </>
        )}

      </Card>
    </div>
  );
}
