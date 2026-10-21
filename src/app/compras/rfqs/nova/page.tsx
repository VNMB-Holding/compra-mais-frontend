"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Button,
  Icon,
  Select,
  Badge,
  Skeleton,
  EmptyState,
  MarketplaceLogo,
} from "@/components/ui";
import { InviteSupplierModal } from "@/components/modals";

import { purchaseRequestsApi, PurchaseRequest } from "@/lib/api/purchase-requests";
import { suppliersApi, Supplier } from "@/lib/api/suppliers";
import { rfqsApi } from "@/lib/api/rfqs";
import { itemsApi } from "@/lib/api/items";
import { formatUserDisplayName, formatCurrency } from "@/lib/utils/format-display";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { useTour } from "@/hooks/useTour";
import { novaRfqTour } from "@/lib/tours";
import styles from "./rfq-new.module.css";
import { logError, getErrorMessage } from "@/lib/utils/error";
import { formatPriority } from "@/lib/constants/status";
import {
  getCompanyFilterOptions,
  resolvePurchaseRequestBranch,
  isPuraFeUser,
} from "@/lib/utils/tenant";
import { parseItemDescription, detectMarketplaceFromUrl } from "@/lib/utils/item-description";

interface Solicitacao {
  id: string;
  codigo?: string;
  titulo: string;
  area: string;
  solicitante: string;
  prioridade: string;
  valorEstimado: number;
  itens: ItemCotacao[];
  incoterm: string;
  condicaoPagamento: string;
  observacoes: string;
  empresa?: string;
  companyCode?: string;
  availableItemsCount?: number;
  totalItemsCount?: number;
}

interface ItemCotacao {
  id: number;
  originalId?: string;
  descricao: string;
  qtd: number;
  unidade: string;
  category?: string;
  activeRfqCode?: string;
  isOccupied?: boolean;
}

interface FornecedorConvidado {
  id: string;
  nome: string;
  cnpj: string;
  segmento?: string;
  isHomologado?: boolean;
  selecionado: boolean;
}

const PRIORITY_CLASS: Record<string, string> = {
  Alta: styles.priorityAlta,
  Critica: styles.priorityCritica,
  Crítica: styles.priorityCritica,
  Media: styles.priorityMedia,
  Média: styles.priorityMedia,
  Baixa: styles.priorityBaixa,
};

const PRIORITY_BADGE_CONFIG: Record<
  string,
  { variant: "gray" | "warning" | "danger" | "dark"; icon: string }
> = {
  Critica: { variant: "dark", icon: "zap" },
  Crítica: { variant: "dark", icon: "zap" },
  Critical: { variant: "dark", icon: "zap" },
  Alta: { variant: "danger", icon: "alert-triangle" },
  High: { variant: "danger", icon: "alert-triangle" },
  Media: { variant: "warning", icon: "clock" },
  Média: { variant: "warning", icon: "clock" },
  Medium: { variant: "warning", icon: "clock" },
  Baixa: { variant: "gray", icon: "info-circle" },
  Low: { variant: "gray", icon: "info-circle" },
};

