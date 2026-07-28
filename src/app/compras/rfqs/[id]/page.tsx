"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./rfq-detail.module.css";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------
type Estagio = "proposta" | "analise" | "aprovacao";
type PropostaStatus = "aguardando" | "recebida" | "declinada";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ---------------------------------------------------------------------------
// Component: Proposta Card 
// ---------------------------------------------------------------------------
function PropostaCard({
  proposal,
  rfqItems,
  isWinner,
  onSalvar,
}: {
  proposal: any;
  rfqItems: any[];
  isWinner: boolean;
  onSalvar: (id: string, dados: any) => void;
}) {
  const [aberto, setAberto] = useState(false);
  
  // Try to read from items or fallback
  const firstItem = proposal.items?.[0];
  const [draft, setDraft] = useState({
    precoUnitario: firstItem?.unitPrice ? Number(firstItem.unitPrice) : 0,
    frete: firstItem?.freightCost ? Number(firstItem.freightCost) : 0,
    prazoEntrega: proposal.deliveryTime ?? 1,
    condicaoPagamento: proposal.paymentTerms ?? "30 dias DDL",
  });

  const handleSalvar = () => {
    onSalvar(proposal.id, { ...draft, status: "Submitted" });
    setAberto(false);
  };

  const totalQtd = rfqItems?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalEqualizado = (draft.precoUnitario + draft.frete) * totalQtd;

  const statusMap = {
    Draft: "aguardando",
    Submitted: "recebida",
    Declined: "declinada"
  };
  
  const statusAguardando = proposal.status === "Draft";
  const statusRecebida = proposal.status === "Submitted";

  return (
    <div className={`${styles.propostaCard} ${statusRecebida ? styles.propostaRecebida : ""} ${isWinner ? styles.propostaVencedora : ""}`}>
      <div className={styles.propostaCardHeader}>
        <div className={styles.propostaInfo}>
          <div className={styles.propostaFornecedorNome}>
            {isWinner && (
              <span className={styles.vencedorTag}>
                <Icon name="trophy-01" size={12} /> Melhor proposta
              </span>
            )}
            <strong>{proposal.supplier?.corporateName}</strong>
          </div>
          <span className={styles.propostaCnpj}>{proposal.supplier?.cnpj}</span>
        </div>

        <div className={styles.propostaCardRight}>
          {statusAguardando && (
            <span className={styles.badgeAguardando}>
              <Icon name="clock" size={13} /> Aguardando
            </span>
          )}
          {statusRecebida && !aberto && (
            <div className={styles.propostaSumario}>
              <span className={styles.propostaPreco}>{formatCurrency(draft.precoUnitario)} / un</span>
              <span className={styles.propostaPrazo}>{draft.prazoEntrega} dia(s) - {draft.condicaoPagamento}</span>
            </div>
          )}

          <div className={styles.propostaActions}>
            {statusAguardando && (
              <button className={styles.btnRegistrar} onClick={() => setAberto(!aberto)}>
                <Icon name="plus" size={15} /> Registrar proposta
              </button>
            )}
            {statusRecebida && (
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
  const params = useParams();
  const rfqId = params.id as string;
  const { toast } = useToast();

  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(true);

  const [estagio, setEstagio] = useState<Estagio>("proposta");
  const [vencedorId, setVencedorId] = useState<string | null>(null);

  // Confirm dialogs
  type DialogType = "encerrar" | "selecionar" | "gerar" | null;
  const [dialog, setDialog] = useState<DialogType>(null);
  const [pendingVencedorId, setPendingVencedorId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRfq() {
      try {
        const data = await rfqsApi.getById(rfqId);
        setRfq(data);
        
        if (data.status === "Closed") {
           setEstagio("analise");
           const winner = data.proposals?.find(p => p.isWinner);
           if (winner) setVencedorId(winner.id);
        }
      } catch (err) {
        console.error(err);
        toast({ variant: "error", title: "Erro", message: "Não foi possível carregar a cotação." });
      } finally {
        setLoading(false);
      }
    }
    fetchRfq();
  }, [rfqId, toast]);

  if (loading) return <Loading variant="fullscreen" message="Carregando Cotação..." />;
  if (!rfq) return <div style={{padding:40}}>Cotação não encontrada.</div>;

  const propostas = rfq.proposals || [];
  const recebidas = propostas.filter((p) => p.status === "Submitted");
  
  // Temporary local mock for saving state visually
  const handleSalvarProposta = (id: string, dados: any) => {
      setRfq(prev => {
          if(!prev) return prev;
          const newProposals = prev.proposals?.map(p => {
              if (p.id === id) {
                  return { ...p, ...dados, status: "Submitted" };
              }
              return p;
          });
          return { ...prev, proposals: newProposals };
      });
  };

  const propostasRankeadas = [...recebidas].sort((a, b) => {
      const aUnit = a.items?.[0]?.unitPrice ? Number(a.items[0].unitPrice) : 0;
      const bUnit = b.items?.[0]?.unitPrice ? Number(b.items[0].unitPrice) : 0;
      return aUnit - bUnit;
  });
  const melhorProposta = propostasRankeadas[0];
  const totalQtd = rfq.purchaseRequest?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const vencedor = propostas.find((p) => p.id === vencedorId);

  const encerrarCotacao = async () => {
    try {
      await rfqsApi.updateStatus(rfqId, "Closed");
      setEstagio("analise");
      setDialog(null);
      toast({ variant: "success", title: "Cotação Encerrada", message: "Agora você pode analisar as propostas recebidas." });
    } catch(err) {
       toast({ variant: "error", title: "Erro", message: "Falha ao encerrar cotação." });
    }
  };

  const confirmarVencedor = () => {
    setVencedorId(pendingVencedorId);
    setEstagio("aprovacao");
    setDialog(null);
    toast({ variant: "success", title: "Vencedor Selecionado", message: "A proposta vencedora foi selecionada." });
  };

  const gerarPedido = () => {
    setDialog(null);
    toast({ variant: "success", title: "Pedido Gerado!", message: "Pedido emitido com sucesso." });
    setTimeout(() => {
      router.push(`/compras/pedidos/PED-NOVO?fornecedor=${encodeURIComponent(vencedor?.supplier?.corporateName || "")}`);
    }, 1000);
  };

  const subEstagios = ["proposta", "analise", "aprovacao"];
  const progressPercent = ((subEstagios.indexOf(estagio) + 1) / subEstagios.length) * 100;

  return (
    <div className={styles.pageContainer}>
      
      {/* DIALOGS */}
      <ConfirmDialog open={dialog === "encerrar"} variant="danger" icon="alert-circle" title="Encerrar recebimento de propostas?"
        message={<>Fornecedores que ainda não enviaram propostas não poderão mais enviá-las. Deseja continuar?</>}
        confirmLabel="Sim, encerrar" onConfirm={encerrarCotacao} onCancel={() => setDialog(null)} />

      <ConfirmDialog open={dialog === "selecionar"} variant="primary" icon="check-circle" title="Confirmar Vencedor?"
        message={<>Você está selecionando esta proposta como a vencedora da cotação.</>}
        confirmLabel="Confirmar" onConfirm={confirmarVencedor} onCancel={() => setDialog(null)} />

      <ConfirmDialog open={dialog === "gerar"} variant="success" icon="file-plus-02" title="Gerar Pedido de Compra?"
        message={<>O pedido de compra será gerado com base nas condições negociadas e enviado ao fornecedor para faturamento.</>}
        confirmLabel="Gerar Pedido" onConfirm={gerarPedido} onCancel={() => setDialog(null)} />

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
              <Icon name="chevron-left" /> Voltar
            </button>
            <div className={styles.titleSection}>
              <h1>{rfq.code} - {rfq.title}</h1>
              <Badge variant={estagio === "proposta" ? "warning" : estagio === "analise" ? "primary" : "success"}>
                {estagio === "proposta" ? "Recebendo Propostas" : estagio === "analise" ? "Em Análise" : "Aprovado"}
              </Badge>
            </div>
            <div className={styles.metaRow}>
              <span><Icon name="file-02" size={14}/> Sol. Origem: {rfq.purchaseRequest?.code}</span>
              <span><Icon name="user-01" size={14}/> {rfq.purchaseRequest?.description}</span>
              <span className={styles.metaHighlight}><Icon name="clock" size={14}/> Encerra em: {new Date(rfq.closesAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
             {estagio === "proposta" && (
                <Button variant="danger" onClick={() => setDialog("encerrar")}>
                  <Icon name="stop-circle" /> Encerrar Cotação
                </Button>
             )}
             {estagio === "analise" && vencedorId && (
                <Button variant="primary" onClick={() => setEstagio("aprovacao")}>
                  Avançar para Aprovação <Icon name="chevron-right" />
                </Button>
             )}
             {estagio === "aprovacao" && (
                <Button variant="success" onClick={() => setDialog("gerar")}>
                  <Icon name="file-plus-02" /> Gerar Pedido de Compra
                </Button>
             )}
          </div>
        </div>
      </div>

      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        <div className={styles.progressMarkers}>
          <div className={`${styles.marker} ${subEstagios.indexOf(estagio) >= 0 ? styles.markerActive : ""}`}>1. Propostas</div>
          <div className={`${styles.marker} ${subEstagios.indexOf(estagio) >= 1 ? styles.markerActive : ""}`}>2. Análise Comercial</div>
          <div className={`${styles.marker} ${subEstagios.indexOf(estagio) >= 2 ? styles.markerActive : ""}`}>3. Aprovação Final</div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.leftCol}>
          
          <div className={styles.sectionTitle}>
             <h3>Itens Solicitados</h3>
          </div>
          <Card className={styles.itensCard}>
            <table className={styles.itensTable}>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th style={{ textAlign: "right" }}>Quantidade</th>
                  <th style={{ textAlign: "center" }}>Un</th>
                </tr>
              </thead>
              <tbody>
                {rfq.purchaseRequest?.items?.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.description}</strong></td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>{item.quantity}</td>
                    <td style={{ textAlign: "center" }}><span className={styles.unBadge}>{item.unit}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

        </div>

        <div className={styles.rightCol}>
          <div className={styles.sectionTitleRow}>
             <h3>Propostas Comerciais</h3>
             <span className={styles.propostasCount}>{recebidas.length} de {propostas.length} recebidas</span>
          </div>

          <div className={styles.propostasList}>
            {propostas.map((prop) => (
              <PropostaCard
                key={prop.id}
                proposta={prop}
                rfqItems={rfq.purchaseRequest?.items || []}
                isWinner={vencedorId === prop.id || melhorProposta?.id === prop.id && estagio === "analise"}
                onSalvar={handleSalvarProposta}
              />
            ))}
          </div>

          {estagio === "analise" && (
            <Card className={styles.analiseCard}>
               <h4>Quadro Comparativo (Equalizado)</h4>
               <div className={styles.quadroList}>
                  {propostasRankeadas.map((p, index) => {
                    const unitPrice = p.items?.[0]?.unitPrice ? Number(p.items[0].unitPrice) : 0;
                    const freight = p.items?.[0]?.freightCost ? Number(p.items[0].freightCost) : 0;
                    const totalEq = (unitPrice + freight) * totalQtd;
                    const diff = index === 0 ? 0 : totalEq - ((propostasRankeadas[0].items?.[0]?.unitPrice! + propostasRankeadas[0].items?.[0]?.freightCost!) * totalQtd);
                    
                    return (
                      <div key={p.id} className={`${styles.quadroItem} ${vencedorId === p.id ? styles.quadroWinner : ""}`}>
                         <div className={styles.quadroMain}>
                           <div className={styles.quadroRank}>{index + 1}º</div>
                           <div>
                             <strong>{p.supplier?.corporateName}</strong>
                             <div className={styles.quadroDetails}>
                               <span>{p.deliveryTime} dias</span> • <span>{p.paymentTerms}</span>
                             </div>
                           </div>
                         </div>
                         <div className={styles.quadroRight}>
                           <strong className={styles.quadroTotal}>{formatCurrency(totalEq)}</strong>
                           {index > 0 && <span className={styles.quadroDiff}>+ {formatCurrency(diff)}</span>}
                           {vencedorId === p.id ? (
                             <Badge variant="success" icon="check">Selecionada</Badge>
                           ) : (
                             <Button variant="secondary" size="sm" onClick={() => {
                               setPendingVencedorId(p.id);
                               setDialog("selecionar");
                             }}>
                               Selecionar
                             </Button>
                           )}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </Card>
          )}

          {estagio === "aprovacao" && vencedor && (
            <Card className={styles.aprovacaoCard}>
               <div className={styles.aprovIcon}><Icon name="check-verified-01" size={32} /></div>
               <div className={styles.aprovContent}>
                 <h4>Decisão de Compra Confirmada</h4>
                 <p>
                   A proposta de <strong>{vencedor.supplier?.corporateName}</strong> foi aprovada como a melhor opção,
                   resultando em um custo equalizado de <strong>{formatCurrency(((Number(vencedor.items?.[0]?.unitPrice) || 0) + (Number(vencedor.items?.[0]?.freightCost) || 0)) * totalQtd)}</strong>.
                 </p>
               </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
