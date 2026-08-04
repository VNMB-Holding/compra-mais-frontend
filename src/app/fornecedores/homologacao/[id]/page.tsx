"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Button, Badge, Icon, Loading } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./homologacao-detail.module.css";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { logError, getErrorMessage } from "@/lib/utils/error";

export default function HomologacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("visao-geral");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplier() {
      try {
        const data = await suppliersApi.getById(supplierId);
        setSupplier(data);
      } catch (err) {
        logError("fornecedores/homologacao/[id]/fetch", err);
        toast({ variant: "error", title: "Erro ao carregar fornecedor", message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    }
    fetchSupplier();
  }, [supplierId, toast]);

  if (loading) return <Loading variant="fullscreen" message="Carregando Análise..." />;
  if (!supplier) return <div style={{padding:40}}>Fornecedor não encontrado.</div>;

  const getInitials = (name: string) => name?.substring(0,2).toUpperCase() || "FR";

  return (
    <div className={styles.pageContainer}>
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

      <Card noPadding className={styles.topSummaryCard}>
        <div className={styles.summaryGrid}>
          
          <div className={styles.summaryColBase}>
            <div className={styles.avatarBig}>{getInitials(supplier.corporateName)}</div>
            <div className={styles.baseInfo}>
              <div className={styles.titleRow}>
                <h2>{supplier.corporateName}</h2>
                <Badge variant="success" className={styles.badgeVerificado}>CNPJ verificado</Badge>
              </div>
              <p className={styles.docInfo}>CNPJ: {supplier.cnpj} <span className={styles.divider}>|</span> {supplier.segment}</p>
              <div className={styles.updateInfo}>
                <span>Última análise: {new Date(supplier.updatedAt).toLocaleDateString("pt-BR")}</span>
                <button className={styles.btnRefresh}>
                  <Icon name="refresh-cw-01" size={16} /> Atualizar dados
                </button>
              </div>
            </div>
          </div>

          <div className={styles.summaryColScore}>
             <div className={styles.scoreBlock}>
                <span className={styles.scoreLabel}>Score de Risco</span>
                <div className={styles.scoreValueGroup}>
                  <span className={styles.scoreNumberSuccess}>Baixo</span>
                  <div className={styles.scoreTrendPos}><Icon name="trend-up-01" size={14}/> Seguro</div>
                </div>
             </div>
          </div>

          <div className={styles.summaryColAction}>
            <p className={styles.actionDesc}>De acordo com a política de compliance, este fornecedor está apto a operar.</p>
            <div className={styles.actionButtons}>
              <Button variant="danger" disabled><Icon name="x-circle"/> Bloquear</Button>
              <Button variant="primary"><Icon name="check-verified-01"/> Aprovar Homologação</Button>
            </div>
          </div>

        </div>
      </Card>

      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <button className={`${styles.tabBtn} ${activeTab === "visao-geral" ? styles.activeTab : ""}`} onClick={() => setActiveTab("visao-geral")}>
            Visão Geral
          </button>
          <button className={`${styles.tabBtn} ${activeTab === "financeiro" ? styles.activeTab : ""}`} onClick={() => setActiveTab("financeiro")}>
            Saúde Financeira
          </button>
          <button className={`${styles.tabBtn} ${activeTab === "certidoes" ? styles.activeTab : ""}`} onClick={() => setActiveTab("certidoes")}>
            Certidões e Docs
          </button>
          <button className={`${styles.tabBtn} ${activeTab === "socios" ? styles.activeTab : ""}`} onClick={() => setActiveTab("socios")}>
            Quadro Societário
          </button>
        </div>
      </div>

      <div className={styles.tabContentArea}>
        {activeTab === "visao-geral" && (
          <div className={styles.visaoGeralGrid}>
             <Card className={styles.dataCard}>
               <div className={styles.cardHeaderSmall}><Icon name="building-02" size={18}/> <h3>Dados Cadastrais</h3></div>
               <div className={styles.dataList}>
                 <div className={styles.dataItem}><span>Razão Social</span><strong>{supplier.corporateName}</strong></div>
                 <div className={styles.dataItem}><span>Nome Fantasia</span><strong>{supplier.tradeName}</strong></div>
                 <div className={styles.dataItem}><span>CNPJ</span><strong>{supplier.cnpj}</strong></div>
                 <div className={styles.dataItem}><span>Situação Cadastral (RFB)</span><Badge variant="success">Ativa</Badge></div>
               </div>
             </Card>

             <Card className={styles.dataCard}>
               <div className={styles.cardHeaderSmall}><Icon name="marker-pin-01" size={18}/> <h3>Localização e Contato</h3></div>
               <div className={styles.dataList}>
                 <div className={styles.dataItem}><span>Endereço Principal</span><strong>{supplier.address}</strong></div>
                 <div className={styles.dataItem}><span>CEP</span><strong>{supplier.zipCode}</strong></div>
                 <div className={styles.dataItem}><span>E-mail</span><strong>{supplier.contactEmail}</strong></div>
                 <div className={styles.dataItem}><span>Telefone</span><strong>{supplier.contactPhone}</strong></div>
               </div>
             </Card>
             
             <Card className={styles.dataCard} style={{ gridColumn: "1 / -1" }}>
               <div className={styles.cardHeaderSmall}><Icon name="alert-triangle" size={18}/> <h3>Apontamentos Restritivos</h3></div>
               <table className={styles.apontamentosTable}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Data Ocorrência</th>
                      <th>Valor</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={4} style={{textAlign: "center", color: "var(--gray-500)", padding: 24}}>Nenhum apontamento restritivo encontrado.</td></tr>
                  </tbody>
               </table>
             </Card>
          </div>
        )}

        {activeTab !== "visao-geral" && (
          <Card className={styles.placeholderCard}>
            <Icon name="tools" size={48} />
            <h3>Aba em Construção</h3>
            <p>Os detalhes aprofundados para esta seção serão exibidos aqui.</p>
          </Card>
        )}
      </div>

    </div>
  );
}
