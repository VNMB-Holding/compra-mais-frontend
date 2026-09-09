"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Topbar.module.css";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import CommandPalette from "../CommandPalette/CommandPalette";
import { notificationsApi, NotificationItem } from "@/lib/api/notifications";
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
  const router = useRouter();
  const companyDisplay = user?.tenantName?.toUpperCase() || "NÃO INFORMADO";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [messages, setMessages] = useState<Array<{ id: string; title: string; desc: string; time: string }>>([]);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.items);
      setUnreadNotifCount(res.unreadCount);
    } catch (err) {
      logError("Topbar/notificationsApi.list", err);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const pendingRequests = await purchaseRequestsApi.list().catch(() => [] as PurchaseRequest[]);
      const msgs = pendingRequests
        .filter((pr: PurchaseRequest) => pr.status === "AwaitingApproval")
        .slice(0, 5)
        .map((req: PurchaseRequest) => ({
          id: req.id,
          title: `Aprovação Pendente: ${req.code}`,
          desc: req.description,
          time: new Date(req.createdAt).toLocaleDateString("pt-BR"),
        }));
      setMessages(msgs);
    } catch (err) {
      logError("Topbar/loadPendingApprovals", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadPendingApprovals();

      // Polling leve a cada 45s para notificações em tempo real
      const interval = setInterval(() => {
        loadNotifications();
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      notificationsApi.markAsRead(notif.id).catch(() => {});
    }
    setActivePopup(null);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifCount(0);
    notificationsApi.markAllAsRead().catch(() => {});
  };

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

  const userName = user?.name || "Usuário";
  const userEmail = user?.email || "";
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
            {unreadNotifCount > 0 && <span className={styles.badge}>{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>}
          </div>
          
          {activePopup === "notifications" && (
            <div className={styles.dropdownBox}>
              <div className={styles.dropdownHeader}>
                <span>Notificações {unreadNotifCount > 0 ? `(${unreadNotifCount} novas)` : ""}</span>
                {unreadNotifCount > 0 && (
                  <button className={styles.markAllReadBtn} onClick={handleMarkAllRead}>
                    Marcar todas lidas
                  </button>
                )}
              </div>
              <div className={styles.dropdownContent}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`${styles.dropdownItem} ${!n.read ? styles.unreadItem : ""}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className={styles.itemHeaderRow}>
                        <strong>{n.title}</strong>
                        {!n.read && <span className={styles.unreadDot} title="Não lida" />}
                      </div>
                      <p>{n.desc}</p>
                      <small>{new Date(n.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</small>
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

        {/* Empresa do perfil do usuário logado */}
        <div className={styles.companyBadgeWrapper}>
          <div className={styles.companyStaticBadge} title={`Empresa ativa: ${companyDisplay}`}>
            <Icon name="building-07" size={16} />
            <span className={styles.companyNameText}>{companyDisplay}</span>
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
              {/* Opção 'Meu Perfil' temporariamente oculta */}
              {/* <div className={styles.dropdownItem} onClick={() => { setActivePopup(null); router.push("/perfil"); }}>
                <Icon name="user" /> Meu Perfil
              </div>
              <div className={styles.dropdownDivider} /> */}
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