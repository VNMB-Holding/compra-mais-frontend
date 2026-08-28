"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import styles from "./error.module.css";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.accentBar} style={{ background: "linear-gradient(90deg, #007d79 0%, #0d9488 100%)" }} />
        
        <div className={styles.cardBody}>
          <div className={styles.iconWrapper} style={{ background: "#f0fdf9", borderColor: "#ccfbf1", color: "#007d79" }}>
            <Icon name="search-refraction" className={styles.icon} />
          </div>

          <div className={styles.badgeWrapper}>
            <span className={styles.errorBadge} style={{ background: "#f0fdf9", color: "#007d79", borderColor: "#ccfbf1" }}>
              <Icon name="file-x-02" size={13} /> Página Não Encontrada · 404
            </span>
          </div>

          <h2 className={styles.title}>Página não localizada</h2>
          <p className={styles.description}>
            O endereço que você tentou acessar não existe, foi alterado ou está temporariamente indisponível.
          </p>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => router.push("/dashboard")}>
              <Icon name="home-01" /> Voltar ao Dashboard
            </Button>
            <Button variant="secondary" onClick={() => router.back()}>
              <Icon name="arrow-left" /> Voltar à página anterior
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
