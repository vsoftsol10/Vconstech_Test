import React from 'react';

const TaxAndDeductions = ({ formData, handleInputChange }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        Tax & Deductions
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            CGST (%)
          </label>
          <input
            type="number"
            name="cgst"
            value={formData.cgst}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="9"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            SGST (%)
          </label>
          <input
            type="number"
            name="sgst"
            value={formData.sgst}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="9"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            IGST (%)
          </label>
          <input
            type="number"
            name="igst"
            value={formData.igst}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            TDS (%)
          </label>
          <input
            type="number"
            name="tds"
            value={formData.tds}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Retention (%)
          </label>
          <input
            type="number"
            name="retention"
            value={formData.retention}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default TaxAndDeductions;