"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Topbar.module.css";
import { useAuth } from "@/hooks/useAuth";
import CommandPalette from "../CommandPalette/CommandPalette";

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
  const router = useRouter();

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

  const togglePopup = (popup: "notifications" | "messages" | "company" | "user") => {
    setActivePopup(activePopup === popup ? null : popup);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
            <span className={styles.badge}>3</span>
          </div>
          
          {activePopup === "notifications" && (
            <div className={styles.dropdownBox}>
              <div className={styles.dropdownHeader}>Notificações</div>
              <div className={styles.dropdownContent}>
                <div className={styles.dropdownItem}>
                  <strong>Nova RFQ criada</strong>
                  <p>RFQ-000128 - Óleo Diesel S10 precisa de aprovação.</p>
                  <small>Há 15 minutos</small>
                </div>
                <div className={styles.dropdownItem}>
                  <strong>Fornecedor homologado</strong>
                  <p>Texaco Brasil concluiu o cadastro.</p>
                  <small>Há 2 horas</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mensagens / E-mails */}
        <div className={styles.popupWrapper}>
          <div className={`${styles.iconBtn} ${activePopup === "messages" ? styles.activeIcon : ""}`} onClick={() => togglePopup("messages")}>
            <Icon name="mail-01" />
          </div>

          {activePopup === "messages" && (
            <div className={styles.dropdownBox}>
              <div className={styles.dropdownHeader}>Mensagens Recentes</div>
              <div className={styles.dropdownContent}>
                <div className={styles.dropdownItem}>
                  <strong>Breno Marques (Suprimentos)</strong>
                  <p>Poderia revisar as propostas da RFQ de motores?</p>
                  <small>Há 1 hora</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seletor de Empresa */}
        <div className={styles.popupWrapper}>
          <div className={styles.companySelector} onClick={() => togglePopup("company")}>
            VNMB HOLDING
            <Icon name="chevron-down" className={activePopup === "company" ? styles.rotate : ""} />
          </div>

          {activePopup === "company" && (
            <div className={`${styles.dropdownBox} ${styles.companyDropdown}`}>
              <div className={styles.dropdownItemActive}>
                <Icon name="check" /> VNMB HOLDING
              </div>
              <div className={styles.dropdownItem}>VNMB LOGÍSTICA</div>
              <div className={styles.dropdownItem}>VNMB SERVIÇOS</div>
            </div>
          )}
        </div>

        {/* Avatar do Usuário com Dropdown */}
        {isAuthenticated && user && (
          <div className={styles.popupWrapper}>
            <div 
              className={styles.userAvatarSmall}
              onClick={() => togglePopup("user")}
              title={user.name}
              style={{ cursor: "pointer" }}
            >
              {getInitials(user.name)}
            </div>

            {activePopup === "user" && (
              <div className={`${styles.dropdownBox} ${styles.userDropdown}`}>
                <div className={styles.dropdownUserHeader}>
                  <div className={styles.userAvatarLarge}>
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                    <small>{user.role}</small>
                  </div>
                </div>
                <div className={styles.dropdownDivider} />
                <div className={styles.dropdownItem} onClick={() => router.push("/perfil")}>
                  <Icon name="user" /> Meu Perfil
                </div>
                <div className={styles.dropdownItem} onClick={() => router.push("/configuracoes")}>
                  <Icon name="settings-01" /> Configurações
                </div>
                <div className={styles.dropdownDivider} />
                <div className={styles.dropdownItem} onClick={handleLogout} style={{ color: "#ef4444" }}>
                  <Icon name="log-out-01" /> Sair
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </header>
  );
}