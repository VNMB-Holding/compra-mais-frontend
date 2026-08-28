"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./insights.module.css";
import { 
  Card, 
  Button, 
  Badge, 
  Icon, 
  Select, 
  KpiCard, 
  BarChart, 
  Loading, 
  ErrorState,
  KpiCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  CardSkeleton
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format-display";
import { dashboardApi, SpendAnalyticsResponse, EconomyAnalyticsResponse } from "@/lib/api/dashboard";
import { getCompanyFilterOptions } from "@/lib/utils/tenant";
import { logError, getErrorMessage } from "@/lib/utils/error";
import { useRouter } from "next/navigation";

interface DerivedInsight {
  id: string;
  category: "Economia" | "Fornecedor" | "Eficiência";
  priority: "Alta" | "Média" | "Baixa";
  title: string;
  description: string;
  estimatedImpact: string;
  actionLabel: string;
  actionUrl: string;
}

export default function InsightsPage() {
  const router = useRouter();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spendData, setSpendData] = useState<SpendAnalyticsResponse | null>(null);
  const [economyData, setEconomyData] = useState<EconomyAnalyticsResponse | null>(null);

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [spend, economy] = await Promise.all([
        dashboardApi.getSpendAnalytics(queryCompanyCode, undefined, undefined, selectedPeriod),
        dashboardApi.getEconomyAnalytics(queryCompanyCode, undefined, undefined, selectedPeriod),
      ]);
      setSpendData(spend);
      setEconomyData(economy);
    } catch (err) {
      logError("analytics/insights/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [queryCompanyCode, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cálculos derivados reais a partir da API
  const totalSpend = useMemo(() => {
    if (!spendData?.categories) return 0;
    return spendData.categories.reduce((sum, c) => sum + (c.spendTotal || 0), 0);
  }, [spendData]);

  const totalSavings = useMemo(() => {
    if (!economyData?.suppliers) return 0;
    return economyData.suppliers.reduce((sum, s) => sum + (s.valor || 0), 0);
  }, [economyData]);

  // Insights gerados dinamicamente com base nas análises reais de compras
  const dynamicInsights = useMemo<DerivedInsight[]>(() => {
    const list: DerivedInsight[] = [];
    let count = 1;

    // 1. Oportunidade de consolidação na maior categoria de gasto
    if (spendData?.categories && spendData.categories.length > 0) {
      const topCategory = spendData.categories[0];
      const estimatedSaving = Math.round(topCategory.spendTotal * 0.08);
      list.push({
        id: `INS-${String(count++).padStart(3, "0")}`,
        category: "Economia",
        priority: "Alta",
        title: `Consolidação de Volume: ${topCategory.categoria}`,
        description: `A categoria ${topCategory.categoria} representa ${topCategory.pctTotal.toFixed(1)}% do spend total com ${topCategory.pedidos} pedido(s). Consolidar as demandas em RFQs programadas pode gerar economia de escala.`,
        estimatedImpact: `Potencial de ${formatCurrency(estimatedSaving)} em savings`,
        actionLabel: "Abrir Cotação (RFQ)",
        actionUrl: "/compras/rfqs/nova",
      });
    }

    // 2. Alerta de concentração de fornecedor
    if (spendData?.suppliers && spendData.suppliers.length > 0) {
      const topSupplier = spendData.suppliers[0];
      if (topSupplier.pct > 30) {
        list.push({
          id: `INS-${String(count++).padStart(3, "0")}`,
          category: "Fornecedor",
          priority: topSupplier.pct > 50 ? "Alta" : "Média",
          title: `Concentração em ${topSupplier.nome}`,
          description: `O fornecedor concentra ${topSupplier.pct.toFixed(1)}% do volume total de compras (${formatCurrency(topSupplier.valor)}). Recomenda-se expandir o número de concorrentes nas próximas cotações.`,
          estimatedImpact: "Mitigação de risco de dependência",
          actionLabel: "Explorar Fornecedores",
          actionUrl: "/fornecedores/diretorio",
        });
      }
    }

    // 3. Eficiência em Savings já capturados
    if (economyData?.categories && economyData.categories.length > 0) {
      const bestSavingCat = economyData.categories[0];
      list.push({
        id: `INS-${String(count++).padStart(3, "0")}`,
        category: "Economia",
        priority: "Média",
        title: `Melhor Performance de Saving: ${bestSavingCat.categoria}`,
        description: `Esta categoria registrou ${formatCurrency(bestSavingCat.valor)} em economia efetiva sobre o valor orçado (${bestSavingCat.pct.toFixed(1)}% do total de savings gerados).`,
        estimatedImpact: "Modelo de negociação de referência",
        actionLabel: "Ver Análise de Savings",
        actionUrl: "/analytics/economia",
      });
    }

    // 4. Eficiência de alçadas e requisições
    list.push({
      id: `INS-${String(count++).padStart(3, "0")}`,
      category: "Eficiência",
      priority: "Baixa",
      title: "Governança e Fluxo de Aprovações",
      description: "Mantenha a matriz de alçadas atualizada por departamento para garantir que pedidos de compra sejam liberados sem gargalos operacionais.",
      estimatedImpact: "Agilidade no tempo de atendimento",
      actionLabel: "Ver Alçadas",
      actionUrl: "/administracao",
    });

    return list;
  }, [spendData, economyData]);

  // Filtragem dos insights
  const filteredInsights = useMemo(() => {
    if (categoryFilter === "Todas") return dynamicInsights;
    return dynamicInsights.filter((i) => i.category === categoryFilter);
  }, [dynamicInsights, categoryFilter]);

  // Dados reais para o BarChart
  const barChartData = useMemo(() => {
    if (!spendData?.categories || spendData.categories.length === 0) {
      return [{ name: "Sem dados", value: 0 }];
    }
    return spendData.categories.slice(0, 5).map((c) => ({
      name: c.categoria.length > 18 ? `${c.categoria.slice(0, 18)}...` : c.categoria,
      value: Math.round(c.spendTotal),
    }));
  }, [spendData]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>
            Insights Estratégicos & Oportunidades <span className={styles.systemTag}>Inteligência</span>
          </h1>
          <p>Diagnóstico analítico derivado do spend real, histórico de concorrência e alçadas da empresa.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ minWidth: 200 }}>
            <Select
              options={companyOptions}
              value={selectedCompanyId}
              onChange={setSelectedCompanyId}
              icon="building-07"
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <Select
              options={[
                { value: "all", label: "Todo o histórico" },
                { value: "30d", label: "Últimos 30 dias" },
                { value: "90d", label: "Últimos 90 dias" },
                { value: "12m", label: "Últimos 12 meses" },
              ]}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <div className={styles.kpiGrid}>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <div className={styles.dashboardGrid} style={{ marginTop: 24 }}>
            <div className={styles.leftSection}>
              <ChartSkeleton type="bar" height={340} />
              <div style={{ marginTop: 20 }}>
                <TableSkeleton rows={4} columns={5} />
              </div>
            </div>
            <div className={styles.rightSection}>
              <CardSkeleton height={140} />
              <CardSkeleton height={140} />
              <CardSkeleton height={140} />
            </div>
          </div>
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <KpiCard
              title="Spend Total Analisado"
              value={formatCurrency(totalSpend)}
              icon="trend-up-01"
              linkLabel="Ver Spend"
              onClick={() => router.push("/analytics/spend")}
            />
            <KpiCard
              title="Economia (Savings) Mapeada"
              value={formatCurrency(totalSavings)}
              icon="coins-stacked-01"
              linkLabel="Ver Savings"
              onClick={() => router.push("/analytics/economia")}
            />
            <KpiCard
              title="Categorias Monitoradas"
              value={String(spendData?.categories?.length || 0)}
              icon="layers-three-01"
              linkLabel="Ver Categorias"
              onClick={() => router.push("/configuracoes/categorias")}
            />
            <KpiCard
              title="Fornecedores no Período"
              value={String(spendData?.suppliers?.length || 0)}
              icon="users-01"
              linkLabel="Ver Fornecedores"
              onClick={() => router.push("/fornecedores/diretorio")}
            />
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.leftSection}>
              <Card className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h3>Volume de Compras por Categoria (R$)</h3>
                  <span className={styles.subtitle}>Distribuição de valor financeiro alocado nos principais centros de custo e famílias</span>
                </div>
                <div className={styles.chartWrapper}>
                  <BarChart
                    data={barChartData}
                    defaultColor="#007d79"
                    valueFormatter={(v) => formatCurrency(v)}
                    height={260}
                  />
                </div>
              </Card>

              <Card className={styles.tableCard}>
                <div className={styles.cardHeader}>
                  <h3>Diagnóstico por Centro de Custo / Família</h3>
                  <span className={styles.subtitle}>Detalhamento do spend e representatividade percentual sobre o total</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>Categoria / Centro de Custo</th>
                        <th style={{ textAlign: "right" }}>Spend Total</th>
                        <th style={{ textAlign: "center" }}>% do Total</th>
                        <th style={{ textAlign: "center" }}>Qtd. Pedidos</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spendData?.categories && spendData.categories.length > 0 ? (
                        spendData.categories.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.categoria}</strong></td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.spendTotal)}</td>
                            <td style={{ textAlign: "center" }}>{item.pctTotal.toFixed(1)}%</td>
                            <td style={{ textAlign: "center" }}>{item.pedidos}</td>
                            <td style={{ textAlign: "center" }} className={item.pctTotal > 40 ? styles.healthBad : styles.healthGood}>
                              {item.pctTotal > 40 ? "Alta Concentração" : "Equilibrado"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
                            Nenhum registro de compra encontrado no período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className={styles.rightSection}>
              <Card className={styles.insightsCard}>
                <div className={styles.insightsHeader}>
                  <h3>Oportunidades & Ações Sugeridas</h3>
                  <div className={styles.filterGroup}>
                    {["Todas", "Economia", "Fornecedor", "Eficiência"].map((f) => (
                      <button
                        key={f}
                        className={`${styles.filterBtn} ${categoryFilter === f ? styles.activeFilter : ""}`}
                        onClick={() => setCategoryFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.insightsList}>
                  {filteredInsights.length > 0 ? (
                    filteredInsights.map((item) => (
                      <div key={item.id} className={styles.insightItem}>
                        <div className={styles.insightTop}>
                          <span className={styles.insightId}>{item.id}</span>
                          <Badge variant={item.priority === "Alta" ? "danger" : item.priority === "Média" ? "warning" : "gray"}>
                            Prioridade {item.priority}
                          </Badge>
                        </div>
                        <h4>{item.title}</h4>
                        <p className={styles.insightDesc}>{item.description}</p>
                        <div className={styles.insightImpact}>
                          <Icon name="check-circle" size={14} />
                          <span>{item.estimatedImpact}</span>
                        </div>
                        <div className={styles.insightFooter}>
                          <span className={styles.insightCat}>{item.category}</span>
                          <Button variant="secondary" onClick={() => router.push(item.actionUrl)}>
                            {item.actionLabel} <Icon name="arrow-right" size={12} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", color: "#64748b", padding: "40px 20px" }}>
                      <Icon name="check-circle" size={32} style={{ color: "#007d79", marginBottom: 8 }} />
                      <p>Nenhuma recomendação pendente para este filtro.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
