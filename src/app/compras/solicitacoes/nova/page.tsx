"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { categoriesApi, Category } from "@/lib/api/categories";
import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';
import { Card, Button, Icon, Select, Badge } from "@/components/ui";
import styles from "./solicitacoes-new.module.css";
import { logError, getErrorMessage } from "@/lib/utils/error";
import { formatCurrency } from "@/lib/utils/format-display";

function ApprovalModal({
  title,
  code,
  totalValue,
  priority,
  onOpenRfq,
  onGoToList,
  onClose,
}: {
  title: string;
  code: string;
  totalValue: number;
  priority: string;
  onOpenRfq: () => void;
  onGoToList: () => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalSuccessIcon}>
          <Icon name="check-circle" />
        </div>

        <div className={styles.modalHeader}>
          <h2>Solicitação enviada para aprovação!</h2>
          <p>Sua demanda foi registrada e está aguardando alçada. O que deseja fazer agora?</p>
        </div>

        
        <div className={styles.modalSummary}>
          <div className={styles.modalSummaryRow}>
            <span>Solicitação</span>
            <strong>{code}</strong>
          </div>
          <div className={styles.modalSummaryRow}>
            <span>Título</span>
            <strong>{title || "Solicitação sem título"}</strong>
          </div>
          <div className={styles.modalSummaryRow}>
            <span>Valor estimado</span>
            <strong className={styles.modalValueHighlight}>{formatCurrency(totalValue)}</strong>
          </div>
          <div className={styles.modalSummaryRow}>
            <span>Prioridade</span>
            <strong>{priority}</strong>
          </div>
        </div>

        
        <div className={styles.modalActions}>
          <Button variant="primary" className={styles.modalBtnPrimary} onClick={onGoToList}>
            <Icon name="check" />
            Entendido, ir para minhas solicitações
          </Button>
        </div>
      </div>
    </div>
  );
}

type Priority = "Baixa" | "Media" | "Alta" | "Critica";

interface RequestItem {
  id: number;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costCenter: string;
  requiredDate: string;
}

const priorityLabels: Record<Priority, string> = {
  Baixa: "Baixa",
  Media: "Média",
  Alta: "Alta",
  Critica: "Crítica",
};

