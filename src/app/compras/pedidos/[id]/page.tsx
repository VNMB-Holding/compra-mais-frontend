"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Stepper, Loading, ExportButton } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import styles from "./pedido-detail.module.css";
import { purchaseOrdersApi, PurchaseOrder } from "@/lib/api/purchase-orders";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pedidoId = (params.id as string);

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de ações
  const [confirmRecebimento, setConfirmRecebimento] = useState(false);
  const [recebimentoConfirmado, setRecebimentoConfirmado] = useState(false);
  const [exportingType, setExportingType] = useState<"PDF" | "XLS" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await purchaseOrdersApi.getById(pedidoId);
        setOrder(data);
        if (data.status === "Delivered") {
          setRecebimentoConfirmado(true);
        }
      } catch (err) {
        console.error("Erro ao carregar pedido", err);
        toast({ variant: "error", title: "Erro", message: "Falha ao carregar pedido." });
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [pedidoId, toast]);

  const handleExport = async (type: "PDF" | "XLS") => {
    if (type !== "PDF") {
        setExportingType(type);
        setTimeout(() => setExportingType(null), 1000);
        return;
    }
    setExportingType("PDF");
    try {
      const res = await purchaseOrdersApi.generatePdf(pedidoId);
      if (!res.ok) throw new Error("Erro na geração do PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO-${order?.code || pedidoId}.pdf`;
      a.click();
    } catch (err) {
      toast({ variant: "error", title: "Erro", message: "Falha ao gerar o PDF." });
    } finally {
      setExportingType(null);
    }
  };

  if (loading) return <Loading variant="fullscreen" message="Carregando pedido..." />;
  if (!order) return <ProtectedLayout allowedRoles={[]}><div style={{padding:40}}>Pedido não encontrado.</div></ProtectedLayout>;

  return (
    <ProtectedLayout allowedRoles={["procurist", "gerente", "admin"]}>
      <div className={styles.detailContainer}>
        
        <ConfirmDialog
          open={confirmRecebimento}
          variant="success"
          icon="package-check"
          title="Confirmar recebimento do pedido?"
          message={
            <>Os itens de <strong>{order.code}</strong> foram conferidos e estão em conformidade. Esta ação finaliza o ciclo de entrega.</>
          }
          confirmLabel="Confirmar recebimento"
          onConfirm={() => {
            setRecebimentoConfirmado(true);
            setConfirmRecebimento(false);
            toast({
              variant: "success",
              title: "Recebimento confirmado!",
              message: `Os itens de ${order.code} foram recebidos.`,
            });
          }}
          onCancel={() => setConfirmRecebimento(false)}
        />

        {exportingType && <Loading variant="fullscreen" message={`Gerando relatório...`} />}

        <button className={styles.backBtn} onClick={() => router.push("/compras/pedidos")}>
          <Icon name="chevron-left" /> Voltar para Pedidos
        </button>

        <div className={styles.pageHeader}>
          <div className={styles.headerTitles}>
            <span className={styles.eyebrow}>Pedido de Compra</span>
            <div className={styles.titleRow}>
              <h1>{order.code}</h1>
              <Badge variant={order.status === "AwaitingSignature" ? "primary" : order.status === "Signed" ? "success" : "success"} icon="receipt-check">
                {order.status === "AwaitingSignature" ? "Aguardando Assinatura" : order.status === "Signed" ? "Faturado" : "Entregue"}
              </Badge>
            </div>
            {/* Note that we use corporateName instead of tradeName here as fixed earlier */}
            <p className={styles.subtitleLarge}>{order.supplier?.corporateName || "Fornecedor"}</p>
          </div>

          <div className={styles.headerActions}>
            <ExportButton onExport={handleExport} />
            <Button variant="secondary" onClick={() => handleExport("PDF")}>
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

        <div className={styles.layout2Col}>
          <div className={styles.colMain}>
            
            <Card className={styles.flowCard}>
              <h4>Acompanhamento do Pedido</h4>
              <Stepper
                steps={[
                  { label: "Emissão", description: new Date(order.createdAt).toLocaleDateString(), status: "completed" },
                  { label: "Faturamento", description: "XML da NFe", status: order.status === "AwaitingSignature" ? "active" : "completed" },
                  { label: "Entrega", description: "Conferência Física", status: recebimentoConfirmado ? "completed" : "pending" },
                ]}
              />
            </Card>

            <div className={styles.infoGridGrid}>
              <Card className={styles.infoCard}>
                <div className={styles.cardIconHeader}><Icon name="building-02" size={20} /><h4>Dados do Fornecedor</h4></div>
                <ul className={styles.infoList}>
                  <li><span>Razão Social</span><strong>{order.supplier?.corporateName}</strong></li>
                  <li><span>CNPJ</span><strong>{order.supplier?.cnpj}</strong></li>
                </ul>
              </Card>

              <Card className={styles.infoCard}>
                <div className={styles.cardIconHeader}><Icon name="currency-dollar" size={20} /><h4>Condições Comerciais</h4></div>
                <ul className={styles.infoList}>
                  <li><span>Pagamento</span><strong>{order.paymentTerms}</strong></li>
                  <li><span>Previsão de Entrega</span><strong>{new Date(order.estimatedDeliveryDate).toLocaleDateString("pt-BR")}</strong></li>
                </ul>
              </Card>
            </div>

            <div className={styles.tableWrapper}>
              <div className={styles.tableHeaderSection}>
                <h4>Itens do Pedido ({order.items?.length || 0})</h4>
              </div>
              <div className={styles.scrollableTable}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "40%" }}>Descrição do Item</th>
                      <th style={{ textAlign: "right" }}>Qtd</th>
                      <th style={{ textAlign: "center" }}>Un</th>
                      <th style={{ textAlign: "right" }}>Preço Unit.</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.itemDesc}>
                              <div className={styles.itemIconWrapper}><Icon name="package" size={20} /></div>
                              <div className={styles.itemDescText}>
                                <strong>{item.description}</strong>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>{item.quantity}</td>
                          <td style={{ textAlign: "center" }}><span className={styles.badgeUm}>{item.unit}</span></td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(Number(item.unitPrice))}</td>
                          <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>{formatCurrency(Number(item.unitPrice) * Number(item.quantity))}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.colSide}>
            <Card className={styles.sideCard} style={{ background: "linear-gradient(135deg, #004d4a, #007d79)", border: "none", color: "white", padding: "24px" }}>
              <div className={styles.darkCardContent}>
                <span style={{ color: "#cce5e5", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Valor Total do Pedido</span>
                <h3 style={{ fontSize: "28px", fontWeight: "900", margin: "8px 0 4px", color: "white" }}>
                  {formatCurrency(Number(order.totalValue))}
                </h3>
                <span style={{ color: "#cce5e5", fontSize: "12px" }}>Impostos e frete inclusos</span>
              </div>
            </Card>

            <Card className={styles.sideCard}>
              <h4>Documentos do Pedido</h4>
              <div className={styles.fileRow}>
                <span style={{ fontSize: "28px", color: "#b91c1c", marginRight: "12px", display: "inline-flex", alignItems: "center" }}><Icon name="file-01" size={24} /></span>
                <div className={styles.fileInfo}>
                  <strong>Ordem_de_Compra_{order.code}.pdf</strong>
                </div>
                <button className={styles.downloadIconBtn} title="Baixar OC" onClick={() => handleExport("PDF")}><Icon name="download-01" /></button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
