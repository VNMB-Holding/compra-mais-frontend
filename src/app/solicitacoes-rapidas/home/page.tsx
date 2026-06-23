"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import styles from "./home.module.css";

const recentItems = [
  { id: 1, title: "Pneu Trator 420/90R30", date: "Hoje, 09:14", status: "andamento" },
  { id: 2, title: "Filtro de óleo hidráulico", date: "Ontem, 14:30", status: "pendente" },
  { id: 3, title: "Correia dentada motor", date: "20 Jun", status: "concluido" },
];

const statusLabel: Record<string, string> = {
  andamento: "Em andamento",
  pendente: "Pendente",
  concluido: "Concluído",
};

export default function HomeRapidaPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Usuário";

  return (
    <div className={styles.page}>
      {/* Welcome Title */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>Olá, {firstName}</h1>
        <p className={styles.welcomeSubtitle}>Painel de solicitações rápidas</p>
      </div>

      {/* Main CTA */}
      <Link href="/solicitacoes-rapidas/nova" className={styles.ctaCard}>
        <div className={styles.ctaText}>
          <span className={styles.ctaTitle}>Nova solicitação</span>
          <span className={styles.ctaDescription}>Solicite itens de forma rápida e simplificada</span>
        </div>
        <div className={styles.ctaArrow}>
          <Icon name="arrow-right" size={20} />
        </div>
      </Link>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>2</span>
          <span className={styles.statLabel}>Em andamento</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>15</span>
          <span className={styles.statLabel}>Concluídas</span>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Solicitações recentes</h2>
          <Link href="/solicitacoes-rapidas/minhas" className={styles.seeAllLink}>
            Ver todas
          </Link>
        </div>

        <div className={styles.recentList}>
          {recentItems.map((item) => (
            <div key={item.id} className={styles.recentItemCard}>
              <div className={styles.recentDetails}>
                <h3 className={styles.recentItemTitle}>{item.title}</h3>
                <span className={styles.recentItemMeta}>{item.date}</span>
              </div>
              <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
