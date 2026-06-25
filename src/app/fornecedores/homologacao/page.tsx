"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, Select } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./homologacao.module.css";

interface HomologacaoRow {
  id: string;
  iniciais: string;
  fornecedor: string;
  cnpj: string;
  categoria: string;
  catIcon: string;
  score: number;
  etapa: string;
  status: string;
  statusVariant: "primary" | "warning" | "success" | "danger";
  atualizacao: string;
  tempoAtras: string;
}

export default function HomologacaoPage() {
  const router = useRouter();

  const [categoria, setCategoria] = React.useState("Todas");
  const [risco, setRisco] = React.useState("Todas");
  const [etapa, setEtapa] = React.useState("Todas");

  const categoriasOptions = [
    { label: "Categoria: Todas", value: "Todas" },
    { label: "Combustíveis", value: "Combustíveis" },
    { label: "Logística", value: "Logística" },
    { label: "MRO", value: "MRO" },
    { label: "Energia", value: "Energia" },
    { label: "Serviços", value: "Serviços" },
    { label: "TI", value: "TI" },
  ];

  const riscosOptions = [
    { label: "Risco: Todas", value: "Todas" },
    { label: "Baixo", value: "Baixo" },
    { label: "Médio", value: "Médio" },
    { label: "Alto", value: "Alto" },
  ];

  const etapasOptions = [
    { label: "Etapa: Todas", value: "Todas" },
    { label: "Análise de dados públicos", value: "Análise de dados públicos" },
    { label: "Fluxo de Assinatura", value: "Fluxo de Assinatura" },
    { label: "Aguardando documentos", value: "Aguardando documentos" },
    { label: "Análise jurídica", value: "Análise jurídica" },
  ];

  const catIconMap: Record<string, string> = {
    local_gas_station: "settings-01",
    local_shipping: "truck-01",
    build: "tool-01",
    bolt: "zap",
    settings: "settings-01",
    content_paste: "clipboard",
    computer: "monitor-01",
    room_service: "bell-01",
  };

  const dados: HomologacaoRow[] = [
    { id: "1", iniciais: "FB", fornecedor: "Fornecedor Bravo LTDA", cnpj: "22.333.444/0001-82", categoria: "Combustíveis", catIcon: "local_gas_station", score: 18, etapa: "Análise de dados públicos", status: "Em análise", statusVariant: "primary", atualizacao: "22/05/2024", tempoAtras: "14:32" },
    { id: "2", iniciais: "TA", fornecedor: "Transportadora Alfa S.A.", cnpj: "44.555.666/0001-90", categoria: "Logística", catIcon: "local_shipping", score: 92, etapa: "Fluxo de Assinatura", status: "Pendente", statusVariant: "warning", atualizacao: "22/05/2024", tempoAtras: "11:15" },
    { id: "3", iniciais: "SI", fornecedor: "Supply Industrial LTDA", cnpj: "11.222.333/0001-44", categoria: "MRO", catIcon: "build", score: 72, etapa: "Aguardando documentos", status: "Aguardando docs.", statusVariant: "primary", atualizacao: "21/05/2024", tempoAtras: "16:08" },
    { id: "4", iniciais: "EC", fornecedor: "Economy Construções S.A.", cnpj: "55.444.333/0001-77", categoria: "Energia", catIcon: "bolt", score: 12, etapa: "Análise de dados públicos", status: "Em análise", statusVariant: "primary", atualizacao: "20/05/2024", tempoAtras: "09:47" },
    { id: "5", iniciais: "MC", fornecedor: "Metal Componentes LTDA", cnpj: "88.777.999/0001-22", categoria: "MRO", catIcon: "settings", score: 85, etapa: "Análise jurídica", status: "Em análise", statusVariant: "primary", atualizacao: "20/05/2024", tempoAtras: "08:30" },
    { id: "6", iniciais: "QL", fornecedor: "Quality Services LTDA", cnpj: "66.777.888/0001-00", categoria: "Serviços", catIcon: "content_paste", score: 45, etapa: "Aguardando documentos", status: "Pendente", statusVariant: "warning", atualizacao: "19/05/2024", tempoAtras: "17:22" },
    { id: "7", iniciais: "PR", fornecedor: "Prime Solutions S.A.", cnpj: "77.888.999/0001-31", categoria: "TI", catIcon: "computer", score: 25, etapa: "Análise jurídica", status: "Homologado", statusVariant: "success", atualizacao: "18/05/2024", tempoAtras: "10:11" },
    { id: "8", iniciais: "GS", fornecedor: "Global Service Group LTDA", cnpj: "99.888.222/0001-55", categoria: "Serviços", catIcon: "room_service", score: 81, etapa: "Análise de dados públicos", status: "Rejeitado", statusVariant: "danger", atualizacao: "17/05/2024", tempoAtras: "15:55" },
  ];

  const colunas: ColumnDef<HomologacaoRow>[] = [
    {
      header: "Fornecedor",
      cell: (row) => (
        <div className={styles.fornecedorCell}>
          <div className={styles.avatar}>{row.iniciais}</div>
          <div className={styles.doubleText}>
            <strong>{row.fornecedor}</strong>
            <span>{row.cnpj}</span>
          </div>
        </div>
      )
    },
    {
      header: "Categoria",
      cell: (row) => (
        <div className={styles.iconTextCell}>
          <Icon name={catIconMap[row.catIcon] || "briefcase-01"} />
          {row.categoria}
        </div>
      )
    },
    {
      header: "Score de Risco",
      cell: (row) => (
        <div className={styles.scoreCell}>
          <div className={styles.scoreInfo}>
            <strong>{row.score}/100</strong>
            <span className={row.score > 70 ? styles.textHigh : row.score > 30 ? styles.textMid : styles.textLow}>
              {row.score > 70 ? "Baixo" : row.score > 30 ? "Médio" : "Crítico"}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${row.score}%`, 
                backgroundColor: row.score > 70 ? "#16a34a" : row.score > 30 ? "#ca8a04" : "#dc2626" 
              }} 
            />
          </div>
        </div>
      )
    },
    {
      header: "Etapa Atual",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong>{row.etapa}</strong>
          <span className={styles.linkText}>Ver detalhes</span>
        </div>
      )
    },
    {
      header: "Status",
      cell: (row) => <Badge variant={row.statusVariant}>{row.status}</Badge>
    },
    {
      header: "Última Atualização",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong>{row.atualizacao}</strong>
          <span>há {row.tempoAtras}</span>
        </div>
      )
    },
    {
      header: "",
      width: "40px",
      cell: () => <Icon name="dots-vertical" className={styles.moreIcon} />
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Homologação de Fornecedores</h1>
          <p>Acompanhe o gerenciamento e o progresso de homologação de novos fornecedores.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Total solicitações" value="128" icon="file-02" description="Total Geral" />
        <KpiCard title="Em análise" value="24" icon="search-md" description="Processando" />
        <KpiCard title="Pendências" value="8" icon="clock" description="Necessita ação" />
        <KpiCard title="Aguardando docs." value="14" icon="file-01" description="Pendente parceiro" />
        <KpiCard title="Homologados" value="56" icon="check-circle" description="Sucesso" />
        <KpiCard title="Rejeitados" value="18" icon="x-circle" description="Recusados" />
      </div>

      <Card noPadding className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input type="text" placeholder="Buscar fornecedor, CNPJ..." />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={categoriasOptions}
              value={categoria}
              onChange={setCategoria}
              icon="filter-lines"
              className={styles.customSelectFilter}
            />
            <Select
              options={riscosOptions}
              value={risco}
              onChange={setRisco}
              className={styles.customSelectFilter}
            />
            <Select
              options={etapasOptions}
              value={etapa}
              onChange={setEtapa}
              className={styles.customSelectFilter}
            />
            <button className={styles.btnMoreFilters}>
              <Icon name="filter-lines" /> Mais filtros
            </button>
          </div>
        </div>

        <DataTable 
          columns={colunas} 
          data={dados} 
          onRowClick={(row) => router.push(`/fornecedores/homologacao/${row.id}`)} 
        />

        <div className={styles.tableFooter}>
          <span>Mostrando 1 a 8 de 128 fornecedores</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn}><Icon name="chevron-left" /></button>
            <button className={styles.pageBtn}>1</button>
            <button className={`${styles.pageBtn} ${styles.pageActive}`}>2</button>
            <button className={styles.pageBtn}>3</button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: '#64748b' }}>...</span>
            <button className={styles.pageBtn}>16</button>
            <button className={styles.pageBtn}><Icon name="chevron-right" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
