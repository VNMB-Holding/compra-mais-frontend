"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./pedido-detail.module.css";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [confirmRecebimento, setConfirmRecebimento] = useState(false);
  const [recebimentoConfirmado, setRecebimentoConfirmado] = useState(false);
  const { toast } = useToast();

  const pedidoId = (params.id as string) || "PED-000234";
  const isNewFlow = pedidoId === "PED-NOVO";

  // Lê os dados do fornecedor vencedor vindos da RFQ
  const fornecedorNome = searchParams.get("fornecedor") || "Fornecedor Alfa S.A.";
  const fornecedorCnpj = searchParams.get("cnpj") || "11.222.333/0001-81";
  const precoUnit = Number(searchParams.get("precoUnit") || 5.95);
  const frete = Number(searchParams.get("frete") || 0.25);
  const prazo = Number(searchParams.get("prazo") || 2);
  const pagamento = searchParams.get("pagamento") || "30 dias DDL";
  const qtdTotal = Number(searchParams.get("qtdTotal") || 512000);
  const rfqOrigem = searchParams.get("rfq") || "RFQ-2026-004";
  const solOrigem = searchParams.get("origem") || "SOL-000456";

  const valorTotal = (precoUnit + frete) * qtdTotal;

  // Data de entrega prevista (hoje + prazo)
  const dataEntrega = new Date();
  dataEntrega.setDate(dataEntrega.getDate() + prazo);
  const dataEntregaFormatada = dataEntrega.toLocaleDateString("pt-BR");

  // Vencimento do pagamento (30 dias úteis simplificado)
  const dataVencimento = new Date();
  dataVencimento.setDate(dataVencimento.getDate() + 30);
  const dataVencimentoFormatada = dataVencimento.toLocaleDateString("pt-BR");

  // Código exibido
  const displayId = isNewFlow
    ? `PED-${String(Date.now()).slice(-6)}`
    : pedidoId;

  return (
    <div className={styles.detailContainer}>

      <ConfirmDialog
        open={confirmRecebimento}
        variant="success"
        icon="package-check"
        title="Confirmar recebimento do pedido?"
        message={
          <>Os itens de <strong>{pedidoId !== "PED-NOVO" ? pedidoId : displayId}</strong> foram conferidos e estão em conformidade com o pedido. Esta ação finaliza o ciclo de entrega.</>
        }
        confirmLabel="Confirmar recebimento"
        onConfirm={() => {
          setRecebimentoConfirmado(true);
          setConfirmRecebimento(false);
          toast({
            variant: "success",
            title: "Recebimento confirmado!",
            message: `Os itens de ${pedidoId !== "PED-NOVO" ? pedidoId : displayId} foram recebidos e conferidos. Ciclo de entrega finalizado.`,
            duration: 5000,
          });
        }}
        onCancel={() => setConfirmRecebimento(false)}
      />
      <button
        className={styles.backBtn}
        onClick={() => router.push("/compras/pedidos")}
      >
        <Icon name="chevron-left" /> Voltar para Pedidos
      </button>

      <div className={styles.pageHeader}>
        <div className={styles.headerTitles}>
          <span className={styles.eyebrow}>Pedido de Compra</span>
          <div className={styles.titleRow}>
            <h1>{displayId}</h1>
            <Badge variant={isNewFlow ? "success" : "primary"}>
              {isNewFlow ? "Emitido" : "Faturado"}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{fornecedorNome}</p>
          {isNewFlow && (
            <div className={styles.originTags}>
              <span className={styles.originTag}>
                <Icon name="file-01" size={13} /> {solOrigem}
              </span>
              <span className={styles.originTag}>
                <Icon name="receipt-check" size={13} /> {rfqOrigem}
              </span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">
            <Icon name="printer" /> Imprimir PO
          </Button>
          {!recebimentoConfirmado ? (
            <Button variant="primary" onClick={() => setConfirmRecebimento(true)}>
              <Icon name="truck-01" /> Confirmar Recebimento
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              <Icon name="check-circle" /> Recebido
            </Button>
          )}
        </div>
      </div>

      <div className={styles.estagioPista}>
        <div className={`${styles.estsgioItem} ${styles.estagioConcluido}`}>
          <div className={styles.estsgioIcone}><Icon name="check" size={16} /></div>
          <div>
            <strong>Pedido Emitido</strong>
            <span>{new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
        <div className={`${styles.estagioConetor} ${isNewFlow ? "" : styles.estsgioConectorAtivo}`} />

        <div className={`${styles.estsgioItem} ${isNewFlow ? styles.estsgioInativo : styles.estsgioAtivo}`}>
          <div className={styles.estsgioIcone}>{isNewFlow ? "2" : "2"}</div>
          <div>
            <strong>Faturado (NF-e)</strong>
            <span>{isNewFlow ? "Aguardando fatura" : "3524 0522 ... 0012"}</span>
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
            <h3>{formatCurrency(isNewFlow ? valorTotal : 15400)}</h3>
            <span style={{ marginTop: "6px" }}>Inclui impostos e frete</span>
          </div>
        </div>
        <div className={styles.premiumMetricCard}>
          <span>Condição de Pagamento</span>
          <h3 className={styles.textPrimary}>{pagamento}</h3>
          <span className={styles.sub}>Vencimento: {dataVencimentoFormatada}</span>
        </div>
        <div className={styles.premiumMetricCard}>
          <span>Incoterm / Frete</span>
          <h3>CIF</h3>
          <span className={styles.sub}>Frete incluso no valor</span>
        </div>
        <div className={styles.premiumMetricCard}>
          <span>Previsão de Entrega</span>
          <h3>{dataEntregaFormatada}</h3>
          <span className={styles.sub}>
            Em {prazo} dia{prazo !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {isNewFlow && (
        <Card className={styles.supplierCard}>
          <h3>
            <Icon name="building-01" size={18} /> Fornecedor Vencedor
          </h3>
          <div className={styles.supplierGrid}>
            <div className={styles.supplierRow}>
              <span>Razão Social</span>
              <strong>{fornecedorNome}</strong>
            </div>
            <div className={styles.supplierRow}>
              <span>CNPJ</span>
              <strong>{fornecedorCnpj}</strong>
            </div>
            <div className={styles.supplierRow}>
              <span>Preço unitário líquido</span>
              <strong>{formatCurrency(precoUnit)} / un</strong>
            </div>
            <div className={styles.supplierRow}>
              <span>Custo de frete adicional</span>
              <strong>{formatCurrency(frete)} / un</strong>
            </div>
            <div className={styles.supplierRow}>
              <span>Prazo de entrega</span>
              <strong>{prazo} dia{prazo !== 1 ? "s" : ""}</strong>
            </div>
            <div className={styles.supplierRow}>
              <span>RFQ de origem</span>
              <strong>{rfqOrigem}</strong>
            </div>
          </div>
        </Card>
      )}

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
              {isNewFlow ? (
                <>
                  <tr>
                    <td>
                      <div className={styles.itemDesc}>
                        <div className={styles.itemIconWrapper}>
                          <Icon name="droplets-02" size={20} />
                        </div>
                        <div className={styles.itemDescText}>
                          <strong>Óleo Diesel S10</strong>
                          <small>Origem: {solOrigem}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>
                      {(500000).toLocaleString("pt-BR")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={styles.badgeUm}>L</span>
                    </td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(precoUnit)}</td>
                    <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                      {formatCurrency(precoUnit * 500000)}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className={styles.itemDesc}>
                        <div className={styles.itemIconWrapper}>
                          <Icon name="package" size={20} />
                        </div>
                        <div className={styles.itemDescText}>
                          <strong>Aditivo ARLA 32</strong>
                          <small>Origem: {solOrigem}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>
                      {(12000).toLocaleString("pt-BR")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={styles.badgeUm}>L</span>
                    </td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(frete)}</td>
                    <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                      {formatCurrency(frete * 12000)}
                    </td>
                  </tr>
                </>
              ) : (
                <>
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
                    <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                      R$ 15.400,00
                    </td>
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
                    <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                      R$ 9.000,00
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
