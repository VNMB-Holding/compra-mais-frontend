"use client";

import React, { useState, useRef, useEffect } from "react";
import Icon from "../Icon/Icon";
import styles from "./Topbar.module.css";

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ isSidebarCollapsed, onToggleSidebar }: TopbarProps) {
  // Estados para controlar os Popups/Dropdowns
  const [activePopup, setActivePopup] = useState<"notifications" | "messages" | "company" | null>(null);

  const topbarRef = useRef<HTMLHeadingElement>(null);

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

  const togglePopup = (popup: "notifications" | "messages" | "company") => {
    setActivePopup(activePopup === popup ? null : popup);
  };

  return (
    <header className={styles.topbar} ref={topbarRef}>
      {/* Esquerda: Botão Hambúrguer */}
      <div className={styles.topbarLeft}>
        <button 
          className={styles.toggleSidebarBtn} 
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Icon name="menu-01" />
        </button>
      </div>

      {/* Centro: Barra de Busca */}
      <div className={styles.searchBar}>
        <Icon name="search-md" />
        <input type="text" placeholder="Buscar no sistema..." />
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

        {/* Avatar do Usuário */}
        <div className={styles.userAvatarSmall}>V</div>
      </div>
    </header>
  );
}