"use client";

import React, { useState, useMemo } from "react";
import styles from "./economia.module.css";
import {
  Card,
  AreaChart,
  PieChart,
  Select,
  Icon,
  Loading
} from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";

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
        message: `O relatório de Savings (${type}) foi gerado e baixado com sucesso.`
      });
    }, 1500);
  };

  // Base monthly trends matching the screenshot EXACTLY (ranges from R$ 200k to R$ 600k)
  const baseMonthlyEconomy = useMemo(() => [
    { name: "mai/24", value: 250 },
    { name: "jun/24", value: 300 },
    { name: "jul/24", value: 240 },
    { name: "ago/24", value: 270 },
    { name: "set/24", value: 330 },
    { name: "out/24", value: 350 },
    { name: "nov/24", value: 300 },
    { name: "dez/24", value: 290 },
    { name: "jan/25", value: 330 },
    { name: "fev/25", value: 310 },
    { name: "mar/25", value: 330 },
    { name: "abr/25", value: 370 },
    { name: "mai/25", value: 450 }
  ], []);

  // Category values matching screen EXACTLY
  const baseCategories = useMemo<CategoryEconomy[]>(() => [
    { categoria: "Matéria-prima", valor: 620000, pct: 32.7, color: "#007d79" },
    { categoria: "Serviços", valor: 410000, pct: 21.6, color: "#00a39e" },
    { categoria: "Embalagens", valor: 265000, pct: 14.0, color: "#7c3aed" },
    { categoria: "Manutenção", valor: 198000, pct: 10.4, color: "#db2777" },
    { categoria: "TI e Software", valor: 143000, pct: 7.5, color: "#64748b" },
    { categoria: "Outros", valor: 260000, pct: 13.8, color: "#cbd5e1" }
  ], []);

  // Initiative values matching screen EXACTLY
  const baseInitiatives = useMemo<InitiativeEconomy[]>(() => [
    { iniciativa: "Negociação de preço", valor: 950000, pct: 50.1 },
    { iniciativa: "Consolidação de demanda", valor: 420000, pct: 22.2 },
    { iniciativa: "Substituição de fornecedor", valor: 250000, pct: 13.2 },
    { iniciativa: "Padronização de itens", valor: 160000, pct: 8.4 },
    { iniciativa: "Redesenho / Engenharia", valor: 80000, pct: 4.2 },
    { iniciativa: "Outros", valor: 36000, pct: 1.9 }
  ], []);

  // Top suppliers values matching screen EXACTLY
  const baseSuppliers = useMemo<SupplierEconomy[]>(() => [
    { fornecedor: "Fornecedor Alfa Ltda.", valor: 620000, pct: 32.7, itens: 18 },
    { fornecedor: "Fornecedor Beta S.A.", valor: 410000, pct: 21.6, itens: 12 },
    { fornecedor: "Fornecedor Gama Ltda.", valor: 265000, pct: 14.0, itens: 9 },
    { fornecedor: "Fornecedor Delta S.A.", valor: 198000, pct: 10.4, itens: 5 },
    { fornecedor: "Fornecedor Épsilon Ltda.", valor: 143000, pct: 7.5, itens: 4 },
    { fornecedor: "Outros (23)", valor: 260000, pct: 13.8, itens: "--" }
  ], []);

  // Details values matching screen EXACTLY
  const baseDetails = useMemo<DetailEconomy[]>(() => [
    { iniciativa: "Negociação anual de preços", categoria: "Matéria-prima", fornecedor: "Fornecedor Alfa Ltda.", valor: 320000, data: "12/05/2025" },
    { iniciativa: "Consolidação de demanda Q2", categoria: "Serviços", fornecedor: "Fornecedor Beta S.A.", valor: 210000, data: "08/05/2025" },
    { iniciativa: "Alternativa de fornecedor", categoria: "Embalagens", fornecedor: "Fornecedor Gama Ltda.", valor: 185000, data: "02/05/2025" },
    { iniciativa: "Padronização de componentes", categoria: "Manutenção", fornecedor: "Fornecedor Delta S.A.", valor: 120000, data: "28/04/2025" },
    { iniciativa: "Renegociação de contrato", categoria: "TI e Software", fornecedor: "Fornecedor Épsilon Ltda.", valor: 950000, data: "20/04/2025" }, // Note: R$ 95k in description, R$ 966k for others, we will match R$ 95.000 for this row
    { iniciativa: "Outros (43)", categoria: "Diversas", fornecedor: "--", valor: 966000, data: "--" }
  ], []);

  // Calculate dynamic scaling factors
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

  // Compute stats metrics based on filtered factor
  const kpis = useMemo(() => {
    const isFiltered = filterFactor < 1.0;
    if (!isFiltered) {
      // EXACT VALUES from the screenshot
      return {
        economiaGerada: "R$ 1.896.000",
        economiaPct: "15,2%",
        economiaPotencial: "R$ 620.000",
        negociacoesCount: "48",
        trendEconomia: "↑ 18,6%",
        trendEconPct: "vs. spend de referência",
        trendPotencial: "32,7% do potencial total",
        trendNegociacoes: "↑ 9,1%"
      };
    }

    const econVal = Math.round(1896000 * filterFactor);
    const potVal = Math.round(620000 * filterFactor);
    const countVal = Math.max(1, Math.round(48 * filterFactor));
    const pctVal = (15.2 * (0.9 + Math.random() * 0.2)).toFixed(1);

    const potPct = ((potVal / (econVal + potVal)) * 100).toFixed(1);

    return {
      economiaGerada: formatCurrency(econVal),
      economiaPct: `${pctVal}%`,
      economiaPotencial: formatCurrency(potVal),
      negociacoesCount: String(countVal),
      trendEconomia: "↑ 12,4%",
      trendEconPct: "vs. spend de referência",
      trendPotencial: `${potPct}% do potencial total`,
      trendNegociacoes: "↑ 5,2%"
    };
  }, [filterFactor]);

  // Dynamic chart and tables
  const monthlyEconomyData = useMemo(() => {
    return baseMonthlyEconomy.map(item => ({
      ...item,
      value: Math.round(item.value * filterFactor)
    }));
  }, [baseMonthlyEconomy, filterFactor]);

  const categoriesData = useMemo(() => {
    if (filterFactor === 1.0) return baseCategories;
    return baseCategories.map(item => ({
      ...item,
      valor: Math.round(item.valor * filterFactor)
    }));
  }, [baseCategories, filterFactor]);

  const initiativesData = useMemo(() => {
    if (filterFactor === 1.0) return baseInitiatives;
    return baseInitiatives.map(item => ({
      ...item,
      valor: Math.round(item.valor * filterFactor)
    }));
  }, [baseInitiatives, filterFactor]);

  const suppliersData = useMemo(() => {
    if (filterFactor === 1.0) return baseSuppliers;
    return baseSuppliers.map(item => ({
      ...item,
      valor: Math.round(item.valor * filterFactor),
      itens: item.itens === "--" ? "--" : Math.max(1, Math.round(Number(item.itens) * filterFactor))
    }));
  }, [baseSuppliers, filterFactor]);

  const detailsData = useMemo(() => {
    if (filterFactor === 1.0) {
      // Fix specific mismatch in screenshot row (row 5: R$ 95.000 instead of 950000 in DB data to match totals)
      return baseDetails.map((item, idx) => idx === 4 ? { ...item, valor: 95000 } : item);
    }
    return baseDetails.map(item => ({
      ...item,
      valor: Math.round((item.iniciativa.startsWith("Renegociação") ? 95000 : item.valor) * filterFactor)
    }));
  }, [baseDetails, filterFactor]);

  const totals = useMemo(() => {
    const categoriesSum = categoriesData.reduce((s, c) => s + c.valor, 0);
    const initiativesSum = initiativesData.reduce((s, i) => s + i.valor, 0);
    const suppliersSum = suppliersData.reduce((s, sup) => s + sup.valor, 0);
    const itemsSum = suppliersData.reduce((s, sup) => s + (typeof sup.itens === "number" ? sup.itens : 0), 0);
    const detailsSum = detailsData.reduce((s, d) => s + d.valor, 0);

    return {
      categories: categoriesSum,
      initiatives: initiativesSum,
      suppliers: suppliersSum,
      items: itemsSum,
      details: detailsSum
    };
  }, [categoriesData, initiativesData, suppliersData, detailsData]);

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
        <Loading variant="fullscreen" message={`Gerando relatório de Savings (${exportingType})...`} />
      )}

      {/* Header section with title and export dropdown */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBox}>
            <Icon name="presentation-chart-01" size={24} />
          </div>
          <div className={styles.titleText}>
            <h1>Economia Gerada</h1>
            <p>Acompanhe o valor economizado através de negociações estratégicas e decisões de compra inteligentes.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn} onClick={() => handleExport("PDF")}>
            <Icon name="download-02" size={16} /> Exportar
          </button>
        </div>
      </div>

      {/* Filters Row */}
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
              { value: "all", label: "Todas" },
              { value: "lins", label: "Unidade Lins" },
              { value: "promissao", label: "Unidade Promissão" },
              { value: "guaiuba", label: "Unidade Guaiúba" }
            ]}
            value={selectedUnidade}
            onChange={setSelectedUnidade}
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

        <button className={styles.clearButton} onClick={handleClearFilters}>
          <Icon name="refresh-ccw-01" size={16} /> Limpar filtros
        </button>
      </div>

      {/* Row of 4 KPI cards */}
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

      {/* Middle Row (Area Chart, Donut split category, Initiatives progress bars) */}
      <div className={styles.middleGrid}>
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
                  <span className={styles.legendName}>{item.categoria}</span>
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

      {/* Bottom Grid (Top suppliers table and Detailing table) */}
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

      {/* Footer Refresh Timestamp */}
      <div className={styles.footerRow}>
        <Icon name="refresh-ccw-01" size={14} />
        <span>Dados atualizados em 02/06/2025 às 08:30</span>
      </div>
    </div>
  );
}
