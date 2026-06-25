"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./rfq-detail.module.css";

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------
type Estagio = "proposta" | "analise" | "aprovacao";
type PropostaStatus = "aguardando" | "recebida" | "declinada";

interface Proposta {
  fornecedorId: string;
  nome: string;
  cnpj: string;
  status: PropostaStatus;
  precoUnitario?: number;
  frete?: number;
  prazoEntrega?: number;
  condicaoPagamento?: string;
  observacoes?: string;
}

const RFQ_DATA = {
  id: "RFQ-2026-004",
  titulo: "Fornecimento de Oleo Diesel S10",
  origem: "SOL-000456",
  solicitante: "Breno Marques",
  encerraEm: "05/07/2026",
  itens: [
    { id: 1, descricao: "Oleo Diesel S10", qtd: 500000, unidade: "L" },
    { id: 2, descricao: "Aditivo ARLA 32", qtd: 12000, unidade: "L" },
  ],
};

const PROPOSTAS_INICIAIS: Proposta[] = [
  {
    fornecedorId: "1",
    nome: "Fornecedor Alfa S.A.",
    cnpj: "11.222.333/0001-81",
    status: "recebida",
    precoUnitario: 5.95,
    frete: 0.25,
    prazoEntrega: 2,
    condicaoPagamento: "30 dias DDL",
  },
  {
    fornecedorId: "2",
    nome: "Petrolog Distribuidora LTDA",
    cnpj: "22.333.444/0001-82",
    status: "recebida",
    precoUnitario: 5.89,
    frete: 0.2,
    prazoEntrega: 1,
    condicaoPagamento: "30 dias DDL",
  },
  {
    fornecedorId: "3",
    nome: "Combustiveis Sul LTDA",
    cnpj: "33.444.555/0001-83",
    status: "aguardando",
  },
];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ---------------------------------------------------------------------------
// Component: Proposta Card (Estilo Original VNMB)
// ---------------------------------------------------------------------------
function PropostaCard({
  proposta,
  isWinner,
  onSalvar,
}: {
  proposta: Proposta;
  isWinner: boolean;
  onSalvar: (id: string, dados: Partial<Proposta>) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [draft, setDraft] = useState({
    precoUnitario: proposta.precoUnitario ?? 0,
    frete: proposta.frete ?? 0,
    prazoEntrega: proposta.prazoEntrega ?? 1,
    condicaoPagamento: proposta.condicaoPagamento ?? "30 dias DDL",
  });

  const handleSalvar = () => {
    onSalvar(proposta.fornecedorId, { ...draft, status: "recebida" });
    setAberto(false);
  };

  const totalEqualizado = (draft.precoUnitario + draft.frete) * RFQ_DATA.itens.reduce((s, i) => s + i.qtd, 0);

  return (
    <div className={`${styles.propostaCard} ${proposta.status === "recebida" ? styles.propostaRecebida : ""} ${isWinner ? styles.propostaVencedora : ""}`}>
      <div className={styles.propostaCardHeader}>
        <div className={styles.propostaInfo}>
          <div className={styles.propostaFornecedorNome}>
            {isWinner && (
              <span className={styles.vencedorTag}>
                <Icon name="trophy-01" size={12} /> Melhor proposta
              </span>
            )}
            <strong>{proposta.nome}</strong>
          </div>
          <span className={styles.propostaCnpj}>{proposta.cnpj}</span>
        </div>

        <div className={styles.propostaCardRight}>
          {proposta.status === "aguardando" && (
            <span className={styles.badgeAguardando}>
              <Icon name="clock" size={13} /> Aguardando
            </span>
          )}
          {proposta.status === "recebida" && !aberto && (
            <div className={styles.propostaSumario}>
              <span className={styles.propostaPreco}>{formatCurrency(proposta.precoUnitario!)} / un</span>
              <span className={styles.propostaPrazo}>{proposta.prazoEntrega} dia(s) · {proposta.condicaoPagamento}</span>
            </div>
          )}

          <div className={styles.propostaActions}>
            {proposta.status === "aguardando" && (
              <button className={styles.btnRegistrar} onClick={() => setAberto(!aberto)}>
                <Icon name="plus" size={15} /> Registrar proposta
              </button>
            )}
            {proposta.status === "recebida" && (
              <button className={styles.btnEditar} onClick={() => setAberto(!aberto)}>
                <Icon name="edit-01" size={15} /> {aberto ? "Fechar" : "Editar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {aberto && (
        <div className={styles.propostaForm}>
          <div className={styles.propostaFormDivider} />
          <div className={styles.propostaFormGrid}>
            <div className={styles.propostaField}>
              <label>Preço unitário liquido (R$)</label>
              <input type="number" step="0.01" className={styles.propostaInput} value={draft.precoUnitario} onChange={(e) => setDraft((d) => ({ ...d, precoUnitario: Number(e.target.value) }))} />
            </div>
            <div className={styles.propostaField}>
              <label>Custo de frete unitário (R$)</label>
              <input type="number" step="0.01" className={styles.propostaInput} value={draft.frete} onChange={(e) => setDraft((d) => ({ ...d, frete: Number(e.target.value) }))} />
            </div>
            <div className={styles.propostaField}>
              <label>Prazo de entrega (dias)</label>
              <input type="number" className={styles.propostaInput} value={draft.prazoEntrega} onChange={(e) => setDraft((d) => ({ ...d, prazoEntrega: Number(e.target.value) }))} />
            </div>
            <div className={styles.propostaField}>
              <label>Condição de pagamento</label>
              <input className={styles.propostaInput} value={draft.condicaoPagamento} onChange={(e) => setDraft((d) => ({ ...d, condicaoPagamento: e.target.value }))} />
            </div>
          </div>

          {draft.precoUnitario > 0 && (
            <div className={styles.propostaTotalPreview}>
              <span>Custo total equalizado estimado:</span>
              <strong>{formatCurrency(totalEqualizado)}</strong>
            </div>
          )}

          <div className={styles.propostaFormActions}>
            <button className={styles.btnCancelarForm} onClick={() => setAberto(false)}>Cancelar</button>
            <button className={styles.btnSalvarProposta} onClick={handleSalvar}><Icon name="save-01" size={15} /> Salvar proposta</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function RfqDetailPage() {
  const router = useRouter();
  const [estagio, setEstagio] = useState<Estagio>("proposta");
  const [propostas, setPropostas] = useState<Proposta[]>(PROPOSTAS_INICIAIS);
  const [vencedorId, setVencedorId] = useState<string | null>(null);

  // Confirm dialogs
  type DialogType = "encerrar" | "selecionar" | "gerar" | null;
  const [dialog, setDialog] = useState<DialogType>(null);
  const [pendingVencedorId, setPendingVencedorId] = useState<string | null>(null);

  const recebidas = propostas.filter((p) => p.status === "recebida");
  const handleSalvarProposta = (id: string, dados: Partial<Proposta>) => setPropostas((c) => c.map((p) => (p.fornecedorId === id ? { ...p, ...dados } : p)));

  const propostasRankeadas = [...recebidas].sort((a, b) => (a.precoUnitario! + a.frete!) - (b.precoUnitario! + b.frete!));
  const melhorProposta = propostasRankeadas[0];
  const totalQtd = RFQ_DATA.itens.reduce((s, i) => s + i.qtd, 0);
  const vencedor = propostas.find((p) => p.fornecedorId === vencedorId);
  const pendingVencedor = propostas.find((p) => p.fornecedorId === pendingVencedorId);
  const { toast } = useToast();

  const Header = () => (
    <>
      {/* Confirm — Encerrar coleta */}
      <ConfirmDialog
        open={dialog === "encerrar"}
        variant="warning"
        icon="alert-triangle"
        title="Encerrar coleta de propostas?"
        message={`${recebidas.length} de ${propostas.length} propostas foram registradas. Após encerrar, não será possível adicionar novas respostas.`}
        confirmLabel="Encerrar e analisar"
        onConfirm={() => {
          setEstagio("analise");
          setDialog(null);
          toast({
            variant: "warning",
            title: "Coleta encerrada",
            message: `${recebidas.length} proposta${recebidas.length !== 1 ? "s" : ""} recebida${recebidas.length !== 1 ? "s" : ""}. Agora você pode analisar e selecionar o vencedor.`,
          });
        }}
        onCancel={() => setDialog(null)}
      />

      {/* Confirm — Selecionar vencedor */}
      <ConfirmDialog
        open={dialog === "selecionar"}
        variant="success"
        icon="trophy-01"
        title="Selecionar este fornecedor como vencedor?"
        message={
          pendingVencedor
            ? <><strong>{pendingVencedor.nome}</strong> será declarado vencedor desta RFQ. Um Pedido de Compra será gerado em seguida.</>
            : "Confirmar seleção do vencedor."
        }
        confirmLabel="Confirmar seleção"
        onConfirm={() => {
          setVencedorId(pendingVencedorId);
          setEstagio("aprovacao");
          setDialog(null);
          toast({
            variant: "success",
            title: "Fornecedor selecionado!",
            message: `${pendingVencedor?.nome ?? "Fornecedor"} foi declarado vencedor desta RFQ.`,
          });
        }}
        onCancel={() => { setPendingVencedorId(null); setDialog(null); }}
      />

      {/* Confirm — Gerar Pedido de Compra */}
      <ConfirmDialog
        open={dialog === "gerar"}
        variant="info"
        icon="file-check-02"
        title="Emitir Pedido de Compra?"
        message={
          vencedor
            ? <>O PO será emitido para <strong>{vencedor.nome}</strong> no valor total de <strong>{formatCurrency(((vencedor.precoUnitario ?? 0) + (vencedor.frete ?? 0)) * totalQtd)}</strong>. Esta ação é definitiva.</>
            : "Confirmar emissão do Pedido de Compra."
        }
        confirmLabel="Emitir Pedido de Compra"
        onConfirm={() => {
          setDialog(null);
          toast({
            variant: "success",
            title: "Pedido de Compra emitido!",
            message: `PO gerado para ${vencedor?.nome ?? "fornecedor"}. Valor: ${formatCurrency(((vencedor?.precoUnitario ?? 0) + (vencedor?.frete ?? 0)) * totalQtd)}.`,
            duration: 6000,
          });
          const params = new URLSearchParams({
            fornecedor: vencedor?.nome ?? "",
            cnpj: vencedor?.cnpj ?? "",
            precoUnit: String(vencedor?.precoUnitario ?? 0),
            frete: String(vencedor?.frete ?? 0),
            prazo: String(vencedor?.prazoEntrega ?? 0),
            pagamento: vencedor?.condicaoPagamento ?? "",
            qtdTotal: String(totalQtd),
            rfq: RFQ_DATA.id,
            origem: RFQ_DATA.origem,
          });
          router.push(`/compras/pedidos/PED-NOVO?${params.toString()}`);
        }}
        onCancel={() => setDialog(null)}
      />

      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div className={styles.headerTitles}>
          <span className={styles.eyebrow}>Compras externas</span>
          <div className={styles.titleRow}>
            <h1>{RFQ_DATA.id}</h1>
            <Badge variant={estagio === "aprovacao" ? "warning" : estagio === "analise" ? "primary" : "success"}>
              {estagio === "proposta" ? "Aguardando propostas" : estagio === "analise" ? "Em analise" : "Em aprovacao"}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>{RFQ_DATA.titulo}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" className={styles.scopeBtn}>
            <Icon name="file-04" /> Ver escopo e anexos
          </Button>
        </div>
      </div>

      <div className={styles.estagioPista}>
        <div className={`${styles.estsgioItem} ${estagio === "proposta" ? styles.estsgioAtivo : styles.estagioConcluido}`}>
          <div className={styles.estsgioIcone}>{estagio === "proposta" ? "1" : <Icon name="check" size={16} />}</div>
          <div>
            <strong>Coleta de propostas</strong>
            <span>{recebidas.length} de {propostas.length} recebidas</span>
          </div>
        </div>
        <div className={`${styles.estagioConetor} ${estagio !== "proposta" ? styles.estsgioConectorAtivo : ""}`} />
        <div className={`${styles.estsgioItem} ${estagio === "analise" ? styles.estsgioAtivo : (estagio === "aprovacao" ? styles.estagioConcluido : styles.estsgioInativo)}`}>
          <div className={styles.estsgioIcone}>{estagio === "aprovacao" ? <Icon name="check" size={16} /> : "2"}</div>
          <div>
            <strong>Analise e comparativo</strong>
            <span>Equalizacao comercial</span>
          </div>
        </div>
        <div className={`${styles.estagioConetor} ${estagio === "aprovacao" ? styles.estsgioConectorAtivo : ""}`} />
        <div className={`${styles.estsgioItem} ${estagio === "aprovacao" ? styles.estsgioAtivo : styles.estsgioInativo}`}>
          <div className={styles.estsgioIcone}>3</div>
          <div>
            <strong>Aprovacao e PO</strong>
            <span>Geracao do pedido</span>
          </div>
        </div>
      </div>
    </>
  );

  if (estagio === "proposta") {
    return (
      <div className={styles.detailContainer}>
        <Header />

        <div className={styles.coletaHeader}>
          <h2 className={styles.coletaTitulo}>Fornecedores Convidados</h2>
          {recebidas.length > 0 && (
            <Button variant="primary" onClick={() => setDialog("encerrar")}>
              Encerrar coleta e ir para análise
            </Button>
          )}
        </div>

        <div className={styles.propostasList}>
          {propostas.map((p) => <PropostaCard key={p.fornecedorId} proposta={p} isWinner={false} onSalvar={handleSalvarProposta} />)}
        </div>
      </div>
    );
  }

  if (estagio === "analise") {
    return (
      <div className={styles.detailContainer}>
        <Header />

        <div className={styles.rfqMetricsGrid}>
          <Card noPadding className={`${styles.metricCard} ${styles.darkCard}`}>
            <div className={styles.darkCardContent}>
              <div className={styles.metricTop}><span>Menor custo equalizado</span><Icon name="trend-up-01" /></div>
              <h3>{formatCurrency(melhorProposta.precoUnitario! + melhorProposta.frete!)}/un</h3>
              <span className={styles.subTextDark}>{melhorProposta.nome}</span>
            </div>
          </Card>
          <Card className={styles.metricCard}>
            <span className={styles.label}>Menor preco unitario</span>
            <h3 className={styles.textPrimary}>{formatCurrency(Math.min(...recebidas.map((p) => p.precoUnitario!)))}</h3>
            <span className={styles.sub}>{propostasRankeadas[0]?.nome}</span>
          </Card>
          <Card className={styles.metricCard}>
            <span className={styles.label}>Media das propostas</span>
            <h3>{formatCurrency(recebidas.reduce((s, p) => s + p.precoUnitario!, 0) / recebidas.length)}</h3>
            <span className={styles.sub}>Base: {recebidas.length} propostas</span>
          </Card>
          <Card className={styles.metricCard}>
            <span className={styles.label}>Melhor prazo</span>
            <h3>{Math.min(...recebidas.map((p) => p.prazoEntrega!))} dia(s)</h3>
            <span className={styles.sub}>{recebidas.find((p) => p.prazoEntrega === Math.min(...recebidas.map((x) => x.prazoEntrega!)))?.nome}</span>
          </Card>
        </div>

        <Card noPadding className={styles.compareCard}>
          <div className={styles.cardHeaderFlex}>
            <div>
              <h4>Matriz de Equalizacao Comercial</h4>
              <p>Valores consolidados para tomada de decisao.</p>
            </div>
            <button className={styles.btnVoltarColeta} onClick={() => setEstagio("proposta")}><Icon name="arrow-left" size={15} /> Voltar e editar propostas</button>
          </div>

          <div className={styles.compareTableWrapper}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th className={styles.rowHeader}>Criterio</th>
                  {propostasRankeadas.map((p, i) => (
                    <th key={p.fornecedorId} className={i === 0 ? styles.winnerHeaderCol : ""}>
                      {i === 0 && <div className={styles.winnerBadgeTip}>MELHOR OPCAO</div>}
                      {p.nome.split(" ").slice(0, 2).join(" ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.rowHeader}>Preco Unitario Liquido</td>
                  {propostasRankeadas.map((p, i) => <td key={p.fornecedorId} className={i === 0 ? styles.winnerCellSuccess : styles.mutedCellText}>{formatCurrency(p.precoUnitario!)}</td>)}
                </tr>
                <tr>
                  <td className={styles.rowHeader}>Custo de Frete (unit)</td>
                  {propostasRankeadas.map((p, i) => <td key={p.fornecedorId} className={i === 0 ? styles.winnerCellSuccess : styles.mutedCellText}>{formatCurrency(p.frete!)}</td>)}
                </tr>
                <tr>
                  <td className={styles.rowHeader}>Prazo de Entrega</td>
                  {propostasRankeadas.map((p, i) => <td key={p.fornecedorId} className={i === 0 ? styles.winnerCellSuccess : styles.mutedCellText}>{p.prazoEntrega} dia(s)</td>)}
                </tr>
                <tr>
                  <td className={styles.rowHeader}>Condicao de Pagamento</td>
                  {propostasRankeadas.map((p, i) => <td key={p.fornecedorId} className={i === 0 ? styles.winnerCellNormal : styles.mutedCellText}>{p.condicaoPagamento}</td>)}
                </tr>
                <tr className={styles.totalRow}>
                  <td className={styles.rowHeaderTotal}>Custo Total Equalizado</td>
                  {propostasRankeadas.map((p, i) => <td key={p.fornecedorId} className={i === 0 ? styles.winnerCellTotal : styles.totalMutedText}>{formatCurrency((p.precoUnitario! + p.frete!) * totalQtd)}</td>)}
                </tr>
                <tr>
                  <td className={styles.rowHeader} />
                  {propostasRankeadas.map((p, i) => (
                    <td key={p.fornecedorId} className={styles.selectCell}>
                      <button
                        className={i === 0 ? styles.btnSelecionarVencedor : styles.btnSelecionarSecundario}
                        onClick={() => {
                          setPendingVencedorId(p.fornecedorId);
                          setDialog("selecionar");
                        }}
                      >
                        {i === 0 ? <><Icon name="trophy-01" size={14} /> Selecionar vencedor</> : "Selecionar este"}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.detailContainer}>
      <Header />

      <div className={styles.aprovacaoContainer}>
        
        <div className={styles.aprovacaoBanner}>
          <div className={styles.aprovacaoBannerIcon}>
            <Icon name="trophy-01" />
          </div>
          <div className={styles.aprovacaoBannerText}>
            <h2>Proposta Selecionada</h2>
            <p>Revise os detalhes comerciais antes de emitir o Pedido de Compra Oficial.</p>
          </div>
        </div>

        <div className={styles.aprovacaoGrid}>
          <Card className={styles.aprovacaoBox}>
            <h3><Icon name="building-01" size={18} /> Fornecedor Vencedor</h3>
            <div className={styles.aprovacaoDataRow}>
              <span>Razao Social</span>
              <strong>{vencedor?.nome}</strong>
            </div>
            <div className={styles.aprovacaoDataRow}>
              <span>CNPJ</span>
              <strong>{vencedor?.cnpj}</strong>
            </div>
          </Card>

          <Card className={styles.aprovacaoBox}>
            <h3><Icon name="file-04" size={18} /> Condicoes Comerciais</h3>
            <div className={styles.aprovacaoDataRow}>
              <span>Prazo de Entrega</span>
              <strong>{vencedor?.prazoEntrega} dia(s)</strong>
            </div>
            <div className={styles.aprovacaoDataRow}>
              <span>Condicao de Pagamento</span>
              <strong>{vencedor?.condicaoPagamento}</strong>
            </div>
          </Card>

          <Card className={styles.aprovacaoBox}>
            <h3><Icon name="bank-note-01" size={18} /> Precos Acordados</h3>
            <div className={styles.aprovacaoDataRow}>
              <span>Preco Unitario Liquido</span>
              <strong>{formatCurrency(vencedor?.precoUnitario ?? 0)} / unidade</strong>
            </div>
            <div className={styles.aprovacaoDataRow}>
              <span>Custo de Frete Adicional</span>
              <strong>{formatCurrency(vencedor?.frete ?? 0)} / unidade</strong>
            </div>
          </Card>
        </div>

        <div className={styles.aprovacaoTotalHighlight}>
          <div className={styles.aprovacaoTotalLeft}>
            <span>Valor Total Equalizado do Pedido</span>
            <p>Ja contemplando impostos, taxas e frete incidentes</p>
          </div>
          <div className={styles.aprovacaoTotalValue}>
            {formatCurrency(((vencedor?.precoUnitario ?? 0) + (vencedor?.frete ?? 0)) * totalQtd)}
          </div>
        </div>

        <div className={styles.aprovacaoFooter}>
          <button className={styles.btnVoltarAnalise} onClick={() => setEstagio("analise")}>
            <Icon name="arrow-left" size={15} /> Voltar para Matriz
          </button>
          <Button
            variant="primary"
            className={styles.btnGerarPO}
            onClick={() => setDialog("gerar")}
          >
            Gerar Pedido de Compra <Icon name="arrow-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}
