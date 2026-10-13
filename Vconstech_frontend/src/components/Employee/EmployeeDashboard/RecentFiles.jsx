import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

const RecentFiles = ({ 
  recentFiles, 
  loading, 
  onViewFile, 
  onNavigateToFiles,
  getFileIcon,
  getFileType,
  formatFileSize
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-gray-900">Recent File Uploads</h2>
        <button
          onClick={onNavigateToFiles} 
          className="text-xs text-yellow-700 font-medium bg-yellow-100 px-2 py-1 rounded-md border border-yellow-300"
        >
          View All
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-4 text-gray-500 text-xs">Loading files...</div>
      ) : recentFiles.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <FileText className="w-8 h-8 mx-auto text-gray-300 mb-1" />
          <p className="text-xs">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentFiles.slice(0, 3).map((file) => (
            <div 
              key={file.id} 
              className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors cursor-pointer group"
              onClick={() => onViewFile(file)}
            >
              {/* File Icon */}
              <div className="p-1.5 bg-yellow-100 rounded text-lg flex-shrink-0">
                {getFileIcon(file.fileName)}
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-xs truncate">
                  {file.fileName || 'Unnamed File'}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {file.projectName}
                  {file.uploaderName && ` - ${file.uploaderName}`}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {file.documentType && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      {file.documentType}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(file.uploadedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* External Link */}
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-yellow-500 flex-shrink-0 transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentFiles;
