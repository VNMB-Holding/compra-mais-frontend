"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading, Skeleton, CardSkeleton } from "@/components/ui";

import { useToast } from "@/contexts/ToastContext";
import styles from "./rfq-detail.module.css";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
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
  deliveryTime?: number;
  paymentTerms?: string;
  notes?: string;
}

function mapPropostas(rfq: Rfq): LocalProposal[] {
  const mapBySupplier = new Map<string, LocalProposal>();

  (rfq.rfqSuppliers ?? []).forEach((rs) => {
    if (rs.supplierId) {
      mapBySupplier.set(rs.supplierId, {
        supplierId: rs.supplierId,
        supplierName: rs.supplier?.tradeName || rs.supplier?.corporateName || "Razão Social não informada",
        cnpj: rs.supplier?.cnpj || "—",
        status: "awaiting",
      });
    }
  });

  (rfq.proposals ?? []).forEach((p) => {
    if (p.supplierId) {
      const existing = mapBySupplier.get(p.supplierId);
      const unitPrice = (p.items && p.items.length > 0)
        ? p.items[0].unitPrice
        : (p.totalValue ?? 0);
      const freight = (p.items && p.items.length > 0)
        ? (p.items[0].freightCost ?? (p as any).freightCost ?? (p as any).shippingCost ?? 0)
        : ((p as any).freightCost ?? (p as any).shippingCost ?? 0);

      const isDeclined = p.status === "Declined";
      const isDraftWithoutPrice = p.status === "Draft" && Number(unitPrice) === 0;
      const status: LocalProposal["status"] = isDeclined
        ? "declined"
        : isDraftWithoutPrice
        ? "awaiting"
        : "received";

      mapBySupplier.set(p.supplierId, {
        supplierId: p.supplierId,
        proposalId: p.id,
        supplierName: p.supplier?.tradeName || p.supplier?.corporateName || existing?.supplierName || "Razão Social não informada",
        cnpj: p.supplier?.cnpj || existing?.cnpj || "—",
        status,
        unitPrice: Number(unitPrice),
        freightCost: Number(freight),
        deliveryTime: p.deliveryTime ?? 0,
        paymentTerms: p.paymentTerms || "Não informada",
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
  onSalvar,
}: {
  proposta: LocalProposal;
  isWinner: boolean;
  totalQtd: number;
  onSalvar: (id: string, dados: Partial<LocalProposal>) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [draft, setDraft] = useState({
    unitPrice: proposta.unitPrice ?? 0,
    freightCost: proposta.freightCost ?? 0,
    deliveryTime: proposta.deliveryTime ?? 0,
    paymentTerms: proposta.paymentTerms || "",
  });

  useEffect(() => {
    setDraft({
      unitPrice: proposta.unitPrice ?? 0,
      freightCost: proposta.freightCost ?? 0,
      deliveryTime: proposta.deliveryTime ?? 0,
      paymentTerms: proposta.paymentTerms || "",
    });
  }, [proposta.unitPrice, proposta.freightCost, proposta.deliveryTime, proposta.paymentTerms]);

  const handleSalvar = () => {
    onSalvar(proposta.supplierId, { ...draft, status: "received" });
    setAberto(false);
  };

  const totalEqualizado = (draft.unitPrice + draft.freightCost) * (totalQtd || 1);

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
            <span className={styles.badgeAguardando} style={{ background: "#fee2e2", color: "#991b1b" }}>
              <Icon name="x-close" size={13} /> Declinada
            </span>
          )}
          {proposta.status === "received" && !aberto && (
            <div className={styles.propostaSumario}>
              <span className={styles.propostaPreco}>
                {formatCurrency(proposta.unitPrice!)} / un
              </span>
              <span className={styles.propostaPrazo}>
                {proposta.deliveryTime} dia(s) · {proposta.paymentTerms}
              </span>
            </div>
          )}

          <div className={styles.propostaActions}>
            {proposta.status === "awaiting" && (
              <button className={styles.btnRegistrar} onClick={() => setAberto(!aberto)}>
                <Icon name="plus" size={15} /> Registrar proposta
              </button>
            )}
            {proposta.status === "received" && (
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
              <label>Preço unitário líquido (R$)</label>
              <input
                type="number"
                step="0.01"
                className={styles.propostaInput}
                value={draft.unitPrice}
                onChange={(e) => setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) }))}
              />
            </div>
            <div className={styles.propostaField}>
              <label>Custo de frete unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                className={styles.propostaInput}
                value={draft.freightCost}
                onChange={(e) => setDraft((d) => ({ ...d, freightCost: Number(e.target.value) }))}
              />
            </div>
            <div className={styles.propostaField}>
              <label>Prazo de entrega (dias)</label>
              <input
                type="number"
                className={styles.propostaInput}
                value={draft.deliveryTime}
                onChange={(e) => setDraft((d) => ({ ...d, deliveryTime: Number(e.target.value) }))}
              />
            </div>
            <div className={styles.propostaField}>
              <label>Condição de pagamento</label>
              <input
                className={styles.propostaInput}
                value={draft.paymentTerms}
                onChange={(e) => setDraft((d) => ({ ...d, paymentTerms: e.target.value }))}
              />
            </div>
          </div>

          {draft.unitPrice > 0 && (
            <div className={styles.propostaTotalPreview}>
              <span>Custo total equalizado estimado:</span>
              <strong>{formatCurrency(totalEqualizado)}</strong>
            </div>
          )}

          <div className={styles.propostaFormActions}>
            <button className={styles.btnCancelarForm} onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button className={styles.btnSalvarProposta} onClick={handleSalvar}>
              <Icon name="save-01" size={15} /> Salvar proposta
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

  type DialogType = "encerrar" | "selecionar" | "gerar" | null;
  const [dialog, setDialog] = useState<DialogType>(null);
  const [pendingVencedorId, setPendingVencedorId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await rfqsApi.getById(rfqId);
        setRfq(data);
        setPropostas(mapPropostas(data));
        setStage(getStage(data));
        const winner = (data.proposals ?? []).find((p) => p.isWinner);
        if (winner) setVencedorId(winner.supplierId);
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
  const handleSalvarProposta = async (id: string, dados: Partial<LocalProposal>) => {
    setPropostas((c) => c.map((p) => (p.supplierId === id ? { ...p, ...dados } : p)));
    if (dados.unitPrice) {
      try {
        const propostaCriada = await rfqsApi.createProposal(rfqId, {
          supplierId: id,
          unitPrice: Number(dados.unitPrice) || 0,
          freightCost: Number(dados.freightCost) || 0,
          paymentTerms: dados.paymentTerms || "30 dias DDL",
          deliveryTime: Number(dados.deliveryTime) || 5,
        });
        // Armazena o propostaId real retornado pela API no estado local
        if (propostaCriada?.id) {
          setPropostas((c) =>
            c.map((p) =>
              p.supplierId === id ? { ...p, proposalId: propostaCriada.id } : p
            )
          );
        }
        toast({ variant: "success", title: "Proposta salva!", message: "A proposta comercial foi salva no servidor com sucesso." });
      } catch (err) {
        logError("rfqs/[id]/createProposal", err);
      }
    }
  };


  const propostasRankeadas = [...recebidas].sort(
    (a, b) => ((a.unitPrice || 0) + (a.freightCost || 0)) - ((b.unitPrice || 0) + (b.freightCost || 0))
  );
  const melhorProposta = propostasRankeadas[0] || null;

  const rawQtd =
    rfq?.purchaseRequest?.items?.reduce(
      (s: number, i: { quantity: number }) => s + Number(i.quantity || 0),
      0
    ) ?? 0;
  const totalQtd = rawQtd > 0 ? rawQtd : 1;

  const vencedor = propostas.find((p) => p.supplierId === vencedorId);
  const pendingVencedor = propostas.find((p) => p.supplierId === pendingVencedorId);

  const rfqTitle = rfq?.title || rfq?.purchaseRequest?.description || "—";
  const rfqCode = rfq?.code || rfqId;
  const originCode = rfq?.purchaseRequest?.code || "—";
  const closesAt = rfq?.closesAt
    ? new Date(rfq.closesAt).toLocaleDateString("pt-BR")
    : "—";

  const badgeVariant =
    stage === "approval" ? "warning" : stage === "analysis" ? "primary" : "success";
  const badgeLabel =
    stage === "proposal"
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
            try {
              let propostaIdParaEnviar = propostas.find(
                (p) => p.supplierId === pendingVencedorId
              )?.proposalId;

              // Se a proposta ainda não tiver id cadastrado no backend, cria automaticamente
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
                toast({ variant: "error", title: "Proposta não encontrada", message: "Não foi possível registrar a proposta para este fornecedor." });
                setDialog(null);
                return;
              }

              await rfqsApi.selectWinner(rfqId, propostaIdParaEnviar);

              // Atualiza os dados completos da RFQ vindos do servidor
              const updated = await rfqsApi.getById(rfqId);
              setRfq(updated);
              setPropostas(mapPropostas(updated));
              setVencedorId(pendingVencedorId);
              setStage(getStage(updated));

              toast({
                variant: "success",
                title: "Fornecedor selecionado!",
                message: `${pendingVencedor?.supplierName ?? "Fornecedor"} foi declarado vencedor desta RFQ no servidor.`,
              });
            } catch (e) {
              logError("rfqs/[id]/selectWinner", e);
              toast({ variant: "error", title: "Erro ao selecionar vencedor", message: getErrorMessage(e) });
            } finally {
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
        message={
          vencedor ? (
            <>
              O PO será emitido para <strong>{vencedor.supplierName}</strong> no valor total de{" "}
              <strong>
                {formatCurrency(((vencedor.unitPrice ?? 0) + (vencedor.freightCost ?? 0)) * totalQtd)}
              </strong>
              . Esta ação é definitiva.
            </>
          ) : (
            "Confirmar emissão do Pedido de Compra."
          )
        }
        confirmLabel="Emitir Pedido de Compra"
        onConfirm={async () => {
          try {
            const po = await rfqsApi.createPo(rfqId);
            toast({
              variant: "success",
              title: "Pedido de Compra emitido com sucesso!",
              message: `PO ${(po as any)?.code || ""} gerado para ${vencedor?.supplierName ?? "fornecedor"}.`,
              duration: 6000,
            });
            router.push(`/compras/pedidos`);
          } catch (e) {
            logError("rfqs/[id]/createPo", e);
            toast({ variant: "error", title: "Erro ao emitir Pedido", message: getErrorMessage(e) });
          } finally {
            setDialog(null);
          }
        }}
        onCancel={() => setDialog(null)}
      />

      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div className={styles.headerTitles}>
          <span className={styles.eyebrow}>
            Origem: {originCode} · Encerra em: {closesAt}
          </span>
          <div className={styles.titleRow}>
            <h1>{rfqCode}</h1>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <p className={styles.subtitleLarge}>{rfqTitle}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" className={styles.scopeBtn}>
            <Icon name="file-04" /> Ver escopo e anexos
          </Button>
        </div>
      </div>

      
      <div className={styles.estagioPista}>
        <div
          className={`${styles.estsgioItem} ${
            stage === "proposal" ? styles.estsgioAtivo : styles.estagioConcluido
          }`}
        >
          <div className={styles.estsgioIcone}>
            {stage === "proposal" ? "1" : <Icon name="check" size={16} />}
          </div>
          <div>
            <strong>Coleta de propostas</strong>
            <span>
              {recebidas.length} de {propostas.length} recebidas
            </span>
          </div>
        </div>
        <div
          className={`${styles.estagioConetor} ${
            stage !== "proposal" ? styles.estsgioConectorAtivo : ""
          }`}
        />
        <div
          className={`${styles.estsgioItem} ${
            stage === "analysis"
              ? styles.estsgioAtivo
              : stage === "approval"
              ? styles.estagioConcluido
              : styles.estsgioInativo
          }`}
        >
          <div className={styles.estsgioIcone}>
            {stage === "approval" ? <Icon name="check" size={16} /> : "2"}
          </div>
          <div>
            <strong>Análise e comparativo</strong>
            <span>Equalização comercial</span>
          </div>
        </div>
        <div
          className={`${styles.estagioConetor} ${
            stage === "approval" ? styles.estsgioConectorAtivo : ""
          }`}
        />
        <div
          className={`${styles.estsgioItem} ${
            stage === "approval" ? styles.estsgioAtivo : styles.estsgioInativo
          }`}
        >
          <div className={styles.estsgioIcone}>3</div>
          <div>
            <strong>Aprovação e PO</strong>
            <span>Geração do pedido</span>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
          <Icon name="chevron-left" /> Voltar para Cotações
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
          <div style={{ padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
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

        
        {rfq?.purchaseRequest?.items && rfq.purchaseRequest.items.length > 0 && (
          <Card className={styles.flowCard} style={{ marginBottom: 20 }}>
            <h4>Itens solicitados ({rfq.purchaseRequest.items.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {rfq.purchaseRequest.items.map((item: any) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{item.description}</strong>
                  <span style={{ color: "#64748b" }}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className={styles.coletaHeader}>
          <h2 className={styles.coletaTitulo}>
            Fornecedores Convidados
            {propostas.length === 0 && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "#94a3b8", marginLeft: 8 }}>
                Nenhum fornecedor convidado
              </span>
            )}
          </h2>
          {recebidas.length > 0 && (
            <Button variant="primary" onClick={() => setDialog("encerrar")}>
              Encerrar coleta e ir para análise
            </Button>
          )}
        </div>

        <div className={styles.propostasList}>
          {propostas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
              <Icon name="users-01" size={40} />
              <p style={{ marginTop: 12, fontSize: 14 }}>Nenhum fornecedor foi convidado para esta RFQ.</p>
            </div>
          ) : (
            propostas.map((p) => (
              <PropostaCard
                key={p.supplierId}
                proposta={p}
                isWinner={false}
                totalQtd={totalQtd}
                onSalvar={handleSalvarProposta}
              />
            ))
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
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
            <Icon name="file-search-02" size={40} />
            <p style={{ marginTop: 12 }}>Nenhuma proposta recebida para comparar.</p>
            <Button variant="secondary" style={{ marginTop: 16 }} onClick={() => setStage("proposal")}>
              Voltar para coleta
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.rfqMetricsGrid}>
              <Card noPadding className={`${styles.metricCard} ${styles.darkCard}`}>
                <div className={styles.darkCardContent}>
                  <div className={styles.metricTop}>
                    <span>Menor custo equalizado</span>
                    <Icon name="trend-up-01" />
                  </div>
                  <h3>
                    {formatCurrency((melhorProposta?.unitPrice || 0) + (melhorProposta?.freightCost || 0))}/un
                  </h3>
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
                    recebidas.reduce((s, p) => s + (p.unitPrice || 0), 0) / (recebidas.length || 1)
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
                      (p) =>
                        p.deliveryTime === Math.min(...recebidas.map((x) => x.deliveryTime!))
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
                      <td className={styles.rowHeader}>Custo de Frete (unit)</td>
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
                    <tr className={styles.totalRow}>
                      <td className={styles.rowHeaderTotal}>Custo Total Equalizado</td>
                      {propostasRankeadas.map((p, i) => (
                        <td
                          key={p.supplierId}
                          className={i === 0 ? styles.winnerCellTotal : styles.totalMutedText}
                        >
                          {formatCurrency((p.unitPrice! + p.freightCost!) * totalQtd)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className={styles.rowHeader} />
                      {propostasRankeadas.map((p, i) => (
                        <td key={p.supplierId} className={styles.selectCell}>
                          <button
                            className={
                              i === 0 ? styles.btnSelecionarVencedor : styles.btnSelecionarSecundario
                            }
                            onClick={() => {
                              setPendingVencedorId(p.supplierId);
                              setDialog("selecionar");
                            }}
                          >
                            {i === 0 ? (
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
              <strong>{formatCurrency(vencedor?.freightCost ?? 0)} / unidade</strong>
            </div>
          </Card>
        </div>

        <div className={styles.aprovacaoTotalHighlight}>
          <div className={styles.aprovacaoTotalLeft}>
            <span>Valor Total Equalizado do Pedido</span>
            <p>Já contemplando impostos, taxas e frete incidentes</p>
          </div>
          <div className={styles.aprovacaoTotalValue}>
            {formatCurrency(
              ((vencedor?.unitPrice ?? 0) + (vencedor?.freightCost ?? 0)) * totalQtd
            )}
          </div>
        </div>

        <div className={styles.aprovacaoFooter}>
          <button className={styles.btnVoltarAnalise} onClick={() => setStage("analysis")}>
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
