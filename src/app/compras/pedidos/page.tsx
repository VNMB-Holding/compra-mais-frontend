"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Icon, Select, Loading, ErrorState, TableSkeleton, Badge } from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./pedidos.module.css";
import { purchaseOrdersApi, PurchaseOrder } from "@/lib/api/purchase-orders";
import { formatCurrency } from "@/lib/utils/format-display";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getCompanyFilterOptions, formatCorporateBranch } from "@/lib/utils/tenant";
import { PURCHASE_ORDER_STATUS_MAP as STATUS_MAP, getStatusBadgeVariant } from "@/lib/constants/status";
import { useAuth } from "@/hooks/useAuth";

interface PedidoRow {
  id: string;
  numero: string;
  fornecedor: string;
  empresa: string;
  emissao: string;
  valorTotal: string;
  entrega: string;
  status: string;
}

function mapToRow(po: PurchaseOrder, currentUser?: any): PedidoRow {
  const empresaFilial = formatCorporateBranch(po.corporateColigada, po.corporateFilial || po.filialCode || po.companyCode, po.tenantId, currentUser);

  const numero = po.code ? `${po.code}` : po.id.slice(0, 8);
  const fornecedor = po.supplier?.tradeName || po.supplier?.corporateName || "—";
  const emissao = new Date(po.createdAt).toLocaleDateString("pt-BR");
  const valorTotal = formatCurrency(Number(po.totalValue));
  const entrega = po.estimatedDeliveryDate
    ? new Date(po.estimatedDeliveryDate).toLocaleDateString("pt-BR")
    : "—";
  const status = STATUS_MAP[po.status] || po.status;

  return {
    id: po.id,
    numero,
    fornecedor,
    empresa: empresaFilial,
    emissao,
    valorTotal,
    entrega,
    status,
  };
}

export default function PedidosPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [supplier, setSupplier] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await purchaseOrdersApi.list({
        companyCode: queryCompanyCode,
        status: status !== "Todos" ? status : undefined,
        supplier: supplier !== "Todas" ? supplier : undefined,
        search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
      });
      const rows = data.map((po) => mapToRow(po, user));
      setPedidos(rows);
      setTotalValue(data.reduce((sum, po) => sum + Number(po.totalValue), 0));
    } catch (err) {
      logError("pedidos/fetchData", err);
      setError(getErrorMessage(err));
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [queryCompanyCode, status, supplier, searchQuery, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const supplierOptions = [
    { label: "Todos os fornecedores", value: "Todas" },
    ...Array.from(new Set(pedidos.map((p) => p.fornecedor)))
      .filter((f) => f !== "—")
      .map((f) => ({ label: f, value: f })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Aguardando assinatura", value: "Aguardando assinatura" },
    { label: "Assinado", value: "Assinado" },
    { label: "Enviado", value: "Enviado" },
    { label: "Entregue", value: "Entregue" },
    { label: "Cancelado", value: "Cancelado" },
  ];

  const filtered = pedidos;

  const entregueCount = pedidos.filter((p) => p.status === "Entregue").length;
  const pendentCount = pedidos.filter((p) => p.status !== "Entregue").length;

  const columns: ColumnDef<PedidoRow>[] = [
    { header: "Número", cell: (row) => <span className={styles.boldCode}>{row.numero}</span> },
    { header: "Fornecedor", accessorKey: "fornecedor" },
    { header: "Empresa / Unidade", accessorKey: "empresa" },
    { header: "Data de Emissão", accessorKey: "emissao" },
    { header: "Valor Total", cell: (row) => <strong>{row.valorTotal}</strong> },
    { header: "Entrega Prevista", accessorKey: "entrega" },
    {
      header: "Status",
      cell: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
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
        <KpiCard title="Total de pedidos" value={String(pedidos.length)} icon="shopping-cart-01" description="Este mês" loading={loading} />
        <KpiCard title="Pendentes" value={String(pendentCount)} icon="clock" description="Aguardando entrega" loading={loading} />
        <KpiCard title="Entregues" value={String(entregueCount)} icon="check-circle" description="Finalizados" loading={loading} />
        <KpiCard title="Valor total" value={formatCurrency(totalValue)} icon="currency-dollar-circle" description="Em pedidos" loading={loading} />
      </div>

      <Card noPadding className={styles.mainListCard}>

        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input
              type="text"
              placeholder="Buscar por número, fornecedor ou unidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={companyOptions}
              value={selectedCompanyId}
              onChange={setSelectedCompanyId}
              icon="building-07"
              className={styles.customSelectFilter}
            />
            {supplierOptions.length > 2 && (
              <Select
                options={supplierOptions}
                value={supplier}
                onChange={setSupplier}
                icon="filter-lines"
                className={styles.customSelectFilter}
              />
            )}
            <Select
              options={statusOptions}
              value={status}
              onChange={setStatus}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={6} />
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
