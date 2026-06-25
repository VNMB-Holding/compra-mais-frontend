"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Select } from "@/components/ui";
import styles from "./solicitacao-rapida.module.css";

interface RequestItem {
  id: number;
  description: string;
  quantity: number;
  urgency: "Baixa" | "Media" | "Alta" | "Critica";
  notes: string;
}

const urgencyOptions = ["Baixa", "Media", "Alta", "Critica"] as const;

function NovasolicitacaorapidaPageContent() {
  const router = useRouter();

  const [items, setItems] = useState<RequestItem[]>([
    {
      id: 1,
      description: "",
      quantity: 1,
      urgency: "Media",
      notes: "",
    },
  ]);

  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateItem = <K extends keyof RequestItem>(
    id: number,
    field: K,
    value: RequestItem[K]
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    const nextId = Math.max(...items.map((item) => item.id), 0) + 1;
    setItems((current) => [
      ...current,
      {
        id: nextId,
        description: "",
        quantity: 1,
        urgency: "Media",
        notes: "",
      },
    ]);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (items.some((item) => !item.description.trim())) {
      alert("Por favor, preencha a descrição de todos os itens");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/solicitacoes-rapidas/nova?sent=1");
    } catch (error) {
      alert("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (items.some((item) => item.description.trim() || generalNotes.trim())) {
      if (!confirm("Descartar solicitação? As informações não serão salvas.")) {
        return;
      }
    }
    router.back();
  };

  return (
    <div className={styles.page}>
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>Nova solicitação</h1>
        <p className={styles.welcomeSubtitle}>Preencha os itens que deseja pedir</p>
      </div>

      <form className={styles.form}>
        <div className={styles.itemsList}>
          {items.map((item, index) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <div className={styles.itemBadge}>
                  <Icon name="package" size={16} className={styles.itemBadgeIcon} />
                  Item {index + 1}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    title="Remover item"
                  >
                    <Icon name="trash-01" size={16} />
                  </button>
                )}
              </div>

              <div className={styles.itemForm}>
                <div className={styles.formGroup}>
                  <label>O que você precisa?</label>
                  <div className={styles.inputWrapper}>
                    <Icon name="search-sm" size={20} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.formControl}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      placeholder="Ex: Pneu para trator 420/90R30"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Quantidade</label>
                    <div className={styles.inputWrapper}>
                      <Icon name="hash-01" size={20} className={styles.inputIcon} />
                      <input
                        type="number"
                        min="1"
                        className={styles.formControl}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, "quantity", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Urgência</label>
                    <Select
                      options={urgencyOptions.map(option => ({ label: option, value: option }))}
                      value={item.urgency}
                      onChange={(value) => updateItem(item.id, "urgency", value as RequestItem["urgency"])}
                      icon="clock"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Observações (opcional)</label>
                  <textarea
                    className={styles.formControl}
                    value={item.notes}
                    onChange={(e) =>
                      updateItem(item.id, "notes", e.target.value)
                    }
                    placeholder="Especificações, marca preferida, etc."
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className={styles.addItemBtn}
            onClick={addItem}
          >
            <div className={styles.addItemBtnIcon}>
              <Icon name="plus" size={20} />
            </div>
            Adicionar outro item
          </button>
        </div>

        <div className={styles.notesSection}>
          <div className={styles.formGroup}>
            <label style={{ marginBottom: "8px" }}>
              <Icon name="message-square-01" size={20} style={{ color: "#008489" }} />
              Instruções Gerais (opcional)
            </label>
            <textarea
              className={styles.formControl}
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Entregar na fazenda principal. Preciso apenas de opções novas."
              style={{ paddingLeft: "16px" }}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnSubmit}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Icon name="send-01" size={20} />
            {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovasolicitacaorapidaPage() {
  return <NovasolicitacaorapidaPageContent />;
}
