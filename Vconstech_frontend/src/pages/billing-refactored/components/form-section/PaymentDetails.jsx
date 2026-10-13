import React from 'react';

const PaymentDetails = ({ formData, activeTab, handleInputChange }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        Payment Details
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {activeTab === 'invoice' ? 'Advance Paid (₹)' : 'Advance to be Paid (₹)'}
          </label>
         <input
  type="number"
  name="advancePaid"
  value={formData.advancePaid === 0 ? '' : formData.advancePaid}  // show blank when 0
  onChange={handleInputChange}
  min="0"
  step="0.01"
  placeholder="0.00"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
/>
        </div>

        {activeTab === 'invoice' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Previous Bills (₹)
            </label>
            <input
              type="number"
              name="previousBills"
              value={formData.previousBills}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;