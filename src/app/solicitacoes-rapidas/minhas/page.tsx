"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui";
import styles from "./minhas.module.css";

// Mocks
interface RequestItem {
  id: number;
  description: string;
  quantity: number;
}

interface RequestMock {
  id: string;
  date: string;
  status: "Aguardando" | "Em Cotacao" | "Aprovado" | "Entregue" | "Recebido";
  items: RequestItem[];
}

const mockRequests: RequestMock[] = [
  {
    id: "REQ-0012",
    date: "22/06/2026",
    status: "Aguardando",
    items: [
      { id: 1, description: "Pneu para trator 420/90R30", quantity: 2 },
      { id: 2, description: "Óleo lubrificante 20L", quantity: 1 },
    ],
  },
  {
    id: "REQ-0011",
    date: "18/06/2026",
    status: "Em Cotacao",
    items: [
      { id: 1, description: "Filtro de ar para colheitadeira", quantity: 4 },
    ],
  },
  {
    id: "REQ-0010",
    date: "15/06/2026",
    status: "Entregue",
    items: [
      { id: 1, description: "Sementes de milho (saco 20kg)", quantity: 10 },
      { id: 2, description: "Fertilizante NPK", quantity: 5 },
    ],
  },
  {
    id: "REQ-0008",
    date: "05/06/2026",
    status: "Recebido",
    items: [
      { id: 1, description: "EPI - Luvas de couro", quantity: 12 },
    ],
  },
];

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Aguardando":
      return styles.statusAguardando;
    case "Em Cotacao":
      return styles.statusCotacao;
    case "Aprovado":
      return styles.statusAprovado;
    case "Entregue":
      return styles.statusEntregue;
    case "Recebido":
      return styles.statusRecebido;
    default:
      return "";
  }
};

const getStatusText = (status: string) => {
  if (status === "Em Cotacao") return "Em Cotação";
  return status;
};

export default function MinhasSolicitacoesPage() {
  const [requests, setRequests] = useState<RequestMock[]>(mockRequests);

  const handleConfirmarRecebimento = (id: string) => {
    setRequests((current) =>
      current.map((req) =>
        req.id === id ? { ...req, status: "Recebido" } : req
      )
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>Minhas solicitações</h1>
        <p className={styles.welcomeSubtitle}>Acompanhe o andamento dos seus pedidos</p>
      </div>

      <div className={styles.requestsList}>
        {requests.map((req) => (
          <div key={req.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>Solicitação {req.id}</h3>
                <p className={styles.cardDate}>Feita em {req.date}</p>
              </div>
              <span
                className={`${styles.statusBadge} ${getStatusBadgeClass(
                  req.status
                )}`}
              >
                {getStatusText(req.status)}
              </span>
            </div>

            <div className={styles.itemsContainer}>
              {req.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <span className={styles.itemDesc}>{item.description}</span>
                  <span className={styles.itemQty}>{item.quantity} un</span>
                </div>
              ))}
            </div>

            {req.status === "Entregue" && (
              <div className={styles.actions}>
                <button
                  className={styles.btnConfirm}
                  onClick={() => handleConfirmarRecebimento(req.id)}
                >
                  <Icon name="check-circle" size={18} />
                  Confirmar Recebimento
                </button>
              </div>
            )}

            {req.status === "Recebido" && (
              <div className={styles.actions}>
                <div className={styles.btnConfirmed}>
                  <Icon name="check-verified-02" size={18} />
                  Recebido
                </div>
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
            <Icon name="inbox" size={48} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
            <p style={{ color: "#64748b", margin: 0 }}>Você ainda não fez nenhuma solicitação.</p>
          </div>
        )}
      </div>
    </div>
  );
}
