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
} from "@/components/ui";
import { useItems, useItem, useItemKpis, useCreateItem } from "@/hooks/useQueries";
import { CatalogItem } from "@/lib/api/items";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { formatCurrency } from "@/lib/utils/format-display";
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

  // Modal Novo Item
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState("MRO / Peças");
  const [newUnit, setNewUnit] = useState("UN");
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);

  // Queries
  const { data: items = [], isLoading, refetch } = useItems({
    search: search.trim() ? search : undefined,
    category: selectedCategory !== "Todas" ? selectedCategory : undefined,
  });

  const { data: kpis } = useItemKpis();
  const createItemMutation = useCreateItem();

  // Detalhe do item selecionado para auditoria
  const { data: itemDetail, isLoading: isLoadingDetail } = useItem(
    selectedItemForAudit?.id || ""
  );

  // Carrega lista de fornecedores quando abrir o modal de novo item
  const handleOpenNewModal = async () => {
    setIsNewModalOpen(true);
    if (suppliersList.length === 0) {
      try {
        const sups = await suppliersApi.list();
        setSuppliersList(sups || []);
      } catch {
        // silencioso
      }
    }
  };

  const supplierOptions = useMemo(() => {
    return [
      { label: "Sem fornecedor base inicial", value: "" },
      ...suppliersList.map((s) => ({
        label: `${s.tradeName || s.corporateName} (${s.cnpj})`,
        value: s.id,
      })),
    ];
  }, [suppliersList]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) {
      toast({
        variant: "warning",
        title: "Atenção",
        message: "Informe a descrição do item.",
      });
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
        message: "O item agora está guardado e disponível para solicitações e cotações.",
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>
            <Icon name="package" size={26} /> Itens & Catálogo Auditado
          </h1>
          <p>
            Itens e materiais guardados com histórico de compras e fornecedor de base para cotações ágeis.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenNewModal}>
          <Icon name="plus" size={16} /> Novo Item no Catálogo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total de Itens Guardados"
          value={kpis?.totalItems ?? items.length}
          icon="package"
          description="Itens rastreados no banco"
        />
        <KpiCard
          title="Com Fornecedor de Base"
          value={kpis?.itemsWithSupplier ?? items.filter((i) => i.lastSupplierId).length}
          icon="building-07"
          description="Prontos com fornecedor prévio"
        />
        <KpiCard
          title="Compras Auditadas"
          value={kpis?.totalAudits ?? 0}
          icon="receipt-check"
          description="Histórico de preços e pedidos"
        />
        <KpiCard
          title="Categorias Mapeadas"
          value={kpis?.totalCategories ?? 6}
          icon="layers-three-01"
          description="Segmentos em operação"
        />
      </div>

      {/* Toolbar / Filtros */}
      <Card className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchGroup}>
            <input
              type="text"
              placeholder="Buscar por descrição, código ou fornecedor de base..."
              className={styles.formControl}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.filterSelect}>
              <Select
                options={CATEGORY_OPTIONS}
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabela de Itens */}
      <Card noPadding className={styles.tableCard}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "48px 24px" }}>
            <EmptyState
              illustration="box-empty"
              title="Nenhum item encontrado"
              description="Cadastre um novo item ou ajuste os filtros de pesquisa."
              action={{
                label: "Cadastrar Novo Item",
                onClick: handleOpenNewModal,
                icon: "plus",
              }}
            />
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Código</th>
                  <th>Material / Serviço</th>
                  <th style={{ width: "140px" }}>Categoria</th>
                  <th style={{ width: "70px", textAlign: "center" }}>Unidade</th>
                  <th>Fornecedor de Base</th>
                  <th style={{ width: "140px", textAlign: "right" }}>Último Preço</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Última Compra</th>
                  <th style={{ width: "100px", textAlign: "center" }}>Auditorias</th>
                  <th style={{ width: "90px", textAlign: "center" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItemForAudit(item)}
                    title="Clique para ver o histórico detalhado de auditoria"
                  >
                    <td>
                      <Badge variant="gray">{item.code || "—"}</Badge>
                    </td>
                    <td>
                      <div className={styles.itemDescCol}>
                        <strong>{item.description}</strong>
                        {item.notes && <span>{item.notes}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "#475569" }}>
                        {item.category || "Geral"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                        {item.unit}
                      </span>
                    </td>
                    <td>
                      {item.lastSupplier ? (
                        <div className={styles.supplierCol}>
                          <strong>{item.lastSupplier.tradeName || item.lastSupplier.corporateName}</strong>
                          <span>CNPJ: {item.lastSupplier.cnpj}</span>
                        </div>
                      ) : (
                        <span className={styles.noSupplier}>
                          <Icon name="alert-circle" size={14} /> Nenhum anterior
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {item.lastUnitPrice ? (
                        <div className={styles.priceCol}>
                          {formatCurrency(Number(item.lastUnitPrice))}
                          <small>por {item.unit}</small>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", fontSize: 12, color: "#64748b" }}>
                      {item.lastPurchaseDate
                        ? new Date(item.lastPurchaseDate).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Badge variant={item.totalPurchases > 0 ? "success" : "gray"}>
                        {item.totalPurchases} {item.totalPurchases === 1 ? "compra" : "compras"}
                      </Badge>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemForAudit(item);
                        }}
                      >
                        <Icon name="eye" size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Drawer Lateral de Auditoria de Fornecedores */}
      {selectedItemForAudit && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedItemForAudit(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2>
                <Icon name="history" size={20} /> Histórico & Auditoria de Fornecedores
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedItemForAudit(null)}
              >
                <Icon name="x-close" size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Resumo do Item */}
              <div>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Item do Catálogo
                </span>
                <h3 style={{ margin: "4px 0 2px", fontSize: 18, color: "#0f172a" }}>
                  {selectedItemForAudit.description}
                </h3>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <Badge variant="gray">Código: {selectedItemForAudit.code || "—"}</Badge>
                  <Badge variant="gray">Categoria: {selectedItemForAudit.category || "Geral"}</Badge>
                  <Badge variant="gray">Unidade: {selectedItemForAudit.unit}</Badge>
                </div>
              </div>

              {/* Card Fornecedor de Base Atual */}
              <div className={styles.baseSupplierCard}>
                <div className={styles.baseSupplierInfo}>
                  <span className={styles.baseSupplierBadge}>
                    <Icon name="check-circle" size={16} /> Fornecedor de Base Atual
                  </span>
                  <div className={styles.baseSupplierTitle}>
                    {selectedItemForAudit.lastSupplier
                      ? selectedItemForAudit.lastSupplier.tradeName || selectedItemForAudit.lastSupplier.corporateName
                      : "Nenhum fornecedor de base registrado ainda"}
                  </div>
                  {selectedItemForAudit.lastSupplier && (
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      CNPJ: {selectedItemForAudit.lastSupplier.cnpj}
                    </span>
                  )}
                </div>
                {selectedItemForAudit.lastUnitPrice && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>Último Preço Pago</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>
                      {formatCurrency(Number(selectedItemForAudit.lastUnitPrice))}
                    </div>
                  </div>
                )}
              </div>

              {/* Linha do Tempo / Histórico de Compras Auditadas */}
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="file-check-02" size={16} /> Registros de Compras Auditadas (
                  {isLoadingDetail ? "..." : (itemDetail?.purchaseAudits?.length ?? 0)})
                </h4>

                {isLoadingDetail ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                  </div>
                ) : itemDetail?.purchaseAudits && itemDetail.purchaseAudits.length > 0 ? (
                  <div className={styles.auditHistoryList}>
                    {itemDetail.purchaseAudits.map((audit) => (
                      <div key={audit.id} className={styles.auditCard}>
                        <div className={styles.auditCardHeader}>
                          <span className={styles.auditOrderTag}>
                            <Icon name="shopping-cart-01" size={14} /> {audit.orderCode || "Pedido de Compra"}
                          </span>
                          <span className={styles.auditDate}>
                            {new Date(audit.purchasedAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          Fornecedor: {audit.supplier?.tradeName || audit.supplier?.corporateName || "—"}
                        </div>
                        <div className={styles.auditGrid}>
                          <div className={styles.auditGridItem}>
                            <span>Preço Unitário</span>
                            <strong>{formatCurrency(Number(audit.unitPrice))}</strong>
                          </div>
                          <div className={styles.auditGridItem}>
                            <span>Quantidade</span>
                            <strong>{audit.quantity || 1} {selectedItemForAudit.unit}</strong>
                          </div>
                          <div className={styles.auditGridItem}>
                            <span>Valor Total</span>
                            <strong>{formatCurrency(Number(audit.totalPrice || audit.unitPrice))}</strong>
                          </div>
                          {audit.companyCode && (
                            <div className={styles.auditGridItem}>
                              <span>Unidade</span>
                              <strong>{audit.companyCode}</strong>
                            </div>
                          )}
                        </div>
                        {audit.notes && (
                          <div style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "6px 10px", borderRadius: 6 }}>
                            {audit.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "20px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    Nenhuma compra auditada registrada ainda para este item. Quando uma RFQ for concluída e originar um pedido de compra, o registro aparecerá aqui automaticamente.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setSelectedItemForAudit(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Novo Item */}
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
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Selecione o fornecedor que você já costuma comprar para tê-lo como base de referência.
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={createItemMutation.isPending}>
                  {createItemMutation.isPending ? "Cadastrando..." : "Salvar no Catálogo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
