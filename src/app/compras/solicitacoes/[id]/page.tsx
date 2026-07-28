"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./solicitacoes-detail.module.css";

type DialogType = "approve" | "reject" | null;

export default function SolicitacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const solId = params.id as string;

  const [dialog, setDialog] = useState<DialogType>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleApprove = () => {
    setApproved(true);
    setDialog(null);
    toast({
      variant: "success",
      title: "Solicitação aprovada!",
      message: `${solId || "SOL-000456"} foi aprovada e está liberada para abertura de RFQ.`,
    });
  };

  const handleReject = () => {
    setApproved(false);
    setDialog(null);
    toast({
      variant: "error",
      title: "Solicitação rejeitada",
      message: `${solId || "SOL-000456"} foi rejeitada. O solicitante será notificado.`,
    });
  };

  return (
    <div className={styles.detailContainer}>

      {/* Dialog — Aprovar */}
      <ConfirmDialog
        open={dialog === "approve"}
        variant="success"
        icon="check-circle"
        title="Aprovar esta solicitação?"
        message={
          <>
            A solicitação <strong>{solId || "SOL-000456"}</strong> será aprovada e liberada para abertura de RFQ.
            Esta ação ficará registrada no histórico de aprovações.
          </>
        }
        confirmLabel="Sim, aprovar"
        onConfirm={handleApprove}
        onCancel={() => setDialog(null)}
      />

      {/* Dialog — Rejeitar */}
      <ConfirmDialog
        open={dialog === "reject"}
        variant="danger"
        icon="x-circle"
        title="Rejeitar esta solicitação?"
        message={
          <>
            A solicitação <strong>{solId || "SOL-000456"}</strong> será rejeitada e o solicitante será notificado.
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Sim, rejeitar"
        onConfirm={handleReject}
        onCancel={() => setDialog(null)}
      />

      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitações
      </button>

      {/* Feedback de resultado */}
      {approved === true && (
        <div className={styles.resultBanner} style={{ background: "#d1fae5", borderColor: "#6ee7b7", color: "#065f46" }}>
          <Icon name="check-circle" /> Solicitação <strong>{solId || "SOL-000456"}</strong> aprovada com sucesso. Agora você pode abrir uma RFQ.
        </div>
      )}
      {approved === false && (
        <div className={styles.resultBanner} style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}>
          <Icon name="x-circle" /> Solicitação <strong>{solId || "SOL-000456"}</strong> rejeitada.
        </div>
      )}

      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{solId || "SOL-000456"}</h1>
            <Badge variant={approved === true ? "success" : approved === false ? "gray" : "warning"}>
              {approved === true ? "Aprovada" : approved === false ? "Rejeitada" : "Aguardando aprovação"}
            </Badge>
          </div>
          <p className={styles.subtitleLarge}>Óleo Diesel S10</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}><Icon name="building-01" /> Centro de custo: Operações</span>
            <span className={styles.infoTag}><Icon name="folder" /> Categoria: Combustíveis</span>
            <span className={`${styles.infoTag} ${styles.tagHigh}`}><Icon name="chevron-up-double" /> Prioridade: Alta</span>
          </div>
        </div>
        {approved === null && (
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => setDialog("reject")}>
              <Icon name="x-close" /> Rejeitar Demanda
            </Button>
            <Button variant="primary" onClick={() => setDialog("approve")}>
              <Icon name="check" /> Aprovar Solicitação
            </Button>
          </div>
        )}
      </div>

      {/* Layout de Duas Colunas */}
      <div className={styles.layout2Col}>

        {/* Coluna Principal (Esquerda) */}
        <div className={styles.colMain}>

          {/* STEPPER DE APROVAÇÃO HORIZONTAL */}
          <Card className={styles.flowCard}>
            <h4>Fluxo de Alçadas de Aprovação</h4>
            <div className={styles.stepperContainer}>

              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>
                  <Icon name="file-01" />
                  <div className={styles.checkBadge}><Icon name="check" /></div>
                </div>
                <div className={styles.stepInfo}>
                  <strong>Solicitante</strong>
                  <span>Breno Marques</span>
                  <small>22/05/2024 14:00</small>
                </div>
              </div>

              <div className={`${styles.stepLine} ${styles.lineActive}`}></div>

              <div className={`${styles.step} ${approved !== null ? styles.completed : styles.active}`}>
                <div className={styles.stepIcon}>
                  {approved !== null
                    ? <><Icon name="users-01" /><div className={styles.checkBadge}><Icon name="check" /></div></>
                    : <Icon name="users-01" />
                  }
                </div>
                <div className={styles.stepInfo}>
                  <strong>Gestor da Área</strong>
                  <span>Mariana Costa</span>
                  {approved === null
                    ? <span className={styles.warningBadgeHint}>Aguardando</span>
                    : <small>{new Date().toLocaleDateString("pt-BR")}</small>
                  }
                </div>
              </div>

              <div className={styles.stepLine}></div>

              <div className={`${styles.step} ${styles.pending}`}>
                <div className={styles.stepIcon}><Icon name="user-01" /></div>
                <div className={styles.stepInfo}>
                  <strong>Diretoria Executiva</strong>
                  <span>Pendente</span>
                </div>
              </div>

            </div>
          </Card>

          {/* FICHA TÉCNICA INFORMATIVA */}
          <Card className={styles.infoCard}>
            <h4>Ficha de Informações Técnicas</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Descrição do Item</label>
                <span>Óleo Diesel S10</span>
              </div>
              <div className={`${styles.infoItem} ${styles.span2}`}>
                <label>Justificativa de Aquisição</label>
                <span>Reabastecimento estratégico da frota logística e continuidade operacional de distribuição.</span>
              </div>
              <div className={styles.infoItem}>
                <label>Volume Estimado</label>
                <strong>500.000 L</strong>
              </div>
              <div className={styles.infoItem}>
                <label>Orçamento Previsto</label>
                <strong className={styles.textPrimary}>R$ 3.250.000,00</strong>
              </div>
              <div className={styles.infoItem}>
                <label>Local de Entrega</label>
                <span>Base Operacional - Paulínia/SP</span>
              </div>
              <div className={styles.infoItem}>
                <label>Data Limite Desejada</label>
                <span>05/06/2024</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Lateral (Direita) */}
        <div className={styles.colSide}>

          {/* TIMELINE VERTICAL */}
          <Card className={styles.sideCard}>
            <h4>Rastreabilidade</h4>
            <div className={styles.verticalTimeline}>
              <div className={`${styles.vtItem} ${styles.vtDone}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Solicitação enviada</strong>
                  <span>Por Breno Marques</span>
                  <small>22/05/2024 às 14:00</small>
                </div>
              </div>
              <div className={`${styles.vtItem} ${approved !== null ? styles.vtDone : styles.vtCurrent}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>{approved === true ? "Aprovada pelo Gestor" : approved === false ? "Rejeitada pelo Gestor" : "Aguardando assinatura"}</strong>
                  <span>Mariana Costa (Gestão Geral)</span>
                  {approved !== null && <small>{new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>}
                </div>
              </div>
            </div>
          </Card>

          {/* ANEXOS */}
          <Card className={styles.sideCard}>
            <h4>Arquivos e Termos Técnicos</h4>
            <div className={styles.fileRow}>
              <Icon name="file-01" />
              <div className={styles.fileInfo}>
                <strong>Especificacao_Tecnica_Diesel.pdf</strong>
                <small>PDF • 245 KB</small>
              </div>
              <button className={styles.downloadIconBtn} title="Baixar anexo">
                <Icon name="download-01" />
              </button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
