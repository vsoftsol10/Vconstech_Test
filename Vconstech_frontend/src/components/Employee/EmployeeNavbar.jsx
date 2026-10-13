import { useEffect, useState } from 'react'
import { LogOut, X, Menu, UserRound } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { logout } from '../../utils/auth'; //  Import auth utility
import { getToken } from '../../utils/tabToken';

const API_URL = import.meta.env.VITE_API_URL;

const EmployeeNavbar = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [designation, setDesignation] = useState('Site Enginee');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/engineers/my-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.engineer?.designation) {
        setDesignation(data.engineer.designation);
      }
    } catch (err) {
      console.error('Failed to fetch engineer profile:', err);
    }
  };

  fetchProfile();
}, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
  logout(navigate); // Pass navigate function
  setShowLogoutModal(false);
};

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 lg:h-24 bg-[#ffbe2a] border-t-4 border-slate-800 shadow-md backdrop-blur-xl">      
        <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left side - Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl lg:text-2xl uppercase font-black text-slate-900 tracking-tight">
                  {designation} !
                </h1>
              </div>
            </div>

            {/* Center - Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/employee-dashboard"
                className={`ml-2 px-1 lg:px-4 py-2 rounded-lg font-semibold text-xs lg:text-sm tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee-dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-900/10'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/employee/material-management"
                className={`px-1 lg:px-4 py-2 rounded-lg font-semibold text-xs lg:text-sm tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/material-management'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-900/10'
                }`}
              >
                Material Management
              </Link>
              <Link
                to="/employee/file-management"
                className={`px-1 lg:px-4 py-2 rounded-lg font-semibold text-xs lg:text-sm tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/file-management'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-900/10'
                }`}
              >
                File Management
              </Link>
              <Link
                to="/employee/labour-management"
                className={`px-1 lg:px-4 py-2 rounded-lg font-semibold text-xs lg:text-sm tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/labour-management'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-900/10'
                }`}
              >
                Labour Management
              </Link>
              <Link
                to="/employee/profile"
                className={`px-1 lg:px-4 py-2 rounded-lg font-semibold text-xs lg:text-sm tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/profile'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-900/10'
                }`}
              >
                Profile
              </Link>
            </div>

            {/* Right side - Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center rounded-2xl gap-2 bg-slate-900 text-white px-4 lg:px-5 py-2 lg:py-2.5 hover:bg-slate-800 transition-colors duration-200 font-semibold uppercase text-xs lg:text-sm tracking-wide"
                aria-label="Logout"
              >
                <span className='text-white'>Logout</span>
                <LogOut size={16} className="lg:w-[18px] lg:h-[18px]" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                aria-label="Menu"
              >
                <Menu size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={closeMobileMenu}
          ></div>
          <div className="fixed top-16 sm:top-20 right-0 left-0 bg-white shadow-lg animate-slide-down">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/employee-dashboard"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee-dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/employee/material-management"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/material-management'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                Material Management
              </Link>
              <Link
                to="/employee/file-management"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/file-management'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                File Management
              </Link>
              <Link
                to="/employee/labour-management"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/labour-management'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                Labour Management
              </Link>
              <Link
                to="/employee/profile"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors duration-200 ${
                  location.pathname === '/employee/profile'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2"><UserRound size={17} /> Profile & payslips</span>
              </Link>
              
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 font-semibold uppercase text-sm tracking-wide sm:hidden"
              >
                <span>Logout</span>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={cancelLogout}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                <LogOut className="h-6 w-6 text-amber-600" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Confirm Logout
              </h3>
              
              <p className="text-slate-600 mb-6">
                Do you really want to logout?
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelLogout}
                  className="px-6 py-2.5 bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors duration-200 uppercase text-sm tracking-wide rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-6 py-2.5 bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors duration-200 uppercase text-sm tracking-wide rounded-lg"
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

export default EmployeeNavbar
