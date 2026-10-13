import React, { useState, useEffect } from "react";
import { Users, CheckCircle, X } from "lucide-react";
import SuperNav from "../../components/SuperAdmin/SuperNav";
import UsersTable from "../../components/SuperAdmin/Dashboard/Userstable";
import EditUserModal from "../../components/SuperAdmin/Dashboard/Editusermodal";
import DeleteUserModal from "../../components/SuperAdmin/Dashboard/Deleteusermodal";
import { validateEditForm } from "../../components/SuperAdmin/Dashboard/Validation";

const API_URL = import.meta.env.VITE_API_URL;

const PACKAGE_MIGRATION = {
  Classic: "Basic",
  Pro:     "Premium",
  Premium: "Advanced",
};

const migratePackage = (pkg) => PACKAGE_MIGRATION[pkg] ?? pkg;

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-enter    { animation: toastIn       0.3s  cubic-bezier(.4,0,.2,1) forwards; }
        .toast-progress { animation: toastProgress 3.5s  linear                  forwards; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[9999] toast-enter">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden min-w-[300px] max-w-sm">
          <div className="toast-progress absolute bottom-0 left-0 h-1 bg-green-400 rounded-full" />
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-800 flex-1">{message}</p>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/users`);
      const data = await res.json();
      if (data.success) {
        setUsers([...data.users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (user) => {
    setEditingUser({
      ...user,
      package:         migratePackage(user.package),
      companyName:     user.company?.name || "",
      password:        "",
      confirmPassword: "",
    });
    setShowEditModal(true);
    setError("");
    setFieldErrors({});
  };

  const handleEditChange = (field, value) => {
    setEditingUser((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleUpdate = async () => {
    setError("");
    const errors = validateEditForm(editingUser);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix all validation errors before updating");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/update-user/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingUser,
          password:      editingUser.password || undefined,
          customMembers: editingUser.package === "Advanced" ? editingUser.customMembers : null,
          customProjectLimit: editingUser.package === "Advanced" ? editingUser.customProjectLimit : null,
          customPrice: editingUser.package === "Advanced" ? editingUser.customPrice : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update user");
      setToast(data.message || "User updated successfully!");
      setShowEditModal(false);
      setEditingUser(null);
      setFieldErrors({});
      fetchUsers();
    } catch (err) {
      setError(err.message || "An error occurred while updating the user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/delete-user/${userToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete user");
      setToast(data.message || "User deleted successfully!");
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || "An error occurred while deleting the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffbe2a] py-12 px-4">
      <SuperNav />

      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      <div className="max-w-8xl mx-auto pt-24 md:pt-25">
        {/* Header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-105">
              <Users className="w-10 h-10 text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">All Users</h1>
            <p className="text-gray-600 text-lg">Manage all users in the ERP system</p>
          </div>
        </div>

        

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-start shadow-md">
            <p className="text-sm font-bold text-red-900">{error}</p>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-10">
            <UsersTable
              users={users}
              loading={loadingUsers}
              onEdit={handleEdit}
              onDelete={(user) => { setUserToDelete(user); setShowDeleteModal(true); }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditUserModal
          user={editingUser}
          loading={loading}
          error={error}
          fieldErrors={fieldErrors}
          onChange={handleEditChange}
          onUpdate={handleUpdate}
          onClose={() => { setShowEditModal(false); setEditingUser(null); setError(""); setFieldErrors({}); }}
        />
      )}

      {showDeleteModal && (
        <DeleteUserModal
          user={userToDelete}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => { setShowDeleteModal(false); setUserToDelete(null); }}
        />
      )}
    </div>
  );
};

export default UsersPage;
