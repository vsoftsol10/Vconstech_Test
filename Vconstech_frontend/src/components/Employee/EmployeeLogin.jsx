import React, { useEffect, useState } from 'react';
import { User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import adminLogin from "../../assets/admin login.png";
import adminTab from "../../assets/AdminTab.png";
import { useNavigate } from 'react-router-dom';
import { loginEngineer } from '../../api/engineerService';
import { handleLoginSuccess } from '../../utils/auth';
import { focusFirstInvalidField, validateFields } from '../../utils/formValidation';

export default function EmployeeLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Vconstech - Engineer";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateFields([
      { name: 'username', value: username, label: 'Username', rules: ['required'] },
      { name: 'password', value: password, label: 'Password', rules: ['required'] },
    ]);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting engineer login...');
      const response = await loginEngineer(username, password);
      
      console.log('✅ Login response:', response);
      
      if (response.success) {
  handleLoginSuccess(response);
  console.log('✅ Engineer logged in:', response.engineer.name);
  navigate('/employee-dashboard');
}
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
     {/* Desktop image (large screens) */}
           <div className="hidden xl:flex xl:w-1/2 relative bg-yellow-400 overflow-hidden items-center justify-center">
             <img
               src={adminLogin}
               alt="Admin Login Background"
               className="w-full h-full object-contain"
             />
           </div>
           
           {/* Tablet image (1024x680 size) */}
           <div className="hidden lg:flex xl:hidden lg:w-1/2 relative bg-yellow-400 overflow-hidden items-center justify-center">
             <img
               src={adminTab}
               alt="Admin Tab Background"
               className="w-full h-full object-contain"
             />
           </div>


      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">WELCOME</h2>
              <p className="text-gray-500 text-sm uppercase tracking-wide">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                      setFieldErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    placeholder="Enter your username"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.username && <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Enter your password"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>


            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Having trouble? Contact your administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
