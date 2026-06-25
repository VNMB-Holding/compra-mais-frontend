"use client";

import React, { useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Card, Button, Icon, Select, Tabs } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import styles from "./perfil.module.css";

const LANG_OPTIONS = [
  { label: "Português (PT-BR)", value: "pt" },
  { label: "English (US)", value: "en" },
  { label: "Español (ES)", value: "es" },
];

const TZ_OPTIONS = [
  { label: "Brasília (GMT-3)", value: "GMT-3" },
  { label: "New York (GMT-5)", value: "GMT-5" },
  { label: "London (GMT+0)", value: "GMT+0" },
];

export default function PerfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("dados-pessoais");
  const [loading, setLoading] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "(11) 98765-4321",
    department: user?.department || "Operações e Suprimentos",
  });

  // UI preferences state
  const [prefs, setPrefs] = useState({
    lang: "pt",
    tz: "GMT-3",
    theme: "Claro",
    notifyNewRfq: true,
    notifyApproval: true,
    notifyMessages: true,
    notifyWeeklySummary: false,
  });

  // Password fields state
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefChange = (name: string, value: any) => {
    setPrefs((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast({
      title: "Perfil atualizado",
      message: "Seus dados pessoais foram atualizados com sucesso.",
      variant: "success",
    });
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast({
      title: "Preferências salvas",
      message: "Suas configurações de notificações e idioma foram aplicadas.",
      variant: "success",
    });
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast({
        title: "Erro de validação",
        message: "As senhas novas não coincidem.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast({
      title: "Senha alterada!",
      message: "Sua senha de acesso foi modificada com sucesso.",
      variant: "success",
    });
    setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const tabItems = [
    { id: "dados-pessoais", label: "Dados Pessoais" },
    { id: "preferencias", label: "Preferências" },
    { id: "seguranca", label: "Segurança & Acesso" },
  ];

  return (
    <ProtectedLayout allowedRoles={["procurist", "solicitante", "gerente", "admin"]}>
      <div className={styles.pageContainer}>
        
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1>Configurações de Perfil</h1>
          <p>Gerencie seus dados de acesso, preferências do sistema e opções de notificação.</p>
        </div>

        {/* Profile Card Header */}
        <Card className={styles.profileSummaryCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarBig}>
              {getInitials(profileData.name)}
            </div>
            <button className={styles.avatarEditBtn} title="Alterar foto">
              <Icon name="edit-02" size={14} />
            </button>
          </div>
          <div className={styles.summaryDetails}>
            <h2>
              {profileData.name}
              <span className={styles.roleBadge}>{user?.role}</span>
            </h2>
            <p>{profileData.email} • {profileData.department}</p>
          </div>
        </Card>

        {/* Tab Selection */}
        <div className={styles.tabsContainer}>
          <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Dynamic content cards */}
        {activeTab === "dados-pessoais" && (
          <Card className={styles.contentCard}>
            <h3 className={styles.sectionTitle}>
              <Icon name="user-01" /> Dados do Usuário
            </h3>

            <form onSubmit={handleSaveProfile}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nome Completo <span className="required-asterisk">*</span></label>
                  <input
                    className={styles.formControl}
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>E-mail de Trabalho</label>
                  <input
                    className={styles.formControl}
                    name="email"
                    value={profileData.email}
                    disabled
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Departamento / Setor</label>
                  <input
                    className={styles.formControl}
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Telefone para Contato</label>
                  <input
                    className={styles.formControl}
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === "preferencias" && (
          <Card className={styles.contentCard}>
            <form onSubmit={handleSavePreferences}>
              
              <h3 className={styles.sectionTitle}>
                <Icon name="globe-01" /> Idioma e Região
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Idioma Principal</label>
                  <Select
                    options={LANG_OPTIONS}
                    value={prefs.lang}
                    onChange={(val) => handlePrefChange("lang", val)}
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Fuso Horário</label>
                  <Select
                    options={TZ_OPTIONS}
                    value={prefs.tz}
                    onChange={(val) => handlePrefChange("tz", val)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ height: "16px" }} />

              <h3 className={styles.sectionTitle}>
                <Icon name="bell-01" /> Preferências de Notificação
              </h3>

              <div className={styles.prefList}>
                <div className={styles.prefItem}>
                  <div className={styles.prefTexts}>
                    <span className={styles.prefTitle}>Novos Processos de Cotação (RFQs)</span>
                    <span className={styles.prefDesc}>Receba alertas quando fornecedores enviarem novas propostas.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={prefs.notifyNewRfq}
                      onChange={(e) => handlePrefChange("notifyNewRfq", e.target.checked)}
                      disabled={loading}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.prefItem}>
                  <div className={styles.prefTexts}>
                    <span className={styles.prefTitle}>Aprovações de Solicitações</span>
                    <span className={styles.prefDesc}>Notificar quando sua solicitação de compra mudar de alçada.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={prefs.notifyApproval}
                      onChange={(e) => handlePrefChange("notifyApproval", e.target.checked)}
                      disabled={loading}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.prefItem}>
                  <div className={styles.prefTexts}>
                    <span className={styles.prefTitle}>Mensagens Diretas</span>
                    <span className={styles.prefDesc}>Alertar sobre mensagens internas enviadas por outros compradores.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={prefs.notifyMessages}
                      onChange={(e) => handlePrefChange("notifyMessages", e.target.checked)}
                      disabled={loading}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.prefItem}>
                  <div className={styles.prefTexts}>
                    <span className={styles.prefTitle}>Resumo Semanal de Atividades</span>
                    <span className={styles.prefDesc}>E-mail consolidado todas as sextas-feiras com KPIs de saving e prazos.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={prefs.notifyWeeklySummary}
                      onChange={(e) => handlePrefChange("notifyWeeklySummary", e.target.checked)}
                      disabled={loading}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === "seguranca" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Alterar Senha */}
            <Card className={styles.contentCard}>
              <h3 className={styles.sectionTitle}>
                <Icon name="lock-01" /> Alterar Senha de Acesso
              </h3>

              <form onSubmit={handleSavePassword}>
                <div className={styles.formRow}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Senha Atual <span className="required-asterisk">*</span></label>
                    <input
                      className={styles.formControl}
                      type="password"
                      name="currentPassword"
                      value={passData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nova Senha <span className="required-asterisk">*</span></label>
                    <input
                      className={styles.formControl}
                      type="password"
                      name="newPassword"
                      value={passData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Confirmar Nova Senha <span className="required-asterisk">*</span></label>
                    <input
                      className={styles.formControl}
                      type="password"
                      name="confirmPassword"
                      value={passData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Redefinindo..." : "Atualizar Senha"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Sessões do sistema */}
            <Card className={styles.contentCard}>
              <h3 className={styles.sectionTitle}>
                <Icon name="monitor-01" /> Sessões do Sistema
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "-12px 0 16px 0" }}>
                Gerencie as conexões ativas do seu usuário no sistema Compra+.
              </p>

              <div className={styles.tableResponsive}>
                <table className={styles.sessionTable}>
                  <thead>
                    <tr>
                      <th>Dispositivo</th>
                      <th>Localização</th>
                      <th>Endereço IP</th>
                      <th>Última Atividade</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Chrome no Windows 11</strong>
                      </td>
                      <td>São Paulo, SP, BR</td>
                      <td>177.102.45.12</td>
                      <td>
                        <span className={styles.currentBadge}>Sessão atual</span>
                      </td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td>Safari no iPhone 15 Pro</td>
                      <td>Rio de Janeiro, RJ, BR</td>
                      <td>179.84.112.98</td>
                      <td>Ontem às 18:42</td>
                      <td>
                        <button className={styles.btnDangerLink} type="button">Revogar</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Firefox no MacOS Sonoma</td>
                      <td>Belo Horizonte, MG, BR</td>
                      <td>191.242.33.64</td>
                      <td>20/06/2026 às 11:15</td>
                      <td>
                        <button className={styles.btnDangerLink} type="button">Revogar</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

      </div>
    </ProtectedLayout>
  );
}
