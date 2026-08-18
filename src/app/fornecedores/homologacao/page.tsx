"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Icon, Select, Loading, ErrorState, TableSkeleton, Badge } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./homologacao.module.css";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { getStatusBadgeVariant } from "@/lib/constants/status";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser } from "@/lib/utils/tenant";

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
  statusVariant: "success" | "primary" | "warning";
  atualizacao: string;
  tempoAtras: string;
}

function mapSupplierToHomologacao(s: Supplier): HomologacaoRow {
  const rawScore = s.performanceScore ? Math.round(Number(s.performanceScore) * 10) : 85;
  const isHomologado = s.status === "Active" || s.isActive === true;
  const isUnderCert = s.status === "UnderCertification";
  const statusStr = isHomologado ? "Homologado" : isUnderCert ? "Em análise" : "Pendente";
  const etapaStr = isHomologado ? "Homologação Concluída" : isUnderCert ? "Análise de dados públicos" : "Auditoria Cadastral";

  const updatedDate = s.updatedAt ? new Date(s.updatedAt) : s.createdAt ? new Date(s.createdAt) : new Date();

  return {
    id: s.id,
    iniciais: (s.tradeName || s.corporateName || "FR").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    fornecedor: s.corporateName || s.tradeName || "Fornecedor",
    cnpj: s.cnpj,
    categoria: s.segment || "Geral",
    catIcon: getCategoryIcon((s.segment || "Geral") as any),
    score: rawScore,
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
  { label: "Crítico", value: "Crítico" },
];

const etapasOptions = [
  { label: "Etapa: Todas", value: "Todas" },
  { label: "Homologação Concluída", value: "Homologação Concluída" },
  { label: "Análise de dados públicos", value: "Análise de dados públicos" },
  { label: "Auditoria Cadastral", value: "Auditoria Cadastral" },
];

export default function HomologacaoPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categoria, setCategoria] = useState("Todas");
  const [risco, setRisco] = useState("Todas");
  const [etapa, setEtapa] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const primaryCompanies = getPrimaryCompanyOptions(user);
  const showPrimaryCompanyFilter = primaryCompanies.length > 1 || isVnmbUser(user);

  const [selectedPrimaryCompanyId, setSelectedPrimaryCompanyId] = useState<string>("TODAS");
  const branchCompanies = getBranchCompanyOptions(user, selectedPrimaryCompanyId);
  const showBranchFilter = branchCompanies.length > 0;
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TODAS");

  const queryTenantId = React.useMemo(() => {
    if (selectedBranchId !== "TODAS") return selectedBranchId;
    if (selectedPrimaryCompanyId !== "TODAS") return selectedPrimaryCompanyId;
    return undefined;
  }, [selectedPrimaryCompanyId, selectedBranchId]);

  const [fornecedores, setFornecedores] = useState<HomologacaoRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [suppliers, kpisData] = await Promise.all([
        suppliersApi.list(queryTenantId).catch(() => []),
        suppliersApi.getKpis(queryTenantId).catch(() => null),
      ]);
      setFornecedores((suppliers || []).map(mapSupplierToHomologacao));
      setKpis(kpisData);
    } catch (err) {
      logError("homologacao/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [queryTenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<HomologacaoRow>[] = [
    {
      header: "Fornecedor",
      cell: (row) => (
        <div className={styles.fornecedorCell}>
          <div className={styles.avatar}>{row.iniciais}</div>
          <div className={styles.doubleText}>
            <strong>{row.fornecedor}</strong>
            <span>CNPJ {row.cnpj}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Categoria",
      cell: (row) => (
        <div className={styles.iconTextCell}>
          <Icon name={row.catIcon || "briefcase-01"} />
          {row.categoria}
        </div>
      ),
    },
    {
      header: "Score de Risco",
      cell: (row) => (
        <div className={styles.scoreCell}>
          <div className={styles.scoreInfo}>
            <strong>{row.score}/100</strong>
            <span className={row.score > 70 ? styles.textHigh : row.score > 30 ? styles.textMid : styles.textLow}>
              {row.score > 70 ? "Baixo Risco" : row.score > 30 ? "Médio" : "Crítico"}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressBar} ${
                row.score > 70
                  ? styles.barHigh
                  : row.score > 30
                  ? styles.barMid
                  : styles.barLow
              }`}
              style={{ width: `${row.score}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Etapa Atual",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong>{row.etapa}</strong>
          <span className={styles.linkText}>Ver detalhes</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>,
    },
    {
      header: "Última Atualização",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong>{row.atualizacao}</strong>
          <span>às {row.tempoAtras}</span>
        </div>
      ),
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
      ),
    },
  ];

  const filtered = fornecedores.filter((f) => {
    if (categoria !== "Todas" && f.categoria !== categoria) return false;
    if (risco !== "Todas") {
      if (risco === "Baixo" && f.score <= 70) return false;
      if (risco === "Médio" && (f.score <= 30 || f.score > 70)) return false;
      if (risco === "Crítico" && f.score > 30) return false;
    }
    if (etapa !== "Todas" && f.etapa !== etapa) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchNome = f.fornecedor.toLowerCase().includes(q);
      const matchCnpj = f.cnpj.includes(q);
      if (!matchNome && !matchCnpj) return false;
    }
    return true;
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Homologação de Fornecedores</h1>
          <p>Acompanhe o gerenciamento, compliance e auditoria pública de fornecedores.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total cadastrados"
          value={String(kpis?.total ?? fornecedores.length)}
          icon="file-02"
          description="Total Geral"
          loading={loading}
        />
        <KpiCard
          title="Em homologação"
          value={String(kpis?.underCertification ?? fornecedores.filter((f) => f.status === "Em análise").length)}
          icon="search-md"
          description="Processando"
          loading={loading}
        />
        <KpiCard
          title="Homologados"
          value={String(kpis?.active ?? fornecedores.filter((f) => f.status === "Homologado").length)}
          icon="check-circle"
          description="Ativos"
          loading={loading}
        />
        <KpiCard
          title="Score Médio"
          value={kpis?.avgPerformanceScore ? `${kpis.avgPerformanceScore}/10` : "9,5/10"}
          icon="star-01"
          description="Nota Geral"
          loading={loading}
        />
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
            {showPrimaryCompanyFilter && (
              <Select
                options={[
                  { label: "Empresas: Todas", value: "TODAS" },
                  ...primaryCompanies.map((c) => ({ label: c.name, value: c.id })),
                ]}
                value={selectedPrimaryCompanyId}
                onChange={(val) => {
                  setSelectedPrimaryCompanyId(val);
                  setSelectedBranchId("TODAS");
                }}
                icon="building-07"
                className={styles.customSelectFilter}
              />
            )}

            {showBranchFilter && (
              <Select
                options={[
                  { label: "Filiais: Todas", value: "TODAS" },
                  ...branchCompanies.map((c) => ({ label: c.name, value: c.id })),
                ]}
                value={selectedBranchId}
                onChange={setSelectedBranchId}
                icon="building-07"
                className={styles.customSelectFilter}
              />
            )}

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

        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : (
          <>
            <DataTable
              data={filtered}
              columns={columns}
              onRowClick={(row) => router.push(`/fornecedores/homologacao/${row.id}`)}
            />

            <div className={styles.tableFooter}>
              <span>Mostrando {filtered.length} de {fornecedores.length} fornecedores</span>
              <div className={styles.paginationControls}>
                <button className={styles.pageBtn}><Icon name="chevron-left" /></button>
                <button className={`${styles.pageBtn} ${styles.pageActive}`}>1</button>
                <button className={styles.pageBtn}><Icon name="chevron-right" /></button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
