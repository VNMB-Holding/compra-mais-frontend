"use client";

import React, { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { rfqsApi } from "@/lib/api/rfqs";
import { suppliersApi } from "@/lib/api/suppliers";
import { useToast } from "@/contexts/ToastContext";
import styles from "./InviteSupplierModal.module.css";

export interface InviteSupplierModalProps {
  open: boolean;
  rfqId?: string;
  onSuccess?: (supplier: any) => void;
  onClose: () => void;
}

export default function InviteSupplierModal({
  open,
  rfqId,
  onSuccess,
  onClose,
}: InviteSupplierModalProps) {
  const { toast } = useToast();

  const [cnpj, setCnpj] = useState("");
  const [corporateName, setCorporateName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCnpjChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 14);
    if (raw.length <= 2) setCnpj(raw);
    else if (raw.length <= 5) setCnpj(`${raw.slice(0, 2)}.${raw.slice(2)}`);
    else if (raw.length <= 8) setCnpj(`${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`);
    else if (raw.length <= 12)
      setCnpj(`${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`);
    else
      setCnpj(
        `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`,
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cnpj.trim() || !corporateName.trim() || !contactEmail.trim()) {
      toast({
        variant: "warning",
        title: "Campos obrigatórios",
        message: "Preencha CNPJ, Razão Social e E-mail de contato.",
      });
      return;
    }

    try {
      setLoading(true);

      if (rfqId) {
        const res = await rfqsApi.inviteUnregisteredSupplier(rfqId, {
          cnpj,
          corporateName,
          contactEmail,
          contactName,
          contactPhone,
        });

        toast({
          variant: "success",
          title: "Fornecedor convidado!",
          message: `${corporateName} foi vinculado à cotação com sucesso.`,
        });

        if (onSuccess) onSuccess(res.supplier);
      } else {
        const newSup = await suppliersApi.create({
          cnpj,
          corporateName,
          tradeName: corporateName,
          contactEmail,
          contactName,
          contactPhone,
          status: "Pending",
        });

        toast({
          variant: "success",
          title: "Fornecedor adicionado!",
          message: `${corporateName} foi cadastrado como pendente e adicionado à cotação.`,
        });

        if (onSuccess) onSuccess(newSup);
      }

      onClose();
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Erro ao convidar",
        message: err.message || "Não foi possível convidar o fornecedor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerIconArea}>
            <div className={styles.headerIcon}>
              <Icon name="building-07" size={22} />
            </div>
            <div className={styles.headerTexts}>
              <h2>Convidar Fornecedor Não Cadastrado</h2>
              <p>Adicione os dados da empresa para convocá-la a cotar.</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            <Icon name="x-close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <label>CNPJ *</label>
              <input
                type="text"
                required
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Razão Social / Nome da Empresa *</label>
              <input
                type="text"
                required
                placeholder="Ex: Comercial Brasileira de Aço Ltda"
                value={corporateName}
                onChange={(e) => setCorporateName(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.formGroup}>
              <label>E-mail Comercial (para envio do link de cotação) *</label>
              <input
                type="email"
                required
                placeholder="contato@empresa.com.br"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className={styles.formGroup}>
                <label>Nome do Contato</label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Lima"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <Icon name="mail-01" size={16} />
              {loading ? "Convidando..." : "Convidar Fornecedor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
