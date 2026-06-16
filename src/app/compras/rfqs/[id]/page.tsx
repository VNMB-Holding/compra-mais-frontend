"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge } from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import styles from "./rfq-detail.module.css";

interface ItemRow {
  codigo: string;
  nome: string;
  especificacao: string;
  unidade: string;
  quantidade: string;
  centroCusto: string;
}

export default function RfqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id;

  const [activeTab, setActiveTab] = useState<"resumo" | "itens" | "historico">("resumo");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("Alfa");

  const itensList: ItemRow[] = [
    { codigo: "01", nome: "Óleo Diesel S10", especificacao: "Refinado automotivo de alta fluidez.", unidade: "Litros (L)", quantidade: "500.000", centroCusto: "Logística Geral" }
  ];

  const itensColumns: ColumnDef<ItemRow>[] = [
    { header: "Item", cell: (row) => <span className={styles.boldCode}>{row.codigo}</span> },
    { header: "Especificação", cell: (row) => <><strong>{row.nome}</strong> - {row.especificacao}</> },
    { header: "Unidade", accessorKey: "unidade" },
    { header: "Quantidade", accessorKey: "quantidade" },
    { header: "Centro de Custo", accessorKey: "centroCusto" }
  ];

  return (
    <div className={styles.detailContainer}>
      
      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <span className="material-symbols-outlined">chevron_left</span>
        Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div className={styles.headerTitles}>
          <div className={styles.titleRow}>
            <h1>{rfqId || "RFQ-2026-002"}</h1>
            <Badge variant="success">Aberta</Badge>
          </div>
          <p className={styles.subtitleLarge}>Óleo Diesel S10</p>
          <div className={styles.metadataRow}>
            <span><span className="material-symbols-outlined">category</span> Combustíveis</span>
            <span><span className="material-symbols-outlined">person</span> Criada por Maria Costa</span>
            <span><span className="material-symbols-outlined">calendar_today</span> 22/05/2024</span>
            <span><span className="material-symbols-outlined">schedule</span> Encerramento: 24/05/2024 às 14:00</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Encerrar RFQ</Button>
          <Button variant="primary"><span className="material-symbols-outlined">edit</span> Editar</Button>
        </div>
      </div>

      <div className={styles.pageTabs}>
        <span className={activeTab === "resumo" ? styles.tabActive : ""} onClick={() => setActiveTab("resumo")}>Resumo Executivo & Matriz</span>
        <span className={activeTab === "itens" ? styles.tabActive : ""} onClick={() => setActiveTab("itens")}>Itens Solicitados</span>
        <span className={activeTab === "historico" ? styles.tabActive : ""} onClick={() => setActiveTab("historico")}>Histórico & Anexos</span>
      </div>

      {activeTab === "resumo" && (
        <div className={styles.tabLayoutFade}>
          
          <div className={styles.rfqMetricsGrid}>
            <Card noPadding className={`${styles.metricCard} ${styles.darkCard}`}>
              <div className={styles.darkCardContent}>
                <div className={styles.metricTop}>
                  <span>Economia Potencial</span>
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <h3>R$ 32.450</h3>
                <span className={styles.subTextDark}>24,7% vs. referência</span>
              </div>
            </Card>

            <Card className={styles.metricCard}>
              <span className={styles.label}>Menor preço</span>
              <h3 className={styles.textPrimary}>R$ 5,89</h3>
              <span className={styles.sub}>Fornecedor Bravo</span>
            </Card>

            <Card className={styles.metricCard}>
              <span className={styles.label}>Média das propostas</span>
              <h3>R$ 6,08</h3>
              <span className={styles.sub}>Base: 4 propostas</span>
            </Card>

            <Card className={styles.metricCard}>
              <span className={styles.label}>Melhor condition</span>
              <h3>30 dias</h3>
              <span className={styles.sub}>Fornecedor Alfa</span>
            </Card>
          </div>

          <Card className={styles.recommendationCard}>
            <div className={styles.recMainRow}>
              <div className={styles.recLeftBlock}>
                <div className={styles.recBadgeRow}>
                  <div className={styles.recIconCircle}>
                    <span className="material-symbols-outlined">workspace_premium</span>
                  </div>
                  <span className={styles.blueTagText}>Recomendação automática</span>
                </div>
                <h3>Fornecedor Bravo oferece a melhor proposta.</h3>
                <p>Menor preço, menor frete e menor prazo de entrega.</p>
              </div>
            </div>
          </Card>

          <Card noPadding className={styles.compareCard}>
            <div className={styles.cardHeaderFlex}>
              <div>
                <h4>Matriz de Equalização Comercial</h4>
                <p>Valores consolidados com impostos e fretes inclusos para tomada de decisão.</p>
              </div>
              <div className={styles.tableActionRow}>
                <Button variant="primary" onClick={() => setIsModalOpen(true)} className={styles.launchBtnStyle}>
                  <span className="material-symbols-outlined">mail</span> Lançar Preços do E-mail
                </Button>
                <Button variant="secondary">
                  <span className="material-symbols-outlined">download</span> Exportar Planilha
                </Button>
              </div>
            </div>

            <div className={styles.compareTableWrapper}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th className={styles.rowHeader}>Critérios Analisados</th>
                    <th>Fornecedor Alfa</th>
                    <th className={styles.winnerHeaderCol}>
                      <div className={styles.winnerBadgeTip}>MELHOR OPÇÃO</div>
                      Fornecedor Bravo
                    </th>
                    <th>Fornecedor Charlie</th>
                    <th>Fornecedor Delta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.rowHeader}>Preço Unitário Líquido</td>
                    <td className={styles.mutedCellText}>R$ 5,95</td>
                    <td className={styles.winnerCellSuccess}>R$ 5,89</td>
                    <td className={styles.mutedCellText}>R$ 6,10</td>
                    <td className={styles.dangerCellText}>R$ 6,40</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>Custo de Frete (FOB)</td>
                    <td className={styles.mutedCellText}>R$ 0,25</td>
                    <td className={styles.winnerCellSuccess}>R$ 0,20</td>
                    <td className={styles.mutedCellText}>R$ 0,30</td>
                    <td className={styles.mutedCellText}>R$ 0,25</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>Prazo de Entrega</td>
                    <td className={styles.mutedCellText}>2 dias</td>
                    <td className={styles.winnerCellSuccess}>1 dia</td>
                    <td className={styles.mutedCellText}>2 dias</td>
                    <td className={styles.dangerCellText}>3 dias</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>Condição de Faturamento</td>
                    <td className={styles.mutedCellText}>30 dias DDL</td>
                    <td className={styles.winnerCellNormal}>30 dias DDL</td>
                    <td className={styles.specialCellSuccess}>45 dias DDL</td>
                    <td className={styles.mutedCellText}>30 dias DDL</td>
                  </tr>
                  <tr className={styles.totalRow}>
                    <td className={styles.rowHeaderTotal}>Custo Total Equalizado</td>
                    <td className={styles.totalMutedText}>R$ 6,20</td>
                    <td className={styles.winnerCellTotal}>R$ 6,09</td>
                    <td className={styles.totalMutedText}>R$ 6,40</td>
                    <td className={styles.totalDangerText}>R$ 6,65</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "itens" && (
        <div className={styles.tabLayoutFade}>
          <Card noPadding>
            <div className={styles.cardHeaderFlex}>
              <h4>Itens Vinculados ao Processo</h4>
            </div>
            <DataTable data={itensList} columns={itensColumns} />
          </Card>
        </div>
      )}

      {activeTab === "historico" && (
        <div className={styles.tabLayoutFade}>
          <div className={styles.historicoGrid}>
            <Card className={styles.historyCard}>
              <h4>Linha do Tempo do Processo</h4>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}></div>
                  <div className={styles.timelineContent}>
                    <strong>Processo Criado</strong>
                    <p>Maria Costa iniciou a requisição no sistema.</p>
                    <small>22/05/2024 às 09:30</small>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}></div>
                  <div className={styles.timelineContent}>
                    <strong>Disparado para o Mercado</strong>
                    <p>6 fornecedores homologados foram convidados via portal.</p>
                    <small>22/05/2024 às 10:00</small>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.historyCard}>
              <h4>Documentos e Anexos Técnicos</h4>
              <p className={styles.anexoIntro}>Arquivos oficiais anexados à cotação:</p>
              <div className={styles.anexoRow}>
                <span className="material-symbols-outlined">description</span>
                <div className={styles.anexoInfo}>
                  <strong>Termo_de_Referencia_Diesel.pdf</strong>
                  <small>PDF • 2.4 MB</small>
                </div>
                <Button variant="secondary">Baixar</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Lançar Proposta Comercial Recebida</h3>
              <span className={`material-symbols-outlined ${styles.closeModal}`} onClick={() => setIsModalOpen(false)}>close</span>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalContext}>Insira as condições e valores contidos na planilha ou e-mail enviado pelo parceiro.</p>
              
              <div className={styles.modalField}>
                <label>Selecione o Fornecedor Convidado</label>
                <select className={styles.modalInput} value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                  <option value="Alfa">Fornecedor Alfa S.A.</option>
                  <option value="Bravo">Fornecedor Bravo LTDA</option>
                  <option value="Charlie">Fornecedor Charlie</option>
                  <option value="Delta">Fornecedor Delta</option>
                </select>
              </div>

              <div className={styles.modalRowFields}>
                <div className={styles.modalField}>
                  <label>Preço Unitário Líquido (R$)</label>
                  <input type="text" className={styles.modalInput} placeholder="Ex: 5,89" />
                </div>
                <div className={styles.modalField}>
                  <label>Custo de Frete Unitário (R$)</label>
                  <input type="text" className={styles.modalInput} placeholder="Ex: 0,20" />
                </div>
              </div>

              <div className={styles.modalRowFields}>
                <div className={styles.modalField}>
                  <label>Prazo de Entrega (Dias)</label>
                  <input type="number" className={styles.modalInput} placeholder="Ex: 1" />
                </div>
                <div className={styles.modalField}>
                  <label>Prazo de Faturamento (DDL)</label>
                  <input type="text" className={styles.modalInput} placeholder="Ex: 30 dias" />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelModalBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">save</span> Consolidar Proposta
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