export default function NewRfqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const paramSol =
    searchParams.get("solicitationId") ??
    searchParams.get("sol") ??
    searchParams.get("solicitacao") ??
    "";
  const paramMode = searchParams.get("mode") ?? "";
  const paramTitulo = searchParams.get("titulo") ?? "";
  const paramValor = searchParams.get("valor") ?? "";
  const paramPrioridade = searchParams.get("prioridade") ?? "";
  const paramArea = searchParams.get("area") ?? "";
  const paramSolicitante = searchParams.get("solicitante") ?? "";

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<string>("");
  const [solicitacaoConfirmada, setSolicitacaoConfirmada] = useState<Solicitacao | null>(null);
  const [rfqModality, setRfqModality] = useState<"standard" | "links">(
    paramMode === "links" ? "links" : "standard",
  );

  useEffect(() => {
    if (paramMode === "links") {
      setRfqModality("links");
    }
  }, [paramMode]);

  const [currentStep, setCurrentStep] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [tituloRfq, setTituloRfq] = useState("");

  const [estrategia, setEstrategia] = useState("Menor Preço Equalizado");
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [incoterm, setIncoterm] = useState("CIF");
  const [condicaoPagamento, setCondicaoPagamento] = useState("30 dias DDL");
  const [moeda, setMoeda] = useState("BRL");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [selectedScopeItemIds, setSelectedScopeItemIds] = useState<number[]>([]);

  const toggleItemSelection = (id: number) => {
    setSelectedScopeItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAllAvailable = () => {
    const available = itens.filter((i) => !i.isOccupied).map((i) => i.id);
    setSelectedScopeItemIds(available);
  };

  const handleDeselectAll = () => {
    setSelectedScopeItemIds([]);
  };
  const [fornecedores, setFornecedores] = useState<FornecedorConvidado[]>([]);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierFilterTab, setSupplierFilterTab] = useState<"todos" | "selecionados">("todos");
  const [supplierPage, setSupplierPage] = useState(1);
  const SUPPLIERS_PER_PAGE = 8;
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleSupplierInvited = (newSup: any) => {
    const convidado: FornecedorConvidado = {
      id: newSup.id || `sup-conv-${Date.now()}`,
      nome: newSup.corporateName || newSup.tradeName || "Fornecedor Convidado",
      cnpj: newSup.cnpj || "—",
      segmento: newSup.segment || "Convidado Externo",
      isHomologado: true,
      selecionado: true,
    };
    setFornecedores((prev) => [convidado, ...prev]);
    setIsInviteModalOpen(false);
  };

  const [addingQuickSuppliers, setAddingQuickSuppliers] = useState(false);

  const handleAddQuickOptions = async (
    presets: { corporateName: string; cnpj: string; segment: string; contactEmail: string }[],
  ) => {
    setAddingQuickSuppliers(true);
    try {
      const addedList: FornecedorConvidado[] = [];
      for (let i = 0; i < presets.length; i++) {
        const p = presets[i];
        const existing = fornecedores.find(
          (f) => f.nome.toLowerCase() === p.corporateName.toLowerCase() || (p.cnpj && f.cnpj === p.cnpj),
        );
        if (existing) {
          addedList.push({ ...existing, selecionado: true });
          continue;
        }

        let created: any = null;
        try {
          created = await suppliersApi.create({
            cnpj: p.cnpj,
            corporateName: p.corporateName,
            tradeName: p.corporateName,
            contactEmail: p.contactEmail,
            segment: p.segment,
            status: "Active",
          });
        } catch {
          created = {
            id: `quick-sup-${Date.now()}-${i}`,
            corporateName: p.corporateName,
            cnpj: p.cnpj,
            segment: p.segment,
          };
        }

        addedList.push({
          id: created?.id || `quick-sup-${Date.now()}-${i}`,
          nome: created?.corporateName || p.corporateName,
          cnpj: created?.cnpj || p.cnpj,
          segmento: p.segment,
          isHomologado: true,
          selecionado: true,
        });
      }

      setFornecedores((prev) => {
        const map = new Map<string, FornecedorConvidado>();
        for (const item of addedList) {
          map.set(item.id, item);
        }
        for (const f of prev) {
          if (map.has(f.id)) {
            map.set(f.id, { ...f, selecionado: true });
          } else {
            map.set(f.id, f);
          }
        }
        return Array.from(map.values());
      });

      toast({
        variant: "success",
        title: "Opções de cotação adicionadas!",
        message: `${presets.length} opção(ões) adicionadas e selecionadas para registrar os links/orçamentos.`,
      });
    } finally {
      setAddingQuickSuppliers(false);
    }
  };

  const isPuraFe = useMemo(() => isPuraFeUser(user), [user]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() =>
    isPuraFeUser(user) ? "PURAFE" : "TODAS",
  );

  useEffect(() => {
    if (isPuraFe) {
      setSelectedCompanyId("PURAFE");
    }
  }, [isPuraFe]);

  const companyOptions = useMemo(() => getCompanyFilterOptions(user), [user]);

  const [requestsApi, setRequestsApi] = useState<Solicitacao[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadApiData = React.useCallback(async () => {
    setLoadingData(true);
    try {
      const filterCompany = isPuraFe
        ? "PURAFE"
        : selectedCompanyId !== "TODAS"
          ? selectedCompanyId
          : undefined;

      const [reqs, sups] = await Promise.all([
        purchaseRequestsApi.list(filterCompany ? { companyCode: filterCompany } : undefined),
        suppliersApi.list(filterCompany ? { companyCode: filterCompany } : undefined),
      ]);

      if (reqs && reqs.length > 0) {
        const isApprovedStatus = (s?: string) => {
          if (!s) return false;
          const lower = String(s).toLowerCase().trim();
          return (
            lower === "approved" ||
            lower === "aprovada" ||
            lower === "aprovado" ||
            lower === "inquote" ||
            lower === "em cotação" ||
            lower === "em cotacao"
          );
        };

        const eligibleReqs = reqs.filter((r) => {
          if (!isApprovedStatus(r.status)) return false;
          const items = r.items || [];
          if (items.length === 0) return false;

          const hasAvailableItem = items.some((it) => {
            if (!r.rfqs || r.rfqs.length === 0) return true;
            return !r.rfqs.some((q: any) => {
              const qs = (q.status || "").toLowerCase().trim();
              const isActive =
                qs !== "cancelled" && qs !== "cancelada" && qs !== "draft" && qs !== "rascunho";
              if (!isActive) return false;
              if (q.selectedItemIds && q.selectedItemIds.length > 0) {
                return q.selectedItemIds.includes(it.id);
              }
              return true;
            });
          });

          return hasAvailableItem;
        });

        const mappedReqs: Solicitacao[] = eligibleReqs.map((r) => {
          const mappedItens: ItemCotacao[] = (r.items || []).map((it, idx) => {
            let activeRfqCode: string | undefined;
            if (r.rfqs && r.rfqs.length > 0) {
              const activeRfq = r.rfqs.find((q: any) => {
                const qs = (q.status || "").toLowerCase().trim();
                const isActive =
                  qs !== "cancelled" && qs !== "cancelada" && qs !== "draft" && qs !== "rascunho";
                if (!isActive) return false;
                if (q.selectedItemIds && q.selectedItemIds.length > 0) {
                  return q.selectedItemIds.includes(it.id);
                }
                return true;
              });
              if (activeRfq) {
                activeRfqCode = activeRfq.code;
              }
            }

            return {
              id: idx + 1,
              originalId: it.id,
              descricao: parseItemDescription(it.description, (it as any).referenceUrl).cleanDescription,
              qtd: Number(it.quantity) || 1,
              unidade: it.unit || "UN",
              category: (it as any).category || (it as any).costCenterName,
              activeRfqCode,
              isOccupied: Boolean(activeRfqCode),
            };
          });

          const availableCount = mappedItens.filter((i) => !i.isOccupied).length;

          return {
            id: r.id,
            codigo: r.corporateCode ? `#${r.corporateCode}` : r.code || r.id,
            titulo: r.description || r.notes || "Demanda de Compra",
            area: (r as any).department || "Operações",
            solicitante:
              r.corporateRequester || r.requesterName || formatUserDisplayName(r.requesterId, user),
            prioridade: formatPriority((r as any).priority || (r as any).prioridade),
            valorEstimado: Number(r.estimatedBudget) || 0,
            itens: mappedItens,
            availableItemsCount: availableCount,
            totalItemsCount: mappedItens.length,
            incoterm: "CIF",
            condicaoPagamento: "30 dias DDL",
            observacoes: r.notes || "",
            empresa: resolvePurchaseRequestBranch(r, user),
            companyCode: r.companyCode,
          };
        });

        setRequestsApi(mappedReqs);
      } else {
        setRequestsApi([]);
      }

      if (sups && sups.length > 0) {
        const domainFilteredSups = sups.filter((s) => {
          const isSupPuraFe =
            s.companyCode === "PURAFE" ||
            s.tenantId === "PURAFE" ||
            (s.corporateName || "").toLowerCase().includes("pura fe") ||
            (s.corporateName || "").toLowerCase().includes("pura fé");
          if (isPuraFe) return isSupPuraFe;
          return true;
        });

        const mappedSups: FornecedorConvidado[] = domainFilteredSups.map((s) => ({
          id: s.id,
          nome: s.corporateName || s.tradeName || "Fornecedor",
          cnpj: s.cnpj,
          segmento: s.segment || "Geral",
          isHomologado: s.status === "Active" || s.isActive === true,
          selecionado: false,
        }));
        setFornecedores(mappedSups);
      } else {
        setFornecedores([]);
      }
    } catch (e) {
      logError("rfqs/nova/loadApiData", e);
      toast({
        variant: "error",
        title: "Erro ao Carregar Dados",
        message:
          getErrorMessage(e) ||
          "Não foi possível carregar as solicitações e fornecedores para abertura de cotação.",
      });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast, isPuraFe, selectedCompanyId]);

  useEffect(() => {
    loadApiData();
  }, [loadApiData]);

  const displayRequests = useMemo(() => {
    if (selectedCompanyId === "TODAS") return requestsApi;
    return requestsApi.filter((s) => s.companyCode === selectedCompanyId);
  }, [requestsApi, selectedCompanyId]);

  const { startTour, isTourCompleted } = useTour();

  useEffect(() => {
    if (!loadingData && !isTourCompleted("nova-rfq-intro")) {
      const timer = setTimeout(() => {
        startTour(novaRfqTour);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loadingData, isTourCompleted, startTour]);

  const initialTourStateRef = React.useRef<{
    solicitacaoConfirmada: Solicitacao | null;
    currentStep: number;
  } | null>(null);

  useEffect(() => {
    const handleTourStepChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ step: number; ensureDemandLinked?: boolean }>;
      if (customEvent.detail) {
        if (!initialTourStateRef.current) {
          initialTourStateRef.current = {
            solicitacaoConfirmada,
            currentStep,
          };
        }

        if (customEvent.detail.ensureDemandLinked && !solicitacaoConfirmada) {
          const sol = requestsApi[0] || {
            id: "sol-tour-mock",
            codigo: "SOL-2026-DEMO",
            titulo: "Demanda Demonstrativa para Cotação",
            area: "Operações & Logística",
            solicitante: "Gestor de Compras",
            prioridade: "Média",
            valorEstimado: 25000,
            itens: [
              { id: 1, descricao: "Válvulas Reguladoras Industriais DN50", qtd: 10, unidade: "UN" },
              { id: 2, descricao: "Tubulação de Alta Pressão em Inox 316L", qtd: 50, unidade: "M" },
            ],
            incoterm: "CIF",
            condicaoPagamento: "30 dias DDL",
            observacoes: "Material com certificação ISO 9001 e laudo de rastreabilidade.",
          };
          setSolicitacaoConfirmada(sol);
          setSolicitacaoSelecionada(sol.id);
          setTituloRfq(`RFQ — ${sol.titulo}`);
          setIncoterm(sol.incoterm || "CIF");
          setCondicaoPagamento(sol.condicaoPagamento || "30 dias DDL");
          setObservacoes(sol.observacoes || "");
          setItens(sol.itens.map((i) => ({ ...i })));
          if (sol.itens.length > 0) setExpandedItemId(sol.itens[0].id);
        }
        if (typeof customEvent.detail.step === "number") {
          setCurrentStep(customEvent.detail.step);
        }
      }
    };

    const handleTourReset = () => {
      if (initialTourStateRef.current) {
        if (!initialTourStateRef.current.solicitacaoConfirmada) {
          handleDesvincular();
        } else {
          setCurrentStep(1);
        }
        initialTourStateRef.current = null;
      } else {
        setCurrentStep(1);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("rfq-tour-set-step", handleTourStepChange);
    window.addEventListener("rfq-tour-reset", handleTourReset);
    return () => {
      window.removeEventListener("rfq-tour-set-step", handleTourStepChange);
      window.removeEventListener("rfq-tour-reset", handleTourReset);
    };
  }, [requestsApi, solicitacaoConfirmada, currentStep]);

  useEffect(() => {
    if (!paramSol || loadingData) return;

    const solExistente = requestsApi.find(
      (s) => s.id === paramSol || s.codigo === paramSol || (s as any).code === paramSol,
    );

    if (solExistente) {
      setSolicitacaoConfirmada(solExistente);
      setSolicitacaoSelecionada(solExistente.id);
      setTituloRfq(`RFQ — ${solExistente.titulo}`);
      setIncoterm(solExistente.incoterm);
      setCondicaoPagamento(solExistente.condicaoPagamento);
      setObservacoes(solExistente.observacoes);
      setItens(solExistente.itens.map((i) => ({ ...i })));
      if (solExistente.itens.length > 0) {
        setExpandedItemId(solExistente.itens[0].id);
      }
    } else if (paramSol) {
      purchaseRequestsApi
        .getById(paramSol)
        .then((r) => {
          if (r) {
            const mapped: Solicitacao = {
              id: r.id,
              codigo: r.corporateCode ? `#${r.corporateCode}` : r.code || r.id,
              titulo: r.description || r.notes || "Demanda de Compra",
              area: (r as any).department || "Operações",
              solicitante: r.corporateRequester || r.requesterName || "Solicitante",
              prioridade: formatPriority((r as any).priority || (r as any).prioridade),
              valorEstimado: Number(r.estimatedBudget) || 0,
              itens: (r.items || []).map((it, idx) => ({
                id: idx + 1,
                descricao: parseItemDescription(it.description, (it as any).referenceUrl).cleanDescription,
                qtd: Number(it.quantity) || 1,
                unidade: it.unit || "UN",
              })),
              incoterm: "CIF",
              condicaoPagamento: "30 dias DDL",
              observacoes: r.notes || "",
              empresa: resolvePurchaseRequestBranch(r, user),
              companyCode: r.companyCode,
            };
            setRequestsApi((prev) =>
              prev.some((x) => x.id === mapped.id) ? prev : [mapped, ...prev],
            );
            setSolicitacaoConfirmada(mapped);
            setSolicitacaoSelecionada(mapped.id);
            setTituloRfq(`RFQ — ${mapped.titulo}`);
            setIncoterm(mapped.incoterm);
            setCondicaoPagamento(mapped.condicaoPagamento);
            setObservacoes(mapped.observacoes);
            setItens(mapped.itens.map((i) => ({ ...i })));
            const defaultAvailable = mapped.itens.filter((i) => !i.isOccupied).map((i) => i.id);
            setSelectedScopeItemIds(defaultAvailable);
            if (mapped.itens.length > 0) {
              setExpandedItemId(mapped.itens[0].id);
            }
          }
        })
        .catch(() => {
          toast({
            variant: "warning",
            title: "Solicitação não elegível",
            message:
              "A solicitação informada ainda não foi aprovada ou já possui uma cotação aberta.",
          });
        });
    }
    setCurrentStep(1);
  }, [paramSol, requestsApi, loadingData, user, toast]);

  const handleConfirmarSolicitacao = () => {
    const sol = requestsApi.find((s) => s.id === solicitacaoSelecionada);
    if (!sol) return;
    setSolicitacaoConfirmada(sol);
    setTituloRfq(`RFQ — ${sol.titulo}`);
    setIncoterm(sol.incoterm);
    setCondicaoPagamento(sol.condicaoPagamento);
    setObservacoes(sol.observacoes);
    setItens(sol.itens.map((i) => ({ ...i })));
    const defaultAvailable = sol.itens.filter((i) => !i.isOccupied).map((i) => i.id);
    setSelectedScopeItemIds(defaultAvailable);
    setCurrentStep(1);
    if (sol.itens.length > 0) {
      setExpandedItemId(sol.itens[0].id);
    }

    (async () => {
      try {
        const catalogItems = await itemsApi.list();
        const baseSupplierIds = new Set<string>();
        sol.itens.forEach((solItem) => {
          const match = catalogItems.find(
            (ci) => ci.description.trim().toLowerCase() === solItem.descricao.trim().toLowerCase(),
          );
          if (match?.lastSupplierId) {
            baseSupplierIds.add(match.lastSupplierId);
          }
        });

        if (baseSupplierIds.size > 0) {
          setFornecedores((cur) =>
            cur.map((f) => (baseSupplierIds.has(f.id) ? { ...f, selecionado: true } : f)),
          );
          toast({
            variant: "info",
            title: "Fornecedor de Base Identificado!",
            message:
              "Fornecedor prévio encontrado para itens desta demanda e pré-selecionado na cotação.",
          });
        }
      } catch {}
    })();
  };

  const handleDesvincular = () => {
    setSolicitacaoConfirmada(null);
    setSolicitacaoSelecionada("");
    setTituloRfq("");
    setItens([]);
    setSelectedScopeItemIds([]);
    setObservacoes("");
    setFornecedores((cur) => cur.map((f) => ({ ...f, selecionado: false })));
    setCurrentStep(1);
  };

  const toggleFornecedor = (id: string) => {
    setFornecedores((cur) =>
      cur.map((f) => (f.id === id ? { ...f, selecionado: !f.selecionado } : f)),
    );
  };

  const addItem = () => {
    const nextId = Math.max(...itens.map((i) => i.id), 0) + 1;
    setItens((cur) => [...cur, { id: nextId, descricao: "", qtd: 1, unidade: "UN" }]);
    setSelectedScopeItemIds((prev) => [...prev, nextId]);
    setExpandedItemId(nextId);
  };

  const removeItem = (id: number) => {
    setItens((cur) => cur.filter((i) => i.id !== id));
    setSelectedScopeItemIds((prev) => prev.filter((x) => x !== id));
  };

  const updateItem = <K extends keyof ItemCotacao>(id: number, field: K, value: ItemCotacao[K]) => {
    setItens((cur) => cur.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const fornecedoresSelecionados = useMemo(
    () => fornecedores.filter((f) => f.selecionado),
    [fornecedores],
  );

  const removeSupplier = (id: string) => {
    setFornecedores((cur) => cur.map((f) => (f.id === id ? { ...f, selecionado: false } : f)));
  };

  const clearAllSuppliers = () => {
    setFornecedores((cur) => cur.map((f) => ({ ...f, selecionado: false })));
  };

  const filteredFornecedores = useMemo(() => {
    let list = fornecedores;
    if (supplierFilterTab === "selecionados") {
      list = list.filter((f) => f.selecionado);
    }

    if (supplierSearch.trim()) {
      const q = supplierSearch.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.nome.toLowerCase().includes(q) ||
          f.cnpj.toLowerCase().includes(q) ||
          (f.segmento && f.segmento.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [fornecedores, supplierFilterTab, supplierSearch]);

  const totalSupplierPages = Math.max(
    1,
    Math.ceil(filteredFornecedores.length / SUPPLIERS_PER_PAGE),
  );
  const paginatedFornecedores = useMemo(() => {
    const start = (supplierPage - 1) * SUPPLIERS_PER_PAGE;
    return filteredFornecedores.slice(start, start + SUPPLIERS_PER_PAGE);
  }, [filteredFornecedores, supplierPage]);

  useEffect(() => {
    setSupplierPage(1);
  }, [supplierSearch, supplierFilterTab]);

  const solicitacaoPreview = requestsApi.find((s: Solicitacao) => s.id === solicitacaoSelecionada);

  if (!solicitacaoConfirmada) {
    return (
      <div className={styles.formContainer}>
        <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
          <Icon name="chevron-left" /> Voltar para Cotações
        </button>

        <div className={styles.pageHeader}>
          <div>
            <h1>Nova Cotação (RFQ)</h1>
            <p>
              Uma cotação sempre parte de uma demanda interna aprovada. Selecione a solicitação de
              compra que origina este processo de mercado.
            </p>
          </div>
        </div>

        <div className={styles.gateWrapper}>
          <Card className={styles.gateCard} data-tour="rfq-gate-card">
            <div className={styles.gateHeader}>
              <div className={styles.gateHeaderLeft}>
                <div className={styles.gateIconWrap}>
                  <Icon name="file-check-02" size={20} />
                </div>
                <div>
                  <h2 className={styles.gateTitle}>Vincular solicitação aprovada</h2>
                  <p className={styles.gateSubtitle}>
                    Os itens, quantidades e condições técnicas da demanda serão importados
                    automaticamente.
                  </p>
                </div>
              </div>
              <Badge variant="success" icon="check-verified-02">
                Somente Aprovadas
              </Badge>
            </div>

            {loadingData ? (
              <div className={styles.gateBody} style={{ padding: "40px 24px" }}>
                <Skeleton height={48} width="100%" />
              </div>
            ) : requestsApi.length === 0 ? (
              <div style={{ padding: "32px 16px" }}>
                <EmptyState
                  illustration="cart-empty"
                  title="Nenhuma solicitação aprovada disponível"
                  description="Para abrir uma cotação (RFQ), é necessário vincular uma demanda interna com aprovação concluída. Quando novas solicitações forem aprovadas no ERP Corporate ou pela governança interna, elas estarão disponíveis aqui para cotação."
                  action={{
                    label: "Ver Solicitações",
                    variant: "secondary",
                    onClick: () => router.push("/compras/solicitacoes"),
                  }}
                  secondaryAction={{
                    label: "Voltar para Cotações",
                    variant: "secondary",
                    onClick: () => router.push("/compras/rfqs"),
                  }}
                />
              </div>
            ) : (
              <>
                <div className={styles.gateBody}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 16,
                      alignItems: "flex-end",
                    }}
                  >
                    <div className={styles.gateSelectGroup}>
                      <label className={styles.gateLabel}>Filtrar por Empresa / Unidade</label>
                      <Select
                        options={companyOptions}
                        value={selectedCompanyId}
                        onChange={(v) => {
                          setSelectedCompanyId(v);
                          if (solicitacaoSelecionada) {
                            const stillPresent = requestsApi.find(
                              (x) =>
                                x.id === solicitacaoSelecionada &&
                                (v === "TODAS" || x.companyCode === v),
                            );
                            if (!stillPresent) setSolicitacaoSelecionada("");
                          }
                        }}
                        icon="building-07"
                      />
                    </div>
                    <div className={styles.gateSelectGroup} data-tour="rfq-gate-select">
                      <label className={styles.gateLabel}>
                        Solicitação de Compra Aprovada <span className="required-asterisk">*</span>
                      </label>
                      <Select
                        options={displayRequests.map((s) => ({
                          label: `${s.codigo ? `${s.codigo} — ` : ""}${s.titulo}${s.empresa ? ` (${s.empresa})` : ""}${s.availableItemsCount !== undefined && s.totalItemsCount !== undefined ? ` [${s.availableItemsCount}/${s.totalItemsCount} disponíveis]` : ""}`,
                          value: s.id,
                        }))}
                        value={solicitacaoSelecionada}
                        onChange={setSolicitacaoSelecionada}
                        placeholder={
                          displayRequests.length === 0
                            ? "Nenhuma solicitação encontrada..."
                            : "Selecione uma solicitação aprovada..."
                        }
                        disabled={displayRequests.length === 0}
                      />
                    </div>
                  </div>

                  {displayRequests.length === 0 && selectedCompanyId !== "TODAS" && (
                    <div
                      style={{
                        padding: "14px 18px",
                        background: "#f8fafc",
                        borderRadius: 8,
                        border: "1px dashed #cbd5e1",
                        color: "#64748b",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span>Nenhuma demanda aprovada encontrada para esta unidade.</span>
                      <Button variant="secondary" onClick={() => setSelectedCompanyId("TODAS")}>
                        Ver Todas as Empresas ({requestsApi.length})
                      </Button>
                    </div>
                  )}

                  {!solicitacaoPreview && displayRequests.length > 0 && (
                    <>
                      <div className={styles.gateCardsDivider}>
                        <span>Ou selecione diretamente na fila de demandas</span>
                      </div>

                      <div className={styles.quickRequestsGrid}>
                        {displayRequests.slice(0, 4).map((s, idx) => (
                          <div
                            key={s.id}
                            className={`${styles.quickRequestCard} ${solicitacaoSelecionada === s.id ? styles.quickRequestCardActive : ""}`}
                            onClick={() => setSolicitacaoSelecionada(s.id)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={styles.quickCardHeader}>
                              <span className={styles.quickCardId}>
                                {s.codigo || `Demanda #${idx + 1}`}
                              </span>
                              <Badge
                                variant={PRIORITY_BADGE_CONFIG[s.prioridade]?.variant ?? "gray"}
                                icon={PRIORITY_BADGE_CONFIG[s.prioridade]?.icon ?? "info-circle"}
                              >
                                {formatPriority(s.prioridade)}
                              </Badge>
                            </div>
                            <p className={styles.quickCardTitle}>{s.titulo}</p>
                            <div className={styles.quickCardMeta}>
                              <span>
                                {s.empresa || s.area || "Geral"} • {s.itens.length}{" "}
                                {s.itens.length === 1 ? "item" : "itens"}
                              </span>
                              <span className={styles.quickCardValue}>
                                {formatCurrency(s.valorEstimado)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {solicitacaoPreview && (
                    <div className={styles.gateSelectedCard}>
                      <div className={styles.gateSelectedHeader}>
                        <div className={styles.gateSelectedDemandInfo}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: 4,
                            }}
                          >
                            <span className={styles.gateSelectedLabel}>Demanda selecionada</span>
                            {solicitacaoPreview.empresa && (
                              <Badge variant="gray" icon="building-07">
                                {solicitacaoPreview.empresa}
                              </Badge>
                            )}
                          </div>
                          <strong className={styles.gateSelectedTitle}>
                            {solicitacaoPreview.titulo}
                          </strong>
                        </div>
                        <Badge
                          variant={
                            PRIORITY_BADGE_CONFIG[solicitacaoPreview.prioridade]?.variant ?? "gray"
                          }
                        >
                          Prioridade {formatPriority(solicitacaoPreview.prioridade)}
                        </Badge>
                      </div>

                      <div className={styles.gateSelectedGrid}>
                        <div className={styles.gateSelectedCol}>
                          <span className={styles.gateSelectedColLabel}>Empresa / Unidade</span>
                          <span
                            className={styles.gateSelectedColValue}
                            title={solicitacaoPreview.empresa || "Matriz"}
                          >
                            {solicitacaoPreview.empresa || "VB AGRO LTDA"}
                          </span>
                        </div>

                        <div className={styles.gateSelectedCol}>
                          <span className={styles.gateSelectedColLabel}>Área Requisitante</span>
                          <span
                            className={styles.gateSelectedColValue}
                            title={solicitacaoPreview.area || "Geral"}
                          >
                            {solicitacaoPreview.area || "Geral"}
                          </span>
                        </div>

                        <div className={styles.gateSelectedCol}>
                          <span className={styles.gateSelectedColLabel}>Solicitante</span>
                          <span
                            className={styles.gateSelectedColValue}
                            title={solicitacaoPreview.solicitante}
                          >
                            {solicitacaoPreview.solicitante}
                          </span>
                        </div>

                        <div className={styles.gateSelectedCol}>
                          <span className={styles.gateSelectedColLabel}>Total de Itens</span>
                          <span className={styles.gateSelectedColValue}>
                            {solicitacaoPreview.itens.length}{" "}
                            {solicitacaoPreview.itens.length === 1 ? "item" : "itens"}
                          </span>
                        </div>

                        <div className={styles.gateSelectedCol}>
                          <span className={styles.gateSelectedColLabel}>Valor Estimado</span>
                          <span className={styles.gateSelectedValueHighlight}>
                            {formatCurrency(solicitacaoPreview.valorEstimado)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.gateActions}>
                  <button className={styles.btnCancel} onClick={() => router.push("/compras/rfqs")}>
                    Cancelar
                  </button>
                  <Button
                    variant="primary"
                    className={styles.btnSubmit}
                    data-tour="rfq-gate-continue"
                    onClick={handleConfirmarSolicitacao}
                    disabled={!solicitacaoSelecionada}
                  >
                    <Icon name="arrow-right" /> Continuar com esta solicitação
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/compras/rfqs")}>
        <Icon name="chevron-left" /> Voltar para Cotações
      </button>

      <div className={styles.pageHeader}>
        <div>
          <h1>Nova Cotação (RFQ)</h1>
          <p>
            Configure o processo de cotação, selecione fornecedores e defina os parâmetros de
            compliance para equalizar propostas.
          </p>
        </div>
        <div className={styles.linkedSolBadge}>
          <div className={styles.linkedSolIcon}>
            <Icon name="file-check-02" size={16} />
          </div>
          <div className={styles.linkedSolInfo}>
            <span className={styles.linkedSolLabel}>Demanda vinculada:</span>
            <strong className={styles.linkedSolCode}>
              {solicitacaoConfirmada.codigo || solicitacaoConfirmada.id}
            </strong>
            {solicitacaoConfirmada.empresa && (
              <>
                <span className={styles.linkedSolDivider}>•</span>
                <span style={{ fontWeight: 600, color: "#007d79" }}>
                  {solicitacaoConfirmada.empresa}
                </span>
              </>
            )}
            {solicitacaoConfirmada.titulo && (
              <>
                <span className={styles.linkedSolDivider}>•</span>
                <span className={styles.linkedSolTitle} title={solicitacaoConfirmada.titulo}>
                  {solicitacaoConfirmada.titulo}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleDesvincular}
            className={styles.btnTrocarSol}
            title="Trocar solicitação vinculada"
          >
            <Icon name="refresh-cw-01" size={13} /> Trocar Demanda
          </button>
        </div>
      </div>

      <div className={styles.stepperNav} data-tour="rfq-stepper">
        <div
          className={`${styles.stepIndicator} ${currentStep === 1 ? styles.stepActive : currentStep > 1 ? styles.stepCompleted : ""}`}
          onClick={() => setCurrentStep(1)}
          data-tour="rfq-step-indicator-1"
        >
          <div className={styles.stepNumber}>
            {currentStep > 1 ? <Icon name="check" size={16} /> : "1"}
          </div>
          <span className={styles.stepLabel}>Parâmetros</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div
          className={`${styles.stepIndicator} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepCompleted : ""} ${currentStep < 2 ? styles.stepDisabled : ""}`}
          onClick={() => (currentStep >= 2 ? setCurrentStep(2) : undefined)}
          data-tour="rfq-step-indicator-2"
        >
          <div className={styles.stepNumber}>
            {currentStep > 2 ? <Icon name="check" size={16} /> : "2"}
          </div>
          <span className={styles.stepLabel}>Itens</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div
          className={`${styles.stepIndicator} ${currentStep === 3 ? styles.stepActive : currentStep > 3 ? styles.stepCompleted : ""} ${currentStep < 3 ? styles.stepDisabled : ""}`}
          onClick={() => (currentStep >= 3 ? setCurrentStep(3) : undefined)}
          data-tour="rfq-step-indicator-3"
        >
          <div className={styles.stepNumber}>
            {currentStep > 3 ? <Icon name="check" size={16} /> : "3"}
          </div>
          <span className={styles.stepLabel}>Fornecedores</span>
        </div>
        <div className={styles.stepConnectorLine} />
        <div
          className={`${styles.stepIndicator} ${currentStep === 4 ? styles.stepActive : ""} ${currentStep < 4 ? styles.stepDisabled : ""}`}
          onClick={() => (currentStep >= 4 ? setCurrentStep(4) : undefined)}
          data-tour="rfq-step-indicator-4"
        >
          <div className={styles.stepNumber}>4</div>
          <span className={styles.stepLabel}>Compliance</span>
        </div>
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>
            {currentStep === 1 && (
              <>
                <section className={styles.formSection} data-tour="rfq-form-parameters">
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}>
                      <Icon name="settings-01" />
                    </div>
                    <div>
                      <h2>1. Parâmetros gerais da cotação</h2>
                      <p>Título, estratégia de compra e prazo de encerramento do processo.</p>
                    </div>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Modalidade de Cotação</label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setRfqModality("standard")}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "14px 16px",
                          borderRadius: 10,
                          border:
                            rfqModality === "standard"
                              ? "2px solid #007d79"
                              : "1px solid #cbd5e1",
                          background: rfqModality === "standard" ? "#f0fdf9" : "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: rfqModality === "standard" ? "#007d79" : "#f1f5f9",
                            color: rfqModality === "standard" ? "#fff" : "#475569",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="building-07" size={18} />
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: 13.5, color: "#0f172a" }}>
                            Cotação Tradicional (Fornecedores)
                          </strong>
                          <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, display: "block", marginTop: 2 }}>
                            Convide fornecedores homologados para enviarem propostas pelo link externo.
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRfqModality("links");
                          if (!dataEncerramento) {
                            const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                            setDataEncerramento(d.toISOString().slice(0, 16));
                          }
                          if (condicaoPagamento === "30 dias DDL") {
                            setCondicaoPagamento("À vista / PIX / Cartão");
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "14px 16px",
                          borderRadius: 10,
                          border:
                            rfqModality === "links"
                              ? "2px solid #007d79"
                              : "1px solid #cbd5e1",
                          background: rfqModality === "links" ? "#f0fdf9" : "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "#ffffff",
                            border: rfqModality === "links" ? "1px solid #007d79" : "1px solid #fde047",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MarketplaceLogo source="mercadolivre" size="md" />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>
                              Compra via Link (Mercado Livre) ou Orçamentos Locais
                            </strong>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.9 }}>
                              <MarketplaceLogo source="amazon" size="sm" />
                              <MarketplaceLogo source="shopee" size="sm" />
                              <MarketplaceLogo source="magalu" size="sm" />
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, display: "block", marginTop: 2 }}>
                            RFQ simplificada para Suprimentos colar 3 links (Mercado Livre, Amazon) ou orçamentos locais antes de aprovar.
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>
                      Título da RFQ <span className="required-asterisk">*</span>
                    </label>
                    <input
                      className={styles.formControl}
                      value={tituloRfq}
                      onChange={(e) => setTituloRfq(e.target.value)}
                      placeholder="Ex: Fornecimento Anual de Combustíveis Geral"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        Estratégia de compra <span className="required-asterisk">*</span>
                      </label>
                      <Select
                        options={[
                          { label: "Menor Preço Equalizado", value: "Menor Preço Equalizado" },
                          { label: "Técnica e Preço", value: "Técnica e Preço" },
                          { label: "Melhor Valor Total", value: "Melhor Valor Total" },
                        ]}
                        value={estrategia}
                        onChange={setEstrategia}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        Data/Hora Limite de Encerramento{" "}
                        <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className={styles.formControl}
                        value={dataEncerramento}
                        onChange={(e) => setDataEncerramento(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            {currentStep === 2 && (
              <section className={styles.formSection} data-tour="rfq-form-items">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name="shopping-cart-01" />
                  </div>
                  <div>
                    <h2>2. Itens e quantidades solicitadas</h2>
                    <p>
                      Importados da solicitação{" "}
                      <strong>{solicitacaoConfirmada.codigo || solicitacaoConfirmada.id}</strong>.
                      Você pode adicionar itens complementares ao escopo.
                    </p>
                  </div>
                </div>

                <div className={styles.scopeSelectionBanner}>
                  <div className={styles.scopeBannerLeft}>
                    <div className={styles.scopeBannerIcon}>
                      <Icon name="layers-three-01" size={18} />
                    </div>
                    <div>
                      <div className={styles.scopeBannerTitle}>
                        Escopo da Cotação & Seleção de Itens
                      </div>
                      <div className={styles.scopeBannerSubtitle}>
                        Selecione apenas os itens deste escopo de fornecimento (ex: TI ou Materiais). Os itens desmarcados continuarão disponíveis na demanda para abertura de outras cotações.
                      </div>
                    </div>
                  </div>
                  <div className={styles.scopeBannerRight}>
                    <span className={styles.scopeSelectedCountBadge}>
                      {selectedScopeItemIds.length} de {itens.filter((i) => !i.isOccupied).length} item(ns) selecionado(s)
                    </span>
                    <div className={styles.scopeActionButtons}>
                      <button
                        type="button"
                        className={styles.scopeActionBtn}
                        onClick={handleSelectAllAvailable}
                      >
                        Selecionar Todos
                      </button>
                      <button
                        type="button"
                        className={styles.scopeActionBtn}
                        onClick={handleDeselectAll}
                      >
                        Limpar Seleção
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.itemsList}>
                  {itens.map((item, index) => {
                    const isFromSol = solicitacaoConfirmada.itens.some((si) => si.id === item.id);
                    const isExpanded = expandedItemId === item.id;
                    const isSelected = selectedScopeItemIds.includes(item.id);
                    const isOccupied = !!item.isOccupied;

                    return (
                      <div
                        className={`${styles.itemPanel} ${isOccupied ? styles.itemPanelDisabled : isSelected ? styles.itemPanelSelected : styles.itemPanelUnselected}`}
                        key={item.id}
                      >
                        <div
                          className={styles.itemSummaryRow}
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        >
                          <div className={styles.itemSummaryLeft}>
                            <label
                              className={styles.itemCheckboxWrapper}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              title={
                                isOccupied
                                  ? `Item em cotação na RFQ ${item.activeRfqCode}`
                                  : isSelected
                                    ? "Desmarcar item do escopo"
                                    : "Incluir item no escopo"
                              }
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isOccupied}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (!isOccupied) toggleItemSelection(item.id);
                                }}
                                className={styles.itemCheckbox}
                                aria-label={`Incluir ${item.descricao || "item"}`}
                              />
                            </label>
                            <span className={styles.itemSummaryBadge}>Item {index + 1}</span>
                            <div className={styles.itemSummaryText}>
                              <span className={styles.itemSummaryTitle}>
                                {parseItemDescription(item.descricao).cleanDescription || "Novo item complementar sem descrição"}
                              </span>
                              <span className={styles.itemSummaryMeta}>
                                Qtd: {item.qtd.toLocaleString("pt-BR")} {item.unidade}{" "}
                                {isFromSol && "• Origem: Solicitação"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.itemSummaryRight}>
                            {isOccupied ? (
                              <Badge variant="warning" icon="clock">
                                Em cotação: {item.activeRfqCode}
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                className={styles.scopeBadgeBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItemSelection(item.id);
                                }}
                                title={
                                  isSelected
                                    ? "Clique para desmarcar do escopo"
                                    : "Clique para incluir no escopo"
                                }
                              >
                                <Badge
                                  variant={isSelected ? "success" : "gray"}
                                  icon={isSelected ? "check" : undefined}
                                >
                                  {isSelected ? "Incluído no Escopo" : "Não incluído nesta RFQ"}
                                </Badge>
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedItemId(isExpanded ? null : item.id);
                              }}
                              title={isExpanded ? "Recolher detalhes" : "Editar detalhes"}
                            >
                              <Icon
                                name="chevron-down"
                                size={18}
                                className={`${styles.chevronRotate} ${isExpanded ? styles.chevronRotateActive : ""}`}
                              />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionIconBtn} ${styles.actionDeleteBtn}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              disabled={isFromSol}
                              title={
                                isFromSol
                                  ? "Item importado da solicitação não pode ser removido"
                                  : "Remover item"
                              }
                            >
                              <Icon name="x-close" size={18} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className={styles.accordionExpandable}>
                            <div className={styles.gridCol12}>
                              <div className={`${styles.formGroup} ${styles.col6}`}>
                                <label>
                                  Descrição do item / serviço{" "}
                                  <span className="required-asterisk">*</span>
                                </label>
                                <input
                                  className={styles.formControl}
                                  value={item.descricao}
                                  onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
                                  readOnly={isFromSol}
                                  placeholder="Ex: Óleo Diesel S10"
                                />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col3}`}>
                                <label>
                                  Quantidade <span className="required-asterisk">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  className={styles.formControl}
                                  value={item.qtd}
                                  onChange={(e) =>
                                    updateItem(item.id, "qtd", Number(e.target.value))
                                  }
                                  readOnly={isFromSol}
                                />
                              </div>
                              <div className={`${styles.formGroup} ${styles.col3}`}>
                                <label>
                                  Unidade <span className="required-asterisk">*</span>
                                </label>
                                <Select
                                  options={[
                                    { label: "L", value: "L" },
                                    { label: "UN", value: "UN" },
                                    { label: "KG", value: "KG" },
                                    { label: "M", value: "M" },
                                    { label: "H", value: "H" },
                                    { label: "Pacote", value: "Pacote" },
                                  ]}
                                  value={item.unidade}
                                  onChange={(value) => updateItem(item.id, "unidade", value)}
                                  disabled={isFromSol}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button type="button" className={styles.addItemButton} onClick={addItem}>
                  <Icon name="plus" /> Adicionar item complementar
                </button>
              </section>
            )}

            {currentStep === 3 && (
              <section className={styles.formSection} data-tour="rfq-form-suppliers">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name={rfqModality === "links" ? "shopping-cart-01" : "building-07"} />
                  </div>
                  <div>
                    <h2>
                      3. {rfqModality === "links" ? "Opções de Links / Lojas Locais e Fornecedores" : "Fornecedores convidados"}{" "}
                      <span className="required-asterisk">*</span>
                    </h2>
                    <p>
                      {rfqModality === "links"
                        ? "Adicione rapidamente os slots de links (ex: 3 anúncios do Mercado Livre ou 3 orçamentos locais) ou selecione fornecedores."
                        : "Selecione os fornecedores homologados que receberão o convite para cotação."}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: rfqModality === "links" ? "#fefce8" : "#f8fafc",
                    border: rfqModality === "links" ? "1px solid #fde047" : "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="shopping-cart-01" size={16} style={{ color: "#854d0e" }} />
                      <strong style={{ fontSize: 13, color: "#0f172a" }}>
                        Atalhos para Compra por Link (Mercado Livre / Internet) ou Comércio Local:
                      </strong>
                    </div>
                    {(solicitacaoConfirmada?.companyCode === "PURAFE" || isPuraFe) && (
                      <Badge variant="warning" icon="check-circle">
                        Igreja Pura Fé: Acesso direto à conta do Mercado Livre
                      </Badge>
                    )}
                  </div>
                  <span style={{ fontSize: 12.5, color: "#475569" }}>
                    Precisa colar 3 links do Mercado Livre ou 3 orçamentos de lojas locais na RFQ antes de aprovar? Clique abaixo para gerar os participantes automaticamente:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={addingQuickSuppliers}
                      onClick={() =>
                        handleAddQuickOptions([
                          {
                            corporateName: "Mercado Livre — Opção 1 (Anúncio / Link)",
                            cnpj: "03.007.331/0001-41",
                            segment: "Marketplace / Link",
                            contactEmail: "cotacao.ml1@mercadolivre.com.br",
                          },
                          {
                            corporateName: "Mercado Livre — Opção 2 (Anúncio / Link)",
                            cnpj: "03.007.331/0002-22",
                            segment: "Marketplace / Link",
                            contactEmail: "cotacao.ml2@mercadolivre.com.br",
                          },
                          {
                            corporateName: "Mercado Livre — Opção 3 (Anúncio / Link)",
                            cnpj: "03.007.331/0003-03",
                            segment: "Marketplace / Link",
                            contactEmail: "cotacao.ml3@mercadolivre.com.br",
                          },
                        ])
                      }
                    >
                      <MarketplaceLogo source="mercadolivre" size="sm" /> + Adicionar 3 Opções Mercado Livre (Links)
                    </Button>

                    <Button
                      variant="secondary"
                      type="button"
                      disabled={addingQuickSuppliers}
                      onClick={() =>
                        handleAddQuickOptions([
                          {
                            corporateName: "Comércio Local — Orçamento 1",
                            cnpj: "00.000.001/0001-01",
                            segment: "Compra Local / Balcão",
                            contactEmail: "orcamento1@comerciolocal.com.br",
                          },
                          {
                            corporateName: "Comércio Local — Orçamento 2",
                            cnpj: "00.000.002/0001-02",
                            segment: "Compra Local / Balcão",
                            contactEmail: "orcamento2@comerciolocal.com.br",
                          },
                          {
                            corporateName: "Comércio Local — Orçamento 3",
                            cnpj: "00.000.003/0001-03",
                            segment: "Compra Local / Balcão",
                            contactEmail: "orcamento3@comerciolocal.com.br",
                          },
                        ])
                      }
                    >
                      <MarketplaceLogo source="whatsapp" size="sm" /> + Adicionar 3 Opções de Comércio Local
                    </Button>

                    <Button
                      variant="secondary"
                      type="button"
                      disabled={addingQuickSuppliers}
                      onClick={() =>
                        handleAddQuickOptions([
                          {
                            corporateName: "Mercado Livre (Compra Direta via Link)",
                            cnpj: "03.007.331/0001-41",
                            segment: "Marketplace / Link",
                            contactEmail: "suprimentos.ml@mercadolivre.com.br",
                          },
                          {
                            corporateName: "Amazon Brasil (Compra via Link)",
                            cnpj: "15.436.940/0001-03",
                            segment: "Marketplace / Link",
                            contactEmail: "suprimentos.amz@amazon.com.br",
                          },
                          {
                            corporateName: "Shopee / Magazine Luiza (Compra via Link)",
                            cnpj: "35.635.824/0001-12",
                            segment: "Marketplace / Link",
                            contactEmail: "suprimentos.mkt@marketplace.com.br",
                          },
                        ])
                      }
                    >
                      <MarketplaceLogo source="amazon" size="sm" />{" "}
                      <MarketplaceLogo source="shopee" size="sm" /> + Comparativo Marketplaces (ML / Amazon / Magalu)
                    </Button>
                  </div>
                </div>

                <div className={styles.supplierFilterToolbar}>
                  <div className={styles.supplierSearchInput}>
                    <Icon name="search-sm" size={16} className={styles.searchIconInside} />
                    <input
                      type="text"
                      placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                    />
                  </div>

                  <div className={styles.filterTabs}>
                    <button
                      type="button"
                      className={`${styles.filterTabBtn} ${supplierFilterTab === "todos" ? styles.filterTabBtnActive : ""}`}
                      onClick={() => setSupplierFilterTab("todos")}
                    >
                      Todos ({fornecedores.length.toLocaleString("pt-BR")})
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterTabBtn} ${supplierFilterTab === "selecionados" ? styles.filterTabBtnActive : ""}`}
                      onClick={() => setSupplierFilterTab("selecionados")}
                    >
                      Selecionados ({fornecedoresSelecionados.length})
                    </button>
                  </div>

                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <Icon name="user-plus-01" size={16} /> Convidar Não Cadastrado
                  </Button>
                </div>

                {paginatedFornecedores.length > 0 ? (
                  <div className={styles.fornecedoresList}>
                    {paginatedFornecedores.map((f) => (
                      <label
                        key={f.id}
                        className={`${styles.fornecedorRow} ${f.selecionado ? styles.fornecedorSelecionado : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={f.selecionado}
                          onChange={() => toggleFornecedor(f.id)}
                          className={styles.fornecedorCheck}
                        />
                        <div className={styles.fornecedorInfo}>
                          <div className={styles.fornecedorTitleRow}>
                            <MarketplaceLogo source={f.nome} size="sm" showFallbackIcon={false} />
                            <strong>{f.nome}</strong>
                            {f.segmento && <span className={styles.segmentTag}>{f.segmento}</span>}
                          </div>
                          <span>
                            CNPJ: {f.cnpj} {f.isHomologado ? "• Homologado" : ""}
                          </span>
                        </div>
                        {f.selecionado && (
                          <span className={styles.fornecedorBadge}>
                            <Icon name="check-circle" size={14} /> Convidado
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "30px 20px",
                      textAlign: "center",
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1px dashed #cbd5e1",
                      color: "#64748b",
                    }}
                  >
                    <Icon
                      name="search-sm"
                      size={24}
                      style={{ margin: "0 auto 6px", display: "block", color: "#94a3b8" }}
                    />
                    <strong style={{ display: "block", color: "#0f172a" }}>
                      Nenhum fornecedor encontrado
                    </strong>
                    <span style={{ fontSize: 13 }}>
                      Tente buscar por outro termo ou limpe os filtros.
                    </span>
                  </div>
                )}

                {filteredFornecedores.length > SUPPLIERS_PER_PAGE && (
                  <div className={styles.supplierPaginationBar}>
                    <span>
                      Exibindo {(supplierPage - 1) * SUPPLIERS_PER_PAGE + 1} -{" "}
                      {Math.min(supplierPage * SUPPLIERS_PER_PAGE, filteredFornecedores.length)} de{" "}
                      {filteredFornecedores.length.toLocaleString("pt-BR")} fornecedores
                    </span>
                    <div className={styles.paginationControls}>
                      <button
                        type="button"
                        className={styles.pageBtn}
                        disabled={supplierPage <= 1}
                        onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                      >
                        ← Anterior
                      </button>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        {supplierPage} / {totalSupplierPages}
                      </span>
                      <button
                        type="button"
                        className={styles.pageBtn}
                        disabled={supplierPage >= totalSupplierPages}
                        onClick={() => setSupplierPage((p) => Math.min(totalSupplierPages, p + 1))}
                      >
                        Próxima →
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {currentStep === 4 && (
              <section className={styles.formSection} data-tour="rfq-form-compliance">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name="truck-01" />
                  </div>
                  <div>
                    <h2>4. Compliance e logística</h2>
                    <p>Parâmetros comerciais que equalizam as propostas recebidas.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      Incoterm (Frete) <span className="required-asterisk">*</span>
                    </label>
                    <Select
                      options={[
                        { label: "CIF — Frete incluso pelo Fornecedor", value: "CIF" },
                        { label: "FOB — Frete por conta do Comprador", value: "FOB" },
                        { label: "EXW — Retirada na planta do fornecedor", value: "EXW" },
                      ]}
                      value={incoterm}
                      onChange={setIncoterm}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>
                      Condição de pagamento <span className="required-asterisk">*</span>
                    </label>
                    <input
                      className={styles.formControl}
                      value={condicaoPagamento}
                      onChange={(e) => setCondicaoPagamento(e.target.value)}
                      placeholder="Ex: 30 dias DDL"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      Moeda base <span className="required-asterisk">*</span>
                    </label>
                    <Select
                      options={[
                        { label: "BRL — Real Brasileiro", value: "BRL" },
                        { label: "USD — Dólar Americano", value: "USD" },
                        { label: "EUR — Euro", value: "EUR" },
                      ]}
                      value={moeda}
                      onChange={setMoeda}
                    />
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Notas técnicas e requisitos de compliance</label>
                  <textarea
                    className={styles.formControl}
                    rows={4}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: Fornecedor deve apresentar certificação ANP ativa, laudos de análise química..."
                  />
                </div>
              </section>
            )}

            <div className={styles.formActions}>
              {currentStep === 1 && (
                <>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => router.push("/compras/rfqs")}
                  >
                    Cancelar
                  </button>
                  <Button
                    variant="primary"
                    type="button"
                    className={styles.btnSubmit}
                    onClick={() => {
                      if (!tituloRfq.trim()) {
                        toast({
                          variant: "warning",
                          title: "Atenção",
                          message: "Por favor, preencha o título da RFQ",
                        });
                        return;
                      }
                      if (!dataEncerramento) {
                        toast({
                          variant: "warning",
                          title: "Atenção",
                          message: "Por favor, preencha a data de encerramento",
                        });
                        return;
                      }
                      setCurrentStep(2);
                    }}
                  >
                    Avançar <Icon name="chevron-right" />
                  </Button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setCurrentStep(1)}
                  >
                    <Icon name="chevron-left" /> Voltar
                  </button>
                  <Button
                    variant="primary"
                    type="button"
                    className={styles.btnSubmit}
                    onClick={() => {
                      if (selectedScopeItemIds.length === 0) {
                        toast({
                          variant: "warning",
                          title: "Escopo Vazio",
                          message: "Selecione ao menos 1 item para compor o escopo desta cotação.",
                        });
                        return;
                      }
                      if (itens.filter((i) => selectedScopeItemIds.includes(i.id)).some((i) => !i.descricao.trim() || i.qtd <= 0)) {
                        toast({
                          variant: "warning",
                          title: "Atenção",
                          message: "Por favor, preencha a descrição e quantidade de todos os itens selecionados",
                        });
                        return;
                      }
                      setCurrentStep(3);
                    }}
                  >
                    Avançar <Icon name="chevron-right" />
                  </Button>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setCurrentStep(2)}
                  >
                    <Icon name="chevron-left" /> Voltar
                  </button>
                  <Button
                    variant="primary"
                    type="button"
                    className={styles.btnSubmit}
                    onClick={() => {
                      const valor = solicitacaoConfirmada?.valorEstimado || 0;
                      let minSuppliers = 1;
                      if (rfqModality !== "links") {
                        if (valor > 5000) minSuppliers = 3;
                        else if (valor > 1000) minSuppliers = 2;
                      }

                      if (fornecedoresSelecionados.length < minSuppliers) {
                        toast({
                          variant: "warning",
                          title: "Política de Compras",
                          message:
                            rfqModality === "links"
                              ? "Selecione ou adicione ao menos 1 opção de Link / Comércio Local."
                              : `Para esta faixa de valor, é obrigatório convidar no mínimo ${minSuppliers} fornecedor(es).`,
                        });
                        return;
                      }
                      setCurrentStep(4);
                    }}
                  >
                    Avançar <Icon name="chevron-right" />
                  </Button>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting || savingDraft}
                  >
                    <Icon name="chevron-left" /> Voltar
                  </button>
                  <Button
                    variant="secondary"
                    type="button"
                    className={styles.secondaryAction}
                    disabled={isSubmitting || savingDraft}
                    loading={savingDraft}
                    loadingText="Salvando..."
                    onClick={async () => {
                      const targetRequestId = solicitacaoConfirmada?.id || paramSol;
                      if (!targetRequestId) {
                        toast({
                          variant: "warning",
                          title: "Atenção",
                          message: "Selecione uma solicitação para salvar o rascunho da cotação.",
                        });
                        return;
                      }

                      setSavingDraft(true);
                      try {
                        const selectedSupplierIds = fornecedoresSelecionados.map((f) => f.id);
                        const endClosesAt = dataEncerramento
                          ? new Date(dataEncerramento).toISOString()
                          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                        const selectedOriginalIds = itens
                          .filter((it) => selectedScopeItemIds.includes(it.id) && it.originalId)
                          .map((it) => it.originalId as string);

                        const createdDraft = await rfqsApi.create({
                          requestId: targetRequestId,
                          title: tituloRfq || "Rascunho de Cotação",
                          closesAt: endClosesAt,
                          supplierIds: selectedSupplierIds,
                          itemIds: selectedOriginalIds.length > 0 ? selectedOriginalIds : undefined,
                          status: "Draft",
                          incoterm: incoterm || "CIF",
                          paymentTerms: condicaoPagamento || "30 dias DDL",
                          currency: moeda || "BRL",
                          notes: observacoes || undefined,
                        });

                        toast({
                          variant: "success",
                          title: "Rascunho Salvo",
                          message: `Rascunho da cotação ${createdDraft.code || ""} salvo com sucesso!`,
                        });
                        router.push("/compras/rfqs");
                      } catch (err) {
                        logError("rfqs/nova/saveDraft", err);
                        toast({
                          variant: "error",
                          title: "Erro ao salvar rascunho",
                          message: getErrorMessage(err),
                        });
                      } finally {
                        setSavingDraft(false);
                      }
                    }}
                  >
                    <Icon name="save-01" /> Salvar rascunho
                  </Button>
                  <Button
                    variant="primary"
                    className={styles.btnSubmit}
                    data-tour="rfq-btn-publish"
                    disabled={isSubmitting || savingDraft}
                    loading={isSubmitting}
                    loadingText="Publicando..."
                    onClick={async () => {
                      if (!incoterm || !condicaoPagamento.trim() || !moeda) {
                        toast({
                          variant: "warning",
                          title: "Atenção",
                          message:
                            "Preencha os dados de compliance obrigatórios (Incoterm, Condição e Moeda)",
                        });
                        return;
                      }

                      setIsSubmitting(true);
                      try {
                        const selectedSupplierIds = fornecedoresSelecionados.map((f) => f.id);
                        const endClosesAt = dataEncerramento
                          ? new Date(dataEncerramento).toISOString()
                          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                        const selectedOriginalIds = itens
                          .filter((it) => selectedScopeItemIds.includes(it.id) && it.originalId)
                          .map((it) => it.originalId as string);

                        const createdRfq = await rfqsApi.create({
                          requestId: solicitacaoConfirmada?.id || paramSol,
                          title: tituloRfq || "Cotação de Compra",
                          closesAt: endClosesAt,
                          supplierIds: selectedSupplierIds,
                          itemIds: selectedOriginalIds.length > 0 ? selectedOriginalIds : undefined,
                          status: "Open",
                          incoterm: incoterm || "CIF",
                          paymentTerms: condicaoPagamento || "30 dias DDL",
                          currency: moeda || "BRL",
                          notes: observacoes || undefined,
                        });

                        router.push(`/compras/rfqs/${createdRfq.id}`);
                      } catch (err) {
                        logError("rfqs/nova/create", err);
                        toast({
                          variant: "error",
                          title: "Erro",
                          message: getErrorMessage(err),
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Publicar Cotação <Icon name="check-circle" />
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <InviteSupplierModal
        open={isInviteModalOpen}
        onSuccess={handleSupplierInvited}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
