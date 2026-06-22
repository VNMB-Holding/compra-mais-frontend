"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedores.module.css";

interface Fornecedor {
  id: string;
  iniciais: string;
  nome: string;
  cnpj: string;
  categoria: string;
  catIcon: string;
  status: string;
  statusSub: string;
  nota: string;
  estrelas: number;
  avaliacao: string;
  avaliacaoSub: string;
  cor: "green" | "orange";
}

export default function FornecedoresListPage() {
  const router = useRouter();

  const catIconMap: Record<string, string> = {
    work: "briefcase-01",
    water_drop: "drop",
    desktop_windows: "monitor-01",
  };

  const fornecedores: Fornecedor[] = [
    { id: "1", iniciais: "FA", nome: "Fornecedor Alfa S.A.", cnpj: "11.111.111/0001-11", categoria: "Serviços", catIcon: "work", status: "Homologado", statusSub: "desde 12/05/2023", nota: "9,8", estrelas: 5, avaliacao: "28/04/2024", avaliacaoSub: "há 15 dias", cor: "green" },
    { id: "2", iniciais: "FB", nome: "Fornecedor Bravo LTDA", cnpj: "22.333.444/0001-82", categoria: "Combustíveis", catIcon: "water_drop", status: "Homologado", statusSub: "desde 18/08/2023", nota: "9,2", estrelas: 4, avaliacao: "22/04/2024", avaliacaoSub: "há 21 dias", cor: "green" },
    { id: "3", iniciais: "CT", nome: "Charlie Tech", cnpj: "33.555.666/0001-33", categoria: "TI", catIcon: "desktop_windows", status: "Em homologação", statusSub: "iniciado em 10/05/2024", nota: "-", estrelas: 0, avaliacao: "-", avaliacaoSub: "Ainda sem avaliação", cor: "orange" }
  ];

  const renderStars = (count: number) => {
    if (count === 0) return null;
    return (
      <div className={styles.starRow}>
        {[...Array(5)].map((_, i) => (
          <Icon key={i} name="star-01" className={i < count ? styles.starFilled : styles.starEmpty} />
        ))}
      </div>
    );
  };

  const columns: ColumnDef<Fornecedor>[] = [
    {
      header: "Fornecedor",
      cell: (row) => (
        <div className={styles.fornecedorCell}>
          <div className={`${styles.avatar} ${row.cor === 'green' ? styles.avatarGreen : styles.avatarOrange}`}>
            {row.iniciais}
          </div>
          <div className={styles.doubleText}>
            <strong>{row.nome}</strong>
            <span>CNPJ {row.cnpj}</span>
          </div>
        </div>
      )
    },
    {
      header: "Categoria",
      cell: (row) => (
        <div className={styles.catCell}>
          <Icon name={catIconMap[row.catIcon] || "briefcase-01"} />
          {row.categoria}
        </div>
      )
    },
    {
      header: "Homologação",
      cell: (row) => (
        <div className={styles.doubleText}>
          <span className={`${styles.statusBadge} ${row.status === 'Homologado' ? styles.badgeGreen : styles.badgeYellow}`}>
            {row.status}
          </span>
          <span>{row.statusSub}</span>
        </div>
      )
    },
    {
      header: "Nota de Performance",
      cell: (row) => (
        <div className={styles.notaCell}>
          <strong className={row.nota !== "-" ? styles.textGreen : ""}>{row.nota}</strong>
          {renderStars(row.estrelas)}
          {row.nota === "-" && <span className={styles.mutedText}>Ainda sem avaliação</span>}
        </div>
      )
    },
    {
      header: "Última Avaliação",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong className={styles.dataTitle}>{row.avaliacao}</strong>
          <span>{row.avaliacaoSub}</span>
        </div>
      )
    },
    {
      header: "",
      width: "40px",
      cell: () => (
        <div className={styles.actionCell}>
          <button className={styles.iconBtn}>
                <Icon name="share-03" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.pageContainer}>
      
      <div className={styles.pageHeader}>
        <div>
          <h1>Base de Fornecedores</h1>
          <p>Consulte parceiros homologados e verifique o nível de performance atual.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport}><Icon name="download-01" /> Exportar</button>
          <Button variant="primary" className={styles.btnAdd}><Icon name="plus" /> Adicionar fornecedor</Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Fornecedores homologados" value="2" icon="groups" description="Ativos" />
        <KpiCard title="Em homologação" value="1" icon="schedule" description="Pendente" />
        <KpiCard title="Nota média de performance" value="9,5" icon="star_rate" description="Entre homologados" />
        <KpiCard title="Categorias cobertas" value="3" icon="shield" description="Serviços, Combustíveis, TI" />
      </div>

      <Card noPadding className={styles.mainListCard}>
        
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input type="text" placeholder="Buscar fornecedor..." />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.selectWrapper}>
              <Icon name="filter-lines" />
              <select defaultValue="Todas"><option value="Todas">Todas as categorias</option></select>
            </div>
            <div className={styles.selectWrapper}>
              <select defaultValue="Todos"><option value="Todos">Status: Todos</option></select>
            </div>
          </div>
        </div>

        <DataTable data={fornecedores} columns={columns} onRowClick={(row) => router.push(`/fornecedores/${row.id}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando 1 a 3 de 3 fornecedores</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn}><Icon name="chevron-left" /></button>
            <button className={`${styles.pageBtn} ${styles.pageActive}`}>1</button>
            <button className={styles.pageBtn}><Icon name="chevron-right" /></button>
          </div>
        </div>

      </Card>
    </div>
  );
}
