"use client";

import React, { useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import {
  Card,
  Button,
  Icon,
  Badge,
  Tabs,
  KpiCard,
  Select,
  ConfirmDialog,
} from "@/components/ui";
import { DataTable, ColumnDef } from "@/components/ui/DataTable/DataTable";
import AdminUserModal, {
  UserFormData,
} from "@/components/AdminUserModal/AdminUserModal";
import AdminAlcadaModal, {
  AlcadaFormData,
} from "@/components/AdminAlcadaModal/AdminAlcadaModal";
import { useToast } from "@/contexts/ToastContext";
import styles from "./administracao.module.css";

/* ─── Types ────────────────────────────────────────────────────── */

interface UserRow {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "solicitante" | "procurist" | "gerente" | "admin";
  status: "Ativo" | "Inativo";
  lastAccess: string;
}

interface AlcadaRow {
  id: string;
  nivel: number;
  descricao: string;
  department: string;
  valorMin: number;
  valorMax: number | null;
  role: string;
  aprovadorNome: string;
}

/* ─── Mock Data ─────────────────────────────────────────────────── */

const INITIAL_USERS: UserRow[] = [
  {
    id: "1",
    name: "Ana Lima",
    email: "ana.lima@empresa.com",
    department: "Operações e Suprimentos",
    role: "admin",
    status: "Ativo",
    lastAccess: "Hoje, 09:12",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos.mendes@empresa.com",
    department: "Financeiro",
    role: "gerente",
    status: "Ativo",
    lastAccess: "Ontem, 17:43",
  },
  {
    id: "3",
    name: "Beatriz Costa",
    email: "beatriz.costa@empresa.com",
    department: "Operações e Suprimentos",
    role: "procurist",
    status: "Ativo",
    lastAccess: "Hoje, 08:55",
  },
  {
    id: "4",
    name: "Diego Ferreira",
    email: "diego.ferreira@empresa.com",
    department: "Comercial",
    role: "solicitante",
    status: "Ativo",
    lastAccess: "22/06/2026",
  },
  {
    id: "5",
    name: "Fernanda Rocha",
    email: "fernanda.rocha@empresa.com",
    department: "RH",
    role: "solicitante",
    status: "Inativo",
    lastAccess: "10/05/2026",
  },
];

const INITIAL_ALCADAS: AlcadaRow[] = [
  {
    id: "1",
    nivel: 1,
    descricao: "Aprovação operacional",
    department: "Todos",
    valorMin: 0,
    valorMax: 10000,
    role: "gerente",
    aprovadorNome: "",
  },
  {
    id: "2",
    nivel: 2,
    descricao: "Aprovação estratégica",
    department: "Todos",
    valorMin: 10001,
    valorMax: 50000,
    role: "admin",
    aprovadorNome: "Ana Lima",
  },
  {
    id: "3",
    nivel: 3,
    descricao: "Aprovação diretoria",
    department: "Todos",
    valorMin: 50001,
    valorMax: null,
    role: "admin",
    aprovadorNome: "",
  },
];

/* ─── Role helpers ──────────────────────────────────────────────── */

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  procurist: "Comprador",
  solicitante: "Solicitante",
};

const ROLE_BADGE: Record<
  string,
  "primary" | "warning" | "success" | "gray" | "danger"
