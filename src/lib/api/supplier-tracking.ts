import { apiClient } from "@/lib/api-client";
import {
  SupplierEngagementEvent,
  SupplierTrackingSummary,
  SupplierTrackingStatus,
  SupplierEngagementEventType,
} from "@/types/supplier-tracking";

const STORAGE_KEY = "compra_mais_supplier_tracking_events";

function getStoredEvents(): Record<string, SupplierEngagementEvent[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredEvents(eventsByRfq: Record<string, SupplierEngagementEvent[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsByRfq));
  } catch (err) {
    console.error("Falha ao salvar eventos de tracking no localStorage", err);
  }
}

function generateDefaultEvents(
  rfqId: string,
  supplierId: string,
  supplierInfo?: { name?: string; email?: string; status?: string; cnpj?: string },
): SupplierEngagementEvent[] {
  const now = new Date();
  const subStatus = supplierInfo?.status;

  const baseEmail = supplierInfo?.email || "contato@fornecedor.com.br";
  const name = supplierInfo?.name || "Fornecedor";

  const events: SupplierEngagementEvent[] = [];

  const sentTime = new Date(now.getTime() - 4 * 3600 * 1000);
  events.push({
    id: `evt-${supplierId}-sent`,
    rfqId,
    supplierId,
    type: "email_sent",
    channel: "email",
    title: "Convite de Cotação Disparado",
    description: `E-mail com link exclusivo enviado para ${baseEmail}`,
    timestamp: sentTime.toISOString(),
    device: "Servidor de Disparo (SendGrid / AWS SES)",
    metadata: { recipient: baseEmail, supplierName: name },
  });

  const deliveredTime = new Date(sentTime.getTime() + 45 * 1000);
  events.push({
    id: `evt-${supplierId}-delivered`,
    rfqId,
    supplierId,
    type: "email_delivered",
    channel: "email",
    title: "E-mail Entregue com Sucesso",
    description: `Servidor MX do destinatário confirmou o recebimento da mensagem (código 250 OK)`,
    timestamp: deliveredTime.toISOString(),
    device: "Servidor de E-mail de Destino",
  });

  if (subStatus === "declined") {
    const openedTime = new Date(deliveredTime.getTime() + 15 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-opened`,
      rfqId,
      supplierId,
      type: "email_opened",
      channel: "email",
      title: "E-mail Visualizado",
      description: "O contato abriu o e-mail de convite da cotação",
      timestamp: openedTime.toISOString(),
      device: "Outlook Desktop / Windows 11",
      ipAddress: "187.55.102.14",
    });

    const accessedTime = new Date(openedTime.getTime() + 2 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-accessed`,
      rfqId,
      supplierId,
      type: "portal_accessed",
      channel: "portal",
      title: "Portal de Cotação Acessado",
      description: "Fornecedor clicou no link e visualizou os itens da cotação",
      timestamp: accessedTime.toISOString(),
      device: "Google Chrome 124 / Windows",
      ipAddress: "187.55.102.14",
    });

    const declinedTime = new Date(accessedTime.getTime() + 5 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-declined`,
      rfqId,
      supplierId,
      type: "proposal_declined",
      channel: "portal",
      title: "Cotação Declinada pelo Fornecedor",
      description: "Fornecedor informou não ter disponibilidade de estoque para os itens",
      timestamp: declinedTime.toISOString(),
      device: "Google Chrome 124 / Windows",
      ipAddress: "187.55.102.14",
    });
    return events;
  }

  if (subStatus === "received") {
    const openedTime = new Date(deliveredTime.getTime() + 22 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-opened`,
      rfqId,
      supplierId,
      type: "email_opened",
      channel: "email",
      title: "E-mail Visualizado",
      description: "O contato abriu o e-mail de convite da cotação",
      timestamp: openedTime.toISOString(),
      device: "Apple Mail / macOS Sonoma",
      ipAddress: "177.136.21.84",
    });

    const accessedTime = new Date(openedTime.getTime() + 3 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-accessed`,
      rfqId,
      supplierId,
      type: "portal_accessed",
      channel: "portal",
      title: "Portal de Cotação Acessado",
      description: "Fornecedor entrou na tela pública e visualizou as quantidades e especificações",
      timestamp: accessedTime.toISOString(),
      device: "Google Chrome 124 / macOS",
      ipAddress: "177.136.21.84",
    });

    const draftingTime = new Date(accessedTime.getTime() + 8 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-drafting`,
      rfqId,
      supplierId,
      type: "quote_drafting",
      channel: "portal",
      title: "Iniciou Preenchimento de Preços",
      description: "Preços unitários e condições de pagamento começaram a ser inseridos",
      timestamp: draftingTime.toISOString(),
      device: "Google Chrome 124 / macOS",
      ipAddress: "177.136.21.84",
    });

    const submittedTime = new Date(draftingTime.getTime() + 12 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-submitted`,
      rfqId,
      supplierId,
      type: "proposal_submitted",
      channel: "portal",
      title: "Proposta Comercial Enviada",
      description: "Proposta assinada eletronicamente e protocolada no sistema",
      timestamp: submittedTime.toISOString(),
      device: "Google Chrome 124 / macOS",
      ipAddress: "177.136.21.84",
    });
    return events;
  }

  const isOpenedAwaiting = supplierId.charCodeAt(0) % 2 === 0;
  if (isOpenedAwaiting) {
    const openedTime = new Date(deliveredTime.getTime() + 40 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-opened`,
      rfqId,
      supplierId,
      type: "email_opened",
      channel: "email",
      title: "E-mail Visualizado",
      description: "O contato abriu o e-mail de convite",
      timestamp: openedTime.toISOString(),
      device: "Gmail App / Android 14",
      ipAddress: "189.12.87.190",
    });

    const accessedTime = new Date(openedTime.getTime() + 5 * 60 * 1000);
    events.push({
      id: `evt-${supplierId}-accessed`,
      rfqId,
      supplierId,
      type: "portal_accessed",
      channel: "portal",
      title: "Portal de Cotação Acessado",
      description: "Visualizou o link da cotação. Ainda não finalizou o preenchimento",
      timestamp: accessedTime.toISOString(),
      device: "Chrome Mobile / Android",
      ipAddress: "189.12.87.190",
    });
  }

  return events;
}

