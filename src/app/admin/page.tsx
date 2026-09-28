"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Card, Badge, Tabs, ConfirmDialog, Loading, SearchInput, Icon } from "@/components/ui";
import {
  adminApi,
  CompanyBranchConfig,
  ApprovalRuleConfig,
  ApproverType,
} from "@/lib/api/admin";
import styles from "./admin.module.css";

const ADMIN_TABS = [
  { id: "empresas", label: "Empresas & Filiais" },
  { id: "alcadas", label: "Alçadas de Aprovação (Workflow)" },
  { id: "governanca", label: "Papéis & Governança" },
];

export interface ValueRangeGroup {
  rangeKey: string;
  minAmount: number;
  maxAmount: number | null;
  rules: ApprovalRuleConfig[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("alcadas");
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyBranchConfig[]>([]);
  const [rules, setRules] = useState<ApprovalRuleConfig[]>([]);

  
  const [companySearch, setCompanySearch] = useState("");
  const [selectedWorkflowCompany, setSelectedWorkflowCompany] = useState<string>("2313");
  const [activeFlowType, setActiveFlowType] = useState<"solicitacao" | "pedido">("solicitacao");

  
  const [simulationAmount, setSimulationAmount] = useState<string>("25000");

  
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyBranchConfig | null>(null);
  const [companyForm, setCompanyForm] = useState({
    code: "",
    name: "",
    acronym: "",
    unitName: "",
    type: "Filial" as "Matriz" | "Filial",
    cnpj: "",
    active: true,
  });

  // Range Modal State (Criar ou Editar Faixa)
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [editingRangeKey, setEditingRangeKey] = useState<string | null>(null);
  const [rangeForm, setRangeForm] = useState({
    minAmount: 0,
    maxAmount: "" as string | number,
  });

  // Step / Rule Modal State (Criar ou Editar Nível da Faixa)
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [targetRangeKey, setTargetRangeKey] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<ApprovalRuleConfig | null>(null);
  const [stepForm, setStepForm] = useState({
    level: 1,
    order: 1,
    approverType: "role" as ApproverType,
    approverIdentifier: "gerente",
    approverName: "Gerente da Área",
    active: true,
  });

  
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [deleteRangeKey, setDeleteRangeKey] = useState<string | null>(null);
  const [toggleCompanyConfirm, setToggleCompanyConfirm] = useState<CompanyBranchConfig | null>(null);

  
  const [isDirty, setIsDirty] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [comps, rls] = await Promise.all([
        adminApi.getCompanies(),
        adminApi.getApprovalRules(),
      ]);
      setCompanies(comps);
      setRules(rls);
      if (comps.length > 0 && !comps.some((c) => c.code === selectedWorkflowCompany)) {
        setSelectedWorkflowCompany(comps[0].code);
      }
    } catch (err) {
      console.error("Erro ao carregar dados administrativos:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkflowCompany]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  
  const companyRules = useMemo(() => {
    return rules
      .filter(
        (r) =>
          r.companyCode === selectedWorkflowCompany &&
          (r.flowType || "solicitacao") === activeFlowType
      )
      .sort((a, b) => a.minAmount - b.minAmount || a.level - b.level || a.order - b.order);
  }, [rules, selectedWorkflowCompany, activeFlowType]);

  
  const valueRanges = useMemo(() => {
    const groups: Record<string, ValueRangeGroup> = {};
    for (const rule of companyRules) {
      const key = `${rule.minAmount}_${rule.maxAmount ?? "inf"}`;
      if (!groups[key]) {
        groups[key] = {
          rangeKey: key,
          minAmount: rule.minAmount,
          maxAmount: rule.maxAmount,
          rules: [],
        };
      }
      groups[key].rules.push(rule);
    }
    
    return Object.values(groups).sort((a, b) => a.minAmount - b.minAmount);
  }, [companyRules]);

  
  const diagnostics = useMemo(() => {
    const issues: string[] = [];

    if (valueRanges.length === 0) {
      issues.push("Nenhuma faixa de valor configurada para esta empresa.");
      return { isValid: false, issues };
    }

    
    for (let i = 0; i < valueRanges.length; i++) {
      const r = valueRanges[i];
      if (r.rules.length === 0) {
        issues.push(`A faixa ${formatRangeLabel(r.minAmount, r.maxAmount)} não possui nenhum nível de aprovação configurado.`);
      }
      
      for (const st of r.rules) {
        if (!st.approverIdentifier?.trim()) {
          issues.push(`O Nível ${st.level} da faixa ${formatRangeLabel(r.minAmount, r.maxAmount)} está sem identificador de aprovador.`);
        }
      }
    }

    
    for (let i = 0; i < valueRanges.length - 1; i++) {
      const cur = valueRanges[i];
      const next = valueRanges[i + 1];

      if (cur.maxAmount === null) {
        issues.push(`A faixa ${formatRangeLabel(cur.minAmount, cur.maxAmount)} não tem limite máximo, sobrepondo as faixas posteriores.`);
      } else if (cur.maxAmount >= next.minAmount) {
        issues.push(`Sobreposição detectada: a faixa até ${formatCurrency(cur.maxAmount)} invade a faixa seguinte que inicia em ${formatCurrency(next.minAmount)}.`);
      } else if (next.minAmount - cur.maxAmount > 0.05) {
        issues.push(`Lacuna de cobertura: valores entre ${formatCurrency(cur.maxAmount)} e ${formatCurrency(next.minAmount)} não possuem regra de alçada associada.`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [valueRanges]);

  
  const activeSimulatedRange = useMemo(() => {
    const amount = Number(simulationAmount);
    if (isNaN(amount) || amount < 0) return null;
    return valueRanges.find((vg) => {
      const minOk = amount >= vg.minAmount;
      const maxOk = vg.maxAmount === null || amount <= vg.maxAmount;
      return minOk && maxOk;
    });
  }, [simulationAmount, valueRanges]);

  
  function formatCurrency(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return "Sem limite";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  }

  function formatRangeLabel(min: number, max: number | null): string {
    if (min === 0 && max !== null) {
      return `Até ${formatCurrency(max)}`;
    }
    if (max === null) {
      return `Acima de ${formatCurrency(min)}`;
    }
    return `${formatCurrency(min)} até ${formatCurrency(max)}`;
  }

  
  const handleOpenNewRange = () => {
    setEditingRangeKey(null);
    let defaultMin = 0;
    if (valueRanges.length > 0) {
      const last = valueRanges[valueRanges.length - 1];
      defaultMin = last.maxAmount !== null ? Number((last.maxAmount + 0.01).toFixed(2)) : 100000;
    }
    setRangeForm({
      minAmount: defaultMin,
      maxAmount: "",
    });
    setRangeModalOpen(true);
  };

  const handleEditRange = (rg: ValueRangeGroup) => {
    setEditingRangeKey(rg.rangeKey);
    setRangeForm({
      minAmount: rg.minAmount,
      maxAmount: rg.maxAmount ?? "",
    });
    setRangeModalOpen(true);
  };

  const handleSaveRange = (e: React.FormEvent) => {
    e.preventDefault();
    const min = Number(rangeForm.minAmount);
    const max = rangeForm.maxAmount === "" ? null : Number(rangeForm.maxAmount);

    if (max !== null && max <= min) {
      alert("O valor máximo deve ser estritamente maior que o valor mínimo.");
      return;
    }

    if (editingRangeKey) {
      // Atualiza os valores min/max de todas as regras pertencentes a essa faixa
      const targetGroup = valueRanges.find((g) => g.rangeKey === editingRangeKey);
      if (targetGroup) {
        setRules((prev) =>
          prev.map((r) => {
            if (targetGroup.rules.some((tr) => tr.id === r.id)) {
              return { ...r, minAmount: min, maxAmount: max };
            }
            return r;
          })
        );
      }
    } else {
      // Cria uma nova faixa com 1 nível inicial padrão
      const newRule: ApprovalRuleConfig = {
        id: `rule-${Date.now()}`,
        companyCode: selectedWorkflowCompany,
        flowType: activeFlowType,
        level: 1,
        order: 1,
        minAmount: min,
        maxAmount: max,
        approverType: "role",
        approverIdentifier: activeFlowType === "pedido" ? "diretor" : "gerente",
        approverName: activeFlowType === "pedido" ? "Diretoria de Operações" : "Gerente da Área",
        active: true,
      };
      setRules((prev) => [...prev, newRule]);
    }

    setIsDirty(true);
    setRangeModalOpen(false);
  };

  const handleDeleteRange = (rangeKey: string) => {
    const targetGroup = valueRanges.find((g) => g.rangeKey === rangeKey);
    if (!targetGroup) return;
    setRules((prev) => prev.filter((r) => !targetGroup.rules.some((tr) => tr.id === r.id)));
    setIsDirty(true);
    setDeleteRangeKey(null);
  };

  
  const handleAddStepToRange = (rg: ValueRangeGroup) => {
    setTargetRangeKey(rg.rangeKey);
    setEditingRule(null);
    const nextLevel = rg.rules.length + 1;
    setStepForm({
      level: nextLevel,
      order: nextLevel,
      approverType: "role",
      approverIdentifier: "diretor",
      approverName: "Diretoria de Operações",
      active: true,
    });
    setStepModalOpen(true);
  };

  const handleEditStep = (rule: ApprovalRuleConfig, rangeKey: string) => {
    setTargetRangeKey(rangeKey);
    setEditingRule(rule);
    setStepForm({
      level: rule.level,
      order: rule.order,
      approverType: rule.approverType,
      approverIdentifier: rule.approverIdentifier,
      approverName: rule.approverName,
      active: rule.active,
    });
    setStepModalOpen(true);
  };

  const handleSaveStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                level: Number(stepForm.level),
                order: Number(stepForm.order),
                approverType: stepForm.approverType,
                approverIdentifier: stepForm.approverIdentifier,
                approverName: stepForm.approverName,
                active: stepForm.active,
              }
            : r
        )
      );
    } else if (targetRangeKey) {
      const targetGroup = valueRanges.find((g) => g.rangeKey === targetRangeKey);
      if (!targetGroup) return;
      const newRule: ApprovalRuleConfig = {
        id: `rule-${Date.now()}`,
        companyCode: selectedWorkflowCompany,
        flowType: activeFlowType,
        level: Number(stepForm.level),
        order: Number(stepForm.order),
        minAmount: targetGroup.minAmount,
        maxAmount: targetGroup.maxAmount,
        approverType: stepForm.approverType,
        approverIdentifier: stepForm.approverIdentifier,
        approverName: stepForm.approverName,
        active: stepForm.active,
      };
      setRules((prev) => [...prev, newRule]);
    }
    setIsDirty(true);
    setStepModalOpen(false);
  };

  const handleMoveStep = (rg: ValueRangeGroup, index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= rg.rules.length) return;

    const currentRule = rg.rules[index];
    const neighborRule = rg.rules[targetIdx];

    
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === currentRule.id) {
          return { ...r, level: neighborRule.level, order: neighborRule.order };
        }
        if (r.id === neighborRule.id) {
          return { ...r, level: currentRule.level, order: currentRule.order };
        }
        return r;
      })
    );
    setIsDirty(true);
  };

  const handleDeleteStep = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    setIsDirty(true);
    setDeleteRuleId(null);
  };

  
  const handleSaveAllRules = async () => {
    setSavingBatch(true);
    try {
      await adminApi.batchSaveApprovalRules(selectedWorkflowCompany, companyRules, activeFlowType);
      setIsDirty(false);
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar regras de alçada:", err);
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDiscardChanges = async () => {
    await loadData();
    setIsDirty(false);
  };

  
  const handleOpenNewCompany = () => {
    setEditingCompany(null);
    setCompanyForm({
      code: "",
      name: "",
      acronym: "",
      unitName: "",
      type: "Filial",
      cnpj: "",
      active: true,
    });
    setCompanyModalOpen(true);
  };

  const handleEditCompany = (company: CompanyBranchConfig) => {
    setEditingCompany(company);
    setCompanyForm({
      code: company.code,
      name: company.name,
      acronym: company.acronym,
      unitName: company.unitName,
      type: company.type,
      cnpj: company.cnpj || "",
      active: company.active,
    });
    setCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await adminApi.updateCompany(editingCompany.id, companyForm);
      } else {
        await adminApi.createCompany(companyForm);
      }
      setCompanyModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar empresa:", err);
    }
  };

  const handleConfirmToggleCompany = async () => {
    if (!toggleCompanyConfirm) return;
    try {
      await adminApi.toggleCompanyStatus(toggleCompanyConfirm.id, !toggleCompanyConfirm.active);
      setToggleCompanyConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Erro ao alterar status da empresa:", err);
    }
  };

  // Filtro de empresas
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const term = companySearch.toLowerCase();
      return (
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.acronym.toLowerCase().includes(term) ||
        c.unitName.toLowerCase().includes(term)
      );
    });
  }, [companies, companySearch]);

  const selectedCompanyObj = companies.find((c) => c.code === selectedWorkflowCompany);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>
            <Icon name="cog" size={26} />
            Administração do Sistema
          </h1>
          <p className={styles.subtitle}>
            Modelagem visual de esteiras de alçadas, governança e gestão de unidades corporativas.
          </p>
        </div>
        <div className={styles.headerActions}>
          {activeTab === "empresas" && (
            <Button variant="primary" onClick={handleOpenNewCompany}>
              <Icon name="plus" size={16} />
              Nova Empresa / Filial
            </Button>
          )}
          {activeTab === "alcadas" && (
            <Button variant="primary" onClick={handleOpenNewRange}>
              <Icon name="plus" size={16} />
              Nova Faixa de Valor
            </Button>
          )}
        </div>
      </div>

      {}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Empresas & Unidades</span>
          <span className={styles.statValue}>{companies.length}</span>
          <span className={styles.statDesc}>
            {companies.filter((c) => c.active).length} ativas no portal
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Faixas de Alçada</span>
          <span className={styles.statValue}>{valueRanges.length}</span>
          <span className={styles.statDesc}>
            {activeFlowType === "pedido" ? "Pedidos de Compra" : "Solicitações"} ({selectedCompanyObj?.acronym || selectedWorkflowCompany})
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Níveis Configurados</span>
          <span className={styles.statValue}>{companyRules.length}</span>
          <span className={styles.statDesc}>
            {diagnostics.isValid ? "Workflow 100% íntegro" : `${diagnostics.issues.length} alerta(s)`}
          </span>
        </div>
      </div>

      {}
      <Tabs tabs={ADMIN_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <Card>
          <Loading />
        </Card>
      ) : (
        <>
          {}
          {activeTab === "alcadas" && (
            <div className={styles.tableCard}>
              {}
              <div className={styles.workflowToolbar}>
                <div className={styles.filterGroup}>
                  <label htmlFor="companySelectWorkflow" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    Empresa / Unidade:
                  </label>
                  <select
                    id="companySelectWorkflow"
                    className={styles.select}
                    value={selectedWorkflowCompany}
                    onChange={(e) => {
                      if (isDirty) {
                        if (!confirm("Existem alterações não salvas nesta empresa. Deseja trocar mesmo assim?")) return;
                        setIsDirty(false);
                      }
                      setSelectedWorkflowCompany(e.target.value);
                    }}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} - {c.name} ({c.acronym})
                      </option>
                    ))}
                  </select>
                </div>

                {}
                <div className={styles.flowTypeToggle}>
                  <button
                    type="button"
                    className={`${styles.flowTypeBtn} ${
                      activeFlowType === "solicitacao" ? styles.flowTypeBtnActive : ""
                    }`}
                    onClick={() => {
                      if (isDirty) {
                        if (!confirm("Existem alterações não salvas. Deseja trocar de fluxo?")) return;
                        setIsDirty(false);
                      }
                      setActiveFlowType("solicitacao");
                    }}
                  >
                    <Icon name="file-text" size={15} />
                    Alçadas de Solicitação
                  </button>
                  <button
                    type="button"
                    className={`${styles.flowTypeBtn} ${
                      activeFlowType === "pedido" ? styles.flowTypeBtnActive : ""
                    }`}
                    onClick={() => {
                      if (isDirty) {
                        if (!confirm("Existem alterações não salvas. Deseja trocar de fluxo?")) return;
                        setIsDirty(false);
                      }
                      setActiveFlowType("pedido");
                    }}
                  >
                    <Icon name="shopping-cart" size={15} />
                    Alçadas de Pedido de Compra
                  </button>
                </div>

                {}
                <div className={styles.simulatorBox}>
                  <span className={styles.simulatorLabel}>
                    <Icon name="search" size={15} />
                    Simular {activeFlowType === "pedido" ? "Pedido" : "Solicitação"}: R$
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    className={styles.simulatorInput}
                    value={simulationAmount}
                    onChange={(e) => setSimulationAmount(e.target.value)}
                    placeholder="Valor em R$"
                  />
                  {activeSimulatedRange ? (
                    <span className={styles.simulatorResultBadge}>
                      Ativa: {formatRangeLabel(activeSimulatedRange.minAmount, activeSimulatedRange.maxAmount)} ({activeSimulatedRange.rules.length} alçadas)
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 600 }}>
                      Nenhuma faixa cobre este valor
                    </span>
                  )}
                </div>
              </div>

              {}
              <div
                className={`${styles.diagnosticsBanner} ${
                  diagnostics.isValid
                    ? styles.diagnosticsBannerSuccess
                    : styles.diagnosticsBannerWarning
                }`}
              >
                <Icon
                  name={diagnostics.isValid ? "check-circle" : "alert-triangle"}
                  size={20}
                />
                <div style={{ flex: 1 }}>
                  <strong>
                    {diagnostics.isValid
                      ? "Workflow Íntegro e Contínuo"
                      : "Atenção: Inconsistências identificadas no fluxo"}
                  </strong>
                  {!diagnostics.isValid && (
                    <ul className={styles.diagnosticsList}>
                      {diagnostics.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {}
              <div className={styles.workflowCanvas}>
                {valueRanges.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                    <p style={{ fontSize: "1rem", fontWeight: 600 }}>
                      Nenhuma alçada configurada para esta empresa.
                    </p>
                    <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      Clique no botão abaixo para adicionar a primeira faixa de valores.
                    </p>
                    <div style={{ marginTop: "1rem" }}>
                      <Button variant="primary" onClick={handleOpenNewRange}>
                        <Icon name="plus" size={16} />
                        Criar Primeira Faixa
                      </Button>
                    </div>
                  </div>
                ) : (
                  valueRanges.map((rg) => {
                    const isSimulatedMatch = activeSimulatedRange?.rangeKey === rg.rangeKey;
                    return (
                      <div
                        key={rg.rangeKey}
                        className={`${styles.rangeCard} ${isSimulatedMatch ? styles.rangeCardActive : ""}`}
                      >
                        {}
                        <div className={styles.rangeCardHeader}>
                          <div className={styles.rangeTitleGroup}>
                            <div className={styles.rangeBadgeIcon}>
                              <Icon name="tag" size={18} />
                            </div>
                            <div>
                              <h3 className={styles.rangeTitle}>
                                {formatRangeLabel(rg.minAmount, rg.maxAmount)}
                              </h3>
                              <p className={styles.rangeSubTitle}>
                                {rg.rules.length}{" "}
                                {rg.rules.length === 1 ? "nível sequencial" : "níveis sequenciais"}{" "}
                                de aprovação exigidos
                              </p>
                            </div>
                          </div>
                          <div className={styles.rangeActions}>
                            {isSimulatedMatch && (
                              <Badge variant="primary">Faixa Ativa na Simulação</Badge>
                            )}
                            <button
                              className={styles.iconBtn}
                              onClick={() => handleEditRange(rg)}
                              title="Editar limites desta faixa"
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={() => setDeleteRangeKey(rg.rangeKey)}
                              title="Excluir faixa inteira"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </div>

                        {}
                        <div className={styles.flowBody}>
                          {}
                          <div className={styles.flowStartNode}>
                            <Icon
                              name={activeFlowType === "pedido" ? "shopping-cart" : "file-text"}
                              size={15}
                            />
                            {activeFlowType === "pedido"
                              ? "Pedido de Compra Emitido"
                              : "Solicitação de Compra Criada"}
                          </div>

                          {}
                          <div className={styles.flowArrowContainer}>
                            <div className={styles.flowArrowLine} />
                            <span className={styles.flowArrowHead}>▼</span>
                          </div>

                          {}
                          {rg.rules
                            .sort((a, b) => a.order - b.order || a.level - b.level)
                            .map((step, stepIndex) => (
                              <React.Fragment key={step.id}>
                                <div className={styles.stepCard}>
                                  <div className={styles.stepLeft}>
                                    <div className={styles.stepNumber}>{step.level}</div>
                                    <div className={styles.stepDetails}>
                                      <h4>{step.approverName}</h4>
                                      <div className={styles.stepMeta}>
                                        <span className={styles.stepTypeTag}>
                                          {step.approverType}
                                        </span>
                                        <span className={styles.stepIdTag}>
                                          ID / Papel: {step.approverIdentifier}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className={styles.stepControls}>
                                    <button
                                      disabled={stepIndex === 0}
                                      className={styles.iconBtn}
                                      onClick={() => handleMoveStep(rg, stepIndex, "up")}
                                      title="Mover para cima"
                                      style={{ opacity: stepIndex === 0 ? 0.3 : 1 }}
                                    >
                                      <Icon name="chevron-up" size={16} />
                                    </button>
                                    <button
                                      disabled={stepIndex === rg.rules.length - 1}
                                      className={styles.iconBtn}
                                      onClick={() => handleMoveStep(rg, stepIndex, "down")}
                                      title="Mover para baixo"
                                      style={{ opacity: stepIndex === rg.rules.length - 1 ? 0.3 : 1 }}
                                    >
                                      <Icon name="chevron-down" size={16} />
                                    </button>
                                    <button
                                      className={styles.iconBtn}
                                      onClick={() => handleEditStep(step, rg.rangeKey)}
                                      title="Editar aprovador"
                                    >
                                      <Icon name="edit" size={16} />
                                    </button>
                                    <button
                                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                      onClick={() => setDeleteRuleId(step.id)}
                                      title="Remover este nível"
                                    >
                                      <Icon name="trash" size={16} />
                                    </button>
                                  </div>
                                </div>

                                {}
                                <div className={styles.flowArrowContainer}>
                                  <div className={styles.flowArrowLine} />
                                  <span className={styles.flowArrowHead}>▼</span>
                                </div>
                              </React.Fragment>
                            ))}

                          {}
                          <div className={styles.flowEndNode}>
                            <Icon name="check-circle" size={15} />
                            {activeFlowType === "pedido"
                              ? "Aprovação Concluída (Pedido Liberado para Envio ao Fornecedor)"
                              : "Aprovação Concluída (Solicitação Liberada para Cotação / RFQ)"}
                          </div>

                          {}
                          <div className={styles.addStepBtnRow}>
                            <button
                              type="button"
                              className={styles.addStepBtn}
                              onClick={() => handleAddStepToRange(rg)}
                            >
                              <Icon name="plus" size={15} />
                              Adicionar Próximo Nível de Aprovação
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {}
                <div className={styles.addRangeCard} onClick={handleOpenNewRange}>
                  <div className={styles.addRangeIcon}>
                    <Icon name="plus" size={22} />
                  </div>
                  <span className={styles.addRangeText}>+ Adicionar Nova Faixa de Valor</span>
                </div>
              </div>

              {}
              {isDirty && (
                <div className={styles.saveBar}>
                  <div className={styles.saveBarText}>
                    Existem alterações não salvas no workflow da empresa{" "}
                    <strong>{selectedCompanyObj?.name || selectedWorkflowCompany}</strong>.
                  </div>
                  <div className={styles.saveBarActions}>
                    <Button
                      variant="secondary"
                      onClick={handleDiscardChanges}
                      disabled={savingBatch}
                    >
                      Descartar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveAllRules}
                      loading={savingBatch}
                      loadingText="Salvando..."
                    >
                      <Icon name="check" size={16} />
                      Salvar Alterações no Backend
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          {activeTab === "empresas" && (
            <>
              <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                  <SearchInput
                    value={companySearch}
                    onSearch={setCompanySearch}
                    placeholder="Buscar por código, nome, sigla ou unidade..."
                  />
                </div>
                <div>
                  <span className={styles.cellSecondary}>
                    Mostrando {filteredCompanies.length} de {companies.length} unidades
                  </span>
                </div>
              </div>

              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Razão Social / Nome Fantasia</th>
                      <th>Sigla / Unidade</th>
                      <th>Tipo</th>
                      <th>CNPJ</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                          Nenhuma empresa encontrada com o filtro atual.
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <Badge variant="gray">{c.code}</Badge>
                          </td>
                          <td>
                            <div className={styles.cellPrimary}>{c.name}</div>
                            <div className={styles.cellSecondary}>ID: {c.id}</div>
                          </td>
                          <td>
                            <div className={styles.cellPrimary}>{c.acronym}</div>
                            <div className={styles.cellSecondary}>{c.unitName}</div>
                          </td>
                          <td>
                            <Badge variant={c.type === "Matriz" ? "primary" : "gray"}>
                              {c.type}
                            </Badge>
                          </td>
                          <td>{c.cnpj || "—"}</td>
                          <td>
                            <Badge variant={c.active ? "success" : "danger"}>
                              {c.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td>
                            <div className={styles.cellActions}>
                              <button
                                className={styles.iconBtn}
                                onClick={() => handleEditCompany(c)}
                                title="Editar unidade"
                              >
                                <Icon name="edit" size={16} />
                              </button>
                              <button
                                className={`${styles.iconBtn} ${c.active ? styles.iconBtnDanger : ""}`}
                                onClick={() => setToggleCompanyConfirm(c)}
                                title={c.active ? "Desativar unidade" : "Ativar unidade"}
                              >
                                <Icon name={c.active ? "trash" : "check"} size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {}
          {activeTab === "governanca" && (
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div>
                  <h3>Matriz de Permissões e Perfis Operacionais</h3>
                  <p>
                    Resumo dos papéis do sistema autorizados a participar do fluxo e administrar o portal.
                  </p>
                </div>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Papel (Role)</th>
                    <th>Descrição</th>
                    <th>Pode Aprovar Alçadas?</th>
                    <th>Acesso Admin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>admin</code></td>
                    <td>Administrador Geral da Plataforma e Presidência</td>
                    <td><Badge variant="success">Sim (Nível Máximo)</Badge></td>
                    <td><Badge variant="success">Acesso Total</Badge></td>
                  </tr>
                  <tr>
                    <td><code>gerente</code></td>
                    <td>Gerentes de Unidade / Centro de Custo</td>
                    <td><Badge variant="success">Sim (Até R$ 10.000 / Nível 1)</Badge></td>
                    <td><Badge variant="success">Acesso Configuração</Badge></td>
                  </tr>
                  <tr>
                    <td><code>diretor</code> / <code>cfo</code></td>
                    <td>Diretoria Executiva, Operações e Finanças</td>
                    <td><Badge variant="success">Sim (Até R$ 250.000+)</Badge></td>
                    <td><Badge variant="gray">Consulta</Badge></td>
                  </tr>
                  <tr>
                    <td><code>comprador</code></td>
                    <td>Equipe de Suprimentos / Operação de Compras</td>
                    <td><Badge variant="gray">Apenas Operacional</Badge></td>
                    <td><Badge variant="danger">Restrito</Badge></td>
                  </tr>
                  <tr>
                    <td><code>requisitante</code></td>
                    <td>Usuário Solicitante de Materiais e Serviços</td>
                    <td><Badge variant="gray">Não</Badge></td>
                    <td><Badge variant="danger">Restrito</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {}
      {rangeModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingRangeKey ? "Editar Limites da Faixa" : "Nova Faixa de Valor"}</h3>
              <button className={styles.modalClose} onClick={() => setRangeModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRange}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Valor Mínimo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      className={styles.input}
                      value={rangeForm.minAmount}
                      onChange={(e) =>
                        setRangeForm({ ...rangeForm, minAmount: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Valor Máximo (R$ vazio = sem teto)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className={styles.input}
                      value={rangeForm.maxAmount}
                      onChange={(e) =>
                        setRangeForm({ ...rangeForm, maxAmount: e.target.value })
                      }
                      placeholder="Ilimitado / Sem teto"
                    />
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Empresa vinculada: <strong>{selectedCompanyObj?.name || selectedWorkflowCompany}</strong>
                </p>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" type="button" onClick={() => setRangeModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  Confirmar Faixa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {stepModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingRule ? "Editar Aprovador do Nível" : "Adicionar Nível de Aprovação"}</h3>
              <button className={styles.modalClose} onClick={() => setStepModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStep}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nível da Alçada</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      className={styles.input}
                      value={stepForm.level}
                      onChange={(e) => setStepForm({ ...stepForm, level: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Ordem / Sequência</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      className={styles.input}
                      value={stepForm.order}
                      onChange={(e) => setStepForm({ ...stepForm, order: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tipo de Aprovador</label>
                    <select
                      className={styles.select}
                      value={stepForm.approverType}
                      onChange={(e) =>
                        setStepForm({ ...stepForm, approverType: e.target.value as ApproverType })
                      }
                    >
                      <option value="role">Papel / Função (Role)</option>
                      <option value="user">Usuário Específico (ID / E-mail)</option>
                      <option value="group">Comitê / Colegiado</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Identificador (Role/ID)</label>
                    <input
                      required
                      className={styles.input}
                      value={stepForm.approverIdentifier}
                      onChange={(e) =>
                        setStepForm({ ...stepForm, approverIdentifier: e.target.value })
                      }
                      placeholder="Ex: gerente, diretor, admin"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Título / Cargo do Aprovador</label>
                  <input
                    required
                    className={styles.input}
                    value={stepForm.approverName}
                    onChange={(e) => setStepForm({ ...stepForm, approverName: e.target.value })}
                    placeholder="Ex: Gerente da Área, Diretoria de Operações"
                  />
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={stepForm.active}
                    onChange={(e) => setStepForm({ ...stepForm, active: e.target.checked })}
                  />
                  Nível ativo na esteira de aprovação
                </label>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" type="button" onClick={() => setStepModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  Salvar Nível
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {companyModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingCompany ? "Editar Unidade" : "Nova Unidade / Filial"}</h3>
              <button className={styles.modalClose} onClick={() => setCompanyModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCompany}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Código da Empresa (ERP)</label>
                    <input
                      required
                      className={styles.input}
                      value={companyForm.code}
                      onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
                      placeholder="Ex: 2313"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Sigla</label>
                    <input
                      required
                      className={styles.input}
                      value={companyForm.acronym}
                      onChange={(e) => setCompanyForm({ ...companyForm, acronym: e.target.value })}
                      placeholder="Ex: BRD"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Razão Social</label>
                  <input
                    required
                    className={styles.input}
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="Ex: VB AGRO LTDA"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nome da Unidade / Fazenda / Escritório</label>
                  <input
                    required
                    className={styles.input}
                    value={companyForm.unitName}
                    onChange={(e) => setCompanyForm({ ...companyForm, unitName: e.target.value })}
                    placeholder="Ex: Fazenda Nova Lacerda"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tipo</label>
                    <select
                      className={styles.select}
                      value={companyForm.type}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          type: e.target.value as "Matriz" | "Filial",
                        })
                      }
                    >
                      <option value="Matriz">Matriz</option>
                      <option value="Filial">Filial</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>CNPJ (Opcional)</label>
                    <input
                      className={styles.input}
                      value={companyForm.cnpj}
                      onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={companyForm.active}
                    onChange={(e) => setCompanyForm({ ...companyForm, active: e.target.checked })}
                  />
                  Unidade ativa para novas solicitações e pedidos
                </label>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" type="button" onClick={() => setCompanyModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      <ConfirmDialog
        open={Boolean(deleteRuleId)}
        title="Remover Nível de Aprovação"
        message="Tem certeza que deseja remover este nível da esteira de aprovação?"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => deleteRuleId && handleDeleteStep(deleteRuleId)}
        onCancel={() => setDeleteRuleId(null)}
      />

      {}
      <ConfirmDialog
        open={Boolean(deleteRangeKey)}
        title="Excluir Faixa de Valor"
        message="Tem certeza que deseja excluir esta faixa de valor e todos os seus níveis de aprovação associados?"
        confirmLabel="Excluir Faixa"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => deleteRangeKey && handleDeleteRange(deleteRangeKey)}
        onCancel={() => setDeleteRangeKey(null)}
      />

      {}
      <ConfirmDialog
        open={Boolean(toggleCompanyConfirm)}
        title={toggleCompanyConfirm?.active ? "Desativar Unidade" : "Ativar Unidade"}
        message={`Deseja realmente ${
          toggleCompanyConfirm?.active ? "desativar" : "ativar"
        } a unidade ${toggleCompanyConfirm?.name} (${toggleCompanyConfirm?.code})?`}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        variant={toggleCompanyConfirm?.active ? "danger" : "info"}
        onConfirm={handleConfirmToggleCompany}
        onCancel={() => setToggleCompanyConfirm(null)}
      />
    </div>
  );
}
