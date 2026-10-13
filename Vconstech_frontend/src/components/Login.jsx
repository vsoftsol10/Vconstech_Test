import React, { useEffect, useState } from "react";
import { Lock, Mail, Home, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { handleLoginSuccess } from "../utils/auth";
import adminLogin from "../assets/admin login.png";
import adminTab from "../assets/AdminTab.png";
import logo from "../assets/constech-logo.png";
import { focusFirstInvalidField, validateFields } from "../utils/formValidation";

const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isFocused, setIsFocused] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

  useEffect(() => {
  document.title = "Vconstech - Admin";
}, []);

  const handleLoginSubmit = async () => {
    setError("");
    setSuccess("");

    const errors = validateFields([
      { name: "email", value: loginData.email, label: "Email", rules: ["email"] },
      { name: "password", value: loginData.password, label: "Password", rules: ["required"] },
    ]);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        handleLoginSuccess(data);
        if (data.passwordChangeRequired) {
          window.location.href = "/forced-change-password";
          return;
        }
        setSuccess("Login successful!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
  setError(
    err.message.includes('Failed to fetch') 
      ? "Cannot connect to server. Please check your connection." 
      : "Network error occurred. Please try again."
  );
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field, focused) => {
    setIsFocused({ ...isFocused, [field]: focused });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLoginSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
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

      <div className="flex-1 flex items-center justify-center p-8 bg-yellow-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-50 h-full  rounded-xl mb-4">
              {/* <Home className="w-8 h-8 text-white" /> */}
              <img src={logo} alt="Vconstech Logo" className="w-full h-full mr-2" />
            </div>
            {/* <p className="text-gray-600">Enterprise Resource Planning</p> */}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
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
              <h2 className="text-2xl font-bold uppercase text-center text-black mb-2">
                Welcome
              </h2>
              <p className="text-gray-600 mb-8  text-center">
                Sign In to Your Account
              </p>

              <div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div
                    className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
                      isFocused.loginEmail ? "border-black" : "border-gray-300"
                    }`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <Mail
                        className={`w-5 h-5 transition-colors ${
                          isFocused.loginEmail ? "text-black" : "text-gray-400"
                        }`}
                      />
                      <input
                        name="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          { setLoginData({ ...loginData, email: e.target.value }); setFieldErrors((prev) => ({ ...prev, email: "" })); }
                        }
                        onFocus={() => handleFocus("loginEmail", true)}
                        onBlur={() => handleFocus("loginEmail", false)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 ml-3 bg-transparent text-black placeholder-gray-400 outline-none"
                        placeholder="Enter your email"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div
                    className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
                      isFocused.loginPassword
                        ? "border-black"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <Lock
                        className={`w-5 h-5 transition-colors ${
                          isFocused.loginPassword
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) =>
                          { setLoginData({
                            ...loginData,
                            password: e.target.value,
                          }); setFieldErrors((prev) => ({ ...prev, password: "" })); }
                        }
                        onFocus={() => handleFocus("loginPassword", true)}
                        onBlur={() => handleFocus("loginPassword", false)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 ml-3 bg-transparent text-black placeholder-gray-400 outline-none pr-10"
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
                </div>

                <button
                  onClick={handleLoginSubmit}
                  disabled={loading}
                  className="w-full text-black font-semibold py-3 rounded-lg transition-all duration-200 hover:opacity-90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#ffbe2a" }}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
