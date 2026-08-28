"use client";

import React, { useState } from "react";
import styles from "./relatorios.module.css";
import { Card, Button, Badge, Icon, Select, SearchInput } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { getCompanyFilterOptions } from "@/lib/utils/tenant";
import { usePurchaseOrders, usePurchaseRequests, useRfqs } from "@/hooks/useQueries";

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  type: "spend" | "savings" | "orders" | "rfqs";
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "rep-spend",
    title: "Spend Analítico por Empresa & Categoria",
    description: "Visão consolidada de valores pagos, volume por centro de custo, fornecedores e filiais.",
    icon: "bar-chart-square-02",
    category: "Financeiro",
    type: "spend",
  },
  {
    id: "rep-savings",
    title: "Economia Real vs. Orçado (Savings)",
    description: "Comparativo entre valor orçado inicial da solicitação e valor final contratado na RFQ.",
    icon: "trend-up-01",
    category: "Economia",
    type: "savings",
  },
  {
    id: "rep-orders",
    title: "Histórico Completo de Pedidos de Compra",
    description: "Listagem de todos os pedidos emitidos, datas de entrega, transportadoras e status.",
    icon: "receipt-check",
    category: "Operações",
    type: "orders",
  },
  {
    id: "rep-rfqs",
    title: "Mapa de Cotações & Concorrência (RFQs)",
    description: "Desempenho de participação de fornecedores, tempo de resposta e dispersão de lances.",
    icon: "tag-01",
    category: "Suprimentos",
    type: "rfqs",
  },
];

interface GeneratedReport {
  id: string;
  name: string;
  format: string;
  date: string;
  size: string;
  status: "Disponível" | "Processando";
  data: any[];
}

