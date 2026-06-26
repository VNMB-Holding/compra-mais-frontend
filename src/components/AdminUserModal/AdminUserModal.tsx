import React from "react";
import Icon from "@/components/ui/Icon/Icon";
import { Button } from "@/components/ui";
import styles from "@/app/administracao/administracao.module.css";

interface AdminUserModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: {
    name: string;
    email: string;
    department: string;
    phone: string;
    role: string;
    isActive: boolean;
  };
  onClose: () => void;
  onSave: (data: UserFormData) => void;
}

export interface UserFormData {
  name: string;
  email: string;
  department: string;
  phone: string;
  role: string;
  isActive: boolean;
}

const ROLE_OPTIONS = [
  { value: "solicitante", label: "Solicitante" },
  { value: "procurist", label: "Procurist (Comprador)" },
  { value: "gerente", label: "Gerente" },
  { value: "admin", label: "Administrador" },
];

const DEPT_OPTIONS = [
  { value: "Operações e Suprimentos", label: "Operações e Suprimentos" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Recursos Humanos", label: "Recursos Humanos" },
  { value: "Tecnologia da Informação", label: "Tecnologia da Informação" },
  { value: "Jurídico", label: "Jurídico" },
  { value: "Comercial", label: "Comercial" },
  { value: "Diretoria", label: "Diretoria" },
];

const DEFAULT_DATA: UserFormData = {
  name: "",
  email: "",
  department: "Operações e Suprimentos",
  phone: "",
  role: "solicitante",
  isActive: true,
};

export default function AdminUserModal({
  open,
  mode,
  initialData,
  onClose,
  onSave,
}: AdminUserModalProps) {
  const [form, setForm] = React.useState<UserFormData>(
    initialData || DEFAULT_DATA
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initialData || DEFAULT_DATA);
      setLoading(false);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    onSave(form);
  };

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlay}>
      <div className={styles.modalBox}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconWrap}>
              <Icon name={mode === "create" ? "user-plus-01" : "edit-02"} />
            </div>
            <div>
              <p className={styles.modalTitle}>
                {mode === "create" ? "Novo Usuário" : "Editar Usuário"}
              </p>
              <p className={styles.modalSubtitle}>
                {mode === "create"
                  ? "Preencha os dados para criar um novo acesso no sistema."
                  : "Atualize os dados do usuário selecionado."}
              </p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} type="button">
            <Icon name="x-close" size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <p className={styles.sectionSubtitle}>Dados Pessoais</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Nome Completo <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  className={styles.formControl}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Maria Souza"
                  required
                  disabled={loading}
                />
              </div>
              <div className={styles.formGroup}>
                <label>E-mail <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  className={styles.formControl}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="usuario@empresa.com"
                  required
                  disabled={loading || mode === "edit"}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Departamento</label>
                <select
                  className={styles.formControl}
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {DEPT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Telefone</label>
                <input
                  className={styles.formControl}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>
            </div>

            <hr className={styles.sectionDivider} />
            <p className={styles.sectionSubtitle}>Acesso e Perfil</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Tipo de Usuário <span style={{ color: "#ef4444" }}>*</span></label>
                <select
                  className={styles.formControl}
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <div className={styles.toggleRow} style={{ marginTop: "6px" }}>
                  <span className={styles.toggleLabel}>
                    {form.isActive ? "Conta Ativa" : "Conta Inativa"}
                  </span>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                      disabled={loading}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading
                ? "Salvando..."
                : mode === "create"
                ? "Criar Usuário"
                : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
