import React from 'react'
import { Plus, Edit2, Trash2, Search,} from 'lucide-react';

// Materials Tab Component
const MaterialsTab = ({ 
  materials, 
  searchTerm, 
  setSearchTerm, 
  filterCategory, 
  setFilterCategory, 
  categories,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial
}) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Materials</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or vendor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onAddMaterial}
          className="px-6 py-2 bg-black text-white rounded-lg hover:text-amber-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.map(material => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {material.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{material.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{material.defaultRate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{material.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditMaterial(material)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMaterial(material.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default MaterialsTab