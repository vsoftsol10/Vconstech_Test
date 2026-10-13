import React, { useState } from 'react';
import { Plus, Edit2, X, Check, Download } from 'lucide-react';

// Projects Tab Component
const EmployeeProjectsTab = ({ 
  projects, 
  selectedProject, 
  setSelectedProject, 
  projectMaterials, 
  usageLogs, 
  onAddProjectMaterial, 
  onLogUsage,
  onEditUsage,
  onDownloadReport,
  canExecuteSelectedProject = true
}) => {
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEditClick = (log, idx) => {
    setEditingLog(idx);
    setEditForm({
      quantity: log.quantity,
      remarks: log.remarks
    });
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditForm({});
  };

  const handleSaveEdit = (log, idx) => {
    if (onEditUsage) {
      onEditUsage(log, idx, editForm);
    }
    setEditingLog(null);
    setEditForm({});
  };

  // Calculate total cost for all usage logs
  const calculateTotalCost = () => {
    return usageLogs.reduce((total, log) => {
      const quantity = log.quantity || 0;
      const rate = log.material?.defaultRate || 0;
      return total + (quantity * rate);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg "
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onAddProjectMaterial}
            disabled={!canExecuteSelectedProject}
            title={canExecuteSelectedProject ? undefined : "Available when the selected project is In Progress"}
            className={`px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 ${canExecuteSelectedProject ? '' : 'opacity-60 cursor-not-allowed hover:bg-black'}`}
          >
            <Plus className="w-5 h-5" />
            Request Material for Project
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Project Materials</h3>
          <button
            onClick={onLogUsage}
            disabled={!canExecuteSelectedProject}
            title={canExecuteSelectedProject ? undefined : "Available when the selected project is In Progress"}
            className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm ${canExecuteSelectedProject ? '' : 'opacity-60 cursor-not-allowed hover:bg-green-600'}`}
          >
            Log Usage
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-500">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Used</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Remaining</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectMaterials.map((pm, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pm.material?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {pm.material?.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {pm.assigned} {pm.material?.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {pm.used} {pm.material?.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={pm.remaining < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {pm.remaining} {pm.material?.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage History</h3>
            <p className="text-sm text-gray-600 mt-1">
              Total Cost: <span className="font-semibold text-gray-900">₹{calculateTotalCost().toFixed(2)}</span>
            </p>
          </div>
          <button
            onClick={onDownloadReport}
            disabled={usageLogs.length === 0}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Download usage report with cost breakdown"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-500">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usageLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No usage logs found for this project
                  </td>
                </tr>
              ) : (
                usageLogs.map((log, idx) => {
                  const quantity = log.quantity || 0;
                  const rate = log.material?.defaultRate || 0;
                  const cost = quantity * rate;
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.material?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingLog === idx ? (
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          `${quantity} ${log.material?.unit}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₹{rate.toFixed(2)}/{log.material?.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {editingLog === idx ? (
                          <input
                            type="text"
                            value={editForm.remarks}
                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          log.remarks || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingLog === idx ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(log, idx)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(log, idx)}
                            disabled={!canExecuteSelectedProject}
                            className={`p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded ${canExecuteSelectedProject ? '' : 'opacity-50 cursor-not-allowed hover:bg-transparent'}`}
                            title={canExecuteSelectedProject ? "Edit" : "Available when the selected project is In Progress"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProjectsTab;
