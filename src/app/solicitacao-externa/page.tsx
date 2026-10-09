"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import styles from "./solicitacao-externa.module.css";
import { Icon, Select } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { CatalogItem } from "@/lib/api/items";
import { formatCurrency } from "@/lib/utils/format-display";
import { maskPhone } from "@/lib/utils/masks";
import { COMPANY_BRANCHES, findCompanyBranch } from "@/lib/constants/companies";

interface ItemDemanda {
  id: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorEstimado?: number;
  linkReferencia?: string;
  catalogItemId?: string;
  fornecedorBase?: string;
}

const SETOR_OPTIONS = [
  { label: "Administração Geral", value: "Administracao" },
  { label: "Operações & Campo", value: "Operacoes" },
  { label: "Obras, Manutenção & Infraestrutura", value: "Obras e Manutencao" },
  { label: "Tecnologia da Informação (TI)", value: "TI" },
  { label: "Marketing, Comunicação & Mídia", value: "Midia e Comunicacao" },
  { label: "Eventos & Treinamentos", value: "Eventos" },
  { label: "Financeiro & Contabilidade", value: "Financeiro" },
  { label: "Recursos Humanos & DP", value: "RH" },
  { label: "Logística & Suprimentos", value: "Logistica" },
  { label: "Outro Setor / Geral", value: "Geral" },
];

const PRIORIDADE_OPTIONS = [
  { label: "Normal (Média) - 7 a 15 dias", value: "Media" },
  { label: "Urgente (Alta) - até 5 dias", value: "Alta" },
  { label: "Crítica / Imediata - emergência", value: "Critica" },
  { label: "Planejada (Baixa) - sem urgência", value: "Baixa" },
];

const BIZ_API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api-compramais.vnmbholding.com"
).replace(/\/+$/, "");
function normalizeIdentityText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolveSetorFromIdentity(department?: string) {
  const normalizedDepartment = normalizeIdentityText(department);
  if (!normalizedDepartment) return undefined;

  return SETOR_OPTIONS.find((option) => {
    const normalizedLabel = normalizeIdentityText(option.label);
    const normalizedValue = normalizeIdentityText(option.value);
    return (
      normalizedValue === normalizedDepartment ||
      normalizedLabel === normalizedDepartment ||
      normalizedLabel.includes(normalizedDepartment) ||
      normalizedDepartment.includes(normalizedValue)
    );
  })?.value;
}

