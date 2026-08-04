"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./pedido-detail.module.css";
import { formatCurrency } from "@/lib/utils/format-display";
import { purchaseOrdersApi, PurchaseOrder } from "@/lib/api/purchase-orders";
import { usePurchaseOrder, usePurchaseOrders } from "@/hooks/useQueries";

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [confirmRecebimento, setConfirmRecebimento] = useState(false);
  const [recebimentoConfirmado, setRecebimentoConfirmado] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const { toast } = useToast();
  
  const rawId = (params.id as string) || "";
  const isNewFlow = rawId === "PED-NOVO";
  const isUuid = rawId.length > 20 && !rawId.startsWith("PED-");

  const { data: directPo, isLoading: isDirectLoading } = usePurchaseOrder(isUuid ? rawId : "");
  const { data: poList, isLoading: isListLoading } = usePurchaseOrders();

  const foundInList = poList?.find((p) => p.id === rawId || p.code === rawId);
  const po: PurchaseOrder | null = directPo || foundInList || null;

  const displayId = po?.code || (isNewFlow ? `PED-${String(Date.now()).slice(-6)}` : rawId);

  const handlePrintPO = async () => {
    const idToUse = po?.id || (isUuid ? rawId : null);
    if (!idToUse) {
      toast({ variant: "warning", title: "PDF indisponível", message: "O PDF só está disponível para pedidos registrados no banco de dados." });
      return;
    }
    setLoadingPdf(true);
    try {
      const response = await purchaseOrdersApi.generatePdf(idToUse);
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      toast({ variant: "error", title: "Erro ao gerar PDF", message: e instanceof Error ? e.message : "Tente novamente." });
    } finally {
      setLoadingPdf(false);
    }
  };

  const fornecedorNome = po?.supplier?.tradeName || po?.supplier?.corporateName || searchParams.get("fornecedor") || "—";
  const fornecedorCnpj = po?.supplier?.cnpj || searchParams.get("cnpj") || "—";
  const precoUnit = searchParams.get("precoUnit") ? Number(searchParams.get("precoUnit")) : 0;
  const frete = searchParams.get("frete") ? Number(searchParams.get("frete")) : 0;
  const prazo = searchParams.get("prazo") ? Number(searchParams.get("prazo")) : 0;
  const pagamento = po?.paymentTerms || searchParams.get("pagamento") || "—";
  const qtdTotal = searchParams.get("qtdTotal") ? Number(searchParams.get("qtdTotal")) : 0;
  const rfqOrigem = searchParams.get("rfq") || "—";
  const solOrigem = searchParams.get("origem") || "—";

  const valorTotal = po?.totalValue ?? ((precoUnit + frete) * qtdTotal);

  const dataEntrega = po?.estimatedDeliveryDate ? new Date(po.estimatedDeliveryDate) : new Date(Date.now() + prazo * 86400000);
  const dataEntregaFormatada = dataEntrega.toLocaleDateString("pt-BR");

  const dataVencimento = new Date(Date.now() + 30 * 86400000);
  const dataVencimentoFormatada = dataVencimento.toLocaleDateString("pt-BR");

  if (!isNewFlow && (isDirectLoading || (isListLoading && !po))) {
    return <Loading variant="fullscreen" message="Carregando Pedido de Compra..." />;
  }

  const items = po?.items && po.items.length > 0 ? po.items : null;

  return (
    <div className={styles.detailContainer}>

      <ConfirmDialog
        open={confirmRecebimento}
        variant="success"
        icon="package-check"
        title="Confirmar recebimento do pedido?"
        message={
          <>Os itens de <strong>{displayId}</strong> foram conferidos e estão em conformidade com o pedido. Esta ação finaliza o ciclo de entrega.</>
        }
        confirmLabel="Confirmar recebimento"
        onConfirm={() => {
          setRecebimentoConfirmado(true);
          setConfirmRecebimento(false);
          toast({
            variant: "success",
            title: "Recebimento confirmado!",
            message: `Os itens de ${displayId} foram recebidos e conferidos. Ciclo de entrega finalizado.`,
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
            <Badge variant={po?.status === "Delivered" || recebimentoConfirmado ? "success" : "primary"}>
              {po?.status === "Delivered" || recebimentoConfirmado ? "Entregue" : po?.status === "InTransit" ? "Em Transporte" : "Emitido"}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{fornecedorNome}</p>
          {(isNewFlow || searchParams.get("rfq")) && (
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
          <Button variant="secondary" onClick={handlePrintPO} disabled={loadingPdf}>
            <Icon name={loadingPdf ? "loading-01" : "printer"} /> {loadingPdf ? "Gerando PDF..." : "Imprimir PO"}
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
            <span>{po?.createdAt ? new Date(po.createdAt).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
        <div className={`${styles.estagioConetor} ${styles.estsgioConectorAtivo}`} />

        <div className={`${styles.estsgioItem} ${styles.estsgioAtivo}`}>
          <div className={styles.estsgioIcone}>2</div>
          <div>
            <strong>Faturado (NF-e)</strong>
            <span>{po?.id ? `NF-${po.id.slice(0, 8)}` : "Aguardando fatura"}</span>
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

        <div className={`${styles.estsgioItem} ${recebimentoConfirmado ? styles.estagioConcluido : styles.estsgioInativo}`}>
          <div className={styles.estsgioIcone}>{recebimentoConfirmado ? <Icon name="check" size={16} /> : "4"}</div>
          <div>
            <strong>Entregue</strong>
            <span>{recebimentoConfirmado ? "Recebimento confirmado" : "Aguardando recebimento"}</span>
          </div>
        </div>
      </div>

      <div className={styles.premiumMetricsGrid}>
        <div className={`${styles.premiumMetricCard} ${styles.darkCard}`}>
          <div className={styles.darkCardContent}>
            <span>Valor Total do Pedido</span>
            <h3>{formatCurrency(valorTotal)}</h3>
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
          <h3>{po?.shippingType || "CIF"}</h3>
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

      <Card className={styles.supplierCard}>
        <h3>
          <Icon name="building-01" size={18} /> Fornecedor Contratado
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
            <span>Condição de Pagamento</span>
            <strong>{pagamento}</strong>
          </div>
          <div className={styles.supplierRow}>
            <span>Modalidade de Frete</span>
            <strong>{po?.shippingType || "CIF"}</strong>
          </div>
        </div>
      </Card>

      <div className={styles.itemsCard}>
        <div className={styles.itemsCardHeader}>
          <h3><Icon name="package" size={18} /> Itens do Pedido ({items?.length || 1})</h3>
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
              {items ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.itemDesc}>
                        <div className={styles.itemIconWrapper}>
                          <Icon name="package" size={20} />
                        </div>
                        <div className={styles.itemDescText}>
                          <strong>{item.description}</strong>
                          <small>Código do Item: {item.id.slice(0, 8)}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>
                      {Number(item.quantity).toLocaleString("pt-BR")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={styles.badgeUm}>{item.unit || "UN"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(Number(item.unitPrice))}</td>
                    <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                      {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
                    Nenhum item cadastrado diretamente neste pedido de compra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
