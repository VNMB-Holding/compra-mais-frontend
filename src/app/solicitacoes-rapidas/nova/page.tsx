"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, Button, Icon } from "@/components/ui";
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
  const { user } = useAuth();

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
    // Validar se há itens com descrição
    if (items.some((item) => !item.description.trim())) {
      alert("Por favor, preencha a descrição de todos os itens");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simular envio para servidor
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log("Solicitação enviada:", {
        requester: user?.name,
        department: user?.department,
        items,
        notes: generalNotes,
        timestamp: new Date(),
      });

      // Aqui você integraria com sua API real
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
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={handleCancel}>
        <Icon name="chevron-left" /> Voltar
      </button>

      <div className={styles.header}>
        <span className={styles.eyebrow}>Solicitação rápida</span>
        <h1>O que você precisa?</h1>
        <p>Descreva os itens que precisa e o seu departamento fará a cotação com fornecedores</p>
      </div>

      <Card className={styles.card}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <Icon name="user" size={24} style={{ margin: '12px', color: '#94a3b8' }} />
            )}
          </div>
          <div>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userDept}>{user?.department}</p>
          </div>
        </div>

        <form className={styles.form}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icon name="shopping-cart-01" />
              O que você precisa?
            </h2>
            <p className={styles.sectionDesc}>
              Liste os itens que você quer solicitar
            </p>

            <div className={styles.itemsList}>
              {items.map((item, index) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemNumber}>Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.id)}
                        title="Remover item"
                      >
                        <Icon name="x-close" size={18} />
                      </button>
                    )}
                  </div>

                  <div className={styles.itemForm}>
                    <div className={styles.formGroup}>
                      <label>O que você precisa? *</label>
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

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Quantidade *</label>
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

                      <div className={styles.formGroup}>
                        <label>Urgência</label>
                        <select
                          className={styles.formControl}
                          value={item.urgency}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "urgency",
                              e.target.value as RequestItem["urgency"]
                            )
                          }
                        >
                          {urgencyOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Observações</label>
                      <textarea
                        className={styles.formControl}
                        rows={2}
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
            </div>

            <button
              type="button"
              className={styles.addItemBtn}
              onClick={addItem}
            >
              <Icon name="plus" /> Adicionar outro item
            </button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icon name="message-square" />
              Algo mais?
            </h2>
            <p className={styles.sectionDesc}>
              Observações gerais para quem vai cotar
            </p>

            <div className={styles.formGroup}>
              <textarea
                className={styles.formControl}
                rows={3}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Ex: Preferência por fornecedor local, data de entrega, condição de pagamento, etc."
              />
            </div>
          </section>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <Button
              variant="primary"
              className={styles.btnSubmit}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Icon name="send-01" />
              {isSubmitting ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NovasolicitacaorapidaPage() {
  return <NovasolicitacaorapidaPageContent />;
}
