"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon, Select, ErrorState, TableSkeleton } from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedores.module.css";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";
import { getErrorMessage, logError } from "@/lib/utils/error";

import { useAuth } from "@/hooks/useAuth";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser } from "@/lib/utils/tenant";
import { User } from "@/types/auth";

interface FornecedorRow {
  id: string;
  iniciais: string;
  nome: string;
  cnpj: string;
  cidade: string;
  estado: string;
  localizacao: string;
  localizacaoSub: string;
  contatoNome: string;
  contatoInfo: string;
  status: string;
  statusSub: string;
  cor: "green" | "orange";
  nota: string;
  estrelas: number;
  integrationCode: string;
}

function mapSupplierToRow(s: Supplier, _currentUser?: User | null): FornecedorRow {
  const isHomologado = s.status === "Active" || s.isActive === true;

  const rawScore = s.performanceScore !== undefined && s.performanceScore !== null ? Number(s.performanceScore) : 9.5;
  const nota = rawScore > 0 ? rawScore.toFixed(1).replace(".", ",") : "-";
  const estrelas = rawScore > 0 ? Math.min(5, Math.max(1, Math.round(rawScore / 2))) : 5;

  const cidade = s.city || "—";
  const estado = s.state || "";
  const localizacao = cidade !== "—" ? `${cidade}${estado ? ` / ${estado}` : ""}` : "Não informado";
  const localizacaoSub = s.neighborhood || s.address || "";

  const contatoNome = s.contactName || "Comercial";
  const contatoInfo = s.contactPhone || s.contactEmail || "Sem telefone";

  return {
    id: s.id,
    iniciais: (s.corporateName || s.tradeName || "FR").substring(0, 2).toUpperCase(),
    nome: s.corporateName || s.tradeName || "Fornecedor",
    cnpj: s.cnpj,
    cidade,
    estado,
    localizacao,
    localizacaoSub,
    contatoNome,
    contatoInfo,
    status: isHomologado ? "Homologado" : "Em homologação",
    statusSub: isHomologado ? "Ativo no ERP" : "Pendente",
    cor: isHomologado ? "green" : "orange",
    nota,
    estrelas,
    integrationCode: s.integrationCode || "—",
  };
}

export default function FornecedoresListPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedUf, setSelectedUf] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [suppliers, kpisData] = await Promise.all([
        suppliersApi.list(queryTenantId).catch(() => []),
        suppliersApi.getKpis(queryTenantId).catch(() => null),
      ]);
      setFornecedores((suppliers || []).map((s) => mapSupplierToRow(s, user)));
      setKpis(kpisData);
    } catch (err) {
      logError("fornecedores/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [queryTenantId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ufOptions = [
    { label: "Todas as UF", value: "Todas" },
    ...Array.from(new Set(fornecedores.map((f) => f.estado)))
      .filter(Boolean)
      .sort()
      .map((uf) => ({ label: `Estado: ${uf}`, value: uf })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Homologado", value: "Homologado" },
    { label: "Em homologação", value: "Em homologação" },
  ];

  const filtered = fornecedores.filter((f) => {
    if (selectedUf !== "Todas" && f.estado !== selectedUf) return false;
    if (status !== "Todos" && f.status !== status) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchNome = f.nome.toLowerCase().includes(q);
      const matchCnpj = f.cnpj.includes(q);
      const matchLoc = f.localizacao.toLowerCase().includes(q);
      const matchContato = f.contatoNome.toLowerCase().includes(q) || f.contatoInfo.toLowerCase().includes(q);
      const matchErp = f.integrationCode.toLowerCase().includes(q);
      if (!matchNome && !matchCnpj && !matchLoc && !matchContato && !matchErp) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <div className={`${styles.avatar} ${row.cor === "green" ? styles.avatarGreen : styles.avatarOrange}`}>
            {row.iniciais}
          </div>
          <div className={styles.doubleText}>
            <strong>{row.nome}</strong>
            <span>CNPJ {row.cnpj} {row.integrationCode !== "—" ? `• Cód. ERP: ${row.integrationCode}` : ""}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Localização / Praça",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="marker-pin-01" size={14} style={{ color: "#0284c7" }} />
            {row.localizacao}
          </strong>
          {row.localizacaoSub && <span style={{ fontSize: 11, color: "#64748b" }}>{row.localizacaoSub}</span>}
        </div>
      ),
    },
    {
      header: "Contato Principal",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="user-01" size={14} style={{ color: "#475569" }} />
            {row.contatoNome}
          </strong>
          <span style={{ fontSize: 11, color: "#64748b" }}>{row.contatoInfo}</span>
        </div>
      ),
    },
    {
      header: "Homologação",
      cell: (row) => (
        <div className={styles.doubleText}>
          <span className={`${styles.statusBadge} ${row.status === "Homologado" ? styles.badgeGreen : styles.badgeYellow}`}>
            {row.status}
          </span>
          <span>{row.statusSub}</span>
        </div>
      ),
    },
    {
      header: "Nota de Performance",
      cell: (row) => (
        <div className={styles.notaCell}>
          <strong className={row.nota !== "-" ? styles.textGreen : ""}>{row.nota}</strong>
          {renderStars(row.estrelas)}
          {row.nota === "-" && <span className={styles.mutedText}>Ainda sem avaliação</span>}
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

  return (
    <div className={styles.pageContainer}>
      
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Base de Fornecedores</h1>
          <p>Consulte parceiros homologados, localização, contatos e nível de performance.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => router.push("/fornecedores/homologacao")}>
            <Icon name="shield-tick" size={16} /> Painel de Homologação
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Fornecedores homologados"
          value={String(kpis?.active || fornecedores.filter((f) => f.status === "Homologado").length)}
          icon="check-circle"
          description="Ativos no ERP"
          loading={loading}
        />
        <KpiCard
          title="Em homologação"
          value={String(kpis?.underCertification || fornecedores.filter((f) => f.status === "Em homologação").length)}
          icon="clock"
          description="Pendente"
          loading={loading}
        />
        <KpiCard
          title="Nota média de performance"
          value={kpis?.avgPerformanceScore || "9.5"}
          icon="star-01"
          description="Excelente"
          loading={loading}
        />
        <KpiCard
          title="Cobertura no ERP"
          value={String(kpis?.total || fornecedores.length)}
          icon="shield-tick"
          description="Fornecedores cadastrados"
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
              placeholder="Buscar por Fornecedor, CNPJ, Cód. ERP ou Cidade..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                  setCurrentPage(1);
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
                onChange={(val) => {
                  setSelectedBranchId(val);
                  setCurrentPage(1);
                }}
                icon="building-07"
                className={styles.customSelectFilter}
              />
            )}

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

            <Select
              options={statusOptions}
              value={status}
              onChange={(val) => {
                setStatus(val);
                setCurrentPage(1);
              }}
              className={styles.customSelectFilter}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            <DataTable
              data={paginatedData}
              columns={columns}
              onRowClick={(row) => router.push(`/fornecedores/${row.id}`)}
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
                >
                  <Icon name="chevron-left" />
                </button>
                <button className={`${styles.pageBtn} ${styles.pageActive}`}>
                  {currentPage}
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={styles.pageBtn}
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
