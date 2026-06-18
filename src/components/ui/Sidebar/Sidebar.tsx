"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isCollapsed?: boolean;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

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
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
            alt="Avatar" 
            className={styles.avatar} 
          />
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <strong>Breno Marques</strong>
              <span>Administrador</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
