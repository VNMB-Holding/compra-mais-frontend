"use client";

import React, { useState, useEffect } from "react";
import styles from "./relatorios.module.css";
import { Card, Button, Badge, Icon, Select, SearchInput, CalendarFilter, DateFilterValue } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { getCompanyFilterOptions } from "@/lib/utils/tenant";
import { dashboardApi } from "@/lib/api/dashboard";
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
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    mode: "range",
    preset: "30d",
  });
  const [reportFormat, setReportFormat] = useState<"XLSX" | "PDF" | "CSV">("XLSX");
  const [search, setSearch] = useState<string>("");
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: orders = [] } = usePurchaseOrders();
  const { data: requests = [] } = usePurchaseRequests();
  const { data: rfqs = [] } = useRfqs();

  const companyOptions = getCompanyFilterOptions();

  const [history, setHistory] = useState<GeneratedReport[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("compra_mais_reports_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
    }
  }, []);

  const saveHistory = (updated: GeneratedReport[]) => {
    setHistory(updated);
    try {
      localStorage.setItem("compra_mais_reports_history", JSON.stringify(updated));
    } catch {
    }
  };

  const downloadCSV = (filename: string, rows: string[][]) => {
    if (!rows || rows.length === 0) {
      toast({
        variant: "warning",
        title: "Relatório vazio",
        message: "Não há dados para exportar neste relatório.",
      });
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename.endsWith(".csv") ? filename : `${filename}.csv`}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    setGenerating(template.id);
    const companyCode = selectedCompany !== "TODAS" ? selectedCompany : undefined;
    const startDate = dateFilter.startDate;
    const endDate = dateFilter.endDate;
    const period = dateFilter.preset;

    try {
      if (reportFormat === "XLSX" || reportFormat === "PDF") {
        const fmt = reportFormat === "XLSX" ? "excel" : "pdf";
        const downloadedFilename = await dashboardApi.downloadReportFile(
          template.type,
          fmt,
          companyCode,
          startDate,
          endDate,
          period
        );
        const newReport: GeneratedReport = {
          id: `REL-${String(Date.now()).slice(-6)}`,
          name: `${template.title} (${selectedCompany === "TODAS" ? "Geral" : selectedCompany})`,
          format: reportFormat,
          date: new Date().toLocaleDateString("pt-BR"),
          size: reportFormat === "XLSX" ? "48 KB" : "64 KB",
          status: "Disponível",
          data: [],
        };
        saveHistory([newReport, ...history]);
        toast({
          variant: "success",
          title: "Download Concluído!",
          message: `Arquivo ${downloadedFilename} exportado com sucesso.`,
        });
        return;
      }

      let rows: string[][] = [];
      let filename = `Relatorio_${template.type}_${Date.now()}`;
      let reportName = `${template.title} (${selectedCompany === "TODAS" ? "Geral" : selectedCompany})`;

      try {
        const res = await dashboardApi.generateReport(template.type, companyCode, startDate, endDate, period);
        if (res && res.rows && res.rows.length > 0) {
          rows = res.rows;
          filename = res.filename || filename;
          reportName = res.name || reportName;
        }
      } catch {
        const matchesDate = (createdAt?: string | Date) => {
          if (!createdAt) return true;
          if (dateFilter.mode === "all") return true;
          const dStr = new Date(createdAt).toISOString().slice(0, 10);
          if (startDate && dStr < startDate) return false;
          if (endDate && dStr > endDate) return false;
          return true;
        };

        if (template.type === "orders") {
          filename = "Relatorio_Pedidos_Compra";
          const filteredOrders = orders.filter((po) => matchesDate(po.createdAt));
          rows = [
            ["Código", "Fornecedor", "CNPJ", "Valor Total (R$)", "Condição Pagamento", "Frete", "Status", "Data Emissão"],
            ...filteredOrders.map((po) => [
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
          const filteredRequests = requests.filter((r) => matchesDate(r.createdAt));
          rows = [
            ["ID Solicitação", "Descrição", "Centro de Custo", "Empresa", "Valor Estimado (R$)", "Status", "Data"],
            ...filteredRequests.map((r) => [
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
          const filteredRfqs = rfqs.filter((rfq) => matchesDate(rfq.createdAt));
          rows = [
            ["Código RFQ", "Título", "Status", "Data Fechamento", "Data Criação"],
            ...filteredRfqs.map((rfq) => [
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
            ["Iniciativa", "Categoria", "Fornecedor", "Valor Economizado (R$)", "Data"],
          ];
        }
      }

      downloadCSV(filename, rows);

      const newReport: GeneratedReport = {
        id: `REL-${String(Date.now()).slice(-6)}`,
        name: reportName,
        format: "CSV",
        date: new Date().toLocaleDateString("pt-BR"),
        size: `${Math.max(12, Math.round(rows.length * 0.4))} KB`,
        status: "Disponível",
        data: rows,
      };

      saveHistory([newReport, ...history]);

      toast({
        variant: "success",
        title: "Relatório gerado pelo servidor!",
        message: `O arquivo ${filename}.csv foi baixado com sucesso.`,
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
            <label>Data / Período de Extração</label>
            <CalendarFilter
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>

          <div className={styles.filterInput}>
            <label>Formato Padrão</label>
            <Select
              options={[
                { value: "XLSX", label: "Excel (.xlsx) - Formatado" },
                { value: "PDF", label: "Documento PDF (.pdf)" },
                { value: "CSV", label: "CSV (Planilhas / Texto)" },
              ]}
              value={reportFormat}
              onChange={(val) => setReportFormat(val)}
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
                {generating === tmpl.id ? "Gerando..." : `Gerar e Baixar ${reportFormat}`}
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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-tertiary)" }}>
                    Nenhum relatório gerado recentemente neste dispositivo. Selecione um modelo acima e clique em &quot;Gerar e Baixar CSV&quot;.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
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
                          if (item.data && item.data.length > 0) {
                            downloadCSV(item.name.replace(/\s+/g, "_"), item.data);
                            toast({
                              variant: "success",
                              title: "Download Iniciado",
                              message: `Baixando arquivo de ${item.name}`,
                            });
                          } else {
                            toast({
                              variant: "warning",
                              title: "Dados indisponíveis",
                              message: "Este relatório não possui linhas armazenadas para reexportação.",
                            });
                          }
                        }}
                      >
                        <Icon name="download-01" size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
