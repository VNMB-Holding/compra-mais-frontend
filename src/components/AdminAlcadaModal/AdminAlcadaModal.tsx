import React from "react";
import Icon from "@/components/ui/Icon/Icon";
import { Button } from "@/components/ui";
import styles from "@/app/administracao/administracao.module.css";

interface AdminAlcadaModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: AlcadaFormData;
  onClose: () => void;
  onSave: (data: AlcadaFormData) => void;
}

export interface AlcadaFormData {
  nivel: number;
  descricao: string;
  department: string;
  valorMin: string;
  valorMax: string;
  role: string;
  aprovadorNome: string;
}

const DEPT_OPTIONS = [
  { value: "Todos", label: "Todos os Departamentos" },
  { value: "Operações e Suprimentos", label: "Operações e Suprimentos" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Recursos Humanos", label: "Recursos Humanos" },
  { value: "Tecnologia da Informação", label: "Tecnologia da Informação" },
  { value: "Comercial", label: "Comercial" },
  { value: "Diretoria", label: "Diretoria" },
];

const ROLE_OPTIONS = [
  { value: "gerente", label: "Gerente" },
  { value: "procurist", label: "Procurist (Comprador)" },
  { value: "admin", label: "Administrador" },
];

const DEFAULT_DATA: AlcadaFormData = {
  nivel: 1,
  descricao: "",
  department: "Todos",
  valorMin: "0",
  valorMax: "",
  role: "gerente",
  aprovadorNome: "",
};

export default function AdminAlcadaModal({
  open,
  mode,
  initialData,
  onClose,
  onSave,
}: AdminAlcadaModalProps) {
  const [form, setForm] = React.useState<AlcadaFormData>(
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
              <Icon name="shield-tick" />
            </div>
            <div>
              <p className={styles.modalTitle}>
                {mode === "create" ? "Nova Alçada de Aprovação" : "Editar Alçada"}
              </p>
              <p className={styles.modalSubtitle}>
                Defina o nível, a faixa de valor e o aprovador responsável.
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
            <p className={styles.sectionSubtitle}>Identificação</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Nível da Alçada <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  className={styles.formControl}
                  type="number"
                  name="nivel"
                  min={1}
                  max={10}
                  value={form.nivel}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
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
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Descrição</label>
              <input
                className={styles.formControl}
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Ex: Aprovação de compras operacionais"
                disabled={loading}
              />
            </div>

            <hr className={styles.sectionDivider} />
            <p className={styles.sectionSubtitle}>Faixa de Valor</p>

            <div className={styles.rangeRow}>
              <div className={styles.formGroup}>
                <label>Valor Mínimo (R$)</label>
                <input
                  className={styles.formControl}
                  type="number"
                  name="valorMin"
                  min={0}
                  value={form.valorMin}
                  onChange={handleChange}
                  placeholder="0,00"
                  disabled={loading}
                />
              </div>
              <span className={styles.rangeSep}>até</span>
              <div className={styles.formGroup}>
                <label>Valor Máximo (R$)</label>
                <input
                  className={styles.formControl}
                  type="number"
                  name="valorMax"
                  min={0}
                  value={form.valorMax}
                  onChange={handleChange}
                  placeholder="Sem limite"
                  disabled={loading}
                />
              </div>
            </div>

            <hr className={styles.sectionDivider} />
            <p className={styles.sectionSubtitle}>Aprovador</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Tipo de Aprovador <span style={{ color: "#ef4444" }}>*</span></label>
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
                <label>Usuário Específico (opcional)</label>
                <input
                  className={styles.formControl}
                  name="aprovadorNome"
                  value={form.aprovadorNome}
                  onChange={handleChange}
                  placeholder="Nome ou e-mail do aprovador"
                  disabled={loading}
                />
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
                ? "Criar Alçada"
                : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
