"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Button, Badge, Icon } from "@/components/ui";
import styles from "./homologacao-detail.module.css";

export default function HomologacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("visao-geral");

  return (
    <div className={styles.pageContainer}>
      {/* 1. NAVEGAÇÃO E CABEÇALHO */}
      <div className={styles.topSection}>
        <button className={styles.backBtn} onClick={() => router.push("/fornecedores/homologacao")}>
          <Icon name="arrow-left" size={16} /> Voltar para a lista
        </button>

        <div className={styles.headerRow}>
          <div className={styles.headerTitles}>
            <h1>Homologação de Fornecedor</h1>
            <p>Análise automática e verificação de dados públicos</p>
          </div>
        </div>
      </div>

      {/* 2. CARD SUPERIOR TRIPLO (DASHBOARD SUMMARY) */}
      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>
          
          {/* Coluna 1: Info Base */}
          <div className={styles.summaryColBase}>
            <div className={styles.avatarBig}>FB</div>
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>Fornecedor Bravo LTDA</h2>
                <Badge variant="success" className={styles.badgeVerificado}>CNPJ verificado</Badge>
              </div>
              <p className={styles.docInfo}>CNPJ: 22.333.444/0001-82 <span className={styles.divider}>|</span> Combustíveis</p>
              <div className={styles.updateInfo}>
                <span>Última análise: 22/05/2024 às 14:32</span>
                <button className={styles.btnRefresh}>
                  <Icon name="refresh-cw-01" size={16} /> Atualizar dados
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 2: Score */}
          <div className={styles.summaryColScore}>
            <div className={styles.scoreHeader}>
              <span>Score de risco</span>
              <Icon name="info-circle" size={16} />
            </div>
            <div className={styles.scoreValue}>
              <strong className={styles.textGreen}>18</strong>
              <small>/100</small>
            </div>
            <Badge variant="success" className={styles.badgeScore}>Baixo risco</Badge>
          </div>

          {/* Coluna 3: Status e Stepper */}
          <div className={styles.summaryColStatus}>
            <div className={styles.statusRow}>
              <span>Status da homologação</span>
              <Badge variant="warning" className={styles.badgeEmAnalise}>Em análise</Badge>
            </div>
            <p className={styles.etapaText}>Etapa atual: Análise de dados públicos</p>
            
            <div className={styles.stepperWrapper}>
              <div className={`${styles.stepDot} ${styles.stepDone}`}></div>
              <div className={`${styles.stepLine} ${styles.lineDone}`}></div>
              <div className={`${styles.stepDot} ${styles.stepDone}`}></div>
              <div className={`${styles.stepLine} ${styles.lineDone}`}></div>
              <div className={`${styles.stepDot} ${styles.stepCurrent}`}></div>
              <div className={styles.stepLine}></div>
              <div className={styles.stepDot}></div>
              <div className={styles.stepLine}></div>
              <div className={styles.stepDot}></div>
            </div>
          </div>

        </div>
      </Card>
      {/* 4. CONTEÚDO PRINCIPAL (2 COLUNAS) */}
      <div className={styles.contentGrid}>
        
        {/* COLUNA ESQUERDA */}
        <div className={styles.leftColumn}>
          
          <Card className={styles.contentCard}>
            <h3 className={styles.cardTitle}>Resumo da análise automática</h3>
            <div className={styles.analysisList}>
              
              <div className={styles.analysisItem}>
                <div className={styles.aiLeft}>
                  <Icon name="building-01" size={20} />
                  <div>
                    <strong>Situação Cadastral</strong>
                    <p>Consulta à Receita Federal</p>
                  </div>
                </div>
                <div className={styles.aiRight}>
                  <div className={styles.badgeSuccessOutline}><Icon name="check-circle" size={16} /> Regular</div>
                  <span>22/05/2024</span>
                </div>
              </div>

              <div className={styles.analysisItem}>
                <div className={styles.aiLeft}>
                  <Icon name="scales-01" size={20} />
                  <div>
                    <strong>Restrições e Sanções</strong>
                    <p>Consulta a listas OFAC, CEIS, CNJ, TCU e Portal da Transparência</p>
                  </div>
                </div>
                <div className={styles.aiRight}>
                  <div className={styles.badgeSuccessOutline}><Icon name="check-circle" size={16} /> Nada encontrado</div>
                  <span>22/05/2024</span>
                </div>
              </div>

              <div className={styles.analysisItem}>
                <div className={styles.aiLeft}>
                  <Icon name="bank-note-01" size={20} />
                  <div>
                    <strong>Saúde Financeira</strong>
                    <p>Análise de indicadores financeiros</p>
                  </div>
                </div>
                <div className={styles.aiRight}>
                  <div className={styles.badgeSuccessOutline}><Icon name="check-circle" size={16} /> Boa</div>
                  <span>22/05/2024</span>
                </div>
              </div>

              <div className={styles.analysisItem}>
                <div className={styles.aiLeft}>
                  <Icon name="file-01" size={20} />
                  <div>
                    <strong>Notícias e Reputação</strong>
                    <p>Monitoramento de notícias e mídias</p>
                  </div>
                </div>
                <div className={styles.aiRight}>
                  <div className={styles.badgeSuccessOutline}><Icon name="check-circle" size={16} /> Sem ocorrências relevantes</div>
                  <span>22/05/2024</span>
                </div>
              </div>

              <div className={styles.analysisItem}>
                <div className={styles.aiLeft}>
                  <Icon name="bar-chart-01" size={20} />
                  <div>
                    <strong>Comportamento Comercial</strong>
                    <p>Histórico em órgãos públicos e parceiros</p>
                  </div>
                </div>
                <div className={styles.aiRight}>
                  <div className={styles.badgeSuccessOutline}><Icon name="check-circle" size={16} /> Positivo</div>
                  <span>22/05/2024</span>
                </div>
              </div>

            </div>
            <button className={styles.linkAction}>Ver detalhes de todas as análises</button>
          </Card>

        </div>

        {/* COLUNA DIREITA */}
        <div className={styles.rightColumn}>
          <Card className={styles.contentCard}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>Últimas notícias identificadas <Icon name="info-circle" size={16} style={{ marginLeft: 6 }} /></h3>
              <button className={styles.linkAction}>Ver todas</button>
            </div>
            
            <div className={styles.newsItem}>
              <div className={styles.newsLogo}>exame.</div>
              <div className={styles.newsContent}>
                <div className={styles.newsSource}>EXAME <span>22/05/2024 • 10:15</span></div>
                <strong>Setor de combustíveis apresenta crescimento de 8,2% no primeiro trimestre</strong>
                <p>Análise do mercado indica recuperação consistente do setor...</p>
              </div>
              <div className={styles.badgeNeutral}>Neutra</div>
            </div>
          </Card>

          <Card className={styles.contentCard}>
            <h3 className={styles.cardTitle}>Fontes consultadas <Icon name="info-circle" size={16} style={{ marginLeft: 6 }} /></h3>
            
            <div className={styles.sourcesGrid}>
              <div className={styles.sourceBox}>
                <div className={styles.sourceIconBox}>
                  <Icon name="bank" size={20} />
                </div>
                <span>Receita Federal</span>
              </div>
              
              <div className={styles.sourceBox}>
                <div className={styles.sourceIconBox}>
                  <Icon name="building-01" size={20} />
                </div>
                <span>Portal da Transparência</span>
              </div>
              
              <div className={styles.sourceBox}>
                <div className={styles.sourceIconBox}>
                  <Icon name="bank" size={20} />
                </div>
                <span>CEIS</span>
              </div>
              
              <div className={styles.sourceBox}>
                <div className={styles.sourceIconBox}>
                  <strong>CNJ</strong>
                </div>
                <span>CNJ</span>
              </div>
              
              <div className={styles.sourceBox}>
                <div className={styles.sourceIconBox}>
                  <strong>TCU</strong>
                </div>
                <span>TCU</span>
              </div>
              
              <div className={styles.sourceBox}>
                <div className={styles.sourceIconBox}>
                  <strong>+12</strong>
                </div>
                <span>Outras fontes</span>
              </div>
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
}
