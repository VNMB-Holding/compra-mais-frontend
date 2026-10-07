"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Badge,
  Icon,
  Select,
  Skeleton,
  EmptyState,
  KpiCard,
  TableSkeleton,
  ErrorState,
  QuickDetailDrawer,
  DataTable,
  ColumnDef,
} from "@/components/ui";
import { useItems, useItem, useItemKpis, useCreateItem } from "@/hooks/useQueries";
import { CatalogItem } from "@/lib/api/items";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { formatCurrency } from "@/lib/utils/format-display";
import { getErrorMessage } from "@/lib/utils/error";
import { useToast } from "@/contexts/ToastContext";
import styles from "./itens.module.css";

const CATEGORY_OPTIONS = [
  { label: "Todas as categorias", value: "Todas" },
  { label: "MRO / Peças", value: "MRO / Peças" },
  { label: "TI / Tecnologia", value: "TI / Tecnologia" },
  { label: "Operações", value: "Operações" },
  { label: "Facilities", value: "Facilities" },
  { label: "Insumos Agrícolas", value: "Insumos Agrícolas" },
  { label: "Serviços Técnicos", value: "Serviços Técnicos" },
  { label: "Geral", value: "Geral" },
];

export default function ItensCatalogoPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedItemForAudit, setSelectedItemForAudit] = useState<CatalogItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState("MRO / Peças");
  const [newUnit, setNewUnit] = useState("UN");
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);

  const queryParams = useMemo(
    () => ({
      search: search.trim() ? search.trim() : undefined,
      category: selectedCategory !== "Todas" ? selectedCategory : undefined,
    }),
    [search, selectedCategory],
  );

  const { data: items = [], isLoading, error, refetch } = useItems(queryParams);
  const { data: kpis, isLoading: loadingKpis } = useItemKpis();
  const createItemMutation = useCreateItem();
  const { data: itemDetail, isLoading: isLoadingDetail } = useItem(selectedItemForAudit?.id || "");

  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenNewModal = async () => {
    setIsNewModalOpen(true);
    if (suppliersList.length === 0) {
      try {
        const sups = await suppliersApi.list();
        setSuppliersList(sups || []);
      } catch {}
    }
  };

  const supplierOptions = useMemo(
    () => [
      { label: "Sem fornecedor base inicial", value: "" },
      ...suppliersList.map((s) => ({
        label: `${s.tradeName || s.corporateName} (${s.cnpj})`,
        value: s.id,
      })),
    ],
    [suppliersList],
  );

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("Todas");
    setCurrentPage(1);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) {
      toast({ variant: "warning", title: "Atenção", message: "Informe a descrição do item." });
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        description: newDesc.trim(),
        code: newCode.trim() || undefined,
        category: newCategory,
        unit: newUnit,
        lastSupplierId: newSupplierId || undefined,
        lastUnitPrice: newUnitPrice ? Number(newUnitPrice) : undefined,
        notes: newNotes.trim() || undefined,
      });

      toast({
        variant: "success",
        title: "Item cadastrado com sucesso!",
        message: "O item agora está disponível para solicitações e cotações.",
      });

      setIsNewModalOpen(false);
      setNewDesc("");
      setNewCode("");
      setNewUnitPrice("");
      setNewSupplierId("");
      setNewNotes("");
      refetch();
    } catch {
      toast({
        variant: "error",
        title: "Erro ao cadastrar",
        message: "Não foi possível cadastrar o item. Verifique os dados e tente novamente.",
      });
    }
  };

  const columns: ColumnDef<CatalogItem>[] = [
    {
      header: "Código",
      width: "120px",
      cell: (item) => <Badge variant="gray">{item.code || "-"}</Badge>,
    },
    {
      header: "Material / Serviço",
      cell: (item) => (
        <div className={styles.doubleText}>
          <strong>{item.description}</strong>
          {item.notes && <span>{item.notes}</span>}
        </div>
      ),
    },
    {
      header: "Categoria",
      width: "150px",
      cell: (item) => <span className={styles.mutedText}>{item.category || "Geral"}</span>,
    },
    {
      header: "Unidade",
      width: "80px",
      cell: (item) => <span className={styles.unitTag}>{item.unit}</span>,
    },
    {
      header: "Fornecedor Base",
      cell: (item) =>
        item.lastSupplier ? (
          <div className={styles.doubleText}>
            <strong>{item.lastSupplier.tradeName || item.lastSupplier.corporateName}</strong>
            <span>CNPJ: {item.lastSupplier.cnpj}</span>
          </div>
        ) : (
          <span className={styles.noSupplier}>
            <Icon name="alert-circle" size={14} /> Sem referência
          </span>
        ),
    },
    {
      header: "Último Preço",
      width: "140px",
      cell: (item) =>
        item.lastUnitPrice ? (
          <div className={styles.priceCol}>
            {formatCurrency(Number(item.lastUnitPrice))}
            <small>por {item.unit}</small>
          </div>
        ) : (
          <span className={styles.emptyText}>-</span>
        ),
    },
    {
      header: "Auditorias",
      width: "120px",
      cell: (item) => (
        <Badge variant={item.totalPurchases > 0 ? "success" : "gray"}>
          {item.totalPurchases} {item.totalPurchases === 1 ? "compra" : "compras"}
        </Badge>
      ),
    },
    {
      header: "",
      width: "60px",
      cell: (item) => (
        <button
          className={styles.iconBtn}
          title="Ver histórico do item"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItemForAudit(item);
          }}
        >
          <Icon name="eye" size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Catálogo de Itens</h1>
          <p>
            Materiais e serviços guardados com histórico de compras, preços e fornecedores de
            referência.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={handleOpenNewModal}>
            <Icon name="plus" size={16} /> Novo Item
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total de Itens"
          value={String(kpis?.totalItems ?? items.length)}
          icon="package"
          loading={loadingKpis}
        />
        <KpiCard
          title="Com Fornecedor Base"
          value={String(kpis?.itemsWithSupplier ?? items.filter((i) => i.lastSupplierId).length)}
          icon="building-07"
          loading={loadingKpis}
        />
        <KpiCard
          title="Compras Auditadas"
          value={String(kpis?.totalAudits ?? 0)}
          icon="receipt-check"
          loading={loadingKpis}
        />
        <KpiCard
          title="Categorias"
          value={String(kpis?.totalCategories ?? 0)}
          icon="layers-three-01"
          loading={loadingKpis}
        />
      </div>

      <Card noPadding className={styles.mainListCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Icon name="search-md" size={16} />
            <input
              type="text"
              placeholder="Buscar por descrição, código ou fornecedor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className={styles.filtersGroup}>
            <Select
              options={CATEGORY_OPTIONS}
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {error ? (
          <ErrorState message={getErrorMessage(error)} />
        ) : isLoading ? (
          <TableSkeleton rows={6} columns={8} />
        ) : items.length === 0 ? (
          <EmptyState
            illustration={search || selectedCategory !== "Todas" ? "no-search" : "box-empty"}
            title={
              search || selectedCategory !== "Todas"
                ? "Nenhum item encontrado"
                : "Nenhum item cadastrado"
            }
            description={
              search || selectedCategory !== "Todas"
                ? "Não encontramos registros com os filtros aplicados."
                : "Cadastre materiais e serviços para reutilizar nas solicitações e cotações."
            }
            action={
              search || selectedCategory !== "Todas"
                ? { label: "Limpar Filtros", variant: "secondary", onClick: resetFilters }
                : { label: "Cadastrar Item", icon: "plus", onClick: handleOpenNewModal }
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedItems}
              onRowClick={setSelectedItemForAudit}
            />
            <div className={styles.tableFooter}>
              <span>
                Mostrando {paginatedItems.length} de {items.length} itens
              </span>
              <div className={styles.paginationControls}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={styles.pageBtn}
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                <span>
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

      {selectedItemForAudit && (
        <QuickDetailDrawer
          open={!!selectedItemForAudit}
          onClose={() => setSelectedItemForAudit(null)}
          title={selectedItemForAudit.code || "Item sem código"}
          subtitle={selectedItemForAudit.description}
          badge={
            <Badge variant={selectedItemForAudit.isActive ? "success" : "gray"}>
              {selectedItemForAudit.isActive ? "Ativo" : "Inativo"}
            </Badge>
          }
        >
          <div className={styles.drawerStack}>
            <div className={styles.drawerSummaryGrid}>
              <div>
                <span>Categoria</span>
                <strong>{selectedItemForAudit.category || "Geral"}</strong>
              </div>
              <div>
                <span>Unidade</span>
                <strong>{selectedItemForAudit.unit}</strong>
              </div>
              <div>
                <span>Última Compra</span>
                <strong>
                  {selectedItemForAudit.lastPurchaseDate
                    ? new Date(selectedItemForAudit.lastPurchaseDate).toLocaleDateString("pt-BR")
                    : "-"}
                </strong>
              </div>
              <div>
                <span>Auditorias</span>
                <strong>{selectedItemForAudit.totalPurchases}</strong>
              </div>
            </div>

            <div className={styles.baseSupplierCard}>
              <div className={styles.baseSupplierInfo}>
                <span className={styles.baseSupplierBadge}>
                  <Icon name="check-circle" size={16} /> Fornecedor Base
                </span>
                <div className={styles.baseSupplierTitle}>
                  {selectedItemForAudit.lastSupplier
                    ? selectedItemForAudit.lastSupplier.tradeName ||
                      selectedItemForAudit.lastSupplier.corporateName
                    : "Nenhum fornecedor de base registrado"}
                </div>
                {selectedItemForAudit.lastSupplier && (
                  <span>CNPJ: {selectedItemForAudit.lastSupplier.cnpj}</span>
                )}
              </div>
              {selectedItemForAudit.lastUnitPrice && (
                <div className={styles.basePrice}>
                  <span>Último Preço</span>
                  <strong>{formatCurrency(Number(selectedItemForAudit.lastUnitPrice))}</strong>
                </div>
              )}
            </div>

            <div>
              <h4 className={styles.sectionTitle}>
                <Icon name="file-check-02" size={16} /> Compras Auditadas (
                {isLoadingDetail ? "..." : (itemDetail?.purchaseAudits?.length ?? 0)})
              </h4>

              {isLoadingDetail ? (
                <div className={styles.skeletonStack}>
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                </div>
              ) : itemDetail?.purchaseAudits && itemDetail.purchaseAudits.length > 0 ? (
                <div className={styles.auditHistoryList}>
                  {itemDetail.purchaseAudits.map((audit) => (
                    <div key={audit.id} className={styles.auditCard}>
                      <div className={styles.auditCardHeader}>
                        <span className={styles.auditOrderTag}>
                          <Icon name="shopping-cart-01" size={14} />{" "}
                          {audit.orderCode || "Pedido de Compra"}
                        </span>
                        <span className={styles.auditDate}>
                          {new Date(audit.purchasedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className={styles.auditSupplier}>
                        Fornecedor:{" "}
                        {audit.supplier?.tradeName || audit.supplier?.corporateName || "-"}
                      </div>
                      <div className={styles.auditGrid}>
                        <div className={styles.auditGridItem}>
                          <span>Preço Unitário</span>
                          <strong>{formatCurrency(Number(audit.unitPrice))}</strong>
                        </div>
                        <div className={styles.auditGridItem}>
                          <span>Quantidade</span>
                          <strong>
                            {audit.quantity || 1} {selectedItemForAudit.unit}
                          </strong>
                        </div>
                        <div className={styles.auditGridItem}>
                          <span>Valor Total</span>
                          <strong>
                            {formatCurrency(Number(audit.totalPrice || audit.unitPrice))}
                          </strong>
                        </div>
                        {audit.companyCode && (
                          <div className={styles.auditGridItem}>
                            <span>Unidade</span>
                            <strong>{audit.companyCode}</strong>
                          </div>
                        )}
                      </div>
                      {audit.notes && <div className={styles.auditNotes}>{audit.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.inlineEmpty}>
                  Nenhuma compra auditada registrada para este item.
                </div>
              )}
            </div>
          </div>
        </QuickDetailDrawer>
      )}

      {isNewModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsNewModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Icon name="package" size={20} /> Cadastrar Item no Catálogo
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsNewModalOpen(false)}
              >
                <Icon name="x-close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Descrição do Item / Material / Serviço *</label>
                  <input
                    type="text"
                    required
                    className={styles.formControl}
                    placeholder="Ex: Filtro de Óleo Hidráulico 10 Micras"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Código Interno / ERP (opcional)</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="Ex: 01.00234 ou ITM-001"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Unidade de Medida *</label>
                    <Select
                      options={[
                        { label: "UN - Unidade", value: "UN" },
                        { label: "KG - Quilograma", value: "KG" },
                        { label: "L - Litro", value: "L" },
                        { label: "M - Metro", value: "M" },
                        { label: "BARRA - Barra", value: "BARRA" },
                        { label: "PACOTE - Pacote", value: "PACOTE" },
                        { label: "H - Hora Serviço", value: "H" },
                      ]}
                      value={newUnit}
                      onChange={setNewUnit}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Categoria de Compra</label>
                  <Select
                    options={CATEGORY_OPTIONS.filter((c) => c.value !== "Todas")}
                    value={newCategory}
                    onChange={setNewCategory}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Fornecedor de Base Inicial (Opcional)</label>
                  <Select
                    options={supplierOptions}
                    value={newSupplierId}
                    onChange={setNewSupplierId}
                  />
                  <small>
                    Selecione o fornecedor usado como referência inicial para futuras cotações.
                  </small>
                </div>

                {newSupplierId && (
                  <div className={styles.formGroup}>
                    <label>Último Preço Unitário Praticado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.formControl}
                      placeholder="Ex: 150.00"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(e.target.value)}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Observações / Especificação Técnica</label>
                  <textarea
                    rows={2}
                    className={styles.formControl}
                    placeholder="Normas técnicas, referências de fabricante ou detalhes..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="secondary" onClick={() => setIsNewModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createItemMutation.isPending}
                  loading={createItemMutation.isPending}
                  loadingText="Cadastrando..."
                >
                  Salvar no Catálogo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
