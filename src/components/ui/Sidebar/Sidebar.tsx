"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Sidebar.module.css";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isCollapsed?: boolean;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  // Menu para solicitantes (fazenda)
  const solicitanteMenu = (
    <>
      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>MINHAS SOLICITAÇÕES</div>
        <Link href="/solicitacoes-rapidas/nova" className={`${styles.navItem} ${isActive("/solicitacoes-rapidas/nova") ? styles.active : ""}`}>
          <Icon name="clipboard" />
          {!isCollapsed && "Solicitações"}
        </Link>
      </div>
    </>
  );

  // Menu para procuristas e gerentes
  const procuristMenu = (
    <>
      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>COMPRAS</div>
        <Link href="/compras/solicitacoes" className={`${styles.navItem} ${isActive("/compras/solicitacoes") ? styles.active : ""}`}>
          <Icon name="clipboard" />
          {!isCollapsed && "Solicitações"}
        </Link>
        <Link href="/compras/rfqs" className={`${styles.navItem} ${isActive("/compras/rfqs") ? styles.active : ""}`}>
          <Icon name="receipt-check" />
          {!isCollapsed && "RFQs / Cotações"}
        </Link>
        <Link href="/compras/pedidos" className={`${styles.navItem} ${isActive("/compras/pedidos") ? styles.active : ""}`}>
          <Icon name="shopping-cart-01" />
          {!isCollapsed && "Pedidos de Compra"}
        </Link>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>FORNECEDORES</div>
        <Link href="/fornecedores/diretorio" className={`${styles.navItem} ${isActive("/fornecedores/diretorio") ? styles.active : ""}`}>
          <Icon name="users-01" />
          {!isCollapsed && "Diretório"}
        </Link>
        <Link href="/fornecedores/homologacao" className={`${styles.navItem} ${isActive("/fornecedores/homologacao") ? styles.active : ""}`}>
          <Icon name="check-verified-01" />
          {!isCollapsed && "Homologação"}
        </Link>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>ANALYTICS</div>
        <Link href="/analytics/insights" className={`${styles.navItem} ${isActive("/analytics/insights") ? styles.active : ""}`}>
          <Icon name="presentation-chart-01" />
          {!isCollapsed && "Insights"}
        </Link>
        <Link href="/analytics/relatorios" className={`${styles.navItem} ${isActive("/analytics/relatorios") ? styles.active : ""}`}>
          <Icon name="bar-chart-01" />
          {!isCollapsed && "Relatórios"}
        </Link>
        <Link href="/analytics/economia" className={`${styles.navItem} ${isActive("/analytics/economia") ? styles.active : ""}`}>
          <Icon name="piggy-bank-01" />
          {!isCollapsed && "Economia Gerada"}
        </Link>
      </div>
    </>
  );

  return (
    <aside className={`${styles.mainNav} ${isCollapsed ? styles.collapsed : ""}`}>

      <div className={styles.logoArea}>
        <img 
          src={isCollapsed ? "/images/carrinho-logo.png" : "/images/logo-compra-mais.svg"} 
          alt="Logo" 
          className={styles.logoImg} 
        />
      </div>

      <div className={styles.navContent}>
        <Link 
          href="/dashboard" 
          className={`${styles.navItem} ${isActive("/dashboard") ? styles.active : ""}`}
        >
          <Icon name="layout-grid-01" />
          {!isCollapsed && "Dashboard"}
        </Link>

        {user?.role === "solicitante" ? solicitanteMenu : procuristMenu}
      </div>

      <div className={styles.sidebarFooter}>
        {!isCollapsed && (
          <div className={styles.helpCard}>
            <Icon name="help-circle" className={styles.helpIcon} />
            <div className={styles.helpText}>
              <strong>Precisa de ajuda?</strong>
              <span>Central de Ajuda</span>
            </div>
          </div>
        )}

        <div className={styles.userProfile}>
          <div 
            className={styles.avatar}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
            }}
            title={user?.name}
          >
            {user?.name
              ?.split(" ")
              .map((word) => word[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <strong>{user?.name || "Usuário"}</strong>
              <span>{user?.role === "solicitante" ? "Solicitante" : "Procurista"}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
