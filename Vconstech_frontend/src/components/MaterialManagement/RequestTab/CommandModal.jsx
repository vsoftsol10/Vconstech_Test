import React from "react";

const CommandModal = ({
  isOpen,
  commandNote,
  onNoteChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
          Leave a Comment
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Your comment will be sent to the engineer. The request will
          <span className="font-semibold text-yellow-600"> remain pending </span>
          until you approve or reject it.
        </p>
        <textarea
          value={commandNote}
          onChange={onNoteChange}
          placeholder="e.g. Please reduce the quoted amount or attach a revised quotation..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none text-sm"
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
            disabled={!commandNote.trim()}
            className="flex-1 px-3 sm:px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandModal;
