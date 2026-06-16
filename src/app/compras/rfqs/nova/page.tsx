"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import styles from "./rfq-new.module.css";

interface FornecedorConvidado {
  id: string;
  nome: string;
  cnpj: string;
}

interface ItemSolicitado {
  id: string;
  descricao: string;
  qtd: number;
  unidade: string;
}

export default function NewRfqPage() {
  const router = useRouter();

  const [solicitacaoVinculada, setSolicitacaoVinculada] = useState<string>("");
  const [tituloRfq, setTituloRfq] = useState<string>("");
  const [dataEncerramento, setDataEncerramento] = useState<string>("");
  const [incoterm, setIncoterm] = useState<string>("CIF");
  const [condicaoPagamento, setCondicaoPagamento] = useState<string>("30 dias DDL");
  const [moeda, setMoeda] = useState<string>("BRL");
  const [observacoes, setObservacoes] = useState<string>("");

  const [fornecedores] = useState<FornecedorConvidado[]>([
    { id: "1", nome: "Fornecedor Alfa S.A.", cnpj: "11.222.333/0001-81" },
    { id: "2", nome: "Fornecedor Bravo LTDA", cnpj: "22.333.444/0001-82" }
  ]);

  const [itens, setItens] = useState<ItemSolicitado[]>([
    { id: "1", descricao: "Filtro de Ar Motor X1", qtd: 50, unidade: "UN" }
  ]);

  const handleVincularSolicitacao = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSolicitacaoVinculada(val);

    if (val === "SOL-000456") {
      setTituloRfq("RFQ - Fornecimento de Óleo Diesel S10");
      setIncoterm("CIF");
      setCondicaoPagamento("30 dias DDL");
      setMoeda("BRL");
      setObservacoes("O fornecedor deve possuir certificação ANP ativa e atender às normas ambientais vigentes de transporte.");
      setItens([{ id: "sol-1", descricao: "Óleo Diesel S10", qtd: 500000, unidade: "Litros (L)" }]);
    } else {
      setTituloRfq("");
      setObservacoes("");
      setItens([{ id: "1", descricao: "Filtro de Ar Motor X1", qtd: 50, unidade: "UN" }]);
    }
  };

  const gerarMensagemHumana = () => {
    const dataLimite = dataEncerramento
      ? new Date(dataEncerramento).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      : "[Data Limite]";

    let blocoItens = "";
    itens.forEach(item => {
      blocoItens += `• ${item.descricao} — ${item.qtd.toLocaleString("pt-BR")} ${item.unidade}\n`;
    });

    return `Olá, tudo bem?

Estamos iniciando uma nova cotação aqui na VNMB HOLDING e, como vocês são parceiros homologados da nossa base, gostaríamos muito de receber a proposta de vocês para este fornecimento.

Dá uma olhada nos detalhes do escopo:

${blocoItens}
Diretrizes comerciais do processo:
- Modalidade de frete: ${incoterm}
- Condição de faturamento: ${condicaoPagamento}
- Moeda base: ${moeda}
${observacoes ? `\nNota técnica do solicitante:\n"${observacoes}"\n` : ""}
Você conseguiria me retornar com as condições comerciais e valores precificados até o dia ${dataLimite}?

Qualquer dúvida ou desalinhamento com o escopo técnico, pode me acionar respondendo diretamente por aqui.

Um abraço,
Breno Marques
Suprimentos | VNMB HOLDING`;
  };

  const handleCopiarMensagem = () => {
    navigator.clipboard.writeText(gerarMensagemHumana());
    alert("Convite copiado para transferência!");
  };

  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <span className="material-symbols-outlined">chevron_left</span> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <h1>Nova Cotação</h1>
        <p>Configure a parametrização do mercado e vincule demandas internas de suprimentos.</p>
      </div>

      <div className={styles.formGridLayout}>

        <Card className={styles.formCard}>
          <div className={styles.formSection}>
            <h3>1. Vincular Demanda Interna</h3>
            <div className={styles.formGroup}>
              <label>Solicitação de Compra Aprovada</label>
              <select className={styles.formControl} value={solicitacaoVinculada} onChange={handleVincularSolicitacao}>
                <option value="">Nenhuma (Cotação Direta / Avulsa)</option>
                <option value="SOL-000456">SOL-000456 — Óleo Diesel S10 (Aprovada)</option>
              </select>
            </div>

            {solicitacaoVinculada && (
              <div className={styles.summaryBox}>
                <span className="material-symbols-outlined">lock</span>
                <div>
                  <strong>{itens[0]?.descricao}</strong> — {itens[0]?.qtd.toLocaleString("pt-BR")} {itens[0]?.unidade}
                  <small>Dados protegidos contra alteração (Origem: {solicitacaoVinculada})</small>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formSection}>
            <h3>2. Parâmetros Gerais</h3>
            <div className={`${styles.formGroup} ${styles.mb16}`}>
              <label>Título da RFQ *</label>
              <input type="text" className={styles.formControl} value={tituloRfq} onChange={(e) => setTituloRfq(e.target.value)} placeholder="Ex: Fornecimento Anual de Combustíveis Geral" />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Estratégia de Compra</label>
                <select className={styles.formControl}>
                  <option>Menor Preço Equalizado</option>
                  <option>Técnica e Preço</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Data/Hora Limite</label>
                <input type="datetime-local" className={styles.formControl} value={dataEncerramento} onChange={(e) => setDataEncerramento(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>3. Compliance & Logística</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Incoterm (Frete)</label>
                <select className={styles.formControl} value={incoterm} onChange={(e) => setIncoterm(e.target.value)}>
                  <option value="CIF">CIF (Custos e frete pagos pelo fornecedor)</option>
                  <option value="FOB">FOB (Frete sob coleta e conta da VNMB)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Prazo de Faturamento</label>
                <input type="text" className={styles.formControl} value={condicaoPagamento} onChange={(e) => setCondicaoPagamento(e.target.value)} placeholder="Ex: 30 dias DDL" />
              </div>
            </div>
            <div className={`${styles.formGroup} ${styles.mt16}`}>
              <label>Notas Técnicas Gerais</label>
              <textarea className={styles.formControl} rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Cláusulas de barreiras, horários de recebimento..." />
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.btnCancel} onClick={() => router.push("/compras/rfqs")}>Cancelar</button>
            <Button variant="primary" className={styles.btnSubmit} onClick={() => router.push("/compras/rfqs")}>
              <span className="material-symbols-outlined">rocket_launch</span> Publicar e Enviar Cotação
            </Button>
          </div>
        </Card>

        <Card className={styles.emailCard}>
          <div className={styles.emailHeader}>
            <div className={styles.windowDots}>
              <span className={`${styles.dot} ${styles.dotR}`}></span>
              <span className={`${styles.dot} ${styles.dotY}`}></span>
              <span className={`${styles.dot} ${styles.dotG}`}></span>
            </div>
            <button className={styles.emailCopyBtn} onClick={handleCopiarMensagem}>
              <span className="material-symbols-outlined">content_copy</span> Copiar
            </button>
          </div>
          <div className={styles.emailMeta}>
            <div><strong>De:</strong> suprimentos@vnmb.com.br</div>
            <div><strong>Para:</strong> fornecedores-selecionados@base.com</div>
            <div><strong>Assunto:</strong> {tituloRfq || "[Inserir Assunto do Processo]"}</div>
          </div>
          <div className={styles.emailBody}>
            {gerarMensagemHumana().split("\n").map((paragraph, index) => (
              <p key={index}>{paragraph || <br />}</p>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
