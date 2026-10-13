import React from 'react';

const Notifications = ({ notifications, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Notifications</h2>
      
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No notifications</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, index) => (
            <div key={index} className="p-3 border-l-4 border-yellow-700 bg-yellow-50 rounded">
              <p className="text-sm text-gray-900">{notif.message}</p>
              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
