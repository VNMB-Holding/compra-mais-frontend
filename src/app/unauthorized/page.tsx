"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import styles from "./unauthorized.module.css";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <Icon name="lock-01" size={32} />
        </div>

        <div className={styles.badgeWrapper}>
          <span className={styles.statusBadge}>
            <Icon name="shield-tick" size={13} /> Segurança & Alçadas
          </span>
        </div>

        <h1>Acesso restrito</h1>
        <p>
          Seu usuário não possui as permissões necessárias para acessar este módulo. Se acredita que isto é um erro, contate o administrador da plataforma Compra+.
        </p>

        <div className={styles.actions}>
          <Button variant="primary" onClick={() => router.push("/dashboard")}>
            <Icon name="home-01" /> Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
}
