import React, { useEffect, useState } from 'react';
import { getToken } from '../../../../utils/tabToken';

const CompanyInformation = ({ formData, handleInputChange }) => {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch if we haven't fetched yet and company fields are empty or have invalid values
    const hasInvalidData = 
  !formData.adminCompanyName ||    // ← CHANGE THIS
  formData.adminCompanyName === '0' || 
  formData.adminCompanyName === 0 ||
      !formData.companyEmail || 
      formData.companyEmail === '0' ||
      formData.companyEmail === 0;
    
    if (!hasFetched && hasInvalidData) {
      fetchCompanyData();
    }
  }, [hasFetched]);

  const fetchCompanyData = async () => {
    setLoading(true);
    setHasFetched(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const userId = localStorage.getItem('userId');
      const token = getToken();

      if (!userId || !token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Update formData with fetched company information
        const companyData = {
          adminCompanyName: data.user.company?.name || '',
          companyGST: data.user.gstNumber || '',
          companyAddress: data.user.address || '',
          companyPhone: data.user.phoneNumber || '',
          companyEmail: data.user.email || '',
        };

        // Call handleInputChange for each field to update parent state
        Object.entries(companyData).forEach(([key, value]) => {
  const currentValue = formData[key];
  if (!currentValue || currentValue === '0' || currentValue === 0) {
    handleInputChange({ target: { name: key, value } });
  }
});
      } else {
        setFetchError('Failed to load company information');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setFetchError('An error occurred while loading company information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
          Your Company Information
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbe2a]"></div>
          <p className="ml-3 text-gray-600">Loading company information...</p>
        </div>
      </div>
    );
  }

  // Display the value, converting 0 or '0' to empty string for display
  const displayValue = (value) => {
    if (value === 0 || value === '0' || !value) return '';
    return value;
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        Your Company Information
      </h2>

      {fetchError && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <p className="text-sm text-yellow-700">{fetchError}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            name="adminCompanyName"
            value={formData.adminCompanyName}
            onChange={handleInputChange}
            placeholder="Your Company Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            GST Number
          </label>
          <input
            type="text"
            name="companyGST"
            value={displayValue(formData.companyGST)}
            onChange={handleInputChange}
            placeholder="29XXXXXXXXXXXXX"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="companyAddress"
            value={displayValue(formData.companyAddress)}
            onChange={handleInputChange}
            rows="2"
            placeholder="Company Address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone
          </label>
          <div className="relative">
            <input
              type="tel"
              name="companyPhone"
              value={displayValue(formData.companyPhone)}
              onChange={handleInputChange}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-5 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="companyEmail"
            value={displayValue(formData.companyEmail)}
            onChange={handleInputChange}
            placeholder="company@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInformation;
