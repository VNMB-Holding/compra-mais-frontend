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
        <Icon name="chevron-left" /> Voltar para Pedidos
      </button>

      <div className={styles.pageHeader}>
        <div className={styles.headerTitles}>
          <span className={styles.eyebrow}>Pedido de Compra</span>
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

      <div className={styles.estagioPista}>
        <div className={`${styles.estsgioItem} ${styles.estagioConcluido}`}>
          <div className={styles.estsgioIcone}><Icon name="check" size={16} /></div>
          <div>
            <strong>Pedido Emitido</strong>
            <span>22/05/2024</span>
          </div>
        </div>
        <div className={`${styles.estagioConetor} ${styles.estsgioConectorAtivo}`} />
        
        <div className={`${styles.estsgioItem} ${styles.estsgioAtivo}`}>
          <div className={styles.estsgioIcone}>2</div>
          <div>
            <strong>Faturado (NF-e)</strong>
            <span>3524 0522 ... 0012</span>
          </div>
        </div>
        <div className={styles.estagioConetor} />
        
        <div className={`${styles.estsgioItem} ${styles.estsgioInativo}`}>
          <div className={styles.estsgioIcone}>3</div>
          <div>
            <strong>Em Transporte</strong>
            <span>Aguardando coleta</span>
          </div>
        </div>
        <div className={styles.estagioConetor} />

        <div className={`${styles.estsgioItem} ${styles.estsgioInativo}`}>
          <div className={styles.estsgioIcone}>4</div>
          <div>
            <strong>Entregue</strong>
            <span>Aguardando recebimento</span>
          </div>
        </div>
      </div>

      <div className={styles.premiumMetricsGrid}>
        <div className={`${styles.premiumMetricCard} ${styles.darkCard}`}>
          <div className={styles.darkCardContent}>
            <span>Valor Total do Pedido</span>
            <h3>R$ 15.400,00</h3>
            <span style={{ marginTop: '6px' }}>Inclui impostos e frete</span>
          </div>
        </div>
        <div className={styles.premiumMetricCard}>
          <span>Condição de Pagamento</span>
          <h3 className={styles.textPrimary}>30 dias DDL</h3>
          <span className={styles.sub}>Vencimento: 22/06/2024</span>
        </div>
        <div className={styles.premiumMetricCard}>
          <span>Incoterm / Frete</span>
          <h3>CIF</h3>
          <span className={styles.sub}>Frete incluso no valor</span>
        </div>
        <div className={styles.premiumMetricCard}>
          <span>Previsão de Entrega</span>
          <h3>28/05/2024</h3>
          <span className={styles.sub}>Em 6 dias</span>
        </div>
      </div>

      <div className={styles.itemsCard}>
        <div className={styles.itemsCardHeader}>
          <h3><Icon name="package" size={18} /> Itens Vinculados</h3>
        </div>
        <div className={styles.itemsTableWrapper}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Material / Descrição</th>
                <th style={{ width: "120px", textAlign: "right" }}>Quantidade</th>
                <th style={{ width: "100px", textAlign: "center" }}>UM</th>
                <th style={{ width: "160px", textAlign: "right" }}>Preço Unitário</th>
                <th style={{ width: "160px", textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className={styles.itemDesc}>
                    <div className={styles.itemIconWrapper}>
                      <Icon name="package" size={20} />
                    </div>
                    <div className={styles.itemDescText}>
                      <strong>Filtro de Ar Motor X1</strong>
                      <small>Código técnico: CC-MRO-019</small>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>50</td>
                <td style={{ textAlign: "center" }}>
                  <span className={styles.badgeUm}>UN</span>
                </td>
                <td style={{ textAlign: "right" }}>R$ 308,00</td>
                <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>R$ 15.400,00</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.itemDesc}>
                    <div className={styles.itemIconWrapper}>
                      <Icon name="droplets-02" size={20} />
                    </div>
                    <div className={styles.itemDescText}>
                      <strong>Óleo Lubrificante 15W40 Sintético</strong>
                      <small>Código técnico: CC-MRO-042</small>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>200</td>
                <td style={{ textAlign: "center" }}>
                  <span className={styles.badgeUm}>L</span>
                </td>
                <td style={{ textAlign: "right" }}>R$ 45,00</td>
                <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>R$ 9.000,00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
