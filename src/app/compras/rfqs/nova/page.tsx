"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Icon, Select } from "@/components/ui";
import styles from "./rfq-new.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock data — solicitacoes aprovadas disponiveis
// ---------------------------------------------------------------------------

const SOLICITACOES_DISPONIVEIS: Solicitacao[] = [
  {
    id: "SOL-000456",
    titulo: "Abastecimento emergencial de oleo diesel S10",
    area: "Operacoes",
    solicitante: "Breno Marques",
    prioridade: "Alta",
    valorEstimado: 2900000,
    itens: [
      { id: 1, descricao: "Oleo Diesel S10", qtd: 500000, unidade: "L" },
      { id: 2, descricao: "Aditivo ARLA 32", qtd: 12000, unidade: "L" },
    ],
    incoterm: "CIF",
    condicaoPagamento: "30 dias DDL",
    observacoes:
      "O fornecedor deve possuir certificacao ANP ativa e atender as normas ambientais vigentes de transporte.",
  },
  {
    id: "SOL-000441",
    titulo: "Reposicao de insumos de limpeza industrial",
    area: "Facilities",
    solicitante: "Carla Oliveira",
    prioridade: "Media",
    valorEstimado: 48500,
    itens: [
      { id: 1, descricao: "Desinfetante industrial 5L", qtd: 200, unidade: "UN" },
      { id: 2, descricao: "Detergente concentrado galao 20L", qtd: 50, unidade: "UN" },
    ],
    incoterm: "CIF",
    condicaoPagamento: "28 dias DDL",
    observacoes: "Produtos devem possuir registro na ANVISA e ficha FISPQ atualizada.",
  },
];

