"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, Select, TableSkeleton } from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./homologacao.module.css";
import { getStatusBadgeVariant } from "@/lib/constants/status";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryCompanyOptions, getBranchCompanyOptions } from "@/lib/utils/tenant";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { logError } from "@/lib/utils/error";

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

function mapSupplierToHomologacao(s: Supplier): HomologacaoRow {
  const scoreVal = s.performanceScore ? Math.round(Number(s.performanceScore) * 10) : 85;
  const isHomologado = s.status === "Active";
  const isUnderCert = s.status === "UnderCertification";
  const statusStr = isHomologado ? "Homologado" : isUnderCert ? "Em análise" : "Pendente";
  const etapaStr = isHomologado ? "Homologação Concluída" : isUnderCert ? "Análise de dados públicos" : "Aguardando documentos";

  const updatedDate = s.updatedAt ? new Date(s.updatedAt) : s.createdAt ? new Date(s.createdAt) : new Date();

  return {
    id: s.id,
    iniciais: (s.tradeName || s.corporateName).split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "FR",
    fornecedor: s.corporateName || s.tradeName,
    cnpj: s.cnpj,
    categoria: s.segment || "Geral",
    catIcon: getCategoryIcon(s.segment),
    score: scoreVal,
    etapa: etapaStr,
    status: statusStr,
    statusVariant: isHomologado ? "success" : isUnderCert ? "primary" : "warning",
    atualizacao: updatedDate.toLocaleDateString("pt-BR"),
    tempoAtras: updatedDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

const categoriasOptions = [
  { label: "Categoria: Todas", value: "Todas" },
  { label: "Serviços", value: "Serviços" },
  { label: "Combustíveis", value: "Combustíveis" },
  { label: "TI & Software", value: "TI & Software" },
  { label: "MRO & Manutenção", value: "MRO & Manutenção" },
  { label: "Logística", value: "Logística" },
  { label: "Matérias-Primas", value: "Matérias-Primas" },
  { label: "Geral", value: "Geral" },
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
  { label: "Aguardando documentos", value: "Aguardando documentos" },
  { label: "Homologação Concluída", value: "Homologação Concluída" },
];

export default function HomologacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fornecedores, setFornecedores] = useState<HomologacaoRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);

  const [categoria, setCategoria] = useState("Todas");
  const [risco, setRisco] = useState("Todas");
  const [etapa, setEtapa] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const primaryCompanies = getPrimaryCompanyOptions(user);
  const [selectedPrimaryCompanyId, setSelectedPrimaryCompanyId] = useState<string>("TODAS");
  const branchCompanies = getBranchCompanyOptions(user, selectedPrimaryCompanyId);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TODAS");

  const queryTenantId = React.useMemo(() => {
    if (selectedBranchId !== "TODAS") return selectedBranchId;
    if (selectedPrimaryCompanyId !== "TODAS") return selectedPrimaryCompanyId;
    return undefined;
  }, [selectedPrimaryCompanyId, selectedBranchId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [suppliersList, kpisData] = await Promise.all([
        suppliersApi.list(queryTenantId).catch(() => []),
        suppliersApi.getKpis(queryTenantId).catch(() => null),
      ]);
      setFornecedores((suppliersList || []).map(mapSupplierToHomologacao));
      setKpis(kpisData);
    } catch (err) {
      logError("fornecedores/homologacao/fetchData", err);
    } finally {
      setLoading(false);
    }
  }, [queryTenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <Icon name={row.catIcon || "briefcase-01"} />
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
      cell: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
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

  const filtered = fornecedores.filter((f) => {
    if (categoria !== "Todas" && f.categoria !== categoria) return false;
    if (risco !== "Todas") {
      if (risco === "Baixo" && f.score <= 70) return false;
      if (risco === "Médio" && (f.score <= 30 || f.score > 70)) return false;
      if (risco === "Alto" && f.score > 30) return false;
    }
    if (etapa !== "Todas" && f.etapa !== etapa) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      if (!f.fornecedor.toLowerCase().includes(q) && !f.cnpj.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Homologação de Fornecedores</h1>
          <p>Acompanhe o gerenciamento e o progresso de homologação de novos fornecedores.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Total cadastrados" value={String(kpis?.total ?? fornecedores.length)} icon="file-02" description="Total Geral" loading={loading} />
        <KpiCard title="Em homologação" value={String(kpis?.underCertification ?? fornecedores.filter((f) => f.status === "Em análise").length)} icon="search-md" description="Processando" loading={loading} />
        <KpiCard title="Homologados" value={String(kpis?.active ?? fornecedores.filter((f) => f.status === "Homologado").length)} icon="check-circle" description="Ativos" loading={loading} />
        <KpiCard title="Score Médio" value={kpis?.avgPerformanceScore ? `${kpis.avgPerformanceScore}/10` : "—"} icon="star-01" description="Nota Geral" loading={loading} />
      </div>

      <Card noPadding className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input
              type="text"
              placeholder="Buscar fornecedor, CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : (
          <DataTable 
            columns={colunas} 
            data={filtered} 
            onRowClick={(row) => router.push(`/fornecedores/homologacao/${row.id}`)} 
          />
        )}

        <div className={styles.tableFooter}>
          <span>Mostrando {filtered.length} de {fornecedores.length} fornecedor(es)</span>
        </div>
      </Card>
    </div>
  );
}
