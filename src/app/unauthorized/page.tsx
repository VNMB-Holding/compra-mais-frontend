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
          <Icon name="lock" size={64} />
        </div>

        <h1>Acesso negado</h1>
        <p>
          Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em contato com o administrador.
        </p>

        <div className={styles.actions}>
          <Button variant="primary" onClick={() => router.push("/dashboard")}>
            <Icon name="chevron-left" /> Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}
