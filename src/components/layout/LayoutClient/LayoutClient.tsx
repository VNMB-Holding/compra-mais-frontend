"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, Topbar } from "@/components/ui";
import { HelpModal } from "@/components/modals";

import styles from "./LayoutClient.module.css";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();

  const isStandalone =
    pathname.startsWith("/login") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/solicitar") ||
    pathname.startsWith("/solicitacao-externa") ||
    pathname.startsWith("/aprovacao") ||
    pathname.startsWith("/cotacao");

  if (isStandalone) {
    return <>{children}</>;
  }

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className={styles.layoutRoot}>
      <Sidebar
        isCollapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onHelpClick={() => setHelpOpen(true)}
      />
      <div className={styles.mainContainer}>
        <div className={styles.topbarWrapper}>
          <Topbar isSidebarCollapsed={sidebarCollapsed} onToggleSidebar={handleToggleSidebar} />
        </div>
        <main className={styles.contentArea}>{children}</main>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
