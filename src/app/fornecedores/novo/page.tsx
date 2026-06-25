"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Icon, Select } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./novo.module.css";

const CATEGORIA_OPTIONS = [
  { label: "Serviços", value: "Serviços", icon: "briefcase-01" },
  { label: "Combustíveis", value: "Combustíveis", icon: "drop" },
  { label: "TI", value: "TI", icon: "monitor-01" },
  { label: "MRO", value: "MRO", icon: "tool-01" },
  { label: "Logística", value: "Logística", icon: "truck-01" },
  { label: "Energia", value: "Energia", icon: "zap" },
];

const ESTADO_OPTIONS = [
  { label: "Acre (AC)", value: "AC" },
  { label: "Alagoas (AL)", value: "AL" },
  { label: "Amapá (AP)", value: "AP" },
  { label: "Amazonas (AM)", value: "AM" },
  { label: "Bahia (BA)", value: "BA" },
  { label: "Ceará (CE)", value: "CE" },
  { label: "Distrito Federal (DF)", value: "DF" },
  { label: "Espírito Santo (ES)", value: "ES" },
  { label: "Goiás (GO)", value: "GO" },
  { label: "Maranhão (MA)", value: "MA" },
  { label: "Mato Grosso (MT)", value: "MT" },
  { label: "Mato Grosso do Sul (MS)", value: "MS" },
  { label: "Minas Gerais (MG)", value: "MG" },
  { label: "Pará (PA)", value: "PA" },
  { label: "Paraíba (PB)", value: "PB" },
  { label: "Paraná (PR)", value: "PR" },
  { label: "Pernambuco (PE)", value: "PE" },
  { label: "Piauí (PI)", value: "PI" },
  { label: "Rio de Janeiro (RJ)", value: "RJ" },
  { label: "Rio Grande do Norte (RN)", value: "RN" },
  { label: "Rio Grande do Sul (RS)", value: "RS" },
  { label: "Rondônia (RO)", value: "RO" },
  { label: "Roraima (RR)", value: "RR" },
  { label: "Santa Catarina (SC)", value: "SC" },
  { label: "São Paulo (SP)", value: "SP" },
  { label: "Sergipe (SE)", value: "SE" },
  { label: "Tocantins (TO)", value: "TO" },
];

const PAGAMENTO_OPTIONS = [
  { label: "À vista", value: "À vista" },
  { label: "15 dias DDL", value: "15 dias DDL" },
  { label: "30 dias DDL", value: "30 dias DDL" },
  { label: "45 dias DDL", value: "45 dias DDL" },
  { label: "60 dias DDL", value: "60 dias DDL" },
  { label: "90 dias DDL", value: "90 dias DDL" },
];

