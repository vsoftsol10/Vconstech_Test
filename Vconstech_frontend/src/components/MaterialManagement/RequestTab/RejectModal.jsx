import React from "react";

const RejectModal = ({
  isOpen,
  rejectReason,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
          Reject Material Request
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Please provide a reason for rejecting this material request:
        </p>
        <textarea
          value={rejectReason}
          onChange={onReasonChange}
          placeholder="Enter reason for rejection..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
          rows="4"
          autoFocus
        />
        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!rejectReason.trim()}
            className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
