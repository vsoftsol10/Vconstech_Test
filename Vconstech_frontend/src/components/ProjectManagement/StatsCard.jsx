import React from 'react'

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, bgColor, iconColor }) => (
  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`${bgColor} p-2 rounded-lg`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);

export default StatsCard
