import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getToken } from '../../utils/tabToken';

const DailyProgressViewer = ({ projectId, projectName, onClose }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUpdate, setExpandedUpdate] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchDailyUpdates();
  }, [projectId]);

  const fetchDailyUpdates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const resolvedProjectId = projectId ?? '';

      const response = await fetch(`${API_BASE_URL}/daily-progress/project/${encodeURIComponent(resolvedProjectId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily updates');
      }

      const data = await response.json();
      const updatesData = Array.isArray(data) ? data : (data.updates || []);
      const sortedUpdates = [...updatesData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setUpdates(sortedUpdates);
    } catch (err) {
      console.error('Error fetching daily updates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const toggleExpand = (updateId) => {
    setExpandedUpdate(expandedUpdate === updateId ? null : updateId);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading daily updates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-yellow-300 to-yellow-400">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-black-600" />
              Daily Progress Updates
            </h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchDailyUpdates}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Retry
              </button>
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No daily updates yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Site engineers will submit their daily progress updates here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-yellow-300 transition-colors"
                >
                  {/* Update Header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold">
                        {(update.engineers?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{update.engineers?.name || 'Unknown Engineer'}</span>
                          {update.engineers?.empId && <span className="text-xs text-gray-500">({update.engineers.empId})</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(update.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    {(update.workDone || update.challenges || update.nextSteps) && (
                      <button
                        onClick={() => toggleExpand(update.id)}
                        className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1"
                      >
                        {expandedUpdate === update.id ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            More
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Update Content */}
                  <div className="px-4 py-3">
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Progress Update</h4>
                      <p className="text-gray-900 whitespace-pre-wrap">{update.message}</p>
                    </div>

                    {/* Expanded Details */}
                    {expandedUpdate === update.id && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                        {update.workDone && (
                          <div>
                            <h4 className="text-xs font-semibold text-green-700 uppercase mb-1">check Work Completed</h4>
                            <p className="text-gray-900 whitespace-pre-wrap">{update.workDone}</p>
                          </div>
                        )}
                        
                        {update.challenges && (
                          <div>
                            <h4 className="text-xs font-semibold text-orange-700 uppercase mb-1">Warning: Challenges</h4>
                            <p className="text-gray-900 whitespace-pre-wrap">{update.challenges}</p>
                          </div>
                        )}
                        
                        {update.nextSteps && (
                          <div>
                            <h4 className="text-xs font-semibold text-yellow-700 uppercase mb-1">{"-> Next Steps"}</h4>
                            <p className="text-gray-900 whitespace-pre-wrap">{update.nextSteps}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{updates.length} update{updates.length !== 1 ? 's' : ''} total</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressViewer;
