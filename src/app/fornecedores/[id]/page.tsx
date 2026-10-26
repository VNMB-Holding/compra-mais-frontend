"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Icon,
  Skeleton,
  KpiCard,
  KpiCardSkeleton,
  Tabs,
  Badge,
  EmptyState,
  DataTable,
  ColumnDef,
  Breadcrumb,
} from "@/components/ui";
import styles from "./fornecedor-detail.module.css";
import { useSupplier, usePurchaseOrders } from "@/hooks/useQueries";
import { formatCurrency } from "@/lib/utils/format-display";
import { detectMarketplaceFromUrl } from "@/lib/utils/item-description";
import {
  PURCHASE_ORDER_STATUS_MAP,
  getStatusBadgeVariant,
} from "@/lib/constants/status";

export default function FornecedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;

  const [activeTab, setActiveTab] = useState("cadastral");

  const { data: supplier, isLoading, isError } = useSupplier(supplierId);
  const { data: allOrders = [] } = usePurchaseOrders();

  const supplierOrders = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    if (supplier?.purchaseOrders && Array.isArray(supplier.purchaseOrders)) {
      for (const po of supplier.purchaseOrders) {
        if (po?.id && !seenIds.has(po.id)) {
          seenIds.add(po.id);
          list.push(po);
        }
      }
    }

    if (supplier && Array.isArray(allOrders)) {
      const cnpjClean = supplier.cnpj ? supplier.cnpj.replace(/\D/g, "") : "";
      const nameLower = (supplier.corporateName || "").toLowerCase();
      const tradeLower = (supplier.tradeName || "").toLowerCase();

      for (const po of allOrders) {
        if (!po?.id || seenIds.has(po.id)) continue;

        const poCnpj = po.supplier?.cnpj ? po.supplier.cnpj.replace(/\D/g, "") : "";
        const poName = (po.supplier?.corporateName || "").toLowerCase();
        const poTrade = (po.supplier?.tradeName || "").toLowerCase();

        const matchId = po.supplierId === supplier.id || po.supplier?.id === supplier.id;
        const matchCnpj = cnpjClean && poCnpj && cnpjClean === poCnpj;
        const matchName =
          (nameLower && poName && (nameLower.includes(poName) || poName.includes(nameLower))) ||
          (tradeLower && poTrade && (tradeLower.includes(poTrade) || poTrade.includes(tradeLower)));

        if (matchId || matchCnpj || matchName) {
          seenIds.add(po.id);
          list.push(po);
        }
      }
    }

    return list;
  }, [supplier, allOrders]);

  const totalSpent = useMemo(() => {
    return supplierOrders.reduce(
      (acc, po) => acc + Number(po.totalValue || po.totalAmount || 0),
      0,
    );
  }, [supplierOrders]);

  const supplierProposals = useMemo(() => {
    return supplier?.proposals || [];
  }, [supplier]);

  const renderStars = (scoreVal: number) => {
    const starCount = Math.min(5, Math.max(1, Math.round(scoreVal / 2)));
    return (
      <div className={styles.starRow}>
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            name="star-01"
            size={14}
            className={i < starCount ? styles.starFilled : styles.starEmpty}
          />
        ))}
      </div>
    );
  };

  const orderColumns: ColumnDef<any>[] = [
    {
      header: "Número do Pedido",
      cell: (row) => (
        <span
          className={styles.codeCell}
          onClick={() => router.push(`/compras/pedidos/${row.id}`)}
        >
          <Icon name="file-02" size={16} />
          {row.code || `PO-${row.id.substring(0, 8)}`}
        </span>
      ),
    },
    {
      header: "Data de Emissão",
      cell: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString("pt-BR") : "—",
    },
    {
      header: "Itens / Escopo",
      cell: (row) => {
        const itemNames = row.items?.map((i: any) => i.description).filter(Boolean);
        if (itemNames && itemNames.length > 0) {
          const first = itemNames[0];
          const extra = itemNames.length - 1;
          return extra > 0 ? `${first} (+${extra} itens)` : first;
        }
        return "Itens diversos";
      },
    },
    {
      header: "Valor Total",
      cell: (row) => (
        <strong style={{ color: "#0f172a" }}>
          {formatCurrency(Number(row.totalValue || row.totalAmount || 0))}
        </strong>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const label = PURCHASE_ORDER_STATUS_MAP[row.status] || row.status;
        return <Badge variant={getStatusBadgeVariant(row.status)}>{label}</Badge>;
      },
    },
    {
      header: "",
      width: "50px",
      cell: (row) => (
        <button
          type="button"
          className={styles.iconBtn}
          title="Ver detalhes do pedido"
          onClick={() => router.push(`/compras/pedidos/${row.id}`)}
        >
          <Icon name="arrow-right" size={16} />
        </button>
      ),
    },
  ];

  const proposalColumns: ColumnDef<any>[] = [
    {
      header: "Cotação / RFQ",
      cell: (row) => (
        <span
          className={styles.codeCell}
          onClick={() => (row.rfq as any)?.id && router.push(`/compras/rfqs/${(row.rfq as any).id}`)}
        >
          <Icon name="file-check-01" size={16} />
          {row.rfq?.code || "RFQ"}
        </span>
      ),
    },
    {
      header: "Título / Objeto",
      cell: (row) => row.rfq?.title || "Cotação Comercial",
    },
    {
      header: "Data",
      cell: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString("pt-BR") : "—",
    },
    {
      header: "Valor Proposto",
      cell: (row) => (
        <strong style={{ color: "#0f172a" }}>
          {row.totalValue ? formatCurrency(Number(row.totalValue)) : "—"}
        </strong>
      ),
    },
    {
      header: "Resultado",
      cell: (row) => (
        <Badge variant={row.isWinner ? "success" : "gray"}>
          {row.isWinner ? "Vencedora" : "Participou"}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Diretório de Fornecedores", href: "/fornecedores/diretorio" },
            { label: supplierId || "Carregando..." },
          ]}
        />
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/diretorio")}>
          <Icon name="arrow-left" size={16} /> Voltar ao diretório
        </button>
        <div
          style={{ padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}
        >
          <Skeleton variant="title" width="35%" height={28} />
          <Skeleton variant="text" width="25%" style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton width={130} height={28} />
            <Skeleton width={130} height={28} />
            <Skeleton width={130} height={28} />
          </div>
        </div>
        <div className={styles.kpiGrid} style={{ marginTop: 24 }}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className={styles.pageContainer}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Diretório de Fornecedores", href: "/fornecedores/diretorio" },
            { label: supplierId || "Fornecedor não localizado" },
          ]}
        />
        <Card style={{ padding: "48px 24px", marginTop: 16 }}>
          <EmptyState
            illustration="not-found"
            title="Fornecedor não localizado"
            description={`Não foi possível encontrar os dados para o código "${supplierId}". O registro pode ter sido inativado ou o link está incorreto.`}
            action={{
              label: "Voltar ao Diretório de Fornecedores",
              icon: "arrow-left",
              onClick: () => router.push("/fornecedores/diretorio"),
            }}
          />
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "FR";
  const hasScore =
    supplier.performanceScore !== undefined &&
    supplier.performanceScore !== null &&
    Number(supplier.performanceScore) > 0;
  const score = hasScore ? Number(supplier.performanceScore) : null;
  const scoreFormatted = score !== null ? score.toFixed(1).replace(".", ",") : "—";
  const isActive = supplier.status === "Active" && supplier.isActive !== false;
  const isSuspended = supplier.status === "Suspended";
  const isInactive = supplier.status === "Inactive" || supplier.isActive === false;

  const tabsConfig = [
    { id: "cadastral", label: "Dados Cadastrais & Fiscais" },
    {
      id: "compras",
      label: "Histórico de Compras",
      count: supplierOrders.length,
    },
    {
      id: "cotacoes",
      label: "Cotações / Propostas",
      count: supplierProposals.length,
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Diretório de Fornecedores", href: "/fornecedores/diretorio" },
          { label: supplier.tradeName || supplier.corporateName },
        ]}
      />

      <div className={styles.topSection}>
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/diretorio")}>
          <Icon name="arrow-left" size={16} /> Voltar ao diretório
        </button>

        <div className={styles.headerRow}>
          <div>
            <div className={styles.titleRow}>
              <h1>{supplier.corporateName}</h1>
            </div>
            <p className={styles.subtitleLarge}>
              {supplier.tradeName && supplier.tradeName !== supplier.corporateName
                ? supplier.tradeName
                : "Parceiro Comercial Cadastrado"}
            </p>
            <div className={styles.metadataTags}>
              <span className={styles.infoTag}>
                <Icon name="marker-pin-01" />{" "}
                {supplier.city ? `${supplier.city} / ${supplier.state || ""}` : "Brasil"}
              </span>
              <span className={styles.infoTag}>
                <Icon name="briefcase-01" /> {supplier.segment || "Geral"}
              </span>
              <span className={styles.infoTag}>
                <Icon name="tag-01" /> Cód. ERP: {supplier.integrationCode || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryColBase}>
            {(() => {
              const textToMatch = [
                supplier.tradeName,
                supplier.corporateName,
                supplier.cnpj,
              ]
                .filter(Boolean)
                .join(" ");
              const detectedLogo = detectMarketplaceFromUrl(textToMatch);
              if (detectedLogo?.logoPath) {
                return (
                  <div
                    className={`${styles.avatarBig} ${styles.avatarBigWithLogo}`}
                    title={detectedLogo.label}
                  >
                    <img
                      src={detectedLogo.logoPath}
                      alt={supplier.tradeName || supplier.corporateName}
                      className={styles.supplierLogoImgBig}
                    />
                  </div>
                );
              }
              return (
                <div
                  className={`${styles.avatarBig} ${isActive ? styles.avatarGreen : styles.avatarOrange}`}
                >
                  {getInitials(supplier.tradeName || supplier.corporateName)}
                </div>
              );
            })()}
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>{supplier.corporateName}</h2>
              </div>
              <p className={styles.docInfo}>
                CNPJ: <strong>{supplier.cnpj}</strong>{" "}
                {supplier.tradeName && supplier.tradeName !== supplier.corporateName
                  ? `• ${supplier.tradeName}`
                  : ""}
              </p>
            </div>
          </div>

          <div className={styles.summaryColScore}>
            <div className={styles.scoreHeader}>
              <span>Nota de Performance</span>
              <Icon name="star-01" size={16} />
            </div>
            <div className={styles.scoreValue}>
              <strong className={styles.textGreen}>{scoreFormatted}</strong>
              {score !== null && <small>/10</small>}
            </div>
            <div className={styles.titleRow}>
              {score !== null ? (
                renderStars(score)
              ) : (
                <span style={{ fontSize: 12, color: "#64748b" }}>Sem avaliações</span>
              )}
            </div>
          </div>

          <div className={styles.summaryColStatus}>
            <div className={styles.statusRow}>
              <span>Histórico de Fornecimento</span>
            </div>
            <p className={styles.etapaText}>
              Pedidos Realizados: <strong>{supplierOrders.length}</strong>
            </p>
            <p className={styles.subStatusText}>
              Total Faturado: <strong>{formatCurrency(totalSpent)}</strong>
            </p>
          </div>
        </div>
      </Card>

      <div className={styles.tabsSection}>
        <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "cadastral" && (
        <div className={styles.tabContent}>
          <div className={styles.kpiGrid}>
            <KpiCard
              title="Score de Performance"
              value={`${scoreFormatted}/10`}
              icon="star-01"
              description="Avaliação em cotações e entregas"
            />
            <KpiCard
              title="Prazo de Entrega"
              value={supplier.deliveryLeadTime ? `${supplier.deliveryLeadTime} dias` : "Padrão"}
              icon="truck-01"
              description={supplier.deliveryLocationName || "Almoxarifado Central"}
            />
            <KpiCard
              title="Dados de Pagamento"
              value={
                supplier.pixKey
                  ? "PIX Cadastrado"
                  : supplier.bankCode
                    ? `Banco ${supplier.bankCode}`
                    : "Padrão"
              }
              icon="bank"
              description={
                supplier.bankNumber ? `Conta: ${supplier.bankNumber}` : "Transferência / Boleto"
              }
            />
            <KpiCard
              title="Compras Totais"
              value={String(supplierOrders.length)}
              icon="shopping-cart-01"
              description={`Volume: ${formatCurrency(totalSpent)}`}
            />
          </div>

          <div className={styles.cadastraisGrid}>
            <div className={styles.cadastraisCol}>
              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconBlue}`}>
                    <Icon name="building-02" size={20} />
                  </div>
                  <h3>Identificação Cadastral & Fiscal</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="building-01" size={14} /> Razão Social
                    </span>
                    <span className={styles.fieldValue}>{supplier.corporateName}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="tag-01" size={14} /> Nome Fantasia
                    </span>
                    <span className={styles.fieldValue}>{supplier.tradeName || "—"}</span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="file-check-01" size={14} /> CNPJ
                    </span>
                    <div className={styles.fieldValueSub}>
                      <span className={styles.fieldValue}>{supplier.cnpj}</span>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="file-02" size={14} /> Inscrição Estadual
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.stateRegistration || "Isento / Não informado"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="calendar" size={14} /> Cadastrado em
                    </span>
                    <span className={styles.fieldValue}>
                      {new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconAmber}`}>
                    <Icon name="truck-01" size={20} />
                  </div>
                  <h3>Logística & Condições de Entrega</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="marker-pin-01" size={14} /> Local de Entrega Padrão
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.deliveryLocationName || "Almoxarifado Central / Pátio de Obras"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="clock" size={14} /> Lead Time de Entrega
                    </span>
                    <div className={styles.fieldValueSub}>
                      <span className={styles.fieldValue}>
                        {supplier.deliveryLeadTime
                          ? `${supplier.deliveryLeadTime} dias úteis`
                          : "Prazo sob consulta"}
                      </span>
                      <small>Tempo médio de expedição e transporte</small>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="globe-01" size={14} /> Praça Principal
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.city
                        ? `${supplier.city} / ${supplier.state}`
                        : "Atendimento Nacional"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <div className={styles.cadastraisCol}>
              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconPurple}`}>
                    <Icon name="user-01" size={20} />
                  </div>
                  <h3>Contatos & Localização da Sede</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="users-01" size={14} /> Contato Comercial
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.contactName || "Equipe de Atendimento"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="phone" size={14} /> Telefone
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.contactPhone ? (
                        <a
                          href={`tel:${supplier.contactPhone.replace(/\D/g, "")}`}
                          style={{ color: "#007d79", textDecoration: "none" }}
                        >
                          {supplier.contactPhone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="mail-01" size={14} /> E-mail
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.contactEmail ? (
                        <a
                          href={`mailto:${supplier.contactEmail}`}
                          style={{ color: "#007d79", textDecoration: "none" }}
                        >
                          {supplier.contactEmail}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="marker-pin-02" size={14} /> Endereço Completo
                    </span>
                    <div className={styles.fieldValueSub}>
                      <span className={styles.fieldValue}>
                        {supplier.address || "Endereço comercial cadastrado"}
                      </span>
                      {supplier.neighborhood && (
                        <small>
                          {supplier.neighborhood} • {supplier.city}/{supplier.state} • CEP{" "}
                          {supplier.zipCode || "—"}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={styles.cadastraisCard}>
                <div className={styles.cadastraisCardHeader}>
                  <div className={`${styles.headerIconCircle} ${styles.iconGreen}`}>
                    <Icon name="bank" size={20} />
                  </div>
                  <h3>Dados Bancários & PIX</h3>
                </div>

                <div className={styles.fieldsList}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="credit-card-01" size={14} /> Banco / Código
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.bankCode
                        ? `Banco Febraban [${supplier.bankCode}]`
                        : "Banco Centralizado"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="file-attachment-01" size={14} /> Agência / Conta
                    </span>
                    <span className={styles.fieldValue}>
                      {supplier.bankNumber || "Conta Corrente Integrada"}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      <Icon name="zap" size={14} /> Chave PIX
                    </span>
                    <div className={styles.fieldValueSub} style={{ width: "100%" }}>
                      {supplier.pixKey ? (
                        <div className={styles.pixHighlight}>
                          <span>{supplier.pixKey}</span>
                          <span className={styles.badgeCadastral}>PIX Ativo</span>
                        </div>
                      ) : (
                        <span className={styles.fieldValue} style={{ color: "#94a3b8" }}>
                          Não cadastrada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === "compras" && (
        <div className={styles.tabContent}>
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <h3>
                <Icon name="shopping-cart-01" size={20} style={{ color: "#007d79" }} />
                Pedidos de Compra Emitidos
              </h3>
              <div className={styles.historyStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total de Pedidos</span>
                  <span className={styles.statValue}>{supplierOrders.length}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Volume Financeiro</span>
                  <span className={styles.statValue} style={{ color: "#007d79" }}>
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
              </div>
            </div>

            {supplierOrders.length === 0 ? (
              <EmptyState
                illustration="no-data"
                title="Nenhum pedido de compra emitido ainda"
                description="Quando você concluir cotações e gerar pedidos de compra (PO) para este fornecedor, eles serão centralizados aqui."
              />
            ) : (
              <DataTable
                columns={orderColumns}
                data={supplierOrders}
                onRowClick={(row) => router.push(`/compras/pedidos/${row.id}`)}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "cotacoes" && (
        <div className={styles.tabContent}>
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <h3>
                <Icon name="file-check-01" size={20} style={{ color: "#007d79" }} />
                Histórico de Cotações & Propostas
              </h3>
              <div className={styles.historyStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total de Cotações</span>
                  <span className={styles.statValue}>{supplierProposals.length}</span>
                </div>
              </div>
            </div>

            {supplierProposals.length === 0 ? (
              <EmptyState
                illustration="no-data"
                title="Nenhuma cotação associada"
                description="As demandas e processos de cotação (RFQs) nos quais este fornecedor foi inserido aparecerão listados aqui."
              />
            ) : (
              <DataTable
                columns={proposalColumns}
                data={supplierProposals}
                onRowClick={(row: any) => row.rfq?.id && router.push(`/compras/rfqs/${row.rfq.id}`)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