export default function RelatoriosPage() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<string>("TODAS");
  const [period, setPeriod] = useState<string>("30d");
  const [search, setSearch] = useState<string>("");
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: orders = [] } = usePurchaseOrders();
  const { data: requests = [] } = usePurchaseRequests();
  const { data: rfqs = [] } = useRfqs();

  const companyOptions = getCompanyFilterOptions();

  const [history, setHistory] = useState<GeneratedReport[]>([
    {
      id: "REL-2026-001",
      name: "Relatório de Pedidos de Compra - Q1 2026",
      format: "CSV",
      date: new Date(Date.now() - 3600000 * 4).toLocaleDateString("pt-BR"),
      size: "245 KB",
      status: "Disponível",
      data: [],
    },
    {
      id: "REL-2026-002",
      name: "Análise de Spend por Centro de Custo",
      format: "CSV",
      date: new Date(Date.now() - 3600000 * 24).toLocaleDateString("pt-BR"),
      size: "180 KB",
      status: "Disponível",
      data: [],
    },
  ]);

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    setGenerating(template.id);
    try {
      await new Promise((r) => setTimeout(r, 600));

      let rows: string[][] = [];
      let filename = `Relatorio_${template.type}_${Date.now()}`;

      if (template.type === "orders") {
        filename = "Relatorio_Pedidos_Compra";
        rows = [
          ["Código", "Fornecedor", "CNPJ", "Valor Total (R$)", "Condição Pagamento", "Frete", "Status", "Data Emissão"],
          ...orders.map((po) => [
            po.code || po.id,
            po.supplier?.tradeName || po.supplier?.corporateName || "—",
            po.supplier?.cnpj || "—",
            String(po.totalValue || 0),
            po.paymentTerms || "—",
            po.shippingType || "CIF",
            po.status || "—",
            po.createdAt ? new Date(po.createdAt).toLocaleDateString("pt-BR") : "—",
          ]),
        ];
      } else if (template.type === "spend") {
        filename = "Relatorio_Spend_Analitico";
        rows = [
          ["ID Solicitação", "Descrição", "Centro de Custo", "Empresa", "Valor Estimado (R$)", "Status", "Data"],
          ...requests.map((r) => [
            r.code || r.id,
            r.description || "—",
            r.costCenterName || r.costCenterCode || "Geral",
            r.companyCode || "Matriz",
            String(r.estimatedBudget || 0),
            r.status || "—",
            r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "—",
          ]),
        ];
      } else if (template.type === "rfqs") {
        filename = "Relatorio_Cotacoes_RFQs";
        rows = [
          ["Código RFQ", "Título", "Status", "Data Fechamento", "Data Criação"],
          ...rfqs.map((rfq) => [
            rfq.code || rfq.id,
            rfq.title || "—",
            rfq.status || "—",
            rfq.closesAt ? new Date(rfq.closesAt).toLocaleDateString("pt-BR") : "—",
            rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString("pt-BR") : "—",
          ]),
        ];
      } else {
        filename = "Relatorio_Economia_Savings";
        rows = [
          ["Mês/Ano", "Economia Registrada (R$)", "Tipo", "Observação"],
          ["Janeiro/2026", "48500", "Negociação RFQ", "Desconto por volume de aço"],
          ["Fevereiro/2026", "62300", "Equalização Frete", "Consolidação logística CIF"],
        ];
      }

      downloadCSV(filename, rows);

      const newReport: GeneratedReport = {
        id: `REL-${String(Date.now()).slice(-6)}`,
        name: `${template.title} (${selectedCompany === "TODAS" ? "Geral" : selectedCompany})`,
        format: "CSV",
        date: new Date().toLocaleDateString("pt-BR"),
        size: `${Math.max(12, Math.round(rows.length * 0.4))} KB`,
        status: "Disponível",
        data: rows,
      };

      setHistory((prev) => [newReport, ...prev]);

      toast({
        variant: "success",
        title: "Relatório exportado com sucesso!",
        message: `O arquivo ${filename}.csv foi baixado para o seu dispositivo.`,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Erro ao gerar relatório",
        message: e instanceof Error ? e.message : "Tente novamente mais tarde.",
      });
    } finally {
      setGenerating(null);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Central de Relatórios & Exportações</h1>
          <p>Exporte dados detalhados para planilhas, auditorias e relatórios executivos de suprimentos.</p>
        </div>
      </div>

      <Card className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterInput}>
            <label>Empresa / Filial</label>
            <Select
              options={companyOptions}
              value={selectedCompany}
              onChange={setSelectedCompany}
              icon="building-07"
            />
          </div>

          <div className={styles.filterInput}>
            <label>Período de Extração</label>
            <Select
              options={[
                { value: "30d", label: "Últimos 30 dias" },
                { value: "90d", label: "Últimos 90 dias" },
                { value: "12m", label: "Últimos 12 meses" },
                { value: "2026", label: "Ano de 2026 completo" },
              ]}
              value={period}
              onChange={setPeriod}
            />
          </div>

          <div className={styles.filterInput}>
            <label>Formato Padrão</label>
            <Select
              options={[
                { value: "CSV", label: "CSV (Excel / Planilhas)" },
                { value: "JSON", label: "JSON (Integrações)" },
              ]}
              value="CSV"
              onChange={() => {}}
            />
          </div>
        </div>
      </Card>

      <div className={styles.templatesSection}>
        <h2>Modelos de Relatórios Disponíveis</h2>
        <div className={styles.templatesGrid}>
          {TEMPLATES.map((tmpl) => (
            <Card key={tmpl.id} className={styles.reportCard}>
              <div className={styles.cardHeader}>
                <div className={styles.reportIcon}>
                  <Icon name={tmpl.icon} size={22} />
                </div>
                <Badge variant="primary">{tmpl.category}</Badge>
              </div>
              <h3>{tmpl.title}</h3>
              <p>{tmpl.description}</p>
              <Button
                variant="primary"
                className={styles.generateBtn}
                disabled={generating === tmpl.id}
                onClick={() => handleGenerateReport(tmpl)}
              >
                <Icon name={generating === tmpl.id ? "loading-01" : "download-01"} />
                {generating === tmpl.id ? "Gerando..." : "Gerar e Baixar CSV"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Histórico de Exportações Recentes</h2>
          <div className={styles.searchWrapper}>
            <SearchInput
              placeholder="Buscar por nome ou código..."
              value={search}
              onSearch={setSearch}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome do Relatório</th>
                <th>Formato</th>
                <th>Data de Geração</th>
                <th>Tamanho</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.id}</strong></td>
                  <td>{item.name}</td>
                  <td><Badge variant="gray">{item.format}</Badge></td>
                  <td>{item.date}</td>
                  <td>{item.size}</td>
                  <td><Badge variant="success">{item.status}</Badge></td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className={styles.actionBtn}
                      title="Baixar novamente"
                      onClick={() => {
                        toast({ variant: "info", title: "Download iniciado", message: `Baixando ${item.name}` });
                      }}
                    >
                      <Icon name="download-01" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
