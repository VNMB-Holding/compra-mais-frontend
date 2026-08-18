import React from "react";
import Icon from "@/components/ui/Icon/Icon";
import { Button } from "@/components/ui";
import styles from "@/app/administracao/administracao.module.css";

export interface EmpresaFormData {
  corporateName: string;
  tradeName: string;
  cnpj: string;
  segmento: string;
  inscricaoEstadual: string;
  cep: string;
  endereco: string;
  isActive: boolean;
}

interface AdminEmpresaModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: Partial<EmpresaFormData>;
  onClose: () => void;
  onSave: (data: EmpresaFormData) => void;
}

const SEGMENTO_OPTIONS = [
  { value: "Transporte e Logística", label: "Transporte e Logística" },
  { value: "Mineração", label: "Mineração" },
  { value: "Agronegócio", label: "Agronegócio" },
  { value: "Construção Civil", label: "Construção Civil" },
  { value: "Indústria", label: "Indústria" },
  { value: "Comércio", label: "Comércio" },
  { value: "Serviços", label: "Serviços" },
  { value: "Energia", label: "Energia" },
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Saúde", label: "Saúde" },
  { value: "Outro", label: "Outro" },
];

const DEFAULT_DATA: EmpresaFormData = {
  corporateName: "",
  tradeName: "",
  cnpj: "",
  segmento: "Transporte e Logística",
  inscricaoEstadual: "",
  cep: "",
  endereco: "",
  isActive: true,
};

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export default function AdminEmpresaModal({
  open,
  mode,
  initialData,
  onClose,
  onSave,
}: AdminEmpresaModalProps) {
  const [form, setForm] = React.useState<EmpresaFormData>({
    ...DEFAULT_DATA,
    ...initialData,
  });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_DATA, ...initialData });
      setLoading(false);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "cnpj") {
      setForm((prev) => ({ ...prev, cnpj: formatCnpj(value) }));
    } else if (name === "cep") {
      setForm((prev) => ({ ...prev, cep: formatCep(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
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
      <div className={styles.modalBox} style={{ maxWidth: 620 }}>
        
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconWrap}>
              <Icon name={mode === "create" ? "building-01" : "edit-02"} />
            </div>
            <div>
              <p className={styles.modalTitle}>
                {mode === "create" ? "Nova Empresa" : "Editar Empresa"}
              </p>
              <p className={styles.modalSubtitle}>
                {mode === "create"
                  ? "Cadastre uma empresa para vincular usuários a ela."
                  : "Atualize os dados cadastrais da empresa."}
              </p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} type="button">
            <Icon name="x-close" size={20} />
          </button>
        </div>

        
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <p className={styles.sectionSubtitle}>Dados da Empresa</p>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Razão Social <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  className={styles.formControl}
                  name="corporateName"
                  value={form.corporateName}
                  onChange={handleChange}
                  placeholder="Ex: Transportes Silva Ltda"
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
                  name="tradeName"
                  value={form.tradeName}
                  onChange={handleChange}
                  placeholder="Ex: Silva Transportes"
                  disabled={loading}
                />
              </div>
              <div className={styles.formGroup}>
                <label>CNPJ <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  className={styles.formControl}
                  name="cnpj"
                  value={form.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  required
                  disabled={loading}
                  maxLength={18}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Segmento / Ramo de Atividade</label>
                <select
                  className={styles.formControl}
                  name="segmento"
                  value={form.segmento}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {SEGMENTO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Inscrição Estadual</label>
                <input
                  className={styles.formControl}
                  name="inscricaoEstadual"
                  value={form.inscricaoEstadual}
                  onChange={handleChange}
                  placeholder="Ex: ISENTO ou número"
                  disabled={loading}
                />
              </div>
            </div>

            <hr className={styles.sectionDivider} />
            <p className={styles.sectionSubtitle}>Endereço</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>CEP</label>
                <input
                  className={styles.formControl}
                  name="cep"
                  value={form.cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  disabled={loading}
                  maxLength={9}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Endereço Completo</label>
                <input
                  className={styles.formControl}
                  name="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  placeholder="Rua, número, bairro, cidade - UF"
                  disabled={loading}
                />
              </div>
            </div>

            <hr className={styles.sectionDivider} />
            <p className={styles.sectionSubtitle}>Status</p>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                {form.isActive ? "Empresa Ativa" : "Empresa Inativa"}
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

          
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading
                ? "Salvando..."
                : mode === "create"
                ? "Cadastrar Empresa"
                : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
