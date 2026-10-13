import { useState, useEffect } from 'react';
import { X, UserCircle, Lock } from 'lucide-react';
import { focusFirstInvalidField, validateFields } from '../../utils/formValidation';

const EditEngineerModal = ({ isOpen, onClose, onSubmit, isSubmitting, engineer }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    designation: '',
    status: 'Active',
    empId: '',
    address: '',
    email: '',
    username: '',
    password: '',
    profileImage: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (engineer) {
      //  EXTENSIVE DEBUGGING
      console.log('=== EDIT ENGINEER MODAL DEBUG ===');
      console.log('Full engineer object:', engineer);
      console.log('plainPassword field:', engineer.plainPassword);
      console.log('password field:', engineer.password);
      console.log('username field:', engineer.username);
      console.log('All engineer keys:', Object.keys(engineer));
      console.log('================================');
      
      // Try multiple possible password field names
      const passwordValue = engineer.plainPassword || engineer.password_plain || engineer.originalPassword || '';
      
      console.log('Password value being set:', passwordValue ? '***EXISTS***' : 'EMPTY/NULL');
      
      setFormData({
        name: engineer.name || '',
        phone: engineer.phone || '',
        alternatePhone: engineer.alternatePhone || '',
        designation: engineer.designation || '',
        status: engineer.status || 'Active',
        empId: engineer.empId || '',
        address: engineer.address || '',
        email: engineer.email || '',
        username: engineer.username || '',
        password: passwordValue, //  Use the password we found
        profileImage: null
      });
      setImagePreview(engineer.profileImage || null);
      setErrors({});
    }
  }, [engineer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  

  const validateForm = () => {
    const newErrors = validateFields([
      { name: 'name', value: formData.name, label: 'Full name', rules: ['name'] },
      { name: 'phone', value: formData.phone, label: 'Phone number', rules: ['mobile'] },
      { name: 'alternatePhone', value: formData.alternatePhone, label: 'Alternate phone', rules: formData.alternatePhone ? ['optionalMobile'] : [] },
      { name: 'status', value: formData.status, label: 'Status', rules: ['dropdown'] },
      { name: 'empId', value: formData.empId, label: 'Employee ID', rules: ['required'] },
      { name: 'address', value: formData.address, label: 'Address', rules: ['textarea'] },
      { name: 'email', value: formData.email, label: 'Email', rules: ['email'] },
      { name: 'username', value: formData.username, label: 'Username', rules: ['required'] },
      { name: 'password', value: formData.password, label: 'Password', rules: ['password'] },
    ]);

    setErrors(newErrors);
    if (Object.keys(newErrors).length) focusFirstInvalidField(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Log what we're sending
    console.log('Submitting updated engineer data:', {
      ...formData,
      password: formData.password ? '***HIDDEN***' : 'NOT PROVIDED'
    });

    const success = await onSubmit(engineer.id, formData);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      alternatePhone: '',
      designation: '',
      status: 'Active',
      empId: '',
      address: '',
      email: '',
      username: '',
      password: '',
      profileImage: null
    });
    setImagePreview(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Edit Engineer</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
              
              {/* Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:border-transparent`}
                  placeholder="Enter full name"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Employee ID */}
              <div className="mb-4">
                <label htmlFor="empId" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  id="empId"
                  name="empId"
                  value={formData.empId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                    errors.empId ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg  focus:border-transparent`}
                  placeholder="Enter employee ID"
                  disabled={isSubmitting}
                />
                {errors.empId && <p className="text-red-500 text-sm mt-1">{errors.empId}</p>}
              </div>

              {/* Designation */}
<div className="mb-4">
  <label htmlFor="designation" className="block text-sm font-extrabold text-gray-700 mb-1">
    Designation
  </label>
  <input
    type="text"
    id="designation"
    name="designation"
    value={formData.designation}
    onChange={handleChange}
    className="w-full px-4 py-2 border text-gray-600 font-medium border-gray-300 rounded-lg focus:border-transparent"
    placeholder="e.g. Senior Engineer (optional)"
    disabled={isSubmitting}
  />
</div>

              {/* Status */}
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:border-transparent`}
                  disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-extrabold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg  focus:border-transparent`}
                    placeholder="10 digit number"
                    maxLength="10"
                    disabled={isSubmitting}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="alternatePhone" className="block text-sm font-extrabold text-gray-700 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    id="alternatePhone"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                      errors.alternatePhone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg  focus:border-transparent`}
                    placeholder="10 digit number (optional)"
                    maxLength="10"
                    disabled={isSubmitting}
                  />
                  {errors.alternatePhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.alternatePhone}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:border-transparent`}
                  placeholder="Enter engineer email"
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-4 py-2 border text-gray-600 font-medium ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg  focus:border-transparent`}
                  placeholder="Enter full address"
                  disabled={isSubmitting}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>

            {/* Login Credentials Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Login Credentials</h4>
              <p className="text-sm text-gray-600 mb-4">Update login credentials if needed</p>
              
              {/* Username */}
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border text-gray-600 font-medium ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg  focus:border-transparent`}
                    placeholder="Enter username"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-extrabold text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-20 py-2 border text-gray-600 font-medium ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg  focus:border-transparent`}
                    placeholder="Enter password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-yellow-600 hover:text-yellow-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.password ? 'Current password is shown. Modify to change it.' : 'No password set - please enter one'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffbe2a' }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#e6ab25')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#ffbe2a')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Engineer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEngineerModal;
