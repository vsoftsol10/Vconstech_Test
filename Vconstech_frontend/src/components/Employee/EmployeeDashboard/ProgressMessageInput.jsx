import React from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const ProgressMessageInput = ({ 
  projectId, 
  message, 
  isSubmitting, 
  onMessageChange, 
  onClose, 
  onSubmit 
}) => {
  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          Today's Progress Update
        </label>
        <button
          onClick={() => onClose(projectId)}
          className="text-gray-400 hover:text-gray-600"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={message || ''}
        onChange={(e) => onMessageChange(projectId, e.target.value)}
        placeholder="Describe today's work, challenges faced, and next steps..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        rows="4"
        disabled={isSubmitting}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={() => onSubmit(projectId)}
          disabled={isSubmitting || !message?.trim()}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : (
            <>
              <Send className="w-3 h-3" />
              Submit Update
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProgressMessageInput;