import React from 'react';

const AdditionalInfo = ({ formData, handleInputChange }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        Additional Information
      </h2>
      <div className="grid md:grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows="3"
            placeholder="Any special remarks or notes"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Terms & Conditions
          </label>
          <textarea
            name="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={handleInputChange}
            rows="4"
            placeholder="Enter payment terms and conditions"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfo;