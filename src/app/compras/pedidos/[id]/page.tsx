"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon } from "@/components/ui";
import styles from "./pedido-detail.module.css";

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pedidoId = params.id;

  return (
    <div className={styles.detailContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/pedidos")}>
        <Icon name="arrow-left" /> Voltar para Pedidos
      </button>

      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{pedidoId || "PED-000234"}</h1>
            <Badge variant="primary">Faturado</Badge>
          </div>
          <p className={styles.subtitleLarge}>Fornecedor Alfa S.A.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">
            <Icon name="printer" /> Imprimir PO
          </Button>
          <Button variant="primary">
            <Icon name="truck-01" /> Confirmar Recebimento
          </Button>
        </div>
      </div>

      <div className={styles.layout2Col}>
        
        <div className={styles.colMain}>
          <Card className={styles.cleanCard}>
            <h3>Resumo do Contrato de Compra</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <small>Data de Emissão</small>
                <span>22/05/2024</span>
              </div>
              <div className={styles.infoItem}>
                <small>Condição de Pagamento</small>
                <span>30 dias DDL</span>
              </div>
              <div className={styles.infoItem}>
                <small>Incoterm / Frete</small>
                <span>CIF (Incluso)</span>
              </div>
              <div className={styles.infoItem}>
                <small>Valor Total do Pedido</small>
                <strong className={styles.priceHighlight}>R$ 15.400,00</strong>
              </div>
            </div>
          </Card>

          <Card noPadding className={styles.cleanCard}>
            <div className={styles.cardPaddingHeader}>
              <h3>Itens Vinculados</h3>
            </div>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Material / Descrição</th>
                  <th style={{ width: "80px", textAlign: "right" }}>Qtd</th>
                  <th style={{ width: "80px" }}>UM</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Preço Unit.</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Filtro de Ar Motor X1</strong><br /><small>Código técnico: CC-MRO-019</small></td>
                  <td style={{ textAlign: "right" }}>50</td>
                  <td>UN</td>
                  <td style={{ textAlign: "right" }}>R$ 308,00</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>R$ 15.400,00</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div className={styles.colSide}>
          <Card className={styles.cleanCard}>
            <h3>Acompanhamento de Entrega</h3>
            
            <div className={styles.verticalTimeline}>
              <div className={`${styles.vtItem} ${styles.vtDone}`}>
                <div className={styles.vtDot}><Icon name="check" /></div>
                <div className={styles.vtContent}>
                  <strong>Pedido Emitido</strong>
                  <span>Enviado ao fornecedor por e-mail</span>
                  <small>22/05/2024 — 14:00</small>
                </div>
              </div>

              <div className={`${styles.vtItem} ${styles.vtActive}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Nota Fiscal Emitida (Faturado)</strong>
                  <span>Chave NF-e: 3524 0522 ... 0012</span>
                  <small>24/05/2024 — 09:30</small>
                </div>
              </div>

              <div className={styles.vtItem}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Em Transporte</strong>
                  <span>Aguardando coleta da transportadora</span>
                </div>
              </div>

              <div className={styles.vtItem}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Entregue / Portaria</strong>
                  <span>Aguardando conferência física de estoque</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
