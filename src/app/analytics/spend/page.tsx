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
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TODAS");
  const [exportingType, setExportingType] = useState<"PDF" | "XLS" | null>(null);

  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<SpendAnalyticsResponse | null>(null);

  const companyOptions = getCompanyFilterOptions();
  const queryCompanyCode = selectedCompanyId !== "TODAS" ? selectedCompanyId : undefined;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getSpendAnalytics(queryCompanyCode, selectedCategory, selectedSupplier);
      setApiData(data);
    } catch (err) {
      logError("analytics/spend/fetchData", err);
    } finally {
      setLoading(false);
    }
  }, [queryCompanyCode, selectedCategory, selectedSupplier]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (type: "PDF" | "XLS") => {
    setExportingType(type);
    setTimeout(() => {
      setExportingType(null);
      toast({
        variant: "success",
        title: "Download Iniciado!",
        message: `O relatório de Spend (${type}) foi gerado e baixado com sucesso.`
      });
    }, 1500);
  };

  const monthlySpendData = useMemo(() => {
    return apiData?.monthlySpend || [];
  }, [apiData]);

  const categoriesData = useMemo<SpendItem[]>(() => {
    if (!apiData?.categories || apiData.categories.length === 0) return [];
    
    let list = apiData.categories;
    if (selectedCategory !== "all") {
      list = list.filter((c) => c.categoria === selectedCategory);
    }
    return list.map((c, i) => ({
      categoria: c.categoria,
      spendTotal: c.spendTotal,
      pctTotal: Number(c.pctTotal.toFixed(1)),
      pedidos: c.pedidos,
      economiaPotencial: Math.round(c.spendTotal * 0.12),
      color: c.color || ['#007d79', '#00a39e', '#004144', '#1192e8', '#0f62fe', '#7c3aed'][i % 6],
    }));
  }, [apiData, selectedCategory]);

  const suppliersData = useMemo<SupplierSpend[]>(() => {
    if (!apiData?.suppliers || apiData.suppliers.length === 0) return [];
    
    let list = apiData.suppliers;
    if (selectedSupplier !== "all") {
      list = list.filter((s) => s.nome === selectedSupplier);
    }
    return list;
  }, [apiData, selectedSupplier]);

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
    const totalSpend = totals.spendTotal;
    const totalEcon = totals.economiaPotencial;
    const pct = totalSpend > 0 ? ((totalEcon / totalSpend) * 100).toFixed(1) : "0.0";

    return {
      spendTotal: apiData?.kpis?.spendTotal || formatCurrency(totalSpend),
      economiaPotencial: formatCurrency(totalEcon),
      pedidosEmitidos: apiData?.kpis?.pedidosEmitidos || String(totals.pedidos),
      fornecedoresAtivos: apiData?.kpis?.fornecedoresAtivos || String(suppliersData.length),
      trendSpend: totalSpend > 0 ? "Em conformidade" : "Sem movimentação",
      trendEconomia: `${pct}% do spend total`,
      trendPedidos: "Emitidos no período",
      trendFornecedores: "Ativos na base"
    };
  }, [apiData, totals, suppliersData.length]);

  const categoryOptions = useMemo(() => [
    { value: "all", label: "Todas as Categorias" },
    ...Array.from(new Set((apiData?.categories || []).map((c) => c.categoria))).map((cat) => ({
      value: cat,
      label: cat,
    })),
  ], [apiData]);

  const supplierOptions = useMemo(() => [
    { value: "all", label: "Todos os Fornecedores" },
    ...Array.from(new Set((apiData?.suppliers || []).map((s) => s.nome))).map((sup) => ({
      value: sup,
      label: sup,
    })),
  ], [apiData]);


  const handleClearFilters = () => {
    setSelectedPeriod("all");
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
          <div className={styles.iconBox}>
            <Icon name="presentation-chart-01" size={24} />
          </div>
          <div className={styles.titleText}>
            <h1>Análise de Spend</h1>
            <p>Visão completa dos gastos para uma gestão estratégica e orientada a dados.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ExportButton onExport={handleExport} />
          <button className={styles.outlineBtn}>
            <Icon name="filter-lines" size={16} /> Filtros
          </button>
        </div>
      </div>

      
      <div className={styles.filterRow}>
        <div className={styles.filterInput}>
          <div className={styles.dateRangeBox}>
            <span>
              <Icon name="calendar" size={16} style={{ color: "#94a3b8" }} />
              01/05/2024 - 31/05/2025
            </span>
            <Icon name="chevron-down" size={16} style={{ color: "#94a3b8" }} />
          </div>
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
          onClick={() => {
            setSelectedPeriod("all");
            setSelectedCategory("all");
            setSelectedSupplier("all");
            setSelectedCompanyId("TODAS");
          }}
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
