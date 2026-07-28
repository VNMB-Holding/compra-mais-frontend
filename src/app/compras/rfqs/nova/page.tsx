"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { rfqsApi } from "@/lib/api/rfqs";
import { Card, Button, Icon, Select, Badge } from "@/components/ui";
import styles from "./rfq-new.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemCotacao {
  id: number | string;
  descricao: string;
  qtd: number;
  unidade: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PRIORITY_BADGE_CONFIG: Record<string, { variant: "gray" | "warning" | "danger" | "dark"; icon: string }> = {
  Critica: { variant: "dark", icon: "zap" },
  Alta: { variant: "danger", icon: "alert-triangle" },
  Media: { variant: "warning", icon: "clock" },
  Baixa: { variant: "gray", icon: "info-circle" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewRfqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [availableRequests, setAvailableRequests] = useState<PurchaseRequest[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    purchaseRequestsApi.list().then(res => setAvailableRequests(res.filter(r => r.status === "Approved"))).catch(console.error);
    suppliersApi.list().then(res => setAvailableSuppliers(res.filter(s => s.status === "Active"))).catch(console.error);
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const paramSol = searchParams.get("solicitacao");

  // Step 1
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(paramSol || "");
  const [solicitacaoConfirmada, setSolicitacaoConfirmada] = useState<PurchaseRequest | null>(null);
  const [tituloRfq, setTituloRfq] = useState("");
  const [estrategia, setEstrategia] = useState("Menor Preço Global");
  const [dataEncerramento, setDataEncerramento] = useState("");

  // Step 2
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<number | string | null>(null);

  // Step 3
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<string[]>([]);
  const [buscaFornecedor, setBuscaFornecedor] = useState("");

  // Step 4
  const [incoterm, setIncoterm] = useState("CIF");
  const [condicaoPagamento, setCondicaoPagamento] = useState("30 dias DDL");
  const [moeda, setMoeda] = useState("BRL");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (paramSol && availableRequests.length > 0) {
      const solExistente = availableRequests.find((s) => s.id === paramSol);
      if (solExistente) {
        setSolicitacaoConfirmada(solExistente);
        setTituloRfq(`RFQ - ${solExistente.description}`);
        if(solExistente.items) {
           setItens(solExistente.items.map((i, index) => ({ id: i.id || index, descricao: i.description, qtd: i.quantity, unidade: i.unit })));
        }
      }
    }
  }, [paramSol, availableRequests]);

  const handleConfirmarSolicitacao = () => {
    const sol = availableRequests.find((s) => s.id === solicitacaoSelecionada);
    if (!sol) return;
    setSolicitacaoConfirmada(sol);
    setTituloRfq(`RFQ - ${sol.description}`);
    if(sol.items) {
       setItens(sol.items.map((i, index) => ({ id: i.id || index, descricao: i.description, qtd: i.quantity, unidade: i.unit })));
    }
    setCurrentStep(1);
  };

  const handleDesvincular = () => {
    setSolicitacaoConfirmada(null);
    setSolicitacaoSelecionada("");
    setTituloRfq("");
    setItens([]);
    setCurrentStep(1);
  };

  const toggleFornecedor = (id: string) => {
    setFornecedoresSelecionados(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addItem = () => {
    const nextId = Date.now();
    setItens((cur) => [...cur, { id: nextId, descricao: "", qtd: 1, unidade: "UN" }]);
    setExpandedItemId(nextId);
  };

  const removeItem = (id: number | string) => {
    setItens((cur) => cur.filter((i) => i.id !== id));
  };

  const updateItem = <K extends keyof ItemCotacao>(id: number | string, field: K, value: ItemCotacao[K]) => {
    setItens((cur) => cur.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const solicitacaoPreview = availableRequests.find((s) => s.id === solicitacaoSelecionada);

  if (!solicitacaoConfirmada) {
    return (
      <div className={styles.formContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
          <Icon name="chevron-left" /> Voltar para Cotações
        </button>

        <div className={styles.pageHeader}>
          <h1>Nova Cotação (RFQ)</h1>
        </div>

        <div className={styles.gateWrapper}>
          <Card className={styles.gateCard}>
            <div className={styles.gateSelectGroup}>
              <label>Solicitação de Compra Aprovada <span className="required-asterisk">*</span></label>
                <Select
                  options={availableRequests.map((s) => ({ label: `${s.code} - ${s.description}`, value: s.id }))}
                  value={solicitacaoSelecionada}
                  onChange={setSolicitacaoSelecionada}
                  placeholder="Selecione uma solicitação..."
                />
            </div>
            {solicitacaoPreview && (
              <div className={styles.gatePreview}>
                <p>{solicitacaoPreview.description}</p>
              </div>
            )}
            <div className={styles.gateActions}>
              <Button
                variant="primary"
                onClick={handleConfirmarSolicitacao}
                disabled={!solicitacaoSelecionada}
              >
                Continuar com esta solicitação
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar
      </button>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>
            {currentStep === 1 && (
              <>
                <section className={styles.formSection}>
                  <div className={styles.origemBox}>
                    <div className={styles.origemLeft}>
                      <div className={styles.origemId}>{solicitacaoConfirmada.code}</div>
                      <div className={styles.origemTitulo}>{solicitacaoConfirmada.description}</div>
                    </div>
                    <div className={styles.origemRight}>
                      <button className={styles.desvincularBtn} onClick={handleDesvincular}>
                        <Icon name="switch-horizontal-01" size={14} /> Trocar
                      </button>
                    </div>
                  </div>
                </section>
                <section className={styles.formSection}>
                  <input value={tituloRfq} onChange={(e) => setTituloRfq(e.target.value)} />
                </section>
              </>
            )}

            {currentStep === 2 && (
              <section className={styles.formSection}>
                {itens.map((item, index) => (
                  <div key={item.id}>
                    <input value={item.descricao} onChange={(e) => updateItem(item.id, "descricao", e.target.value)} />
                    <button onClick={() => removeItem(item.id)}>X</button>
                  </div>
                ))}
                <button onClick={addItem}>Adicionar item</button>
              </section>
            )}

            {currentStep === 3 && (
              <section className={styles.formSection}>
                <input placeholder="Buscar fornecedor..." value={buscaFornecedor} onChange={(e) => setBuscaFornecedor(e.target.value)} />
                <div className={styles.suppliersGrid}>
                  {availableSuppliers
                    .filter((f) => f.corporateName.toLowerCase().includes(buscaFornecedor.toLowerCase()) || f.segment.toLowerCase().includes(buscaFornecedor.toLowerCase()))
                    .map((forn) => {
                      const isSelected = fornecedoresSelecionados.includes(forn.id);
                      return (
                        <div key={forn.id} onClick={() => toggleFornecedor(forn.id)}>
                          <strong>{forn.corporateName}</strong>
                          {isSelected && <Badge variant="primary" icon="check">Selecionado</Badge>}
                        </div>
                      );
                  })}
                </div>
              </section>
            )}

            {currentStep === 4 && (
              <section className={styles.formSection}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Incoterm</label>
                    <Select
                      options={[
                        { label: "CIF — Cost, Insurance & Freight", value: "CIF" },
                        { label: "FOB — Free on Board", value: "FOB" },
                        { label: "EXW — Ex Works", value: "EXW" },
                        { label: "DDP — Delivered Duty Paid", value: "DDP" },
                      ]}
                      value={incoterm}
                      onChange={setIncoterm}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Condição de pagamento</label>
                    <input
                      className={styles.formControl}
                      value={condicaoPagamento}
                      onChange={(e) => setCondicaoPagamento(e.target.value)}
                      placeholder="Ex: 30 dias DDL"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Moeda base</label>
                    <Select
                      options={[
                        { label: "BRL — Real Brasileiro", value: "BRL" },
                        { label: "USD — Dólar Americano", value: "USD" },
                        { label: "EUR — Euro", value: "EUR" }
                      ]}
                      value={moeda}
                      onChange={setMoeda}
                    />
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Notas técnicas e requisitos de compliance</label>
                  <textarea
                    className={styles.formControl}
                    rows={4}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: Fornecedor deve apresentar certificação ANP ativa, laudos de análise química..."
                  />
                </div>
              </section>
            )}

            {/* STEP BUTTONS */}
            <div className={styles.formActions}>
              {currentStep === 1 && (
                <>
                  <button type="button" className={styles.btnCancel} onClick={() => router.push("/compras/rfqs")}>
                    Cancelar
                  </button>
                  <Button 
                    variant="primary" 
                    type="button" 
                    className={styles.btnSubmit} 
                    onClick={() => {
                      if (!tituloRfq.trim()) {
                        alert("Por favor, preencha o título da RFQ");
                        return;
                      }
                      if (!dataEncerramento) {
                        alert("Por favor, preencha a data de encerramento");
                        return;
                      }
                      setCurrentStep(2);
                    }}
                  >
                    Avançar <Icon name="chevron-right" />
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
                      if (itens.some((i) => !i.descricao.trim() || i.qtd <= 0)) {
                        alert("Por favor, preencha a descrição e quantidade de todos os itens");
                        return;
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
                  <Button 
                    variant="primary" 
                    type="button" 
                    className={styles.btnSubmit} 
                    onClick={() => {
                      if (fornecedoresSelecionados.length === 0) {
                        alert("Por favor, convide pelo menos um fornecedor");
                        return;
                      }
                      setCurrentStep(4);
                    }}
                  >
                    Avançar <Icon name="chevron-right" />
                  </Button>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <button type="button" className={styles.btnCancel} onClick={() => setCurrentStep(3)}>
                    <Icon name="chevron-left" /> Voltar
                  </button>
                  <button type="button" className={styles.secondaryAction} onClick={() => router.push("/compras/rfqs")}>
                    <Icon name="save-01" /> Salvar rascunho
                  </button>
                  <Button
                    variant="primary"
                    className={styles.btnSubmit}
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const newRfq = await rfqsApi.create({
                          title: tituloRfq,
                          closesAt: dataEncerramento,
                          requestId: solicitacaoConfirmada?.id as string,
                          supplierIds: fornecedoresSelecionados
                        });
                        router.push(`/compras/rfqs/${newRfq.id}`);
                      } catch (err) {
                        alert("Erro ao publicar RFQ");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    <Icon name="rocket-01" /> Publicar e enviar cotação
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className={styles.sideColumn}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span>Resumo da cotação</span>
              <strong className={styles.statusPill}>
                {fornecedoresSelecionados.length} fornecedor
                {fornecedoresSelecionados.length !== 1 ? "es" : ""}
              </strong>
            </div>
            <h3>{tituloRfq || "Cotação sem título"}</h3>

            <div className={styles.summaryValue}>
              <span>Total de itens no escopo</span>
              <strong>
                {itens.filter((i) => i.descricao).length} item
                {itens.filter((i) => i.descricao).length !== 1 ? "s" : ""}
              </strong>
            </div>

            <dl className={styles.summaryList}>
              {solicitacaoConfirmada && <div><dt>Origem</dt><dd>{solicitacaoConfirmada.code}</dd></div>}
              <div><dt>Estratégia</dt><dd>{estrategia || "—"}</dd></div>
              <div><dt>Incoterm</dt><dd>{incoterm || "—"}</dd></div>
              <div><dt>Pagamento</dt><dd>{condicaoPagamento || "—"}</dd></div>
              <div><dt>Moeda</dt><dd>{moeda || "—"}</dd></div>
              <div>
                <dt>Encerra em</dt>
                <dd>
                  {dataEncerramento
                    ? new Date(dataEncerramento).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </dd>
              </div>
            </dl>
          </Card>


        </aside>
      </div>
    </div>
  );
}
