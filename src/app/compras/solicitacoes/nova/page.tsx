"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon } from "@/components/ui";
import styles from "./solicitacoes-new.module.css";

export default function NovaSolicitacaoPage() {
  const router = useRouter();

  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/solicitacoes")}>
        <Icon name="chevron-left" /> Voltar para Solicitações
      </button>

      <div className={styles.pageHeader}>
        <h1>Nova Solicitação de Compra</h1>
        <p>Preencha os detalhes técnicos e financeiros do item ou serviço necessário para a operação.</p>
      </div>

      <Card className={styles.formCard}>
        
        <div className={styles.formSection}>
          <h3>Informações Básicas da Demanda</h3>
          <div className={`${styles.formGroup} ${styles.mb16}`}>
            <label>Descrição do Item / Serviço *</label>
            <input type="text" className={styles.formControl} placeholder="Ex: Óleo Diesel S10, Manutenção de Motores, etc." />
          </div>
          <div className={styles.formGroup}>
            <label>Justificativa do Pedido *</label>
            <textarea className={styles.formControl} rows={3} placeholder="Descreva o motivo estratégico desta aquisição para a governança aprovar..." />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Classificação, Volumes e Orçamento</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Categoria de Compras</label>
              <select className={styles.formControl}>
                <option>Combustíveis</option>
                <option>Lubrificantes</option>
                <option>MRO / Peças</option>
                <option>Serviços Gerais</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Prioridade do Processo</label>
              <select className={styles.formControl}>
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Quantidade Estimada</label>
              <input type="number" className={styles.formControl} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Unidade de Medida</label>
              <select className={styles.formControl}>
                <option>Litros (L)</option>
                <option>Unidade (UN)</option>
                <option>Quilogramas (KG)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Valor Estimado Total (R$)</label>
              <input type="text" className={styles.formControl} placeholder="R$ 0,00" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Logística de Recebimento</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Prazo Desejado de Entrega</label>
              <input type="date" className={styles.formControl} />
            </div>
            <div className={styles.formGroup}>
              <label>Local de Entrega / Unidade</label>
              <select className={styles.formControl}>
                <option>Base Operacional - Paulínia/SP</option>
                <option>Matriz - São Paulo/SP</option>
                <option>Filial - Campinas/SP</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button className={styles.btnCancel} onClick={() => router.push("/compras/solicitacoes")}>Cancelar</button>
          <Button variant="primary" className={styles.btnSubmit} onClick={() => router.push("/compras/solicitacoes")}>
            <Icon name="send-01" /> Enviar para Aprovação
          </Button>
        </div>

      </Card>
    </div>
  );
}
