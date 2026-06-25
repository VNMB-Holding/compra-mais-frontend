"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./CommandPalette.module.css";

interface SearchItem {
  id: string;
  title: string;
  category: "Ações" | "Páginas";
  description: string;
  url: string;
  icon: string;
  shortcut?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Ações
  { id: "action-new-sol", title: "Criar Nova Solicitação de Compra", category: "Ações", description: "Iniciar uma nova demanda de compra interna", url: "/compras/solicitacoes/nova", icon: "shopping-cart-01", shortcut: "↵" },
  { id: "action-new-supplier", title: "Cadastrar Novo Fornecedor", category: "Ações", description: "Cadastrar fornecedor e iniciar homologação", url: "/fornecedores/novo", icon: "plus", shortcut: "↵" },
  { id: "action-new-rfq", title: "Criar Novo Processo de Cotação (RFQ)", category: "Ações", description: "Lançar cotação ao mercado para fornecedores", url: "/compras/rfqs/nova", icon: "send-01", shortcut: "↵" },
  { id: "action-export-reports", title: "Exportar Relatórios de Compras", category: "Ações", description: "Exportar dados de saving e performance em Excel/PDF", url: "/analytics/insights", icon: "download-01" },
  { id: "action-check-contracts", title: "Análise Jurídica de Contratos", category: "Ações", description: "Verificar pendências de assinatura e documentação", url: "/fornecedores/homologacao", icon: "shield-01" },
  { id: "action-active-orders", title: "Ver Pedidos em Andamento", category: "Ações", description: "Acompanhar recebimento e entregas de insumos", url: "/compras/pedidos", icon: "truck-01" },
  { id: "action-profile-settings", title: "Configurações da Conta", category: "Ações", description: "Gerenciar preferências, senha e dados do usuário", url: "/perfil", icon: "settings-01" },
  { id: "action-system-help", title: "Suporte & Central de Ajuda", category: "Ações", description: "Falar com nosso time de atendimento ou ler tutoriais", url: "/dashboard", icon: "help-circle" },
  { id: "action-change-subsidiary", title: "Alternar Unidade de Negócio", category: "Ações", description: "Mudar filial de VNMB Holding para VNMB Logística", url: "/dashboard", icon: "refresh-cw-01" },
  
  // Páginas
  { id: "page-dashboard", title: "Dashboard Principal", category: "Páginas", description: "Visão geral de cotações, solicitações e KPIs", url: "/dashboard", icon: "home-01" },
  { id: "page-suppliers-list", title: "Base de Fornecedores", category: "Páginas", description: "Diretório de parceiros e notas de performance", url: "/fornecedores/diretorio", icon: "users-01" },
  { id: "page-homologation", title: "Fila de Homologação", category: "Páginas", description: "Status de homologação e análise jurídica", url: "/fornecedores/homologacao", icon: "shield-01" },
  { id: "page-sols", title: "Solicitações de Compra", category: "Páginas", description: "Lista de demandas de compra internas", url: "/compras/solicitacoes", icon: "list" },
  { id: "page-rfqs", title: "Processos de Cotação (RFQs)", category: "Páginas", description: "Listagem de RFQs ativas e propostas", url: "/compras/rfqs", icon: "send-03" },
  { id: "page-orders", title: "Pedidos de Compra", category: "Páginas", description: "Ordens de compra enviadas para fornecedores", url: "/compras/pedidos", icon: "clipboard-check" },
  { id: "page-insights", title: "Insights & Analytics", category: "Páginas", description: "Métricas de compras, prazos e KPIs", url: "/analytics/insights", icon: "presentation-chart-01" },
  { id: "page-reports", title: "Relatórios Exportáveis", category: "Páginas", description: "Filtros customizados e relatórios consolidados", url: "/analytics/relatorios", icon: "bar-chart-01" },
  { id: "page-savings", title: "Painel de Economia Gerada (Saving)", category: "Páginas", description: "Savings absoluto, percentual e histórico", url: "/analytics/economia", icon: "piggy-bank-01" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter items based on query
  const filteredItems = SEARCH_ITEMS.filter((item) => {
    const searchString = `${item.title} ${item.category} ${item.description}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  // Group items by category for rendering, but maintain linear array for selectedIndex mapping
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  // Flattened array representing the exact visual layout order
  const flatItems = Object.values(itemsByCategory).flat();

  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(0);
    }
  }, [flatItems.length, selectedIndex]);

  // Handle Keyboard Navigation inside palette
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
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex]);

  // Auto-scroll to selected element inside result list
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
  }, [selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    router.push(item.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className={styles.searchHeader}>
          <Icon name="search-md" className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Buscar atalhos, fornecedores, páginas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.escShortcut}>ESC</span>
        </div>

        {/* Results List */}
        <div className={styles.resultsList} ref={itemsContainerRef}>
          {flatItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon name="alert-circle" size={32} />
              <h4 className={styles.emptyStateTitle}>Nenhum resultado encontrado</h4>
              <p className={styles.emptyStateText}>Tente buscar por termos diferentes ou confira a grafia.</p>
            </div>
          ) : (
            letIndexOffsetCounter(itemsByCategory, flatItems, selectedIndex, handleSelect)
          )}
        </div>

        {/* Footer shortcuts help bar */}
        <div className={styles.footerHelp}>
          <div className={styles.footerHelpItem}>
            <span className={styles.keyLabel}>↑↓</span> Navegar
          </div>
          <div className={styles.footerHelpItem}>
            <span className={styles.keyLabel}>↵ Enter</span> Selecionar
          </div>
          <div className={styles.footerHelpItem}>
            <span className={styles.keyLabel}>ESC</span> Fechar
          </div>
        </div>

      </div>
    </div>
  );
}

// Render helper to correctly map selectedIndex linearly across grouped items
function letIndexOffsetCounter(
  grouped: Record<string, SearchItem[]>,
  flatList: SearchItem[],
  selectedIndex: number,
  onSelect: (item: SearchItem) => void
) {
  let linearIndex = 0;
  return Object.entries(grouped).map(([category, items]) => (
    <React.Fragment key={category}>
      <div className={styles.sectionTitle}>{category}</div>
      {items.map((item) => {
        const isSelected = selectedIndex === linearIndex;
        const currentIndex = linearIndex;
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
            {item.shortcut && (
              <span className={styles.itemShortcut}>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </React.Fragment>
  ));
}
