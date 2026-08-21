"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { 
  Button, 
  Card, 
  Badge, 
  Tabs, 
  KpiCard, 
  LineChart, 
  PieChart,
  UrgentQuoteCard,
  Icon,
  Select,
  Loading,
  ErrorState,
  TableSkeleton
} from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { dashboardApi, DashboardKpis, CategoryBreakdown, MonthlyEconomy } from "@/lib/api/dashboard";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getCompanyFilterOptions, getTenantDisplayName } from "@/lib/utils/tenant";

import { RFQRow } from "@/types/domain";
import { mapRfqStatus, getStatusBadgeVariant } from "@/lib/constants/status";
import { formatCurrency } from "@/lib/utils/format-display";

const PIE_COLORS = ["#007d79", "#7c3aed", "#db2777", "#64748b", "#f59e0b", "#10b981"];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Todas");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [rfqs, setRfqs] = useState<RFQRow[]>([]);
  const [economyData, setEconomyData] = useState<MonthlyEconomy[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [kpisData, rfqsData, economyChart, categoriesData] = await Promise.all([
        dashboardApi.getKpis(queryCompanyCode).catch(() => null),
        rfqsApi.list(queryCompanyCode).catch(() => []),
        dashboardApi.getMonthlyEconomy(queryCompanyCode).catch(() => []),
        dashboardApi.getCategories(queryCompanyCode).catch(() => []),
      ]);

      setKpis(kpisData);
      setEconomyData(economyChart || []);
      setCategories(categoriesData || []);


      const mapped: RFQRow[] = rfqsData.map((rfq) => {
        const codigo = rfq.code || "";
        const descricao = rfq.title || rfq.purchaseRequest?.description || "";
        const categoria = (rfq.purchaseRequest as any)?.category?.name || "Sem Categoria";
        const dataAbertura = formatDate(rfq.createdAt);
        const dataEncerramento = formatDate(rfq.closesAt);
        const tipoSegmento = "Menor Preço";
        const status = mapRfqStatus(rfq);
        const empresa = getTenantDisplayName(rfq.tenantId || rfq.purchaseRequest?.tenantId, user);

        return {
          id: rfq.id,
          code: codigo,
          codigo,
          description: descricao,
          descricao,
          categoryName: categoria,
          categoria,
          openedAt: dataAbertura,
          dataAbertura,
          closesAt: dataEncerramento,
          dataEncerramento,
          segmentType: tipoSegmento,
          tipoSegmento,
          status,
          companyName: empresa,
          empresa,
        };
      });
      setRfqs(mapped);
    } catch (err) {
      logError("dashboard/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [queryCompanyCode, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const firstName = user?.name?.split(" ")[0] || "Usuário";

  const aggregatedCategoriesMap = new Map<string, number>();
  for (const c of categories) {
    aggregatedCategoriesMap.set(c.name, (aggregatedCategoriesMap.get(c.name) || 0) + (c.value || 0));
  }

  const aggregatedCategoriesList = Array.from(aggregatedCategoriesMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const topCategoriasData = aggregatedCategoriesList.length > 0
    ? aggregatedCategoriesList.map((c, i) => ({
        name: c.name,
        value: c.value,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
    : [{ name: "Sem dados", value: 100, color: "#e2e8f0" }];

  const rfqMaisUrgente = rfqs.find((r) => r.status === "Encerrando hoje") || rfqs[0];

  const tabsConfig = [
    { id: "Todas", label: "Todas", count: rfqs.length },
    { id: "Aberta", label: "Abertas", count: rfqs.filter((r) => r.status === "Aberta").length },
    { id: "Encerrando hoje", label: "Encerrando hoje", count: rfqs.filter((r) => r.status === "Encerrando hoje").length },
    { id: "Encerrada", label: "Encerradas", count: rfqs.filter((r) => r.status === "Encerrada").length },
  ];

  const columns: ColumnDef<RFQRow>[] = [
    { header: "Código", cell: (row) => <span className={styles.boldCode}>{row.codigo}</span> },
    { header: "Descrição", accessorKey: "descricao" },
    { header: "Categoria", accessorKey: "categoria" },
    { header: "Abertura", accessorKey: "dataAbertura" },
    { header: "Encerramento", accessorKey: "dataEncerramento" },
    { header: "Tipo", accessorKey: "tipoSegmento" },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {row.status}
        </Badge>
      )
    },
    {
      header: "",
      cell: () => <Icon name="dots-horizontal" className={styles.rowActions} />
    }
  ];

  const filteredRfqs = rfqs.filter((r) => activeTab === "Todas" || r.status === activeTab);

  const lastEconomy = economyData.length > 0 ? economyData[economyData.length - 1] : null;

  return (
    <div className={styles.viewDashboard}>
      
      <div className={styles.pageHeaderSimple}>
        <div>
          <h1>Bom dia, {firstName}. <span className={styles.wave}>👋</span></h1>
          <p>Aqui está o panorama das suas operações de suprimentos hoje.</p>
        </div>
        <div style={{ minWidth: 260 }}>
          <Select
            options={companyOptions}
            value={selectedCompanyId}
            onChange={setSelectedCompanyId}
            icon="building-07"
          />
        </div>
      </div>

      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h2>Conectamos negócios.<br />Potencializamos <strong>resultados.</strong></h2>
          <p>Uma plataforma inteligente para compras estratégicas<br />e conexões que geram valor para o seu negócio.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard 
          title="RFQs em andamento" 
          value={String(kpis?.rfqsInProgress || 0)} 
          icon="receipt-check" 
          linkLabel="Ver todas" 
          loading={loading}
          onClick={() => router.push("/compras/rfqs")}
        />
        <KpiCard 
          title="Aprovações pendentes" 
          value={String(kpis?.approvalsPending || 0)} 
          icon="shield-01" 
          linkLabel="Ver todas" 
          loading={loading}
          onClick={() => router.push("/compras/solicitacoes")}
        />
        <KpiCard 
          title="Economia acumulada" 
          value={formatCurrency(kpis?.economy || 0)} 
          icon="trend-up-01" 
          linkLabel="Ver detalhes" 
          loading={loading}
          onClick={() => router.push("/compras/rfqs")}
        />
        <KpiCard 
          title="Pedidos emitidos" 
          value={String(kpis?.ordersEmitted || 0)} 
          icon="box" 
          linkLabel="Ver todos" 
          loading={loading}
          onClick={() => router.push("/compras/pedidos")}
        />
        <KpiCard 
          title="Fornecedores ativos" 
          value={String(kpis?.suppliersActive || 0)} 
          icon="users-01" 
          linkLabel="Ver todos" 
          loading={loading}
          onClick={() => router.push("/fornecedores/diretorio")}
        />
      </div>

      <div className={styles.middleGrid}>
        
        {rfqMaisUrgente && (
          <UrgentQuoteCard 
            quote={{
              title: rfqMaisUrgente.descricao,
              code: rfqMaisUrgente.codigo,
              comprador: firstName,
              quantity: "",
              category: rfqMaisUrgente.categoria,
              type: rfqMaisUrgente.tipoSegmento,
              timeRemaining: rfqMaisUrgente.status === "Encerrando hoje" ? "Vence hoje!" : `Encerra em ${rfqMaisUrgente.dataEncerramento}`,
              imageUrl: "/images/bg-tubo-card.png",
            }} 
            onAction={() => router.push(`/compras/rfqs/${rfqMaisUrgente.id}`)} 
          />
        )}

        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h4>Economia potencial</h4>
            <span className={styles.subtitle}>Evolução mensal</span>
          </div>
          <div className={styles.chartValue}>
            <h3>{lastEconomy ? formatCurrency(lastEconomy.value) : "—"}</h3>
          </div>
          <div className={styles.chartWrapperElement}>
            <LineChart data={economyData.length > 0 ? economyData : [{ name: "-", value: 0 }]} strokeColor="#007d79" />
          </div>
          <button className={styles.cardLink} onClick={() => router.push("/compras/rfqs")}>
            Ver evolução completa <Icon name="arrow-right" size={16} />
          </button>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h4>Top categorias</h4>
            <span className={styles.subtitle}>Por volume de RFQs</span>
          </div>
          <div className={styles.donutChartContainer}>
            <div className={styles.donutGraphicBox}>
              <PieChart data={topCategoriasData} />
            </div>
            <div className={styles.donutLegend}>
              {topCategoriasData.map((item, index) => (
                <div key={index} className={styles.legItem}>
                  <span className={styles.dot} style={{ backgroundColor: item.color }}></span>
                  <span className={styles.legName}>{item.name}</span>
                  <span className={styles.pct}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <button className={styles.cardLink} onClick={() => router.push("/configuracoes/categorias")}>
            Ver todas as categorias <Icon name="arrow-right" size={16} />
          </button>
        </Card>
      </div>

      <Card noPadding className={styles.tableCard}>
        <div className={styles.tableHeaderActions}>
          <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />
          <Button variant="secondary" onClick={() => router.push("/compras/rfqs")}>Filtrar Avançado</Button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <DataTable data={filteredRfqs} columns={columns} onRowClick={(row) => router.push(`/compras/rfqs/${row.id}`)} />
        )}
      </Card>
    </div>
  );
}