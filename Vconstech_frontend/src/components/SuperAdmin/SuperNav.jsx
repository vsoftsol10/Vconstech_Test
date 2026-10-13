import { Bell, LogOut, X, Users, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import logo from '../../assets/constech-logo.png'
import { removeToken } from '../../utils/tabToken';

const SuperNav = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear all storage
    removeToken();
    localStorage.removeItem('user');
    
    // Close modal
    setShowLogoutModal(false);
    
    // Navigate and reload
    navigate("/SuperAdmin/login");
    window.location.reload();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 sm:h-20 md:h-24 bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100">      
        <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-full">
          <div className="relative flex items-center justify-between h-full gap-2 sm:gap-4">
            {/* Left side - Brand */}
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="Company Logo" 
                    className="h-12 w-12 sm:h-12 sm:w-10 md:h-32 md:w-30 object-contain drop-shadow-md" 
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Center Nav Links */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2">
              <NavLink
                to="/SuperAdmin/CreateUser"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold uppercase text-[10px] sm:text-xs md:text-lg tracking-wide transition-all duration-200
                  ${isActive
                    ? 'bg-slate-900 text-yellow-500 shadow-md'
                    : 'text-slate-600 hover:bg-yellow-100 hover:text-slate-900'
                  }`
                }
              >
                <LayoutDashboard size={14} className="sm:w-4 sm:h-4 md:w-[20px] md:h-[20px]" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/SuperAdmin/users"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold uppercase text-[10px] sm:text-xs md:text-lg tracking-wide transition-all duration-200
                  ${isActive
                    ? 'bg-slate-900 text-yellow-500 shadow-md'
                    : 'text-slate-600 hover:bg-yellow-100 hover:text-slate-900'
                  }`
                }
              >
                <Users size={14} className="sm:w-4 sm:h-4 md:w-[20px] md:h-[20px]" />
                <span>Users</span>
              </NavLink>
            </div>

            {/* Right side - Icons */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="group flex items-center rounded-xl sm:rounded-2xl gap-1 sm:gap-1.5 md:gap-2 bg-slate-900 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 hover:bg-slate-800 hover:shadow-xl transition-all duration-300 font-semibold uppercase text-[10px] sm:text-xs md:text-sm tracking-wide"
                aria-label="Logout"
              >
                <span className='text-white hidden xs:inline sm:inline'>Logout</span>
                <LogOut size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-[90%] sm:max-w-md w-full p-6 sm:p-7 md:p-8 relative">
            <button
              onClick={cancelLogout}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
              aria-label="Close"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-amber-50 mb-5 sm:mb-6 shadow-lg border-4 border-amber-100">
                <LogOut className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Confirm Logout
              </h3>
              
              <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                Are you sure you want to logout from your account?
              </p>

              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={cancelLogout}
                  className="w-full xs:w-auto px-6 py-3 sm:px-8 sm:py-3.5 bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 hover:shadow-md transition-all duration-200 uppercase text-xs sm:text-sm tracking-wide rounded-xl border-2 border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="w-full xs:w-auto px-6 py-3 sm:px-8 sm:py-3.5 bg-slate-900 text-white font-bold hover:bg-slate-800 hover:shadow-xl transition-all duration-200 uppercase text-xs sm:text-sm tracking-wide rounded-xl transform hover:scale-105"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SuperNav;