export default function NovoFornecedorPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    inscricaoEstadual: "",
    categoria: "Serviços",
    contatoNome: "",
    contatoEmail: "",
    contatoTelefone: "",
    website: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "SP",
    banco: "",
    agencia: "",
    contaCorrente: "",
    chavePix: "",
    condicaoPagamento: "30 dias DDL",
  });

  // Masks
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.slice(0, 14);

    // mask XX.XXX.XXX/XXXX-XX
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5");
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
    }

    setFormData((prev) => ({ ...prev, cnpj: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    // mask (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,4})/, "($1) $2");
    } else if (value.length > 0) {
      value = value.replace(/^(\d*)/, "($1");
    }

    setFormData((prev) => ({ ...prev, contatoTelefone: value }));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    // mask XXXXX-XXX
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d{3})/, "$1-$2");
    }

    setFormData((prev) => ({ ...prev, cep: value }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper for Initials
  const getInitials = () => {
    const name = formData.nomeFantasia.trim() || formData.razaoSocial.trim();
    if (!name) return "NF";
    const parts = name.split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Checklist Validation Checks
  const isBasicInfoDone = formData.razaoSocial.trim() !== "" && formData.cnpj.length === 18;
  const isCategoryDone = formData.categoria !== "";
  const isContactDone = formData.contatoEmail.includes("@") && formData.contatoTelefone.length >= 14;
  const isAddressDone = formData.cidade.trim() !== "" && formData.estado.trim() !== "";
  const isFinancialDone = formData.chavePix.trim() !== "" || (formData.banco.trim() !== "" && formData.contaCorrente.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.razaoSocial.trim()) {
      toast({
        title: "Erro no preenchimento",
        message: "Por favor, preencha a Razão Social do fornecedor.",
        variant: "error",
      });
      return;
    }

    if (formData.cnpj.length !== 18) {
      toast({
        title: "Erro no preenchimento",
        message: "Por favor, preencha um CNPJ válido.",
        variant: "error",
      });
      return;
    }

    setLoading(true);

    // Simulate Server Connection
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);

    toast({
      title: "Fornecedor cadastrado!",
      message: `O fornecedor ${formData.nomeFantasia || formData.razaoSocial} foi adicionado à base e iniciou a homologação.`,
      variant: "success",
    });

    router.push("/fornecedores/diretorio");
  };

  const getAvatarStyle = () => {
    switch (formData.categoria) {
      case "Combustíveis":
        return styles.avatarOrange;
      case "TI":
        return styles.avatarBlue;
      default:
        return styles.avatarGreen;
    }
  };

  return (
    <div className={styles.formContainer}>
      <button className={styles.backBtn} onClick={() => router.push("/fornecedores/diretorio")}>
        <Icon name="arrow-left" size={16} /> Voltar para Base de Fornecedores
      </button>

      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Gestão de Fornecedores</span>
          <h1>Novo Fornecedor</h1>
          <p>Cadastre parceiros corporativos fornecendo dados básicos, contato, endereço e dados de homologação.</p>
        </div>
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              
              {/* Section 1: Dados Básicos */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name="building-01" />
                  </div>
                  <div>
                    <h2>1. Dados Básicos</h2>
                    <p>Informações de registro oficial e classificação da empresa na base.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Razão Social *</label>
                    <input
                      className={styles.formControl}
                      name="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={handleTextChange}
                      placeholder="Ex: Fornecedor de Alimentos Alfa S.A."
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nome Fantasia</label>
                    <input
                      className={styles.formControl}
                      name="nomeFantasia"
                      value={formData.nomeFantasia}
                      onChange={handleTextChange}
                      placeholder="Ex: Alimentos Alfa"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>CNPJ *</label>
                    <input
                      className={styles.formControl}
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0000-00"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Inscrição Estadual</label>
                    <input
                      className={styles.formControl}
                      name="inscricaoEstadual"
                      value={formData.inscricaoEstadual}
                      onChange={handleTextChange}
                      placeholder="Isento ou nº de inscrição"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Categoria do Fornecedor</label>
                    <Select
                      options={CATEGORIA_OPTIONS}
                      value={formData.categoria}
                      onChange={(val) => handleSelectChange("categoria", val)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Contatos */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name="user-01" />
                  </div>
                  <div>
                    <h2>2. Contatos Comerciais</h2>
                    <p>Canais para envio de ordens de compra, cotações de preços e comunicações.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nome do Contato Principal</label>
                    <input
                      className={styles.formControl}
                      name="contatoNome"
                      value={formData.contatoNome}
                      onChange={handleTextChange}
                      placeholder="Ex: João da Silva"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>E-mail Corporativo *</label>
                    <input
                      className={styles.formControl}
                      type="email"
                      name="contatoEmail"
                      value={formData.contatoEmail}
                      onChange={handleTextChange}
                      placeholder="comercial@empresa.com.br"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Telefone / WhatsApp *</label>
                    <input
                      className={styles.formControl}
                      name="contatoTelefone"
                      value={formData.contatoTelefone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Website</label>
                    <input
                      className={styles.formControl}
                      name="website"
                      value={formData.website}
                      onChange={handleTextChange}
                      placeholder="www.empresa.com.br"
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Endereço */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name="marker-pin-01" />
                  </div>
                  <div>
                    <h2>3. Endereço Operacional</h2>
                    <p>Sede principal ou ponto logístico de carregamento.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>CEP</label>
                    <input
                      className={styles.formControl}
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Estado *</label>
                    <Select
                      options={ESTADO_OPTIONS}
                      value={formData.estado}
                      onChange={(val) => handleSelectChange("estado", val)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Logradouro</label>
                    <input
                      className={styles.formControl}
                      name="logradouro"
                      value={formData.logradouro}
                      onChange={handleTextChange}
                      placeholder="Avenida, Rua, Alameda..."
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Número</label>
                    <input
                      className={styles.formControl}
                      name="numero"
                      value={formData.numero}
                      onChange={handleTextChange}
                      placeholder="Nº"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Complemento</label>
                    <input
                      className={styles.formControl}
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleTextChange}
                      placeholder="Sala, Conjunto, Bloco"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Bairro</label>
                    <input
                      className={styles.formControl}
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleTextChange}
                      placeholder="Ex: Centro"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cidade *</label>
                    <input
                      className={styles.formControl}
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleTextChange}
                      placeholder="Ex: São Paulo"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              {/* Section 4: Financeiro */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon name="bank-note-01" />
                  </div>
                  <div>
                    <h2>4. Informações Financeiras e Homologação</h2>
                    <p>Parâmetros para faturamento e pagamento de ordens.</p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Condição de Pagamento Padrão</label>
                    <Select
                      options={PAGAMENTO_OPTIONS}
                      value={formData.condicaoPagamento}
                      onChange={(val) => handleSelectChange("condicaoPagamento", val)}
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Chave PIX</label>
                    <input
                      className={styles.formControl}
                      name="chavePix"
                      value={formData.chavePix}
                      onChange={handleTextChange}
                      placeholder="E-mail, CNPJ, Telefone ou Aleatória"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Banco</label>
                    <input
                      className={styles.formControl}
                      name="banco"
                      value={formData.banco}
                      onChange={handleTextChange}
                      placeholder="Ex: Itaú Unibanco (341)"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Agência</label>
                    <input
                      className={styles.formControl}
                      name="agencia"
                      value={formData.agencia}
                      onChange={handleTextChange}
                      placeholder="Nº da agência"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Conta Corrente</label>
                    <input
                      className={styles.formControl}
                      name="contaCorrente"
                      value={formData.contaCorrente}
                      onChange={handleTextChange}
                      placeholder="Nº da conta com dígito verificador"
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => router.push("/fornecedores/diretorio")}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  className={styles.btnSubmit}
                  disabled={loading}
                >
                  <Icon name="save-01" />
                  {loading ? "Salvando..." : "Salvar e Iniciar Homologação"}
                </Button>
              </div>

            </form>
          </Card>
        </div>

        {/* Side Panel: Preview and Checklist */}
        <aside className={styles.sideColumn}>
          
          {/* Real-time Preview Card */}
          <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span>Pré-visualização</span>
              <span className={styles.statusPill}>Em análise</span>
            </div>
            
            <div className={styles.previewContent}>
              <div className={`${styles.previewAvatar} ${getAvatarStyle()}`}>
                {getInitials()}
              </div>
              <h3 className={styles.previewName}>
                {formData.nomeFantasia.trim() || formData.razaoSocial.trim() || "Novo Fornecedor"}
              </h3>
              <p className={styles.previewCnpj}>
                {formData.cnpj || "CNPJ pendente"}
              </p>

              <div className={styles.previewBadge}>
                <Icon name="tag-01" size={14} />
                {formData.categoria}
              </div>

              <div className={styles.previewDetailsList}>
                <div className={styles.previewDetailItem}>
                  <Icon name="user-01" size={16} />
                  <div className={styles.detailTexts}>
                    <small>Contato</small>
                    <span>{formData.contatoNome || "Não informado"}</span>
                  </div>
                </div>

                <div className={styles.previewDetailItem}>
                  <Icon name="mail-01" size={16} />
                  <div className={styles.detailTexts}>
                    <small>E-mail</small>
                    <span>{formData.contatoEmail || "Não informado"}</span>
                  </div>
                </div>

                <div className={styles.previewDetailItem}>
                  <Icon name="phone" size={16} />
                  <div className={styles.detailTexts}>
                    <small>Telefone</small>
                    <span>{formData.contatoTelefone || "Não informado"}</span>
                  </div>
                </div>

                <div className={styles.previewDetailItem}>
                  <Icon name="marker-pin-01" size={16} />
                  <div className={styles.detailTexts}>
                    <small>Cidade/Estado</small>
                    <span>
                      {formData.cidade.trim() ? `${formData.cidade} - ${formData.estado}` : "Não informada"}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </Card>

          {/* Checklist Completeness Card */}
          <Card className={styles.checklistCard}>
            <div className={styles.sideTitle}>
              <Icon name="info-circle" />
              <h3>Requisitos de Cadastro</h3>
            </div>
            <ul>
              <li className={isBasicInfoDone ? styles.done : ""}>
                Dados Básicos (Razão Social & CNPJ)
              </li>
              <li className={isCategoryDone ? styles.done : ""}>
                Categoria Selecionada
              </li>
              <li className={isContactDone ? styles.done : ""}>
                Contatos (E-mail e Telefone)
              </li>
              <li className={isAddressDone ? styles.done : ""}>
                Endereço Principal Definido
              </li>
              <li className={isFinancialDone ? styles.done : ""}>
                Dados Financeiros (Banco ou PIX)
              </li>
            </ul>
          </Card>

        </aside>
      </div>
    </div>
  );
}
