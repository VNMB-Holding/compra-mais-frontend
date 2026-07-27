"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui";
import Topbar from "@/components/ui/Topbar/Topbar";
import HelpModal from "@/components/HelpModal/HelpModal";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();

  const noLayoutPages = ["/login", "/unauthorized", "/solicitar-acesso"];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', maxWidth: '100%' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onHelpClick={() => setHelpOpen(true)} />
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>
          <Topbar isSidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>
        <main style={{ flexGrow: 1, backgroundColor: '#f8fafc', padding: '40px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
