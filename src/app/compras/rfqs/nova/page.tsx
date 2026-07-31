"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Icon, Select, Badge } from "@/components/ui";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { rfqsApi } from "@/lib/api/rfqs";
import { formatUserDisplayName } from "@/lib/utils/format-display";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import styles from "./rfq-new.module.css";
import { logError, getErrorMessage } from "@/lib/utils/error";


interface Solicitacao {
  id: string;
  titulo: string;
  area: string;
  solicitante: string;
  prioridade: string;
  valorEstimado: number;
  itens: ItemCotacao[];
  incoterm: string;
  condicaoPagamento: string;
  observacoes: string;
}

interface ItemCotacao {
  id: number;
  descricao: string;
  qtd: number;
  unidade: string;
}

interface FornecedorConvidado {
  id: string;
  nome: string;
  cnpj: string;
  selecionado: boolean;
}

const SOLICITACOES_DISPONIVEIS: Solicitacao[] = [];
const FORNECEDORES_BASE: FornecedorConvidado[] = [];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PRIORITY_CLASS: Record<string, string> = {
  Alta: styles.priorityAlta,
  Critica: styles.priorityCritica,
  Media: styles.priorityMedia,
  Baixa: styles.priorityBaixa,
};

const PRIORITY_BADGE_CONFIG: Record<string, { variant: "gray" | "warning" | "danger" | "dark"; icon: string }> = {
  Critica: { variant: "dark", icon: "zap" },
  Alta: { variant: "danger", icon: "alert-triangle" },
  Media: { variant: "warning", icon: "clock" },
  Baixa: { variant: "gray", icon: "info-circle" },
};


