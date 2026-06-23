"use client";

import React from "react";
import { Icon } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import styles from "./perfil.module.css";

export default function PerfilRapidoPage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.page}>
      {/* Gradient Banner */}
      <div className={styles.profileBanner}>
        {user?.avatar ? (
          <img src={user.avatar} alt="Avatar" className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <h1 className={styles.profileName}>{user?.name || "Usuário"}</h1>
        <p className={styles.profileRole}>Solicitante</p>
      </div>

      {/* Body floating over banner */}
      <div className={styles.body}>
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <div className={styles.infoIcon}>
              <Icon name="mail-01" size={20} />
            </div>
            <div className={styles.infoText}>
              <p className={styles.infoLabel}>Email</p>
              <p className={styles.infoValue}>{user?.email || "—"}</p>
            </div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoIcon}>
              <Icon name="building-02" size={20} />
            </div>
            <div className={styles.infoText}>
              <p className={styles.infoLabel}>Departamento</p>
              <p className={styles.infoValue}>Fazenda Principal</p>
            </div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoIcon}>
              <Icon name="user-01" size={20} />
            </div>
            <div className={styles.infoText}>
              <p className={styles.infoLabel}>Função</p>
              <p className={styles.infoValue}>Solicitante de Compras</p>
            </div>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={logout}>
          <Icon name="log-out-01" size={20} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
