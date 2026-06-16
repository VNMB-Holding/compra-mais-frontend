"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge } from "@/components/ui";
import styles from "./solicitacoes-detail.module.css";

export default function SolicitacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const solId = params.id;

  return (
    <div className={styles.detailContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <span className="material-symbols-outlined">chevron_left</span> Voltar para Solicitações
      </button>

      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1>{solId || "SOL-000456"}</h1>
            <Badge variant="warning">Aguardando aprovação</Badge>
          </div>
          <p className={styles.subtitleLarge}>Óleo Diesel S10</p>
          <div className={styles.metadataTags}>
            <span className={styles.infoTag}><span className="material-symbols-outlined">domain</span> Centro de custo: Operações</span>
            <span className={styles.infoTag}><span className="material-symbols-outlined">category</span> Categoria: Combustíveis</span>
            <span className={`${styles.infoTag} ${styles.tagHigh}`}><span className="material-symbols-outlined">keyboard_double_arrow_up</span> Prioridade: Alta</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Rejeitar Demandas</Button>
          <Button variant="primary"><span className="material-symbols-outlined">check</span> Aprovar Solicitação</Button>
        </div>
      </div>

      {/* Layout de Duas Colunas */}
      <div className={styles.layout2Col}>
        
        {/* Coluna Principal (Esquerda) */}
        <div className={styles.colMain}>
          
          {/* STEPPER DE APROVAÇÃO HORIZONTAL */}
          <Card className={styles.flowCard}>
            <h4>Fluxo de Alçadas de Aprovação</h4>
            <div className={styles.stepperContainer}>
              
              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>
                  <span className="material-symbols-outlined">description</span>
                  <div className={styles.checkBadge}><span className="material-symbols-outlined">check</span></div>
                </div>
                <div className={styles.stepInfo}>
                  <strong>Solicitante</strong>
                  <span>Breno Marques</span>
                  <small>22/05/2024 14:00</small>
                </div>
              </div>
              
              <div className={`${styles.stepLine} ${styles.lineActive}`}></div>

              <div className={`${styles.step} ${styles.active}`}>
                <div className={styles.stepIcon}><span className="material-symbols-outlined">groups</span></div>
                <div className={styles.stepInfo}>
                  <strong>Gestor da Área</strong>
                  <span>Mariana Costa</span>
                  <span className={styles.warningBadgeHint}>Aguardando</span>
                </div>
              </div>

              <div className={styles.stepLine}></div>

              <div className={`${styles.step} ${styles.pending}`}>
                <div className={styles.stepIcon}><span className="material-symbols-outlined">person</span></div>
                <div className={styles.stepInfo}>
                  <strong>Diretoria Executiva</strong>
                  <span>Pendente</span>
                </div>
              </div>

            </div>
          </Card>

          {/* FICHA TÉCNICA INFORMATIVA */}
          <Card className={styles.infoCard}>
            <h4>Ficha de Informações Técnicas</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Descrição do Item</label>
                <span>Óleo Diesel S10</span>
              </div>
              <div className={`${styles.infoItem} ${styles.span2}`}>
                <label>Justificativa de Aquisição</label>
                <span>Reabastecimento estratégico da frota logística e continuidade operacional de distribuição.</span>
              </div>
              <div className={styles.infoItem}>
                <label>Volume Estimado</label>
                <strong>500.000 L</strong>
              </div>
              <div className={styles.infoItem}>
                <label>Orçamento Previsto</label>
                <strong className={styles.textPrimary}>R$ 3.250.000,00</strong>
              </div>
              <div className={styles.infoItem}>
                <label>Local de Entrega</label>
                <span>Base Operacional - Paulínia/SP</span>
              </div>
              <div className={styles.infoItem}>
                <label>Data Limite Desejada</label>
                <span>05/06/2024</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Lateral (Direita) */}
        <div className={styles.colSide}>
          
          {/* TIMELINE VERTICAL */}
          <Card className={styles.sideCard}>
            <h4>Rastreabilidade</h4>
            <div className={styles.verticalTimeline}>
              <div className={`${styles.vtItem} ${styles.vtDone}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Solicitação enviada</strong>
                  <span>Por Breno Marques</span>
                  <small>22/05/2024 às 14:00</small>
                </div>
              </div>
              <div className={`${styles.vtItem} ${styles.vtCurrent}`}>
                <div className={styles.vtDot}></div>
                <div className={styles.vtContent}>
                  <strong>Aguardando assinatura</strong>
                  <span>Mariana Costa (Gestão Geral)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* ANEXOS */}
          <Card className={styles.sideCard}>
            <h4>Arquivos e Termos Técnicos</h4>
            <div className={styles.fileRow}>
              <span className="material-symbols-outlined">picture_as_pdf</span>
              <div className={styles.fileInfo}>
                <strong>Especificacao_Tecnica_Diesel.pdf</strong>
                <small>PDF • 245 KB</small>
              </div>
              <button className={styles.downloadIconBtn} title="Baixar anexo">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