export default function NewRfqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const paramSol = searchParams.get("sol") ?? searchParams.get("solicitacao") ?? "";
  const paramTitulo = searchParams.get("titulo") ?? "";
  const paramValor = searchParams.get("valor") ?? "";
  const paramPrioridade = searchParams.get("prioridade") ?? "";
  const paramArea = searchParams.get("area") ?? "";
  const paramSolicitante = searchParams.get("solicitante") ?? "";

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<string>("");
  const [solicitacaoConfirmada, setSolicitacaoConfirmada] = useState<Solicitacao | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tituloRfq, setTituloRfq] = useState("");
  const [estrategia, setEstrategia] = useState("Menor Preco Equalizado");
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [incoterm, setIncoterm] = useState("CIF");
  const [condicaoPagamento, setCondicaoPagamento] = useState("30 dias DDL");
  const [moeda, setMoeda] = useState("BRL");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorConvidado[]>(FORNECEDORES_BASE);

  const [solicidadoesApi, setSolicitacoesApi] = useState<Solicitacao[]>(SOLICITACOES_DISPONIVEIS);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadApiData() {
      try {
        const [reqs, sups] = await Promise.all([
          purchaseRequestsApi.list().catch((err) => { 
            logError("rfqs/nova/purchaseRequests", err); 
            toast({ variant: "warning", title: "Aviso", message: "Não foi possível carregar as solicitações aprovadas." });
            return [] as PurchaseRequest[]; 
          }),
          suppliersApi.list().catch((err) => { 
            logError("rfqs/nova/suppliers", err); 
            toast({ variant: "warning", title: "Aviso", message: "Não foi possível carregar a lista de fornecedores." });
            return [] as Supplier[]; 
          }),
        ]);

        if (reqs && reqs.length > 0) {
          const eligibleReqs = reqs.filter(
            (r) => r.status === "Approved" && (!r.rfqs || r.rfqs.length === 0)
          );

          const mappedReqs: Solicitacao[] = eligibleReqs.map((r) => ({
            id: r.id,
            titulo: r.description,
            area: r.department || "Operações",
            solicitante: r.requesterName || formatUserDisplayName(r.requesterId, user),
            prioridade: r.priority === "Critical" ? "Critica" : r.priority === "High" ? "Alta" : r.priority === "Medium" ? "Media" : "Baixa",
            valorEstimado: Number(r.estimatedBudget) || 0,
            itens: (r.items || []).map((it, idx) => ({
              id: idx + 1,
              descricao: it.description,
              qtd: Number(it.quantity) || 1,
              unidade: it.unit || "UN",
            })),
            incoterm: "CIF",
            condicaoPagamento: "30 dias DDL",
            observacoes: r.justification || "",
          }));

          setSolicitacoesApi(mappedReqs);
        } else {
          setSolicitacoesApi([]);
        }

        if (sups && sups.length > 0) {
          const mappedSups: FornecedorConvidado[] = sups.map((s) => ({
            id: s.id,
            nome: s.corporateName,
            cnpj: s.cnpj,
            selecionado: false,
          }));
          setFornecedores(mappedSups);
        } else {
          setFornecedores([]);
        }
      } catch (e) {
        // Should not normally reach here since each call has its own catch above.
        logError("rfqs/nova/loadApiData", e);
        toast({
          variant: "warning",
          title: "Aviso",
          message: "Não foi possível carregar todos os dados. Algumas opções podem estar indisponíveis.",
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadApiData();
  }, []);


  useEffect(() => {
    if (!paramSol) return;

    const solExistente = solicidadoesApi.find((s) => s.id === paramSol || (s as any).code === paramSol);

    if (solExistente) {
      setSolicitacaoConfirmada(solExistente);
      setSolicitacaoSelecionada(solExistente.id);
      setTituloRfq(`RFQ — ${solExistente.titulo}`);
      setIncoterm(solExistente.incoterm);
      setCondicaoPagamento(solExistente.condicaoPagamento);
      setObservacoes(solExistente.observacoes);
      setItens(solExistente.itens.map((i) => ({ ...i })));
      if (solExistente.itens.length > 0) {
        setExpandedItemId(solExistente.itens[0].id);
      }
    } else if (paramSol) {
      toast({
        variant: "warning",
        title: "Solicitação não elegível",
        message: "A solicitação informada ainda não foi aprovada ou já possui uma cotação aberta.",
      });
    }
    setCurrentStep(1);
  }, [paramSol, solicidadoesApi]);


  const handleConfirmarSolicitacao = () => {
    const sol = solicidadoesApi.find((s) => s.id === solicitacaoSelecionada);
    if (!sol) return;
    setSolicitacaoConfirmada(sol);
    setTituloRfq(`RFQ — ${sol.titulo}`);
    setIncoterm(sol.incoterm);
    setCondicaoPagamento(sol.condicaoPagamento);
    setObservacoes(sol.observacoes);
    setItens(sol.itens.map((i) => ({ ...i })));
    setCurrentStep(1);
    if (sol.itens.length > 0) {
      setExpandedItemId(sol.itens[0].id);
    }
  };

  const handleDesvincular = () => {
    setSolicitacaoConfirmada(null);
    setSolicitacaoSelecionada("");
    setTituloRfq("");
    setItens([]);
    setObservacoes("");
    setFornecedores(FORNECEDORES_BASE);
    setCurrentStep(1);
  };

  const toggleFornecedor = (id: string) => {
    setFornecedores((cur) =>
      cur.map((f) => (f.id === id ? { ...f, selecionado: !f.selecionado } : f))
    );
  };

  const addItem = () => {
    const nextId = Math.max(...itens.map((i) => i.id), 0) + 1;
    setItens((cur) => [...cur, { id: nextId, descricao: "", qtd: 1, unidade: "UN" }]);
    setExpandedItemId(nextId);
  };

  const removeItem = (id: number) => {
    setItens((cur) => cur.filter((i) => i.id !== id));
  };

  const updateItem = <K extends keyof ItemCotacao>(id: number, field: K, value: ItemCotacao[K]) => {
    setItens((cur) => cur.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };


  const fornecedoresSelecionados = useMemo(
    () => fornecedores.filter((f) => f.selecionado),
    [fornecedores]
  );



  const solicitacaoPreview = solicidadoesApi.find((s) => s.id === solicitacaoSelecionada);


  if (!solicitacaoConfirmada) {
    return (
      <div className={styles.formContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
          <Icon name="chevron-left" /> Voltar para Cotações
        </button>

        <div className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Compras externas</span>
            <h1>Nova Cotação (RFQ)</h1>
            <p>
              Uma cotação sempre parte de uma demanda interna aprovada. Selecione a solicitação de
              compra que origina este processo de mercado.
            </p>
          </div>
        </div>

        
        <div className={styles.gateWrapper}>
          <Card className={styles.gateCard}>
            <div className={styles.gateIconWrap}>
              <Icon name="file-search-02" />
            </div>
            <h2 className={styles.gateTitle}>Vincular solicitação aprovada</h2>
            <p className={styles.gateSubtitle}>
              Selecione abaixo qual solicitação de compra (já aprovada internamente) será a origem
              desta cotação. Os dados de escopo, itens e condições comerciais serão importados
              automaticamente.
            </p>

            <div className={styles.gateSelectGroup}>
              <label className={styles.gateLabel}>Solicitação de Compra Aprovada <span className="required-asterisk">*</span></label>
              <Select
                options={solicidadoesApi.map((s) => ({ label: `${s.id} — ${s.titulo}`, value: s.id }))}
                value={solicitacaoSelecionada}
                onChange={setSolicitacaoSelecionada}
                placeholder={loadingData ? "Carregando solicitações..." : "Selecione uma solicitação..."}
              />
            </div>

            
            {solicitacaoPreview && (
              <div className={styles.gatePreview}>
                <div className={styles.gatePreviewHeader}>
                  <span className={styles.gatePreviewId}>{solicitacaoPreview.id}</span>
                  <Badge
                    variant={PRIORITY_BADGE_CONFIG[solicitacaoPreview.prioridade]?.variant ?? "gray"}
                    icon={PRIORITY_BADGE_CONFIG[solicitacaoPreview.prioridade]?.icon ?? "info-circle"}
                  >
                    {solicitacaoPreview.prioridade}
                  </Badge>
                </div>
                <p className={styles.gatePreviewTitle}>{solicitacaoPreview.titulo}</p>
                <dl className={styles.gatePreviewMeta}>
                  <div>
                    <dt>Área</dt>
                    <dd>{solicitacaoPreview.area}</dd>
                  </div>
                  <div>
                    <dt>Solicitante</dt>
                    <dd>{solicitacaoPreview.solicitante}</dd>
                  </div>
                  <div>
                    <dt>Itens</dt>
                    <dd>{solicitacaoPreview.itens.length} item(s)</dd>
                  </div>
                  <div>
                    <dt>Valor estimado</dt>
                    <dd>{formatCurrency(solicitacaoPreview.valorEstimado)}</dd>
                  </div>
                </dl>
                <ul className={styles.gatePreviewItens}>
                  {solicitacaoPreview.itens.map((item) => (
                    <li key={item.id}>
                      <Icon name="package" size={14} />
                      {item.descricao} — {item.qtd.toLocaleString("pt-BR")} {item.unidade}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.gateActions}>
              <button
                className={styles.btnCancel}
                onClick={() => router.push("/compras/rfqs")}
              >
                Cancelar
              </button>
              <Button
                variant="primary"
                className={styles.btnSubmit}
                onClick={handleConfirmarSolicitacao}
                disabled={!solicitacaoSelecionada}
              >
                <Icon name="arrow-right" /> Continuar com esta solicitação
              </Button>
            </div>
          </Card>

          <div className={styles.gateInfo}>
            <div className={styles.gateInfoItem}>
              <div className={styles.gateInfoIcon}><Icon name="shield-tick" /></div>
              <div>
                <strong>Rastreabilidade garantida</strong>
                <span>Toda cotação fica vinculada a uma demanda aprovada, garantindo auditoria completa do processo.</span>
              </div>
            </div>
            <div className={styles.gateInfoItem}>
              <div className={styles.gateInfoIcon}><Icon name="zap-fast" /></div>
              <div>
                <strong>Pré-preenchimento automático</strong>
                <span>Itens, quantidades, condições e notas técnicas da solicitação são importados sem retrabalho.</span>
              </div>
            </div>
            <div className={styles.gateInfoItem}>
              <div className={styles.gateInfoIcon}><Icon name="check-verified-02" /></div>
              <div>
                <strong>Apenas demandas aprovadas</strong>
                <span>Somente solicitações já aprovadas pela chefia aparecem aqui, eliminando cotações sem autorização.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Compras externas</span>
          <h1>Nova Cotação (RFQ)</h1>
          <p>
            Configure o processo de cotação, selecione fornecedores e defina os parâmetros de
            compliance para equalizar propostas.
          </p>
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
          <span className={styles.stepLabel}>Parâmetros</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div 
          className={`${styles.stepIndicator} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepCompleted : ""} ${currentStep < 2 ? styles.stepDisabled : ""}`}
          onClick={() => currentStep >= 2 ? setCurrentStep(2) : undefined}
        >
          <div className={styles.stepNumber}>
            {currentStep > 2 ? <Icon name="check" size={16} /> : "2"}
          </div>
          <span className={styles.stepLabel}>Itens</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div 
          className={`${styles.stepIndicator} ${currentStep === 3 ? styles.stepActive : currentStep > 3 ? styles.stepCompleted : ""} ${currentStep < 3 ? styles.stepDisabled : ""}`}
          onClick={() => currentStep >= 3 ? setCurrentStep(3) : undefined}
        >
          <div className={styles.stepNumber}>
            {currentStep > 3 ? <Icon name="check" size={16} /> : "3"}
          </div>
          <span className={styles.stepLabel}>Fornecedores</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div 
          className={`${styles.stepIndicator} ${currentStep === 4 ? styles.stepActive : ""} ${currentStep < 4 ? styles.stepDisabled : ""}`}
          onClick={() => currentStep >= 4 ? setCurrentStep(4) : undefined}
        >
          <div className={styles.stepNumber}>4</div>
          <span className={styles.stepLabel}>Compliance</span>
        </div>
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>

            
            {currentStep === 1 && (
              <>
                
                <section className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}><Icon name="link-01" /></div>
                    <div>
                      <h2>Origem da cotação</h2>
                      <p>Solicitação de compra aprovada que origina este processo de mercado.</p>
                    </div>
                  </div>

                  <div className={styles.origemBox}>
                    <div className={styles.origemLeft}>
                      <div className={styles.origemId}>{solicitacaoConfirmada.id}</div>
                      <div className={styles.origemTitulo}>{solicitacaoConfirmada.titulo}</div>
                      <div className={styles.origemMeta}>
                        <span>{solicitacaoConfirmada.area}</span>
                        <span>·</span>
                        <span>{solicitacaoConfirmada.solicitante}</span>
                        <span>·</span>
                        <span>{formatCurrency(solicitacaoConfirmada.valorEstimado || 0)} estimado</span>
                      </div>
                    </div>
                    <div className={styles.origemRight}>
                      <Badge
                        variant={PRIORITY_BADGE_CONFIG[solicitacaoConfirmada.prioridade]?.variant ?? "gray"}
                        icon={PRIORITY_BADGE_CONFIG[solicitacaoConfirmada.prioridade]?.icon ?? "info-circle"}
                      >
                        {solicitacaoConfirmada.prioridade}
                      </Badge>
                      <button className={styles.desvincularBtn} onClick={handleDesvincular}>
                        <Icon name="switch-horizontal-01" size={14} /> Trocar
                      </button>
                    </div>
                  </div>
                </section>

                <section className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}><Icon name="settings-01" /></div>
                    <div>
                      <h2>1. Parâmetros gerais da cotação</h2>
                      <p>Título, estratégia de compra e prazo de encerramento do processo.</p>
                    </div>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Título da RFQ <span className="required-asterisk">*</span></label>
                    <input
                      className={styles.formControl}
                      value={tituloRfq}
                      onChange={(e) => setTituloRfq(e.target.value)}
                      placeholder="Ex: Fornecimento Anual de Combustíveis Geral"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Estratégia de compra <span className="required-asterisk">*</span></label>
                      <Select
                        options={[
                          { label: "Menor Preço Equalizado", value: "Menor Preco Equalizado" },
                          { label: "Técnica e Preço", value: "Tecnica e Preco" },
                          { label: "Melhor Valor Total", value: "Melhor Valor Total" }
                        ]}
                        value={estrategia}
                        onChange={setEstrategia}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Data/Hora Limite de Encerramento <span className="required-asterisk">*</span></label>
                      <input
                        type="datetime-local"
                        className={styles.formControl}
                        value={dataEncerramento}
                        onChange={(e) => setDataEncerramento(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            
            {currentStep === 2 && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon name="shopping-cart-01" /></div>
                  <div>
                    <h2>2. Itens e quantidades solicitadas</h2>
                    <p>
                      Importados da solicitação <strong>{solicitacaoConfirmada.id}</strong>. Você pode
                      adicionar itens complementares ao escopo.
                    </p>
                  </div>
                </div>

                <div className={styles.itemsList}>
                  {itens.map((item, index) => {
                    const isFromSol = solicitacaoConfirmada.itens.some((si) => si.id === item.id);
                    const isExpanded = expandedItemId === item.id;

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
                                {item.descricao || "Novo item complementar sem descrição"}
                              </span>
                              <span className={styles.itemSummaryMeta}>
                                Qtd: {item.qtd.toLocaleString("pt-BR")} {item.unidade} {isFromSol && "• Origem: Solicitação"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.itemSummaryRight}>
                            {isFromSol && (
                              <span className={styles.itemOrigemTag} style={{ marginRight: "8px" }}>
                                <Icon name="lock-01" size={12} /> Da solicitação
                              </span>
                            )}
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
                              disabled={isFromSol}
                              title={isFromSol ? "Item importado da solicitação não pode ser removido" : "Remover item"}
                            >
                              <Icon name="x-close" size={18} />
                            </button>
                          </div>
                        </div>

                        
                        {isExpanded && (
                          <div className={styles.accordionExpandable}>
                            <div className={styles.gridCol12}>
                              <div className={`${styles.formGroup} ${styles.col6}`}>
                                <label>Descrição do item / serviço <span className="required-asterisk">*</span></label>
                                <input
                                  className={styles.formControl}
                                  value={item.descricao}
                                  onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
                                  readOnly={isFromSol}
                                  placeholder="Ex: Óleo Diesel S10"
                                />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col3}`}>
                                <label>Quantidade <span className="required-asterisk">*</span></label>
                                <input
                                  type="number"
                                  min="0"
                                  className={styles.formControl}
                                  value={item.qtd}
                                  onChange={(e) => updateItem(item.id, "qtd", Number(e.target.value))}
                                  readOnly={isFromSol}
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
                                  value={item.unidade}
                                  onChange={(value) => updateItem(item.id, "unidade", value)}
                                  disabled={isFromSol}
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
                  <Icon name="plus" /> Adicionar item complementar
                </button>
              </section>
            )}

            
            {currentStep === 3 && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon name="building-07" /></div>
                  <div>
                    <h2>3. Fornecedores convidados <span className="required-asterisk">*</span></h2>
                    <p>Selecione os fornecedores homologados que receberão o convite para cotação.</p>
                    {solicitacaoConfirmada && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 13, color: "#334155", borderLeft: "3px solid #007d79" }}>
                        <Icon name="info-circle" size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                        Com base no valor estimado ({formatCurrency(solicitacaoConfirmada.valorEstimado || 0)}), a política exige no mínimo <strong>{solicitacaoConfirmada.valorEstimado > 5000 ? 3 : solicitacaoConfirmada.valorEstimado > 1000 ? 2 : 1} orçamentos</strong>.
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.fornecedoresList}>
                  {fornecedores.map((f) => (
                    <label
                      key={f.id}
                      className={`${styles.fornecedorRow} ${f.selecionado ? styles.fornecedorSelecionado : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={f.selecionado}
                        onChange={() => toggleFornecedor(f.id)}
                        className={styles.fornecedorCheck}
                      />
                      <div className={styles.fornecedorInfo}>
                        <strong>{f.nome}</strong>
                        <span>{f.cnpj}</span>
                      </div>
                      {f.selecionado && (
                        <span className={styles.fornecedorBadge}>Convidado</span>
                      )}
                    </label>
                  ))}
                </div>
              </section>
            )}

            
            {currentStep === 4 && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon name="truck-01" /></div>
                  <div>
                    <h2>4. Compliance e logística</h2>
                    <p>Parâmetros comerciais que equalizam as propostas recebidas.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Incoterm (Frete) <span className="required-asterisk">*</span></label>
                    <Select
                      options={[
                        { label: "CIF — Custos e frete pagos pelo fornecedor", value: "CIF" },
                        { label: "FOB — Frete por conta da VNMB", value: "FOB" },
                        { label: "EXW — Retirada na planta do fornecedor", value: "EXW" }
                      ]}
                      value={incoterm}
                      onChange={setIncoterm}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Condição de pagamento <span className="required-asterisk">*</span></label>
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
                    <label>Moeda base <span className="required-asterisk">*</span></label>
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
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, preencha o título da RFQ" });
                        return;
                      }
                      if (!dataEncerramento) {
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, preencha a data de encerramento" });
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
                        toast({ variant: "warning", title: "Atenção", message: "Por favor, preencha a descrição e quantidade de todos os itens" });
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
                      const valor = solicitacaoConfirmada?.valorEstimado || 0;
                      let minSuppliers = 1;
                      if (valor > 5000) minSuppliers = 3;
                      else if (valor > 1000) minSuppliers = 2;

                      if (fornecedoresSelecionados.length < minSuppliers) {
                        toast({ variant: "warning", title: "Política de Compras", message: `Para esta faixa de valor, é obrigatório convidar no mínimo ${minSuppliers} fornecedore(s).` });
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
                      if (!incoterm || !condicaoPagamento.trim() || !moeda) {
                        toast({ variant: "warning", title: "Atenção", message: "Preencha os dados de compliance obrigatórios (Incoterm, Condição e Moeda)" });
                        return;
                      }
                      
                      setIsSubmitting(true);
                      try {
                        const selectedSupplierIds = fornecedoresSelecionados.map((f) => f.id);
                        const endClosesAt = dataEncerramento
                          ? new Date(dataEncerramento).toISOString()
                          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                        const createdRfq = await rfqsApi.create({
                          requestId: solicitacaoConfirmada?.id || paramSol,
                          title: tituloRfq || "Cotação de Compra",
                          closesAt: endClosesAt,
                          supplierIds: selectedSupplierIds,
                        });

                        router.push(`/compras/rfqs/${createdRfq.id}`);
                      } catch (err) {
                        logError("rfqs/nova/create", err);
                        toast({
                          variant: "error",
                          title: "Erro",
                          message: getErrorMessage(err),
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Publicar Cotação <Icon name="check-circle" />
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        
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
              <div><dt>Origem</dt><dd>{solicitacaoConfirmada.id}</dd></div>
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
