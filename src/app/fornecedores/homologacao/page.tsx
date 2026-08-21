"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Icon, Select, ErrorState, TableSkeleton, Badge } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./homologacao.module.css";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getStatusBadgeVariant } from "@/lib/constants/status";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser } from "@/lib/utils/tenant";

interface HomologacaoRow {
  id: string;
  iniciais: string;
  fornecedor: string;
  cnpj: string;
  cidade: string;
  estado: string;
  localizacao: string;
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
  const cidade = s.city || "—";
  const estado = s.state || "";
  const localizacao = cidade !== "—" ? `${cidade}${estado ? ` / ${estado}` : ""}` : "Não informado";

  return {
    id: s.id,
    iniciais: (s.tradeName || s.corporateName || "FR").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    fornecedor: s.corporateName || s.tradeName || "Fornecedor",
    cnpj: s.cnpj,
    cidade,
    estado,
    localizacao,
    score: rawScore,
    etapa: etapaStr,
    status: statusStr,
    statusVariant: isHomologado ? "success" : isUnderCert ? "primary" : "warning",
    atualizacao: updatedDate.toLocaleDateString("pt-BR"),
    tempoAtras: updatedDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

const riscosOptions = [
  { label: "Risco: Todos", value: "Todas" },
  { label: "Baixo Risco", value: "Baixo" },
  { label: "Médio Risco", value: "Médio" },
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

  const [selectedUf, setSelectedUf] = useState("Todas");
  const [risco, setRisco] = useState("Todas");
  const [etapa, setEtapa] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const [fornecedores, setFornecedores] = useState<HomologacaoRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [suppliers, kpisData] = await Promise.all([
        suppliersApi.list().catch(() => []),
        suppliersApi.getKpis().catch(() => null),
      ]);
      setFornecedores((suppliers || []).map(mapSupplierToHomologacao));
      setKpis(kpisData);
    } catch (err) {
      logError("homologacao/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const etapaOptions = [
    { label: "Status: Todos", value: "Todas" },
    { label: "Homologado", value: "Homologado" },
    { label: "Em análise", value: "Em análise" },
    { label: "Pendente", value: "Pendente" },
  ];

  const ufOptions = [
    { label: "Estado: Todos (UF)", value: "Todas" },
    ...Array.from(new Set(fornecedores.map((f) => f.estado)))
      .filter(Boolean)
      .sort()
      .map((uf) => ({ label: `UF: ${uf}`, value: uf })),
  ];


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
      header: "Localização",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="marker-pin-01" size={14} style={{ color: "#0284c7" }} />
            {row.localizacao}
          </strong>
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
          <span className={styles.linkText}>Ver conformidade</span>
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
    if (selectedUf !== "Todas" && f.estado !== selectedUf) return false;
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
      const matchLoc = f.localizacao.toLowerCase().includes(q);
      if (!matchNome && !matchCnpj && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className={styles.pageContainer}>
      
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Homologação & Compliance de Fornecedores</h1>
          <p>Acompanhe o nível de conformidade fiscal, certidões públicas e risco de parceiros.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total cadastrados"
          value={String(kpis?.total || fornecedores.length)}
          icon="users-01"
          description="Fornecedores no ERP"
          loading={loading}
        />
        <KpiCard
          title="Em homologação"
          value={String(kpis?.underCertification || fornecedores.filter((f) => f.status === "Em análise" || f.status === "Pendente").length)}
          icon="clock"
          description="Pendentes de análise"
          loading={loading}
        />
        <KpiCard
          title="Homologados"
          value={String(kpis?.active || fornecedores.filter((f) => f.status === "Homologado").length)}
          icon="check-circle"
          description="Aprovados / Regulares"
          loading={loading}
        />
        <KpiCard
          title="Score Médio de Compliance"
          value={`${kpis?.avgPerformanceScore || "9.5"} / 10`}
          icon="star-01"
          description="Nível Excelente"
          loading={loading}
        />
      </div>

      {/* Table Card */}
      <Card className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-lg" />
            <input
              type="text"
              placeholder="Buscar por Fornecedor, CNPJ ou Cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filtersGroup}>
            <Select
              options={etapaOptions}
              value={etapa}
              onChange={(val) => setEtapa(val)}
              className={styles.customSelectFilter}
            />

            <Select
              options={[
                { label: "Risco: Todos", value: "Todas" },
                { label: "Baixo Risco", value: "Baixo" },
                { label: "Médio Risco", value: "Médio" },
                { label: "Crítico", value: "Crítico" },
              ]}
              value={risco}
              onChange={(val) => setRisco(val)}
              className={styles.customSelectFilter}
            />

            {ufOptions.length > 2 && (
              <Select
                options={ufOptions}
                value={selectedUf}
                onChange={(val) => setSelectedUf(val)}
                icon="marker-pin-01"
                className={styles.customSelectFilter}
              />
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            onRowClick={(row) => router.push(`/fornecedores/homologacao/${row.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
