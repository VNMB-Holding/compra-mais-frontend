import { describe, it, expect, beforeEach } from "vitest";
import { supplierTrackingApi } from "@/lib/api/supplier-tracking";

describe("supplierTrackingApi", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("should generate default events and summary when queried", async () => {
    const summary = await supplierTrackingApi.getSupplierTracking("rfq-123", "sup-456", {
      name: "Fornecedor Teste",
      status: "received",
    });

    expect(summary.supplierId).toBe("sup-456");
    expect(summary.supplierName).toBe("Fornecedor Teste");
    expect(summary.status).toBe("submitted");
    expect(summary.events.length).toBeGreaterThan(0);
    expect(summary.events.some((e) => e.type === "proposal_submitted")).toBe(true);
  });

  it("should record a new event and compute updated status", async () => {
    const rfqId = "rfq-999";
    const supplierId = "sup-999";

    const evt = await supplierTrackingApi.recordEvent(rfqId, supplierId, {
      type: "portal_accessed",
      channel: "portal",
      title: "Portal Acessado",
      description: "Visualizou link",
    });

    expect(evt.type).toBe("portal_accessed");

    const summary = await supplierTrackingApi.getSupplierTracking(rfqId, supplierId);
    expect(summary.status).toBe("accessed");
  });
});
