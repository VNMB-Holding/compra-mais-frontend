"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import KpiCard from "@/components/ui/KpiCard/KpiCard";
import styles from "./fornecedor-detail.module.css";

export default function FornecedorDetailCRMPage() {
  const params = useParams();
  const router = useRouter();

  interface HistoricoRow {
    data: string;
    tipo: string;
    descricao: string;
    valor: string;
    status: string;
  }

  const historico: HistoricoRow[] = [
    { data: "15/06/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4521", valor: "R$ 22.400,00", status: "Entregue" },
    { data: "02/06/2024", tipo: "RFQ", descricao: "Cotação de Combustíveis - Mês de Junho", valor: "-", status: "Fechada" },
    { data: "22/05/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4489", valor: "R$ 18.700,00", status: "Entregue" },
    { data: "10/05/2024", tipo: "Avaliação", descricao: "Avaliação de desempenho trimestral", valor: "-", status: "Concluída" },
    { data: "28/04/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4401", valor: "R$ 15.400,00", status: "Entregue" },
    { data: "15/04/2024", tipo: "RFQ", descricao: "Cotação de Combustíveis - Abastecimento", valor: "-", status: "Fechada" },
    { data: "01/04/2024", tipo: "Contrato", descricao: "Renovação de contrato - Categoria Combustíveis", valor: "R$ 240.000,00", status: "Ativo" },
    { data: "18/03/2024", tipo: "Pedido", descricao: "Compra de Combustível - Lote 4322", valor: "R$ 14.800,00", status: "Entregue" },
  ];

  const historicoColumns: ColumnDef<HistoricoRow>[] = [
    { header: "Data", accessorKey: "data" },
    { header: "Tipo", accessorKey: "tipo" },
    { header: "Descrição", accessorKey: "descricao" },
    { header: "Valor", accessorKey: "valor" },
    {
      header: "Status",
      cell: (row) => (
        <span className={`${styles.historicoBadge} ${row.status === "Entregue" || row.status === "Concluída" || row.status === "Fechada" ? styles.badgeHistoricoGreen : row.status === "Ativo" ? styles.badgeHistoricoBlue : styles.badgeHistoricoYellow}`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <div className={styles.pageContainer}>
      
      {/* NAVEGAÇÃO SUPERIOR */}
      <button className={styles.backBtn} onClick={() => router.push("/fornecedores")}>
        <span className="material-symbols-outlined">arrow_back</span> Voltar ao diretório
      </button>

      {/* CABEÇALHO */}
      <div className={styles.headerSection}>
        <div className={styles.headerTitles}>
          <div className={styles.titleRow}>
            <h1>Fornecedor Bravo LTDA</h1>
            <Badge variant="success" className={styles.badgeHomologado}>Homologado</Badge>
          </div>

        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnAction}>
            <span className="material-symbols-outlined">edit</span> Editar
          </button>
          <button className={styles.btnAction}>
            <span className="material-symbols-outlined">description</span> Documentos
          </button>
          <button className={styles.btnAction}>
            <span className="material-symbols-outlined">history</span> Histórico
          </button>
        </div>
      </div>

      {/* 4 KPIS SUPERIORES */}
      <div className={styles.kpiRow}>
        <KpiCard title="OTIF" value="94%" icon="local_shipping" description="Entregas no prazo" />
        <KpiCard title="Qualidade" value="98%" icon="workspace_premium" description="Conformidade dos itens" />
        <KpiCard title="Volume negociado (12m)" value="R$ 1,2M" icon="payments" />
        <KpiCard title="Pedidos atendidos (12m)" value="128" icon="shopping_cart" />
      </div>

      {/* INFORMAÇÕES DO FORNECEDOR (GRID CENTRAL) */}
      <Card className={styles.infoCard}>
        <h3 className={styles.sectionTitle}>Informações do fornecedor</h3>
        
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">domain</span>
            <div className={styles.infoText}>
              <small>Razão Social</small>
              <span>Fornecedor Bravo LTDA</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">badge</span>
            <div className={styles.infoText}>
              <small>CNPJ</small>
              <span>22.333.444/0001-82</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">sell</span>
            <div className={styles.infoText}>
              <small>Categoria</small>
              <span>Combustíveis</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">calendar_today</span>
            <div className={styles.infoText}>
              <small>Fornecedor desde</small>
              <span>18/08/2023</span>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">person</span>
            <div className={styles.infoText}>
              <small>Contato principal</small>
              <span>João Silva</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">mail</span>
            <div className={styles.infoText}>
              <small>E-mail</small>
              <span>vendas@bravo.com.br</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">call</span>
            <div className={styles.infoText}>
              <small>Telefone</small>
              <span>(11) 99999-9999</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className="material-symbols-outlined">language</span>
            <div className={styles.infoText}>
              <small>Website</small>
              <span>www.bravo.com.br</span>
            </div>
          </div>

          <div className={`${styles.infoItem} ${styles.colSpanFull}`}>
            <span className="material-symbols-outlined">location_on</span>
            <div className={styles.infoText}>
              <small>Endereço</small>
              <span>Av. das Nações Unidas, 12.345, Conj. 1201 — São Paulo - SP, 04578-000</span>
            </div>
          </div>
        </div>
      </Card>

      {/* HISTÓRICO COMERCIAL */}
      <Card className={styles.historicoCard}>
        <div className={styles.historicoHeader}>
          <h3>Histórico de atividades com o fornecedor</h3>
        </div>
        <DataTable columns={historicoColumns} data={historico} />
      </Card>

    </div>
  );
}
