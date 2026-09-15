"use client";

import React, { useState, useMemo } from "react";
import styles from "./solicitar.module.css";
import { Icon, Badge, Select } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { formatCurrency } from "@/lib/utils/format-display";
import { COMPANY_BRANCHES } from "@/lib/constants/companies";

interface ItemDemanda {
  id: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorEstimado?: number;
  linkReferencia?: string;
}

const SETOR_OPTIONS = [
  { label: "Ministério de Louvor & Áudio / Som", value: "Louvor e Audio" },
  { label: "Ministério Infantil / Kids", value: "Ministerio Infantil" },
  { label: "Obras, Manutenção & Infraestrutura", value: "Obras e Manutencao" },
  { label: "Eventos, Conferências & Retiros", value: "Eventos" },
  { label: "Ação Social & Cantina", value: "Acao Social" },
  { label: "Secretaria & Administração", value: "Secretaria" },
  { label: "Comunicação & Mídia", value: "Midia e Comunicacao" },
  { label: "Outro Setor", value: "Geral" },
];

const PRIORIDADE_OPTIONS = [
  { label: "Normal (Média) - 7 a 15 dias", value: "Media" },
  { label: "Urgente (Alta) - até 5 dias", value: "Alta" },
  { label: "Crítica / Imediata - emergência", value: "Critica" },
  { label: "Planejada (Baixa) - sem urgência", value: "Baixa" },
];

const UNIDADE_MEDIDA_OPTIONS = [
  { label: "Unidade (UN)", value: "UN" },
  { label: "Caixa (CX)", value: "CX" },
  { label: "Metro (M)", value: "M" },
  { label: "Quilo (KG)", value: "KG" },
  { label: "Pacote (PCT)", value: "PCT" },
  { label: "Litro (L)", value: "L" },
  { label: "Par (PR)", value: "PR" },
  { label: "Serviço (SERV)", value: "SERV" },
];

