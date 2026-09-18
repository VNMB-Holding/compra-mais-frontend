"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Icon, Select, ErrorState, TableSkeleton, Badge, DataTable, ColumnDef, KpiCard } from "@/components/ui";
import styles from "./homologacao.module.css";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";
import { getErrorMessage, logError } from "@/lib/utils/error";
import { getStatusBadgeVariant } from "@/lib/constants/status";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
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
  const statusStr = isHomologado ? "Conforme" : isUnderCert ? "Em Auditoria" : "Apontamento";
  const etapaStr = isHomologado ? "Monitoramento Ativo" : isUnderCert ? "Varredura Periódica" : "Apontamento Fiscal";

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

export default function HomologacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedUf, setSelectedUf] = useState("Todas");
  const [risco, setRisco] = useState("Todos");
  const [etapa, setEtapa] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const [fornecedores, setFornecedores] = useState<HomologacaoRow[]>([]);
  const [allUfs, setAllUfs] = useState<string[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    suppliersApi
      .list()
      .then((data) => {
        if (!isMounted || !data) return;
        const ufs = data.map((s) => s.state?.toUpperCase().trim() || "").filter(Boolean);
        if (ufs.length > 0) setAllUfs((prev) => Array.from(new Set([...prev, ...ufs])).sort());
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const statusMap: Record<string, string> = {
        "Conforme": "Active",
        "Em Auditoria": "UnderCertification",
        "Apontamento": "Inactive",
      };
      const [suppliers, kpisData] = await Promise.all([
        suppliersApi.list({
          status: etapa !== "Todas" && etapa !== "Todos" ? (statusMap[etapa] || etapa) : undefined,
          state: selectedUf !== "Todas" && selectedUf !== "Todos" ? selectedUf : undefined,
          search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
        }),
        suppliersApi.getKpis(),
      ]);
      const rows = (suppliers || []).map(mapSupplierToHomologacao);
      setFornecedores(rows);
      setKpis(kpisData);

      const currentUfs = rows.map((f) => f.estado?.toUpperCase().trim()).filter(Boolean);
      if (currentUfs.length > 0) {
        setAllUfs((prev) => Array.from(new Set([...prev, ...currentUfs])).sort());
      }
    } catch (err) {
      logError("homologacao/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [etapa, selectedUf, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const etapaOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Conforme", value: "Conforme" },
    { label: "Em Auditoria", value: "Em Auditoria" },
    { label: "Apontamento", value: "Apontamento" },
  ];

  const ufOptions = React.useMemo(() => [
    { label: "Estado: Todos (UF)", value: "Todas" },
    ...Array.from(new Set([...allUfs, ...fornecedores.map((f) => f.estado?.toUpperCase().trim())]))
      .filter(Boolean)
      .sort()
      .map((uf) => ({ label: `UF: ${uf}`, value: uf })),
  ], [allUfs, fornecedores]);

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
      cell: (row) => (
        <div className={styles.actionCell} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.iconBtn}
            title="Copiar link do dossiê"
            onClick={() => {
              if (typeof window !== "undefined") {
                const url = `${window.location.origin}/fornecedores/homologacao/${row.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  toast({
                    variant: "success",
                    title: "Link Copiado!",
                    message: `Link do dossiê de ${row.fornecedor} copiado para a área de transferência.`,
                  });
                }).catch(() => {
                  toast({
                    variant: "info",
                    title: "Dossiê",
                    message: url,
                  });
                });
              }
            }}
          >
            <Icon name="share-03" />
          </button>
        </div>
      ),
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = fornecedores.filter((f) => {
    if (selectedUf !== "Todas" && selectedUf !== "Todos" && f.estado !== selectedUf) return false;
    if (risco !== "Todas" && risco !== "Todos") {
      if (risco === "Baixo" && f.score <= 70) return false;
      if (risco === "Médio" && (f.score <= 30 || f.score > 70)) return false;
      if (risco === "Crítico" && f.score > 30) return false;
    }
    if (etapa !== "Todas" && etapa !== "Todos" && f.status !== etapa && f.etapa !== etapa) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchNome = f.fornecedor.toLowerCase().includes(q);
      const matchCnpj = f.cnpj.includes(q);
      const matchLoc = f.localizacao.toLowerCase().includes(q);
      if (!matchNome && !matchCnpj && !matchLoc) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Homologação & Compliance de Fornecedores</h1>
          <p>Varredura de risco e conformidade fiscal e trabalhista.</p>
        </div>
      </div>

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

      <Card className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-lg" />
            <input
              type="text"
              placeholder="Buscar por Fornecedor, CNPJ ou Cidade..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className={styles.filtersGroup}>
            <Select
              options={etapaOptions}
              value={etapa}
              onChange={(val) => {
                setEtapa(val);
                setCurrentPage(1);
              }}
              className={styles.customSelectFilter}
            />

            <Select
              options={[
                { label: "Risco: Todos", value: "Todos" },
                { label: "Baixo Risco", value: "Baixo" },
                { label: "Médio Risco", value: "Médio" },
                { label: "Crítico", value: "Crítico" },
              ]}
              value={risco}
              onChange={(val) => {
                setRisco(val);
                setCurrentPage(1);
              }}
              className={styles.customSelectFilter}
            />

            {ufOptions.length > 2 && (
              <Select
                options={ufOptions}
                value={selectedUf}
                onChange={(val) => {
                  setSelectedUf(val);
                  setCurrentPage(1);
                }}
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
          <>
            <DataTable
              data={paginatedData}
              columns={columns}
              onRowClick={(row) => router.push(`/fornecedores/homologacao/${row.id}`)}
            />

            <div className={styles.tableFooter}>
              <span>
                Mostrando {paginatedData.length} de {filtered.length} fornecedores
              </span>
              <div className={styles.paginationControls}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={styles.pageBtn}
                  style={{ opacity: currentPage <= 1 ? 0.5 : 1, cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
                >
                  <Icon name="chevron-left" />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", padding: "0 8px" }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={styles.pageBtn}
                  style={{ opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
                >
                  <Icon name="chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
