import React from 'react';

const KPICard = ({ icon: Icon, label, value, color, trend }) => {
  return (
    <div className="bg-white rounded-lg text-center shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-center">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{trend}</p>
      </div>
    </div>
  );
};

export default KPICard;