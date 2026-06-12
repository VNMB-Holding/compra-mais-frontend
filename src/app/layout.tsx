import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. O import da fonte
import "./globals.css";
import { Sidebar } from "@/components/ui";

// 2. ADICIONE ESTA LINHA EXATAMENTE AQUI (Faltava declarar a constante inter)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VNMB Connect",
  description: "Plataforma inteligente para compras estratégicas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
        />
      </head>
      {/* 3. Agora o TypeScript vai reconhecer o 'inter.className' perfeitamente */}
      <body className={inter.className}>
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
          <Sidebar />
          <main style={{ flexGrow: 1, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}