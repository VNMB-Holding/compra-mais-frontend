"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui";
import Topbar from "@/components/ui/Topbar/Topbar";
import HelpModal from "@/components/HelpModal/HelpModal";

import styles from "./LayoutClient.module.css";

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
    <div className={styles.layoutRoot}>
      <Sidebar isCollapsed={sidebarCollapsed} onHelpClick={() => setHelpOpen(true)} />
      <div className={styles.mainContainer}>
        <div className={styles.topbarWrapper}>
          <Topbar isSidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
