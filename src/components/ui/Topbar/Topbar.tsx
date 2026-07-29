"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Topbar.module.css";
import { useAuth } from "@/hooks/useAuth";
import CommandPalette from "../CommandPalette/CommandPalette";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ isSidebarCollapsed, onToggleSidebar }: TopbarProps) {
  // Estados para controlar os Popups/Dropdowns
  const [activePopup, setActivePopup] = useState<"notifications" | "messages" | "company" | "user" | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const router = useRouter();

  // Dados reais da API para notificações e mensagens
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string }>>([]);
  const [messages, setMessages] = useState<Array<{ id: string; title: string; desc: string; time: string }>>([]);

  useEffect(() => {
    if (user?.tenantName) {
      setSelectedCompany(user.tenantName.toUpperCase());
    } else {
      setSelectedCompany("VNMB HOLDING");
    }
  }, [user]);

  // Carrega notificações e mensagens reais baseadas em RFQs recentes e Solicitações pendentes
  useEffect(() => {
    async function loadNotifications() {
      try {
        const [recentRfqs, pendingRequests] = await Promise.all([
          rfqsApi.list().catch(() => []),
          purchaseRequestsApi.list().catch(() => []),
        ]);

        const notifs = recentRfqs.slice(0, 3).map((rfq: Rfq) => ({
          id: rfq.id,
          title: `RFQ ${rfq.code} — ${rfq.status === "Open" ? "Em andamento" : "Atualizada"}`,
          desc: rfq.title || rfq.purchaseRequest?.description || "Processo de cotação ativo.",
          time: new Date(rfq.createdAt).toLocaleDateString("pt-BR"),
        }));

        const msgs = pendingRequests
          .filter((pr: PurchaseRequest) => pr.status === "AwaitingApproval")
          .slice(0, 3)
          .map((req: PurchaseRequest) => ({
            id: req.id,
            title: `Aprovação Pendente: ${req.code}`,
            desc: req.description,
            time: new Date(req.createdAt).toLocaleDateString("pt-BR"),
          }));

        setNotifications(notifs);
        setMessages(msgs);
      } catch (err) {
        console.error("Erro ao carregar dados da Topbar:", err);
      }
    }

    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const getAvailableCompanies = () => {
    return user?.availableTenants || [
      { id: "1", name: "VNMB HOLDING", type: "Matriz" as const },
      { id: "2", name: "VB AGROEXPORT", type: "Filial" as const },
      { id: "3", name: "VB AGRO - PAULÍNIA", type: "Filial" as const },
      { id: "4", name: "MINERADORA OURO PRETO", type: "Filial" as const },
    ];
  };

  const availableCompanies = getAvailableCompanies();
  const canSwitchCompany = availableCompanies.length > 1;

  const topbarRef = useRef<HTMLHeadingElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Fecha os popups se o usuário clicar fora da Topbar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topbarRef.current && !topbarRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);
  const [hasUnreadMsgs, setHasUnreadMsgs] = useState(true);

  const togglePopup = (popup: "notifications" | "messages" | "company" | "user") => {
    if (activePopup === popup) {
      setActivePopup(null);
    } else {
      setActivePopup(popup);
      if (popup === "notifications") {
        setHasUnreadNotifs(false);
      }
      if (popup === "messages") {
        setHasUnreadMsgs(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user?.name || "Ana Lima";
  const userEmail = user?.email || "ana.lima@empresa.com";
  const userRole = user?.role === "admin" ? "Administrador" : user?.role === "gerente" ? "Gerente" : user?.role === "procurist" ? "Comprador" : "Solicitante";

  return (
    <header className={styles.topbar} ref={topbarRef}>
      {/* Esquerda: Botão Hambúrguer */}
      <div className={styles.topbarLeft}>
        <button 
          className={styles.toggleSidebarBtn} 
          onClick={onToggleSidebar}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Icon 
            name={
              isSidebarCollapsed 
                ? (isHovered ? "leftbar-right" : "leftbar") 
                : (isHovered ? "leftbar-left" : "leftbar")
            } 
          />
        </button>
      </div>

      {/* Centro: Barra de Busca */}
      <div className={styles.searchBar} onClick={() => setIsPaletteOpen(true)}>
        <Icon name="search-md" />
        <span className={styles.searchPlaceholder}>
          Buscar no sistema... <span className={styles.searchShortcut}>⌘K</span>
        </span>
      </div>

      {/* Direita: Ações e Dropdowns */}
      <div className={styles.topbarRight}>
        
        {/* Notificações */}
        <div className={styles.popupWrapper}>
          <div className={`${styles.iconBtn} ${activePopup === "notifications" ? styles.activeIcon : ""}`} onClick={() => togglePopup("notifications")}>
            <Icon name="bell-01" />
            {hasUnreadNotifs && notifications.length > 0 && <span className={styles.badge}>{notifications.length}</span>}
          </div>
          
          {activePopup === "notifications" && (
            <div className={styles.dropdownBox}>
              <div className={styles.dropdownHeader}>Notificações ({notifications.length})</div>
              <div className={styles.dropdownContent}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setActivePopup(null);
                        router.push(`/compras/rfqs/${n.id}`);
                      }}
                    >
                      <strong>{n.title}</strong>
                      <p>{n.desc}</p>
                      <small>{n.time}</small>
                    </div>
                  ))
                ) : (
                  <div className={styles.dropdownItem}>
                    <p style={{ margin: 0, color: "#64748b" }}>Nenhuma notificação recente.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mensagens / E-mails */}
        <div className={styles.popupWrapper}>
          <div className={`${styles.iconBtn} ${activePopup === "messages" ? styles.activeIcon : ""}`} onClick={() => togglePopup("messages")}>
            <Icon name="mail-01" />
            {hasUnreadMsgs && messages.length > 0 && <span className={styles.badge}>{messages.length}</span>}
          </div>

          {activePopup === "messages" && (
            <div className={styles.dropdownBox}>
              <div className={styles.dropdownHeader}>Pendências de Aprovação ({messages.length})</div>
              <div className={styles.dropdownContent}>
                {messages.length > 0 ? (
                  messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setActivePopup(null);
                        router.push(`/compras/solicitacoes/${m.id}`);
                      }}
                    >
                      <strong>{m.title}</strong>
                      <p>{m.desc}</p>
                      <small>{m.time}</small>
                    </div>
                  ))
                ) : (
                  <div className={styles.dropdownItem}>
                    <p style={{ margin: 0, color: "#64748b" }}>Sem solicitações pendentes.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Seletor de Empresa */}
        <div className={styles.popupWrapper}>
          <div 
            className={styles.companySelector} 
            onClick={() => canSwitchCompany && togglePopup("company")}
            style={{ cursor: canSwitchCompany ? "pointer" : "default" }}
          >
            {selectedCompany || "EMPRESA"}
            {canSwitchCompany && (
              <Icon name="chevron-down" className={activePopup === "company" ? styles.rotate : ""} />
            )}
          </div>

          {canSwitchCompany && activePopup === "company" && (
            <div className={`${styles.dropdownBox} ${styles.companyDropdown}`}>
              {/* Matriz section */}
              {availableCompanies.some((c) => c.type === "Matriz") && (
                <>
                  <div className={styles.companyDropdownSectionHeader}>Matriz</div>
                  {availableCompanies
                    .filter((c) => c.type === "Matriz")
                    .map((company) => (
                      <div 
                        key={company.id}
                        className={selectedCompany === company.name.toUpperCase() ? styles.dropdownItemActive : styles.dropdownItem}
                        onClick={() => {
                          setSelectedCompany(company.name.toUpperCase());
                          setActivePopup(null);
                        }}
                      >
                        {selectedCompany === company.name.toUpperCase() && <Icon name="check" />} {company.name.toUpperCase()}
                      </div>
                    ))}
                </>
              )}

              {/* Filiais section */}
              {availableCompanies.some((c) => c.type === "Filial") && (
                <>
                  <div className={styles.companyDropdownSectionHeader}>Filiais</div>
                  {availableCompanies
                    .filter((c) => c.type === "Filial")
                    .map((company) => (
                      <div 
                        key={company.id}
                        className={selectedCompany === company.name.toUpperCase() ? styles.dropdownItemActive : styles.dropdownItem}
                        onClick={() => {
                          setSelectedCompany(company.name.toUpperCase());
                          setActivePopup(null);
                        }}
                      >
                        {selectedCompany === company.name.toUpperCase() && <Icon name="check" />} {company.name.toUpperCase()}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Avatar do Usuário com Dropdown */}
        <div className={styles.popupWrapper}>
          <div 
            className={styles.userAvatarSmall}
            onClick={() => togglePopup("user")}
            title={userName}
            style={{ cursor: "pointer" }}
          >
            {getInitials(userName)}
          </div>

          {activePopup === "user" && (
            <div className={`${styles.dropdownBox} ${styles.userDropdown}`}>
              <div className={styles.dropdownUserHeader}>
                <div className={styles.userAvatarLarge}>
                  {getInitials(userName)}
                </div>
                <div>
                  <strong>{userName}</strong>
                  <p>{userEmail}</p>
                  <small>{userRole}</small>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownItem} onClick={() => { setActivePopup(null); router.push("/perfil"); }}>
                <Icon name="user" /> Meu Perfil
              </div>
              <div className={styles.dropdownItem} onClick={() => { setActivePopup(null); router.push("/administracao"); }}>
                <Icon name="settings-01" /> Administração & Permissões
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownItem} onClick={handleLogout} style={{ color: "#ef4444" }}>
                <Icon name="log-out-01" /> Sair
              </div>
            </div>
          )}
        </div>

      </div>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </header>
  );
}