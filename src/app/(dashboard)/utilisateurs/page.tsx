"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  Modal,
  Toast,
  ConfirmModal,
  TableCard,
} from "@/components/ui";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [pwdUser, setPwdUser] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("gestionnaire");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);

    fetch(`/api/users?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("gestionnaire");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleOpenPwdModal = (user: any) => {
    setPwdUser(user);
    setNewPwd("");
    setConfirmNewPwd("");
    setIsPwdModalOpen(true);
  };

  const handleDeleteUser = (id: number) => {
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

    const payload: any = { name, email, role };
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

  const handleSubmitPwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmNewPwd) {
      setToastMessage("Les mots de passe ne correspondent pas");
      setToastType("error");
      setShowToast(true);
      return;
    }
    if (newPwd.length < 4) {
      setToastMessage("Le mot de passe doit contenir au moins 4 caractères");
      setToastType("error");
      setShowToast(true);
      return;
    }

    fetch(`/api/users/${pwdUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPwd }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setToastMessage(data.error);
          setToastType("error");
          setShowToast(true);
        } else {
          setToastMessage("Mot de passe modifié avec succès");
          setToastType("success");
          setShowToast(true);
          setIsPwdModalOpen(false);
        }
      })
      .catch((err) => {
        setToastMessage("Une erreur est survenue");
        setToastType("error");
        setShowToast(true);
        console.error(err);
      });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Users section wrapped in TableCard */}
      <TableCard>
        {/* Search + add button */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-6 py-4">
          <div className="w-full md:w-72">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue"
              />
            </div>
          </div>
          <Button onClick={handleOpenAddModal} className="flex items-center gap-2 h-10 px-6 rounded-xl font-bold text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau compte
          </Button>
        </div>

        {/* Users grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-5/6 mb-4" />
                <div className="border-t border-slate-100 pt-4">
                  <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="w-9 h-9 rounded-xl bg-slate-200" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="group bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
              >
                {/* Top section: avatar + role */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fleet-blue/10 to-fleet-blue/5 text-fleet-blue flex items-center justify-center font-black text-lg shadow-sm group-hover:from-fleet-blue group-hover:to-fleet-blue-dark group-hover:text-white transition-all duration-300">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{user.name}</h3>
                      </div>
                      <p className="text-xs text-fleet-blue font-semibold mt-1">@{user.email.split("@")[0]}</p>
                      <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={
                      user.role === "superadmin" 
                        ? "bg-purple-100 text-purple-600 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase" 
                        : user.role === "admin"
                          ? "bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase"
                          : "bg-fleet-blue/10 text-fleet-blue text-[10px] font-black px-3 py-1.5 rounded-xl uppercase"
                    }>
                    {user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Gestionnaire"}
                  </span>
                </div>

                {/* Bottom section: status + actions */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                      <span className="text-xs font-semibold text-emerald-600">Connecté</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPwdModal(user)}
                      className="flex-1 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-fleet-blue/10 hover:border-fleet-blue/20 hover:text-fleet-blue text-slate-500 transition-all duration-300"
                      title="Changer le mot de passe"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 21a3.375 3.375 0 003.375-3.375v-1.125A3.375 3.375 0 0015.75 13.125H8.25A3.375 3.375 0 004.875 16.5v1.125A3.375 3.375 0 008.25 21h7.5zM12 11.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="flex-1 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 text-slate-500 transition-all duration-300"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex-1 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition-all duration-300"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 0 00-1-1h-4a1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TableCard>

      {/* Security warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900 mb-1">Zone de sécurité critique</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            Les actions de suppression sont irréversibles et affectent directement l'accès à l'application pour les utilisateurs concernés.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Modifier le compte" : "Ajouter un compte"}
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
              value={role}
              onChange={setRole}
              options={[
                { value: "gestionnaire", label: "Gestionnaire" },
                { value: "admin", label: "Admin" },
                { value: "superadmin", label: "Super Admin" }
              ]}
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
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
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

      {/* Change Password Modal */}
      <Modal
        isOpen={isPwdModalOpen}
        onClose={() => setIsPwdModalOpen(false)}
        title="Changer le mot de passe"
      >
        <form onSubmit={handleSubmitPwd} className="space-y-4">
          <div>
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPwd}
              onChange={(e: any) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmNewPwd}
              onChange={(e: any) => setConfirmNewPwd(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPwdModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
            >
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onConfirm={confirmDeleteUser}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le compte ?"
        message="Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible."
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
