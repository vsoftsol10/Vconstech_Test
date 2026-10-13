import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";

const NotificationsDropdown = ({
  notifications,
  unreadCount,
  show,
  onToggle,
  onMarkAsRead,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!show) return undefined;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [show, onToggle]);

  return (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={onToggle}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>

    {show && (
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  !notif.read ? "bg-yellow-50" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-1 w-2 h-2 rounded-full ${
                      notif.type === "SUCCESS"
                        ? "bg-green-500"
                        : notif.type === "ERROR"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>
  );
};

export default NotificationsDropdown;
