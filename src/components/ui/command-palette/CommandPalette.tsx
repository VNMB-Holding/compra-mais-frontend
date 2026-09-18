"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Icon from "../icon/Icon";
import Badge from "../badge/Badge";
import styles from "./CommandPalette.module.css";
import { useAuth } from "@/hooks/useAuth";
import { searchApi, SearchItem, formatSearchStatus } from "@/lib/api/search";

const STATIC_ITEMS: SearchItem[] = [
  { id: "action-new-rfq", title: "Criar Novo Processo de Cotação (RFQ)", category: "Ações", description: "Lançar cotação ao mercado para fornecedores", url: "/compras/rfqs/nova", icon: "send-01", shortcut: "↵" },
  { id: "action-new-req", title: "Nova Solicitação de Compra", category: "Ações", description: "Abrir requisição interna para aquisição de itens", url: "/compras/solicitacoes", icon: "plus-circle" },
  { id: "action-export-reports", title: "Exportar Relatórios de Compras", category: "Ações", description: "Exportar dados de saving e performance em Excel/PDF", url: "/analytics/insights", icon: "download-01" },
  { id: "action-active-orders", title: "Ver Pedidos em Andamento", category: "Ações", description: "Acompanhar recebimento e entregas de insumos", url: "/compras/pedidos", icon: "truck-01" },
  { id: "action-system-help", title: "Suporte & Central de Ajuda", category: "Ações", description: "Falar com nosso time de atendimento ou ler tutoriais", url: "/dashboard", icon: "help-circle" },

  { id: "page-dashboard", title: "Dashboard Principal", category: "Páginas", description: "Visão geral de cotações, solicitações e KPIs", url: "/dashboard", icon: "home-01" },
  { id: "page-suppliers-list", title: "Base de Fornecedores", category: "Páginas", description: "Diretório de parceiros e notas de performance", url: "/fornecedores/diretorio", icon: "users-01" },
  { id: "page-sols", title: "Solicitações de Compra", category: "Páginas", description: "Lista de demandas de compra internas", url: "/compras/solicitacoes", icon: "list" },
  { id: "page-rfqs", title: "Processos de Cotação (RFQs)", category: "Páginas", description: "Listagem de RFQs ativas e propostas", url: "/compras/rfqs", icon: "send-03" },
  { id: "page-orders", title: "Pedidos de Compra", category: "Páginas", description: "Ordens de compra enviadas para fornecedores", url: "/compras/pedidos", icon: "clipboard-check" },
  { id: "page-insights", title: "Insights & Analytics", category: "Páginas", description: "Métricas de compras, prazos e KPIs", url: "/analytics/insights", icon: "presentation-chart-01" },
  { id: "page-reports", title: "Relatórios Exportáveis", category: "Páginas", description: "Filtros customizados e relatórios consolidados", url: "/analytics/relatorios", icon: "bar-chart-01" },
  { id: "page-savings", title: "Painel de Economia Gerada (Saving)", category: "Páginas", description: "Savings absoluto, percentual e histórico", url: "/analytics/economia", icon: "piggy-bank-01" },
];

