"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Skeleton, CardSkeleton } from "@/components/ui";
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

  const [confirmFaturamento, setConfirmFaturamento] = useState(false);
  const [confirmTransporte, setConfirmTransporte] = useState(false);
  const [confirmRecebimento, setConfirmRecebimento] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [savedNfe, setSavedNfe] = useState<string>("");
  const [savedRastreio, setSavedRastreio] = useState<string>("");

  const [inputNfe, setInputNfe] = useState("");
  const [inputChaveNfe, setInputChaveNfe] = useState("");
  const [inputTransportadora, setInputTransportadora] = useState("");
  const [inputRastreio, setInputRastreio] = useState("");
  const [inputRecebimentoNotas, setInputRecebimentoNotas] = useState("");

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

  const currentStatus = statusOverride || po?.status || (isNewFlow ? "Sent" : "Sent");
  const isDelivered = currentStatus === "Delivered";
  const isInTransit = currentStatus === "InTransit" || isDelivered;
  const isBilled = currentStatus === "Signed" || isInTransit || isDelivered;

  const handleConfirmFaturamento = async () => {
    try {
      const orderIdToUpdate = po?.id || (isUuid ? rawId : null);
      const nfeVal = inputNfe.trim() || `NF-${String(Date.now()).slice(-6)}`;
      const note = `NF-e confirmada: ${nfeVal}${inputChaveNfe ? ` (Chave: ${inputChaveNfe})` : ""}`;
      
      if (orderIdToUpdate) {
        await updateStatusMutation.mutateAsync({
          id: orderIdToUpdate,
          status: "Signed",
          notes: note,
        });
      }
      setSavedNfe(nfeVal);
      setStatusOverride("Signed");
      setConfirmFaturamento(false);
      toast({
        variant: "success",
        title: "Faturamento confirmado!",
        message: `Nota Fiscal ${nfeVal} vinculada com sucesso ao pedido ${displayId}.`,
        duration: 5000,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Erro ao confirmar faturamento",
        message: e instanceof Error ? e.message : "Não foi possível atualizar o status.",
      });
    }
  };

  const handleConfirmTransporte = async () => {
    try {
      const orderIdToUpdate = po?.id || (isUuid ? rawId : null);
      const transpVal = inputTransportadora.trim() || "Transportadora Contratada";
      const rastrVal = inputRastreio.trim() ? ` (Rastreio: ${inputRastreio.trim()})` : "";
      const note = `Em transporte via ${transpVal}${rastrVal}`;
      
      if (orderIdToUpdate) {
        await updateStatusMutation.mutateAsync({
          id: orderIdToUpdate,
          status: "InTransit",
          notes: note,
        });
      }
      setSavedRastreio(transpVal + (rastrVal ? ` - ${inputRastreio.trim()}` : ""));
      setStatusOverride("InTransit");
      setConfirmTransporte(false);
      toast({
        variant: "success",
        title: "Transporte confirmado!",
        message: `O pedido ${displayId} foi despachado e está em trânsito.`,
        duration: 5000,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Erro ao confirmar transporte",
        message: e instanceof Error ? e.message : "Não foi possível atualizar o status.",
      });
    }
  };

  const handleConfirmRecebimento = async () => {
    try {
      const orderIdToUpdate = po?.id || (isUuid ? rawId : null);
      const note = inputRecebimentoNotas.trim() || "Recebimento confirmado pelo almoxarifado";
      if (orderIdToUpdate) {
        await updateStatusMutation.mutateAsync({
          id: orderIdToUpdate,
          status: "Delivered",
          notes: note,
        });
      }
      setStatusOverride("Delivered");
      setConfirmRecebimento(false);
      toast({
        variant: "success",
        title: "Recebimento confirmado!",
        message: `Os itens de ${displayId} foram recebidos e conferidos. Ciclo de entrega finalizado.`,
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
        open={confirmFaturamento}
        variant="info"
        icon="file-02"
        title="Confirmar Faturamento do Pedido"
        loading={updateStatusMutation.isPending}
        loadingConfirmLabel="Confirmando..."
        confirmLabel="Confirmar Faturamento"
        onConfirm={handleConfirmFaturamento}
        onCancel={() => setConfirmFaturamento(false)}
        message={
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            <p style={{ margin: 0, color: "#475569", fontSize: 13.5 }}>
              Confirme a emissão da Nota Fiscal Eletrônica de <strong>{displayId}</strong>. O pedido avançará para a etapa de Faturado.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Número da NF-e
              </label>
              <input
                type="text"
                placeholder="Ex: NF-004821"
                value={inputNfe}
                onChange={(e) => setInputNfe(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Chave de Acesso / Observação (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: 3524 0912 3456 7800 0199..."
                value={inputChaveNfe}
                onChange={(e) => setInputChaveNfe(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        }
      />

      <ConfirmDialog
        open={confirmTransporte}
        variant="info"
        icon="truck-01"
        title="Confirmar Envio / Despacho"
        loading={updateStatusMutation.isPending}
        loadingConfirmLabel="Confirmando..."
        confirmLabel="Confirmar Despacho"
        onConfirm={handleConfirmTransporte}
        onCancel={() => setConfirmTransporte(false)}
        message={
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            <p style={{ margin: 0, color: "#475569", fontSize: 13.5 }}>
              Informe os dados de despacho de <strong>{displayId}</strong> para iniciar a etapa de rastreamento logístico.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Transportadora / Modal de Frete
              </label>
              <input
                type="text"
                placeholder="Ex: Jamef Encomendas, Correios, ou Frota Própria"
                value={inputTransportadora}
                onChange={(e) => setInputTransportadora(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Código de Rastreamento / CTE (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: BR123456789XP ou CTE-8921"
                value={inputRastreio}
                onChange={(e) => setInputRastreio(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        }
      />

      <ConfirmDialog
        open={confirmRecebimento}
        variant="success"
        icon="package-check"
        title="Confirmar Recebimento do Pedido"
        loading={updateStatusMutation.isPending}
        loadingConfirmLabel="Confirmando..."
        confirmLabel="Confirmar recebimento"
        onConfirm={handleConfirmRecebimento}
        onCancel={() => setConfirmRecebimento(false)}
        message={
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            <p style={{ margin: 0, color: "#475569", fontSize: 13.5 }}>
              Os itens de <strong>{displayId}</strong> foram conferidos e estão em conformidade com o pedido. Esta ação finaliza o ciclo de entrega.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Observações do Recebimento (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Mercadoria recebida sem avarias pelo almoxarifado"
                value={inputRecebimentoNotas}
                onChange={(e) => setInputRecebimentoNotas(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        }
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
            <Badge variant={isDelivered ? "success" : isInTransit ? "primary" : isBilled ? "warning" : "gray"}>
              {isDelivered ? "Entregue" : isInTransit ? "Em Transporte" : isBilled ? "Faturado" : "Emitido"}
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
          {!isBilled && (
            <Button variant="primary" onClick={() => setConfirmFaturamento(true)}>
              <Icon name="file-02" /> Confirmar Faturamento
            </Button>
          )}
          {isBilled && !isInTransit && (
            <Button variant="primary" onClick={() => setConfirmTransporte(true)}>
              <Icon name="truck-01" /> Confirmar Despacho
            </Button>
          )}
          {isInTransit && !isDelivered && (
            <Button variant="secondary" onClick={() => setConfirmRecebimento(true)}>
              <Icon name="package-check" /> Confirmar Recebimento
            </Button>
          )}
          {isDelivered && (
            <Badge variant="success" icon="check">
              Pedido Concluído
            </Badge>
          )}
          <Button
            variant="primary"
            onClick={handlePrintPO}
            disabled={loadingPdf}
            loading={loadingPdf}
            loadingText="Gerando PDF..."
          >
            <Icon name="printer" /> Imprimir / Baixar PO
          </Button>
        </div>
      </div>

      <div className={styles.layout2Col}>
        <div className={styles.colMain}>
          <Card className={styles.flowCard}>
            <div className={styles.flowCardHeader}>
              <div>
                <h4>Fluxo e Rastreabilidade do Pedido</h4>
                <p className={styles.flowCardSubtitle}>
                  Acompanhe e confirme manualmente cada etapa do ciclo de atendimento e entrega.
                </p>
              </div>
              <div className={styles.flowCurrentBadge}>
                Etapa Atual: <strong>
                  {isDelivered
                    ? "Entregue (Concluído)"
                    : isInTransit
                    ? "Em Transporte"
                    : isBilled
                    ? "Faturado (Aguardando Envio)"
                    : "Emitido (Aguardando Faturamento)"}
                </strong>
              </div>
            </div>

            <div className={styles.stepperContainer}>
              {/* Passo 1: Pedido Emitido */}
              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>
                  <Icon name="receipt-check" />
                  <div className={styles.checkBadge}><Icon name="check" /></div>
                </div>
                <div className={styles.stepInfo}>
                  <strong>Pedido Emitido</strong>
                  <span>{po?.createdAt ? new Date(po.createdAt).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</span>
                  <small>Ordem gerada</small>
                  <span className={styles.stepStatusBadgeCompleted}>
                    <Icon name="check" size={11} /> Concluído
                  </span>
                </div>
              </div>

              <div className={`${styles.stepLine} ${isBilled ? styles.lineActive : ""}`} />

              {/* Passo 2: Faturado (NF-e) */}
              <div className={`${styles.step} ${isBilled ? styles.completed : styles.active}`}>
                <div className={styles.stepIcon}>
                  <Icon name="file-02" />
                  {isBilled && (
                    <div className={styles.checkBadge}><Icon name="check" /></div>
                  )}
                </div>
                <div className={styles.stepInfo}>
                  <strong>Faturado (NF-e)</strong>
                  <span>{isBilled ? (savedNfe || (po?.id ? `NF-${po.id.slice(0, 6).toUpperCase()}` : "Emitida")) : "Aguardando NF"}</span>
                  <small>{isBilled ? "Nota fiscal emitida" : "Faturamento pendente"}</small>
                  {isBilled ? (
                    <span className={styles.stepStatusBadgeCompleted}>
                      <Icon name="check" size={11} /> Faturado
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnStepActionHighlight}
                      onClick={() => setConfirmFaturamento(true)}
                    >
                      <Icon name="file-02" size={12} /> Confirmar NF-e
                    </button>
                  )}
                </div>
              </div>

              <div className={`${styles.stepLine} ${isInTransit ? styles.lineActive : ""}`} />

              {/* Passo 3: Em Transporte */}
              <div className={`${styles.step} ${isInTransit ? styles.completed : isBilled ? styles.active : styles.disabledStep}`}>
                <div className={styles.stepIcon}>
                  <Icon name="truck-01" />
                  {isInTransit && (
                    <div className={styles.checkBadge}><Icon name="check" /></div>
                  )}
                </div>
                <div className={styles.stepInfo}>
                  <strong>Em Transporte</strong>
                  <span>{isInTransit ? (savedRastreio || po?.shippingType || "Despachado") : (isBilled ? "Pronto p/ envio" : "Aguardando")}</span>
                  <small>{isInTransit ? "Despachado" : "Transportadora"}</small>
                  {isInTransit ? (
                    <span className={styles.stepStatusBadgeCompleted}>
                      <Icon name="check" size={11} /> Despachado
                    </span>
                  ) : isBilled ? (
                    <button
                      type="button"
                      className={styles.btnStepActionHighlight}
                      onClick={() => setConfirmTransporte(true)}
                    >
                      <Icon name="truck-01" size={12} /> Confirmar Envio
                    </button>
                  ) : (
                    <span className={styles.stepStatusBadgePending}>Aguardando NF</span>
                  )}
                </div>
              </div>

              <div className={`${styles.stepLine} ${isDelivered ? styles.lineActive : ""}`} />

              {/* Passo 4: Entregue */}
              <div className={`${styles.step} ${isDelivered ? styles.completed : isInTransit ? styles.active : styles.disabledStep}`}>
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
                  {isDelivered ? (
                    <span className={styles.stepStatusBadgeCompleted}>
                      <Icon name="check" size={11} /> Recebido
                    </span>
                  ) : isInTransit ? (
                    <button
                      type="button"
                      className={styles.btnStepActionHighlight}
                      onClick={() => setConfirmRecebimento(true)}
                    >
                      <Icon name="package-check" size={12} /> Confirmar Recebimento
                    </button>
                  ) : (
                    <span className={styles.stepStatusBadgePending}>Aguardando Envio</span>
                  )}
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
        </div>
      </div>
    </div>
  );
}