export default function SolicitarPublicPage() {
  const { toast } = useToast();

  // Solicitante
  const [solicitanteNome, setSolicitanteNome] = useState("");
  const [solicitanteWhats, setSolicitanteWhats] = useState("");
  const [solicitanteEmail, setSolicitanteEmail] = useState("");
  const [setor, setSetor] = useState("Louvor e Audio");
  const [empresaCode, setEmpresaCode] = useState("PURAFE");

  // Demanda
  const [titulo, setTitulo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [prioridade, setPrioridade] = useState("Media");
  const [dataDesejada, setDataDesejada] = useState("");

  // Itens
  const [itens, setItens] = useState<ItemDemanda[]>([
    { id: 1, descricao: "", quantidade: 1, unidade: "UN", valorEstimado: 0, linkReferencia: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  const totalEstimado = useMemo(() => {
    return itens.reduce((sum, item) => {
      const q = Number(item.quantidade) || 0;
      const v = Number(item.valorEstimado) || 0;
      return sum + q * v;
    }, 0);
  }, [itens]);

  const handleAddItem = () => {
    setItens((prev) => [
      ...prev,
      { id: Date.now(), descricao: "", quantidade: 1, unidade: "UN", valorEstimado: 0, linkReferencia: "" },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    if (itens.length <= 1) return;
    setItens((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: number, field: keyof ItemDemanda, value: any) => {
    setItens((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitanteNome.trim()) {
      toast({ variant: "warning", title: "Nome obrigatório", message: "Informe quem está solicitando a compra." });
      return;
    }
    if (!solicitanteWhats.trim()) {
      toast({ variant: "warning", title: "WhatsApp obrigatório", message: "Informe seu WhatsApp para atualizações da compra." });
      return;
    }
    if (!titulo.trim()) {
      toast({ variant: "warning", title: "Título obrigatório", message: "Dê um título resumido para a compra." });
      return;
    }

    const itemVazio = itens.some((i) => !i.descricao.trim());
    if (itemVazio) {
      toast({ variant: "warning", title: "Item sem descrição", message: "Preencha o que precisa ser comprado em todos os itens." });
      return;
    }

    setSubmitting(true);
    try {
      const branchObj = COMPANY_BRANCHES.find((b) => b.code === empresaCode) || COMPANY_BRANCHES.find((b) => b.code === "PURAFE");
      const branchName = branchObj?.name || "IGREJA PURA FÉ";

      const payload: any = {
        description: titulo.trim(),
        corporateRequester: `${solicitanteNome.trim()} (${solicitanteWhats.trim()}${solicitanteEmail ? ` - ${solicitanteEmail.trim()}` : ""})`,
        notes: `Destino/Justificativa: ${justificativa.trim() || "Não informada"}\nMinistério/Setor: ${setor}\nUnidade: ${branchName}`,
        companyCode: empresaCode,
        costCenterName: setor,
        estimatedBudget: totalEstimado,
        status: "AwaitingApproval",
        requesterName: solicitanteNome.trim(),
        requesterEmail: solicitanteEmail?.trim() || undefined,
        requesterPhone: solicitanteWhats.trim(),
        department: setor,
        branchName: branchName,
        justification: justificativa.trim() || "Não informada",
        priority: prioridade,
        items: itens.map((it) => ({
          description: it.linkReferencia?.trim()
            ? `${it.descricao.trim()} (Ref: ${it.linkReferencia.trim()})`
            : it.descricao.trim(),
          quantity: Number(it.quantidade) || 1,
          unit: it.unidade || "UN",
          estimatedUnitPrice: Number(it.valorEstimado) || 0,
          costCenterName: setor,
          requiredDate: dataDesejada ? new Date(dataDesejada).toISOString() : undefined,
        })),
      };

      let res: any;
      try {
        res = await purchaseRequestsApi.createPublic(payload);
      } catch {
        // Fallback caso a rota pública esteja sendo atualizada
        res = await purchaseRequestsApi.create(payload);
      }

      const code = res?.code || `SOL-${String(Date.now()).slice(-6)}`;
      setProtocoloGerado(code);
      toast({
        variant: "success",
        title: "Solicitação Enviada!",
        message: `Protocolo ${code} registrado com sucesso para cotação.`,
      });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Erro ao enviar solicitação",
        message: err?.message || "Ocorreu um erro ao registrar sua demanda. Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyProtocol = () => {
    if (!protocoloGerado) return;
    navigator.clipboard.writeText(protocoloGerado);
    toast({
      variant: "success",
      title: "Protocolo Copiado!",
      message: `Número ${protocoloGerado} copiado para a área de transferência.`,
    });
  };

  const handleSendWhatsApp = () => {
    if (!protocoloGerado) return;
    const text = encodeURIComponent(
      `Olá! Registrei a solicitação de compra *${protocoloGerado} - ${titulo}* para a *Igreja Pura Fé* com ${itens.length} item(ns). Poderiam verificar a cotação com os fornecedores no Compra+?`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleReset = () => {
    setProtocoloGerado(null);
    setTitulo("");
    setJustificativa("");
    setDataDesejada("");
    setItens([{ id: 1, descricao: "", quantidade: 1, unidade: "UN", valorEstimado: 0, linkReferencia: "" }]);
  };

  // Se já enviou, mostra o comprovante com o protocolo
  if (protocoloGerado) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.successCard}>
            <div className={styles.successIconBadge}>
              <Icon name="check-circle-broken" size={36} />
            </div>

            <h1 className={styles.successTitle}>Solicitação Enviada!</h1>
            <p className={styles.successSubtitle}>
              <span>Sua solicitação de compra foi registrada com sucesso.</span>
              <span className={styles.extraText}> Nossa equipe irá receber sua demanda, validar o pedido e cotar com os melhores fornecedores.</span>
            </p>

            <div className={styles.protocolBox}>
              <span className={styles.protocolLabel}>Número de Protocolo Oficial</span>
              <strong className={styles.protocolNumber}>{protocoloGerado}</strong>
            </div>

            <div className={styles.successSummary}>
              <div className={styles.summaryRow}>
                <span style={{ color: "#64748b" }}>Solicitante:</span>
                <strong style={{ color: "#0f172a" }}>{solicitanteNome}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span style={{ color: "#64748b" }}>Ministério:</span>
                <strong style={{ color: "#0f172a" }}>{setor}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span style={{ color: "#64748b" }}>Total de Itens:</span>
                <strong style={{ color: "#0f172a" }}>{itens.length} item(ns)</strong>
              </div>
              {totalEstimado > 0 && (
                <div className={styles.summaryRowTotal}>
                  <span style={{ color: "#64748b" }}>Valor Estimado:</span>
                  <strong style={{ color: "#007d79", fontSize: 14 }}>{formatCurrency(totalEstimado)}</strong>
                </div>
              )}
            </div>

            <div className={styles.emailNotice}>
              <Icon name="mail-01" size={16} />
              <span>
                Notificação enviada por e-mail para a equipe de compras{solicitanteEmail ? ` (com cópia para ${solicitanteEmail})` : ""}.
              </span>
            </div>

            <div className={styles.successActions}>
              <button type="button" className={styles.btnSecondaryAction} onClick={handleCopyProtocol}>
                <Icon name="copy-01" size={16} /> Copiar Protocolo
              </button>
              <button type="button" className={styles.btnSecondaryAction} onClick={handleSendWhatsApp}>
                <Icon name="message-square-02" size={16} /> Compartilhar no WhatsApp
              </button>
              <button type="button" className={styles.btnSecondaryAction} onClick={handleReset}>
                <Icon name="plus" size={16} /> Fazer Nova Solicitação
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const branchOptions = COMPANY_BRANCHES.map((b) => ({
    label: `${b.name} (${b.acronym})`,
    value: b.code,
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brandArea}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageTitleArea}>
          <h1>Solicitação de Compras <span className={styles.extraText}>& Suprimentos</span></h1>
          <p>
            <span>Envie sua necessidade de compra para cotação e aprovação.</span>
            <span className={styles.extraText}> O pedido será processado pela equipe central de suprimentos com transparência e equalização de propostas.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Seção 1: Identificação */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Icon name="user-01" size={18} />
              </div>
              <h2>1. Quem está solicitando</h2>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>
                  Nome do Solicitante <span className={styles.extraText}>/ Responsável</span> <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pastor Marcos ou Líder Carlos"
                  className={styles.inputField}
                  value={solicitanteNome}
                  onChange={(e) => setSolicitanteNome(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  WhatsApp <span className={styles.extraText}>para Contato</span> <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="(67) 99999-9999"
                  className={styles.inputField}
                  value={solicitanteWhats}
                  onChange={(e) => setSolicitanteWhats(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>E-mail (opcional)</label>
                <input
                  type="email"
                  placeholder="seu.email@igreja.com.br"
                  className={styles.inputField}
                  value={solicitanteEmail}
                  onChange={(e) => setSolicitanteEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Ministério / Setor <span className={styles.extraText}>de Destino</span> <span className={styles.requiredAsterisk}>*</span>
                </label>
                <Select
                  options={SETOR_OPTIONS}
                  value={setor}
                  onChange={setSetor}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Unidade <span className={styles.extraText}>/ Congregação</span></label>
                <Select
                  options={branchOptions}
                  value={empresaCode}
                  onChange={setEmpresaCode}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Dados da Compra */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Icon name="file-02" size={18} />
              </div>
              <h2>2. O que precisa ser adquirido</h2>
            </div>

            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>
                  Título da Compra <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Microfones sem fio e cabos XLR para o templo principal"
                  className={styles.inputField}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>
                  Justificativa <span className={styles.extraText}>/ Finalidade</span> <span className={styles.requiredAsterisk}>*</span>
                </label>
                <textarea
                  required
                  placeholder="Explique o motivo da compra (ex: substituição de microfones com defeito para os cultos de fim de semana)..."
                  className={styles.textareaField}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Urgência / Prioridade</label>
                <Select
                  options={PRIORIDADE_OPTIONS}
                  value={prioridade}
                  onChange={setPrioridade}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Data desejada de recebimento</label>
                <input
                  type="date"
                  className={styles.inputField}
                  value={dataDesejada}
                  onChange={(e) => setDataDesejada(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Itens */}
          <div className={styles.sectionCard}>
            <div className={styles.itemsHeader}>
              <div className={styles.sectionHeaderNoBorder}>
                <div className={styles.sectionIcon}>
                  <Icon name="package" size={18} />
                </div>
                <h2>3. Itens <span className={styles.extraText}>detalhados</span> ({itens.length})</h2>
              </div>
              <button type="button" className={styles.btnAddItem} onClick={handleAddItem}>
                <Icon name="plus" size={14} /> Adicionar Item
              </button>
            </div>

            <div className={styles.itemsList}>
              {itens.map((item, idx) => (
                <div key={item.id} className={styles.itemBox}>
                  <div className={styles.itemBoxHeader}>
                    <span className={styles.itemBadgeNumber}>Item #{idx + 1}</span>
                    {itens.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnRemoveItem}
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remover este item"
                      >
                        <Icon name="trash-01" size={14} /> Remover
                      </button>
                    )}
                  </div>

                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>
                        Descrição do Material ou Serviço <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Microfone Shure SM58 sem fio UHF duplo"
                        className={styles.inputField}
                        value={item.descricao}
                        onChange={(e) => handleUpdateItem(item.id, "descricao", e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Quantidade <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        className={styles.inputField}
                        value={item.quantidade}
                        onChange={(e) => handleUpdateItem(item.id, "quantidade", Math.max(1, Number(e.target.value)))}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Unidade de Medida</label>
                      <Select
                        options={UNIDADE_MEDIDA_OPTIONS}
                        value={item.unidade}
                        onChange={(val) => handleUpdateItem(item.id, "unidade", val)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Preço Unitário Estimado <span className={styles.extraText}>(R$ - opcional)</span></label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        className={styles.inputField}
                        value={item.valorEstimado || ""}
                        onChange={(e) => handleUpdateItem(item.id, "valorEstimado", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Link de Referência <span className={styles.extraText}>/ Modelo (opcional)</span></label>
                      <input
                        type="url"
                        placeholder="https://mercadolivre.com.br/item/..."
                        className={styles.inputField}
                        value={item.linkReferencia || ""}
                        onChange={(e) => handleUpdateItem(item.id, "linkReferencia", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalEstimado > 0 && (
              <div className={styles.totalBar}>
                <span className={styles.totalLabel}>
                  Total estimado <span className={styles.extraText}>da solicitação ({itens.length} {itens.length === 1 ? "item" : "itens"})</span>:
                </span>
                <strong className={styles.totalValue}>{formatCurrency(totalEstimado)}</strong>
              </div>
            )}
          </div>

          {/* Barra de Envio */}
          <div className={styles.submitActions}>
            <button type="submit" className={styles.btnSubmit} disabled={submitting}>
              <Icon name={submitting ? "loading-01" : "send-01"} size={18} />
              {submitting ? "Enviando solicitação..." : "Enviar Solicitação de Compra"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
