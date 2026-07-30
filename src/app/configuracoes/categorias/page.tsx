"use client";

import React, { useState, useEffect } from "react";
import { categoriesApi, Category } from "@/lib/api/categories";
import { Button, Icon, ErrorState } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import styles from "./page.module.css";
import { getErrorMessage, logError } from "@/lib/utils/error";

export default function CategoriasAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      logError("configuracoes/categorias/list", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await categoriesApi.create({ name, description });
      setIsModalOpen(false);
      setName("");
      setDescription("");
      fetchCategories();
      toast({
        variant: "success",
        title: "Sucesso",
        message: "Categoria criada com sucesso!",
      });
    } catch (err) {
      logError("configuracoes/categorias/create", err);
      toast({
        variant: "error",
        title: "Erro",
        message: getErrorMessage(err),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta categoria?")) return;
    try {
      await categoriesApi.remove(id);
      fetchCategories();
      toast({
        variant: "success",
        title: "Deletado",
        message: "Categoria removida com sucesso.",
      });
    } catch (err) {
      logError("configuracoes/categorias/delete", err);
      toast({
        variant: "error",
        title: "Erro",
        message: getErrorMessage(err),
      });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Categorias</h1>
          <p className={styles.subtitle}>Gerencie as categorias disponíveis para os Pedidos de Compra.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Icon name="plus" /> Nova Categoria
        </Button>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th className={styles.actionCell}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "32px" }}>Carregando...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3} style={{ padding: "24px" }}>
                  <ErrorState message={error} onRetry={fetchCategories} />
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "32px" }}>Nenhuma categoria cadastrada.</td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description || "-"}</td>
                  <td className={styles.actionCell}>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)} title="Excluir">
                      <Icon name="trash-01" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Nova Categoria</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nome <span style={{ color: "red" }}>*</span></label>
                  <input
                    type="text"
                    required
                    className={styles.formControl}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: T.I, Materiais de Escritório"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Descrição</label>
                  <textarea
                    className={styles.formControl}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes opcionais..."
                    rows={3}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
