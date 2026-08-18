"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon, Select, Loading, ErrorState, TableSkeleton } from "@/components/ui";

import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedores.module.css";
import { suppliersApi, Supplier, SupplierKpis } from "@/lib/api/suppliers";
import { getCategoryIcon } from "@/lib/utils/category-icon";
import { getErrorMessage, logError } from "@/lib/utils/error";

import { useAuth } from "@/hooks/useAuth";
import { getPrimaryCompanyOptions, getBranchCompanyOptions, isVnmbUser, getTenantDisplayName } from "@/lib/utils/tenant";
import { User } from "@/types/auth";

interface FornecedorRow {
  id: string;
  iniciais: string;
  nome: string;
  cnpj: string;
  empresa: string;
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

function mapSupplierToRow(s: Supplier, currentUser?: User | null): FornecedorRow {
  const isActive = s.status === "Active";
  const score = s.performanceScore ? Number(s.performanceScore) : null;
  const stars = score ? Math.round(score / 2) : 0;
  const empresaFilial = getTenantDisplayName(s.tenantId, currentUser);

  return {
    id: s.id,
    iniciais: s.corporateName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    nome: s.corporateName,
    cnpj: s.cnpj,
    empresa: empresaFilial,
    categoria: s.segment,
    catIcon: getCategoryIcon(s.segment),
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
  const { user } = useAuth();

  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    { header: "Empresa / Unidade", accessorKey: "empresa" },
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
        {/* Cadastro manual desabilitado - Fornecedores importados via planilha/integração
        <div className={styles.headerActions}>
          <Button variant="primary" className={styles.btnAdd} onClick={() => router.push("/fornecedores/novo")}>
            <Icon name="plus" /> Adicionar fornecedor
          </Button>
        </div>
        */}
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard title="Fornecedores homologados" value={String(kpis?.active || 0)} icon="users-01" description="Ativos" loading={loading} />
        <KpiCard title="Em homologação" value={String(kpis?.underCertification || 0)} icon="clock" description="Pendente" loading={loading} />
        <KpiCard title="Nota média de performance" value={kpis?.avgPerformanceScore || "-"} icon="star-01" description="Entre homologados" loading={loading} />
        <KpiCard title="Categorias cobertas" value={String(kpis?.segmentCount || 0)} icon="shield-01" loading={loading} />
      </div>

      <Card noPadding className={styles.mainListCard}>
        
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" />
            <input type="text" placeholder="Buscar fornecedor..." />
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
              options={statusOptions}
              value={status}
              onChange={setStatus}
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
            <DataTable data={filtered} columns={columns} onRowClick={(row) => router.push(`/fornecedores/${row.id}`)} />

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
