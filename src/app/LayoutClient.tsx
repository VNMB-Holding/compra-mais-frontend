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
    <div className="flex h-dvh overflow-hidden w-full max-w-full">
      <Sidebar isCollapsed={sidebarCollapsed} onHelpClick={() => setHelpOpen(true)} />
      <div className="flex-grow flex flex-col h-dvh overflow-hidden">
        <div className="flex-shrink-0">
          <Topbar isSidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>
        <main className="flex-grow bg-slate-50 p-[40px] overflow-y-auto">
          {children}
        </main>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
