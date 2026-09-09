"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  Button, 
  Icon, 
  Select, 
  ErrorState, 
  EmptyState, 
  TableSkeleton, 
  Badge, 
  DataTable, 
  ColumnDef, 
  KpiCard 
} from "@/components/ui";
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
  categoria: string;
  integrationCode: string;
}

function mapSupplierToRow(s: Supplier, _currentUser?: User | null): FornecedorRow {
  const isHomologado = s.status === "Active" || s.isActive === true;

  const rawScore = s.performanceScore !== undefined && s.performanceScore !== null ? Number(s.performanceScore) : null;
  const nota = rawScore !== null && rawScore > 0 ? rawScore.toFixed(1).replace(".", ",") : "—";
  const estrelas = rawScore !== null && rawScore > 0 ? Math.min(5, Math.max(1, Math.round(rawScore / 2))) : 0;

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
    categoria: s.segment || "Geral",
    integrationCode: s.integrationCode || "—",
  };
}

export default function FornecedoresListPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedSegment, setSelectedSegment] = useState("Todos");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [kpis, setKpis] = useState<SupplierKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const statusMap: Record<string, string> = {
        "Homologado": "Active",
        "Em homologação": "UnderCertification",
        "Inativo": "Inactive",
      };
      const [suppliers, kpisData] = await Promise.all([
        suppliersApi.list({
          status: status !== "Todos" ? (statusMap[status] || status) : undefined,
          city: selectedCity !== "Todas" ? selectedCity : undefined,
          segment: selectedSegment !== "Todos" ? selectedSegment : undefined,
          search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
        }),
        suppliersApi.getKpis(),
      ]);
      setFornecedores((suppliers || []).map((s) => mapSupplierToRow(s, user)));
      setKpis(kpisData);
    } catch (err) {
      logError("fornecedores/fetchData", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user, status, selectedCity, selectedSegment, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const segmentOptions = [
    { label: "Segmento: Todos", value: "Todos" },
    ...Array.from(new Set(fornecedores.map((f) => f.categoria)))
      .filter(Boolean)
      .sort()
      .map((seg) => ({ label: seg, value: seg })),
  ];

  const cityOptions = [
    { label: "Cidade: Todas", value: "Todas" },
    ...Array.from(new Set(fornecedores.map((f) => f.cidade)))
      .filter((c) => c && c !== "—")
      .sort()
      .map((c) => ({ label: `Cidade: ${c}`, value: c })),
  ];

  const statusOptions = [
    { label: "Status: Todos", value: "Todos" },
    { label: "Homologado", value: "Homologado" },
    { label: "Em homologação", value: "Em homologação" },
    { label: "Inativo", value: "Inativo" },
  ];

  const filtered = [...fornecedores].sort((a, b) => a.nome.localeCompare(b.nome));


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
      header: "Segmento",
      accessorKey: "categoria",
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "Homologado" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "",
      width: "50px",
      cell: (row) => (
        <div className={styles.actionCell}>
          <button 
            className={styles.iconBtn}
            title="Ver detalhes do fornecedor"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/fornecedores/${row.id}`);
            }}
          >
            <Icon name="eye" size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>

      
      <div className={styles.pageHeader}>
        <div>
          <h1>Base de Fornecedores</h1>
          <p>Consulte parceiros homologados, localização, contatos e nível de performance.</p>
        </div>
      </div>

      
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
        {(() => {
          const validScores = fornecedores
            .map((f) => (f.nota !== "-" ? parseFloat(f.nota.replace(",", ".")) : null))
            .filter((n): n is number => n !== null && !isNaN(n));
          const listAvg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : "—";
          const displayScore = kpis?.avgPerformanceScore ? Number(kpis.avgPerformanceScore).toFixed(1).replace(".", ",") : (listAvg !== "—" ? listAvg.replace(".", ",") : "—");
          const numScore = parseFloat(displayScore.replace(",", "."));
          const scoreDesc = isNaN(numScore) ? "Sem avaliações" : numScore >= 9 ? "Excelente" : numScore >= 7 ? "Bom" : numScore >= 5 ? "Regular" : "Abaixo da média";

          return (
            <KpiCard
              title="Nota média de performance"
              value={displayScore}
              icon="star-01"
              description={scoreDesc}
              loading={loading}
            />
          );
        })()}
        <KpiCard
          title="Cobertura no ERP"
          value={String(kpis?.total || fornecedores.length)}
          icon="shield-tick"
          description="Fornecedores cadastrados"
          loading={loading}
        />
      </div>

      
      <Card noPadding className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" size={16} />
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
            <Select
              options={segmentOptions}
              value={selectedSegment}
              onChange={(val) => {
                setSelectedSegment(val);
                setCurrentPage(1);
              }}
              icon="filter-lines"
              className={styles.customSelectFilter}
            />

            <Select
              options={cityOptions}
              value={selectedCity}
              onChange={(val) => {
                setSelectedCity(val);
                setCurrentPage(1);
              }}
              icon="marker-pin-01"
              className={styles.customSelectFilter}
            />

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
        ) : filtered.length === 0 ? (
          <EmptyState
            illustration={searchQuery || selectedSegment !== "Todos" || selectedCity !== "Todas" || status !== "Todos" ? "no-search" : "no-suppliers"}
            title={searchQuery || selectedSegment !== "Todos" || selectedCity !== "Todas" || status !== "Todos" ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
            description={
              searchQuery || selectedSegment !== "Todos" || selectedCity !== "Todas" || status !== "Todos"
                ? "Não encontramos fornecedores com os filtros aplicados. Tente alterar os critérios de busca."
                : "A base de parceiros e fornecedores é sincronizada e integrada automaticamente a partir do ERP Corporate."
            }
            action={
              searchQuery || selectedSegment !== "Todos" || selectedCity !== "Todas" || status !== "Todos"
                ? {
                  label: "Limpar Filtros",
                  variant: "secondary",
                  onClick: () => {
                    setSearchQuery("");
                    setSelectedSegment("Todos");
                    setSelectedCity("Todas");
                    setStatus("Todos");
                  },
                }
                : undefined
            }
          />
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
                  <Icon name="chevron-left" size={16} />
                </button>
                <span style={{ fontSize: 13, color: "#475569", alignSelf: "center", margin: "0 8px" }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={styles.pageBtn}
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
            </div>
          </>
        )}

      </Card>
    </div>
  );
}
