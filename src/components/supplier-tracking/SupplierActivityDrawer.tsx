"use client";

import React, { useEffect, useState } from "react";
import { QuickDetailDrawer, Badge, Icon, Button, EmptyState } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import {
  SupplierTrackingSummary,
  SupplierEngagementEvent,
  SupplierEngagementEventType,
} from "@/types/supplier-tracking";
import { supplierTrackingApi } from "@/lib/api/supplier-tracking";
import styles from "./SupplierActivityDrawer.module.css";

export interface SupplierActivityDrawerProps {
  open: boolean;
  onClose: () => void;
  rfqId: string;
  rfqCode?: string;
  supplierId: string;
  supplierName: string;
  cnpj?: string;
  contactEmail?: string;
  contactPhone?: string;
  proposalStatus?: string;
}

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function SupplierActivityDrawer({
  open,
  onClose,
  rfqId,
  rfqCode = "",
  supplierId,
  supplierName,
  cnpj = "—",
  contactEmail = "",
  contactPhone = "",
  proposalStatus = "awaiting",
}: SupplierActivityDrawerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<SupplierTrackingSummary | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!open || !rfqId || !supplierId) return;

    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await supplierTrackingApi.getSupplierTracking(rfqId, supplierId, {
          name: supplierName,
          cnpj,
          email: contactEmail,
          phone: contactPhone,
          status: proposalStatus,
        });
        if (isMounted) setTracking(data);
      } catch (err) {
        console.error("Erro ao carregar tracking", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [open, rfqId, supplierId, supplierName, cnpj, contactEmail, contactPhone, proposalStatus]);

  if (!open) return null;

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cotacao/${rfqCode || rfqId}?supId=${encodeURIComponent(supplierId)}&fornecedor=${encodeURIComponent(supplierName)}&cnpj=${encodeURIComponent(cnpj)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        title: "Link Copiado!",
        message: `Link exclusivo para ${supplierName} copiado com sucesso.`,
      });
    }
  };

  const handleWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cotacao/${rfqCode || rfqId}?supId=${encodeURIComponent(supplierId)}&fornecedor=${encodeURIComponent(supplierName)}&cnpj=${encodeURIComponent(cnpj)}`;
    const text = encodeURIComponent(
      `Olá, *${supplierName}*! Segue o link exclusivo para envio da sua cotação comercial (${rfqCode}):\n\n${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleResendEmail = async () => {
    const emailToUse = contactEmail || "contato@fornecedor.com.br";
    try {
      setResending(true);
      await supplierTrackingApi.resendInviteEmail(rfqId, supplierId, emailToUse, supplierName);
      toast({
        variant: "success",
        title: "Convite Reenviado!",
        message: `Novo e-mail enviado com sucesso para ${emailToUse}.`,
      });

      const updated = await supplierTrackingApi.getSupplierTracking(rfqId, supplierId, {
        name: supplierName,
        cnpj,
        email: contactEmail,
        phone: contactPhone,
        status: proposalStatus,
      });
      setTracking(updated);
    } catch {
      toast({
        variant: "error",
        title: "Erro no envio",
        message: "Não foi possível reenviar o e-mail no momento.",
      });
    } finally {
      setResending(false);
    }
  };

  const events = tracking?.events || [];
  const hasSent = events.some((e) => e.type === "email_sent");
  const hasDelivered = events.some((e) => e.type === "email_delivered");
  const hasOpened = events.some((e) => e.type === "email_opened");
  const hasAccessed = events.some((e) => e.type === "portal_accessed");
  const hasSubmitted = events.some((e) => e.type === "proposal_submitted");

  let progressPercentage = 0;
  if (hasSubmitted) progressPercentage = 100;
  else if (hasAccessed) progressPercentage = 75;
  else if (hasOpened) progressPercentage = 50;
  else if (hasDelivered) progressPercentage = 25;
  else if (hasSent) progressPercentage = 10;

  const getEventIcon = (type: SupplierEngagementEventType) => {
    switch (type) {
      case "email_sent":
        return "send-01";
      case "email_delivered":
        return "check-circle";
      case "email_opened":
        return "mail-01";
      case "portal_accessed":
        return "eye";
      case "quote_drafting":
        return "edit-01";
      case "proposal_submitted":
        return "check-done-01";
      case "proposal_declined":
        return "x-close";
      case "whatsapp_opened":
        return "message-square-02";
      default:
        return "activity";
    }
  };

  const getMarkerClass = (channel: string) => {
    if (channel === "portal") return styles.markerPortal;
    if (channel === "whatsapp") return styles.markerWhatsApp;
    if (channel === "email") return styles.markerEmail;
    return styles.markerSystem;
  };

  return (
    <QuickDetailDrawer
      open={open}
      onClose={onClose}
      title="Rastreamento do Fornecedor"
      subtitle={`Histórico de leitura e interações da cotação ${rfqCode || rfqId}`}
      primaryActionLabel="Copiar Link"
      onPrimaryAction={handleCopyLink}
      secondaryActionLabel="Fechar"
      badge={
        tracking && (
          <Badge
            variant={
              tracking.status === "submitted"
                ? "success"
                : tracking.status === "declined"
                  ? "danger"
                  : tracking.status === "drafting"
                    ? "warning"
                    : tracking.status === "accessed" || tracking.status === "opened"
                      ? "primary"
                      : "gray"
            }
          >
            {tracking.statusLabel}
          </Badge>
        )
      }
    >
      <div className={styles.drawerContent}>
        <div className={styles.supplierHeaderCard}>
          <div className={styles.supplierMainInfo}>
            <div className={styles.supplierNames}>
              <span className={styles.supplierCorporateName}>{supplierName}</span>
              <span className={styles.supplierCnpj}>CNPJ: {cnpj}</span>
            </div>
          </div>

          <div className={styles.contactsGrid}>
            <div className={styles.contactItem}>
              <Icon name="mail-01" size={14} />
              <span>
                <strong>E-mail:</strong> {contactEmail || "Não cadastrado"}
              </span>
            </div>
            {contactPhone && (
              <div className={styles.contactItem}>
                <Icon name="phone-01" size={14} />
                <span>
                  <strong>Tel:</strong> {contactPhone}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.pipelineContainer}>
          <div className={styles.pipelineTitle}>
            <Icon name="activity" size={14} /> Funil de Conversão do Fornecedor
          </div>

          <div className={styles.pipelineSteps}>
            <div className={styles.pipelineConnector}>
              <div
                className={styles.pipelineConnectorFill}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className={styles.pipelineStep}>
              <div className={`${styles.stepDot} ${hasSent ? styles.stepDotDone : ""}`}>
                <Icon name="send-01" size={12} />
              </div>
              <span className={`${styles.stepLabel} ${hasSent ? styles.stepLabelDone : ""}`}>
                Disparado
              </span>
            </div>

            <div className={styles.pipelineStep}>
              <div className={`${styles.stepDot} ${hasDelivered ? styles.stepDotDone : ""}`}>
                <Icon name="check" size={12} />
              </div>
              <span className={`${styles.stepLabel} ${hasDelivered ? styles.stepLabelDone : ""}`}>
                Entregue
              </span>
            </div>

            <div className={styles.pipelineStep}>
              <div className={`${styles.stepDot} ${hasOpened ? styles.stepDotDone : ""}`}>
                <Icon name="mail-01" size={12} />
              </div>
              <span className={`${styles.stepLabel} ${hasOpened ? styles.stepLabelDone : ""}`}>
                Visualizado
              </span>
            </div>

            <div className={styles.pipelineStep}>
              <div className={`${styles.stepDot} ${hasAccessed ? styles.stepDotDone : ""}`}>
                <Icon name="eye" size={12} />
              </div>
              <span className={`${styles.stepLabel} ${hasAccessed ? styles.stepLabelDone : ""}`}>
                Acessou Link
              </span>
            </div>

            <div className={styles.pipelineStep}>
              <div className={`${styles.stepDot} ${hasSubmitted ? styles.stepDotDone : ""}`}>
                <Icon name="check-done-01" size={12} />
              </div>
              <span className={`${styles.stepLabel} ${hasSubmitted ? styles.stepLabelDone : ""}`}>
                Respondido
              </span>
            </div>
          </div>
        </div>

        <div className={styles.quickActionsContainer}>
          <Button
            variant="secondary"
            onClick={handleResendEmail}
            disabled={resending}
          >
            <Icon name="mail-01" size={14} />
            {resending ? "Reenviando..." : "Reenviar Convite"}
          </Button>

          <Button variant="secondary" onClick={handleWhatsApp}>
            <Icon name="message-square-02" size={14} />
            Cobrar via WhatsApp
          </Button>
        </div>

        <div className={styles.timelineSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Icon name="clock" size={15} /> Linha do Tempo de Auditoria
            </div>
            <span className={styles.eventsCount}>
              {events.length} evento{events.length === 1 ? "" : "s"} registrado
              {events.length === 1 ? "" : "s"}
            </span>
          </div>

          {events.length === 0 ? (
            <EmptyState
              illustration="envelope-empty"
              title="Nenhuma atividade registrada ainda"
              description="Assim que o fornecedor receber o e-mail ou interagir com o link da cotação, os eventos aparecerão aqui."
            />
          ) : (
            <div className={styles.timelineList}>
              {events.map((evt) => (
                <div key={evt.id} className={styles.timelineItem}>
                  <div className={`${styles.timelineMarker} ${getMarkerClass(evt.channel)}`}>
                    <Icon name={getEventIcon(evt.type)} size={10} />
                  </div>

                  <div className={styles.timelineCard}>
                    <div className={styles.timelineHeaderRow}>
                      <span className={styles.timelineEventTitle}>{evt.title}</span>
                      <span className={styles.timelineTime}>{formatDateTime(evt.timestamp)}</span>
                    </div>

                    <p className={styles.timelineDescription}>{evt.description}</p>

                    {(evt.device || evt.ipAddress || evt.metadata?.recipient) && (
                      <div className={styles.timelineMeta}>
                        {evt.device && (
                          <span className={styles.metaPill}>
                            <Icon name="monitor-01" size={11} /> {evt.device}
                          </span>
                        )}
                        {evt.ipAddress && (
                          <span className={styles.metaPill}>
                            <Icon name="globe-01" size={11} /> IP: {evt.ipAddress}
                          </span>
                        )}
                        {evt.metadata?.recipient && (
                          <span className={styles.metaPill}>
                            <Icon name="mail-01" size={11} /> {evt.metadata.recipient}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </QuickDetailDrawer>
  );
}
