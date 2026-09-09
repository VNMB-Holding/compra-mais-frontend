"use client";

import React from "react";
import { Skeleton, KpiCardSkeleton, TableSkeleton } from "@/components/ui";

export default function RootLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", padding: "4px 0" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: "50%" }}>
          <Skeleton variant="title" width="40%" height={28} style={{ marginBottom: "8px" }} />
          <Skeleton variant="text" width="70%" height={14} />
        </div>
        <Skeleton variant="rectangular" width={160} height={38} style={{ borderRadius: "8px" }} />
      </div>

      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <Skeleton variant="title" width="25%" height={20} style={{ margin: 0 }} />
          <Skeleton variant="rectangular" width={120} height={32} style={{ borderRadius: "6px" }} />
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}