async function requestCatalogItems(
  endpoint: string,
  init?: RequestInit,
): Promise<CatalogItem[] | CatalogItem | null> {
  const response = await fetch(`${BIZ_API_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) return null;
  return response.json();
}

async function loadCatalogItems(query = ""): Promise<CatalogItem[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length >= 2
      ? `/api/items/public/search?q=${encodeURIComponent(trimmed)}`
      : "/api/items/public";

  const data = await requestCatalogItems(endpoint);
  return Array.isArray(data) ? data.slice(0, 20) : [];
}

function normalizeCatalogDescription(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function createPublicCatalogItem(item: ItemDemanda, category: string): Promise<CatalogItem> {
  const description = item.descricao.trim();
  const matches = await loadCatalogItems(description);
  const exactMatch = matches.find(
    (catalogItem) =>
      normalizeCatalogDescription(catalogItem.description) ===
      normalizeCatalogDescription(description),
  );
  if (exactMatch) return exactMatch;

  const created = await requestCatalogItems("/api/items/public", {
    method: "POST",
    body: JSON.stringify({
      description,
      category,
      unit: item.unidade || "UN",
      lastUnitPrice: Number(item.valorEstimado) || undefined,
      notes: item.linkReferencia?.trim()
        ? `Cadastrado via solicitação externa. Referência: ${item.linkReferencia.trim()}`
        : "Cadastrado via solicitação externa.",
    }),
  });

  if (!created || Array.isArray(created)) {
    throw new Error(`Não foi possível cadastrar o item "${description}" no catálogo.`);
  }

  return created;
}
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

export default function SolicitacaoExternaPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [solicitanteNome, setSolicitanteNome] = useState("");
  const [solicitanteWhats, setSolicitanteWhats] = useState("");
  const [solicitanteEmail, setSolicitanteEmail] = useState("");
  const [setor, setSetor] = useState("Administracao");
  const [empresaCode, setEmpresaCode] = useState("");

  const [titulo, setTitulo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [observacao, setObservacao] = useState("");
  const [localEntrega, setLocalEntrega] = useState("");
  const [prioridade, setPrioridade] = useState("Media");
  const [dataDesejada, setDataDesejada] = useState("");

  const [itens, setItens] = useState<ItemDemanda[]>([
    { id: 1, descricao: "", quantidade: 1, unidade: "UN", valorEstimado: 0, linkReferencia: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);
  const [activeSearchItemId, setActiveSearchItemId] = useState<number | null>(null);
  const [suggestedItems, setSuggestedItems] = useState<CatalogItem[]>([]);
  const [loadingSearchItemId, setLoadingSearchItemId] = useState<number | null>(null);
  const [identityApplied, setIdentityApplied] = useState(false);
  const searchRequestRef = useRef(0);

  const applyIdentityData = useCallback(
    (overwrite = false) => {
      if (!user) return;

      if (overwrite || !solicitanteNome.trim()) setSolicitanteNome(user.name || "");
      if (overwrite || !solicitanteEmail.trim()) setSolicitanteEmail(user.email || "");

      const setorFromIdentity = resolveSetorFromIdentity(user.department);
      if (setorFromIdentity && (overwrite || setor === "Administracao")) {
        setSetor(setorFromIdentity);
      }

      const branchFromIdentity =
        findCompanyBranch(user.tenantId) || findCompanyBranch(user.tenantName);
      if (branchFromIdentity && overwrite) {
        setEmpresaCode(branchFromIdentity.code);
      }

      setIdentityApplied(true);
    },
    [setor, solicitanteEmail, solicitanteNome, user],
  );

  useEffect(() => {
    if (!user || identityApplied) return;
    applyIdentityData(false);
  }, [user, identityApplied, applyIdentityData]);

  const handleIdentityAction = () => {
    if (!user) {
      window.location.href = "/login?redirect=/solicitacao-externa";
      return;
    }

    applyIdentityData(true);
    toast({
      variant: "success",
      title: "Dados carregados",
      message: "Preenchi os campos disponíveis na sua conta.",
    });
  };

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
      {
        id: Date.now(),
        descricao: "",
        quantidade: 1,
        unidade: "UN",
        valorEstimado: 0,
        linkReferencia: "",
      },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    if (itens.length <= 1) return;
    setItens((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: number, field: keyof ItemDemanda, value: any) => {
    setItens((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleDescriptionChange = async (id: number, value: string) => {
    handleUpdateItem(id, "descricao", value);
    setItens((prev) =>
      prev.map((it) =>
        it.id === id && it.catalogItemId
          ? { ...it, catalogItemId: undefined, fornecedorBase: undefined }
          : it,
      ),
    );
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    if (value.trim().length < 2) {
      setActiveSearchItemId(null);
      setSuggestedItems([]);
      setLoadingSearchItemId(null);
      return;
    }

    setActiveSearchItemId(id);
    setLoadingSearchItemId(id);
    try {
      const results = await loadCatalogItems(value.trim());
      if (searchRequestRef.current === requestId) {
        setSuggestedItems(results || []);
      }
    } catch {
      if (searchRequestRef.current === requestId) {
        setSuggestedItems([]);
      }
    } finally {
      if (searchRequestRef.current === requestId) {
        setLoadingSearchItemId(null);
      }
    }
  };

  const handleCatalogInputFocus = async (id: number, value: string) => {
    setActiveSearchItemId(id);
    if (suggestedItems.length > 0) return;

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setLoadingSearchItemId(id);

    try {
      const results = await loadCatalogItems(value.trim());
      if (searchRequestRef.current === requestId) {
        setSuggestedItems(results || []);
      }
    } catch {
      if (searchRequestRef.current === requestId) {
        setSuggestedItems([]);
      }
    } finally {
      if (searchRequestRef.current === requestId) {
        setLoadingSearchItemId(null);
      }
    }
  };
  const handleSelectCatalogItem = (id: number, catalogItem: CatalogItem) => {
    const fornecedorBase =
      catalogItem.lastSupplier?.tradeName || catalogItem.lastSupplier?.corporateName;
    const lastPrice = catalogItem.lastUnitPrice ? Number(catalogItem.lastUnitPrice) : 0;

    setItens((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              descricao: catalogItem.description,
              unidade: catalogItem.unit || it.unidade,
              valorEstimado: lastPrice > 0 ? lastPrice : it.valorEstimado,
              catalogItemId: catalogItem.id,
              fornecedorBase,
            }
          : it,
      ),
    );

    setActiveSearchItemId(null);
    setSuggestedItems([]);
    setLoadingSearchItemId(null);
  };

  const selectedBranch = COMPANY_BRANCHES.find((b) => b.code === empresaCode);
  const branchName = selectedBranch?.name || "Empresa";

  const setorObj = SETOR_OPTIONS.find((s) => s.value === setor);
  const setorNomeFormatado = setorObj?.label || setor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitanteNome.trim()) {
      toast({
        variant: "warning",
        title: "Nome obrigatório",
        message: "Informe quem está solicitando a compra.",
      });
      return;
    }
    if (!solicitanteWhats.trim()) {
      toast({
        variant: "warning",
        title: "WhatsApp obrigatório",
        message: "Informe seu WhatsApp para atualizações da compra.",
      });
      return;
    }
    if (!solicitanteEmail.trim() || !solicitanteEmail.includes("@")) {
      toast({
        variant: "warning",
        title: "E-mail obrigatório",
        message: "Informe um e-mail válido para receber o protocolo e atualizações da compra.",
      });
      return;
    }
    if (!empresaCode) {
      toast({
        variant: "warning",
        title: "Empresa obrigatória",
        message: "Selecione a empresa/unidade para onde a solicitação deve ser enviada.",
      });
      return;
    }

    if (!titulo.trim()) {
      toast({
        variant: "warning",
        title: "Título obrigatório",
        message: "Dê um título resumido para a compra.",
      });
      return;
    }

    const itemVazio = itens.some((i) => !i.descricao.trim());
    if (itemVazio) {
      toast({
        variant: "warning",
        title: "Item sem descrição",
        message: "Preencha o que precisa ser comprado em todos os itens.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const catalogItemsByDemandId = new Map<number, CatalogItem>();
      for (const item of itens) {
        if (item.catalogItemId) continue;
        const catalogItem = await createPublicCatalogItem(item, setorNomeFormatado);
        catalogItemsByDemandId.set(item.id, catalogItem);
      }

      const itensComCatalogo: ItemDemanda[] = itens.map((item) => {
        const catalogItem = catalogItemsByDemandId.get(item.id);
        return catalogItem
          ? {
              ...item,
              catalogItemId: catalogItem.id,
              unidade: catalogItem.unit || item.unidade,
              valorEstimado: catalogItem.lastUnitPrice
                ? Number(catalogItem.lastUnitPrice)
                : item.valorEstimado,
            }
          : item;
      });

      const payload: any = {
        description: titulo.trim(),
        corporateRequester: `${solicitanteNome.trim()} (${solicitanteWhats.trim()}${solicitanteEmail ? ` - ${solicitanteEmail.trim()}` : ""})`,
        notes: observacao.trim() || undefined,
        companyCode: empresaCode,
        costCenterName: setorNomeFormatado,
        costCenterCode: setor,
        estimatedBudget: totalEstimado,
        status: "AwaitingApproval",
        requesterName: solicitanteNome.trim(),
        requesterEmail: solicitanteEmail?.trim() || undefined,
        requesterPhone: solicitanteWhats.trim(),
        department: setorNomeFormatado,
        branchName: branchName,
        justification: justificativa.trim() || undefined,
        deliveryLocation: localEntrega.trim() || undefined,
        priority:
          prioridade === "Critica"
            ? "Critical"
            : prioridade === "Alta"
              ? "High"
              : prioridade === "Baixa"
                ? "Low"
                : "Medium",
        items: itensComCatalogo.map((it) => ({
          description: it.linkReferencia?.trim()
            ? `${it.descricao.trim()} (Ref: ${it.linkReferencia.trim()})`
            : it.descricao.trim(),
          quantity: Number(it.quantidade) || 1,
          unit: it.unidade || "UN",
          estimatedUnitPrice: Number(it.valorEstimado) || 0,
          catalogItemId: it.catalogItemId || undefined,
          costCenterName: setorNomeFormatado,
          costCenterCode: setor,
          requiredDate: dataDesejada ? new Date(dataDesejada).toISOString() : undefined,
        })),
      };

      const res = await purchaseRequestsApi.createPublic(payload);
      const code = res?.code;
      if (!code) {
        throw new Error("O servidor não retornou o código da solicitação criada.");
      }
      setItens(itensComCatalogo);
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
      `Olá! Registrei a solicitação de compra *${protocoloGerado} - ${titulo}* para a unidade *${branchName}* com ${itens.length} item(ns). Poderiam verificar a cotação com os fornecedores no Compra+?`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleReset = () => {
    setProtocoloGerado(null);
    setTitulo("");
    setJustificativa("");
    setDataDesejada("");
    setEmpresaCode("");
    setItens([
      { id: 1, descricao: "", quantidade: 1, unidade: "UN", valorEstimado: 0, linkReferencia: "" },
    ]);
  };

  if (protocoloGerado) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <div className={styles.brandDivider} />
            <span className={styles.portalBadge}>Solicitação Externa</span>
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
              <span className={styles.extraText}>
                {" "}
                Nossa equipe irá receber sua demanda, validar o pedido e cotar com os melhores
                fornecedores.
              </span>
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
                <span style={{ color: "#64748b" }}>Àrea / Setor:</span>
                <strong style={{ color: "#0f172a" }}>{setorNomeFormatado}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span style={{ color: "#64748b" }}>Empresa / Unidade:</span>
                <strong style={{ color: "#0f172a" }}>{branchName}</strong>
              </div>
              {justificativa && (
                <div className={styles.summaryRow}>
                  <span style={{ color: "#64748b" }}>Destino / Justificativa:</span>
                  <strong style={{ color: "#0f172a" }}>{justificativa}</strong>
                </div>
              )}
              {localEntrega && (
                <div className={styles.summaryRow}>
                  <span style={{ color: "#64748b" }}>Local de Entrega:</span>
                  <strong style={{ color: "#0f172a" }}>{localEntrega}</strong>
                </div>
              )}
              {observacao && (
                <div className={styles.summaryRow}>
                  <span style={{ color: "#64748b" }}>Observações:</span>
                  <strong style={{ color: "#0f172a" }}>{observacao}</strong>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span style={{ color: "#64748b" }}>Total de Itens:</span>
                <strong style={{ color: "#0f172a" }}>{itens.length} item(ns)</strong>
              </div>
              {totalEstimado > 0 && (
                <div className={styles.summaryRowTotal}>
                  <span style={{ color: "#64748b" }}>Valor Estimado:</span>
                  <strong style={{ color: "#007d79", fontSize: 14 }}>
                    {formatCurrency(totalEstimado)}
                  </strong>
                </div>
              )}
            </div>

            <div className={styles.emailNotice}>
              <Icon name="mail-01" size={16} />
              <span>
                Notificação enviada por e-mail para a equipe de compras e com cópia para{" "}
                <strong>{solicitanteEmail}</strong>.
              </span>
            </div>

            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.btnSecondaryAction}
                onClick={handleCopyProtocol}
              >
                <Icon name="copy-01" size={16} /> Copiar Protocolo
              </button>
              <button
                type="button"
                className={styles.btnSecondaryAction}
                onClick={handleSendWhatsApp}
              >
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
          <div className={styles.brandDivider} />
          <span className={styles.portalBadge}>Solicitação Externa</span>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.accountAction}
            onClick={handleIdentityAction}
            disabled={authLoading}
          >
            <Icon name={user ? "user-check-01" : "login-01"} size={14} />
            {user ? "Usar meus dados" : "Possui conta?"}
          </button>
          <span className={styles.securityTag}>
            <Icon name="shield-tick" size={14} /> Portal Seguro
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageTitleArea}>
          <h1>
            Solicitação Externa de Compras <span className={styles.extraText}>& Suprimentos</span>
          </h1>
          <p>
            <span>Envie sua necessidade de compra para cotação e aprovação corporativa.</span>
            <span className={styles.extraText}>
              {" "}
              O pedido será processado pela equipe central de suprimentos com transparência e
              equalização de propostas.
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
                  Nome do Solicitante <span className={styles.extraText}>/ Responsável</span>{" "}
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva ou Maria Souza"
                  className={styles.inputField}
                  value={solicitanteNome}
                  onChange={(e) => setSolicitanteNome(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  WhatsApp <span className={styles.extraText}>para Contato</span>{" "}
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="(67) 99999-9999"
                  className={styles.inputField}
                  value={solicitanteWhats}
                  onChange={(e) => setSolicitanteWhats(maskPhone(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  E-mail <span className={styles.extraText}>Corporativo</span>{" "}
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com.br"
                  className={styles.inputField}
                  value={solicitanteEmail}
                  onChange={(e) => setSolicitanteEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Àrea / Setor <span className={styles.extraText}>de Destino</span>{" "}
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
                <Select
                  options={SETOR_OPTIONS}
                  value={setor}
                  onChange={setSetor}
                  triggerClassName={styles.selectTrigger}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>
                  Empresa / Unidade <span className={styles.requiredAsterisk}>*</span>
                </label>
                <Select
                  options={branchOptions}
                  value={empresaCode}
                  onChange={setEmpresaCode}
                  placeholder="Selecione a empresa/unidade"
                  triggerClassName={styles.selectTrigger}
                />
              </div>
            </div>
          </div>

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
                  placeholder="Ex: Peças de reposição, ferramentas ou insumos de escritório"
                  className={styles.inputField}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>
                  Justificativa <span className={styles.extraText}>/ Finalidade</span>{" "}
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
                <textarea
                  required
                  placeholder="Explique o motivo da compra (ex: reposição de estoque, manutenção emergencial ou novos equipamentos)..."
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
                  triggerClassName={styles.selectTrigger}
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

              <div className={styles.formGroup}>
                <label>
                  Local de Entrega / Almoxarifado <span className={styles.extraText}>(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Almoxarifado Central, Fazenda Santa Fé..."
                  className={styles.inputField}
                  value={localEntrega}
                  onChange={(e) => setLocalEntrega(e.target.value)}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>
                  Observações Gerais <span className={styles.extraText}>/ Instruções Adicionais (opcional)</span>
                </label>
                <textarea
                  placeholder="Informações adicionais para a equipe de compras, especificações complementares, etc..."
                  className={styles.textareaField}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.itemsHeader}>
              <div className={styles.sectionHeaderNoBorder}>
                <div className={styles.sectionIcon}>
                  <Icon name="package" size={18} />
                </div>
                <h2>
                  3. Itens <span className={styles.extraText}>detalhados</span> ({itens.length})
                </h2>
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
                        Descrição do Material ou Serviço{" "}
                        <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <div className={styles.catalogAutocompleteWrapper}>
                        <input
                          type="text"
                          required
                          placeholder="Digite para buscar itens já cadastrados..."
                          readOnly={Boolean(item.catalogItemId)}
                          className={styles.inputField}
                          value={item.descricao}
                          onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                          onFocus={() => handleCatalogInputFocus(item.id, item.descricao)}
                        />
                        {loadingSearchItemId === item.id && (
                          <span
                            className={styles.catalogInputSpinner}
                            aria-label="Buscando itens cadastrados"
                          />
                        )}
                        {activeSearchItemId === item.id && !loadingSearchItemId && (
                          <div className={styles.catalogSuggestions}>
                            {suggestedItems.length > 0 ? (
                              suggestedItems.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  className={styles.catalogSuggestionItem}
                                  onClick={() => handleSelectCatalogItem(item.id, suggestion)}
                                >
                                  <span className={styles.catalogSuggestionMain}>
                                    <strong>{suggestion.description}</strong>
                                    <small>
                                      {[
                                        suggestion.code,
                                        suggestion.category || "Geral",
                                        suggestion.unit,
                                      ]
                                        .filter(Boolean)
                                        .join(" Ã¢â‚¬Â¢ ")}
                                    </small>
                                  </span>
                                  {suggestion.lastUnitPrice && (
                                    <span className={styles.catalogSuggestionPrice}>
                                      {formatCurrency(Number(suggestion.lastUnitPrice))}
                                    </span>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className={styles.catalogEmptySuggestion}>
                                Nenhum item encontrado.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {item.catalogItemId && (
                        <div className={styles.catalogSelectedNotice}>
                          <Icon name="check-circle" size={14} />
                          <span>
                            Item selecionado do catálogo. Descrição, unidade e preço base foram bloqueados
                            {item.fornecedorBase ? ` com base em ${item.fornecedorBase}` : ""}.
                          </span>
                        </div>
                      )}
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
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "quantidade",
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Unidade de Medida</label>
                      <Select
                        options={UNIDADE_MEDIDA_OPTIONS}
                        value={item.unidade}
                        onChange={(val) => handleUpdateItem(item.id, "unidade", val)}
                        disabled={Boolean(item.catalogItemId)}
                        triggerClassName={styles.selectTrigger}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Preço Unitário Estimado{" "}
                        <span className={styles.extraText}>(R$ - opcional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        className={styles.inputField}
                        value={item.valorEstimado || ""}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "valorEstimado",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        readOnly={Boolean(item.catalogItemId)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Link de Referência{" "}
                        <span className={styles.extraText}>/ Modelo (opcional)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://mercadolivre.com.br/item/..."
                        className={styles.inputField}
                        value={item.linkReferencia || ""}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "linkReferencia", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalEstimado > 0 && (
              <div className={styles.totalBar}>
                <span className={styles.totalLabel}>
                  Total estimado{" "}
                  <span className={styles.extraText}>
                    da solicitação ({itens.length} {itens.length === 1 ? "item" : "itens"})
                  </span>
                  :
                </span>
                <strong className={styles.totalValue}>{formatCurrency(totalEstimado)}</strong>
              </div>
            )}
          </div>

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
