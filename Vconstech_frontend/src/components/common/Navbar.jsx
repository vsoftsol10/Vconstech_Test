

// import { Bell, LogOut, X, User } from 'lucide-react';
// import { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { getToken, removeToken } from '../../utils/tabToken';

// const API_URL = import.meta.env.VITE_API_URL;
// const BACKEND_URL =
//   import.meta.env.VITE_BACKEND_URL || API_URL.replace(/\/api\/?$/, "");

// const Navbar = () => {
//   const [showLogoutModal, setShowLogoutModal] = useState(false);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
//   const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
//   const [companyName, setCompanyName] = useState('Loading...');
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
//   const [profilePic, setProfilePic] = useState(null);

//   const navigate = useNavigate();
//   const dropdownRef = useRef(null);
//   const notificationsRef = useRef(null);

//   const getAuth = () => {
//     const token = getToken();
//     const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
//     const userData = userDataString ? JSON.parse(userDataString) : null;
//     return { token, userData };
//   };

//   const getCompanyFirstLetter = () => {
//     const name = companyName;
//     if (!name || name === 'Loading...') return '?';
//     return name.trim()[0].toUpperCase();
//   };

//   const loadCompanyName = () => {
//     try {
//       const { userData } = getAuth();
//       const storedCompanyName = localStorage.getItem('companyName');


//       if (storedCompanyName) { setCompanyName(storedCompanyName); return; }
//       if (!userData) { setCompanyName('Interiors'); return; }

//       if (userData.companyName)        setCompanyName(userData.companyName);
//       else if (userData.company?.name) setCompanyName(userData.company.name);
//       else if (userData.companyId)     fetchCompanyName(userData.companyId);
//       else                             setCompanyName('Interiors');
//     } catch (e) {
//       setCompanyName('Interiors');
//     }
//   };

//   const fetchCompanyName = async (companyId) => {
//     try {
//       const { token } = getAuth();
//       const res = await fetch(`${API_URL}/companies/${companyId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (res.ok) {
//         const data = await res.json();
//         setCompanyName(data.name || 'Interiors');
//       } else {
//         setCompanyName('Interiors');
//       }
//     } catch {
//       setCompanyName('Interiors');
//     }
//   };

//   const fetchUserProfile = async () => {
//     try {
//       const { token, userData } = getAuth();
//       if (!token) return;

//       const userId =
//         userData?.userId || userData?.id || userData?._id || localStorage.getItem('userId');

//       console.log(' userId from storage:', userId);
//       if (!userId) return;

//       const res = await fetch(`${API_URL}/users/profile/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.ok) {
//         console.error('Profile fetch failed:', res.status);
//         return;
//       }

//       const data = await res.json();
//       console.log(' Profile response:', data);

//       if (data.success) {
//         const logo = data.user?.company?.logo;
//         console.log(' Logo path from API:', logo);

//         if (logo) {
//           const logoUrl = logo.startsWith('http') ? logo : `${BACKEND_URL}${logo}`;
//           console.log(' Resolved logo URL:', logoUrl);
//           setProfilePic(logoUrl);
//         } else {
//           setProfilePic(null);
//         }

//         if (data.user?.company?.name) {
//           setCompanyName(data.user.company.name);
//           localStorage.setItem('companyName', data.user.company.name);
//         }
//       }
//     } catch (e) {
//       console.error('fetchUserProfile error:', e);
//     }
//   };

//   const fetchNotifications = async () => {
//     setIsLoadingNotifications(true);
//     try {
//       const { token } = getAuth();
//       if (!token) return;

//       const res = await fetch(`${API_URL}/notifications`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.ok) {
//         const data = await res.json();
//         if (data.success) {
//           setNotifications(data.notifications || []);
//           setUnreadCount(data.unreadCount || 0);
//         }
//       }
//     } catch (e) {
//       console.error('fetchNotifications error:', e);
//     } finally {
//       setIsLoadingNotifications(false);
//     }
//   };

//   const markNotificationAsRead = async (id) => {
//     try {
//       const { token } = getAuth();
//       await fetch(`${API_URL}/notifications/${id}/read`, {
//         method: 'PUT',
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchNotifications();
//     } catch (e) { console.error(e); }
//   };

//   const markAllAsRead = async () => {
//     try {
//       const { token } = getAuth();
//       await fetch(`${API_URL}/notifications/read-all`, {
//         method: 'PUT',
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchNotifications();
//     } catch (e) { console.error(e); }
//   };

//   const deleteNotification = async (id) => {
//     try {
//       const { token } = getAuth();
//       await fetch(`${API_URL}/notifications/${id}`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchNotifications();
//     } catch (e) { console.error(e); }
//   };

