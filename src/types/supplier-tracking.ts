export type SupplierEngagementEventType =
  | "email_sent"
  | "email_delivered"
  | "email_opened"
  | "portal_accessed"
  | "quote_drafting"
  | "proposal_submitted"
  | "proposal_declined"
  | "whatsapp_opened";

export type SupplierTrackingStatus =
  | "pending"
  | "delivered"
  | "opened"
  | "accessed"
  | "drafting"
  | "submitted"
  | "declined";

export interface SupplierEngagementEvent {
  id: string;
  rfqId: string;
  supplierId: string;
  type: SupplierEngagementEventType;
  timestamp: string;
  channel: "email" | "portal" | "whatsapp" | "system";
  title: string;
  description: string;
  device?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface SupplierTrackingSummary {
  supplierId: string;
  rfqId: string;
  supplierName: string;
  cnpj?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: SupplierTrackingStatus;
  statusLabel: string;
  lastActivityAt?: string;
  firstAccessedAt?: string;
  submittedAt?: string;
  totalEvents: number;
  events: SupplierEngagementEvent[];
}
