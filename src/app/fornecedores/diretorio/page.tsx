"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon, Select } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedores.module.css";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";

interface FornecedorRow {
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

const SEGMENT_ICON_MAP: Record<string, string> = {
  "Serviços": "briefcase-01",
  "Combustíveis": "drop",
  "TI": "monitor-01",
  "MRO": "tool-01",
  "Matérias-Primas": "box",
  "Logística": "truck-01",
};

function mapSupplierToRow(s: Supplier): FornecedorRow {
  const isActive = s.status === "Active";
  const score = s.performanceScore ? Number(s.performanceScore) : null;
  const stars = score ? Math.round(score / 2) : 0;

  return {
    id: s.id,
    iniciais: s.tradeName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    nome: s.tradeName,
    cnpj: s.cnpj,
    categoria: s.segment,
    catIcon: SEGMENT_ICON_MAP[s.segment] || "briefcase-01",
    status: isActive ? "Homologado" : s.status === "UnderCertification" ? "Em homologação" : "Inativo",
    statusSub: s.createdAt ? `desde ${new Date(s.createdAt).toLocaleDateString("pt-BR")}` : "",
    nota: score ? score.toFixed(1).replace(".", ",") : "-",
    estrelas: stars,
    avaliacao: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("pt-BR") : "-",
    avaliacaoSub: s.updatedAt
      ? (() => {
          const days = Math.floor((Date.now() - new Date(s.updatedAt).getTime()) / 86400000);
          return days === 0 ? "hoje" : `há ${days} dia(s)`;
        })()
      : "Ainda sem avaliação",
    cor: isActive ? "green" : "orange",
  };
}

export default function FornecedoresListPage() {
  const router = useRouter();

  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [suppliers, kpisData] = await Promise.all([
          suppliersApi.list(),
          suppliersApi.getKpis(),
        ]);
        setFornecedores(suppliers.map(mapSupplierToRow));
        setKpis(kpisData);
      } catch (err) {
        console.error("Erro ao carregar fornecedores:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoriasOptions = [
    { label: "Todas as categorias", value: "Todas" },
    ...Array.from(new Set(fornecedores.map((f) => f.categoria)))
      .filter(Boolean)
      .map((c) => ({ label: c, value: c })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Homologado", value: "Homologado" },
    { label: "Em homologação", value: "Em homologação" },
  ];

  const filtered = fornecedores.filter((f) => {
    if (categoria !== "Todas" && f.categoria !== categoria) return false;
    if (status !== "Todos" && f.status !== status) return false;
    return true;
  });

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

  const columns: ColumnDef<FornecedorRow>[] = [
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
          <Icon name={row.catIcon} />
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
          <Button variant="primary" className={styles.btnAdd} onClick={() => router.push("/fornecedores/novo")}>
            <Icon name="plus" /> Adicionar fornecedor
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Fornecedores homologados" value={loading ? "..." : String(kpis?.active || 0)} icon="users-01" description="Ativos" />
        <KpiCard title="Em homologação" value={loading ? "..." : String(kpis?.underCertification || 0)} icon="clock" description="Pendente" />
        <KpiCard title="Nota média de performance" value={loading ? "..." : (kpis?.avgPerformanceScore || "-")} icon="star-01" description="Entre homologados" />
        <KpiCard title="Categorias cobertas" value={loading ? "..." : String(kpis?.segmentCount || 0)} icon="shield-01" />
      </div>

      <Card noPadding className={styles.mainListCard}>
        
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input type="text" placeholder="Buscar fornecedor..." />
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
              options={statusOptions}
              value={status}
              onChange={setStatus}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} onRowClick={(row) => router.push(`/fornecedores/${row.id}`)} />

        <div className={styles.tableFooter}>
          <span>Mostrando {filtered.length} de {fornecedores.length} fornecedores</span>
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