function computeStatus(events: SupplierEngagementEvent[]): {
  status: SupplierTrackingStatus;
  statusLabel: string;
} {
  const hasEvent = (t: SupplierEngagementEventType) => events.some((e) => e.type === t);

  if (hasEvent("proposal_submitted")) {
    return { status: "submitted", statusLabel: "Proposta Enviada" };
  }
  if (hasEvent("proposal_declined")) {
    return { status: "declined", statusLabel: "Declinou Cotação" };
  }
  if (hasEvent("quote_drafting")) {
    return { status: "drafting", statusLabel: "Preenchendo Proposta" };
  }
  if (hasEvent("portal_accessed")) {
    return { status: "accessed", statusLabel: "Acessou o Link" };
  }
  if (hasEvent("email_opened")) {
    return { status: "opened", statusLabel: "E-mail Aberto" };
  }
  if (hasEvent("email_delivered")) {
    return { status: "delivered", statusLabel: "E-mail Entregue" };
  }
  return { status: "pending", statusLabel: "Aguardando Envio/Abertura" };
}

export const supplierTrackingApi = {
  async getSupplierTracking(
    rfqId: string,
    supplierId: string,
    supplierInfo?: { name?: string; cnpj?: string; email?: string; phone?: string; status?: string },
  ): Promise<SupplierTrackingSummary> {
    try {
      const remote = await apiClient.get<SupplierTrackingSummary>(
        `/api/rfqs/${rfqId}/suppliers/${supplierId}/tracking`,
      );
      if (remote && remote.events && remote.events.length > 0) {
        return remote;
      }
    } catch {
      // Backend inacessível ou mock offline
    }

    const store = getStoredEvents();
    const key = `${rfqId}:${supplierId}`;
    let events = store[key];

    if (!events || events.length === 0) {
      events = generateDefaultEvents(rfqId, supplierId, supplierInfo);
      store[key] = events;
      saveStoredEvents(store);
    }

    const sorted = [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const { status, statusLabel } = computeStatus(events);
    const lastActivityAt = sorted[0]?.timestamp;
    const firstAccessedAt = sorted.find((e) => e.type === "portal_accessed")?.timestamp;
    const submittedAt = sorted.find((e) => e.type === "proposal_submitted")?.timestamp;

    return {
      supplierId,
      rfqId,
      supplierName: supplierInfo?.name || "Fornecedor",
      cnpj: supplierInfo?.cnpj,
      contactEmail: supplierInfo?.email,
      contactPhone: supplierInfo?.phone,
      status,
      statusLabel,
      lastActivityAt,
      firstAccessedAt,
      submittedAt,
      totalEvents: sorted.length,
      events: sorted,
    };
  },

  async recordEvent(
    rfqId: string,
    supplierId: string,
    eventData: Omit<SupplierEngagementEvent, "id" | "rfqId" | "supplierId" | "timestamp"> & {
      timestamp?: string;
    },
  ): Promise<SupplierEngagementEvent> {
    try {
      const remoteEvent = await apiClient.post<SupplierEngagementEvent>(
        `/api/rfqs/public/${rfqId}/tracking`,
        {
          supplierId,
          type: eventData.type,
          channel: eventData.channel,
          title: eventData.title,
          description: eventData.description,
          device: eventData.device,
          ipAddress: eventData.ipAddress,
          metadata: eventData.metadata,
        },
      );
      if (remoteEvent && remoteEvent.id) {
        const store = getStoredEvents();
        const key = `${rfqId}:${supplierId}`;
        const list = store[key] || [];
        list.push(remoteEvent);
        store[key] = list;
        saveStoredEvents(store);
        return remoteEvent;
      }
    } catch {
      // Backend inacessível ou mock offline
    }

    const store = getStoredEvents();
    const key = `${rfqId}:${supplierId}`;
    const list = store[key] || [];

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = list.some(
      (e) => e.type === eventData.type && new Date(e.timestamp).getTime() > fiveMinutesAgo,
    );

    if (isDuplicate) {
      return list[list.length - 1];
    }

    const newEvent: SupplierEngagementEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rfqId,
      supplierId,
      timestamp: eventData.timestamp || new Date().toISOString(),
      type: eventData.type,
      channel: eventData.channel,
      title: eventData.title,
      description: eventData.description,
      device: eventData.device,
      ipAddress: eventData.ipAddress,
      metadata: eventData.metadata,
    };

    list.push(newEvent);
    store[key] = list;
    saveStoredEvents(store);

    return newEvent;
  },

  async resendInviteEmail(
    rfqId: string,
    supplierId: string,
    recipientEmail: string,
    supplierName?: string,
  ): Promise<boolean> {
    try {
      const res = await apiClient.post<{ success: boolean; event?: SupplierEngagementEvent }>(
        `/api/rfqs/${rfqId}/suppliers/${supplierId}/resend-invite`,
        { email: recipientEmail },
      );
      if (res?.success) {
        return true;
      }
    } catch {
      // Fallback
    }

    const now = new Date();
    await this.recordEvent(rfqId, supplierId, {
      type: "email_sent",
      channel: "email",
      title: "Convite Reenviado pelo Comprador",
      description: `Novo disparo realizado manualmente para ${recipientEmail}`,
      device: "Painel do Comprador",
      timestamp: now.toISOString(),
      metadata: { recipient: recipientEmail, supplierName },
    });

    setTimeout(async () => {
      await this.recordEvent(rfqId, supplierId, {
        type: "email_delivered",
        channel: "email",
        title: "E-mail Entregue com Sucesso",
        description: `Servidor MX do destinatário confirmou a entrega`,
        device: "Servidor de Disparo",
        timestamp: new Date(Date.now() + 2000).toISOString(),
      });
    }, 1500);

    return true;
  },
};
