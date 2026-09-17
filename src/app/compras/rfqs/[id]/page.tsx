"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading, Skeleton, CardSkeleton, EmptyState, Stepper } from "@/components/ui";

import { useToast } from "@/contexts/ToastContext";
import styles from "./rfq-detail.module.css";
import { rfqsApi, Rfq } from "@/lib/api/rfqs";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { useAuth } from "@/hooks/useAuth";
import { getTenantDisplayName } from "@/lib/utils/tenant";
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
  rfqCode,
  rfqTitle,
  onSalvar,
}: {
  proposta: LocalProposal;
  isWinner: boolean;
  totalQtd: number;
  rfqCode: string;
  rfqTitle: string;
  onSalvar: (id: string, dados: Partial<LocalProposal>) => void;
}) {
  const { toast } = useToast();
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

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cotacao/${rfqCode}?supId=${encodeURIComponent(proposta.supplierId)}&fornecedor=${encodeURIComponent(proposta.supplierName)}&cnpj=${encodeURIComponent(proposta.cnpj || "")}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        title: "Link Copiado!",
        message: `Link exclusivo para ${proposta.supplierName} copiado com sucesso.`,
      });
    }
  };

  const handleWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cotacao/${rfqCode}?supId=${encodeURIComponent(proposta.supplierId)}&fornecedor=${encodeURIComponent(proposta.supplierName)}&cnpj=${encodeURIComponent(proposta.cnpj || "")}`;
    const text = encodeURIComponent(
      `Olá, *${proposta.supplierName}*! Segue o link exclusivo para envio da sua proposta comercial referente à cotação *${rfqCode} - ${rfqTitle}*:\n\n${url}\n\nPor favor, preencha os preços e condições no link acima.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
            <button
              type="button"
              className={styles.btnActionIcon}
              onClick={handleCopyLink}
              title={`Copiar link exclusivo de ${proposta.supplierName}`}
            >
              <Icon name="copy-01" size={14} />
              <span>Copiar link</span>
            </button>
            <button
              type="button"
              className={styles.btnActionIcon}
              onClick={handleWhatsApp}
              title={`Enviar pelo WhatsApp para ${proposta.supplierName}`}
            >
              <Icon name="message-square-02" size={14} />
              <span>WhatsApp</span>
            </button>
            {proposta.status === "awaiting" && (
              <button className={styles.btnRegistrar} onClick={() => setAberto(!aberto)}>
                <Icon name="plus" size={14} /> Registrar proposta
              </button>
            )}
            {proposta.status === "received" && (
              <button className={styles.btnEditar} onClick={() => setAberto(!aberto)}>
                <Icon name="edit-01" size={14} /> {aberto ? "Fechar" : "Editar"}
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
  const [generatedPo, setGeneratedPo] = useState<{ id: string; code: string } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [creatingPo, setCreatingPo] = useState(false);


  const handlePublishRfq = async () => {
    try {
      setPublishing(true);
      await rfqsApi.updateStatus(rfqId, "Open");
      const updated = await rfqsApi.getById(rfqId);
      setRfq(updated);
      setPropostas(mapPropostas(updated));
      setStage(getStage(updated));
      toast({
        variant: "success",
        title: "Cotação publicada com sucesso!",
        message: "A cotação agora está aberta no mercado e os fornecedores podem enviar propostas.",
      });
    } catch (e) {
      logError("rfqs/[id]/publish", e);
      toast({
        variant: "error",
        title: "Erro ao publicar cotação",
        message: getErrorMessage(e),
      });
    } finally {
      setPublishing(false);
    }
  };


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

        // Verifica se já existe um Pedido de Compra (PO) gerado
        try {
          const orders = await purchaseOrdersApi.list();
          const match = orders.find(
            (o: any) =>
              (winner && o.winningProposalId === winner.id) ||
              (o.notes && (o.notes.includes(data.code) || o.notes.includes(data.id))) ||
              ((data.status === "Finished" || data.status === "Closed") && winner && o.supplierId === winner.supplierId)
          );
          if (match) {
            setGeneratedPo({ id: match.id, code: match.code });
          }
        } catch {
          // fallback silencioso
        }
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
  const companyName = getTenantDisplayName(rfq?.tenantId || rfq?.purchaseRequest?.tenantId, user);

  const isFinished = rfq?.status === "Finished" || rfq?.status === "Closed" || !!generatedPo;
  const isDraft = rfq?.status === "Draft";
  const badgeVariant: "primary" | "danger" | "gray" | "dark" | "success" | "warning" =
    isDraft
      ? "gray"
      : isFinished
      ? "success"
      : stage === "approval"
      ? "warning"
      : stage === "analysis"
      ? "primary"
      : "success";
  const badgeLabel =
    isDraft
      ? "Rascunho"
      : isFinished
      ? "Pedido Emitido"
      : stage === "proposal"
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
        loading={creatingPo}
        loadingConfirmLabel="Emitindo Pedido..."
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
          setCreatingPo(true);
          try {
            const po = await rfqsApi.createPo(rfqId);
            const poObj = po as any;
            const createdCode = poObj?.code || "PO Gerado";
            const createdId = poObj?.id || poObj?.code || "";
            if (createdId) {
              setGeneratedPo({ id: createdId, code: createdCode });
            }
            setRfq((prev) => prev ? { ...prev, status: "Finished" } : null);
            toast({
              variant: "success",
              title: "Pedido de Compra emitido com sucesso!",
              message: `PO ${createdCode} gerado para ${vencedor?.supplierName ?? "fornecedor"}.`,
              duration: 6000,
            });
            setDialog(null);
          } catch (e) {
            logError("rfqs/[id]/createPo", e);
            toast({ variant: "error", title: "Erro ao emitir Pedido", message: getErrorMessage(e) });
          } finally {
            setCreatingPo(false);
          }
        }}
        onCancel={() => setDialog(null)}
      />


      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{rfqCode}</h1>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <p className={styles.subtitleLarge}>{rfqTitle}</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}>
              <Icon name="building-01" /> {companyName}
            </span>
            <span className={styles.infoTag}>
              <Icon name="file-01" /> Demanda: {originCode}
            </span>
            <span className={styles.infoTag}>
              <Icon name="clock" /> Encerra em: {closesAt}
            </span>
            <span className={styles.infoTag}>
              <Icon name="users-01" /> {recebidas.length} de {propostas.length} Propostas Recebidas
            </span>
          </div>
        </div>
        {isDraft && (
          <div className={styles.headerActions}>
            <Button
              variant="primary"
              onClick={handlePublishRfq}
              disabled={publishing}
              loading={publishing}
              loadingText="Publicando..."
            >
              <Icon name="send-01" /> Publicar Cotação no Mercado
            </Button>

          </div>
        )}
      </div>

      
      <Card className={styles.stepperCard}>
        <Stepper
          steps={[
            {
              label: "Coleta de propostas",
              description: `${recebidas.length} de ${propostas.length} recebidas`,
              status: stage === "proposal" ? "active" : "completed",
            },
            {
              label: "Análise e comparativo",
              description: "Equalização comercial",
              status: stage === "analysis" ? "active" : stage === "approval" ? "completed" : "pending",
            },
            {
              label: "Aprovação e PO",
              description: "Geração do pedido",
              status: stage === "approval" ? "active" : "pending",
            },
          ]}
        />
      </Card>
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

        <div className={styles.coletaHeader}>
          <h2 className={styles.coletaTitulo}>
            Fornecedores Convocados & Propostas
            {propostas.length === 0 && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "#94a3b8", marginLeft: 8 }}>
                Aguardando envio de propostas
              </span>
            )}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {recebidas.length > 0 && (
              <Button variant="primary" onClick={() => setDialog("encerrar")}>
                Encerrar coleta e ir para análise
              </Button>
            )}
          </div>
        </div>

        <div className={styles.propostasList}>
          {propostas.length === 0 ? (
            <EmptyState
              illustration="no-suppliers"
              title="Nenhum fornecedor convidado"
              description="Convide fornecedores parceiros para enviarem suas propostas e cotações para esta demanda."
              size="sm"
            />
          ) : (
            propostas.map((p) => (
              <PropostaCard
                key={p.supplierId}
                proposta={p}
                isWinner={false}
                totalQtd={totalQtd}
                rfqCode={rfqCode}
                rfqTitle={rfqTitle}
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
          <EmptyState
            illustration="mailbox-empty"
            title="Nenhuma proposta recebida"
            description="Ainda não há cotações enviadas pelos fornecedores para gerar o mapa comparativo."
            action={{
              label: "Voltar para coleta",
              variant: "secondary",
              onClick: () => setStage("proposal"),
            }}
            size="sm"
          />
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
        {generatedPo && (
          <div style={{
            background: "#f0fdf9",
            border: "1px solid #99f6e4",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#007d79",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon name="file-check-02" size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#004144" }}>
                    Pedido de Compra Oficial Emitido
                  </h3>
                  <Badge variant="success">Gerado</Badge>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#0f766e" }}>
                  Ordem de Compra oficial: <strong>{generatedPo.code}</strong> vinculada a esta cotação. O ciclo de contratação foi formalizado.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/compras/pedidos/${generatedPo.id || generatedPo.code}`)}
            >
              Ir para o Pedido de Compra <Icon name="arrow-right" />
            </Button>
          </div>
        )}

        <div className={styles.aprovacaoBanner}>
          <div className={styles.aprovacaoBannerIcon}>
            <Icon name="trophy-01" />
          </div>
          <div className={styles.aprovacaoBannerText}>
            <h2>{generatedPo ? "Cotação Finalizada & Homologada" : "Proposta Selecionada"}</h2>
            <p>
              {generatedPo
                ? `O processo foi encerrado com sucesso e o Pedido Oficial ${generatedPo.code} foi gerado.`
                : "Revise os detalhes comerciais antes de emitir o Pedido de Compra Oficial."}
            </p>
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
          {generatedPo ? (
            <Button
              variant="primary"
              className={styles.btnGerarPO}
              onClick={() => router.push(`/compras/pedidos/${generatedPo.id || generatedPo.code}`)}
            >
              Ir para o Pedido {generatedPo.code} <Icon name="arrow-right" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className={styles.btnGerarPO}
              onClick={() => setDialog("gerar")}
            >
              Gerar Pedido de Compra <Icon name="arrow-right" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