const PRIORITY_BADGE_CONFIG: Record<Priority, { variant: "gray" | "warning" | "danger" | "dark"; icon: string }> = {
  Critica: { variant: "dark", icon: "zap" },
  Alta: { variant: "danger", icon: "alert-triangle" },
  Media: { variant: "warning", icon: "clock" },
  Baixa: { variant: "gray", icon: "info-circle" },
};

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [createdReqId, setCreatedReqId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(1);

  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [priority, setPriority] = useState<Priority>("Media");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoriesApi.list()
      .then(setCategories)
      .catch((err) => logError("solicitacoes/nova/categories", err));
  }, []);

  useEffect(() => {
    if (user?.name) setRequester(user.name);
    if (user?.department) setDepartment(user.department);
  }, [user]);

  const [targetTenantId, setTargetTenantId] = useState<string>(user?.tenantId || "");

  useEffect(() => {
    if (user?.tenantId && !targetTenantId) {
      setTargetTenantId(user.tenantId);
    }
  }, [user, targetTenantId]);

  const tenantOptions = useMemo(() => {
    if (!user?.availableTenants || user.availableTenants.length === 0) return [];
    return user.availableTenants.map((t) => ({
      label: t.name,
      value: t.id,
    }));
  }, [user]);

  const selectedTenantName = useMemo(() => {
    return user?.availableTenants?.find((t) => t.id === targetTenantId)?.name || "Empresa Logada";
  }, [user, targetTenantId]);

  const [purchaseType, setPurchaseType] = useState("Material recorrente");
  const [justification, setJustification] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [preferredSupplier, setPreferredSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<RequestItem[]>([
    {
      id: 1,
      description: "",
      category: "",
      quantity: 1,
      unit: "UN",
      unitPrice: 0,
      costCenter: "",
      requiredDate: "",
    },
  ]);

  const totalEstimated = useMemo(
    () => items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
    [items]
  );

  const updateItem = <K extends keyof RequestItem>(id: number, field: K, value: RequestItem[K]) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    const nextId = Math.max(...items.map((item) => item.id), 0) + 1;
    setItems((current) => [
      ...current,
      {
        id: nextId,
        description: "",
        category: "MRO / Pecas",
        quantity: 1,
        unit: "UN",
        unitPrice: 0,
        costCenter: "Administrativo",
        requiredDate: "",
      },
    ]);
    setExpandedItemId(nextId);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const uniqueCategoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    for (const c of categories) {
      if (c.name && !seen.has(c.name)) {
        seen.add(c.name);
        opts.push({ label: c.name, value: c.name });
      }
    }
    return opts;
  }, [categories]);

  const handleSubmit = async (asDraft = false) => {
    setIsSubmitting(true);
    try {
      const validDates = items
        .map(i => (i.requiredDate ? new Date(i.requiredDate).getTime() : 0))
        .filter(t => t > 0 && !isNaN(t));
      
      const derivedDeadline = validDates.length > 0
        ? new Date(Math.min(...validDates)).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const data = await purchaseRequestsApi.create({
        tenantId: targetTenantId || user?.tenantId,
        description: title,
        requesterId: user?.id,
        department: department,
        purchaseType: purchaseType,
        paymentTerms: paymentTerms || undefined,
        preferredSupplier: preferredSupplier || undefined,
        notes: (notes || "") + (deliveryWindow ? `\nJanela de recebimento: ${deliveryWindow}` : ""),
        categoryId: categoryId || (categories[0]?.id ?? undefined),
        justification: justification,
        estimatedBudget: totalEstimated,
        deliveryLocation: deliveryLocation,
        deadline: derivedDeadline,
        priority: priority === "Critica" ? "Critical" : priority === "Alta" ? "High" : priority === "Media" ? "Medium" : "Low",
        status: asDraft ? "Draft" : "AwaitingApproval",
        items: items
          .filter((i) => i.description.trim())
          .map((i) => ({
            description: i.description,
            quantity: Number(i.quantity) || 1,
            unit: i.unit || "UN",
            estimatedUnitPrice: Number(i.unitPrice) || 0,
            category: i.category || "Geral",
            costCenter: i.costCenter || undefined,
            requiredDate: i.requiredDate || undefined,
          })),
      } as any);

      if (asDraft) {
        toast({
          variant: "success",
          title: "Salvo",
          message: `Rascunho ${data.code} salvo com sucesso!`,
        });
        router.push("/compras/solicitacoes");
      } else {
        setCreatedCode(data.code);
        setCreatedReqId(data.id);
        setShowApprovalModal(true);
      }
    } catch (err) {
      logError("solicitacoes/nova/create", err);
      toast({
        variant: "error",
        title: "Erro",
        message: getErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRfq = () => {
    const params = new URLSearchParams({
      solicitacao: createdReqId
    });
    router.push(`/compras/rfqs/nova?${params.toString()}`);
  };

  return (
    <div className={styles.formContainer}>
      {showApprovalModal && (
        <ApprovalModal
          title={title}
          code={createdCode}
          totalValue={totalEstimated}
          priority={priority}
          onOpenRfq={handleOpenRfq}
          onGoToList={() => router.push("/compras/solicitacoes")}
          onClose={() => setShowApprovalModal(false)}
        />
      )}

      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitações
      </button>

      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Compras internas</span>
          <h1>Nova Solicitação de Compra</h1>
          <p>Monte uma demanda completa, com escopo, orçamento, recebimento e requisitos para cotação.</p>
        </div>
      </div>

      
      <div className={styles.stepperNav}>
        <div 
          className={`${styles.stepIndicator} ${currentStep === 1 ? styles.stepActive : currentStep > 1 ? styles.stepCompleted : ""}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className={styles.stepNumber}>
            {currentStep > 1 ? <Icon name="check" size={16} /> : "1"}
          </div>
          <span className={styles.stepLabel}>Identificação</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div 
          className={`${styles.stepIndicator} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepCompleted : ""} ${currentStep < 2 ? styles.stepDisabled : ""}`}
          onClick={() => currentStep >= 2 ? setCurrentStep(2) : undefined}
        >
          <div className={styles.stepNumber}>
            {currentStep > 2 ? <Icon name="check" size={16} /> : "2"}
          </div>
          <span className={styles.stepLabel}>Itens da Demanda</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div 
          className={`${styles.stepIndicator} ${currentStep === 3 ? styles.stepActive : ""} ${currentStep < 3 ? styles.stepDisabled : ""}`}
          onClick={() => currentStep >= 3 ? setCurrentStep(3) : undefined}
        >
          <div className={styles.stepNumber}>3</div>
          <span className={styles.stepLabel}>Entrega e Condições</span>
        </div>
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>
            
            
            {currentStep === 1 && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon name="edit-01" /></div>
                  <div>
                    <h2>1. Identificação da demanda</h2>
                    <p>Contexto executivo para aprovar rápido e cotar sem retrabalho.</p>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Título da solicitação <span className="required-asterisk">*</span></label>
                  <input className={styles.formControl} value={title} onChange={(event) => setTitle(event.target.value)} />
                </div>

                {tenantOptions.length > 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Empresa / Unidade Destino <span className="required-asterisk">*</span></label>
                    <Select
                      options={tenantOptions}
                      value={targetTenantId}
                      onChange={setTargetTenantId}
                      icon="building-01"
                      placeholder="Selecione a empresa para a qual a compra se destina..."
                    />
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Solicitante</label>
                    <input className={styles.formControl} value={requester} onChange={(event) => setRequester(event.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Área requisitante <span className="required-asterisk">*</span></label>
                    <Select
                      options={[
                        { label: "Operações", value: "Operacoes" },
                        { label: "Manutenção", value: "Manutencao" },
                        { label: "Administrativo", value: "Administrativo" },
                        { label: "Facilities", value: "Facilities" },
                        { label: "TI", value: "TI" }
                      ]}
                      value={department}
                      onChange={setDepartment}
                      placeholder="Selecione a área requisitante..."
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Prioridade</label>
                    <div className={styles.segmentedControl} role="group" aria-label="Prioridade da solicitação">
                      {(["Baixa", "Media", "Alta", "Critica"] as Priority[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={priority === option ? styles.segmentActive : ""}
                          onClick={() => setPriority(option)}
                        >
                          {priorityLabels[option]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tipo de compra <span className="required-asterisk">*</span></label>
                    <Select
                      options={[
                        { label: "Material recorrente", value: "Material recorrente" },
                        { label: "Compra spot", value: "Compra spot" },
                        { label: "Serviço técnico", value: "Servico tecnico" },
                        { label: "Contrato recorrente", value: "Contrato recorrente" },
                        { label: "Projeto especial", value: "Projeto especial" }
                      ]}
                      value={purchaseType}
                      onChange={setPurchaseType}
                    />
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Justificativa de negócio <span className="required-asterisk">*</span></label>
                  <textarea
                    className={styles.formControl}
                    rows={4}
                    value={justification}
                    onChange={(event) => setJustification(event.target.value)}
                    placeholder="Explique impacto operacional, risco de não comprar, ganho esperado e urgência."
                  />
                </div>
              </section>
            )}

            
            {currentStep === 2 && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon name="shopping-cart-01" /></div>
                  <div>
                    <h2>2. Itens, categorias e centros de custo</h2>
                    <p>Inclua todos os itens que devem seguir no mesmo pacote de aprovação.</p>
                  </div>
                </div>

                <div className={styles.itemsList}>
                  {items.map((item, index) => {
                    const isExpanded = expandedItemId === item.id;
                    const itemTotalValue = item.quantity * item.unitPrice;

                    return (
                      <div className={styles.itemPanel} key={item.id}>
                        
                        
                        <div 
                          className={styles.itemSummaryRow} 
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        >
                          <div className={styles.itemSummaryLeft}>
                            <span className={styles.itemSummaryBadge}>Item {index + 1}</span>
                            <div className={styles.itemSummaryText}>
                              <span className={styles.itemSummaryTitle}>
                                {item.description || "Novo item sem descrição"}
                              </span>
                              <span className={styles.itemSummaryMeta}>
                                {item.quantity} {item.unit} {item.unitPrice > 0 ? `× ${formatCurrency(item.unitPrice)}` : ""} • CC: {item.costCenter || "Não informado"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.itemSummaryRight}>
                            <strong className={styles.modalValueHighlight} style={{ marginRight: "8px" }}>
                              {formatCurrency(itemTotalValue)}
                            </strong>
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedItemId(isExpanded ? null : item.id);
                              }}
                              title={isExpanded ? "Recolher detalhes" : "Editar detalhes"}
                            >
                              <Icon 
                                name="chevron-down" 
                                size={18} 
                                className={`${styles.chevronRotate} ${isExpanded ? styles.chevronRotateActive : ""}`} 
                              />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionIconBtn} ${styles.actionDeleteBtn}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              disabled={items.length === 1}
                              title="Remover item"
                            >
                              <Icon name="x-close" size={18} />
                            </button>
                          </div>
                        </div>

                        
                        {isExpanded && (
                          <div className={styles.accordionExpandable}>
                            <div className={styles.gridCol12}>
                              <div className={`${styles.formGroup} ${styles.col8}`}>
                                <label>Descrição do item/serviço <span className="required-asterisk">*</span></label>
                                <input
                                  className={styles.formControl}
                                  value={item.description}
                                  onChange={(event) => updateItem(item.id, "description", event.target.value)}
                                  placeholder="Ex: Filtro de ar motor X1"
                                />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col4}`}>
                                <label>Categoria <span className="required-asterisk">*</span></label>
                                <Select
                                  options={uniqueCategoryOptions}
                                  value={item.category}
                                  onChange={(value) => updateItem(item.id, "category", value)}
                                />
                              </div>

                              <div className={`${styles.formGroup} ${styles.col3}`}>
                                <label>Quantidade <span className="required-asterisk">*</span></label>
                                <input
                                  type="number"
                                  min="0"
                                  className={styles.formControl}
                                  value={item.quantity}
                                  onChange={(event) => updateItem(item.id, "quantity", Number(event.target.value))}
                                />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col3}`}>
                                <label>Unidade <span className="required-asterisk">*</span></label>
                                <Select
                                  options={[
                                    { label: "L", value: "L" },
                                    { label: "UN", value: "UN" },
                                    { label: "KG", value: "KG" },
                                    { label: "M", value: "M" },
                                    { label: "H", value: "H" },
                                    { label: "Pacote", value: "Pacote" }
                                  ]}
                                  value={item.unit}
                                  onChange={(value) => updateItem(item.id, "unit", value)}
                                />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col3}`}>
                                <label>Valor unitário</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={styles.formControl}
                                  value={item.unitPrice}
                                  onChange={(event) => updateItem(item.id, "unitPrice", Number(event.target.value))}
                                />
                              </div>
                              <div className={`${styles.itemTotal} ${styles.col3}`} style={{ minHeight: "auto", height: "44px", marginTop: "22px" }}>
                                <span style={{ fontSize: "10px", fontWeight: "800" }}>Total do item</span>
                                <strong style={{ fontSize: "14px" }}>{formatCurrency(itemTotalValue)}</strong>
                              </div>

                              <div className={`${styles.formGroup} ${styles.col6}`}>
                                <label>Centro de custo <span className="required-asterisk">*</span></label>
                                <input className={styles.formControl} value={item.costCenter} onChange={(event) => updateItem(item.id, "costCenter", event.target.value)} placeholder="Ex: Administrativo, Operacional..." required />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col6}`}>
                                <label>Necessário até <span className="required-asterisk">*</span></label>
                                <input
                                  type="date"
                                  className={styles.formControl}
                                  value={item.requiredDate}
                                  onChange={(event) => updateItem(item.id, "requiredDate", event.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button type="button" className={styles.addItemButton} onClick={addItem}>
                  <Icon name="plus" /> Adicionar item
                </button>
              </section>
            )}

            
            {currentStep === 3 && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon name="truck-01" /></div>
                  <div>
                    <h2>3. Entrega, condições e fornecedores</h2>
                    <p>Informações que Compras precisa para equalizar propostas corretamente.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 2 }}>
                    <label>Local de entrega / Planta <span className="required-asterisk">*</span></label>
                    <div className="geoapify-autocomplete-wrapper" style={{ position: "relative", zIndex: 10 }}>
                      <GeoapifyContext apiKey="2259d519a04e42bcbf5003b9366404a0">
                        <GeoapifyGeocoderAutocomplete
                          placeholder="Digite o local de entrega..."
                          lang="pt"
                          filterByCountryCode={['br']}
                          value={deliveryLocation}
                          onUserInput={(input) => setDeliveryLocation(input)}
                          placeSelect={(place) => {
                            if (place && place.properties) {
                              const rua = place.properties.street || '';
                              const numero = place.properties.housenumber || '';
                              const bairro = place.properties.suburb || '';
                              const cidade = place.properties.city || '';
                              const estado = place.properties.state || '';
                              const cep = place.properties.postcode || '';
                              
                              const end = `${rua}${numero ? `, ${numero}` : ''}${bairro ? ` - ${bairro}` : ''}, ${cidade} / ${estado} ${cep ? `- ${cep}` : ''}`;
                              setDeliveryLocation(end.trim());
                            }
                          }}
                        />
                      </GeoapifyContext>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Janela de recebimento</label>
                    <input className={styles.formControl} value={deliveryWindow} onChange={(event) => setDeliveryWindow(event.target.value)} />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Condição de pagamento esperada</label>
                    <input className={styles.formControl} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fornecedor preferencial</label>
                    <input className={styles.formControl} value={preferredSupplier} onChange={(event) => setPreferredSupplier(event.target.value)} />
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Observações para Compras</label>
                  <textarea className={styles.formControl} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
                </div>
              </section>
            )}

            
            <div className={styles.formActions}>
              {currentStep === 1 && (
                <>
                  <button type="button" className={styles.btnCancel} onClick={() => router.push("/compras/solicitacoes")}>
                    Cancelar
                  </button>
                  <Button
                    variant="primary"
                    type="button"
                    className={styles.btnSubmit}
                    onClick={() => {
                      if (!title.trim()) {
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, preencha o título da solicitação." });
                        return;
                      }
                      if (tenantOptions.length > 0 && !targetTenantId) {
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, selecione a empresa destino." });
                        return;
                      }
                      if (!department.trim()) {
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, selecione a área requisitante." });
                        return;
                      }
                      if (!purchaseType.trim()) {
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, selecione o tipo de compra." });
                        return;
                      }
                      if (!justification.trim()) {
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, informe a justificativa de negócio." });
                        return;
                      }
                      setCurrentStep(2);
                    }}
                  >
                    Avançar para Itens <Icon name="chevron-right" />
                  </Button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <button type="button" className={styles.btnCancel} onClick={() => setCurrentStep(1)}>
                    <Icon name="chevron-left" /> Voltar
                  </button>
                  <Button 
                    variant="primary" 
                    type="button" 
                    className={styles.btnSubmit} 
                    onClick={() => {
                      if (items.length === 0) {
                        toast({ variant: "warning", title: "Atenção", message: "A solicitação precisa de pelo menos 1 item." });
                        return;
                      }
                      for (const item of items) {
                        if (!item.description.trim() || !item.category || item.quantity <= 0 || !item.unit || !item.costCenter.trim() || !item.requiredDate) {
                          toast({ variant: "warning", title: "Atenção", message: "Por favor, preencha todos os campos obrigatórios de todos os itens." });
                          return;
                        }
                      }
                      setCurrentStep(3);
                    }}
                  >
                    Avançar <Icon name="chevron-right" />
                  </Button>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <button type="button" className={styles.btnCancel} onClick={() => setCurrentStep(2)}>
                    <Icon name="chevron-left" /> Voltar
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                  >
                    <Icon name="save-01" /> Salvar rascunho
                  </button>
                  <Button variant="primary" className={styles.btnSubmit} onClick={() => {
                    if (!deliveryLocation) {
                      toast({ variant: "warning", title: "Atenção", message: "Por favor, selecione o local de entrega." });
                      return;
                    }
                    handleSubmit(false);
                  }} disabled={isSubmitting}>
                    <Icon name="send-01" /> Enviar para aprovação
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        <aside className={styles.sideColumn}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span>Resumo executivo</span>
              <Badge
                variant={PRIORITY_BADGE_CONFIG[priority]?.variant ?? "gray"}
                icon={PRIORITY_BADGE_CONFIG[priority]?.icon ?? "info-circle"}
              >
                {priorityLabels[priority]}
              </Badge>
            </div>
            <h3>{title || "Solicitação sem título"}</h3>
            <div className={styles.summaryValue}>
              <span>Valor estimado total</span>
              <strong>{formatCurrency(totalEstimated)}</strong>
            </div>
            <dl className={styles.summaryList}>
              <div><dt>Empresa</dt><dd><strong>{selectedTenantName}</strong></dd></div>
              <div><dt>Área</dt><dd>{department}</dd></div>
              <div><dt>Solicitante</dt><dd>{requester}</dd></div>
              <div><dt>Tipo</dt><dd>{purchaseType}</dd></div>
              <div><dt>Entrega</dt><dd>{deliveryLocation}</dd></div>
              <div><dt>Condição</dt><dd>{paymentTerms}</dd></div>
            </dl>
          </Card>


        </aside>
      </div>
    </div>
  );
}
