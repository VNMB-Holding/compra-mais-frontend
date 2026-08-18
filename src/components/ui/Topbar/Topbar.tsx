"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Topbar.module.css";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import CommandPalette from "../CommandPalette/CommandPalette";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { logError } from "@/lib/utils/error";

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ isSidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const [activePopup, setActivePopup] = useState<"notifications" | "messages" | "company" | "user" | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const userTenant = user?.availableTenants?.find((t) => t.id === user.tenantId);
  const companyDisplay = user?.tenantName?.toUpperCase() || userTenant?.name?.toUpperCase() || "NÃO INFORMADO";

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string }>>([]);
  const [messages, setMessages] = useState<Array<{ id: string; title: string; desc: string; time: string }>>([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const [recentRfqs, pendingRequests] = await Promise.all([
          rfqsApi.list().catch((err) => { 
            logError("Topbar/rfqsApi.list", err); 
            toast({ variant: "warning", title: "Aviso", message: "Não foi possível carregar as notificações de cotações." });
            return [] as Rfq[]; 
          }),
          purchaseRequestsApi.list().catch((err) => { 
            logError("Topbar/purchaseRequestsApi.list", err); 
            toast({ variant: "warning", title: "Aviso", message: "Não foi possível carregar as aprovações pendentes." });
            return [] as PurchaseRequest[]; 
          }),
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
        // Unexpected error not caught by individual handlers — log and degrade gracefully
        logError("Topbar/loadNotifications", err);
      }
    }

    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const getAvailableCompanies = () => {
    return user?.availableTenants || [];
  };

  const availableCompanies = getAvailableCompanies();
  const canSwitchCompany = availableCompanies.length > 1;

  const topbarRef = useRef<HTMLHeadingElement>(null);

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

      
      <div className={styles.searchBar} onClick={() => setIsPaletteOpen(true)}>
        <Icon name="search-md" />
        <span className={styles.searchPlaceholder}>
          Buscar no sistema... <span className={styles.searchShortcut}>⌘K</span>
        </span>
      </div>

      
      <div className={styles.topbarRight}>
        
        
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
                    <p className={styles.emptyStateText}>Nenhuma notificação recente.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        
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
                    <p className={styles.emptyStateText}>Sem solicitações pendentes.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Display static company name */}
        <div className={styles.popupWrapper}>
          <div className={`${styles.companySelector} ${styles.companyStatic}`}>
            <Icon name="building-07" />
            {companyDisplay}
          </div>
        </div>

        
        <div className={styles.popupWrapper}>
          <div 
            className={`${styles.userAvatarSmall} ${styles.avatarBtn}`}
            onClick={() => togglePopup("user")}
            title={userName}
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
              <div className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
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