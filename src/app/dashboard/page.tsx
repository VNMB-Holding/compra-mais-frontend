"use client";

import React, { useState } from "react";
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

interface RFQ {
  codigo: string;
  descricao: string;
  categoria: string;
  dataAbertura: string;
  dataEncerramento: string;
  tipoSegmento: string;
  status: "Aberta" | "Encerrando hoje" | "Encerrada";
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Todas");

  const economiaPotencialData = [
    { name: "Jan", value: 300 },
    { name: "Fev", value: 450 },
    { name: "Mar", value: 400 },
    { name: "Abr", value: 550 },
    { name: "Mai", value: 700 },
    { name: "Jun", value: 650 },
    { name: "Jul", value: 850 },
    { name: "Ago", value: 920 },
  ];

  const topCategoriasData = [
    { name: "MRO", value: 45, color: "#007d79" },
    { name: "Serviços", value: 25, color: "#7c3aed" },
    { name: "Matérias-Primas", value: 20, color: "#db2777" },
    { name: "Logística", value: 10, color: "#64748b" },
  ];

  const rfqs: RFQ[] = [
    {
      codigo: "RFQ-2026-001",
      descricao: "Aquisição de Motores Elétricos JBS Lins",
      categoria: "MRO",
      dataAbertura: "10/06/2026",
      dataEncerramento: "15/06/2026 18:00",
      tipoSegmento: "Menor Preço",
      status: "Aberta",
    },
    {
      codigo: "RFQ-2026-002",
      descricao: "Prestação de Serviço de Manutenção Preventiva",
      categoria: "Serviços",
      dataAbertura: "11/06/2026",
      dataEncerramento: "12/06/2026 16:00",
      tipoSegmento: "Técnica e Preço",
      status: "Encerrando hoje",
    },
    {
      codigo: "RFQ-2026-003",
      descricao: "Fornecimento de Embalagens de Papelão",
      categoria: "Matérias-Primas",
      dataAbertura: "01/06/2026",
      dataEncerramento: "08/06/2026 14:00",
      tipoSegmento: "Menor Preço",
      status: "Encerrada",
    },
  ];

  // 2. OBJETO DINÂMICO DO CARD DE DESTAQUE (Mude as infos e a foto aqui quando quiser)
  const rfqMaisUrgente = {
    title: "Óleo Diesel S10",
    code: "RFQ-000128",
    comprador: "Breno",
    quantity: "500.000 L",
    category: "Combustíveis",
    type: "Menor preço",
    timeRemaining: "Vence em 02h 34m",
    imageUrl: "/images/bg-tubo-card.png" 
  };

  const tabsConfig = [
    { id: "Todas", label: "Todas", count: rfqs.length },
    { id: "Aberta", label: "Abertas", count: rfqs.filter((r) => r.status === "Aberta").length },
    { id: "Encerrando hoje", label: "Encerrando hoje", count: rfqs.filter((r) => r.status === "Encerrando hoje").length },
    { id: "Encerrada", label: "Encerradas", count: rfqs.filter((r) => r.status === "Encerrada").length },
  ];

  const columns: ColumnDef<RFQ>[] = [
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

  return (
    <div className={styles.viewDashboard}>
      
      <div className={styles.pageHeaderSimple}>
        <h1>Bom dia, Breno. <span className={styles.wave}>👋</span></h1>
        <p>Aqui está o panorama das suas operações de suprimentos hoje.</p>
      </div>

      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h2>Conectamos negócios.<br />Potencializamos <strong>resultados.</strong></h2>
          <p>Uma plataforma inteligente para compras estratégicas<br />e conexões que geram valor para o seu negócio.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="RFQs em andamento" value="12" icon="receipt-check" linkLabel="Ver todas" />
        <KpiCard title="Aprovações pendentes" value="8" icon="shield-01" linkLabel="Ver todas" />
        <KpiCard 
          title="Economia acumulada" 
          value="R$ 12.458.000" 
          icon="trend-up-01" 
          linkLabel="Ver detalhes" 
          trend={{ value: "+ 18,6%", label: "vs mês anterior" }}
        />
        <KpiCard title="Pedidos emitidos" value="48" icon="box" linkLabel="Ver todos" />
        <KpiCard title="Fornecedores ativos" value="156" icon="users-01" linkLabel="Ver todos" />
      </div>

      <div className={styles.middleGrid}>
        
        {/* 3. NOVO CARD IMPLANTADO AQUI (Substituindo o HTML estático antigo) */}
        <UrgentQuoteCard 
          quote={rfqMaisUrgente} 
          onAction={() => console.log("Redirecionando para RFQ...")} 
        />

        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h4>Economia potencial</h4>
            <span className={styles.subtitle}>Evolução mensal</span>
          </div>
          <div className={styles.chartValue}>
            <h3>R$ 920k</h3>
              <span className={`${styles.trend} ${styles.pos}`}>
                <Icon name="arrow-up" size={16} /> 14,8% <small>vs mês anterior</small>
              </span>
          </div>
          <div className={styles.chartWrapperElement}>
            <LineChart data={economiaPotencialData} strokeColor="#007d79" />
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