import React from 'react'

// Responsive Metric Card Component
const MetricCard = ({ title, value, icon: Icon, iconColor, valueColor = "text-gray-900" }) => (
  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 transition-all duration-300 hover:shadow-lg">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${valueColor} mt-1 sm:mt-2`}>{value}</p>
      </div>
      <div className="flex-shrink-0 ml-3 sm:ml-4">
        <Icon className={`w-8 h-8 sm:w-12 sm:h-12 ${iconColor}`} />
      </div>
    </div>
  </div>
);

export default MetricCard;
