import React from 'react'

const DeleteConfirmationModal = ({ isOpen, engineer, onConfirm, onCancel }) => {
  if (!isOpen || !engineer) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Engineer</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{engineer.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(engineer.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal