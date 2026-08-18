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
import { PURCHASE_ORDER_STATUS_MAP as STATUS_MAP, getStatusBadgeVariant } from "@/lib/constants/status";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser, getTenantDisplayName } from "@/lib/utils/tenant";

interface PedidoRow {
  id: string;
  numero: string;
  fornecedor: string;
  empresa: string;
  emissao: string;
  valorTotal: string;
  entrega: string;
  status: "Emitido" | "Faturado" | "Entregue";
}

function mapToRow(po: PurchaseOrder, currentUser?: any): PedidoRow {
  return {
    id: po.id,
    numero: po.code,
    fornecedor: po.supplier?.corporateName || "—",
    empresa: getTenantDisplayName(po.tenantId, currentUser),
    emissao: new Date(po.createdAt).toLocaleDateString("pt-BR"),
    valorTotal: formatCurrency(po.totalValue),
    entrega: new Date(po.estimatedDeliveryDate).toLocaleDateString("pt-BR"),
    status: STATUS_MAP[po.status] || "Emitido",
  };
}

export default function PedidosPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [supplier, setSupplier] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const primaryCompanies = getPrimaryCompanyOptions(user);
  const showPrimaryCompanyFilter = primaryCompanies.length > 1 || isVnmbUser(user);
  const [selectedPrimaryCompanyId, setSelectedPrimaryCompanyId] = useState<string>("TODAS");
  const branchCompanies = getBranchCompanyOptions(user, selectedPrimaryCompanyId);
  const showBranchFilter = branchCompanies.length > 0;
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TODAS");

  const queryTenantId = React.useMemo(() => {
    if (selectedBranchId !== "TODAS") return selectedBranchId;
    if (selectedPrimaryCompanyId !== "TODAS") return selectedPrimaryCompanyId;
    return undefined;
  }, [selectedPrimaryCompanyId, selectedBranchId]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await purchaseOrdersApi.list(queryTenantId);
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
  }, [queryTenantId, user]);

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
    { label: "Emitido", value: "Emitido" },
    { label: "Faturado", value: "Faturado" },
    { label: "Entregue", value: "Entregue" },
  ];

  const filtered = pedidos.filter((p) => {
    if (supplier !== "Todas" && p.fornecedor !== supplier) return false;
    if (status !== "Todos" && p.status !== status) return false;
    return true;
  });

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
            <input type="text" placeholder="Buscar pedido..." />
          </div>
          <div className={styles.filtersGroup}>
            {showPrimaryCompanyFilter && (
              <Select
                options={[
                  { label: "Empresa: Todas", value: "TODAS" },
                  ...primaryCompanies.map((c) => ({ label: c.name, value: c.id })),
                ]}
                value={selectedPrimaryCompanyId}
                onChange={(val) => {
                  setSelectedPrimaryCompanyId(val);
                  setSelectedBranchId("TODAS");
                }}
                className={styles.customSelectFilter}
              />
            )}
            {showBranchFilter && (
              <Select
                options={[
                  { label: "Filial: Todas", value: "TODAS" },
                  ...branchCompanies.map((b) => ({ label: b.name, value: b.id })),
                ]}
                value={selectedBranchId}
                onChange={setSelectedBranchId}
                className={styles.customSelectFilter}
              />
            )}
            <Select
              options={supplierOptions}
              value={supplier}
              onChange={setSupplier}
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
