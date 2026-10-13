import React from 'react';
import { Calendar, MessageSquare, Printer } from 'lucide-react';

const DailyProgressHistory = ({ 
  dailyProgressHistory, 
  loadingHistory, 
  onPrintHistory 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-yellow-600" />
          Daily Progress History
        </h2>
        {dailyProgressHistory.length > 0 && (
          <button
            onClick={onPrintHistory}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors border border-yellow-700"
            title="Print History"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        )}
      </div>
      
      {loadingHistory ? (
        <div className="text-center py-8 text-gray-500">Loading history...</div>
      ) : dailyProgressHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm">No progress updates yet</p>
          <p className="text-xs mt-1">Start adding daily updates to track your work</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {dailyProgressHistory.map((update) => (
            <div 
              key={update.id} 
              className="border border-gray-200 rounded-lg p-3  transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900">
                    {update.Project?.name || 'Unknown Project'}
                  </h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(update.createdAt).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                <p className="line-clamp-3">{update.message}</p>
              </div>
              
              {update.workDone && (
                <div className="mt-2 text-xs">
                  <span className="font-medium text-gray-600">Work Done: </span>
                  <span className="text-gray-700">{update.workDone}</span>
                </div>
              )}
              
              {update.challenges && (
                <div className="mt-1 text-xs">
                  <span className="font-medium text-gray-600">Challenges: </span>
                  <span className="text-gray-700">{update.challenges}</span>
                </div>
              )}
              
              {update.nextSteps && (
                <div className="mt-1 text-xs">
                  <span className="font-medium text-gray-600">Next Steps: </span>
                  <span className="text-gray-700">{update.nextSteps}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyProgressHistory;
