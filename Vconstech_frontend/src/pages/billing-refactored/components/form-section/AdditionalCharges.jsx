import React from 'react';

const AdditionalCharges = ({ formData, handleInputChange }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        Additional Charges
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Labour Charges (₹)
          </label>
          <input
            type="number"
            name="labourCharges"
            value={formData.labourCharges}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Transport Charges (₹)
          </label>
          <input
            type="number"
            name="transportCharges"
            value={formData.transportCharges}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Other Charges (₹)
          </label>
          <input
            type="number"
            name="otherCharges"
            value={formData.otherCharges}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Other Charges Description
          </label>
          <input
            type="text"
            name="otherChargesDescription"
            value={formData.otherChargesDescription}
            onChange={handleInputChange}
            placeholder="Describe other charges"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalCharges;