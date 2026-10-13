import React from 'react';

const BillingTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-white rounded-t-lg border-b border-gray-200 px-3 sm:px-4 md:px-6 overflow-x-auto">
      <div className="flex space-x-4 sm:space-x-8">
        {['invoice', 'quotation'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-yellow-600 text-yellow-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BillingTabs;