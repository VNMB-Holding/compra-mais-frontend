"use client";

import React, { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { Loading, Icon } from "@/components/ui";
import Link from "next/link";
import styles from "./solicitacoes-rapidas.module.css";

export default function SolicitacoesRapidasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If user is a solicitante, only allow the rapidas pages
    if (user?.role === "solicitante") {
      if (
        pathname === "/solicitacoes-rapidas/nova" ||
        pathname === "/solicitacoes-rapidas/minhas" ||
        pathname === "/solicitacoes-rapidas/home" ||
        pathname === "/solicitacoes-rapidas/perfil"
      ) {
        setCanRender(true);
      } else {
        router.replace("/unauthorized");
      }
      return;
    }

    // For other roles, delegate to ProtectedLayout with admin roles
    setCanRender(true);
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading || !canRender) {
    return <Loading variant="fullscreen" message="Carregando solicitações..." />;
  }

  if (user?.role === "solicitante") {
    return (
      <div className={styles.appShell}>
        <div className={styles.appContainer}>
          <div className={styles.appTopBar}>
            <div className={styles.appBrand}>
              <img src="/images/logo-compra-mais.svg" alt="Compra+" style={{ height: "32px", width: "auto" }} />
            </div>
            {pathname !== "/solicitacoes-rapidas/perfil" && (
              user?.avatar ? (
                <img src={user.avatar} alt="Perfil" className={styles.topAvatar} />
              ) : (
                <div className={styles.topAvatarFallback}>
                  <Icon name="user-01" size={16} />
                </div>
              )
            )}
          </div>
          
          <div className={styles.appContent}>{children}</div>
          
          <div className={styles.bottomTabBar}>
            <Link
              href="/solicitacoes-rapidas/home"
              className={`${styles.tabItem} ${
                pathname === "/solicitacoes-rapidas/home" ? styles.tabActive : ""
              }`}
            >
              <Icon name="home-01" size={24} />
              <span>Home</span>
            </Link>
            <Link
              href="/solicitacoes-rapidas/nova"
              className={`${styles.tabItem} ${
                pathname === "/solicitacoes-rapidas/nova" ? styles.tabActive : ""
              }`}
            >
              <Icon name="file-plus-02" size={24} />
              <span>Nova</span>
            </Link>
            <Link
              href="/solicitacoes-rapidas/minhas"
              className={`${styles.tabItem} ${
                pathname === "/solicitacoes-rapidas/minhas" ? styles.tabActive : ""
              }`}
            >
              <Icon name="clock" size={24} />
              <span>Acompanhar</span>
            </Link>
            <Link
              href="/solicitacoes-rapidas/perfil"
              className={`${styles.tabItem} ${
                pathname === "/solicitacoes-rapidas/perfil" ? styles.tabActive : ""
              }`}
            >
              <Icon name="user-01" size={24} />
              <span>Perfil</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["procurist", "gerente", "admin"]}>
      {children}
    </ProtectedLayout>
  );
}