const CATEGORY_ORDER: Array<SearchItem["category"]> = [
  "Solicitações",
  "Cotações (RFQs)",
  "Pedidos de Compra",
  "Fornecedores",
  "Ações",
  "Páginas",
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicResults, setDynamicResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<number | null>(null);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      router.push(item.url);
      onClose();
    },
    [router, onClose]
  );

  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setQuery("");
      setSelectedIndex(0);
      setDynamicResults([]);
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();

    if (searchAbortRef.current) {
      window.clearTimeout(searchAbortRef.current);
      searchAbortRef.current = null;
    }

    if (!trimmed) {
      setDynamicResults([]);
      setIsLoading(false);
      setSelectedIndex(0);
      return;
    }

    setIsLoading(true);

    searchAbortRef.current = window.setTimeout(async () => {
      try {
        const results = await searchApi.globalSearch(trimmed, user?.tenantId, 6);
        const mappedItems: SearchItem[] = [];

        if (results.solicitacoes && results.solicitacoes.length > 0) {
          results.solicitacoes.forEach((s) => {
            const st = formatSearchStatus(s.status);
            const budgetFormatted = s.totalBudget
              ? ` • ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.totalBudget)}`
              : "";
            mappedItems.push({
              id: `pr-${s.id}`,
              category: "Solicitações",
              title: `${s.code} - ${s.description}`,
              description: `Solicitante: ${s.requesterName || "Não informado"}${budgetFormatted}`,
              url: s.url,
              icon: "file-01",
              status: st.label,
              badgeVariant: st.variant,
            });
          });
        }

        if (results.rfqs && results.rfqs.length > 0) {
          results.rfqs.forEach((q) => {
            const st = formatSearchStatus(q.status);
            const deadline = q.closesAt
              ? ` • Encerra em ${new Date(q.closesAt).toLocaleDateString("pt-BR")}`
              : "";
            mappedItems.push({
              id: `rfq-${q.id}`,
              category: "Cotações (RFQs)",
              title: `${q.code} - ${q.title}`,
              description: `Cotação de Mercado${deadline}`,
              url: q.url,
              icon: "send-03",
              status: st.label,
              badgeVariant: st.variant,
            });
          });
        }

        if (results.pedidos && results.pedidos.length > 0) {
          results.pedidos.forEach((p) => {
            const st = formatSearchStatus(p.status);
            const totalFormatted = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(p.totalValue || 0);
            const dateFormatted = p.createdAt
              ? ` • ${new Date(p.createdAt).toLocaleDateString("pt-BR")}`
              : "";
            mappedItems.push({
              id: `po-${p.id}`,
              category: "Pedidos de Compra",
              title: `${p.code} - ${p.supplierName}`,
              description: `Valor Total: ${totalFormatted}${dateFormatted}`,
              url: p.url,
              icon: "clipboard-check",
              status: st.label,
              badgeVariant: st.variant,
            });
          });
        }

        if (results.fornecedores && results.fornecedores.length > 0) {
          results.fornecedores.forEach((f) => {
            const st = formatSearchStatus(f.status);
            const seg = f.segment ? ` • Segmento: ${f.segment}` : "";
            mappedItems.push({
              id: `sup-${f.id}`,
              category: "Fornecedores",
              title: f.tradeName || f.corporateName,
              description: `${f.cnpj}${seg}`,
              url: f.url,
              icon: "users-01",
              status: st.label,
              badgeVariant: st.variant,
            });
          });
        }

        setDynamicResults(mappedItems);
        setSelectedIndex(0);
      } catch (err) {
        setDynamicResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (searchAbortRef.current) {
        window.clearTimeout(searchAbortRef.current);
      }
    };
  }, [query, user?.tenantId]);

  const filteredStaticItems = useMemo(() => {
    if (!query.trim()) return STATIC_ITEMS;
    const lower = query.toLowerCase().trim();
    return STATIC_ITEMS.filter((item) => {
      const searchString = `${item.title} ${item.category} ${item.description}`.toLowerCase();
      return searchString.includes(lower);
    });
  }, [query]);

  const { itemsByCategory, flatItems } = useMemo(() => {
    const combined: SearchItem[] = [...dynamicResults, ...filteredStaticItems];
    const grouped: Partial<Record<SearchItem["category"], SearchItem[]>> = {};

    CATEGORY_ORDER.forEach((cat) => {
      const matches = combined.filter((item) => item.category === cat);
      if (matches.length > 0) {
        grouped[cat] = matches;
      }
    });

    const flat = Object.values(grouped).flat() as SearchItem[];
    return { itemsByCategory: grouped, flatItems: flat };
  }, [dynamicResults, filteredStaticItems]);

  const safeSelectedIndex = selectedIndex >= flatItems.length ? 0 : selectedIndex;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[safeSelectedIndex]) {
          handleSelect(flatItems[safeSelectedIndex]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, safeSelectedIndex, handleSelect, onClose]);

  useEffect(() => {
    if (itemsContainerRef.current) {
      const activeElement = itemsContainerRef.current.querySelector(
        `.${styles.selectedItem}`
      ) as HTMLElement;

      if (activeElement) {
        const container = itemsContainerRef.current;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeElement.offsetTop;
        const elemBottom = elemTop + activeElement.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [safeSelectedIndex]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Busca Global">
      <div
        className={styles.modal}
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.searchHeader}>
          <Icon name="search-md" className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Buscar solicitações, cotações, pedidos, fornecedores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Campo de busca"
          />
          {isLoading && (
            <div className={styles.loadingSpinnerWrapper} title="Buscando no banco de dados...">
              <div className={styles.loadingSpinner} />
            </div>
          )}
          <span className={styles.escShortcut}>ESC</span>
        </div>

        <div className={styles.resultsList} ref={itemsContainerRef}>
          {flatItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon name="alert-circle" size={32} />
              <h4 className={styles.emptyStateTitle}>Nenhum resultado encontrado</h4>
              <p className={styles.emptyStateText}>
                {query.trim()
                  ? `Não encontramos registros correspondentes a "${query.trim()}".`
                  : "Digite um termo para pesquisar ou utilize os atalhos abaixo."}
              </p>
            </div>
          ) : (
            renderGroupedItems(itemsByCategory, safeSelectedIndex, handleSelect)
          )}
        </div>

        <div className={styles.footerHelp}>
          <div className={styles.footerHelpItem}>
            <span className={styles.keyLabel}>↑↓</span> Navegar
          </div>
          <div className={styles.footerHelpItem}>
            <span className={styles.keyLabel}>↵ Enter</span> Acessar
          </div>
          <div className={styles.footerHelpItem}>
            <span className={styles.keyLabel}>ESC</span> Fechar
          </div>
          {flatItems.length > 0 && query.trim() && (
            <div className={styles.resultsCountBadge}>
              {flatItems.length} {flatItems.length === 1 ? "resultado" : "resultados"}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function renderGroupedItems(
  grouped: Partial<Record<SearchItem["category"], SearchItem[]>>,
  selectedIndex: number,
  onSelect: (item: SearchItem) => void
) {
  let linearIndex = 0;
  return Object.entries(grouped).map(([category, items]) => {
    if (!items || items.length === 0) return null;

    return (
      <div key={category} className={styles.categorySection}>
        <div className={styles.sectionTitle}>
          <span>{category}</span>
          <span className={styles.sectionCount}>{items.length}</span>
        </div>
        {items.map((item) => {
          const isSelected = selectedIndex === linearIndex;
          linearIndex++;

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.itemButton} ${isSelected ? styles.selectedItem : ""}`}
              onClick={() => onSelect(item)}
            >
              <div className={styles.itemContentLeft}>
                <div className={styles.itemIcon}>
                  <Icon name={item.icon} size={18} />
                </div>
                <div className={styles.itemTexts}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemDescription}>{item.description}</span>
                </div>
              </div>

              <div className={styles.itemContentRight}>
                {item.status && item.badgeVariant && (
                  <Badge variant={item.badgeVariant} className={styles.statusBadge}>
                    {item.status}
                  </Badge>
                )}
                {item.shortcut && (
                  <span className={styles.itemShortcut}>{item.shortcut}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  });
}
