import React from 'react'
import { Hash, Calendar } from 'lucide-react'

const BillInformation = ({ formData, handleInputChange, activeTab }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        {activeTab === 'invoice' ? 'Invoice' : 'Quotation'} Information
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {activeTab === 'invoice' ? 'Invoice' : 'Quote'} Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="billNumber"
              value={formData.billNumber}
              onChange={handleInputChange}
              placeholder={activeTab === 'invoice' ? 'INV-001' : 'QUO-001'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              name="billDate"
              value={formData.billDate}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        {activeTab === 'invoice' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                // Prevent selecting a date before the bill date
                min={formData.billDate || undefined}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>
            {formData.dueDate && formData.billDate && formData.dueDate < formData.billDate && (
              <p className="mt-1 text-xs text-red-500">Due date cannot be before the invoice date.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BillInformation