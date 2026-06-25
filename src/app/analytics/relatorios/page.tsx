"use client";

import React, { useState } from "react";
import styles from "./relatorios.module.css";
import { useToast } from "@/contexts/ToastContext";
import {
  Card,
  Button,
  Select,
  SearchInput,
  Loading,
  Badge,
  Icon
} from "@/components/ui";

interface ReportHistoryItem {
  id: string;
  name: string;
  format: "PDF" | "XLS";
  size: string;
  date: string;
  generatedBy: string;
  status: "Pronto" | "Erro" | "Processando";
}

export default function RelatoriosPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("Últimos 30 dias");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedBuyer, setSelectedBuyer] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Loading state for each card key
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const [history, setHistory] = useState<ReportHistoryItem[]>([
    {
      id: "REP-001",
      name: "Spend Analysis - Geral Q2",
      format: "PDF",
      size: "2.4 MB",
      date: "25/06/2026 10:14",
      generatedBy: "Breno Marques",
      status: "Pronto"
    },
    {
      id: "REP-002",
      name: "SLA de Cotações - Junho",
      format: "XLS",
      size: "820 KB",
      date: "24/06/2026 15:32",
      generatedBy: "Breno Marques",
      status: "Pronto"
    },
    {
      id: "REP-003",
      name: "Matriz de Fornecedores - 2026",
      format: "PDF",
      size: "4.1 MB",
      date: "22/06/2026 09:45",
      generatedBy: "Ana Silva",
      status: "Pronto"
    }
  ]);

  const reportsTemplates = [
    {
      key: "spend",
      title: "Análise de Spend (Gastos)",
      description: "Gastos acumulados por categoria, centros de custo, desvios e perfil de despesas detalhado por comprador.",
      format: "PDF + XLS",
      icon: "bar-chart-02"
    },
    {
      key: "sla",
      title: "Desempenho de SLAs",
      description: "Ciclo de vida das cotações, gargalos operacionais e tempo de resposta por fornecedor.",
      format: "PDF",
      icon: "clock"
    },
    {
      key: "suppliers",
      title: "Qualificação de Fornecedores",
      description: "Matriz de risco, conformidade de certidões, taxas de homologação e SLAs de atendimento.",
      format: "PDF",
      icon: "check-verified-01"
    },
    {
      key: "savings",
      title: "Economia e Payback",
      description: "Savings real vs. potencial, reduções consolidadas por RFQ e ROI do processo de compras.",
      format: "XLS",
      icon: "piggy-bank-01"
    }
  ];

  const handleGenerate = (key: string, title: string) => {
    setGeneratingReport(key);
    
    // Simulate generation delay
    setTimeout(() => {
      setGeneratingReport(null);
      
      const newReport: ReportHistoryItem = {
        id: `REP-00${history.length + 1}`,
        name: `${title} - Exportado`,
        format: key === "savings" || key === "spend" ? "XLS" : "PDF",
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        date: new Date().toLocaleString("pt-BR", { hour12: false }).slice(0, 16),
        generatedBy: "Breno Marques",
        status: "Pronto"
      };

      setHistory(prev => [newReport, ...prev]);

      toast({
        variant: "success",
        title: "Download Iniciado!",
        message: `O relatório "${title}" foi gerado e baixado com sucesso.`
      });
    }, 1500);
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {generatingReport && (
        <Loading variant="fullscreen" message={`Gerando relatório de ${reportsTemplates.find(r => r.key === generatingReport)?.title}...`} />
      )}

      <div className={styles.header}>
        <div>
          <h1>Relatórios de Suprimentos</h1>
          <p>Exporte planilhas ou PDFs com análises profundas sobre as operações de compra.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterInput}>
            <label>Período</label>
            <Select 
              options={[
                { value: "30", label: "Últimos 30 dias" },
                { value: "60", label: "Últimos 60 dias" },
                { value: "ytd", label: "Este ano" }
              ]} 
              value={selectedPeriod}
              onChange={(val) => setSelectedPeriod(val)}
            />
          </div>

          <div className={styles.filterInput}>
            <label>Categoria</label>
            <Select 
              options={[
                { value: "all", label: "Todas as categorias" },
                { value: "mro", label: "MRO" },
                { value: "fuels", label: "Combustíveis" },
                { value: "services", label: "Serviços" },
                { value: "packaging", label: "Embalagens" }
              ]} 
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
            />
          </div>

          <div className={styles.filterInput}>
            <label>Comprador</label>
            <Select 
              options={[
                { value: "all", label: "Todos os compradores" },
                { value: "breno", label: "Breno Marques" },
                { value: "ana", label: "Ana Silva" }
              ]} 
              value={selectedBuyer}
              onChange={(val) => setSelectedBuyer(val)}
            />
          </div>
          
          <div className={styles.filterAction}>
            <Button variant="primary" style={{ height: "42px", width: "100%" }} onClick={() => {
              toast({
                variant: "info",
                title: "Filtros Aplicados",
                message: "A visualização de dados foi atualizada com sucesso."
              });
            }}>
              <Icon name="filter-funnel-01" size={16} />
              Filtrar
            </Button>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className={styles.templatesSection}>
        <h2>Modelos Disponíveis</h2>
        <div className={styles.templatesGrid}>
          {reportsTemplates.map((report) => (
            <Card key={report.key} className={styles.reportCard}>
              <div className={styles.cardHeader}>
                <div className={styles.reportIcon}>
                  <Icon name={report.icon} size={22} />
                </div>
                <Badge variant="gray">{report.format}</Badge>
              </div>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
              <Button 
                variant="secondary" 
                onClick={() => handleGenerate(report.key, report.title)}
                className={styles.generateBtn}
              >
                Gerar Relatório
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* History Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Histórico de Exportações</h2>
          <div className={styles.searchWrapper}>
            <SearchInput 
              placeholder="Buscar histórico..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Nome do Arquivo</th>
                <th>Formato</th>
                <th>Tamanho</th>
                <th>Data de Geração</th>
                <th>Gerado por</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>
                    <Badge variant={item.format === "PDF" ? "danger" : "success"}>
                      {item.format}
                    </Badge>
                  </td>
                  <td>{item.size}</td>
                  <td>{item.date}</td>
                  <td>{item.generatedBy}</td>
                  <td>
                    <Badge variant="success">Pronto</Badge>
                  </td>
                  <td>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => {
                        toast({
                          variant: "success",
                          title: "Download Realizado",
                          message: `O arquivo ${item.name}.${item.format.toLowerCase()} foi salvo.`
                        });
                      }}
                      title="Baixar arquivo"
                    >
                      <Icon name="download-02" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                    Nenhum relatório encontrado para a busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