//   const formatNotificationDate = (dateString) => {
//     const date = new Date(dateString);
//     const diffMs    = Date.now() - date;
//     const diffMins  = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMs / 3600000);
//     const diffDays  = Math.floor(diffMs / 86400000);
//     if (diffMins  < 1)  return 'Just now';
//     if (diffMins  < 60) return `${diffMins}m ago`;
//     if (diffHours < 24) return `${diffHours}h ago`;
//     if (diffDays  < 7)  return `${diffDays}d ago`;
//     return date.toLocaleDateString();
//   };

//   useEffect(() => {
//     loadCompanyName();
//     fetchNotifications();
//     fetchUserProfile();
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(fetchNotifications, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const onStorage      = (e) => { if (e.key === 'companyName' || e.key === 'user') loadCompanyName(); };
//     const onCompanyUpdate = () => loadCompanyName();
//     const onProfileUpdate = () => fetchUserProfile();

//     window.addEventListener('storage', onStorage);
//     window.addEventListener('companyNameUpdated', onCompanyUpdate);
//     window.addEventListener('profileUpdated', onProfileUpdate);
//     return () => {
//       window.removeEventListener('storage', onStorage);
//       window.removeEventListener('companyNameUpdated', onCompanyUpdate);
//       window.removeEventListener('profileUpdated', onProfileUpdate);
//     };
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target))
//         setShowSettingsDropdown(false);
//       if (notificationsRef.current && !notificationsRef.current.contains(e.target))
//         setShowNotificationsDropdown(false);
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleLogout = () => { setShowSettingsDropdown(false); setShowLogoutModal(true); };
//   const cancelLogout  = () => setShowLogoutModal(false);
//   const confirmLogout = () => {
//    removeToken();
// localStorage.removeItem('user');
//     setShowLogoutModal(false);
//     navigate('/');
//     window.location.reload();
//   };

//   const handleNotification    = () => { setShowNotificationsDropdown((v) => !v); if (!showNotificationsDropdown) fetchNotifications(); };
//   const handleProfile          = () => { setShowSettingsDropdown(false); navigate('/profile'); };
//   const toggleSettingsDropdown = () => setShowSettingsDropdown((v) => !v);

//   return (
//     <>
//       <nav className="fixed top-0 left-0 right-0 z-40 h-20 sm:h-20 md:left-64 md:h-24 bg-white border-b border-gray-100 shadow-sm">
//         <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-full">
//           <div className="flex items-center justify-between h-full gap-2 sm:gap-4">

//             {/* Left - welcome, signed-in user, and company */}
//             <div className="flex items-center gap-3 flex-1 min-w-0">
//               <div className="min-w-0">
//                 <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-[240px] md:max-w-none leading-tight">
//                   Welcome {companyName}
//                 </p>
//               </div>
//             </div>

//             {/* Right - Icons */}
//             <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

//               {/* Bell */}
//               <div className="relative" ref={notificationsRef}>
//                 <button
//                   onClick={handleNotification}
//                   className="relative w-10 h-10 rounded-full border border-yellow-200 bg-white text-gray-500 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-400 flex items-center justify-center transition-colors duration-200"
//                   aria-label="Notifications"
//                 >
//                   <Bell size={18} strokeWidth={2} />
//                   {unreadCount > 0 && (
//                     <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />
//                   )}
//                 </button>

//                 {showNotificationsDropdown && (
//                   <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in max-h-[500px] flex flex-col">
//                     <div className="px-4 py-3 border-b border-gray-100 bg-yellow-50 flex justify-between items-center">
//                       <h3 className="font-semibold text-gray-900">Notifications</h3>
//                       {unreadCount > 0 && (
//                         <button onClick={markAllAsRead} className="text-xs text-yellow-700 hover:text-yellow-900 font-medium">
//                           Mark all read
//                         </button>
//                       )}
//                     </div>

