"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Loading, Stepper } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./solicitacao-detail.module.css";
import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SolicitacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reqId = params.id as string;
  const { toast } = useToast();

  const [req, setReq] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    async function loadReq() {
      try {
        const data = await purchaseRequestsApi.getById(reqId);
        setReq(data);
      } catch (err) {
        console.error(err);
        toast({ variant: "error", title: "Erro", message: "Falha ao carregar solicitação." });
      } finally {
        setLoading(false);
      }
    }
    loadReq();
  }, [reqId, toast]);

  if (loading) return <Loading variant="fullscreen" message="Carregando Solicitação..." />;
  if (!req) return <div style={{padding:40}}>Solicitação não encontrada.</div>;

  const handleApprove = async () => {
    try {
       await purchaseRequestsApi.updateStatus(reqId, "Approved");
       setReq(prev => prev ? { ...prev, status: "Approved" } : prev);
       toast({ variant: "success", title: "Aprovada", message: "A solicitação foi aprovada." });
    } catch(err) {
       toast({ variant: "error", title: "Erro", message: "Erro ao aprovar solicitação." });
    } finally {
       setDialog(null);
    }
  };

  const handleReject = async () => {
    try {
       await purchaseRequestsApi.updateStatus(reqId, "Rejected");
       setReq(prev => prev ? { ...prev, status: "Rejected" } : prev);
       toast({ variant: "success", title: "Recusada", message: "A solicitação foi recusada." });
    } catch(err) {
       toast({ variant: "error", title: "Erro", message: "Erro ao recusar solicitação." });
    } finally {
       setDialog(null);
    }
  };

  const hasRfq = req.rfqs && req.rfqs.length > 0;

  return (
    <div className={styles.pageContainer}>
      
      <ConfirmDialog open={dialog === "approve"} variant="primary" icon="check-circle" title="Aprovar Solicitação?"
        message={<>Você está aprovando esta solicitação de compra. Ela será liberada para cotação (RFQ).</>}
        confirmLabel="Aprovar" onConfirm={handleApprove} onCancel={() => setDialog(null)} />

      <ConfirmDialog open={dialog === "reject"} variant="danger" icon="x-circle" title="Recusar Solicitação?"
        message={<>A solicitação será recusada e devolvida ao solicitante original.</>}
        confirmLabel="Recusar" onConfirm={handleReject} onCancel={() => setDialog(null)} />

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
              <Icon name="chevron-left" /> Voltar
            </button>
            <div className={styles.titleSection}>
              <h1>{req.code}</h1>
              <Badge variant={req.status === "AwaitingApproval" ? "warning" : req.status === "Approved" ? "success" : req.status === "Rejected" ? "gray" : "primary"}>
                {req.status === "AwaitingApproval" ? "Aguardando Aprovação" : req.status === "Approved" ? "Aprovado" : req.status === "Rejected" ? "Recusado" : "Rascunho"}
              </Badge>
            </div>
            <p className={styles.subtitleLarge}>{req.description}</p>
          </div>
          <div className={styles.headerActions}>
             {req.status === "AwaitingApproval" && (
                <>
                  <Button variant="danger" onClick={() => setDialog("reject")}>
                    <Icon name="x-close" /> Recusar
                  </Button>
                  <Button variant="primary" onClick={() => setDialog("approve")}>
                    <Icon name="check" /> Aprovar
                  </Button>
                </>
             )}
             {req.status === "Approved" && !hasRfq && (
                <Button variant="primary" onClick={() => router.push(`/compras/rfqs/nova?solicitacao=${reqId}`)}>
                  <Icon name="file-plus-02" /> Iniciar Cotação (RFQ)
                </Button>
             )}
             {hasRfq && (
                <Button variant="secondary" onClick={() => router.push(`/compras/rfqs/${req.rfqs![0].id}`)}>
                   <Icon name="search-md" /> Ver RFQ
                </Button>
             )}
          </div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.colMain}>
          <div className={styles.infoGridGrid}>
            <Card className={styles.infoCard}>
              <div className={styles.cardIconHeader}><Icon name="user-01" size={20} /><h4>Detalhes</h4></div>
              <ul className={styles.infoList}>
                <li><span>Categoria</span><strong>{req.category}</strong></li>
                <li><span>Centro de Custo</span><strong>{req.costCenter}</strong></li>
                <li><span>Local de Entrega</span><strong>{req.deliveryLocation}</strong></li>
              </ul>
            </Card>

            <Card className={styles.infoCard}>
              <div className={styles.cardIconHeader}><Icon name="clock" size={20} /><h4>Prazos & Valores</h4></div>
              <ul className={styles.infoList}>
                <li><span>Data Limite</span><strong>{new Date(req.deadline).toLocaleDateString("pt-BR")}</strong></li>
                <li><span>Prioridade</span><strong>{req.priority}</strong></li>
                <li><span>Budget Estimado</span><strong>{formatCurrency(Number(req.estimatedBudget))}</strong></li>
              </ul>
            </Card>
          </div>
          
          <Card className={styles.infoCard} style={{ marginTop: 24 }}>
             <div className={styles.cardIconHeader}><Icon name="file-text-02" size={20} /><h4>Justificativa</h4></div>
             <p style={{ marginTop: 12, lineHeight: 1.6, color: "var(--gray-600)" }}>{req.justification}</p>
          </Card>

          <div className={styles.tableWrapper} style={{ marginTop: 24 }}>
            <div className={styles.tableHeaderSection}>
              <h4>Itens Solicitados ({req.items?.length || 0})</h4>
            </div>
            <div className={styles.scrollableTable}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Descrição</th>
                    <th style={{ textAlign: "right" }}>Qtd</th>
                    <th style={{ textAlign: "center" }}>Un</th>
                    <th style={{ textAlign: "right" }}>Pr. Unit. Est.</th>
                    <th style={{ textAlign: "right" }}>Subtotal Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {req.items?.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.description}</strong></td>
                      <td style={{ textAlign: "right", fontWeight: "600" }}>{item.quantity}</td>
                      <td style={{ textAlign: "center" }}><span className={styles.unBadge}>{item.unit}</span></td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(Number(item.estimatedUnitPrice || 0))}</td>
                      <td style={{ textAlign: "right", fontWeight: "600" }}>{formatCurrency(Number(item.estimatedUnitPrice || 0) * Number(item.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.colSide}>
           <Card className={styles.sideCard}>
             <h4>Histórico de Aprovações</h4>
             <div className={styles.verticalTimeline} style={{ marginTop: 16 }}>
                {req.approvalHistories?.map((hist, i) => (
                   <div key={hist.id} className={`${styles.vtItem} ${styles.vtDone}`}>
                     <div className={styles.vtDot}></div>
                     <div className={styles.vtContent}>
                       <strong>{hist.action === "Approved" ? "Aprovado" : hist.action === "Rejected" ? "Recusado" : "Submetido"}</strong>
                       <span>{hist.comments || "—"}</span>
                       <small>{new Date(hist.actionDate).toLocaleString("pt-BR")}</small>
                     </div>
                   </div>
                ))}
                {(!req.approvalHistories || req.approvalHistories.length === 0) && (
                   <div className={styles.emptyHist}>Nenhum histórico disponível.</div>
                )}
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
