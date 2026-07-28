"use client";

import React, { useState, useEffect } from "react";
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
  Icon
} from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { dashboardApi, DashboardKpis, CategoryBreakdown, MonthlyEconomy } from "@/lib/api/dashboard";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";

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

const PIE_COLORS = ["#007d79", "#7c3aed", "#db2777", "#64748b", "#f59e0b", "#10b981"];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function mapRfqStatus(rfq: Rfq): "Aberta" | "Encerrando hoje" | "Encerrada" {
  if (rfq.status === "Closed" || rfq.status === "Cancelled") return "Encerrada";
  if (rfq.status === "Open") {
    const closes = new Date(rfq.closesAt);
    const today = new Date();
    if (closes.toDateString() === today.toDateString()) return "Encerrando hoje";
    return "Aberta";
  }
  return "Aberta";
}

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
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [rfqs, setRfqs] = useState<RFQRow[]>([]);
  const [economyData, setEconomyData] = useState<MonthlyEconomy[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpisData, rfqsData, economyChart, categoriesData] = await Promise.all([
          dashboardApi.getKpis(),
          rfqsApi.list(),
          dashboardApi.getMonthlyEconomy(),
          dashboardApi.getCategories(),
        ]);

        setKpis(kpisData);
        setEconomyData(economyChart);
        setCategories(categoriesData);

        const mapped: RFQRow[] = rfqsData.map((rfq) => ({
          id: rfq.id,
          codigo: rfq.code,
          descricao: rfq.title || rfq.purchaseRequest?.description || "",
          categoria: (rfq.purchaseRequest as any)?.category?.name || "Sem Categoria",
          dataAbertura: formatDate(rfq.createdAt),
          dataEncerramento: formatDate(rfq.closesAt),
          tipoSegmento: "Menor Preço",
          status: mapRfqStatus(rfq),
        }));
        setRfqs(mapped);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Usuário";

  const topCategoriasData = categories.length > 0
    ? categories.map((c, i) => ({
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
        <Badge variant={row.status === "Aberta" ? "success" : row.status === "Encerrando hoje" ? "warning" : "gray"}>
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
        <h1>Bom dia, {firstName}. <span className={styles.wave}>👋</span></h1>
        <p>Aqui está o panorama das suas operações de suprimentos hoje.</p>
      </div>

      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h2>Conectamos negócios.<br />Potencializamos <strong>resultados.</strong></h2>
          <p>Uma plataforma inteligente para compras estratégicas<br />e conexões que geram valor para o seu negócio.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="RFQs em andamento" value={loading ? "..." : String(kpis?.rfqsInProgress || 0)} icon="receipt-check" linkLabel="Ver todas" />
        <KpiCard title="Aprovações pendentes" value={loading ? "..." : String(kpis?.approvalsPending || 0)} icon="shield-01" linkLabel="Ver todas" />
        <KpiCard 
          title="Economia acumulada" 
          value={loading ? "..." : formatCurrency(kpis?.economy || 0)} 
          icon="trend-up-01" 
          linkLabel="Ver detalhes" 
        />
        <KpiCard title="Pedidos emitidos" value={loading ? "..." : String(kpis?.ordersEmitted || 0)} icon="box" linkLabel="Ver todos" />
        <KpiCard title="Fornecedores ativos" value={loading ? "..." : String(kpis?.suppliersActive || 0)} icon="users-01" linkLabel="Ver todos" />
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
            onAction={() => router.push(`/compras/rfqs/${rfqMaisUrgente.codigo}`)} 
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
          <button className={styles.cardLink}>
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
          <button className={styles.cardLink}>
            Ver todas as categorias <Icon name="arrow-right" size={16} />
          </button>
        </Card>
      </div>

      <Card noPadding className={styles.tableCard}>
        <div className={styles.tableHeaderActions}>
          <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />
          <Button variant="secondary">Filtrar Avançado</Button>
        </div>

        <DataTable data={filteredRfqs} columns={columns} onRowClick={(row) => router.push(`/compras/rfqs/${row.codigo}`)} />
      </Card>
    </div>
  );
}