//                     <div className="overflow-y-auto flex-1">
//                       {isLoadingNotifications ? (
//                         <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
//                       ) : notifications.length === 0 ? (
//                         <div className="p-8 text-center text-gray-500">
//                           <Bell size={40} className="mx-auto mb-2 text-gray-300" />
//                           <p className="text-sm">No notifications</p>
//                         </div>
//                       ) : (
//                         <div className="divide-y divide-gray-100">
//                           {notifications.map((n) => (
//                             <div key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-yellow-50' : ''}`}>
//                               <div className="flex justify-between items-start gap-2">
//                                 <div className="flex-1 min-w-0">
//                                   <p className={`text-sm ${!n.read ? 'font-semibold' : ''} text-gray-900`}>{n.message}</p>
//                                   <p className="text-xs text-gray-500 mt-1">{formatNotificationDate(n.date)}</p>
//                                 </div>
//                                 <div className="flex gap-1 flex-shrink-0">
//                                   {!n.read && (
//                                     <button onClick={() => markNotificationAsRead(n.id)} className="p-1 text-yellow-700 hover:text-yellow-900 text-xs" title="Mark as read">check</button>
//                                   )}
//                                   <button onClick={() => deleteNotification(n.id)} className="p-1 text-red-500 hover:text-red-700" title="Delete">
//                                     <X size={14} />
//                                   </button>
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Profile Avatar */}
//               <div className="relative" ref={dropdownRef}>
//                 <button
//                   onClick={toggleSettingsDropdown}
//                   className="flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 focus:outline-none overflow-hidden flex-shrink-0 ring-2 ring-yellow-400"
//                   style={{ width: 40, height: 40 }}
//                   aria-label="Profile menu"
//                 >
//                   {profilePic ? (
//                     <img
//                       src={profilePic}
//                       alt="Company logo"
//                       className="w-full h-full object-cover"
//                       onError={() => {
//                         console.warn('Logo failed to load, showing letter fallback');
//                         setProfilePic(null);
//                       }}
//                     />
//                   ) : (
//                     <div className="w-full h-full bg-yellow-400 flex items-center justify-center text-black text-base font-semibold select-none">
//                       {getCompanyFirstLetter()}
//                     </div>
//                   )}
//                 </button>

//                 {showSettingsDropdown && (
//                   <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in">
//                     <div className="py-2">
//                       <button
//                         onClick={handleProfile}
//                         className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200"
//                       >
//                         <User size={18} strokeWidth={2} />
//                         <span className="text-sm font-medium">Profile</span>
//                       </button>

//                       <div className="border-t border-gray-100 my-1" />

//                       <button
//                         onClick={handleLogout}
//                         className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
//                       >
//                         <LogOut size={18} strokeWidth={2} />
//                         <span className="text-sm font-medium">Logout</span>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Logout Modal */}
//       {showLogoutModal && (
//         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-[90%] sm:max-w-md w-full p-4 sm:p-5 md:p-6 relative animate-fade-in">
//             <button onClick={cancelLogout} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
//               <X size={18} className="sm:w-5 sm:h-5" />
//             </button>

//             <div className="text-center">
//               <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-100 mb-3 sm:mb-4">
//                 <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-700" />
//               </div>
//               <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">Confirm Logout</h3>
//               <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Do you really want to logout?</p>
//               <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center">
//                 <button onClick={cancelLogout} className="w-full xs:w-auto px-4 py-2.5 sm:px-6 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors duration-200 text-sm rounded-xl">
//                   Cancel
//                 </button>
//                 <button onClick={confirmLogout} className="w-full xs:w-auto px-4 py-2.5 sm:px-6 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200 text-sm rounded-xl shadow-sm">
//                   Logout
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Navbar;

