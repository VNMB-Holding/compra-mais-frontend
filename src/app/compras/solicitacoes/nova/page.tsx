"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon, Select } from "@/components/ui";
import styles from "./solicitacoes-new.module.css";

// ---------------------------------------------------------------------------
// Modal de confirmação de envio para aprovação
// ---------------------------------------------------------------------------
function ApprovalModal({
  title,
  totalValue,
  priority,
  onOpenRfq,
  onGoToList,
  onClose,
}: {
  title: string;
  totalValue: number;
  priority: string;
  onOpenRfq: () => void;
  onGoToList: () => void;
  onClose: () => void;
}) {
  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Ícone de sucesso */}
        <div className={styles.modalSuccessIcon}>
          <Icon name="check-circle" />
        </div>

        <div className={styles.modalHeader}>
          <h2>Solicitação enviada para aprovação!</h2>
          <p>Sua demanda foi registrada e está aguardando alçada. O que deseja fazer agora?</p>
        </div>

        {/* Resumo da SOL */}
        <div className={styles.modalSummary}>
          <div className={styles.modalSummaryRow}>
            <span>Solicitação</span>
            <strong>SOL-000457</strong>
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

        {/* Ações */}
        <div className={styles.modalActions}>
          <button className={styles.modalBtnSecondary} onClick={onGoToList}>
            <Icon name="list" />
            Ir para lista de Solicitações
          </button>
          <Button variant="primary" className={styles.modalBtnPrimary} onClick={onOpenRfq}>
            <Icon name="send-03" />
            Abrir RFQ agora
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
  Media: "Media",
  Alta: "Alta",
  Critica: "Critica",
};

