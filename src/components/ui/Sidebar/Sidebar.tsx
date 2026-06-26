"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../Icon/Icon";
import styles from "./Sidebar.module.css";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isCollapsed?: boolean;
  onHelpClick?: () => void;
}

export default function Sidebar({ isCollapsed = false, onHelpClick }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  const solicitanteMenu = (
    <>
      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>MINHAS SOLICITAÇÕES</div>
        <Link href="/solicitacoes-rapidas/nova" className={`${styles.navItem} ${isActive("/solicitacoes-rapidas/nova") ? styles.active : ""}`}>
          <Icon name="clipboard" />
          <span className={styles.navText}>Solicitações</span>
        </Link>
      </div>
    </>
  );

  const procuristMenu = (
    <>
      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>COMPRAS</div>
        <Link href="/compras/solicitacoes" className={`${styles.navItem} ${isActive("/compras/solicitacoes") ? styles.active : ""}`}>
          <Icon name="clipboard" />
          <span className={styles.navText}>Solicitações</span>
        </Link>
        <Link href="/compras/rfqs" className={`${styles.navItem} ${isActive("/compras/rfqs") ? styles.active : ""}`}>
          <Icon name="receipt-check" />
          <span className={styles.navText}>RFQs / Cotações</span>
        </Link>
        <Link href="/compras/pedidos" className={`${styles.navItem} ${isActive("/compras/pedidos") ? styles.active : ""}`}>
          <Icon name="shopping-cart-01" />
          <span className={styles.navText}>Pedidos de Compra</span>
        </Link>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>FORNECEDORES</div>
        <Link href="/fornecedores/diretorio" className={`${styles.navItem} ${isActive("/fornecedores/diretorio") ? styles.active : ""}`}>
          <Icon name="users-01" />
          <span className={styles.navText}>Diretório</span>
        </Link>
        <Link href="/fornecedores/homologacao" className={`${styles.navItem} ${isActive("/fornecedores/homologacao") ? styles.active : ""}`}>
          <Icon name="check-verified-01" />
          <span className={styles.navText}>Homologação</span>
        </Link>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>ANALYTICS</div>
        <Link href="/analytics/spend" className={`${styles.navItem} ${isActive("/analytics/spend") ? styles.active : ""}`}>
          <Icon name="coins-02" />
          <span className={styles.navText}>Análise de Spend</span>
        </Link>
        <Link href="/analytics/economia" className={`${styles.navItem} ${isActive("/analytics/economia") ? styles.active : ""}`}>
          <Icon name="piggy-bank-01" />
          <span className={styles.navText}>Economia Gerada</span>
        </Link>
      </div>
    </>
  );

  return (
    <aside className={`${styles.mainNav} ${isCollapsed ? styles.collapsed : ""}`}>

      <div className={styles.logoArea}>
        <img
          src="/images/logo-compra-mais.svg"
          alt="Logo"
          className={`${styles.logoImg} ${styles.fullLogo}`}
        />
        <img
          src="/images/carrinho-logo.png"
          alt="Logo"
          className={`${styles.logoImg} ${styles.collapsedLogo}`}
        />
      </div>

      <div className={styles.navContent}>
        <Link
          href="/dashboard"
          className={`${styles.navItem} ${isActive("/dashboard") ? styles.active : ""}`}
        >
          <Icon name="layout-grid-01" />
          <span className={styles.navText}>Dashboard</span>
        </Link>

        {user?.role === "solicitante" ? solicitanteMenu : procuristMenu}

        {user?.role === "admin" && (
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>SISTEMA</div>
            <Link href="/administracao" className={`${styles.navItem} ${isActive("/administracao") ? styles.active : ""}`}>
              <Icon name="settings-01" />
              <span className={styles.navText}>Administração</span>
            </Link>
          </div>
        )}
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.helpCard} onClick={onHelpClick}>
          <Icon name="help-circle" className={styles.helpIcon} />
          <div className={styles.helpText}>
            <strong>Precisa de ajuda?</strong>
            <span>Central de Ajuda</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
