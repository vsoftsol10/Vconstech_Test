import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const MaterialRequestTable = ({ 
  materialRequests, 
  loading, 
  approvedCount, 
  pendingCount, 
  rejectedCount,
  getStatusColor,
  getStatusDisplay
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Material Request Status</h2>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">check {approvedCount} Approved</span>
          <span className="text-orange-600 font-medium flex gap-1">
            <AlertCircle size={15} className='mt-1'/> {pendingCount} Pending
          </span>
          <span className="text-red-600 font-medium flex gap-1">
            <X size={15} className='mt-1'/> {rejectedCount} Rejected
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading requests...</div>
      ) : materialRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No material requests yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Material</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Project</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {materialRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm text-gray-900">
                    {request.material?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {request.project?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {request.quantity} {request.material?.unit || ''}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {new Date(request.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusDisplay(request.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MaterialRequestTable;
