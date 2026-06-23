"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon } from "@/components/ui";
import styles from "./solicitacoes-new.module.css";

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

  return (
    <div className={styles.formContainer}>
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
                  <select className={styles.formControl} value={department} onChange={(event) => setDepartment(event.target.value)}>
                    <option>Operacoes</option>
                    <option>Manutencao</option>
                    <option>Administrativo</option>
                    <option>Facilities</option>
                    <option>TI</option>
                  </select>
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
                  <select className={styles.formControl} value={purchaseType} onChange={(event) => setPurchaseType(event.target.value)}>
                    <option>Material recorrente</option>
                    <option>Compra spot</option>
                    <option>Servico tecnico</option>
                    <option>Contrato recorrente</option>
                    <option>Projeto especial</option>
                  </select>
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
                        <select className={styles.formControl} value={item.category} onChange={(event) => updateItem(item.id, "category", event.target.value)}>
                          <option>Combustiveis</option>
                          <option>Insumos operacionais</option>
                          <option>MRO / Pecas</option>
                          <option>Servicos tecnicos</option>
                          <option>Facilities</option>
                        </select>
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
                        <select className={styles.formControl} value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)}>
                          <option>L</option>
                          <option>UN</option>
                          <option>KG</option>
                          <option>M</option>
                          <option>H</option>
                          <option>Pacote</option>
                        </select>
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
                  <select className={styles.formControl} value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)}>
                    <option>Base Operacional - Paulinia/SP</option>
                    <option>Matriz - Sao Paulo/SP</option>
                    <option>Filial - Campinas/SP</option>
                    <option>Obra / campo operacional</option>
                  </select>
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
              <Button variant="primary" className={styles.btnSubmit} onClick={() => router.push("/compras/solicitacoes")}>
                <Icon name="send-01" /> Enviar para aprovacao
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
