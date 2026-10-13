import React, { useEffect, useState } from 'react';
import { Lock, Mail, Shield, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';


const SuperLogin = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isFocused, setIsFocused] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
    document.title = "Vconstech - Super Admin";
  }, []);
  // Hardcoded super admin credentials
  const SUPER_ADMIN_EMAIL = 'vsoftsolutions8813@gmail.com';
  const SUPER_ADMIN_PASSWORD = 'SmartVarun@9095';

  const handleLoginSubmit = async () => {
    setError('');
    setSuccess('');

    if (!loginData.email || !loginData.password) {
      setError('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      if (loginData.email === SUPER_ADMIN_EMAIL && loginData.password === SUPER_ADMIN_PASSWORD) {
        // Store super admin session
        const superAdminData = {
          user: {
            id: 'super_admin_001',
            name: 'Super Admin',
            email: SUPER_ADMIN_EMAIL,
            role: 'Super_Admin',
            companyName: 'VSoft Solutions'
          },
          token: 'super_admin_token_' + Date.now()
        };

        localStorage.setItem('token', superAdminData.token);
        localStorage.setItem('user', JSON.stringify(superAdminData.user));

        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/SuperAdmin/CreateUser';
        }, 1000);
      } else {
        setError('Invalid super admin credentials');
      }
      setLoading(false);
    }, 800);
  };

  const handleFocus = (field, focused) => {
    setIsFocused({ ...isFocused, [field]: focused });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLoginSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        {/* Background Video */}
        {/* <video
          className="absolute inset-0 w-full h-full object-cover"
          src={bgLogin}
          autoPlay
          loop
          muted
          playsInline
        /> */}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-gray-900 to-red-600 opacity-70"></div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">SUPER ADMIN</h1>
            <p className="text-xl text-gray-100 mb-8">System Control Panel</p>
            <div className="w-20 h-1 bg-red-600 mx-auto"></div>
            <p className="text-gray-100 mt-8 text-lg">
              Access the master control panel with elevated privileges to manage the entire ERP system.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">SUPER ADMIN</h1>
            <p className="text-gray-600">System Control Panel</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            {/* Security Badge */}
            <div className="flex items-center justify-center mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Shield className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm font-semibold text-red-600">RESTRICTED ACCESS</span>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold uppercase text-center text-black mb-2">Super Admin Access</h2>
              <p className="text-gray-600 mb-8 uppercase text-center">authenticate to continue</p>

              <div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <div
                    className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
                      isFocused.email ? 'border-red-600' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <Mail className={`w-5 h-5 transition-colors ${
                        isFocused.email ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        onFocus={() => handleFocus('email', true)}
                        onBlur={() => handleFocus('email', false)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 ml-3 bg-transparent text-black placeholder-gray-400 outline-none"
                        placeholder="Enter super admin email"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <div
                    className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
                      isFocused.password ? 'border-red-600' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <Lock className={`w-5 h-5 transition-colors ${
                        isFocused.password ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        onFocus={() => handleFocus('password', true)}
                        onBlur={() => handleFocus('password', false)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 ml-3 bg-transparent text-black placeholder-gray-400 outline-none pr-10"
                        placeholder="Enter super admin password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLoginSubmit}
                  disabled={loading}
                  className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:bg-red-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Authenticating...' : 'Access System'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ⚠️ This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperLogin;