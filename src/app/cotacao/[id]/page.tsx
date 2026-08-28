"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import styles from "./cotacao.module.css";
import { Icon, Loading, ErrorState, Skeleton, CardSkeleton, Badge } from "@/components/ui";
import { rfqsApi, PublicRfq, PublicProposalPayload } from "@/lib/api/rfqs";
import { formatCurrency } from "@/lib/utils/format-display";

export default function CotacaoFornecedorPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfq, setRfq] = useState<PublicRfq | null>(null);

  // Form State
  const [supplierCnpj, setSupplierCnpj] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  // Prices map: { [requestItemId]: number }
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  
  // Commercial conditions
  const [freightType, setFreightType] = useState<"CIF" | "FOB">("CIF");
  const [freightCost, setFreightCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("30 dias DDL");
  const [deliveryTime, setDeliveryTime] = useState<number>(5);
  const [validityDays, setValidityDays] = useState<number>(15);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ protocol: string; supplierName: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadRfq() {
      try {
        setLoading(true);
        setError(null);
        const data = await rfqsApi.getPublicRfq(id);
        setRfq(data);

        // Iniciar mapa de preços com 0 para cada item
        const initialPrices: Record<string, number> = {};
        (data.items || []).forEach((item) => {
          initialPrices[item.id] = 0;
        });
        setItemPrices(initialPrices);
      } catch (err: any) {
        setError(err.message || "Cotação não encontrada ou link expirado.");
      } finally {
        setLoading(false);
      }
    }
    loadRfq();
  }, [id]);

  const handlePriceChange = (itemId: string, valueStr: string) => {
    const cleanValue = valueStr.replace(",", ".");
    const num = parseFloat(cleanValue) || 0;
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: num,
    }));
  };

  // Cálculos dinâmicos em tempo real
  const itemsSubtotal = useMemo(() => {
    if (!rfq?.items) return 0;
    return rfq.items.reduce((sum, item) => {
      const price = itemPrices[item.id] || 0;
      return sum + price * (item.quantity || 1);
    }, 0);
  }, [rfq, itemPrices]);

  const totalProposalValue = useMemo(() => {
    const freight = freightType === "FOB" ? Number(freightCost) || 0 : 0;
    return itemsSubtotal + freight;
  }, [itemsSubtotal, freightCost, freightType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq) return;

    if (!supplierCnpj.trim() || !supplierName.trim()) {
      alert("Por favor, preencha o CNPJ e a Razão Social da sua empresa.");
      return;
    }

    const unquotedItems = (rfq.items || []).filter((item) => !itemPrices[item.id] || itemPrices[item.id] <= 0);
    if (unquotedItems.length > 0) {
      if (!confirm(`Atenção: ${unquotedItems.length} item(ns) estão com valor R$ 0,00. Deseja enviar a proposta assim mesmo?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: PublicProposalPayload = {
        supplierCnpj,
        supplierName,
        contactName,
        contactEmail,
        contactPhone,
        items: Object.entries(itemPrices).map(([requestItemId, unitPrice]) => ({
          requestItemId,
          unitPrice,
        })),
        freightCost: freightType === "FOB" ? Number(freightCost) : 0,
        freightType,
        paymentTerms,
        deliveryTime: Number(deliveryTime) || 5,
        validityDays: Number(validityDays) || 15,
        notes,
      };

      const res = await rfqsApi.submitPublicProposal(rfq.id, payload);
      setSuccessData({
        protocol: res.protocol,
        supplierName: res.supplierName || supplierName,
      });
    } catch (err: any) {
      alert(err.message || "Erro ao registrar proposta comercial. Verifique os dados e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <span className={styles.badgePortal}>Portal do Fornecedor</span>
          </div>
        </header>
        <main className={styles.mainCard} style={{ marginTop: 24 }}>
          <Skeleton variant="title" width="40%" height={32} style={{ marginBottom: 12 }} />
          <Skeleton variant="text" width="60%" style={{ marginBottom: 24 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton variant="rectangular" height={80} style={{ borderRadius: 8 }} />
            <Skeleton variant="rectangular" height={160} style={{ borderRadius: 8 }} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <span className={styles.badgePortal}>Portal do Fornecedor</span>
          </div>
        </header>
        <main className={styles.portalMain}>
          <ErrorState message={error || "Cotação não encontrada."} />
        </main>
      </div>
    );
  }

  if (successData) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <span className={styles.badgePortal}>Portal do Fornecedor</span>
          </div>
        </header>
        <main className={styles.portalMain}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <Icon name="check" size={32} />
            </div>
            <h2>Proposta Comercial Enviada com Sucesso!</h2>
            <p>
              Agradecemos a sua participação na cotação <strong>{rfq.code}</strong> ({rfq.title}).
            </p>
            <div className={styles.protocolBadge}>
              Protocolo: {successData.protocol}
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Nossa equipe de suprimentos analisará as condições comerciais e entrará em contato assim que o processo for concluído.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const closesDate = new Date(rfq.closesAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={styles.portalContainer}>
      {/* Header Institucional do Portal */}
      <header className={styles.portalHeader}>
        <div className={styles.brandArea}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
        </div>
        <span className={styles.portalSecurityBadge}>
          <Icon name="shield-tick" size={13} /> Portal Seguro de Cotações
        </span>
      </header>

      <main className={styles.portalMain}>
        {/* Header no Padrão de Solicitação / Pedido */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1>{rfq.code}</h1>
              <Badge variant="warning">
                <Icon name="clock" size={13} /> Encerra em: {closesDate}
              </Badge>
            </div>
            <p className={styles.subtitleLarge}>{rfq.title}</p>
            <div className={styles.metadataTags}>
              <span className={styles.infoTag}>
                <Icon name="building-01" /> Empresa: {rfq.companyCode}
              </span>
              <span className={styles.infoTag}>
                <Icon name="layers-three-01" /> Almoxarifado: {rfq.costCenterName}
              </span>
              <span className={styles.infoTag}>
                <Icon name="package" /> {rfq.items?.length || 0} item(ns) a cotar
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Seção 1: Identificação do Fornecedor */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Icon name="building-07" size={18} className={styles.sectionIcon} />
              <h2>1. Identificação da Empresa Fornecedora</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>CNPJ *</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0000-00"
                  className={styles.inputField}
                  value={supplierCnpj}
                  onChange={(e) => setSupplierCnpj(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fornecedor Industrial Ltda"
                  className={styles.inputField}
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nome do Contato Comercial</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  className={styles.inputField}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>E-mail Comercial</label>
                <input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  className={styles.inputField}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  className={styles.inputField}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Tabela de Itens e Preços */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Icon name="shopping-cart-01" size={20} className={styles.sectionIcon} />
              <h2>2. Itens Solicitados & Preços Unitários</h2>
            </div>
            <div className={styles.itemsTableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Item & Descrição</th>
                    <th style={{ textAlign: "center" }}>Qtd.</th>
                    <th style={{ textAlign: "center" }}>Unidade</th>
                    <th style={{ textAlign: "right" }}>Preço Unitário (R$)</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(rfq.items || []).map((item, idx) => {
                    const price = itemPrices[item.id] || 0;
                    const subtotal = price * item.quantity;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.itemDesc}>
                            <strong>{idx + 1}. {item.description}</strong>
                            {item.notes && <span>Obs: {item.notes}</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ textAlign: "center" }}>{item.unit}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className={styles.priceInputWrapper}>
                            <span className={styles.pricePrefix}>R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              placeholder="0,00"
                              className={styles.priceInput}
                              value={itemPrices[item.id] || ""}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className={styles.subtotalText}>{formatCurrency(subtotal)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span>Subtotal dos Itens:</span>
                <strong>{formatCurrency(itemsSubtotal)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Frete ({freightType}):</span>
                <strong>{freightType === "CIF" ? "Incluso (R$ 0,00)" : formatCurrency(Number(freightCost) || 0)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Valor Total da Proposta:</span>
                <span className={styles.totalValue}>{formatCurrency(totalProposalValue)}</span>
              </div>
            </div>
          </div>

          {/* Seção 3: Condições Comerciais & Prazos */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Icon name="truck-01" size={20} className={styles.sectionIcon} />
              <h2>3. Condições Comerciais & Prazos</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Tipo de Frete</label>
                <select
                  className={styles.inputField}
                  value={freightType}
                  onChange={(e) => setFreightType(e.target.value as any)}
                >
                  <option value="CIF">CIF - Frete por conta do Vendedor (Incluso no preço)</option>
                  <option value="FOB">FOB - Frete por conta do Comprador (Valor adicional)</option>
                </select>
              </div>

              {freightType === "FOB" && (
                <div className={styles.formGroup}>
                  <label>Valor do Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className={styles.inputField}
                    value={freightCost || ""}
                    onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Prazo de Entrega (dias úteis)</label>
                <input
                  type="number"
                  min="1"
                  className={styles.inputField}
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Condição de Pagamento</label>
                <input
                  type="text"
                  placeholder="Ex: 30 dias DDL, 15/30 dias, à vista"
                  className={styles.inputField}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Validade da Proposta (dias)</label>
                <input
                  type="number"
                  min="1"
                  className={styles.inputField}
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label>Observações Comerciais ou Técnicas</label>
              <textarea
                placeholder="Informe marcas, modelos equivalentes, condições de garantia ou restrições de faturamento..."
                className={styles.textareaField}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actionFooter}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitBtn}
            >
              <Icon name="send-01" size={18} />
              {submitting ? "Enviando Proposta..." : "Enviar Proposta Comercial"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
