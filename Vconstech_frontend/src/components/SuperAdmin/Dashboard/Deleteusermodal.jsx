import React from "react";
import { Trash2 } from "lucide-react";

const DeleteUserModal = ({ user, loading, onConfirm, onCancel }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete User</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{user.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;