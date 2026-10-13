import React from 'react';

const ProgressSlider = ({ 
  projectId, 
  tempProgress, 
  currentProgress,
  isUpdating, 
  onProgressChange, 
  onClose, 
  onSave 
}) => {
  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700">
          Update Progress: {tempProgress}%
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onClose(projectId)}
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(projectId)}
            disabled={isUpdating || tempProgress === currentProgress}
            className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={tempProgress}
        onChange={(e) => onProgressChange(projectId, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
        disabled={isUpdating}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default ProgressSlider;