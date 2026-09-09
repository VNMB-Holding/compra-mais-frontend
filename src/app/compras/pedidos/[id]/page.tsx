"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading, Skeleton, CardSkeleton } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./pedido-detail.module.css";
import { formatCurrency } from "@/lib/utils/format-display";
import { formatCorporateBranch } from "@/lib/utils/tenant";
import { useAuth } from "@/hooks/useAuth";
import { purchaseOrdersApi, PurchaseOrder } from "@/lib/api/purchase-orders";
import { usePurchaseOrder, usePurchaseOrders, useUpdatePurchaseOrderStatus } from "@/hooks/useQueries";

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [confirmRecebimento, setConfirmRecebimento] = useState(false);
  const [recebimentoConfirmado, setRecebimentoConfirmado] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const { toast } = useToast();
  
  const rawId = (params.id as string) || "";
  const isNewFlow = rawId === "PED-NOVO";
  const isUuid = rawId.length > 20 && !rawId.startsWith("PED-");

  const { data: directPo, isLoading: isDirectLoading } = usePurchaseOrder(isUuid ? rawId : "");
  const { data: poList, isLoading: isListLoading } = usePurchaseOrders();
  const updateStatusMutation = useUpdatePurchaseOrderStatus();

  const foundInList = poList?.find((p) => p.id === rawId || p.code === rawId);
  const po: PurchaseOrder | null = directPo || foundInList || null;

  const displayId = po?.code || (isNewFlow ? `PED-${String(Date.now()).slice(-6)}` : rawId);

  const isDelivered = po?.status === "Delivered" || recebimentoConfirmado;

  const handleConfirmRecebimento = async () => {
    try {
      const orderIdToUpdate = po?.id || (isUuid ? rawId : null);
      if (orderIdToUpdate) {
        await updateStatusMutation.mutateAsync({
          id: orderIdToUpdate,
          status: "Delivered",
          notes: "Recebimento confirmado pelo comprador/almoxarifado",
        });
      }
      setRecebimentoConfirmado(true);
      setConfirmRecebimento(false);
      toast({
        variant: "success",
        title: "Recebimento confirmado!",
        message: `Os itens de ${displayId} foram recebidos e conferidos. Ciclo de entrega finalizado no sistema.`,
        duration: 5000,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Erro ao confirmar recebimento",
        message: e instanceof Error ? e.message : "Não foi possível atualizar o status.",
      });
    }
  };

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
    return (
      <div className={styles.detailContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/pedidos")}>
          <Icon name="chevron-left" /> Voltar para Pedidos
        </button>
        <div style={{ padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Skeleton variant="title" width="30%" />
          <Skeleton variant="text" width="50%" style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton width={140} height={28} />
            <Skeleton width={140} height={28} />
            <Skeleton width={140} height={28} />
          </div>
        </div>
        <div className={styles.layout2Col}>
          <div className={styles.colMain}>
            <CardSkeleton height={180} />
            <div style={{ marginTop: 20 }}>
              <CardSkeleton height={240} />
            </div>
            <div style={{ marginTop: 20 }}>
              <CardSkeleton height={280} />
            </div>
          </div>
          <div className={styles.colSide}>
            <CardSkeleton height={220} />
            <div style={{ marginTop: 20 }}>
              <CardSkeleton height={180} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const companyName = formatCorporateBranch(po?.corporateColigada, po?.corporateFilial, po?.tenantId, user);
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
        onConfirm={handleConfirmRecebimento}
        onCancel={() => setConfirmRecebimento(false)}
      />

      <button
        className={styles.backBtn}
        onClick={() => router.push("/compras/pedidos")}
      >
        <Icon name="chevron-left" /> Voltar para Pedidos
      </button>

      
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{displayId}</h1>
            <Badge variant={isDelivered ? "success" : "primary"}>
              {isDelivered ? "Entregue" : po?.status === "InTransit" ? "Em Transporte" : "Emitido"}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{fornecedorNome}</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}>
              <Icon name="building-01" /> {companyName}
            </span>
            {solOrigem !== "—" && (
              <span className={styles.infoTag}>
                <Icon name="file-01" /> Origem: {solOrigem}
              </span>
            )}
            {rfqOrigem !== "—" && (
              <span className={styles.infoTag}>
                <Icon name="receipt-check" /> RFQ: {rfqOrigem}
              </span>
            )}
            <span className={styles.infoTag}>
              <Icon name="calendar" /> Previsão: {dataEntregaFormatada}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          {!isDelivered && (
            <Button variant="secondary" onClick={() => setConfirmRecebimento(true)}>
              <Icon name="package-check" /> Confirmar Recebimento
            </Button>
          )}
          <Button variant="primary" onClick={handlePrintPO} disabled={loadingPdf}>
            <Icon name={loadingPdf ? "loading-01" : "printer"} /> {loadingPdf ? "Gerando PDF..." : "Imprimir / Baixar PO"}
          </Button>
        </div>
      </div>

      
      <div className={styles.layout2Col}>
        
        
        <div className={styles.colMain}>
          
          
          <Card className={styles.flowCard}>
            <h4>Fluxo e Rastreabilidade do Pedido</h4>
            <div className={styles.stepperContainer}>
              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>
                  <Icon name="receipt-check" />
                  <div className={styles.checkBadge}><Icon name="check" /></div>
                </div>
                <div className={styles.stepInfo}>
                  <strong>Pedido Emitido</strong>
                  <span>{po?.createdAt ? new Date(po.createdAt).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</span>
                  <small>Ordem gerada</small>
                </div>
              </div>

              <div className={`${styles.stepLine} ${po?.status === "InTransit" || isDelivered ? styles.lineActive : ""}`} />

              <div className={`${styles.step} ${po?.status === "InTransit" || isDelivered ? styles.completed : styles.active}`}>
                <div className={styles.stepIcon}>
                  <Icon name="file-02" />
                  {(po?.status === "InTransit" || isDelivered) && (
                    <div className={styles.checkBadge}><Icon name="check" /></div>
                  )}
                </div>
                <div className={styles.stepInfo}>
                  <strong>Faturado (NF-e)</strong>
                  <span>{po?.id ? `NF-${po.id.slice(0, 6)}` : "Aguardando"}</span>
                  <small>Nota fiscal emitida</small>
                </div>
              </div>

              <div className={`${styles.stepLine} ${isDelivered ? styles.lineActive : ""}`} />

              <div className={`${styles.step} ${isDelivered ? styles.completed : po?.status === "InTransit" ? styles.active : ""}`}>
                <div className={styles.stepIcon}>
                  <Icon name="truck-01" />
                  {isDelivered && (
                    <div className={styles.checkBadge}><Icon name="check" /></div>
                  )}
                </div>
                <div className={styles.stepInfo}>
                  <strong>Em Transporte</strong>
                  <span>{po?.shippingType || "CIF"}</span>
                  <small>Despachado</small>
                </div>
              </div>

              <div className={`${styles.stepLine} ${isDelivered ? styles.lineActive : ""}`} />

              <div className={`${styles.step} ${isDelivered ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>
                  <Icon name="package-check" />
                  {isDelivered && (
                    <div className={styles.checkBadge}><Icon name="check" /></div>
                  )}
                </div>
                <div className={styles.stepInfo}>
                  <strong>Entregue</strong>
                  <span>{isDelivered ? "Conferido" : "Aguardando"}</span>
                  <small>Almoxarifado</small>
                </div>
              </div>
            </div>
          </Card>

          
          <Card className={styles.infoCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0 }}>Detalhamento Comercial do Pedido</h4>
              <span className={styles.originTag}>
                <Icon name="check-verified-01" size={13} /> Sincronizado com ERP
              </span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Fornecedor Contratado</label>
                <strong>{fornecedorNome}</strong>
              </div>
              <div className={styles.infoItem}>
                <label>CNPJ do Fornecedor</label>
                <span>{fornecedorCnpj}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Condição de Pagamento</label>
                <strong className={styles.textPrimary}>{pagamento}</strong>
              </div>
              <div className={styles.infoItem}>
                <label>Modalidade de Frete</label>
                <span>{po?.shippingType || "CIF - Frete Incluso"}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Data de Emissão</label>
                <span>{po?.createdAt ? new Date(po.createdAt).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Previsão de Entrega</label>
                <span>{dataEntregaFormatada} ({prazo} dia{prazo !== 1 ? "s" : ""})</span>
              </div>
            </div>
          </Card>

          
          <div className={styles.itemsTableCard}>
            <div className={styles.itemsCardHeader}>
              <h4><Icon name="package" size={16} /> Itens do Pedido ({items?.length || 1})</h4>
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
                              <Icon name="package" size={18} />
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
                        <td style={{ textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
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

        
        <div className={styles.colSide}>
          
          
          <Card className={styles.sideCard}>
            <h4>Resumo Financeiro</h4>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Valor Total do Pedido</span>
              <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#007d79", margin: "6px 0 0 0" }}>
                {formatCurrency(valorTotal)}
              </h2>
              <small style={{ color: "#94a3b8", fontSize: "11px" }}>Inclui impostos e frete ({po?.shippingType || "CIF"})</small>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Condição:</span>
                <strong style={{ color: "#0f172a" }}>{pagamento}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Vencimento estimado:</span>
                <strong style={{ color: "#0f172a" }}>{dataVencimentoFormatada}</strong>
              </div>
            </div>
          </Card>

          
          <Card className={styles.sideCard}>
            <h4>Fornecedor Contratado</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f0fdf9", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", color: "#007d79", fontWeight: "700", fontSize: "15px" }}>
                {fornecedorNome.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>{fornecedorNome}</strong>
                <small style={{ color: "#64748b", fontSize: "12px" }}>CNPJ: {fornecedorCnpj}</small>
              </div>
            </div>
            {po?.supplier?.id && (
              <Button variant="secondary" onClick={() => router.push(`/fornecedores/${po.supplier?.id}`)} style={{ width: "100%", justifyContent: "center" }}>
                <Icon name="arrow-right" /> Ver Cadastro do Fornecedor
              </Button>
            )}
          </Card>

          
          <Card className={styles.sideCard}>
            <h4>Documento Oficial (PO)</h4>
            <div className={styles.fileRow}>
              <Icon name="file-02" size={24} style={{ color: "#007d79" }} />
              <div className={styles.fileInfo}>
                <strong>{displayId}.pdf</strong>
                <small>Ordem de Compra Oficial</small>
              </div>
              <button className={styles.downloadIconBtn} onClick={handlePrintPO} title="Baixar Ordem de Compra">
                <Icon name="download-01" size={16} />
              </button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
