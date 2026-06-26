"use client";

import React, { useState, useMemo } from "react";
import styles from "./spend.module.css";
import {
  Card,
  AreaChart,
  PieChart,
  Select,
  Icon,
  Loading,
  ExportButton
} from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";

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
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [exportingType, setExportingType] = useState<"PDF" | "XLS" | null>(null);

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

  // Base datasets matching the screenshot EXACTLY
  const baseMonthlySpend = useMemo(() => [
    { name: "mai/24", value: 720 },
    { name: "jun/24", value: 1100 },
    { name: "jul/24", value: 740 },
    { name: "ago/24", value: 830 },
    { name: "set/24", value: 1150 },
    { name: "out/24", value: 1300 },
    { name: "nov/24", value: 1050 },
    { name: "dez/24", value: 1150 },
    { name: "jan/25", value: 980 },
    { name: "fev/25", value: 1220 },
    { name: "mar/25", value: 1100 },
    { name: "abr/25", value: 1290 },
    { name: "mai/25", value: 1720 }
  ], []);

  const baseCategories = useMemo<SpendItem[]>(() => [
    { categoria: "Matéria-prima", spendTotal: 4125000, pctTotal: 33.1, pedidos: 18, economiaPotencial: 620000, color: "#007d79" },
    { categoria: "Serviços", spendTotal: 2980000, pctTotal: 23.9, pedidos: 12, economiaPotencial: 410000, color: "#00a39e" },
    { categoria: "Embalagens", spendTotal: 1850000, pctTotal: 14.8, pedidos: 9, economiaPotencial: 265000, color: "#7c3aed" },
    { categoria: "Manutenção", spendTotal: 1320000, pctTotal: 10.6, pedidos: 5, economiaPotencial: 198000, color: "#db2777" },
    { categoria: "TI e Software", spendTotal: 1050000, pctTotal: 8.4, pedidos: 4, economiaPotencial: 143000, color: "#64748b" },
    { categoria: "Outros", spendTotal: 1133000, pctTotal: 9.2, pedidos: "--", economiaPotencial: 260000, color: "#cbd5e1" }
  ], []);

  const baseSuppliers = useMemo<SupplierSpend[]>(() => [
    { nome: "Fornecedor Alfa Ltda.", valor: 2145000, pct: 17.2 },
    { nome: "Fornecedor Beta S.A.", valor: 1530000, pct: 12.3 },
    { nome: "Fornecedor Gama Ltda.", valor: 1120000, pct: 9.0 },
    { nome: "Fornecedor Delta S.A.", valor: 980000, pct: 7.9 },
    { nome: "Fornecedor Épsilon Ltda.", valor: 875000, pct: 7.0 },
    { nome: "Outros (151)", valor: 5808000, pct: 46.6 }
  ], []);

  // Filter scaling factors to show realistic dynamic dashboard behavior on filters click
  const filterFactor = useMemo(() => {
    let factor = 1.0;
    if (selectedCategory !== "all") factor *= 0.35;
    if (selectedSupplier !== "all") factor *= 0.2;
    if (selectedUnidade !== "all") factor *= 0.45;
    if (selectedPeriod !== "all") {
      if (selectedPeriod === "30") factor *= 0.12;
      if (selectedPeriod === "90") factor *= 0.32;
    }
    return factor;
  }, [selectedPeriod, selectedCategory, selectedSupplier, selectedUnidade]);

  // Dynamic KPIs calculations
  const kpis = useMemo(() => {
    const isFiltered = filterFactor < 1.0;
    if (!isFiltered) {
      // Return the EXACT values from the screenshot
      return {
        spendTotal: "R$ 12.458.000",
        economiaPotencial: "R$ 1.896.000",
        pedidosEmitidos: "48",
        fornecedoresAtivos: "156",
        trendSpend: "↑ 18,6%",
        trendEconomia: "15,2% do spend total",
        trendPedidos: "↑ 9,1%",
        trendFornecedores: "↑ 5,4%"
      };
    }

    // Proportional simulated values when filtered
    const spendVal = Math.round(12458000 * filterFactor);
    const econVal = Math.round(1896000 * filterFactor);
    const pedidosVal = Math.max(1, Math.round(48 * filterFactor));
    const fornecedoresVal = Math.max(1, Math.round(156 * filterFactor));

    const pct = ((econVal / spendVal) * 100).toFixed(1);

    return {
      spendTotal: formatCurrency(spendVal),
      economiaPotencial: formatCurrency(econVal),
      pedidosEmitidos: String(pedidosVal),
      fornecedoresAtivos: String(fornecedoresVal),
      trendSpend: "↑ 12,4%",
      trendEconomia: `${pct}% do spend total`,
      trendPedidos: "↑ 5,2%",
      trendFornecedores: "↑ 2,1%"
    };
  }, [filterFactor]);

  // Dynamic Monthly Spend data
  const monthlySpendData = useMemo(() => {
    return baseMonthlySpend.map(item => ({
      ...item,
      value: Math.round(item.value * filterFactor)
    }));
  }, [baseMonthlySpend, filterFactor]);

  // Dynamic Categories spend data
  const categoriesData = useMemo(() => {
    if (filterFactor === 1.0) return baseCategories;
    
    // Scale totals while keeping percentage shares
    return baseCategories.map(item => ({
      ...item,
      spendTotal: Math.round(item.spendTotal * filterFactor),
      economiaPotencial: Math.round(item.economiaPotencial * filterFactor),
      pedidos: item.pedidos === "--" ? "--" : Math.max(1, Math.round(Number(item.pedidos) * filterFactor))
    }));
  }, [baseCategories, filterFactor]);

  // Dynamic Suppliers data
  const suppliersData = useMemo(() => {
    if (filterFactor === 1.0) return baseSuppliers;

    return baseSuppliers.map(item => ({
      ...item,
      valor: Math.round(item.valor * filterFactor)
    }));
  }, [baseSuppliers, filterFactor]);

  // Total summary footer helpers
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

  // Format BRL helpers
  function formatCurrency(val: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(val);
  }

  const handleClearFilters = () => {
    setSelectedPeriod("all");
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedUnidade("all");
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

      {/* Header section with title and buttons */}
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

      {/* Filter Row matching screenshot */}
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
            options={[
              { value: "all", label: "Todas" },
              { value: "MRO", label: "MRO" },
              { value: "Combustíveis", label: "Combustíveis" },
              { value: "Serviços", label: "Serviços" },
              { value: "Embalagens", label: "Embalagens" },
              { value: "TI", label: "TI e Software" }
            ]}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        <div className={styles.filterInput}>
          <Select
            options={[
              { value: "all", label: "Todos" },
              { value: "alfa", label: "Fornecedor Alfa Ltda." },
              { value: "beta", label: "Fornecedor Beta S.A." },
              { value: "gama", label: "Fornecedor Gama Ltda." }
            ]}
            value={selectedSupplier}
            onChange={setSelectedSupplier}
          />
        </div>

        <div className={styles.filterInput}>
          <Select
            options={[
              { value: "all", label: "Todas" },
              { value: "lins", label: "Unidade Lins" },
              { value: "promissao", label: "Unidade Promissão" },
              { value: "guaiuba", label: "Unidade Guaiúba" }
            ]}
            value={selectedUnidade}
            onChange={setSelectedUnidade}
          />
        </div>

        <button className={styles.clearButton} onClick={handleClearFilters}>
          <Icon name="refresh-ccw-01" size={16} /> Limpar filtros
        </button>
      </div>

      {/* Row of 4 KPI cards */}
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

      {/* Middle Row (Area Chart and Pie Chart with aligned legend table) */}
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

      {/* Bottom Grid (Progress Bars of Suppliers, and Table of Details) */}
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

      {/* Footer timestamp refresh row */}
      <div className={styles.footerRow}>
        <Icon name="refresh-ccw-01" size={14} />
        <span>Dados atualizados em 02/06/2025 às 08:30</span>
      </div>
    </div>
  );
}
