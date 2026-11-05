"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Badge,
  Icon,
  ConfirmDialog,
  Loading,
  Skeleton,
  CardSkeleton,
  EmptyState,
  Stepper,
  Select,
  ItemCell,
  MarketplaceLogo,
} from "@/components/ui";

import { useToast } from "@/contexts/ToastContext";
import { SupplierEngagementBadge, SupplierActivityDrawer } from "@/components/supplier-tracking";
import styles from "./rfq-detail.module.css";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { useAuth } from "@/hooks/useAuth";
import {
  getTenantDisplayName,
  formatCorporateBranch,
  resolvePurchaseRequestBranch,
} from "@/lib/utils/tenant";
import { logError, getErrorMessage } from "@/lib/utils/error";
import { formatCurrency } from "@/lib/utils/format-display";
import { maskCnpj } from "@/lib/utils/masks";
import {
  detectMarketplaceFromUrl,
  extractProposalOfferUrl,
  isMarketplaceOrLocalSupplier,
} from "@/lib/utils/item-description";
import { suppliersApi } from "@/lib/api/suppliers";

type RfqStage = "proposal" | "analysis" | "approval";

interface LocalProposal {
  id: string;
  supplierId: string;
  proposalId?: string;
  supplierName: string;
  cnpj: string;
  status: "awaiting" | "received" | "declined";
  unitPrice?: number;
  freightCost?: number;
  freightType?: "CIF" | "FOB";
  deliveryTime?: number;
  validityDays?: number;
  paymentTerms?: string;
  warrantyMonths?: number;
  brandModel?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  itemPrices?: Record<string, number>;
  totalCalculated?: number;
  isWinner?: boolean;
}

function mapPropostas(rfq: Rfq): LocalProposal[] {
  const proposalsList: LocalProposal[] = [];
  const reqItems = rfq.purchaseRequest?.items ?? [];
  const rawQtdTotal = reqItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;

  // Contabilizar propostas existentes por fornecedor para numerar ofertas múltiplas
  const supplierProposalCount = new Map<string, number>();
  (rfq.proposals ?? []).forEach((p) => {
    if (p.supplierId) {
      supplierProposalCount.set(p.supplierId, (supplierProposalCount.get(p.supplierId) || 0) + 1);
    }
  });

  const supplierProposalIndex = new Map<string, number>();

  (rfq.proposals ?? []).forEach((p) => {
    if (!p.supplierId) return;

    const totalCount = supplierProposalCount.get(p.supplierId) || 1;
    const currentIndex = (supplierProposalIndex.get(p.supplierId) || 0) + 1;
    supplierProposalIndex.set(p.supplierId, currentIndex);

    let subtotal = 0;
    let hasItemPrices = false;
    if (p.items && p.items.length > 0) {
      for (const item of p.items) {
        const reqItem = reqItems.find((ri) => ri.id === (item.requestItemId || item.id));
        const qty = reqItem ? Number(reqItem.quantity || 1) : 1;
        const uPrice = Number(item.unitPrice) || 0;
        if (uPrice > 0) hasItemPrices = true;
        subtotal += uPrice * qty;
      }
    }

    const freight = Number(
      p.items && p.items.length > 0
        ? (p.items[0].freightCost ?? (p as any).freightCost ?? (p as any).shippingCost ?? 0)
        : ((p as any).freightCost ?? (p as any).shippingCost ?? 0),
    );

    const firstItemUnitPrice = Number(p.items?.[0]?.unitPrice) || 0;
    const unitPrice = hasItemPrices
      ? subtotal / rawQtdTotal
      : firstItemUnitPrice || Number(p.totalValue ?? 0);

    const totalCalculated = subtotal > 0 ? subtotal + freight : unitPrice * rawQtdTotal + freight;

    const hasPrices =
      hasItemPrices || Number(unitPrice) > 0 || subtotal > 0 || Number(p.totalValue ?? 0) > 0;
    const isDeclined = p.status === "Declined" && !hasPrices;
    const isDraftWithoutPrice = p.status === "Draft" && !hasPrices;
    const status: LocalProposal["status"] = isDeclined
      ? "declined"
      : isDraftWithoutPrice
        ? "awaiting"
        : "received";

    const initialItemPrices: Record<string, number> = {};
    if (p.items && p.items.length > 0) {
      for (const it of p.items) {
        const reqId = it.requestItemId || it.id;
        if (reqId) initialItemPrices[reqId] = Number(it.unitPrice) || 0;
      }
    }

    const pAny = p as any;
    let initialSupplierName = (() => {
      const detectedOfferUrl = extractProposalOfferUrl(pAny.notes, pAny.brandModel);
      const detectedMkt = detectMarketplaceFromUrl(detectedOfferUrl);
      let sName =
        p.supplier?.tradeName ||
        p.supplier?.corporateName ||
        "Razão Social não informada";

      if (detectedMkt) {
        const lowerName = sName.toLowerCase();
        if (
          lowerName.includes("mercado livre") ||
          lowerName.includes("compra online") ||
          lowerName.includes("link") ||
          lowerName.includes("loja virtual") ||
          lowerName.includes("marketplace")
        ) {
          const storeLabel =
            detectedMkt.id === "ecommerce" ? detectedMkt.shortLabel : detectedMkt.label;
          sName = storeLabel;
        }
      }
      return sName;
    })();

    if (totalCount > 1 && !initialSupplierName.match(/Oferta\s*\d+|Opção\s*\d+/i)) {
      initialSupplierName = `${initialSupplierName} (Oferta ${currentIndex})`;
    }

    proposalsList.push({
      id: p.id,
      supplierId: p.supplierId,
      proposalId: p.id,
      supplierName: initialSupplierName,
      cnpj: p.supplier?.cnpj || "—",
      status,
      unitPrice: Number(unitPrice),
      freightCost: Number(freight),
      freightType: (pAny.freightType as "CIF" | "FOB") || (freight > 0 ? "FOB" : "CIF"),
      deliveryTime: p.deliveryTime ?? 5,
      validityDays: pAny.validityDays ?? 15,
      paymentTerms: p.paymentTerms || "30 dias DDL",
      warrantyMonths: pAny.warrantyMonths ?? 12,
      brandModel: pAny.brandModel || pAny.brand || "",
      contactName: pAny.contactName || "",
      contactEmail: pAny.contactEmail || "",
      contactPhone: pAny.contactPhone || "",
      notes: pAny.notes || "",
      itemPrices: initialItemPrices,
      totalCalculated,
      isWinner: !!p.isWinner,
    });
  });

  // Incluir fornecedores convidados sem nenhuma proposta cadastrada ainda
  (rfq.rfqSuppliers ?? []).forEach((rs) => {
    if (rs.supplierId && !supplierProposalCount.has(rs.supplierId)) {
      proposalsList.push({
        id: `sup-${rs.supplierId}`,
        supplierId: rs.supplierId,
        supplierName:
          rs.supplier?.tradeName || rs.supplier?.corporateName || "Razão Social não informada",
        cnpj: rs.supplier?.cnpj || "—",
        status: "awaiting",
      });
    }
  });

  return proposalsList;
}

function getStage(rfq: Rfq): RfqStage {
  const winnerExists = (rfq.proposals ?? []).some((p) => p.isWinner);
  if (winnerExists || rfq.status === "Finished" || rfq.status === "Closed") return "approval";
  if (rfq.status === "UnderAnalysis") return "analysis";
  return "proposal";
}

