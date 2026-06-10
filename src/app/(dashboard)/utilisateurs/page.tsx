"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  DataTable,
  Modal,
  Toast,
  Skeleton,
  ConfirmModal,
  TableCard,
  Pagination,
} from "@/components/ui";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("tous");

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("gestionnaire");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);

    fetch(`/api/users?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        let filtered = data;
        if (filterRole !== "tous") {
          filtered = data.filter((u: any) => u.role === filterRole);
        }
        setUsers(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchUsers();
  }, [search, filterRole]);

  const totalPages = Math.ceil(users.length / pageSize);
  const paginatedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("gestionnaire");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDeleteUser = () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    fetch(`/api/users/${deleteTarget}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToastMessage("Utilisateur supprimé avec succès");
          setToastType("success");
          setShowToast(true);
          fetchUsers();
        } else {
          setToastMessage(data.error || "Erreur de suppression");
          setToastType("error");
          setShowToast(true);
        }
      })
      .finally(() => {
        setDeleteLoading(false);
        setDeleteTarget(null);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setToastMessage("Les mots de passe ne correspondent pas");
      setToastType("error");
      setShowToast(true);
      return;
    }
    if (!editingUser && password.length < 4) {
      setToastMessage("Le mot de passe doit contenir au moins 4 caractères");
      setToastType("error");
      setShowToast(true);
      return;
    }
    setIsSubmitting(true);

    const payload: any = {
      name,
      email,
      role,
    };
    if (password) payload.password = password;

    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsSubmitting(false);
        if (data.error) {
          setToastMessage(data.error);
          setToastType("error");
          setShowToast(true);
        } else {
          setToastMessage(editingUser ? "Utilisateur modifié avec succès" : "Utilisateur ajouté avec succès");
          setToastType("success");
          setShowToast(true);
          setIsModalOpen(false);
          fetchUsers();
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastMessage("Une erreur est survenue");
        setToastType("error");
        setShowToast(true);
        console.error(err);
      });
  };

  const columns = [
    {
      key: "name",
      header: "Nom",
      render: (item: any) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
          <p className="text-xs text-slate-400 font-medium">{item.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rôle",
      render: (item: any) => (
        <Badge>
          {item.role === "admin" ? "Administrateur" : "Gestionnaire"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date de création",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-600">
          {new Date(item.createdAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => handleOpenEditModal(item, e)}
            className="p-2 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
            title="Modifier l'utilisateur"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteUser(item.id, e)}
            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les comptes utilisateurs de l'application</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un utilisateur
        </Button>
      </div>

      <TableCard>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            options={[
              { value: "tous", label: "Tous les rôles" },
              { value: "admin", label: "Administrateurs" },
              { value: "gestionnaire", label: "Gestionnaires" },
            ]}
            value={filterRole}
            onChange={(e: any) => setFilterRole(e.target.value)}
            className="w-full md:w-48"
          />
        </div>

        {loading ? (
          <div className="space-y-4 px-6 py-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <DataTable
              data={paginatedUsers}
              columns={columns}
            />

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={users.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </TableCard>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Nom complet"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              required
            />
          </div>
          <div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="Ex: jean.dupont@email.com"
              required
            />
          </div>
          <div>
            <Select
              label="Rôle"
              options={[
                { value: "gestionnaire", label: "Gestionnaire" },
                { value: "admin", label: "Administrateur" },
              ]}
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
            />
          </div>
          <div>
            <Input
              label={`Mot de passe ${editingUser && "(laisser vide pour conserver)"}`}
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              required={!editingUser}
            />
          </div>
          <div>
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required={!editingUser || password.length > 0}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              {editingUser ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onConfirm={confirmDeleteUser}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'utilisateur ?"
        message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={deleteLoading}
        variant="danger"
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}