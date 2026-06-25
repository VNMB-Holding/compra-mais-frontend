"use client";

import React from "react";
import styles from "./economia.module.css";
import {
  KpiCard,
  Card,
  AreaChart,
  Badge,
  Icon
} from "@/components/ui";

export default function EconomiaPage() {
  const savingsData = [
    { name: "Jan", value: 300, value2: 350 },
    { name: "Fev", value: 450, value2: 500 },
    { name: "Mar", value: 400, value2: 480 },
    { name: "Abr", value: 550, value2: 620 },
    { name: "Mai", value: 700, value2: 800 },
    { name: "Jun", value: 650, value2: 720 },
    { name: "Jul", value: 850, value2: 950 },
    { name: "Ago", value: 920, value2: 1050 },
  ];

  const highestSavings = [
    {
      rfq: "RFQ-000128",
      description: "Óleo Diesel S10 - Lote Lins",
      category: "Combustíveis",
      buyer: "Breno Marques",
      initial: 4200000,
      negotiated: 3850000,
      saving: 350000,
      percentage: "8.3%"
    },
    {
      rfq: "RFQ-2026-001",
      description: "Motores Elétricos Trifásicos",
      category: "MRO",
      buyer: "Breno Marques",
      initial: 1500000,
      negotiated: 1250000,
      saving: 250000,
      percentage: "16.6%"
    },
    {
      rfq: "RFQ-2026-003",
      description: "Embalagens Papelão JBS Lins",
      category: "Embalagens",
      buyer: "Ana Silva",
      initial: 780000,
      negotiated: 686400,
      saving: 93600,
      percentage: "12.0%"
    },
    {
      rfq: "RFQ-2026-004",
      description: "Licenciamento SaaS CRM",
      category: "TI",
      buyer: "Carlos Souza",
      initial: 350000,
      negotiated: 280000,
      saving: 70000,
      percentage: "20.0%"
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Economia Gerada (Savings)</h1>
          <p>Resultados financeiros obtidos através de negociações competitivas e estratégias de suprimento.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard 
          title="Savings Total" 
          value="R$ 12.458.000" 
          icon="trend-up-01" 
          trend={{ value: "+18.6%", label: "vs ano anterior" }}
          description="Redução direta em relação ao valor orçado"
        />
        <KpiCard 
          title="Custo Evitado" 
          value="R$ 3.120.000" 
          icon="shield-01" 
          trend={{ value: "+5.4%", label: "vs meta trimestral" }}
          description="Negociações contra reajustes inflacionários"
        />
        <KpiCard 
          title="Média por RFQ" 
          value="18.4%" 
          icon="percent-01" 
          trend={{ value: "+2.1%", label: "vs média do setor" }}
          description="Percentual médio economizado por processo"
        />
        <KpiCard 
          title="ROI de Compras" 
          value="8.5x" 
          icon="coins-01" 
          trend={{ value: "Excepcional", label: "Multiplicador de valor" }}
          description="Retorno sobre investimento operacional"
        />
      </div>

      {/* Monthly chart */}
      <Card className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3>Evolução Mensal do Savings (R$ em milhares)</h3>
            <span className={styles.subtitle}>Comparativo de economia real vs. economia potencial identificada</span>
          </div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotReal}`} />
              <span>Realizado</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotPot}`} />
              <span>Potencial</span>
            </div>
          </div>
        </div>
        
        <div className={styles.chartWrapper}>
          <AreaChart 
            data={savingsData} 
            color="#007d79" 
            color2="#7c3aed"
            valueFormatter={(val) => `R$ ${val}k`}
            label1="Realizado"
            label2="Potencial"
          />
        </div>
      </Card>

      {/* Savings Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Maiores Sucessos de Negociação (RFQ)</h3>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>RFQ</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Comprador</th>
                <th>Preço Inicial</th>
                <th>Preço Final</th>
                <th>Savings Real</th>
                <th>Savings (%)</th>
              </tr>
            </thead>
            <tbody>
              {highestSavings.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.rfq}</strong></td>
                  <td>{item.description}</td>
                  <td>{item.category}</td>
                  <td>{item.buyer}</td>
                  <td>{formatCurrency(item.initial)}</td>
                  <td>{formatCurrency(item.negotiated)}</td>
                  <td>
                    <span className={styles.savingValue}>{formatCurrency(item.saving)}</span>
                  </td>
                  <td>
                    <Badge variant="success">{item.percentage}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
