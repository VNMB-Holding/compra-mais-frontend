"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
        <span className="material-symbols-outlined">dashboard</span>
          {!isCollapsed && "Dashboard"}
        </Link>

        <div className={styles.navSection}>
          <div className={styles.sectionTitle}>COMPRAS</div>
          <Link href="/compras/solicitacoes" className={`${styles.navItem} ${isActive("/compras/solicitacoes") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">description</span>
            {!isCollapsed && "Solicitações"}
          </Link>
          <Link href="/compras/rfqs" className={`${styles.navItem} ${isActive("/compras/rfqs") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            {!isCollapsed && "RFQs / Cotações"}
          </Link>
          <Link href="/compras/pedidos" className={`${styles.navItem} ${isActive("/compras/pedidos") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">shopping_cart</span>
            {!isCollapsed && "Pedidos de Compra"}
          </Link>
        </div>

        <div className={styles.navSection}>
          <div className={styles.sectionTitle}>FORNECEDORES</div>
          <Link href="/fornecedores/diretorio" className={`${styles.navItem} ${isActive("/fornecedores/diretorio") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">group</span>
            {!isCollapsed && "Diretório"}
          </Link>
          <Link href="/fornecedores/homologacao" className={`${styles.navItem} ${isActive("/fornecedores/homologacao") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">verified</span>
            {!isCollapsed && "Homologação"}
          </Link>
        </div>

        <div className={styles.navSection}>
          <div className={styles.sectionTitle}>ANALYTICS</div>
          <Link href="/analytics/insights" className={`${styles.navItem} ${isActive("/analytics/insights") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">insights</span>
            {!isCollapsed && "Insights"}
          </Link>
          <Link href="/analytics/relatorios" className={`${styles.navItem} ${isActive("/analytics/relatorios") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">bar_chart</span>
            {!isCollapsed && "Relatórios"}
          </Link>
          <Link href="/analytics/economia" className={`${styles.navItem} ${isActive("/analytics/economia") ? styles.active : ""}`}>
            <span className="material-symbols-outlined">savings</span>
            {!isCollapsed && "Economia Gerada"}
          </Link>
        </div>
      </div>

      <div className={styles.sidebarFooter}>
        {!isCollapsed && (
          <div className={styles.helpCard}>
            <span className={`material-symbols-outlined ${styles.helpIcon}`}>help</span>
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
