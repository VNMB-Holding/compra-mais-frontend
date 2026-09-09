"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./economia.module.css";
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
import { dashboardApi, EconomyAnalyticsResponse } from "@/lib/api/dashboard";
import { getCompanyFilterOptions } from "@/lib/utils/tenant";
import { logError } from "@/lib/utils/error";

interface CategoryEconomy {
  categoria: string;
  valor: number;
  pct: number;
  color: string;
}

interface InitiativeEconomy {
  iniciativa: string;
  valor: number;
  pct: number;
}

interface SupplierEconomy {
  fornecedor: string;
  valor: number;
  pct: number;
  itens: number | string;
}

interface DetailEconomy {
  iniciativa: string;
  categoria: string;
  fornecedor: string;
  valor: number;
  data: string;
}

export default function EconomiaPage() {
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
  const [apiData, setApiData] = useState<EconomyAnalyticsResponse | null>(null);

  const [filterOptions, setFilterOptions] = useState<{ categories: string[]; suppliers: string[] }>({
    categories: [],
    suppliers: [],
  });

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  useEffect(() => {
    dashboardApi.getFilterOptions(queryCompanyCode).then(setFilterOptions).catch((err) => {
      logError("analytics/economia/filterOptions", err);
    });
  }, [queryCompanyCode]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [economyData, monthlyData] = await Promise.all([
        dashboardApi.getEconomyAnalytics(
          queryCompanyCode,
          selectedCategory,
          selectedSupplier,
          dateFilter.preset,
          dateFilter.startDate,
          dateFilter.endDate
        ),
        dashboardApi.getMonthlyEconomy(
          queryCompanyCode,
          dateFilter.preset,
          dateFilter.startDate,
          dateFilter.endDate,
          selectedCategory,
          selectedSupplier
        ),
      ]);
      setApiData({
        ...economyData,
        monthlyEconomy: monthlyData && monthlyData.length > 0 ? monthlyData : economyData.monthlyEconomy,
      });
    } catch (err) {
      logError("analytics/economia/fetchData", err);
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
      await dashboardApi.downloadReportFile("savings", format, queryCompanyCode, dateFilter.startDate, dateFilter.endDate, dateFilter.preset);
      toast({
        variant: "success",
        title: "Download Concluído",
        message: `O relatório de Economia & Savings foi exportado em ${type === "XLS" ? "Excel (.xlsx)" : "PDF (.pdf)"} com sucesso.`
      });
    } catch (err) {
      logError("analytics/economia/export", err);
      // Fallback para CSV estruturado no cliente
      try {
        const rows: string[][] = [
          ["Iniciativa / Detalhe", "Categoria", "Fornecedor", "Valor Economizado (R$)", "Data"],
          ...(apiData?.details || []).map((d) => [
            d.iniciativa,
            d.categoria,
            d.fornecedor,
            Number(d.valor || 0).toFixed(2),
            d.data,
          ]),
          [],
          ["Categoria", "Valor Economizado (R$)", "% do Total de Savings"],
          ...categoriesData.map((c) => [
            c.categoria,
            c.valor.toFixed(2),
            `${c.pct}%`,
          ]),
          [],
          ["Fornecedor", "Valor Economizado (R$)", "% do Total", "Itens Negociados"],
          ...suppliersData.map((s) => [
            s.fornecedor,
            s.valor.toFixed(2),
            `${s.pct}%`,
            String(s.itens),
          ]),
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((row) => row.map((cell) => `"${cell}"`).join(";")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_savings_economia_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          variant: "success",
          title: "Download Concluído",
          message: "O relatório foi exportado em formato CSV."
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

  const monthlyEconomyData = useMemo(() => {
    return apiData?.monthlyEconomy || [];
  }, [apiData]);

  const categoriesData = useMemo<CategoryEconomy[]>(() => {
    if (!apiData?.categories || apiData.categories.length === 0) return [];
    return apiData.categories.map((c, idx) => ({
      categoria: c.categoria,
      valor: c.valor,
      pct: Number(c.pct.toFixed(1)),
      color: c.color || ['#007d79', '#00a39e', '#7c3aed', '#db2777', '#64748b'][idx % 5],
    }));
  }, [apiData]);

  const initiativesData = useMemo<InitiativeEconomy[]>(() => {
    return (apiData?.initiatives || []).map((i) => ({
      iniciativa: i.iniciativa,
      valor: i.valor,
      pct: Number(i.pct.toFixed(1)),
    }));
  }, [apiData]);

  const suppliersData = useMemo<SupplierEconomy[]>(() => {
    return (apiData?.suppliers || []).map((s) => ({
      fornecedor: s.fornecedor,
      valor: s.valor,
      pct: Number(s.pct.toFixed(1)),
      itens: s.itens,
    }));
  }, [apiData]);

  const detailsData = useMemo<DetailEconomy[]>(() => {
    return apiData?.details || [];
  }, [apiData]);

  const totals = useMemo(() => {
    const catSum = categoriesData.reduce((s, c) => s + c.valor, 0);
    const initSum = initiativesData.reduce((s, i) => s + i.valor, 0);
    const suppSum = suppliersData.reduce((s, sup) => s + sup.valor, 0);
    const itemsSum = suppliersData.reduce((s, sup) => s + (typeof sup.itens === "number" ? sup.itens : 0), 0);
    const detailsSum = detailsData.reduce((s, d) => s + d.valor, 0);

    return {
      categories: catSum,
      initiatives: initSum,
      suppliers: suppSum,
      items: itemsSum,
      details: detailsSum,
      economiaGerada: catSum || suppSum,
    };
  }, [categoriesData, initiativesData, suppliersData, detailsData]);

  const kpis = useMemo(() => {
    return {
      economiaGerada: apiData?.kpis?.economiaGerada || "R$ 0,00",
      economiaPct: apiData?.kpis?.economiaPct || "0,0%",
      economiaPotencial: apiData?.kpis?.economiaPotencial || apiData?.kpis?.economiaGerada || "R$ 0,00",
      negociacoesCount: apiData?.kpis?.negociacoesCount || String(suppliersData.length),
      trendEconomia: "Economia consolidada via banco de dados",
      trendEconPct: "vs. spend de referência",
      trendPotencial: "Saving total consolidado",
      trendNegociacoes: "Fornecedores negociados",
    };
  }, [apiData, suppliersData.length]);

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
        <Loading variant="fullscreen" message={`Gerando relatório de Savings (${exportingType})...`} />
      )}

      
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleText}>
            <h1>Análise de Economia & Savings</h1>
            <p>Acompanhe a eficiência das negociações, metas de savings e valor gerado para o negócio.</p>
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
            <span className={styles.kpiTitle}>Economia gerada</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#e6f7ed", color: "#16a34a" }}>
              <span style={{ fontWeight: "bold" }}>$</span>
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.economiaGerada}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGreen}>{kpis.trendEconomia}</span>
              <span className={styles.trendGray}>vs. período anterior</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>% de economia</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
              <span style={{ fontWeight: "bold" }}>%</span>
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.economiaPct}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGray}>{kpis.trendEconPct}</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Economia potencial</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
              <Icon name="target-05" size={16} />
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.economiaPotencial}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGreen} style={{ color: "#00a39e" }}>{kpis.trendPotencial}</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Negociações realizadas</span>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
              <Icon name="hand" size={16} />
            </div>
          </div>
          <div>
            <h3 className={styles.kpiValue}>{kpis.negociacoesCount}</h3>
            <div className={styles.kpiTrend}>
              <span className={styles.trendGreen}>{kpis.trendNegociacoes}</span>
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
                Evolução da economia gerada
                <Icon name="help-circle" size={14} className={styles.infoIcon} />
              </div>
              <select className={styles.chartSelect} defaultValue="mensal">
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
              </select>
            </div>
            <div className={styles.chartWrapper}>
              <AreaChart
                data={monthlyEconomyData}
                color="#007d79"
                valueFormatter={(v) => `R$ ${v}k`}
                label1="Economia"
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
                Economia por categoria
                <Icon name="help-circle" size={14} className={styles.infoIcon} />
              </div>
            </div>
            <div className={styles.donutRow}>
              <div className={styles.donutBox}>
                <PieChart
                  data={categoriesData.map(c => ({
                    name: c.categoria,
                    value: c.pct,
                    color: c.color
                  }))}
                />
              </div>
              <div className={styles.legendList}>
                {categoriesData.map((item, index) => (
                  <div key={index} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                    <span className={styles.legendName} title={item.categoria}>{item.categoria}</span>
                    <span className={styles.legendValue}>{formatCurrency(item.valor)}</span>
                    <span className={styles.legendPct}>{item.pct.toFixed(1)}%</span>
                  </div>
                ))}
                <div className={styles.legendDivider} />
                <div className={styles.legendTotalRow}>
                  <span />
                  <span>Total</span>
                  <span className={styles.legendValue}>{formatCurrency(totals.categories)}</span>
                  <span className={styles.legendPct}>100%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${styles.chartCard} styles.initiativeCard`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Economia por tipo de iniciativa
              <Icon name="help-circle" size={14} className={styles.infoIcon} />
            </div>
          </div>
          <div className={styles.initiativeList}>
            {initiativesData.map((init, idx) => (
              <div key={idx} className={styles.initiativeRow}>
                <span className={styles.initiativeName} title={init.iniciativa}>{init.iniciativa}</span>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${init.pct}%` }} />
                </div>
                <span className={styles.initiativeValue}>{formatCurrency(init.valor)}</span>
                <span className={styles.initiativePct}>{init.pct.toFixed(1)}%</span>
              </div>
            ))}
            <div className={styles.initiativeDivider} />
            <div className={styles.initiativeTotalRow}>
              <span>Total</span>
              <div />
              <span className={styles.initiativeValue}>{formatCurrency(totals.initiatives)}</span>
              <span className={styles.initiativePct}>100%</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className={styles.bottomGrid}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Top fornecedores por economia gerada
              <Icon name="help-circle" size={14} className={styles.infoIcon} />
            </div>
            <span className={styles.linkText}>Ver todos</span>
          </div>
          <div className={styles.customTableWrapper}>
            <table className={styles.economyTable}>
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th style={{ textAlign: "right" }}>Economia Gerada</th>
                  <th style={{ textAlign: "right" }}>% da Economia</th>
                  <th style={{ textAlign: "right" }}>Itens Negociados</th>
                </tr>
              </thead>
              <tbody>
                {suppliersData.map((supplier, idx) => (
                  <tr key={idx}>
                    <td>{supplier.fornecedor}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(supplier.valor)}</td>
                    <td style={{ textAlign: "right" }}>{supplier.pct.toFixed(1)}%</td>
                    <td style={{ textAlign: "right" }}>{supplier.itens}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(totals.suppliers)}</td>
                  <td style={{ textAlign: "right" }}>100%</td>
                  <td style={{ textAlign: "right" }}>{totals.items}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Detalhamento das economias
              <Icon name="help-circle" size={14} className={styles.infoIcon} />
            </div>
            <span className={styles.linkText}>Ver todos</span>
          </div>
          <div className={styles.customTableWrapper}>
            <table className={styles.economyTable}>
              <thead>
                <tr>
                  <th>Iniciativa</th>
                  <th>Categoria</th>
                  <th>Fornecedor</th>
                  <th style={{ textAlign: "right" }}>Economia Gerada</th>
                  <th style={{ textAlign: "right" }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {detailsData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.iniciativa}</td>
                    <td>{item.categoria}</td>
                    <td>{item.fornecedor}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(item.valor)}</td>
                    <td style={{ textAlign: "right" }}>{item.data}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td />
                  <td />
                  <td style={{ textAlign: "right" }}>{formatCurrency(totals.details)}</td>
                  <td style={{ textAlign: "right" }}>--</td>
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
