import React, { useEffect, useState } from "react";
import {
  X,
  Camera,
  User,
  Phone,
  MapPin,
  Briefcase,
  Lock,
  Mail,
  UserCircle,
} from "lucide-react";
import { focusFirstInvalidField, validateFields } from "../../utils/formValidation";

const AddEngineerModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    designation: "",
    status: "Active",
    empId: "",
    address: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [serverError, setServerError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = validateFields([
      { name: "name", value: formData.name, label: "Full name", rules: ["name"] },
      { name: "phone", value: formData.phone, label: "Phone number", rules: ["mobile"] },
      { name: "alternatePhone", value: formData.alternatePhone, label: "Alternate phone number", rules: formData.alternatePhone ? ["optionalMobile"] : [] },
      { name: "status", value: formData.status, label: "Status", rules: ["dropdown"] },
      { name: "empId", value: formData.empId, label: "Employee ID", rules: ["required"] },
      { name: "address", value: formData.address, label: "Address", rules: ["textarea"] },
      { name: "email", value: formData.email, label: "Email", rules: ["email"] },
      { name: "username", value: formData.username, label: "Username", rules: ["required"] },
      { name: "password", value: formData.password, label: "Password", rules: ["password"] },
      { name: "confirmPassword", value: formData.confirmPassword, label: "Confirm password", rules: ["required"] },
    ]);

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length) focusFirstInvalidField(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setServerError(''); // clear previous error

  const engineerData = {
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    alternatePhone: formData.alternatePhone.trim() || "",
    designation: formData.designation.trim() || "",
    status: formData.status,
    empId: formData.empId.trim(),
    address: formData.address.trim(),
    email: formData.email.trim(),
    username: formData.username.trim(),
    password: formData.password,
    profileImage: profileImage,
  };

  const result = await onSubmit(engineerData);

  if (result?.success) {
    resetForm();
  } else if (result?.error) {
    setServerError(result.error);
  }
};

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      alternatePhone: "",
      designation: "",
      status: "Active",
      empId: "",
      address: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    });
    setProfileImage(null);
    setImagePreview(null);
    setServerError('');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Add New Engineer</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2  `}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 `}
                      placeholder="10-digit number"
                      maxLength="10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Alternate Phone */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Alternate Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.alternatePhone ? "border-red-500" : "border-gray-300"} rounded-lg `}
                      placeholder="10-digit number (optional)"
                      maxLength="10"
                    />
                  </div>
                  {errors.alternatePhone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.alternatePhone}
                    </p>
                  )}
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Designation
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.designation ? "border-red-500" : "border-gray-300"} rounded-lg`}
                      placeholder="e.g. Senior Engineer (optional)"
                    />
                  </div>
                  {errors.designation && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.designation}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border ${errors.status ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  {errors.status && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.status}
                    </p>
                  )}
                </div>

                {/* Employee ID */}
                <div >
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="empId"
                      value={formData.empId}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.empId ? "border-red-500" : "border-gray-300"} rounded-lg `}
                      placeholder="Enter employee ID"
                    />
                  </div>
                  {errors.empId && (
                    <p className="text-red-500 text-sm mt-1">{errors.empId}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 `}
                      placeholder="Enter engineer email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.address ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 `}
                      placeholder="Address of the Engineer"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Login Credentials Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Login Credentials
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Create login credentials for system access
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.username ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 `}
                      placeholder="Enter username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-10 py-2 border  ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 `}
                      placeholder="Password (e.g. Abc@123)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-10 py-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-lg  `}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
{serverError && (
  <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-300 rounded-lg">
    <p className="text-red-600 text-sm font-medium">Warning: {serverError}</p>
  </div>
)}


        <div className="flex gap-3 p-6 border-t">
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-yellow-500  text-white py-3 px-6 rounded-lg font-extrabold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Adding Engineer..." : "Add Engineer"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-extrabold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEngineerModal;
