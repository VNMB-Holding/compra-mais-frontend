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
} from "@/components/ui";

import { useToast } from "@/contexts/ToastContext";
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

type RfqStage = "proposal" | "analysis" | "approval";

interface LocalProposal {
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
  const mapBySupplier = new Map<string, LocalProposal>();

  (rfq.rfqSuppliers ?? []).forEach((rs) => {
    if (rs.supplierId) {
      mapBySupplier.set(rs.supplierId, {
        supplierId: rs.supplierId,
        supplierName:
          rs.supplier?.tradeName || rs.supplier?.corporateName || "Razão Social não informada",
        cnpj: rs.supplier?.cnpj || "—",
        status: "awaiting",
      });
    }
  });

  const reqItems = rfq.purchaseRequest?.items ?? [];
  const rawQtdTotal = reqItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;

  (rfq.proposals ?? []).forEach((p) => {
    if (p.supplierId) {
      const existing = mapBySupplier.get(p.supplierId);

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
      mapBySupplier.set(p.supplierId, {
        supplierId: p.supplierId,
        proposalId: p.id,
        supplierName:
          p.supplier?.tradeName ||
          p.supplier?.corporateName ||
          existing?.supplierName ||
          "Razão Social não informada",
        cnpj: p.supplier?.cnpj || existing?.cnpj || "—",
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
    }
  });

  return Array.from(mapBySupplier.values());
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
  rfqTitle,
  onSalvar,
}: {
  proposta: LocalProposal;
  isWinner: boolean;
  totalQtd: number;
  rfqItems?: { id: string; description: string; quantity: number; unit: string }[];
  rfqCode: string;
  rfqTitle: string;
  onSalvar: (id: string, dados: Partial<LocalProposal>) => void;
}) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
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
    onSalvar(proposta.supplierId, {
      ...draft,
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
            <strong>{proposta.supplierName}</strong>
          </div>
          <span className={styles.propostaCnpj}>{proposta.cnpj}</span>
        </div>

        <div className={styles.propostaCardRight}>
          {proposta.status === "awaiting" && (
            <span className={styles.badgeAguardando}>
              <Icon name="clock" size={13} /> Aguardando
            </span>
          )}
          {proposta.status === "declined" && (
            <span
              className={styles.badgeAguardando}
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              <Icon name="x-close" size={13} /> Declinada
            </span>
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
              <Icon name="message-square-02" size={14} />
              <span>WhatsApp</span>
            </button>
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
          </div>
        </div>
      </div>

      {aberto && (
        <div className={styles.propostaForm}>
          <div className={styles.propostaFormDivider} />

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
                            <strong>{item.description}</strong>
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
              <Icon name="truck-01" size={13} /> Frete, Logística & Prazos
            </div>
            <div className={styles.propostaFormGrid}>
              <div className={styles.propostaField}>
                <label>Tipo de Frete (Incoterm)</label>
                <select
                  className={styles.propostaSelect}
                  value={draft.freightType}
                  onChange={(e) => {
                    const type = e.target.value as "CIF" | "FOB";
                    setDraft((d) => ({
                      ...d,
                      freightType: type,
                      freightCost: type === "CIF" ? 0 : d.freightCost,
                    }));
                  }}
                >
                  <option value="CIF">CIF (Incluso pelo fornecedor)</option>
                  <option value="FOB">FOB (A pagar pelo comprador)</option>
                </select>
              </div>

              <div className={styles.propostaField}>
                <label>Custo de Frete Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={draft.freightType === "CIF"}
                  className={styles.propostaInput}
                  placeholder={draft.freightType === "CIF" ? "Incluso no preço" : "0,00"}
                  value={draft.freightType === "CIF" ? "" : draft.freightCost || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, freightCost: Number(e.target.value) || 0 }))
                  }
                />
              </div>

              <div className={styles.propostaField}>
                <label>Prazo de Entrega (dias úteis)</label>
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
            </div>
          </div>

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

              <div className={styles.propostaField} style={{ gridColumn: "span 2" }}>
                <label>Marca / Fabricante / Modelo Cotado</label>
                <input
                  className={styles.propostaInput}
                  value={draft.brandModel}
                  placeholder="Ex: Bosch / SKF / Modelo Industrial..."
                  onChange={(e) => setDraft((d) => ({ ...d, brandModel: e.target.value }))}
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

  const { toast } = useToast();
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);
  const [creatingPo, setCreatingPo] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [proposalPage, setProposalPage] = useState(1);
  const [proposalSearch, setProposalSearch] = useState("");
  const [proposalStatusFilter, setProposalStatusFilter] = useState<
    "todos" | "awaiting" | "received" | "declined"
  >("todos");
  const PROPOSALS_PER_PAGE = 5;

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
      await rfqsApi.updateStatus(rfqId, "Cancelled", reason);
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
        if (winner) setVencedorId(winner.supplierId);

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
  const handleSalvarProposta = async (id: string, dados: Partial<LocalProposal>) => {
    setPropostas((c) =>
      c.map((p) => (p.supplierId === id ? { ...p, ...dados, status: "received" } : p)),
    );

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
          supplierId: id,
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

        if (propostaCriada?.id) {
          setPropostas((c) =>
            c.map((p) =>
              p.supplierId === id
                ? { ...p, ...dados, proposalId: propostaCriada.id, status: "received" }
                : p,
            ),
          );
        }
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

  const vencedor = propostas.find((p) => p.supplierId === vencedorId);
  const pendingVencedor = propostas.find((p) => p.supplierId === pendingVencedorId);

  const rfqTitle = rfq?.title || rfq?.purchaseRequest?.description || "—";
  const rfqCode = rfq?.code || rfqId;
  const originCode = rfq?.purchaseRequest?.code || "—";
  const closesAt = rfq?.closesAt ? new Date(rfq.closesAt).toLocaleDateString("pt-BR") : "—";

  const prObj = rfq?.purchaseRequest as any;
  const companyName = resolvePurchaseRequestBranch(prObj || rfq, user);

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

  const Header = () => (
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
              let propostaIdParaEnviar = propostas.find(
                (p) => p.supplierId === pendingVencedorId,
              )?.proposalId;

              if (!propostaIdParaEnviar) {
                const propLocal = propostas.find((p) => p.supplierId === pendingVencedorId);
                const propCriada = await rfqsApi.createProposal(rfqId, {
                  supplierId: pendingVencedorId,
                  unitPrice: propLocal?.unitPrice ?? 0,
                  freightCost: propLocal?.freightCost ?? 0,
                  paymentTerms: propLocal?.paymentTerms || "30 dias DDL",
                  deliveryTime: propLocal?.deliveryTime ?? 5,
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
              setVencedorId(winner ? winner.supplierId : pendingVencedorId);
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
            const po = await rfqsApi.createPo(rfqId);
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
        <Header />

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                  key={p.supplierId}
                  proposta={p}
                  isWinner={vencedorId === p.supplierId || !!p.isWinner}
                  totalQtd={totalQtd}
                  rfqItems={rfqItems}
                  rfqCode={rfqCode}
                  rfqTitle={rfqTitle}
                  onSalvar={handleSalvarProposta}
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
        <Header />

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
                        <th key={p.supplierId} className={i === 0 ? styles.winnerHeaderCol : ""}>
                          {i === 0 && <div className={styles.winnerBadgeTip}>MELHOR OPÇÃO</div>}
                          {p.supplierName.split(" ").slice(0, 2).join(" ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.rowHeader}>Preço Unitário Líquido</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.supplierId}
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
                          key={p.supplierId}
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
                          key={p.supplierId}
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
                          key={p.supplierId}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.paymentTerms}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Tipo de Frete (Incoterm)</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.supplierId}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.freightType === "CIF" ? "CIF (Incluso)" : "FOB (À parte)"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Validade da Proposta</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.supplierId}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.validityDays ? `${p.validityDays} dias` : "15 dias"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader}>Marca / Fabricante</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.supplierId}
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
                          key={p.supplierId}
                          className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}
                        >
                          {p.warrantyMonths ? `${p.warrantyMonths} meses` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className={styles.totalRow}>
                      <td className={styles.rowHeaderTotal}>Custo Total Equalizado</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.supplierId}
                          className={i === 0 ? styles.winnerCellTotal : styles.totalMutedText}
                        >
                          {formatCurrency(getProposalTotal(p))}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader} />
                      {propostasRankeadas.map((p, i) => (
                        <td key={p.supplierId} className={styles.selectCell}>
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
                              setPendingVencedorId(p.supplierId);
                              setDialog("selecionar");
                            }}
                          >
                            {isFinished || !!generatedPo ? (
                              vencedor?.supplierId === p.supplierId ? (
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
      <Header />

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
            <h2>{generatedPo ? "Cotação Finalizada & Homologada" : "Proposta Selecionada"}</h2>
            <p>
              {generatedPo
                ? `O processo foi encerrado com sucesso e o Pedido Oficial ${generatedPo.code} foi gerado.`
                : "Revise os detalhes comerciais antes de emitir o Pedido de Compra Oficial."}
            </p>
          </div>
        </div>

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
    </div>
  );
}