const FORNECEDORES_BASE: FornecedorConvidado[] = [
  { id: "1", nome: "Fornecedor Alfa S.A.", cnpj: "11.222.333/0001-81", selecionado: false },
  { id: "2", nome: "Petrolog Distribuidora LTDA", cnpj: "22.333.444/0001-82", selecionado: false },
  { id: "3", nome: "Combustiveis Sul LTDA", cnpj: "33.444.555/0001-83", selecionado: false },
  { id: "4", nome: "CleanPro Suprimentos LTDA", cnpj: "44.555.666/0001-84", selecionado: false },
];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PRIORITY_CLASS: Record<string, string> = {
  Alta: styles.priorityAlta,
  Critica: styles.priorityCritica,
  Media: styles.priorityMedia,
  Baixa: styles.priorityBaixa,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewRfqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params vindos do modal de aprovacao de SOL
  const paramSol = searchParams.get("sol") ?? "";
  const paramTitulo = searchParams.get("titulo") ?? "";
  const paramValor = searchParams.get("valor") ?? "";
  const paramPrioridade = searchParams.get("prioridade") ?? "";
  const paramArea = searchParams.get("area") ?? "";
  const paramSolicitante = searchParams.get("solicitante") ?? "";

  // "portao": null = nenhuma selecionada, string = id selecionado mas nao confirmado
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<string>("");
  // solicitacaoConfirmada = portao aberto, formulario visivel
  const [solicitacaoConfirmada, setSolicitacaoConfirmada] = useState<Solicitacao | null>(null);

  // Form fields — so existem apos confirmacao
  const [tituloRfq, setTituloRfq] = useState("");
  const [estrategia, setEstrategia] = useState("Menor Preco Equalizado");
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [incoterm, setIncoterm] = useState("CIF");
  const [condicaoPagamento, setCondicaoPagamento] = useState("30 dias DDL");
  const [moeda, setMoeda] = useState("BRL");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorConvidado[]>(FORNECEDORES_BASE);

  // -------------------------------------------------------------------------
  // Auto-confirmar solicitacao quando vem de URL params (modal de aprovacao)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!paramSol) return;

    // Tenta encontrar nos mocks existentes primeiro
    const solExistente = SOLICITACOES_DISPONIVEIS.find((s) => s.id === paramSol);

    if (solExistente) {
      setSolicitacaoConfirmada(solExistente);
      setSolicitacaoSelecionada(solExistente.id);
      setTituloRfq(`RFQ — ${solExistente.titulo}`);
      setIncoterm(solExistente.incoterm);
      setCondicaoPagamento(solExistente.condicaoPagamento);
      setObservacoes(solExistente.observacoes);
      setItens(solExistente.itens.map((i) => ({ ...i })));
    } else {
      // SOL nova (vem do fluxo de criacao) — monta um objeto dinamico
      const solDinamica: Solicitacao = {
        id: paramSol,
        titulo: paramTitulo || "Solicitação de compra",
        area: paramArea || "Operacoes",
        solicitante: paramSolicitante || "—",
        prioridade: paramPrioridade || "Alta",
        valorEstimado: Number(paramValor) || 0,
        itens: [
          { id: 1, descricao: paramTitulo || "Item principal", qtd: 1, unidade: "UN" },
        ],
        incoterm: "CIF",
        condicaoPagamento: "30 dias DDL",
        observacoes: "",
      };
      setSolicitacaoConfirmada(solDinamica);
      setSolicitacaoSelecionada(paramSol);
      setTituloRfq(`RFQ — ${solDinamica.titulo}`);
      setIncoterm(solDinamica.incoterm);
      setCondicaoPagamento(solDinamica.condicaoPagamento);
      setItens(solDinamica.itens.map((i) => ({ ...i })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramSol]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleConfirmarSolicitacao = () => {
    const sol = SOLICITACOES_DISPONIVEIS.find((s) => s.id === solicitacaoSelecionada);
    if (!sol) return;
    setSolicitacaoConfirmada(sol);
    // Pre-preenche formulario com dados da solicitacao
    setTituloRfq(`RFQ — ${sol.titulo}`);
    setIncoterm(sol.incoterm);
    setCondicaoPagamento(sol.condicaoPagamento);
    setObservacoes(sol.observacoes);
    setItens(sol.itens.map((i) => ({ ...i })));
  };

  const handleDesvincular = () => {
    setSolicitacaoConfirmada(null);
    setSolicitacaoSelecionada("");
    setTituloRfq("");
    setItens([]);
    setObservacoes("");
    setFornecedores(FORNECEDORES_BASE);
  };

  const toggleFornecedor = (id: string) => {
    setFornecedores((cur) =>
      cur.map((f) => (f.id === id ? { ...f, selecionado: !f.selecionado } : f))
    );
  };

  const addItem = () => {
    const nextId = Math.max(...itens.map((i) => i.id), 0) + 1;
    setItens((cur) => [...cur, { id: nextId, descricao: "", qtd: 1, unidade: "UN" }]);
  };

  const removeItem = (id: number) => {
    setItens((cur) => cur.filter((i) => i.id !== id));
  };

  const updateItem = <K extends keyof ItemCotacao>(id: number, field: K, value: ItemCotacao[K]) => {
    setItens((cur) => cur.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const fornecedoresSelecionados = useMemo(
    () => fornecedores.filter((f) => f.selecionado),
    [fornecedores]
  );

  const checklistItems = [
    { label: "Solicitacao vinculada", ok: !!solicitacaoConfirmada },
    { label: "Titulo da cotacao definido", ok: tituloRfq.trim().length > 0 },
    { label: "Data/hora limite configurada", ok: dataEncerramento.length > 0 },
    { label: "Itens com volumes validos", ok: itens.length > 0 && itens.every((i) => i.descricao && i.qtd > 0) },
    { label: "Ao menos 1 fornecedor convidado", ok: fornecedoresSelecionados.length >= 1 },
    { label: "Notas tecnicas e compliance", ok: observacoes.trim().length > 0 },
  ];

  const solicitacaoPreview = SOLICITACOES_DISPONIVEIS.find((s) => s.id === solicitacaoSelecionada);

  // =========================================================================
  // RENDER — PORTAO (sem solicitacao confirmada)
  // =========================================================================

  if (!solicitacaoConfirmada) {
    return (
      <div className={styles.formContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
          <Icon name="chevron-left" /> Voltar para Cotacoes
        </button>

        <div className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Compras externas</span>
            <h1>Nova Cotacao (RFQ)</h1>
            <p>
              Uma cotacao sempre parte de uma demanda interna aprovada. Selecione a solicitacao de
              compra que origina este processo de mercado.
            </p>
          </div>
        </div>

        {/* Gate card */}
        <div className={styles.gateWrapper}>
          <Card className={styles.gateCard}>
            <div className={styles.gateIconWrap}>
              <Icon name="file-search-02" />
            </div>
            <h2 className={styles.gateTitle}>Vincular solicitacao aprovada</h2>
            <p className={styles.gateSubtitle}>
              Selecione abaixo qual solicitacao de compra (ja aprovada internamente) sera a origem
              desta cotacao. Os dados de escopo, itens e condicoes comerciais serao importados
              automaticamente.
            </p>

            <div className={styles.gateSelectGroup}>
              <label className={styles.gateLabel}>Solicitacao de Compra Aprovada <span className="required-asterisk">*</span></label>
              <Select
                options={SOLICITACOES_DISPONIVEIS.map((s) => ({ label: `${s.id} — ${s.titulo}`, value: s.id }))}
                value={solicitacaoSelecionada}
                onChange={setSolicitacaoSelecionada}
                placeholder="Selecione uma solicitacao..."
              />
            </div>

            {/* Preview da solicitacao selecionada */}
            {solicitacaoPreview && (
              <div className={styles.gatePreview}>
                <div className={styles.gatePreviewHeader}>
                  <span className={styles.gatePreviewId}>{solicitacaoPreview.id}</span>
                  <span
                    className={`${styles.priorityPill} ${PRIORITY_CLASS[solicitacaoPreview.prioridade] ?? ""}`}
                  >
                    {solicitacaoPreview.prioridade}
                  </span>
                </div>
                <p className={styles.gatePreviewTitle}>{solicitacaoPreview.titulo}</p>
                <dl className={styles.gatePreviewMeta}>
                  <div>
                    <dt>Area</dt>
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
                <Icon name="arrow-right" /> Continuar com esta solicitacao
              </Button>
            </div>
          </Card>

          <div className={styles.gateInfo}>
            <div className={styles.gateInfoItem}>
              <div className={styles.gateInfoIcon}><Icon name="shield-tick" /></div>
              <div>
                <strong>Rastreabilidade garantida</strong>
                <span>Toda cotacao fica vinculada a uma demanda aprovada, garantindo auditoria completa do processo.</span>
              </div>
            </div>
            <div className={styles.gateInfoItem}>
              <div className={styles.gateInfoIcon}><Icon name="zap-fast" /></div>
              <div>
                <strong>Pre-preenchimento automatico</strong>
                <span>Itens, quantidades, condicoes e notas tecnicas da solicitacao sao importados sem retrabalho.</span>
              </div>
            </div>
            <div className={styles.gateInfoItem}>
              <div className={styles.gateInfoIcon}><Icon name="check-verified-02" /></div>
              <div>
                <strong>Apenas demandas aprovadas</strong>
                <span>Somente solicitacoes ja aprovadas pela chefia aparecem aqui, eliminando cotacoes sem autorizacao.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER — FORMULARIO COMPLETO (solicitacao confirmada)
  // =========================================================================

  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotacoes
      </button>

      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Compras externas</span>
          <h1>Nova Cotacao (RFQ)</h1>
          <p>
            Configure o processo de cotacao, selecione fornecedores e defina os parametros de
            compliance para equalizar propostas.
          </p>
        </div>
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>

            {/* Secao 0 — Solicitacao vinculada (somente leitura) */}
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="link-01" /></div>
                <div>
                  <h2>Origem da cotacao</h2>
                  <p>Solicitacao de compra aprovada que origina este processo de mercado.</p>
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
                    <span>{formatCurrency(solicitacaoConfirmada.valorEstimado)} estimado</span>
                  </div>
                </div>
                <div className={styles.origemRight}>
                  <span
                    className={`${styles.priorityPill} ${PRIORITY_CLASS[solicitacaoConfirmada.prioridade] ?? ""}`}
                  >
                    {solicitacaoConfirmada.prioridade}
                  </span>
                  <button className={styles.desvincularBtn} onClick={handleDesvincular}>
                    <Icon name="switch-horizontal-01" size={14} /> Trocar
                  </button>
                </div>
              </div>
            </section>

            {/* Secao 1 — Parametros Gerais */}
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="settings-01" /></div>
                <div>
                  <h2>1. Parametros gerais da cotacao</h2>
                  <p>Titulo, estrategia de compra e prazo de encerramento do processo.</p>
                </div>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Titulo da RFQ <span className="required-asterisk">*</span></label>
                <input
                  className={styles.formControl}
                  value={tituloRfq}
                  onChange={(e) => setTituloRfq(e.target.value)}
                  placeholder="Ex: Fornecimento Anual de Combustiveis Geral"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Estrategia de compra</label>
                  <Select
                    options={[
                      { label: "Menor Preco Equalizado", value: "Menor Preco Equalizado" },
                      { label: "Tecnica e Preco", value: "Tecnica e Preco" },
                      { label: "Melhor Valor Total", value: "Melhor Valor Total" }
                    ]}
                    value={estrategia}
                    onChange={setEstrategia}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Data/Hora Limite de Encerramento</label>
                  <input
                    type="datetime-local"
                    className={styles.formControl}
                    value={dataEncerramento}
                    onChange={(e) => setDataEncerramento(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Secao 2 — Itens (readonly, origem da solicitacao) */}
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="shopping-cart-01" /></div>
                <div>
                  <h2>2. Itens e quantidades solicitadas</h2>
                  <p>
                    Importados da solicitacao <strong>{solicitacaoConfirmada.id}</strong>. Voce pode
                    adicionar itens complementares ao escopo.
                  </p>
                </div>
              </div>

              <div className={styles.itemsList}>
                {itens.map((item, index) => {
                  const isFromSol = solicitacaoConfirmada.itens.some((si) => si.id === item.id);
                  return (
                    <div className={styles.itemPanel} key={item.id}>
                      <div className={styles.itemHeader}>
                        <div className={styles.itemHeaderLeft}>
                          <strong>Item {index + 1}</strong>
                          {isFromSol && (
                            <span className={styles.itemOrigemTag}>
                              <Icon name="lock-01" size={12} /> Da solicitacao
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={isFromSol}
                          title={isFromSol ? "Item importado da solicitacao nao pode ser removido" : "Remover item"}
                        >
                          <Icon name="x-close" size={18} />
                        </button>
                      </div>
                      <div className={styles.rfqItemGrid}>
                        <div className={`${styles.formGroup} ${styles.rfqItemDesc}`}>
                          <label>Descricao do item / servico <span className="required-asterisk">*</span></label>
                          <input
                            className={styles.formControl}
                            value={item.descricao}
                            onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
                            readOnly={isFromSol}
                            placeholder="Ex: Oleo Diesel S10"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Quantidade</label>
                          <input
                            type="number"
                            min="0"
                            className={styles.formControl}
                            value={item.qtd}
                            onChange={(e) => updateItem(item.id, "qtd", Number(e.target.value))}
                            readOnly={isFromSol}
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
                            value={item.unidade}
                            onChange={(value) => updateItem(item.id, "unidade", value)}
                            disabled={isFromSol}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="button" className={styles.addItemButton} onClick={addItem}>
                <Icon name="plus" /> Adicionar item complementar
              </button>
            </section>

            {/* Secao 3 — Fornecedores */}
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="building-07" /></div>
                <div>
                  <h2>3. Fornecedores convidados</h2>
                  <p>Selecione os fornecedores homologados que receberao o convite para cotacao.</p>
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

            {/* Secao 4 — Compliance */}
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon name="truck-01" /></div>
                <div>
                  <h2>4. Compliance e logistica</h2>
                  <p>Parametros comerciais que equalizam as propostas recebidas.</p>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Incoterm (Frete)</label>
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
                  <label>Condicao de pagamento</label>
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
                      { label: "USD — Dolar Americano", value: "USD" },
                      { label: "EUR — Euro", value: "EUR" }
                    ]}
                    value={moeda}
                    onChange={setMoeda}
                  />
                </div>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Notas tecnicas e requisitos de compliance</label>
                <textarea
                  className={styles.formControl}
                  rows={4}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Fornecedor deve apresentar certificacao ANP ativa, laudos de analise quimica..."
                />
              </div>
            </section>

            <div className={styles.formActions}>
              <button className={styles.btnCancel} onClick={() => router.push("/compras/rfqs")}>
                Cancelar
              </button>
              <button className={styles.secondaryAction}>
                <Icon name="save-01" /> Salvar rascunho
              </button>
              <Button
                variant="primary"
                className={styles.btnSubmit}
                onClick={() => router.push("/compras/rfqs/RFQ-2026-004")}
              >
                <Icon name="rocket-01" /> Publicar e enviar cotação
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className={styles.sideColumn}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span>Resumo da cotacao</span>
              <strong className={styles.statusPill}>
                {fornecedoresSelecionados.length} fornecedor
                {fornecedoresSelecionados.length !== 1 ? "es" : ""}
              </strong>
            </div>
            <h3>{tituloRfq || "Cotacao sem titulo"}</h3>

            <div className={styles.summaryValue}>
              <span>Total de itens no escopo</span>
              <strong>
                {itens.filter((i) => i.descricao).length} item
                {itens.filter((i) => i.descricao).length !== 1 ? "s" : ""}
              </strong>
            </div>

            <dl className={styles.summaryList}>
              <div><dt>Origem</dt><dd>{solicitacaoConfirmada.id}</dd></div>
              <div><dt>Estrategia</dt><dd>{estrategia || "—"}</dd></div>
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

          <Card className={styles.checklistCard}>
            <div className={styles.sideTitle}>
              <Icon name="info-circle" />
              <h3>Checklist da cotacao</h3>
            </div>
            <ul>
              {checklistItems.map((item) => (
                <li key={item.label} className={item.ok ? styles.done : ""}>
                  {item.label}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