> = {
  admin: "danger",
  gerente: "warning",
  procurist: "primary",
  solicitante: "gray",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ─── Permissions config ────────────────────────────────────────── */

const PROFILE_CONFIGS = [
  {
    role: "admin",
    label: "Administrador",
    desc: "Acesso total ao sistema. Gerencia usuários, alçadas e todas as configurações.",
    iconClass: styles.perfilIconAdmin,
    icon: "shield-01",
    permissions: [
      { label: "Criar e editar usuários", allowed: true },
      { label: "Configurar alçadas", allowed: true },
      { label: "Aprovar todas as compras", allowed: true },
      { label: "Acessar analytics completo", allowed: true },
      { label: "Gerenciar fornecedores", allowed: true },
      { label: "Exportar relatórios", allowed: true },
    ],
  },
  {
    role: "gerente",
    label: "Gerente",
    desc: "Aprova solicitações dentro da sua alçada e acompanha indicadores da equipe.",
    iconClass: styles.perfilIconGerente,
    icon: "user-check-01",
    permissions: [
      { label: "Criar e editar usuários", allowed: false },
      { label: "Configurar alçadas", allowed: false },
      { label: "Aprovar compras na alçada", allowed: true },
      { label: "Acessar analytics completo", allowed: true },
      { label: "Gerenciar fornecedores", allowed: false },
      { label: "Exportar relatórios", allowed: true },
    ],
  },
  {
    role: "procurist",
    label: "Comprador (Procurist)",
    desc: "Cria e gerencia RFQs, cotações e pedidos de compra no sistema.",
    iconClass: styles.perfilIconProcurist,
    icon: "receipt-check",
    permissions: [
      { label: "Criar e editar usuários", allowed: false },
      { label: "Configurar alçadas", allowed: false },
      { label: "Aprovar compras na alçada", allowed: false },
      { label: "Acessar analytics completo", allowed: true },
      { label: "Gerenciar fornecedores", allowed: true },
      { label: "Exportar relatórios", allowed: true },
    ],
  },
  {
    role: "solicitante",
    label: "Solicitante",
    desc: "Abre solicitações de compra e acompanha o status pelo portal.",
    iconClass: styles.perfilIconSolicitante,
    icon: "clipboard",
    permissions: [
      { label: "Criar e editar usuários", allowed: false },
      { label: "Configurar alçadas", allowed: false },
      { label: "Aprovar compras na alçada", allowed: false },
      { label: "Acessar analytics completo", allowed: false },
      { label: "Gerenciar fornecedores", allowed: false },
      { label: "Exportar relatórios", allowed: false },
    ],
  },
];

/* ─── Page ──────────────────────────────────────────────────────── */

export default function AdministracaoPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("usuarios");

  // Users state
  const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deactivateDialog, setDeactivateDialog] = useState<UserRow | null>(null);

  // Alcadas state
  const [alcadas, setAlcadas] = useState<AlcadaRow[]>(INITIAL_ALCADAS);
  const [alcadaModalOpen, setAlcadaModalOpen] = useState(false);
  const [alcadaModalMode, setAlcadaModalMode] = useState<"create" | "edit">("create");
  const [editingAlcada, setEditingAlcada] = useState<AlcadaRow | null>(null);
  const [deleteAlcadaDialog, setDeleteAlcadaDialog] = useState<AlcadaRow | null>(null);

  /* ── Tabs ── */
  const tabItems = [
    { id: "usuarios", label: "Usuários", count: users.length },
    { id: "perfis", label: "Tipos de Acesso" },
    { id: "alcadas", label: "Alçadas de Aprovação", count: alcadas.length },
  ];

  /* ── Filters ── */
  const roleOptions = [
    { label: "Todos os tipos", value: "Todos" },
    { label: "Administrador", value: "admin" },
    { label: "Gerente", value: "gerente" },
    { label: "Comprador", value: "procurist" },
    { label: "Solicitante", value: "solicitante" },
  ];
  const statusOptions = [
    { label: "Todos os status", value: "Todos" },
    { label: "Ativo", value: "Ativo" },
    { label: "Inativo", value: "Inativo" },
  ];

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === "Todos" || u.role === roleFilter;
    const matchStatus = statusFilter === "Todos" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  /* ── User actions ── */
  const openCreateUser = () => {
    setUserModalMode("create");
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const openEditUser = (user: UserRow) => {
    setUserModalMode("edit");
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleSaveUser = (data: UserFormData) => {
    if (userModalMode === "create") {
      const newUser: UserRow = {
        id: String(Date.now()),
        name: data.name,
        email: data.email,
        department: data.department,
        role: data.role as UserRow["role"],
        status: data.isActive ? "Ativo" : "Inativo",
        lastAccess: "Nunca",
      };
      setUsers((prev) => [newUser, ...prev]);
      toast({
        title: "Usuário criado!",
        message: `${data.name} foi adicionado ao sistema com sucesso.`,
        variant: "success",
      });
    } else if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: data.name,
                department: data.department,
                role: data.role as UserRow["role"],
                status: data.isActive ? "Ativo" : "Inativo",
              }
            : u
        )
      );
      toast({
        title: "Usuário atualizado",
        message: `Os dados de ${data.name} foram salvos.`,
        variant: "success",
      });
    }
    setUserModalOpen(false);
  };

  const handleDeactivateUser = () => {
    if (!deactivateDialog) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === deactivateDialog.id ? { ...u, status: "Inativo" } : u
      )
    );
    toast({
      title: "Usuário desativado",
      message: `O acesso de ${deactivateDialog.name} foi revogado.`,
      variant: "success",
    });
    setDeactivateDialog(null);
  };

  /* ── Alçada actions ── */
  const openCreateAlcada = () => {
    setAlcadaModalMode("create");
    setEditingAlcada(null);
    setAlcadaModalOpen(true);
  };

  const openEditAlcada = (a: AlcadaRow) => {
    setAlcadaModalMode("edit");
    setEditingAlcada(a);
    setAlcadaModalOpen(true);
  };

  const handleSaveAlcada = (data: AlcadaFormData) => {
    const row: AlcadaRow = {
      id: editingAlcada?.id || String(Date.now()),
      nivel: Number(data.nivel),
      descricao: data.descricao,
      department: data.department,
      valorMin: Number(data.valorMin) || 0,
      valorMax: data.valorMax ? Number(data.valorMax) : null,
      role: data.role,
      aprovadorNome: data.aprovadorNome,
    };

    if (alcadaModalMode === "create") {
      setAlcadas((prev) => [...prev, row].sort((a, b) => a.nivel - b.nivel));
      toast({
        title: "Alçada criada!",
        message: `Nível ${row.nivel} adicionado ao fluxo de aprovação.`,
        variant: "success",
      });
    } else {
      setAlcadas((prev) =>
        prev
          .map((a) => (a.id === row.id ? row : a))
          .sort((a, b) => a.nivel - b.nivel)
      );
      toast({
        title: "Alçada atualizada",
        message: "As regras de aprovação foram salvas.",
        variant: "success",
      });
    }
    setAlcadaModalOpen(false);
  };

  const handleDeleteAlcada = () => {
    if (!deleteAlcadaDialog) return;
    setAlcadas((prev) => prev.filter((a) => a.id !== deleteAlcadaDialog.id));
    toast({
      title: "Alçada removida",
      message: `Nível ${deleteAlcadaDialog.nivel} removido do fluxo.`,
      variant: "success",
    });
    setDeleteAlcadaDialog(null);
  };

  /* ── User columns ── */
  const userColumns: ColumnDef<UserRow>[] = [
    {
      header: "Usuário",
      cell: (row) => (
        <div className={styles.userCell}>
          <div className={styles.userAvatar}>{getInitials(row.name)}</div>
          <div className={styles.doubleText}>
            <strong>{row.name}</strong>
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Departamento",
      cell: (row) => <span style={{ fontSize: "13px", color: "#334155" }}>{row.department}</span>,
    },
    {
      header: "Tipo",
      cell: (row) => (
        <Badge variant={ROLE_BADGE[row.role]}>{ROLE_LABEL[row.role]}</Badge>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "Ativo" ? "success" : "gray"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Último Acesso",
      cell: (row) => (
        <span style={{ fontSize: "13px", color: "#64748b" }}>{row.lastAccess}</span>
      ),
    },
    {
      header: "",
      width: "96px",
      cell: (row) => (
        <div className={styles.actionCell}>
          <button
            className={styles.iconBtn}
            title="Editar"
            onClick={(e) => {
              e.stopPropagation();
              openEditUser(row);
            }}
          >
            <Icon name="edit-02" size={16} />
          </button>
          {row.status === "Ativo" && (
            <button
              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
              title="Desativar"
              onClick={(e) => {
                e.stopPropagation();
                setDeactivateDialog(row);
              }}
            >
              <Icon name="user-x-01" size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  /* ── Alçada columns ── */
  const alcadaColumns: ColumnDef<AlcadaRow>[] = [
    {
      header: "Nível",
      width: "80px",
      cell: (row) => (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#007d79",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {row.nivel}
        </div>
      ),
    },
    {
      header: "Descrição",
      cell: (row) => (
        <div className={styles.doubleText}>
          <strong>{row.descricao || `Nível ${row.nivel}`}</strong>
          <span>{row.department}</span>
        </div>
      ),
    },
    {
      header: "Faixa de Valor",
      cell: (row) => (
        <span style={{ fontSize: "13px", color: "#334155" }}>
          {fmt(row.valorMin)} –{" "}
          {row.valorMax ? fmt(row.valorMax) : "Sem limite"}
        </span>
      ),
    },
    {
      header: "Aprovador",
      cell: (row) => (
        <div className={styles.doubleText}>
          <Badge variant={ROLE_BADGE[row.role]}>{ROLE_LABEL[row.role]}</Badge>
          {row.aprovadorNome && (
            <span style={{ marginTop: 4 }}>{row.aprovadorNome}</span>
          )}
        </div>
      ),
    },
    {
      header: "",
      width: "96px",
      cell: (row) => (
        <div className={styles.actionCell}>
          <button
            className={styles.iconBtn}
            title="Editar"
            onClick={(e) => {
              e.stopPropagation();
              openEditAlcada(row);
            }}
          >
            <Icon name="edit-02" size={16} />
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            title="Remover"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteAlcadaDialog(row);
            }}
          >
            <Icon name="trash-01" size={16} />
          </button>
        </div>
      ),
    },
  ];

  /* ── KPI counts ── */
  const activeCount = users.filter((u) => u.status === "Ativo").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const inactiveCount = users.filter((u) => u.status === "Inativo").length;

  return (
    <ProtectedLayout allowedRoles={["admin"]}>
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1>Administração</h1>
            <p>
              Gerencie usuários, tipos de acesso e as regras de alçada de aprovação
              do sistema.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── ABA: USUÁRIOS ─────────────────────────────── */}
        {activeTab === "usuarios" && (
          <>
            <div className={styles.kpiGrid}>
              <KpiCard
                title="Total de Usuários"
                value={users.length}
                icon="users-01"
                description="Cadastrados no sistema"
              />
              <KpiCard
                title="Usuários Ativos"
                value={activeCount}
                icon="user-check-01"
                description="Com acesso liberado"
              />
              <KpiCard
                title="Contas Inativas"
                value={inactiveCount}
                icon="user-x-01"
                description="Acesso revogado"
              />
              <KpiCard
                title="Administradores"
                value={adminCount}
                icon="shield-01"
                description="Com acesso total"
              />
            </div>

            <Card noPadding className={styles.tableCard}>
              <div className={styles.tableToolbar}>
                <div className={styles.searchBox}>
                  <Icon name="search-md" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className={styles.filtersGroup}>
                  <Select
                    options={roleOptions}
                    value={roleFilter}
                    onChange={setRoleFilter}
                    icon="filter-lines"
                    className={styles.customSelectFilter}
                  />
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className={styles.customSelectFilter}
                  />
                  <Button variant="primary" onClick={openCreateUser}>
                    <Icon name="plus" size={16} /> Novo Usuário
                  </Button>
                </div>
              </div>

              <DataTable
                data={filteredUsers}
                columns={userColumns}
              />

              <div className={styles.tableFooter}>
                <span>
                  Mostrando {filteredUsers.length} de {users.length} usuários
                </span>
                <div className={styles.paginationControls}>
                  <button className={styles.pageBtn}>
                    <Icon name="chevron-left" size={14} />
                  </button>
                  <button className={`${styles.pageBtn} ${styles.pageActive}`}>
                    1
                  </button>
                  <button className={styles.pageBtn}>
                    <Icon name="chevron-right" size={14} />
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ── ABA: PERFIS ───────────────────────────────── */}
        {activeTab === "perfis" && (
          <div className={styles.perfisGrid}>
            {PROFILE_CONFIGS.map((profile) => {
              const count = users.filter((u) => u.role === profile.role).length;
              return (
                <div key={profile.role} className={styles.perfilCard}>
                  <div className={styles.perfilCardHeader}>
                    <div
                      className={`${styles.perfilIconWrap} ${profile.iconClass}`}
                    >
                      <Icon name={profile.icon} size={20} />
                    </div>
                    <span className={styles.perfilUsersCount}>
                      {count} {count === 1 ? "usuário" : "usuários"}
                    </span>
                  </div>

                  <h3 className={styles.perfilCardTitle}>{profile.label}</h3>
                  <p className={styles.perfilCardDesc}>{profile.desc}</p>

                  <div className={styles.permissoesList}>
                    {profile.permissions.map((perm, i) => (
                      <div key={i} className={styles.permissaoItem}>
                        {perm.allowed ? (
                          <Icon
                            name="check-circle"
                            size={16}
                            className={styles.permissaoCheck}
                          />
                        ) : (
                          <Icon
                            name="x-circle"
                            size={16}
                            className={styles.permissaoCross}
                          />
                        )}
                        <span
                          style={{
                            color: perm.allowed ? "#334155" : "#94a3b8",
                          }}
                        >
                          {perm.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.perfilCardFooter}>
                    <button
                      className={styles.btnExport}
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled
                    >
                      <Icon name="settings-01" size={15} />
                      Editar Permissões
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ABA: ALÇADAS ──────────────────────────────── */}
        {activeTab === "alcadas" && (
          <>
            {/* Fluxo visual */}
            <div className={styles.fluxoVisual}>
              {alcadas.map((a, idx) => (
                <React.Fragment key={a.id}>
                  <div className={styles.fluxoStep}>
                    <div className={styles.fluxoStepNumber}>{a.nivel}</div>
                    <span className={styles.fluxoStepLabel}>
                      {ROLE_LABEL[a.role]}
                    </span>
                    <span className={styles.fluxoStepSub}>
                      {fmt(a.valorMin)} –{" "}
                      {a.valorMax ? fmt(a.valorMax) : "Sem limite"}
                    </span>
                  </div>
                  {idx < alcadas.length - 1 && (
                    <div className={styles.fluxoArrow}>
                      <Icon name="chevron-right" size={20} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <Card noPadding className={styles.tableCard}>
              <div className={styles.tableToolbar}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", flex: 1 }}>
                  Regras configuradas
                </span>
                <Button variant="primary" onClick={openCreateAlcada}>
                  <Icon name="plus" size={16} /> Nova Alçada
                </Button>
              </div>

              <DataTable
                data={alcadas}
                columns={alcadaColumns}
              />

              <div className={styles.tableFooter}>
                <span>
                  {alcadas.length} alçada{alcadas.length !== 1 ? "s" : ""}{" "}
                  configurada{alcadas.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AdminUserModal
        open={userModalOpen}
        mode={userModalMode}
        initialData={
          editingUser
            ? {
                name: editingUser.name,
                email: editingUser.email,
                department: editingUser.department,
                phone: "",
                role: editingUser.role,
                isActive: editingUser.status === "Ativo",
              }
            : undefined
        }
        onClose={() => setUserModalOpen(false)}
        onSave={handleSaveUser}
      />

      <AdminAlcadaModal
        open={alcadaModalOpen}
        mode={alcadaModalMode}
        initialData={
          editingAlcada
            ? {
                nivel: editingAlcada.nivel,
                descricao: editingAlcada.descricao,
                department: editingAlcada.department,
                valorMin: String(editingAlcada.valorMin),
                valorMax: editingAlcada.valorMax ? String(editingAlcada.valorMax) : "",
                role: editingAlcada.role,
                aprovadorNome: editingAlcada.aprovadorNome,
              }
            : undefined
        }
        onClose={() => setAlcadaModalOpen(false)}
        onSave={handleSaveAlcada}
      />

      <ConfirmDialog
        open={!!deactivateDialog}
        variant="warning"
        icon="user-x-01"
        title="Desativar usuário?"
        message={`O acesso de ${deactivateDialog?.name} será revogado imediatamente. O usuário não conseguirá mais entrar no sistema.`}
        confirmLabel="Desativar"
        onConfirm={handleDeactivateUser}
        onCancel={() => setDeactivateDialog(null)}
      />

      <ConfirmDialog
        open={!!deleteAlcadaDialog}
        variant="danger"
        title="Remover alçada?"
        message={`A regra de Nível ${deleteAlcadaDialog?.nivel} será excluída permanentemente. Solicitações em andamento podem ser afetadas.`}
        confirmLabel="Remover"
        onConfirm={handleDeleteAlcada}
        onCancel={() => setDeleteAlcadaDialog(null)}
      />
    </ProtectedLayout>
  );
}
