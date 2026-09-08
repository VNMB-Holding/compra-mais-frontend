"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./spend.module.css";
import {
  Card,
  AreaChart,
  PieChart,
  Select,
  Icon,
  Loading,
  ExportButton,
  ChartSkeleton,
  CalendarFilter,
  DateFilterValue,
} from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils/format-display";
import { useAuth } from "@/hooks/useAuth";
import { dashboardApi, SpendAnalyticsResponse } from "@/lib/api/dashboard";
import { getCompanyFilterOptions } from "@/lib/utils/tenant";
import { logError } from "@/lib/utils/error";

interface SpendItem {
  categoria: string;
  spendTotal: number;
  pctTotal: number;
  pedidos: number | string;
  economiaPotencial: number;
  color: string;
}

interface SupplierSpend {
  nome: string;
  valor: number;
  pct: number;
}

export default function SpendPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    mode: "range",
    preset: "all",
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [exportingType, setExportingType] = useState<"PDF" | "XLS" | null>(null);

  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<SpendAnalyticsResponse | null>(null);

  const [filterOptions, setFilterOptions] = useState<{ categories: string[]; suppliers: string[] }>({
    categories: [],
    suppliers: [],
  });

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  useEffect(() => {
    dashboardApi.getFilterOptions(queryCompanyCode).then(setFilterOptions).catch((err) => {
      logError("analytics/spend/filterOptions", err);
    });
  }, [queryCompanyCode]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getSpendAnalytics(
        queryCompanyCode,
        selectedCategory,
        selectedSupplier,
        dateFilter.preset,
        dateFilter.startDate,
        dateFilter.endDate
      );
      setApiData(data);
    } catch (err) {
      logError("analytics/spend/fetchData", err);
    } finally {
      setLoading(false);
    }
  }, [queryCompanyCode, selectedCategory, selectedSupplier, dateFilter]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type: "PDF" | "XLS") => {
    setExportingType(type);
    try {
      const format = type === "XLS" ? "excel" : "pdf";
      await dashboardApi.downloadReportFile("spend", format, queryCompanyCode, dateFilter.startDate, dateFilter.endDate, dateFilter.preset);
      toast({
        variant: "success",
        title: "Download Concluído",
        message: `O relatório analítico de Spend foi exportado em ${type === "XLS" ? "Excel (.xlsx)" : "PDF (.pdf)"} com sucesso.`
      });
    } catch (err) {
      logError("analytics/spend/export", err);
      try {
        const rows: string[][] = [
          ["Categoria", "Spend Total (R$)", "% Total", "Pedidos", "Economia Potencial (R$)"],
          ...categoriesData.map((c) => [
            c.categoria,
            c.spendTotal.toFixed(2),
            `${c.pctTotal}%`,
            String(c.pedidos),
            c.economiaPotencial.toFixed(2),
          ]),
          [],
          ["Fornecedor", "Valor Gasto (R$)", "% do Total"],
          ...suppliersData.map((s) => [
            s.nome,
            s.valor.toFixed(2),
            `${s.pct}%`,
          ]),
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((row) => row.map((cell) => `"${cell}"`).join(";")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_spend_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          variant: "success",
          title: "Download Concluído",
          message: "O relatório analítico de Spend foi exportado em formato CSV."
        });
      } catch {
        toast({
          variant: "error",
          title: "Erro na exportação",
          message: "Não foi possível gerar o arquivo de exportação."
        });
      }
    } finally {
      setExportingType(null);
    }
  };

  const monthlySpendData = useMemo(() => {
    return apiData?.monthlySpend || [];
  }, [apiData]);

  const categoriesData = useMemo<SpendItem[]>(() => {
    if (!apiData?.categories || apiData.categories.length === 0) return [];
    return apiData.categories.map((c, i) => ({
      categoria: c.categoria,
      spendTotal: c.spendTotal,
      pctTotal: Number(c.pctTotal.toFixed(1)),
      pedidos: c.pedidos,
      economiaPotencial: typeof c.economiaPotencial === "number" ? Math.round(c.economiaPotencial) : 0,
      color: c.color || ['#007d79', '#00a39e', '#004144', '#1192e8', '#0f62fe', '#7c3aed'][i % 6],
    }));
  }, [apiData]);

  const suppliersData = useMemo<SupplierSpend[]>(() => {
    return apiData?.suppliers || [];
  }, [apiData]);

  const totals = useMemo(() => {
    const spendSum = categoriesData.reduce((s, c) => s + c.spendTotal, 0);
    const econSum = categoriesData.reduce((s, c) => s + c.economiaPotencial, 0);
    const pedidosSum = categoriesData.reduce((s, c) => s + (typeof c.pedidos === "number" ? c.pedidos : 0), 0);

    return {
      spendTotal: spendSum,
      economiaPotencial: econSum,
      pedidos: pedidosSum
    };
  }, [categoriesData]);

  const kpis = useMemo(() => {
    const totalEcon = (apiData?.categories || []).reduce((acc, c) => acc + (c.economiaPotencial || 0), 0);
    return {
      spendTotal: apiData?.kpis?.spendTotal || "R$ 0,00",
      economiaPotencial: formatCurrency(totalEcon),
      pedidosEmitidos: apiData?.kpis?.pedidosEmitidos || "0",
      fornecedoresAtivos: apiData?.kpis?.fornecedoresAtivos || "0",
      trendSpend: "Filtro ativo no servidor",
      trendEconomia: "Economia estimada",
      trendPedidos: "Emitidos no período",
      trendFornecedores: "Ativos na base"
    };
  }, [apiData]);

  const categoryOptions = useMemo(() => [
    { value: "all", label: "Todas as Categorias" },
    ...filterOptions.categories.map((cat) => ({
      value: cat,
      label: cat,
    })),
  ], [filterOptions.categories]);

  const supplierOptions = useMemo(() => [
    { value: "all", label: "Todos os Fornecedores" },
    ...filterOptions.suppliers.map((sup) => ({
      value: sup,
      label: sup,
    })),
  ], [filterOptions.suppliers]);


  const handleClearFilters = () => {
    setDateFilter({ mode: "all", preset: "all" });
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedCompanyId("TODAS");
    toast({
      variant: "info",
      title: "Filtros Limpos",
      message: "Todas as seleções foram reiniciadas para os valores padrão."
    });
  };

  return (
    <div className={styles.container}>
      {exportingType && (
        <Loading variant="fullscreen" message={`Gerando relatório de Spend (${exportingType})...`} />
      )}

      
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleText}>
            <h1>Análise de Spend</h1>
            <p>Visão completa dos gastos para uma gestão estratégica e orientada a dados.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterInput}>
          <CalendarFilter
            value={dateFilter}
            onChange={setDateFilter}
          />
        </div>

        <div className={styles.filterInput}>
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        <div className={styles.filterInput}>
          <Select
            options={supplierOptions}
            value={selectedSupplier}
            onChange={setSelectedSupplier}
          />
        </div>

        <div className={styles.filterInput}>
          <Select
            options={companyOptions}
            value={selectedCompanyId}
            onChange={setSelectedCompanyId}
            icon="building-07"
          />
        </div>

        <button 
          className={styles.clearButton} 
          onClick={handleClearFilters}
        >
          <Icon name="refresh-ccw-01" size={16} /> Limpar filtros
        </button>
      </div>

      
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Spend total</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#e6f7ed", color: "#16a34a" }}>
              <span style={{ fontWeight: "bold" }}>$</span>
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.spendTotal}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGreen}>{kpis.trendSpend}</span>
              <span className={styles.trendGray}>vs. período anterior</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Economia potencial</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
              <Icon name="line-chart-up-01" size={16} />
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.economiaPotencial}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGray}>{kpis.trendEconomia}</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Pedidos emitidos</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
              <Icon name="clipboard-check" size={16} />
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.pedidosEmitidos}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGreen}>{kpis.trendPedidos}</span>
              <span className={styles.trendGray}>vs. período anterior</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Fornecedores ativos</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
              <Icon name="users-01" size={16} />
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.fornecedoresAtivos}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGreen}>{kpis.trendFornecedores}</span>
              <span className={styles.trendGray}>vs. período anterior</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className={styles.middleGrid}>
        {loading ? (
          <ChartSkeleton type="area" height={320} />
        ) : (
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                Evolução do spend
                <Icon name="help-circle" size={14} className={styles.infoIcon} />
              </div>
              <select className={styles.chartSelect} defaultValue="mensal">
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
              </select>
            </div>
            <div className={styles.chartWrapper}>
              <AreaChart
                data={monthlySpendData}
                color="#007d79"
                valueFormatter={(v) => `R$ ${v}k`}
                label1="Spend"
                height={220}
              />
            </div>
          </div>
        )}

        {loading ? (
          <ChartSkeleton type="donut" height={320} />
        ) : (
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                Spend por categoria
                <Icon name="help-circle" size={14} className={styles.infoIcon} />
              </div>
            </div>
            <div className={styles.donutRow}>
              <div className={styles.donutBox}>
                <PieChart
                  data={categoriesData.map(c => ({
                    name: c.categoria,
                    value: c.pctTotal,
                    color: c.color
                  }))}
                />
              </div>
              <div className={styles.legendList}>
                {categoriesData.map((item, index) => (
                  <div key={index} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                    <span className={styles.legendName}>{item.categoria}</span>
                    <span className={styles.legendValue}>{formatCurrency(item.spendTotal)}</span>
                    <span className={styles.legendPct}>{item.pctTotal.toFixed(1)}%</span>
                  </div>
                ))}
                <div className={styles.legendDivider} />
                <div className={styles.legendTotalRow}>
                  <span />
                  <span>Total</span>
                  <span className={styles.legendValue}>{formatCurrency(totals.spendTotal)}</span>
                  <span className={styles.legendPct}>100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      
      <div className={styles.bottomGrid}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Spend por fornecedor
              <Icon name="help-circle" size={14} className={styles.infoIcon} />
            </div>
          </div>
          <div className={styles.supplierList}>
            {suppliersData.map((supplier, idx) => (
              <div key={idx} className={styles.supplierRow}>
                <span className={styles.supplierName} title={supplier.nome}>{supplier.nome}</span>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${supplier.pct}%` }} />
                </div>
                <span className={styles.supplierValue}>{formatCurrency(supplier.valor)}</span>
                <span className={styles.supplierPct}>{supplier.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Detalhamento do spend
              <Icon name="help-circle" size={14} className={styles.infoIcon} />
            </div>
            <span className={styles.linkText}>Ver todos</span>
          </div>
          <div className={styles.customTableWrapper}>
            <table className={styles.spendDetailTable}>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th style={{ textAlign: "right" }}>Spend Total*</th>
                  <th style={{ textAlign: "right" }}>% do Total*</th>
                  <th style={{ textAlign: "right" }}>Pedidos*</th>
                  <th style={{ textAlign: "right" }}>Economia Potencial*</th>
                </tr>
              </thead>
              <tbody>
                {categoriesData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.categoria}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(item.spendTotal)}</td>
                    <td style={{ textAlign: "right" }}>{item.pctTotal.toFixed(1)}%</td>
                    <td style={{ textAlign: "right" }}>{item.pedidos}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(item.economiaPotencial)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(totals.spendTotal)}</td>
                  <td style={{ textAlign: "right" }}>100%</td>
                  <td style={{ textAlign: "right" }}>{totals.pedidos}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(totals.economiaPotencial)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      
      <div className={styles.footerRow}>
        <Icon name="refresh-ccw-01" size={14} />
        <span>Dados atualizados em 02/06/2025 às 08:30</span>
      </div>
    </div>
  );
}