function PropostaCard({
  proposta,
  isWinner,
  totalQtd,
  rfqItems,
  rfqCode,
  rfqId,
  rfqTitle,
  suggestedOfferUrl,
  onSalvar,
  onOpenTracking,
  onRemover,
}: {
  proposta: LocalProposal;
  isWinner: boolean;
  totalQtd: number;
  rfqItems?: { id: string; description: string; quantity: number; unit: string }[];
  rfqCode: string;
  rfqId?: string;
  rfqTitle: string;
  suggestedOfferUrl?: string | null;
  onSalvar: (cardId: string, dados: Partial<LocalProposal>) => void;
  onOpenTracking?: (proposta: LocalProposal) => void;
  onRemover?: (cardId: string) => void;
}) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isMarketplaceOrLocal = Boolean(
    detectMarketplaceFromUrl(proposta.supplierName) ||
      detectMarketplaceFromUrl(proposta.notes) ||
      proposta.supplierName.toLowerCase().includes("mercado livre") ||
      proposta.supplierName.toLowerCase().includes("orçamento local") ||
      proposta.supplierName.toLowerCase().includes("comércio local") ||
      proposta.supplierName.toLowerCase().includes("amazon") ||
      proposta.supplierName.toLowerCase().includes("shopee") ||
      proposta.supplierName.toLowerCase().includes("magalu"),
  );
  const existingOfferUrl = extractProposalOfferUrl(proposta.notes, proposta.brandModel) || "";
  const [offerUrl, setOfferUrl] = useState(existingOfferUrl || (isMarketplaceOrLocal ? (suggestedOfferUrl || "") : ""));

  const currentUrl = offerUrl.trim() || existingOfferUrl;
  const detectedMarketplace = detectMarketplaceFromUrl(currentUrl);

  const displaySupplierName = useMemo(() => {
    if (detectedMarketplace) {
      const lower = proposta.supplierName.toLowerCase();
      const isOnlineOrMarketplaceSlot =
        lower.includes("mercado livre") ||
        lower.includes("compra online") ||
        lower.includes("link") ||
        lower.includes("loja virtual") ||
        lower.includes("marketplace") ||
        lower.includes("opção");

      if (isOnlineOrMarketplaceSlot) {
        const optionMatch = proposta.supplierName.match(/Opção\s*(\d+)/i);
        const optionSuffix = optionMatch ? ` (Opção ${optionMatch[1]})` : "";
        const storeLabel =
          detectedMarketplace.id === "ecommerce"
            ? detectedMarketplace.shortLabel
            : detectedMarketplace.label;
        return `${storeLabel}${optionSuffix}`;
      }
    }
    return proposta.supplierName;
  }, [detectedMarketplace, proposta.supplierName]);
  const [draft, setDraft] = useState({
    unitPrice: proposta.unitPrice ?? 0,
    freightCost: proposta.freightCost ?? 0,
    freightType: (proposta.freightType || ((proposta.freightCost ?? 0) > 0 ? "FOB" : "CIF")) as
      "CIF" | "FOB",
    deliveryTime: proposta.deliveryTime ?? 5,
    validityDays: proposta.validityDays ?? 15,
    paymentTerms: proposta.paymentTerms || "30 dias DDL",
    warrantyMonths: proposta.warrantyMonths ?? 12,
    brandModel: proposta.brandModel || "",
    contactName: proposta.contactName || "",
    contactEmail: proposta.contactEmail || "",
    contactPhone: proposta.contactPhone || "",
    notes: proposta.notes || "",
    itemPrices: (proposta.itemPrices || {}) as Record<string, number>,
  });

  useEffect(() => {
    setOfferUrl(extractProposalOfferUrl(proposta.notes, proposta.brandModel) || "");
    setDraft({
      unitPrice: proposta.unitPrice ?? 0,
      freightCost: proposta.freightCost ?? 0,
      freightType: (proposta.freightType || ((proposta.freightCost ?? 0) > 0 ? "FOB" : "CIF")) as
        "CIF" | "FOB",
      deliveryTime: proposta.deliveryTime ?? 5,
      validityDays: proposta.validityDays ?? 15,
      paymentTerms: proposta.paymentTerms || "30 dias DDL",
      warrantyMonths: proposta.warrantyMonths ?? 12,
      brandModel: proposta.brandModel || "",
      contactName: proposta.contactName || "",
      contactEmail: proposta.contactEmail || "",
      contactPhone: proposta.contactPhone || "",
      notes: proposta.notes || "",
      itemPrices: (proposta.itemPrices || {}) as Record<string, number>,
    });
  }, [
    proposta.unitPrice,
    proposta.freightCost,
    proposta.freightType,
    proposta.deliveryTime,
    proposta.validityDays,
    proposta.paymentTerms,
    proposta.warrantyMonths,
    proposta.brandModel,
    proposta.contactName,
    proposta.contactEmail,
    proposta.contactPhone,
    proposta.notes,
    proposta.itemPrices,
  ]);

  const hasSpecificItems = Boolean(rfqItems && rfqItems.length > 0);

  const subtotalItens = hasSpecificItems
    ? (rfqItems || []).reduce((acc, it) => {
        const p =
          draft.itemPrices[it.id] !== undefined ? draft.itemPrices[it.id] : draft.unitPrice || 0;
        return acc + p * (it.quantity || 1);
      }, 0)
    : (draft.unitPrice || 0) * (totalQtd || 1);

  const effectiveFreight = draft.freightType === "CIF" ? 0 : Number(draft.freightCost || 0);
  const totalEqualizado = subtotalItens + effectiveFreight;

  const handleSalvar = () => {
    const cleanUrl = offerUrl.trim();
    let finalNotes = draft.notes || "";
    if (cleanUrl && !finalNotes.includes(cleanUrl)) {
      finalNotes = finalNotes
        ? `${finalNotes}\nLink da Oferta: ${cleanUrl}`
        : `Link da Oferta: ${cleanUrl}`;
    }

    onSalvar(proposta.id, {
      ...draft,
      supplierName: displaySupplierName,
      notes: finalNotes,
      freightCost: effectiveFreight,
      totalCalculated: totalEqualizado,
      status: "received",
    });
    setAberto(false);
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cotacao/${rfqCode}?supId=${encodeURIComponent(proposta.supplierId)}&fornecedor=${encodeURIComponent(proposta.supplierName)}&cnpj=${encodeURIComponent(proposta.cnpj || "")}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        title: "Link Copiado!",
        message: `Link exclusivo para ${proposta.supplierName} copiado com sucesso.`,
      });
    }
  };

  const handleWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cotacao/${rfqCode}?supId=${encodeURIComponent(proposta.supplierId)}&fornecedor=${encodeURIComponent(proposta.supplierName)}&cnpj=${encodeURIComponent(proposta.cnpj || "")}`;
    const text = encodeURIComponent(
      `Olá, *${proposta.supplierName}*! Segue o link exclusivo para envio da sua proposta comercial referente à cotação *${rfqCode} - ${rfqTitle}*:\n\n${url}\n\nPor favor, preencha os preços e condições no link acima.`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      className={`${styles.propostaCard} ${proposta.status === "received" ? styles.propostaRecebida : ""} ${isWinner ? styles.propostaVencedora : ""}`}
    >
      <div className={styles.propostaCardHeader}>
        <div className={styles.propostaInfo}>
          <div className={styles.propostaFornecedorNome}>
            {isWinner && (
              <span className={styles.vencedorTag}>
                <Icon name="trophy-01" size={12} /> Melhor proposta
              </span>
            )}
            <MarketplaceLogo
              source={offerUrl || existingOfferUrl || displaySupplierName}
              size="sm"
              showFallbackIcon={false}
            />
            <strong>{displaySupplierName}</strong>
            {isMarketplaceOrLocalSupplier(displaySupplierName) || isMarketplaceOrLocalSupplier(proposta.supplierName) ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background:
                    proposta.supplierName.toLowerCase().includes("local") ||
                    proposta.supplierName.toLowerCase().includes("balcão")
                      ? "#fef3c7"
                      : "#e0f2fe",
                  color:
                    proposta.supplierName.toLowerCase().includes("local") ||
                    proposta.supplierName.toLowerCase().includes("balcão")
                      ? "#92400e"
                      : "#0369a1",
                  border: `1px solid ${
                    proposta.supplierName.toLowerCase().includes("local") ||
                    proposta.supplierName.toLowerCase().includes("balcão")
                      ? "#fde68a"
                      : "#bae6fd"
                  }`,
                }}
              >
                {proposta.supplierName.toLowerCase().includes("local") ||
                proposta.supplierName.toLowerCase().includes("balcão") ? (
                  <>
                    <Icon name="building-07" size={12} />
                    <span>Comércio Local</span>
                  </>
                ) : (
                  <>
                    <Icon name="shopping-cart-01" size={12} />
                    <span>Compra Online / Link</span>
                  </>
                )}
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Icon name="building-01" size={12} />
                <span>Fornecedor B2B</span>
              </span>
            )}
            {(() => {
              const urlToCheck = offerUrl || existingOfferUrl;
              const mp = detectMarketplaceFromUrl(urlToCheck);
              if (!urlToCheck) return null;
              return (
                <a
                  href={urlToCheck.startsWith("http") ? urlToCheck : `https://${urlToCheck}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                    background: mp?.isMercadoLivre ? "#fefce8" : "#f0fdf9",
                    color: mp?.isMercadoLivre ? "#854d0e" : "#007d79",
                    border: mp?.isMercadoLivre ? "1px solid #fde047" : "1px solid #ccfbf1",
                  }}
                  title={`Abrir link do anúncio: ${urlToCheck}`}
                >
                  <MarketplaceLogo source={mp} size="sm" />
                  <span>{mp ? `Ver no ${mp.shortLabel}` : "Abrir Link da Oferta"}</span>
                  <Icon name="arrow-up-right" size={10} />
                </a>
              );
            })()}
          </div>
          <span className={styles.propostaCnpj}>{maskCnpj(proposta.cnpj) || proposta.cnpj}</span>
        </div>

        <div className={styles.propostaCardRight}>
          {!isMarketplaceOrLocal && (
            <SupplierEngagementBadge
              rfqId={rfqId}
              supplierId={proposta.supplierId}
              supplierName={proposta.supplierName}
              proposalStatus={proposta.status}
              onClick={() => onOpenTracking && onOpenTracking(proposta)}
            />
          )}
          {proposta.status === "received" && !aberto && (
            <div className={styles.propostaSumario}>
              <span className={styles.propostaPreco}>
                {formatCurrency(proposta.unitPrice!)} / un
              </span>
              <span className={styles.propostaPrazo}>
                {proposta.deliveryTime} dia(s) · {proposta.paymentTerms} · Frete{" "}
                {proposta.freightType || (proposta.freightCost ? "FOB" : "CIF")}
              </span>
            </div>
          )}

          <div className={styles.propostaActions}>
            {!isMarketplaceOrLocal && (
              <>
                <button
                  type="button"
                  className={styles.btnActionIcon}
                  onClick={() => onOpenTracking && onOpenTracking(proposta)}
                  title={`Ver histórico de leitura e atividades de ${proposta.supplierName}`}
                >
                  <Icon name="activity" size={14} />
                  <span>Atividades</span>
                </button>
                <button
                  type="button"
                  className={styles.btnActionIcon}
                  onClick={handleCopyLink}
                  title={`Copiar link exclusivo de ${proposta.supplierName}`}
                >
                  <Icon name="copy-01" size={14} />
                  <span>Copiar link</span>
                </button>
                <button
                  type="button"
                  className={styles.btnActionIcon}
                  onClick={handleWhatsApp}
                  title={`Enviar pelo WhatsApp para ${proposta.supplierName}`}
                >
                  <MarketplaceLogo source="whatsapp" size="sm" />
                  <span>WhatsApp</span>
                </button>
              </>
            )}
            {proposta.status === "awaiting" && (
              <button className={styles.btnRegistrar} onClick={() => setAberto(!aberto)}>
                <Icon name="plus" size={14} /> Registrar proposta
              </button>
            )}
            {proposta.status === "received" && (
              <button className={styles.btnEditar} onClick={() => setAberto(!aberto)}>
                <Icon name="edit-01" size={14} /> {aberto ? "Fechar" : "Editar"}
              </button>
            )}
            {onRemover && !isWinner && (
              <button
                type="button"
                className={styles.btnActionIcon}
                onClick={() => onRemover(proposta.id)}
                title={`Remover ${proposta.supplierName} desta cotação`}
                style={{ color: "#ef4444", borderColor: "#fecaca" }}
              >
                <Icon name="trash-01" size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {aberto && (
        <div className={styles.propostaForm}>
          <div className={styles.propostaFormDivider} />

          {isMarketplaceOrLocal && (
            <div className={styles.propostaFormSection}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div className={styles.propostaSectionTitle} style={{ margin: 0 }}>
                  <Icon name="link-03" size={13} /> Link do Anúncio / Oferta Online
                </div>
                {suggestedOfferUrl && suggestedOfferUrl !== offerUrl && (
                  <button
                    type="button"
                    onClick={() => setOfferUrl(suggestedOfferUrl)}
                    style={{
                      background: "#f0fdf9",
                      border: "1px solid #99f6e4",
                      color: "#0f766e",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                    title="Preencher com o link anexado pelo solicitante da compra"
                  >
                    <Icon name="link-03" size={12} /> Usar link indicado na solicitação
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="url"
                  className={styles.propostaInput}
                  value={offerUrl}
                  placeholder="Cole aqui o link do anúncio (ex: https://produto.mercadolivre.com.br/... ou https://www.amazon.com.br/...)"
                  onChange={(e) => setOfferUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                {offerUrl && (
                  <a
                    href={offerUrl.startsWith("http") ? offerUrl : `https://${offerUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnActionIcon}
                    title="Abrir este link no navegador"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "8px 12px",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Icon name="arrow-up-right" size={14} /> Abrir link
                  </a>
                )}
              </div>
              {detectedMarketplace && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#007d79",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                  }}
                >
                  <Icon name="check-circle" size={13} />
                  <span>
                    Loja identificada: <strong>{detectedMarketplace.id === "ecommerce" ? detectedMarketplace.shortLabel : detectedMarketplace.label}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {hasSpecificItems ? (
            <div className={styles.propostaFormSection}>
              <div className={styles.propostaSectionTitle}>
                <Icon name="package" size={13} /> Itens da Cotação & Preços Ofertados
              </div>
              <div className={styles.propostaItemsTableWrapper}>
                <table className={styles.propostaItemsTable}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Item / Descrição</th>
                      <th style={{ width: "90px", textAlign: "right" }}>Qtd / Un</th>
                      <th style={{ width: "150px", textAlign: "right" }}>Preço Unit. (R$) *</th>
                      <th style={{ width: "130px", textAlign: "right" }}>Total Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqItems!.map((item, idx) => {
                      const price =
                        draft.itemPrices[item.id] !== undefined
                          ? draft.itemPrices[item.id]
                          : draft.unitPrice || 0;
                      const itemTotal = price * (item.quantity || 1);
                      return (
                        <tr key={item.id || idx}>
                          <td>
                            <ItemCell description={item.description} />
                          </td>
                          <td style={{ textAlign: "right", color: "#64748b" }}>
                            {item.quantity} {item.unit || "UN"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className={styles.propostaInput}
                              style={{ textAlign: "right", width: "100%", boxSizing: "border-box" }}
                              value={price || ""}
                              placeholder="0,00"
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const newPrices = { ...draft.itemPrices, [item.id]: val };
                                const sum = rfqItems!.reduce((acc, it) => {
                                  const p = newPrices[it.id] !== undefined ? newPrices[it.id] : 0;
                                  return acc + p * (it.quantity || 1);
                                }, 0);
                                const avg = totalQtd > 0 ? sum / totalQtd : val;
                                setDraft((d) => ({
                                  ...d,
                                  itemPrices: newPrices,
                                  unitPrice: avg,
                                }));
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                            {formatCurrency(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={styles.propostaFormSection}>
              <div className={styles.propostaSectionTitle}>
                <Icon name="tag" size={13} /> Valor da Proposta
              </div>
              <div className={styles.propostaFormGrid}>
                <div className={styles.propostaField}>
                  <label>Preço Unitário Líquido (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={styles.propostaInput}
                    value={draft.unitPrice || ""}
                    placeholder="0,00"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.propostaFormSection}>
            <div className={styles.propostaSectionTitle}>
              <Icon name="truck-01" size={13} /> {isMarketplaceOrLocal ? "Frete & Previsão de Entrega" : "Frete, Logística & Prazos"}
            </div>
            <div className={styles.propostaFormGrid}>
              <div className={styles.propostaField}>
                <label>{isMarketplaceOrLocal ? "Modalidade de Envio" : "Tipo de Frete (Incoterm)"}</label>
                <Select
                  options={
                    isMarketplaceOrLocal
                      ? [
                          { label: "Frete Grátis (Full / Incluso)", value: "CIF" },
                          { label: "Frete Pago à Parte", value: "FOB" },
                        ]
                      : [
                          { label: "CIF (Incluso pelo fornecedor)", value: "CIF" },
                          { label: "FOB (A pagar pelo comprador)", value: "FOB" },
                        ]
                  }
                  value={draft.freightType}
                  onChange={(val) => {
                    const type = val as "CIF" | "FOB";
                    setDraft((d) => ({
                      ...d,
                      freightType: type,
                      freightCost: type === "CIF" ? 0 : d.freightCost,
                    }));
                  }}
                  searchable={false}
                />
              </div>

              <div className={styles.propostaField}>
                <label>Custo de Frete Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={draft.freightType === "CIF"}
                  className={styles.propostaInput}
                  placeholder={draft.freightType === "CIF" ? "Grátis / Incluso" : "0,00"}
                  value={draft.freightType === "CIF" ? "" : draft.freightCost || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, freightCost: Number(e.target.value) || 0 }))
                  }
                />
              </div>

              <div className={styles.propostaField}>
                <label>{isMarketplaceOrLocal ? "Prazo de Entrega do Site (dias)" : "Prazo de Entrega (dias úteis)"}</label>
                <input
                  type="number"
                  min="0"
                  className={styles.propostaInput}
                  value={draft.deliveryTime || ""}
                  placeholder="Ex: 5"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, deliveryTime: Number(e.target.value) || 0 }))
                  }
                />
              </div>

              {!isMarketplaceOrLocal && (
                <div className={styles.propostaField}>
                  <label>Validade da Proposta (dias)</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.propostaInput}
                    value={draft.validityDays || ""}
                    placeholder="Ex: 15"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, validityDays: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {isMarketplaceOrLocal ? (
            <>
              <div className={styles.propostaFormSection}>
                <div className={styles.propostaSectionTitle}>
                  <Icon name="bank-note-01" size={13} /> Condição de Pagamento
                </div>
                <div className={styles.propostaField} style={{ maxWidth: 420 }}>
                  <input
                    className={styles.propostaInput}
                    list={`paymentTerms-${proposta.supplierId}`}
                    value={draft.paymentTerms}
                    placeholder="Ex: Cartão de Crédito Corporativo, Conta ML Igreja Pura Fé, PIX..."
                    onChange={(e) => setDraft((d) => ({ ...d, paymentTerms: e.target.value }))}
                  />
                  <datalist id={`paymentTerms-${proposta.supplierId}`}>
                    <option value="Cartão de Crédito Corporativo" />
                    <option value="À vista / PIX" />
                    <option value="Boleto Bancário à Vista" />
                    <option value="Conta Mercado Livre Igreja Pura Fé" />
                  </datalist>
                </div>
              </div>

              <div style={{ marginTop: 4, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#007d79",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 0",
                  }}
                >
                  <Icon name={showAdvanced ? "chevron-up" : "chevron-down"} size={14} />
                  {showAdvanced
                    ? "Recolher informações complementares"
                    : "+ Informações complementares (Garantia, Loja do Anúncio, Observações)"}
                </button>

                {showAdvanced && (
                  <div
                    style={{
                      padding: 16,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      marginTop: 8,
                    }}
                  >
                    <div className={styles.propostaFormGrid}>
                      <div className={styles.propostaField}>
                        <label>Garantia Ofertada (meses)</label>
                        <input
                          type="number"
                          min="0"
                          className={styles.propostaInput}
                          value={draft.warrantyMonths || ""}
                          placeholder="Ex: 12"
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              warrantyMonths: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className={styles.propostaField}>
                        <label>Loja / Vendedor no Anúncio</label>
                        <input
                          className={styles.propostaInput}
                          value={draft.brandModel}
                          placeholder="Ex: Loja Oficial Bosch, Vendedor Platinum..."
                          onChange={(e) => setDraft((d) => ({ ...d, brandModel: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className={styles.propostaField}>
                      <label>Observações Adicionais da Oferta</label>
                      <textarea
                        rows={2}
                        className={styles.propostaTextarea}
                        value={draft.notes}
                        placeholder="Informações adicionais, cupom aplicado, especificações..."
                        onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.propostaFormSection}>
                <div className={styles.propostaSectionTitle}>
                  <Icon name="bank-note-01" size={13} /> Condições Comerciais & Garantia
                </div>
                <div className={styles.propostaFormGrid}>
                  <div className={styles.propostaField}>
                    <label>Condição de Pagamento</label>
                    <input
                      className={styles.propostaInput}
                      list={`paymentTerms-${proposta.supplierId}`}
                      value={draft.paymentTerms}
                      placeholder="Ex: 30 dias DDL, À vista..."
                      onChange={(e) => setDraft((d) => ({ ...d, paymentTerms: e.target.value }))}
                    />
                    <datalist id={`paymentTerms-${proposta.supplierId}`}>
                      <option value="30 dias DDL" />
                      <option value="28 dias DDL" />
                      <option value="14 dias DDL" />
                      <option value="À vista / PIX" />
                      <option value="28/56 dias DDL" />
                      <option value="45 dias DDL" />
                      <option value="60 dias DDL" />
                    </datalist>
                  </div>

                  <div className={styles.propostaField}>
                    <label>Garantia Ofertada (meses)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.propostaInput}
                      value={draft.warrantyMonths || ""}
                      placeholder="Ex: 12"
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, warrantyMonths: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div className={styles.propostaField}>
                    <label>Marca / Fabricante / Modelo</label>
                    <input
                      className={styles.propostaInput}
                      value={draft.brandModel}
                      placeholder="Ex: Bosch, Dell, Ferragens Silva..."
                      onChange={(e) => setDraft((d) => ({ ...d, brandModel: e.target.value }))}
                    />
                  </div>

                  <div className={styles.propostaField}>
                    <label>Link da Oferta / Catálogo (opcional)</label>
                    <input
                      type="url"
                      className={styles.propostaInput}
                      value={offerUrl}
                      placeholder="https://..."
                      onChange={(e) => setOfferUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.propostaFormSection}>
                <div className={styles.propostaSectionTitle}>
                  <Icon name="users-01" size={13} /> Dados do Vendedor / Representante Comercial
                </div>
                <div
                  className={styles.propostaFormGrid}
                  style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                >
                  <div className={styles.propostaField}>
                    <label>Nome do Vendedor / Contato</label>
                    <input
                      className={styles.propostaInput}
                      value={draft.contactName}
                      placeholder="Ex: João da Silva"
                      onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
                    />
                  </div>
                  <div className={styles.propostaField}>
                    <label>Telefone / WhatsApp Comercial</label>
                    <input
                      className={styles.propostaInput}
                      value={draft.contactPhone}
                      placeholder="Ex: (11) 98765-4321"
                      onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div className={styles.propostaField}>
                    <label>E-mail Comercial</label>
                    <input
                      type="email"
                      className={styles.propostaInput}
                      value={draft.contactEmail}
                      placeholder="Ex: comercial@fornecedor.com"
                      onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.propostaFormSection}>
                <div className={styles.propostaSectionTitle}>
                  <Icon name="file-01" size={13} /> Observações Comerciais & Justificativa
                </div>
                <div className={styles.propostaField}>
                  <textarea
                    className={styles.propostaTextarea}
                    rows={2}
                    value={draft.notes}
                    placeholder="Observações complementares, impostos inclusos (ICMS/IPI), lote mínimo de entrega, etc..."
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.propostaTotalBreakdown}>
            <div className={styles.breakdownItems}>
              <span>
                <strong>Subtotal itens:</strong> {formatCurrency(subtotalItens)}
              </span>
              <span>
                <strong>Frete:</strong>{" "}
                {draft.freightType === "CIF" ? "Incluso (CIF)" : formatCurrency(effectiveFreight)}
              </span>
              {draft.deliveryTime > 0 && (
                <span>
                  <strong>Prazo:</strong> {draft.deliveryTime} dias
                </span>
              )}
            </div>
            <div className={styles.breakdownTotal}>
              <span>Custo Total Equalizado:</span>
              <strong>{formatCurrency(totalEqualizado)}</strong>
            </div>
          </div>

          <div className={styles.propostaFormActions}>
            <button className={styles.btnCancelarForm} onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button className={styles.btnSalvarProposta} onClick={handleSalvar}>
              <Icon name="save-01" size={15} /> Salvar proposta comercial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RfqDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<RfqStage>("proposal");
  const [propostas, setPropostas] = useState<LocalProposal[]>([]);
  const [vencedorId, setVencedorId] = useState<string | null>(null);

  type DialogType = "encerrar" | "selecionar" | "gerar" | "cancelar" | null;
  const [dialog, setDialog] = useState<DialogType>(null);
  const [pendingVencedorId, setPendingVencedorId] = useState<string | null>(null);
  const [generatedPo, setGeneratedPo] = useState<{ id: string; code: string } | null>(null);
  const [trackingSupplier, setTrackingSupplier] = useState<LocalProposal | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);
  const [creatingPo, setCreatingPo] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const suggestedOfferUrl = useMemo(() => {
    const rfqAny = rfq as any;
    for (const it of rfqAny?.items || []) {
      const fromIt =
        it.referenceUrl || extractProposalOfferUrl(it.description, it.notes);
      if (fromIt) return fromIt;
    }
    const prItems = rfqAny?.purchaseRequest?.items || [];
    for (const it of prItems) {
      const fromPr =
        it.referenceUrl || extractProposalOfferUrl(it.description, it.notes);
      if (fromPr) return fromPr;
    }
    const fromRfqNotes = extractProposalOfferUrl(rfqAny?.notes);
    if (fromRfqNotes) return fromRfqNotes;
    const fromPrNotes = extractProposalOfferUrl(rfqAny?.purchaseRequest?.notes);
    if (fromPrNotes) return fromPrNotes;
    return null;
  }, [rfq]);

  const [proposalPage, setProposalPage] = useState(1);
  const [proposalSearch, setProposalSearch] = useState("");
  const [proposalStatusFilter, setProposalStatusFilter] = useState<
    "todos" | "awaiting" | "received" | "declined"
  >("todos");
  const PROPOSALS_PER_PAGE = 5;
  const [addingQuickOption, setAddingQuickOption] = useState(false);

  const handleAddQuickProposals = async (preset: "mercadolivre" | "local") => {
    setAddingQuickOption(true);
    try {
      const originItemUrl =
        rfqItems?.find((it: any) => it.referenceUrl)?.referenceUrl ||
        extractProposalOfferUrl((rfq as any)?.notes, (rfq?.purchaseRequest as any)?.notes) ||
        "";

      const onlineCount = propostas.filter((p) =>
        p.supplierName.toLowerCase().includes("mercado livre") ||
        p.supplierName.toLowerCase().includes("link") ||
        p.supplierName.toLowerCase().includes("online")
      ).length;

      const localCount = propostas.filter((p) =>
        p.supplierName.toLowerCase().includes("local")
      ).length;

      let masterSupplier: any = null;
      const targetCnpj =
        preset === "mercadolivre" ? "03007331000141" : "00000000000191";
      const targetSearch = preset === "mercadolivre" ? "Mercado Livre" : "Comércio Local";

      try {
        const foundList = await suppliersApi.list({ search: targetSearch });
        masterSupplier = foundList.find((s) => {
          const clean = s.cnpj?.replace(/\D/g, "");
          return (
            clean === targetCnpj ||
            (preset === "mercadolivre" &&
              (s.corporateName.toLowerCase().includes("mercado livre") ||
                s.tradeName?.toLowerCase().includes("mercado livre"))) ||
            (preset === "local" &&
              (s.corporateName.toLowerCase().includes("comércio local") ||
                s.tradeName?.toLowerCase().includes("comércio local")))
          );
        });

        if (!masterSupplier) {
          const byCnpj = await suppliersApi.list({ search: targetCnpj });
          if (byCnpj && byCnpj.length > 0) masterSupplier = byCnpj[0];
        }
      } catch {}

      const count = preset === "mercadolivre" ? onlineCount : localCount;
      const offerSuffix = count > 0 ? ` (Oferta ${count + 1})` : "";

      const templates =
        preset === "mercadolivre"
          ? [
              {
                name: masterSupplier
                  ? `${masterSupplier.tradeName || masterSupplier.corporateName}${offerSuffix}`
                  : `Mercado Livre${offerSuffix || " (Compra Online via Link)"}`,
                cnpj: masterSupplier ? masterSupplier.cnpj : "03.007.331/0001-41",
                email: masterSupplier?.contactEmail || "cotacao@mercadolivre.com.br",
                contactName: "Equipe Mercado Livre",
                paymentTerms: "Cartão Corporativo / PIX",
                initialNotes: originItemUrl ? `Link da Oferta: ${originItemUrl}` : "",
              },
            ]
          : [
              {
                name: masterSupplier
                  ? `${masterSupplier.tradeName || masterSupplier.corporateName}${offerSuffix}`
                  : `Comércio Local${offerSuffix || " / Compra Presencial"}`,
                cnpj: masterSupplier ? masterSupplier.cnpj : "00.000.000/0001-91",
                email: masterSupplier?.contactEmail || "orcamento.local@compramais.interno",
                contactName: "Atendimento Presencial",
                paymentTerms: "À vista (PIX / Boleto)",
                initialNotes: "",
              },
            ];

      const newProposals: LocalProposal[] = [];

      for (const tpl of templates) {
        let createdSupplierId = masterSupplier?.id || `quick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        let createdName = tpl.name;
        let createdCnpj = masterSupplier?.cnpj || tpl.cnpj;

        if (!masterSupplier) {
          try {
            const res = await rfqsApi.inviteUnregisteredSupplier(rfqId, {
              cnpj: tpl.cnpj,
              corporateName: tpl.name,
              contactEmail: tpl.email,
              contactName: tpl.contactName,
            });
            if (res?.supplier?.id) {
              createdSupplierId = res.supplier.id;
              createdName = res.supplier.tradeName || res.supplier.corporateName || tpl.name;
              createdCnpj = res.supplier.cnpj || tpl.cnpj;
            }
          } catch {
            try {
              const sup = await suppliersApi.create({
                corporateName: tpl.name,
                tradeName: tpl.name,
                cnpj: tpl.cnpj,
                contactEmail: tpl.email,
                contactName: tpl.contactName,
              });
              if (sup?.id) {
                createdSupplierId = sup.id;
              }
            } catch {}
          }
        }

        const uniqueCardId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        newProposals.push({
          id: uniqueCardId,
          supplierId: createdSupplierId,
          supplierName: createdName,
          cnpj: createdCnpj,
          status: "awaiting",
          paymentTerms: tpl.paymentTerms,
          contactName: tpl.contactName,
          notes: tpl.initialNotes,
        });
      }

      setPropostas((prev) => [...prev, ...newProposals]);
      toast({
        variant: "success",
        title:
          preset === "mercadolivre"
            ? "Opção de Compra Online adicionada!"
            : "Opção de Fornecedor Local adicionada!",
        message:
          "Clique em 'Registrar proposta' no card para preencher o valor e as condições.",
      });
    } catch (err) {
      logError("rfqs/[id]/addQuickProposals", err);
      toast({
        variant: "error",
        title: "Erro ao adicionar opção",
        message: getErrorMessage(err),
      });
    } finally {
      setAddingQuickOption(false);
    }
  };

  const handleCancelRfq = async () => {
    const reason = cancelReason.trim();
    if (!reason) {
      toast({
        variant: "warning",
        title: "Motivo obrigatório",
        message: "Por favor, informe a justificativa do cancelamento da cotação.",
      });
      return;
    }

    try {
      setCancelling(true);
      await rfqsApi.updateStatus(rfq?.id || rfqId, "Cancelled", reason);
      const originReqId = rfq?.purchaseRequest?.id || rfq?.requestId;
      if (originReqId) {
        try {
          await purchaseRequestsApi.updateStatus(
            originReqId,
            "Approved",
            `Cotação ${rfqCode} cancelada. Motivo: ${reason}`,
          );
        } catch (reqErr) {
          console.warn("Falha ao reabrir solicitação de compra de origem:", reqErr);
        }
      }
      const updated = await rfqsApi.getById(rfqId);
      setRfq(updated);
      setCancelReason("");
      toast({
        variant: "warning",
        title: "Cotação cancelada",
        message:
          "A cotação foi cancelada. A solicitação de compra de origem foi reaberta para cotação.",
      });
    } catch (e) {
      logError("rfqs/[id]/cancel", e);
      toast({ variant: "error", title: "Erro ao cancelar cotação", message: getErrorMessage(e) });
    } finally {
      setCancelling(false);
      setDialog(null);
    }
  };

  const handlePublishRfq = async () => {
    try {
      setPublishing(true);
      await rfqsApi.updateStatus(rfqId, "Open");
      const updated = await rfqsApi.getById(rfqId);
      setRfq(updated);
      setPropostas(mapPropostas(updated));
      setStage(getStage(updated));
      toast({
        variant: "success",
        title: "Cotação publicada com sucesso!",
        message: "A cotação agora está aberta no mercado e os fornecedores podem enviar propostas.",
      });
    } catch (e) {
      logError("rfqs/[id]/publish", e);
      toast({
        variant: "error",
        title: "Erro ao publicar cotação",
        message: getErrorMessage(e),
      });
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await rfqsApi.getById(rfqId);
        let pr = data.purchaseRequest as any;
        const targetReqId = data.requestId || pr?.id;
        if (targetReqId && (!pr || (!pr.corporateFilial && !pr.filialCode && !pr.companyCode))) {
          try {
            const fullPr = await purchaseRequestsApi.getById(targetReqId);
            if (fullPr) {
              pr = { ...fullPr, ...pr };
              data.purchaseRequest = pr;
            }
          } catch {}
        }
        setRfq(data);
        setPropostas(mapPropostas(data));
        setStage(getStage(data));
        const winner = (data.proposals ?? []).find((p) => p.isWinner);
        if (winner) setVencedorId(winner.id);

        try {
          const orders = await purchaseOrdersApi.list();
          const match = orders.find(
            (o: any) =>
              (winner && o.winningProposalId === winner.id) ||
              (o.notes && (o.notes.includes(data.code) || o.notes.includes(data.id))) ||
              ((data.status === "Finished" || data.status === "Closed") &&
                winner &&
                o.supplierId === winner.supplierId),
          );
          if (match) {
            setGeneratedPo({ id: match.id, code: match.code });
          }
        } catch {}
      } catch (err) {
        logError("rfqs/[id]/load", err);
        toast({
          variant: "error",
          title: "Erro ao carregar cotação",
          message: getErrorMessage(err),
        });
      } finally {
        setLoading(false);
      }
    }
    if (rfqId) load();
  }, [rfqId]);

  const recebidas = propostas.filter((p) => p.status === "received");

  const filteredPropostas = useMemo(() => {
    return propostas.filter((p) => {
      const q = proposalSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.supplierName.toLowerCase().includes(q) ||
        (p.cnpj && p.cnpj.toLowerCase().includes(q));
      const matchStatus = proposalStatusFilter === "todos" || p.status === proposalStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [propostas, proposalSearch, proposalStatusFilter]);

  const totalProposalPages = Math.ceil(filteredPropostas.length / PROPOSALS_PER_PAGE) || 1;

  const paginatedPropostas = useMemo(() => {
    const start = (proposalPage - 1) * PROPOSALS_PER_PAGE;
    return filteredPropostas.slice(start, start + PROPOSALS_PER_PAGE);
  }, [filteredPropostas, proposalPage]);

  useEffect(() => {
    setProposalPage(1);
  }, [proposalSearch, proposalStatusFilter]);

  useEffect(() => {
    if (proposalPage > totalProposalPages) {
      setProposalPage(totalProposalPages);
    }
  }, [proposalPage, totalProposalPages]);
  const handleRemoverProposta = async (cardId: string) => {
    const propToRemove = propostas.find((p) => p.id === cardId);
    if (propToRemove?.proposalId) {
      try {
        await rfqsApi.deleteProposal(rfqId, propToRemove.proposalId);
      } catch (err: any) {
        logError("rfqs/[id]/deleteProposal", err);
        toast({
          variant: "error",
          title: "Erro ao excluir proposta",
          message: getErrorMessage(err),
        });
        return;
      }
    }
    setPropostas((prev) => prev.filter((p) => p.id !== cardId));
    toast({
      variant: "info",
      title: "Opção removida",
      message: "A opção de fornecedor/link foi removida da lista desta cotação.",
    });
  };

  const handleSalvarProposta = async (cardId: string, dados: Partial<LocalProposal>) => {
    const currentProp = propostas.find((p) => p.id === cardId);
    if (!currentProp) return;

    if (
      dados.unitPrice !== undefined ||
      (dados.itemPrices && Object.keys(dados.itemPrices).length > 0)
    ) {
      try {
        const itemsPayload =
          dados.itemPrices && Object.keys(dados.itemPrices).length > 0
            ? Object.entries(dados.itemPrices).map(([requestItemId, unitPrice]) => ({
                requestItemId,
                unitPrice: Number(unitPrice) || 0,
              }))
            : undefined;

        const propostaCriada = await rfqsApi.createProposal(rfqId, {
          proposalId: currentProp.proposalId,
          supplierId: currentProp.supplierId,
          unitPrice: Number(dados.unitPrice) || 0,
          freightCost: dados.freightType === "CIF" ? 0 : Number(dados.freightCost) || 0,
          freightType: dados.freightType,
          paymentTerms: dados.paymentTerms || "30 dias DDL",
          deliveryTime: Number(dados.deliveryTime) || 5,
          validityDays: Number(dados.validityDays) || 15,
          warrantyMonths: Number(dados.warrantyMonths) || 12,
          brandModel: dados.brandModel,
          contactName: dados.contactName,
          contactEmail: dados.contactEmail,
          contactPhone: dados.contactPhone,
          notes: dados.notes,
          items: itemsPayload,
        });

        const newProposalId = propostaCriada?.id || currentProp.proposalId;

        setPropostas((c) =>
          c.map((p) =>
            p.id === cardId
              ? {
                  ...p,
                  ...dados,
                  id: newProposalId || p.id,
                  proposalId: newProposalId,
                  status: "received",
                }
              : p,
          ),
        );
        toast({
          variant: "success",
          title: "Proposta salva!",
          message: "A proposta comercial foi consolidada e salva com sucesso.",
        });
      } catch (err) {
        logError("rfqs/[id]/createProposal", err);
        toast({
          variant: "error",
          title: "Erro ao salvar proposta",
          message: getErrorMessage(err),
        });
      }
    } else {
      setPropostas((c) =>
        c.map((p) => (p.id === cardId ? { ...p, ...dados } : p)),
      );
    }
  };

  const rfqItems = rfq?.purchaseRequest?.items ?? (rfq as any)?.items ?? [];
  const rawQtd =
    rfqItems.reduce((s: number, i: { quantity: number }) => s + Number(i.quantity || 0), 0) ?? 0;
  const totalQtd = rawQtd > 0 ? rawQtd : 1;

  const getProposalTotal = (p: LocalProposal | null | undefined) => {
    if (!p) return 0;
    if (p.totalCalculated !== undefined && p.totalCalculated > 0) {
      return p.totalCalculated;
    }
    return (p.unitPrice || 0) * totalQtd + (p.freightCost || 0);
  };

  const propostasRankeadas = [...recebidas].sort((a, b) => {
    return getProposalTotal(a) - getProposalTotal(b);
  });
  const melhorProposta = propostasRankeadas[0] || null;

  const vencedor = propostas.find((p) => p.id === vencedorId || p.proposalId === vencedorId);
  const pendingVencedor = propostas.find((p) => p.id === pendingVencedorId || p.proposalId === pendingVencedorId);

  const rfqTitle = rfq?.title || rfq?.purchaseRequest?.description || "—";
  const rfqCode = rfq?.code || rfqId;
  const originCode = rfq?.purchaseRequest?.code || "—";
  const closesAt = rfq?.closesAt ? new Date(rfq.closesAt).toLocaleDateString("pt-BR") : "—";

  const prObj = rfq?.purchaseRequest as any;
  const companyName = resolvePurchaseRequestBranch(prObj || rfq, user);
  const isPuraFe =
    companyName.toLowerCase().includes("pura fé") ||
    companyName.toLowerCase().includes("purafe") ||
    prObj?.companyCode === "PURAFE" ||
    prObj?.filialCode === "PURAFE";

  const vencedorOfferUrl = useMemo(() => {
    return (
      extractProposalOfferUrl(vencedor?.notes, vencedor?.brandModel) ||
      rfqItems?.find((it: any) => it.referenceUrl)?.referenceUrl ||
      extractProposalOfferUrl((rfq as any)?.notes, prObj?.notes) ||
      null
    );
  }, [vencedor, rfqItems, rfq, prObj?.notes]);

  const vencedorMarketplace = useMemo(
    () => detectMarketplaceFromUrl(vencedorOfferUrl),
    [vencedorOfferUrl],
  );
  const isWinnerMarketplaceOrLink =
    Boolean(vencedorOfferUrl) ||
    Boolean(vencedor?.supplierName?.toLowerCase().includes("mercado livre")) ||
    Boolean(vencedor?.supplierName?.toLowerCase().includes("amazon")) ||
    Boolean(vencedor?.supplierName?.toLowerCase().includes("shopee")) ||
    Boolean(vencedor?.supplierName?.toLowerCase().includes("magalu"));

  const isFinished = rfq?.status === "Finished" || rfq?.status === "Closed" || !!generatedPo;
  const isDraft = rfq?.status === "Draft";
  const isCancelled = rfq?.status === "Cancelled";
  const badgeVariant: "primary" | "danger" | "gray" | "dark" | "success" | "warning" = isCancelled
    ? "danger"
    : isDraft
      ? "gray"
      : isFinished
        ? "success"
        : stage === "approval"
          ? "warning"
          : stage === "analysis"
            ? "primary"
            : "success";
  const badgeLabel = isCancelled
    ? "Cancelada"
    : isDraft
      ? "Rascunho"
      : isFinished
        ? "Pedido Emitido"
        : stage === "proposal"
          ? "Aguardando propostas"
          : stage === "analysis"
            ? "Em análise"
            : "Em aprovação";

  const headerContent = (
    <>
      <ConfirmDialog
        open={dialog === "encerrar"}
        variant="warning"
        icon="alert-triangle"
        title="Encerrar coleta de propostas?"
        message={`${recebidas.length} de ${propostas.length} propostas foram registradas. Após encerrar, não será possível adicionar novas respostas.`}
        confirmLabel="Encerrar e analisar"
        onConfirm={async () => {
          try {
            await rfqsApi.updateStatus(rfqId, "UnderAnalysis");
            setStage("analysis");
            toast({
              variant: "warning",
              title: "Coleta encerrada",
              message: `${recebidas.length} proposta${recebidas.length !== 1 ? "s" : ""} recebida${recebidas.length !== 1 ? "s" : ""}. Agora você pode analisar e selecionar o vencedor.`,
            });
          } catch (e) {
            logError("rfqs/[id]/encerrar", e);
            toast({ variant: "error", title: "Erro ao encerrar", message: getErrorMessage(e) });
          } finally {
            setDialog(null);
          }
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "selecionar"}
        variant="success"
        icon="trophy-01"
        title="Selecionar este fornecedor como vencedor?"
        loading={selectingWinner}
        loadingConfirmLabel="Selecionando..."
        message={
          pendingVencedor ? (
            <>
              <strong>{pendingVencedor.supplierName}</strong> será declarado vencedor desta RFQ. Um
              Pedido de Compra será gerado em seguida.
            </>
          ) : (
            "Confirmar seleção do vencedor."
          )
        }
        confirmLabel="Confirmar seleção"
        onConfirm={async () => {
          if (pendingVencedorId) {
            setSelectingWinner(true);
            try {
              const prop = propostas.find(
                (p) => p.id === pendingVencedorId || p.proposalId === pendingVencedorId,
              );
              let propostaIdParaEnviar = prop?.proposalId;

              if (!propostaIdParaEnviar && prop) {
                const propCriada = await rfqsApi.createProposal(rfqId, {
                  supplierId: prop.supplierId,
                  unitPrice: prop.unitPrice ?? 0,
                  freightCost: prop.freightCost ?? 0,
                  paymentTerms: prop.paymentTerms || "30 dias DDL",
                  deliveryTime: prop.deliveryTime ?? 5,
                });
                propostaIdParaEnviar = propCriada?.id;
              }

              if (!propostaIdParaEnviar) {
                toast({
                  variant: "error",
                  title: "Proposta não encontrada",
                  message: "Não foi possível registrar a proposta para este fornecedor.",
                });
                setDialog(null);
                setPendingVencedorId(null);
                return;
              }

              await rfqsApi.selectWinner(rfqId, propostaIdParaEnviar);

              const updated = await rfqsApi.getById(rfqId);
              setRfq(updated);
              setPropostas(mapPropostas(updated));
              const winner = (updated.proposals ?? []).find((p) => p.isWinner);
              setVencedorId(winner ? winner.id : propostaIdParaEnviar);
              setStage(getStage(updated));

              toast({
                variant: "success",
                title: "Fornecedor selecionado!",
                message: `${pendingVencedor?.supplierName ?? "Fornecedor"} foi declarado vencedor desta RFQ no servidor.`,
              });
            } catch (e) {
              logError("rfqs/[id]/selectWinner", e);
              toast({
                variant: "error",
                title: "Erro ao selecionar vencedor",
                message: getErrorMessage(e),
              });
            } finally {
              setSelectingWinner(false);
              setPendingVencedorId(null);
              setDialog(null);
            }
          }
        }}
        onCancel={() => {
          setPendingVencedorId(null);
          setDialog(null);
        }}
      />

      <ConfirmDialog
        open={dialog === "gerar"}
        variant="info"
        icon="file-check-02"
        title="Emitir Pedido de Compra?"
        loading={creatingPo}
        loadingConfirmLabel="Emitindo Pedido..."
        message={
          vencedor ? (
            <>
              O PO será emitido para <strong>{vencedor.supplierName}</strong> no valor total de{" "}
              <strong>{formatCurrency(getProposalTotal(vencedor))}</strong>. Esta ação é definitiva
              e consolidará o processo de compras.
              {recebidas.length < 3 && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: "#fef3c7",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#92400e",
                  }}
                >
                  <strong>Aviso de Governança:</strong> Processo concluído com {recebidas.length}{" "}
                  proposta(s) recebida(s). Certifique-se de que a dispensa ou exclusividade de
                  fornecedor está documentada.
                </div>
              )}
            </>
          ) : (
            "Confirmar emissão do Pedido de Compra."
          )
        }
        confirmLabel="Emitir Pedido de Compra"
        onConfirm={async () => {
          setCreatingPo(true);
          try {
            const buyerId = user?.name || user?.email || user?.id || "COMPRADOR";
            const po = await rfqsApi.createPo(rfqId, buyerId);
            const poObj = po as any;
            const createdCode = poObj?.code || "PO Gerado";
            const createdId = poObj?.id || poObj?.code || "";
            if (createdId) {
              setGeneratedPo({ id: createdId, code: createdCode });
            }
            setRfq((prev) => (prev ? { ...prev, status: "Finished" } : null));

            const originReqId = rfq?.purchaseRequest?.id || rfq?.requestId;
            if (originReqId) {
              try {
                await purchaseRequestsApi.updateStatus(
                  originReqId,
                  "Finished",
                  `Pedido de Compra ${createdCode} emitido a partir da RFQ ${rfqCode}. Demanda finalizada com sucesso.`,
                );
              } catch (reqErr) {
                console.warn("Falha ao finalizar solicitação de compra de origem:", reqErr);
              }
            }

            toast({
              variant: "success",
              title: "Pedido de Compra emitido com sucesso!",
              message: `PO ${createdCode} gerado para ${vencedor?.supplierName ?? "fornecedor"}. Demanda de compra finalizada.`,
              duration: 6000,
            });
            setDialog(null);
          } catch (e) {
            logError("rfqs/[id]/createPo", e);
            toast({
              variant: "error",
              title: "Erro ao emitir Pedido",
              message: getErrorMessage(e),
            });
          } finally {
            setCreatingPo(false);
          }
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "cancelar"}
        variant="danger"
        icon="trash-01"
        title="Cancelar Cotação (RFQ)?"
        loading={cancelling}
        loadingConfirmLabel="Cancelando..."
        confirmDisabled={!cancelReason.trim()}
        message={
          <>
            Tem certeza de que deseja cancelar a cotação <strong>{rfqCode}</strong>? Esta ação
            anulará o processo de concorrência e reabrirá a demanda de compra de origem para uma
            nova cotação.
          </>
        }
        confirmLabel="Sim, cancelar cotação"
        onConfirm={handleCancelRfq}
        onCancel={() => {
          setDialog(null);
          setCancelReason("");
        }}
      >
        <div style={{ marginTop: 12, textAlign: "left" }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 6,
            }}
          >
            Motivo do cancelamento <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            autoFocus
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Descreva detalhadamente a justificativa para o cancelamento da cotação..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </ConfirmDialog>

      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{rfqCode}</h1>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <p className={styles.subtitleLarge}>{rfqTitle}</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}>
              <Icon name="building-01" /> {companyName}
            </span>
            <span className={styles.infoTag}>
              <Icon name="file-01" /> Demanda: {originCode}
            </span>
            <span className={styles.infoTag}>
              <Icon name="clock" /> Encerra em: {closesAt}
            </span>
            <span className={styles.infoTag}>
              <Icon name="users-01" /> {recebidas.length} de {propostas.length} Propostas Recebidas
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {isDraft && (
            <Button
              variant="primary"
              onClick={handlePublishRfq}
              disabled={publishing}
              loading={publishing}
              loadingText="Publicando..."
            >
              <Icon name="send-01" /> Publicar Cotação no Mercado
            </Button>
          )}

          {!isCancelled && !isFinished && (
            <Button
              variant="danger"
              onClick={() => setDialog("cancelar")}
              title="Cancelar esta cotação de mercado"
            >
              <Icon name="x-close" /> Cancelar Cotação
            </Button>
          )}
        </div>
      </div>

      <Card className={styles.stepperCard}>
        <Stepper
          steps={[
            {
              label: "Coleta de propostas",
              description: `${recebidas.length} de ${propostas.length} recebidas`,
              status: stage === "proposal" ? "active" : "completed",
            },
            {
              label: "Análise e comparativo",
              description: "Equalização comercial",
              status:
                stage === "analysis" ? "active" : stage === "approval" ? "completed" : "pending",
            },
            {
              label: "Aprovação e PO",
              description: "Geração do pedido",
              status: stage === "approval" ? "active" : "pending",
            },
          ]}
        />
      </Card>
    </>
  );

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
          <Icon name="chevron-left" /> Voltar para Cotações
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
          <div
            style={{
              padding: 24,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="text" width="65%" style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <Skeleton width={140} height={28} />
              <Skeleton width={140} height={28} />
            </div>
          </div>
          <CardSkeleton height={340} />
        </div>
      </div>
    );
  }

  if (stage === "proposal") {
    return (
      <div className={styles.detailContainer}>
        {headerContent}

        <div className={styles.coletaHeader}>
          <div>
            <h2 className={styles.coletaTitulo}>
              Fornecedores Convidados & Propostas
              {propostas.length === 0 && (
                <span style={{ fontSize: 13, fontWeight: 400, color: "#94a3b8", marginLeft: 8 }}>
                  Aguardando envio de propostas
                </span>
              )}
            </h2>
            {propostas.length > 0 && (
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {propostas.length} fornecedor
                {propostas.length !== 1 ? "es convidados" : " convidado"} para esta cotação
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {!isCancelled && !isFinished && (
              <>
                <button
                  type="button"
                  disabled={addingQuickOption}
                  onClick={() => handleAddQuickProposals("mercadolivre")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #f59e0b",
                    background: "#fffbeb",
                    color: "#92400e",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: addingQuickOption ? "not-allowed" : "pointer",
                  }}
                >
                  <MarketplaceLogo source="mercadolivre" size="sm" /> + Adicionar Link Online
                </button>
                <button
                  type="button"
                  disabled={addingQuickOption}
                  onClick={() => handleAddQuickProposals("local")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: addingQuickOption ? "not-allowed" : "pointer",
                  }}
                >
                  <Icon name="building-07" size={14} style={{ color: "#007d79" }} /> + Adicionar Fornecedor Local
                </button>
              </>
            )}
            {recebidas.length > 0 && (
              <Button variant="primary" onClick={() => setDialog("encerrar")}>
                Encerrar coleta e ir para análise
              </Button>
            )}
          </div>
        </div>

        {propostas.length > 0 && (
          <div className={styles.proposalFilterToolbar}>
            <div className={styles.proposalSearchInput}>
              <Icon name="search-sm" size={16} className={styles.searchIconInside} />
              <input
                type="text"
                placeholder="Buscar por razão social ou CNPJ..."
                value={proposalSearch}
                onChange={(e) => setProposalSearch(e.target.value)}
              />
              {proposalSearch && (
                <button
                  type="button"
                  onClick={() => setProposalSearch("")}
                  className={styles.clearSearchBtn}
                  title="Limpar busca"
                >
                  <Icon name="x-close" size={14} />
                </button>
              )}
            </div>

            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${proposalStatusFilter === "todos" ? styles.filterTabBtnActive : ""}`}
                onClick={() => setProposalStatusFilter("todos")}
              >
                Todos ({propostas.length})
              </button>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${proposalStatusFilter === "awaiting" ? styles.filterTabBtnActive : ""}`}
                onClick={() => setProposalStatusFilter("awaiting")}
              >
                Aguardando ({propostas.filter((p) => p.status === "awaiting").length})
              </button>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${proposalStatusFilter === "received" ? styles.filterTabBtnActive : ""}`}
                onClick={() => setProposalStatusFilter("received")}
              >
                Recebidas ({recebidas.length})
              </button>
            </div>
          </div>
        )}

        <div className={styles.propostasList}>
          {propostas.length === 0 ? (
            <EmptyState
              illustration="no-suppliers"
              title="Nenhum fornecedor convidado"
              description="Convide fornecedores parceiros para enviarem suas propostas e cotações para esta demanda."
              size="sm"
            />
          ) : filteredPropostas.length === 0 ? (
            <div className={styles.emptyFiltered}>
              <Icon
                name="search-sm"
                size={24}
                style={{ color: "#94a3b8", margin: "0 auto 6px", display: "block" }}
              />
              <strong>Nenhum fornecedor encontrado</strong>
              <span>Nenhum fornecedor corresponde aos filtros de busca aplicados.</span>
              <button
                type="button"
                className={styles.btnClearFilter}
                onClick={() => {
                  setProposalSearch("");
                  setProposalStatusFilter("todos");
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              {paginatedPropostas.map((p) => (
                <PropostaCard
                  key={p.id}
                  proposta={p}
                  isWinner={vencedor?.id === p.id || (p.proposalId ? vencedor?.proposalId === p.proposalId : false) || vencedorId === p.id || !!p.isWinner}
                  totalQtd={totalQtd}
                  rfqItems={rfqItems}
                  rfqCode={rfqCode}
                  rfqId={rfq?.id || rfqId}
                  rfqTitle={rfqTitle}
                  suggestedOfferUrl={suggestedOfferUrl}
                  onSalvar={handleSalvarProposta}
                  onOpenTracking={(prop) => setTrackingSupplier(prop)}
                  onRemover={handleRemoverProposta}
                />
              ))}

              {filteredPropostas.length > 0 && (
                <div className={styles.supplierPaginationBar}>
                  <span>
                    Exibindo {(proposalPage - 1) * PROPOSALS_PER_PAGE + 1} -{" "}
                    {Math.min(proposalPage * PROPOSALS_PER_PAGE, filteredPropostas.length)} de{" "}
                    {filteredPropostas.length} fornecedor
                    {filteredPropostas.length !== 1 ? "es" : ""}
                  </span>
                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={proposalPage <= 1}
                      onClick={() => setProposalPage((p) => Math.max(1, p - 1))}
                    >
                      <Icon name="chevron-left" size={14} /> Anterior
                    </button>
                    <span className={styles.pageNumber}>
                      Página {proposalPage} de {totalProposalPages}
                    </span>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={proposalPage >= totalProposalPages}
                      onClick={() => setProposalPage((p) => Math.min(totalProposalPages, p + 1))}
                    >
                      Próxima <Icon name="chevron-right" size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (stage === "analysis") {
    return (
      <div className={styles.detailContainer}>
        {headerContent}

        {recebidas.length === 0 ? (
          <EmptyState
            illustration="mailbox-empty"
            title="Nenhuma proposta recebida"
            description="Ainda não há cotações enviadas pelos fornecedores para gerar o mapa comparativo."
            action={{
              label: "Voltar para coleta",
              variant: "secondary",
              onClick: () => setStage("proposal"),
            }}
            size="sm"
          />
        ) : (
          <>
            <div className={styles.rfqMetricsGrid}>
              <Card noPadding className={`${styles.metricCard} ${styles.darkCard}`}>
                <div className={styles.darkCardContent}>
                  <div className={styles.metricTop}>
                    <span>Menor custo equalizado</span>
                    <Icon name="trend-up-01" />
                  </div>
                  <h3>{formatCurrency(getProposalTotal(melhorProposta) / totalQtd)}/un</h3>
                  <span className={styles.subTextDark}>{melhorProposta?.supplierName || "—"}</span>
                </div>
              </Card>
              <Card className={styles.metricCard}>
                <span className={styles.label}>Menor preço unitário</span>
                <h3 className={styles.textPrimary}>
                  {formatCurrency(Math.min(...recebidas.map((p) => p.unitPrice || 0)))}
                </h3>
                <span className={styles.sub}>{propostasRankeadas[0]?.supplierName || "—"}</span>
              </Card>
              <Card className={styles.metricCard}>
                <span className={styles.label}>Média das propostas</span>
                <h3>
                  {formatCurrency(
                    recebidas.reduce((s, p) => s + (p.unitPrice || 0), 0) / (recebidas.length || 1),
                  )}
                </h3>
                <span className={styles.sub}>Base: {recebidas.length} propostas</span>
              </Card>
              <Card className={styles.metricCard}>
                <span className={styles.label}>Melhor prazo</span>
                <h3>{Math.min(...recebidas.map((p) => p.deliveryTime || 1))} dia(s)</h3>
                <span className={styles.sub}>
                  {
                    recebidas.find(
                      (p) => p.deliveryTime === Math.min(...recebidas.map((x) => x.deliveryTime!)),
                    )?.supplierName
                  }
                </span>
              </Card>
            </div>

            <Card noPadding className={styles.compareCard}>
              <div className={styles.cardHeaderFlex}>
                <div>
                  <h4>Matriz de Equalização Comercial</h4>
                  <p>Valores consolidados para tomada de decisão.</p>
                </div>
                <button className={styles.btnVoltarColeta} onClick={() => setStage("proposal")}>
                  <Icon name="arrow-left" size={15} /> Voltar e editar propostas
                </button>
              </div>

              <div className={styles.compareTableWrapper}>
                <table className={styles.compareTable}>
                  <thead>
                    <tr>
                      <th className={styles.rowHeader}>Critério</th>
                      {propostasRankeadas.map((p, i) => (
                        <th key={p.id} className={i === 0 ? styles.winnerHeaderCol : ""}>
                          {i === 0 && <div className={styles.winnerBadgeTip}>MELHOR OPÇÃO</div>}
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                            <MarketplaceLogo
                              source={extractProposalOfferUrl(p.notes, p.brandModel) || p.supplierName}
                              size="sm"
                              showFallbackIcon={false}
                            />
                            <span>{p.supplierName}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.rowHeader}>Preço Unitário Líquido</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellSuccess : styles.mutedCellText}
                        >
                          {formatCurrency(p.unitPrice!)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Custo de Frete (Total)</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellSuccess : styles.mutedCellText}
                        >
                          {formatCurrency(p.freightCost!)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Prazo de Entrega</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellSuccess : styles.mutedCellText}
                        >
                          {p.deliveryTime} dia(s)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Condição de Pagamento</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.paymentTerms}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Tipo de Frete / Envio</td>
                      {propostasRankeadas.map((p, i) => {
                        const isMkt = isMarketplaceOrLocalSupplier(p.supplierName);
                        const freightDisplay =
                          p.freightType === "CIF"
                            ? isMkt
                              ? "Frete Grátis / Incluso"
                              : "CIF (Incluso)"
                            : isMkt
                              ? "Frete Pago à Parte"
                              : "FOB (À parte)";
                        return (
                          <td
                            key={p.id}
                            className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                          >
                            {freightDisplay}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Validade da Oferta</td>
                      {propostasRankeadas.map((p, i) => {
                        const isMkt = isMarketplaceOrLocalSupplier(p.supplierName);
                        const validityDisplay = p.validityDays
                          ? `${p.validityDays} dias`
                          : isMkt
                            ? "Preço do anúncio"
                            : "15 dias";
                        return (
                          <td
                            key={p.id}
                            className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                          >
                            {validityDisplay}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Loja / Vendedor / Marca</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.brandModel || "—"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Garantia</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.warrantyMonths ? `${p.warrantyMonths} meses` : "—"}
                        </td>
                      ))}
                    </tr>
                    {propostasRankeadas.some((p) =>
                      Boolean(extractProposalOfferUrl(p.notes, p.brandModel)),
                    ) && (
                      <tr>
                        <td className={styles.rowHeader}>Link do Anúncio / Oferta</td>
                        {propostasRankeadas.map((p, i) => {
                          const pUrl = extractProposalOfferUrl(p.notes, p.brandModel);
                          const pMkt = detectMarketplaceFromUrl(pUrl);
                          return (
                            <td
                              key={p.id}
                              className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                            >
                              {pUrl ? (
                                <a
                                  href={pUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textDecoration: "none",
                                  background: pMkt?.isMercadoLivre ? "#fef3c7" : "#f0fdfa",
                                  color: pMkt?.isMercadoLivre ? "#92400e" : "#0f766e",
                                  border: `1px solid ${
                                    pMkt?.isMercadoLivre ? "#fcd34d" : "#99f6e4"
                                  }`,
                                }}
                              >
                                <MarketplaceLogo source={pMkt} size="sm" />{" "}
                                {pMkt ? `Abrir ${pMkt.shortLabel}` : "Ver Anúncio"}
                              </a>
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                    <tr className={styles.totalRow}>
                      <td className={styles.rowHeaderTotal}>Custo Total Equalizado</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.id}
                          className={i === 0 ? styles.winnerCellTotal : styles.totalMutedText}
                        >
                          {formatCurrency(getProposalTotal(p))}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader} />
                      {propostasRankeadas.map((p, i) => (
                        <td key={p.id} className={styles.selectCell}>
                          <button
                            className={
                              i === 0
                                ? styles.btnSelecionarVencedor
                                : styles.btnSelecionarSecundario
                            }
                            disabled={isFinished || !!generatedPo}
                            title={
                              isFinished || !!generatedPo
                                ? "Pedido já emitido para esta cotação"
                                : undefined
                            }
                            onClick={() => {
                              setPendingVencedorId(p.id);
                              setDialog("selecionar");
                            }}
                          >
                            {isFinished || !!generatedPo ? (
                              vencedor?.id === p.id || (p.proposalId && vencedor?.proposalId === p.proposalId) ? (
                                <>
                                  <Icon name="check" size={14} /> Contratado
                                </>
                              ) : (
                                "—"
                              )
                            ) : i === 0 ? (
                              <>
                                <Icon name="trophy-01" size={14} /> Selecionar vencedor
                              </>
                            ) : (
                              "Selecionar este"
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.detailContainer}>
      {headerContent}

      <div className={styles.aprovacaoContainer}>
        {generatedPo && (
          <div
            style={{
              background: "#f0fdf9",
              border: "1px solid #99f6e4",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#007d79",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="file-check-02" size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#004144" }}>
                    Pedido de Compra Oficial Emitido
                  </h3>
                  <Badge variant="success">Gerado</Badge>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#0f766e" }}>
                  Ordem de Compra oficial: <strong>{generatedPo.code}</strong> vinculada a esta
                  cotação. O ciclo de contratação foi formalizado.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/compras/pedidos/${generatedPo.id || generatedPo.code}`)}
            >
              Ir para o Pedido de Compra <Icon name="arrow-right" />
            </Button>
          </div>
        )}

        <div className={styles.aprovacaoBanner}>
          <div className={styles.aprovacaoBannerIcon}>
            <Icon name="trophy-01" />
          </div>
          <div className={styles.aprovacaoBannerText}>
            <h2>{generatedPo ? "Cotação Concluída & Pedido Emitido" : "Proposta Selecionada"}</h2>
            <p>
              {generatedPo
                ? `O processo foi encerrado com sucesso e o Pedido Oficial ${generatedPo.code} foi gerado.`
                : "Revise os detalhes comerciais antes de emitir o Pedido de Compra Oficial."}
            </p>
          </div>
        </div>

        {(isWinnerMarketplaceOrLink || isPuraFe) && (
          <div
            style={{
              background: isPuraFe ? "#fffbeb" : "#f0fdfa",
              border: `1px solid ${isPuraFe ? "#fcd34d" : "#99f6e4"}`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  background: "#ffffff",
                  border: `1px solid ${isPuraFe ? "#fcd34d" : "#99f6e4"}`,
                  color: isPuraFe ? "#b45309" : "#0f766e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {vencedorMarketplace?.logoPath ? (
                  <MarketplaceLogo source={vencedorMarketplace} size="md" />
                ) : (
                  <MarketplaceLogo
                    source={vencedor?.supplierName || "mercadolivre"}
                    size="md"
                  />
                )}
              </div>
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isPuraFe ? "#92400e" : "#115e59",
                  }}
                >
                  {isPuraFe
                    ? "Execução Direta pela Igreja Pura Fé (Conta Mercado Livre / Compra Local)"
                    : `Compra via Link / ${vencedorMarketplace?.label || "E-commerce"}`}
                </h4>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: isPuraFe ? "#78350f" : "#134e4a",
                    lineHeight: 1.5,
                  }}
                >
                  {isPuraFe
                    ? "Como esta cotação pertence à Igreja Pura Fé, a própria unidade possui acesso à sua conta do Mercado Livre (ou comércio local) para efetivar o pagamento e a compra diretamente a partir do link vencedor abaixo. Emita o Pedido de Compra para formalizar a aprovação e rastrear a entrega."
                    : "A proposta vencedora corresponde a uma oferta online. Utilize o link oficial abaixo para concluir a compra na plataforma e emita o Pedido de Compra para registro financeiro."}
                </p>
              </div>
            </div>
            {vencedorOfferUrl && (
              <a
                href={vencedorOfferUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: vencedorMarketplace?.isMercadoLivre ? "#f59e0b" : "#007d79",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="link-external-01" size={15} /> Abrir Anúncio Vencedor (
                {vencedorMarketplace?.shortLabel || "Link"})
              </a>
            )}
          </div>
        )}

        <div className={styles.aprovacaoGrid}>
          <Card className={styles.aprovacaoBox}>
            <h3>
              <Icon name="building-01" size={18} /> Fornecedor Vencedor
            </h3>
            <div className={styles.aprovacaoDataRow}>
              <span>Razão Social</span>
              <strong>{vencedor?.supplierName ?? "—"}</strong>
            </div>
            <div className={styles.aprovacaoDataRow}>
              <span>CNPJ</span>
              <strong>{vencedor?.cnpj ?? "—"}</strong>
            </div>
            {vencedorOfferUrl && (
              <div className={styles.aprovacaoDataRow}>
                <span>Link da Oferta</span>
                <a
                  href={vencedorOfferUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007d79",
                    fontWeight: 600,
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Ver no {vencedorMarketplace?.shortLabel || "Site"}{" "}
                  <Icon name="link-external-01" size={12} />
                </a>
              </div>
            )}
          </Card>

          <Card className={styles.aprovacaoBox}>
            <h3>
              <Icon name="file-04" size={18} /> Condições Comerciais
            </h3>
            <div className={styles.aprovacaoDataRow}>
              <span>Prazo de Entrega</span>
              <strong>{vencedor?.deliveryTime ?? "—"} dia(s)</strong>
            </div>
            <div className={styles.aprovacaoDataRow}>
              <span>Condição de Pagamento</span>
              <strong>{vencedor?.paymentTerms ?? "—"}</strong>
            </div>
          </Card>

          <Card className={styles.aprovacaoBox}>
            <h3>
              <Icon name="bank-note-01" size={18} /> Preços Acordados
            </h3>
            <div className={styles.aprovacaoDataRow}>
              <span>Preço Unitário Líquido</span>
              <strong>{formatCurrency(vencedor?.unitPrice ?? 0)} / unidade</strong>
            </div>
            <div className={styles.aprovacaoDataRow}>
              <span>Custo de Frete Adicional</span>
              <strong>{formatCurrency(vencedor?.freightCost ?? 0)} (Total do lote)</strong>
            </div>
          </Card>
        </div>

        <div className={styles.aprovacaoTotalHighlight}>
          <div className={styles.aprovacaoTotalLeft}>
            <span>Valor Total Equalizado do Pedido</span>
            <p>Já contemplando impostos, taxas e frete incidentes</p>
          </div>
          <div className={styles.aprovacaoTotalValue}>
            {formatCurrency(getProposalTotal(vencedor))}
          </div>
        </div>

        <div className={styles.aprovacaoFooter}>
          <button className={styles.btnVoltarAnalise} onClick={() => setStage("analysis")}>
            <Icon name="arrow-left" size={15} /> Voltar para Matriz
          </button>
          {generatedPo ? (
            <Button
              variant="primary"
              className={styles.btnGerarPO}
              onClick={() => router.push(`/compras/pedidos/${generatedPo.id || generatedPo.code}`)}
            >
              Ir para o Pedido {generatedPo.code} <Icon name="arrow-right" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className={styles.btnGerarPO}
              onClick={() => setDialog("gerar")}
            >
              Gerar Pedido de Compra <Icon name="arrow-right" />
            </Button>
          )}
        </div>
      </div>

      {trackingSupplier && (
        <SupplierActivityDrawer
          open={Boolean(trackingSupplier)}
          onClose={() => setTrackingSupplier(null)}
          rfqId={rfq?.id || rfqId}
          rfqCode={rfq?.code}
          supplierId={trackingSupplier.supplierId}
          supplierName={trackingSupplier.supplierName}
          cnpj={trackingSupplier.cnpj}
          contactEmail={trackingSupplier.contactEmail}
          contactPhone={trackingSupplier.contactPhone}
          proposalStatus={trackingSupplier.status}
        />
      )}
    </div>
  );
}