import { Bell, LogOut, X, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/tabToken';
import SearchBar from './SearchBar';

const API_URL = import.meta.env.VITE_API_URL;
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || API_URL.replace(/\/api\/?$/, "");

const Navbar = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [companyName, setCompanyName] = useState('Loading...');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const getAuth = () => {
    const token = getToken();
    const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    return { token, userData };
  };

  const getCompanyFirstLetter = () => {
    const name = companyName;
    if (!name || name === 'Loading...') return '?';
    return name.trim()[0].toUpperCase();
  };

  const loadCompanyName = () => {
    try {
      const { userData } = getAuth();
      const storedCompanyName = localStorage.getItem('companyName');

      if (storedCompanyName) { setCompanyName(storedCompanyName); return; }
      if (!userData) { setCompanyName('Interiors'); return; }

      if (userData.companyName)        setCompanyName(userData.companyName);
      else if (userData.company?.name) setCompanyName(userData.company.name);
      else if (userData.companyId)     fetchCompanyName(userData.companyId);
      else                             setCompanyName('Interiors');
    } catch (e) {
      setCompanyName('Interiors');
    }
  };

  const fetchCompanyName = async (companyId) => {
    try {
      const { token } = getAuth();
      const res = await fetch(`${API_URL}/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.name || 'Interiors');
      } else {
        setCompanyName('Interiors');
      }
    } catch {
      setCompanyName('Interiors');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { token, userData } = getAuth();
      if (!token) return;

      const userId =
        userData?.userId || userData?.id || userData?._id || localStorage.getItem('userId');

      if (!userId) return;

      const res = await fetch(`${API_URL}/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error('Profile fetch failed:', res.status);
        return;
      }

      const data = await res.json();

      if (data.success) {
        const logo = data.user?.company?.logo;

        if (logo) {
          const logoUrl = logo.startsWith('http') ? logo : `${BACKEND_URL}${logo}`;
          setProfilePic(logoUrl);
        } else {
          setProfilePic(null);
        }

        if (data.user?.company?.name) {
          setCompanyName(data.user.company.name);
          localStorage.setItem('companyName', data.user.company.name);
        }
      }
    } catch (e) {
      console.error('fetchUserProfile error:', e);
    }
  };

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const { token } = getAuth();
      if (!token) return;

      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (e) {
      console.error('fetchNotifications error:', e);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const { token } = getAuth();
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    try {
      const { token } = getAuth();
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id) => {
    try {
      const { token } = getAuth();
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const diffMs    = Date.now() - date;
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays  = Math.floor(diffMs / 86400000);
    if (diffMins  < 1)  return 'Just now';
    if (diffMins  < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays  < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadCompanyName();
    fetchNotifications();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onStorage       = (e) => { if (e.key === 'companyName' || e.key === 'user') loadCompanyName(); };
    const onCompanyUpdate = () => loadCompanyName();
    const onProfileUpdate = () => fetchUserProfile();

    window.addEventListener('storage', onStorage);
    window.addEventListener('companyNameUpdated', onCompanyUpdate);
    window.addEventListener('profileUpdated', onProfileUpdate);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('companyNameUpdated', onCompanyUpdate);
      window.removeEventListener('profileUpdated', onProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowSettingsDropdown(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target))
        setShowNotificationsDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { setShowSettingsDropdown(false); setShowLogoutModal(true); };
  const cancelLogout  = () => setShowLogoutModal(false);
  const confirmLogout = () => {
    removeToken();
    localStorage.removeItem('user');
    setShowLogoutModal(false);
    navigate('/');
    window.location.reload();
  };

  const handleNotification     = () => { setShowNotificationsDropdown((v) => !v); if (!showNotificationsDropdown) fetchNotifications(); };
  const handleProfile          = () => { setShowSettingsDropdown(false); navigate('/profile'); };
  const toggleSettingsDropdown = () => setShowSettingsDropdown((v) => !v);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 h-20 sm:h-20 md:left-64 md:h-24 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-2 sm:gap-4">

            {/* Left - welcome */}
            <div className="hidden sm:flex items-center flex-shrink min-w-0">
              <div className="min-w-0">
                <p className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 truncate max-w-[120px] md:max-w-[150px] lg:max-w-[260px] leading-tight">
                  Welcome {companyName}
                </p>
              </div>
            </div>

            {/* Center - Search */}
            <SearchBar />

            {/* Right - Icons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

              {/* Bell */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={handleNotification}
                  className="relative w-10 h-10 rounded-full border border-yellow-200 bg-white text-gray-500 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-400 flex items-center justify-center transition-colors duration-200"
                  aria-label="Notifications"
                >
                  <Bell size={18} strokeWidth={2} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in max-h-[500px] flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 bg-yellow-50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-yellow-700 hover:text-yellow-900 font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {isLoadingNotifications ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell size={40} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((n) => (
                            <div key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-yellow-50' : ''}`}>
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!n.read ? 'font-semibold' : ''} text-gray-900`}>{n.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">{formatNotificationDate(n.date)}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  {!n.read && (
                                    <button onClick={() => markNotificationAsRead(n.id)} className="p-1 text-yellow-700 hover:text-yellow-900 text-xs" title="Mark as read">check</button>
                                  )}
                                  <button onClick={() => deleteNotification(n.id)} className="p-1 text-red-500 hover:text-red-700" title="Delete">
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleSettingsDropdown}
                  className="flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 focus:outline-none overflow-hidden flex-shrink-0 ring-2 ring-yellow-400"
                  style={{ width: 40, height: 40 }}
                  aria-label="Profile menu"
                >
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Company logo"
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn('Logo failed to load, showing letter fallback');
                        setProfilePic(null);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-yellow-400 flex items-center justify-center text-black text-base font-semibold select-none">
                      {getCompanyFirstLetter()}
                    </div>
                  )}
                </button>

                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    <div className="py-2">
                      <button
                        onClick={handleProfile}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <User size={18} strokeWidth={2} />
                        <span className="text-sm font-medium">Profile</span>
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut size={18} strokeWidth={2} />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[90%] sm:max-w-md w-full p-4 sm:p-5 md:p-6 relative animate-fade-in">
            <button onClick={cancelLogout} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-100 mb-3 sm:mb-4">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-700" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Do you really want to logout?</p>
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center">
                <button onClick={cancelLogout} className="w-full xs:w-auto px-4 py-2.5 sm:px-6 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors duration-200 text-sm rounded-xl">
                  Cancel
                </button>
                <button onClick={confirmLogout} className="w-full xs:w-auto px-4 py-2.5 sm:px-6 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200 text-sm rounded-xl shadow-sm">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;