"use client";

import React, { useState } from "react";
import styles from "./insights.module.css";
import {
  KpiCard,
  Card,
  BarChart,
  Badge,
  Button,
  Icon
} from "@/components/ui";

interface InsightItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "Alta" | "Média" | "Baixa";
  impact: string;
  date: string;
}

export default function InsightsPage() {
  const [filterPriority, setFilterPriority] = useState<string>("Todas");

  const slaData = [
    { name: "Combustíveis", value: 12, color: "#007d79" },
    { name: "MRO", value: 8, color: "#007d79" },
    { name: "Serviços", value: 15, color: "#7c3aed" },
    { name: "Logística", value: 5, color: "#007d79" },
    { name: "Matérias-Primas", value: 18, color: "#db2777" },
  ];

  const insights: InsightItem[] = [
    {
      id: "INS-001",
      title: "Consolidar RFQs de Embalagens",
      description: "Identificamos 3 requisições similares de papelão que podem ser agrupadas para obter maior volume e margem de negociação com fornecedores.",
      category: "Matérias-Primas",
      priority: "Alta",
      impact: "Economia estimada de 12% (R$ 84.000)",
      date: "Hoje"
    },
    {
      id: "INS-002",
      title: "SLA de Motores Excedido",
      description: "A RFQ-2026-001 de Motores Elétricos está aberta há 5 dias e recebeu apenas 1 proposta qualificada. O tempo de resposta esperado é de 3 dias.",
      category: "MRO",
      priority: "Alta",
      impact: "Atraso potencial de 4 dias na entrega",
      date: "Ontem"
    },
    {
      id: "INS-003",
      title: "Revisar Fornecedor Texaco",
      description: "O tempo médio de resposta do fornecedor Texaco subiu de 2 para 5 dias nas últimas 3 cotações de óleo diesel.",
      category: "Combustíveis",
      priority: "Média",
      impact: "Risco médio de fornecimento",
      date: "24/06/2026"
    },
    {
      id: "INS-004",
      title: "Preços de Frete Flutuantes",
      description: "A rota de logística Lins-Santos apresentou uma alta de 7% nas cotações spot. Recomendamos negociar contratos de médio prazo.",
      category: "Logística",
      priority: "Baixa",
      impact: "Impacto financeiro de R$ 15.000",
      date: "23/06/2026"
    }
  ];

  const filteredInsights = filterPriority === "Todas" 
    ? insights 
    : insights.filter(i => i.priority === filterPriority);

  const getPriorityBadge = (priority: "Alta" | "Média" | "Baixa") => {
    switch (priority) {
      case "Alta": return <Badge variant="danger">Alta prioridade</Badge>;
      case "Média": return <Badge variant="warning">Média prioridade</Badge>;
      case "Baixa": return <Badge variant="gray">Baixa prioridade</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Insights de Suprimentos <span className={styles.aiTag}>IA Ativa</span></h1>
          <p>Diagnósticos inteligentes e oportunidades recomendadas pela nossa inteligência artificial.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard 
          title="Alertas Críticos" 
          value="2" 
          icon="alert-triangle" 
          description="SLA estourado ou falta de lances"
        />
        <KpiCard 
          title="Fornecedores em Alerta" 
          value="3" 
          icon="shield-off" 
          description="Queda de performance recente"
        />
        <KpiCard 
          title="Economia Oportuna" 
          value="R$ 99.000" 
          icon="trend-up-01" 
          description="Oportunidades de consolidação"
        />
        <KpiCard 
          title="Índice de Eficiência" 
          value="94.2%" 
          icon="check-verified-01" 
          description="SLA dentro da meta de 10 dias"
        />
      </div>

      <div className={styles.dashboardGrid}>
        {/* Left Side: SLA Performance & Table */}
        <div className={styles.leftSection}>
          <Card className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Tempo de Resposta Médio (SLA em dias)</h3>
                <span className={styles.subtitle}>Média em dias até a conclusão por categoria</span>
              </div>
            </div>
            <div className={styles.chartWrapper}>
              <BarChart 
                data={slaData} 
                defaultColor="#007d79" 
                valueFormatter={(val) => `${val} dias`}
              />
            </div>
          </Card>

          <Card className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <h3>Análise de Saúde das RFQs</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>RFQ</th>
                    <th>Categoria</th>
                    <th>Tempo Aberta</th>
                    <th>Propostas</th>
                    <th>Saúde</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>RFQ-2026-001</strong></td>
                    <td>MRO</td>
                    <td>5 dias</td>
                    <td>1 proposta</td>
                    <td><span className={styles.healthBad}>42%</span></td>
                    <td><Badge variant="warning">Risco de Atraso</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>RFQ-2026-002</strong></td>
                    <td>Serviços</td>
                    <td>2 dias</td>
                    <td>4 propostas</td>
                    <td><span className={styles.healthGood}>98%</span></td>
                    <td><Badge variant="success">Saudável</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>RFQ-2026-003</strong></td>
                    <td>Embalagens</td>
                    <td>8 dias</td>
                    <td>6 propostas</td>
                    <td><span className={styles.healthGood}>92%</span></td>
                    <td><Badge variant="gray">Em homologação</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Side: AI Insights Panel */}
        <div className={styles.rightSection}>
          <Card className={styles.insightsCard}>
            <div className={styles.insightsHeader}>
              <h3>Recomendações da IA</h3>
              <div className={styles.filterGroup}>
                {["Todas", "Alta", "Média"].map((p) => (
                  <button 
                    key={p} 
                    className={`${styles.filterBtn} ${filterPriority === p ? styles.activeFilter : ""}`}
                    onClick={() => setFilterPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.insightsList}>
              {filteredInsights.map((insight) => (
                <div key={insight.id} className={styles.insightItem}>
                  <div className={styles.insightTop}>
                    <span className={styles.insightId}>{insight.id}</span>
                    {getPriorityBadge(insight.priority)}
                  </div>
                  <h4>{insight.title}</h4>
                  <p className={styles.insightDesc}>{insight.description}</p>
                  <div className={styles.insightImpact}>
                    <Icon name="trend-up-01" size={16} />
                    <span>{insight.impact}</span>
                  </div>
                  <div className={styles.insightFooter}>
                    <span className={styles.insightCat}>{insight.category}</span>
                    <span className={styles.insightDate}>{insight.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