export default function NovaSolicitacaoPage() {
  const router = useRouter();

  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [title, setTitle] = useState("Abastecimento emergencial de oleo diesel S10");
  const [requester, setRequester] = useState("Breno Marques");
  const [department, setDepartment] = useState("Operacoes");
  const [priority, setPriority] = useState<Priority>("Alta");
  const [purchaseType, setPurchaseType] = useState("Material recorrente");
  const [justification, setJustification] = useState(
    "Reposicao preventiva para manter a frota operacional e evitar indisponibilidade nas rotas contratadas."
  );
  const [deliveryLocation, setDeliveryLocation] = useState("Base Operacional - Paulinia/SP");
  const [deliveryWindow, setDeliveryWindow] = useState("Horario comercial com agendamento");
  const [paymentTerms, setPaymentTerms] = useState("30 dias DDL");
  const [preferredSupplier, setPreferredSupplier] = useState("Sem fornecedor preferencial");
  const [notes, setNotes] = useState(
    "Fornecedor deve apresentar documentacao regulatoria vigente, disponibilidade de entrega fracionada e contato operacional para janela de recebimento."
  );
  const [items, setItems] = useState<RequestItem[]>([
    {
      id: 1,
      description: "Oleo Diesel S10",
      category: "Combustiveis",
      quantity: 500000,
      unit: "L",
      unitPrice: 5.72,
      costCenter: "OP-104 Frota",
      requiredDate: "2026-07-02",
    },
    {
      id: 2,
      description: "Aditivo ARLA 32",
      category: "Insumos operacionais",
      quantity: 12000,
      unit: "L",
      unitPrice: 3.15,
      costCenter: "OP-104 Frota",
      requiredDate: "2026-07-05",
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
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSubmit = () => {
    setShowApprovalModal(true);
  };

  const handleOpenRfq = () => {
    const params = new URLSearchParams({
      sol: "SOL-000457",
      titulo: title,
      valor: String(totalEstimated),
      prioridade: priority,
      area: department,
      solicitante: requester,
    });
    router.push(`/compras/rfqs/nova?${params.toString()}`);
  };

  const handleGoToList = () => {
    router.push("/compras/solicitacoes");
  };

  return (
    <div className={styles.formContainer}>
      {showApprovalModal && (
        <ApprovalModal
          title={title}
          totalValue={totalEstimated}
          priority={priority}
          onOpenRfq={handleOpenRfq}
          onGoToList={handleGoToList}
          onClose={() => setShowApprovalModal(false)}
        />
      )}

      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitacoes
      </button>

      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Compras internas</span>
          <h1>Nova Solicitacao de Compra</h1>
          <p>Monte uma demanda completa, com escopo, orcamento, recebimento e requisitos para cotacao.</p>
        </div>
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="edit-01" /></div>
                <div>
                  <h2>1. Identificacao da demanda</h2>
                  <p>Contexto executivo para aprovar rapido e cotar sem retrabalho.</p>
                </div>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Titulo da solicitacao *</label>
                <input className={styles.formControl} value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Solicitante</label>
                  <input className={styles.formControl} value={requester} onChange={(event) => setRequester(event.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Area requisitante</label>
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
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Prioridade</label>
                  <div className={styles.segmentedControl} role="group" aria-label="Prioridade da solicitacao">
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
                  <label>Tipo de compra</label>
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
                <label>Justificativa de negocio *</label>
                <textarea
                  className={styles.formControl}
                  rows={4}
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  placeholder="Explique impacto operacional, risco de nao comprar, ganho esperado e urgencia."
                />
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="shopping-cart-01" /></div>
                <div>
                  <h2>2. Itens, categorias e centros de custo</h2>
                  <p>Inclua todos os itens que devem seguir no mesmo pacote de aprovacao.</p>
                </div>
              </div>

              <div className={styles.itemsList}>
                {items.map((item, index) => (
                  <div className={styles.itemPanel} key={item.id}>
                    <div className={styles.itemHeader}>
                      <strong>Item {index + 1}</strong>
                      <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} title="Remover item">
                        <Icon name="x-close" size={18} />
                      </button>
                    </div>

                    <div className={styles.itemGrid}>
                      <div className={`${styles.formGroup} ${styles.itemDescription}`}>
                        <label>Descricao do item/servico *</label>
                        <input
                          className={styles.formControl}
                          value={item.description}
                          onChange={(event) => updateItem(item.id, "description", event.target.value)}
                          placeholder="Ex: Filtro de ar motor X1"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Categoria</label>
                        <Select
                          options={[
                            { label: "Combustiveis", value: "Combustiveis" },
                            { label: "Insumos operacionais", value: "Insumos operacionais" },
                            { label: "MRO / Pecas", value: "MRO / Pecas" },
                            { label: "Servicos tecnicos", value: "Servicos tecnicos" },
                            { label: "Facilities", value: "Facilities" }
                          ]}
                          value={item.category}
                          onChange={(value) => updateItem(item.id, "category", value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Quantidade</label>
                        <input
                          type="number"
                          min="0"
                          className={styles.formControl}
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, "quantity", Number(event.target.value))}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Unidade</label>
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
                      <div className={styles.formGroup}>
                        <label>Valor unitario</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={styles.formControl}
                          value={item.unitPrice}
                          onChange={(event) => updateItem(item.id, "unitPrice", Number(event.target.value))}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Centro de custo</label>
                        <input className={styles.formControl} value={item.costCenter} onChange={(event) => updateItem(item.id, "costCenter", event.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Necessario ate</label>
                        <input
                          type="date"
                          className={styles.formControl}
                          value={item.requiredDate}
                          onChange={(event) => updateItem(item.id, "requiredDate", event.target.value)}
                        />
                      </div>
                      <div className={styles.itemTotal}>
                        <span>Total do item</span>
                        <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className={styles.addItemButton} onClick={addItem}>
                <Icon name="plus" /> Adicionar item
              </button>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="truck-01" /></div>
                <div>
                  <h2>3. Entrega, condicoes e fornecedores</h2>
                  <p>Informacoes que Compras precisa para equalizar propostas corretamente.</p>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Local de entrega</label>
                  <Select
                    options={[
                      { label: "Base Operacional - Paulinia/SP", value: "Base Operacional - Paulinia/SP" },
                      { label: "Matriz - Sao Paulo/SP", value: "Matriz - Sao Paulo/SP" },
                      { label: "Filial - Campinas/SP", value: "Filial - Campinas/SP" },
                      { label: "Obra / campo operacional", value: "Obra / campo operacional" }
                    ]}
                    value={deliveryLocation}
                    onChange={setDeliveryLocation}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Janela de recebimento</label>
                  <input className={styles.formControl} value={deliveryWindow} onChange={(event) => setDeliveryWindow(event.target.value)} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Condicao de pagamento esperada</label>
                  <input className={styles.formControl} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Fornecedor preferencial</label>
                  <input className={styles.formControl} value={preferredSupplier} onChange={(event) => setPreferredSupplier(event.target.value)} />
                </div>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Observacoes para Compras</label>
                <textarea className={styles.formControl} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </section>

            <div className={styles.formActions}>
              <button className={styles.btnCancel} onClick={() => router.push("/compras/solicitacoes")}>Cancelar</button>
              <button className={styles.secondaryAction}>
                <Icon name="save-01" /> Salvar rascunho
              </button>
              <Button variant="primary" className={styles.btnSubmit} onClick={handleSubmit}>
                <Icon name="send-01" /> Enviar para aprovação
              </Button>
            </div>
          </Card>
        </div>

        <aside className={styles.sideColumn}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span>Resumo executivo</span>
              <strong className={`${styles.priorityPill} ${styles[`priority${priority}`]}`}>{priorityLabels[priority]}</strong>
            </div>
            <h3>{title || "Solicitacao sem titulo"}</h3>
            <div className={styles.summaryValue}>
              <span>Valor estimado total</span>
              <strong>{formatCurrency(totalEstimated)}</strong>
            </div>
            <dl className={styles.summaryList}>
              <div><dt>Area</dt><dd>{department}</dd></div>
              <div><dt>Solicitante</dt><dd>{requester}</dd></div>
              <div><dt>Tipo</dt><dd>{purchaseType}</dd></div>
              <div><dt>Entrega</dt><dd>{deliveryLocation}</dd></div>
              <div><dt>Condicao</dt><dd>{paymentTerms}</dd></div>
            </dl>
          </Card>

          <Card className={styles.checklistCard}>
            <div className={styles.sideTitle}>
              <Icon name="info-circle" />
              <h3>Checklist da demanda</h3>
            </div>
            <ul>
              <li className={title.trim() ? styles.done : ""}>Titulo e escopo definidos</li>
              <li className={justification.trim() ? styles.done : ""}>Justificativa de negocio</li>
              <li className={items.every((item) => item.description && item.quantity > 0) ? styles.done : ""}>Itens com volumes validos</li>
              <li className={totalEstimated > 0 ? styles.done : ""}>Estimativa financeira</li>
              <li className={deliveryLocation ? styles.done : ""}>Local de recebimento</li>
              <li className={notes.trim() ? styles.done : ""}>Requisitos para cotacao</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
