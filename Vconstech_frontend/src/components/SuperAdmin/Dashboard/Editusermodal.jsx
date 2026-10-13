import React from "react";
import {
  X, AlertCircle, User, Mail, Phone, UserCog,
  Building, MapPin, Package, Users, Lock, Home, BriefcaseBusiness, IndianRupee,
} from "lucide-react";

const ROLES = [{ value: "Admin", label: "Admin" }];
const PACKAGES = [
  { value: "Free",    label: "Free " },
  { value: "Basic",    label: "Basic " },
  { value: "Premium",  label: "Premium " },
  { value: "Advanced", label: "Advanced " },
];

const inputClass = (hasError) =>
  `w-full pl-11 pr-4 py-2.5 bg-white border ${
    hasError ? "border-red-400" : "border-gray-200"
  } rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none transition`;

const IconWrap = ({ icon: Icon }) => (
  <div className="absolute left-3 top-1/2 -translate-y-1/2">
    <Icon className="w-4 h-4 text-[#c98f00]" />
  </div>
);

const Field = ({ label, required = true, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
      {label}{" "}
      {required && <span className="text-red-400">*</span>}
      {!required && <span className="text-gray-400 normal-case font-normal">(optional)</span>}
    </label>
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      {children}
    </div>
    {error && <p className="text-red-500 text-xs font-medium pl-1">{error}</p>}
  </div>
);

const EditUserModal = ({ user, loading, error, fieldErrors, onChange, onUpdate, onClose }) => {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.22s cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Header strip */}
        <div className="bg-[#ffbe2a] px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
              <span className="text-[#ffbe2a] font-bold text-xl uppercase">
                {user.name?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-yellow-900 uppercase tracking-widest opacity-70">
                Edit Profile
              </p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <Field label="Full Name" error={fieldErrors.name}>
              <div className="relative">
                <IconWrap icon={User} />
                <input type="text" value={user.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className={inputClass(fieldErrors.name)}
                  placeholder="Enter full name" />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email" error={fieldErrors.email}>
              <div className="relative">
                <IconWrap icon={Mail} />
                <input type="email" value={user.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  className={inputClass(fieldErrors.email)}
                  placeholder="Enter email address" />
              </div>
            </Field>

            {/* Phone */}
            <Field label="Contact Number" error={fieldErrors.phoneNumber}>
              <div className="relative">
                <IconWrap icon={Phone} />
                <input type="tel" value={user.phoneNumber}
                  onChange={(e) => onChange("phoneNumber", e.target.value)}
                  className={inputClass(fieldErrors.phoneNumber)}
                  placeholder="Enter phone number" />
              </div>
            </Field>

            {/* Role */}
            <Field label="Role" error={fieldErrors.role}>
              <div className="relative">
                <IconWrap icon={UserCog} />
                <select value={user.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  className={inputClass(fieldErrors.role)}>
                  <option value="">Select role</option>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </Field>

            {/* Company */}
            <Field label="Company Name" error={fieldErrors.companyName}>
              <div className="relative">
                <IconWrap icon={Building} />
                <input type="text" value={user.companyName}
                  onChange={(e) => onChange("companyName", e.target.value)}
                  className={inputClass(fieldErrors.companyName)}
                  placeholder="Enter company name" />
              </div>
            </Field>

            {/* City */}
            <Field label="City" error={fieldErrors.city}>
              <div className="relative">
                <IconWrap icon={MapPin} />
                <input type="text" value={user.city}
                  onChange={(e) => onChange("city", e.target.value)}
                  className={inputClass(fieldErrors.city)}
                  placeholder="Enter city" />
              </div>
            </Field>

            {/* Package */}
            <Field label="Package" error={fieldErrors.package}>
              <div className="relative">
                <IconWrap icon={Package} />
                <select value={user.package}
                  onChange={(e) => onChange("package", e.target.value)}
                  className={inputClass(fieldErrors.package)}>
                  <option value="">Select package</option>
                  {PACKAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </Field>

            {/* Custom Members — only for Advanced */}
            {user.package === "Advanced" && (
              <>
                <Field label="Number of Site Engineers" error={fieldErrors.customMembers}>
                  <div className="relative">
                    <IconWrap icon={Users} />
                    <input type="number" value={user.customMembers || ""}
                      onChange={(e) => onChange("customMembers", e.target.value)}
                      className={inputClass(fieldErrors.customMembers)}
                      placeholder="Enter number" min="1" />
                  </div>
                </Field>
                <Field label="Number of Projects" error={fieldErrors.customProjectLimit}>
                  <div className="relative">
                    <IconWrap icon={BriefcaseBusiness} />
                    <input type="number" value={user.customProjectLimit || ""}
                      onChange={(e) => onChange("customProjectLimit", e.target.value)}
                      className={inputClass(fieldErrors.customProjectLimit)}
                      placeholder="Enter number" min="1" />
                  </div>
                </Field>
                <Field label="Custom Annual Price (Rs.)" error={fieldErrors.customPrice}>
                  <div className="relative">
                    <IconWrap icon={IndianRupee} />
                    <input type="number" value={user.customPrice ?? ""}
                      onChange={(e) => onChange("customPrice", e.target.value)}
                      className={inputClass(fieldErrors.customPrice)}
                      placeholder="Enter agreed price" min="0" step="0.01" />
                  </div>
                </Field>
              </>
            )}

            {/* New Password */}
            <Field label="New Password" required={false} error={fieldErrors.password}>
              <div className="relative">
                <IconWrap icon={Lock} />
                <input type="password" value={user.password || ""}
                  onChange={(e) => onChange("password", e.target.value)}
                  className={inputClass(fieldErrors.password)}
                  placeholder="Leave blank to keep current" />
              </div>
            </Field>

            {/* Confirm Password — only if password typed */}
            {user.password && (
              <Field label="Confirm New Password" error={fieldErrors.confirmPassword}>
                <div className="relative">
                  <IconWrap icon={Lock} />
                  <input type="password" value={user.confirmPassword || ""}
                    onChange={(e) => onChange("confirmPassword", e.target.value)}
                    className={inputClass(fieldErrors.confirmPassword)}
                    placeholder="Confirm new password" />
                </div>
              </Field>
            )}
          </div>

          {/* Address — full width */}
          <div className="mt-4 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Address <span className="text-red-400">*</span>
            </label>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="relative">
                <div className="absolute left-3 top-3">
                  <Home className="w-4 h-4 text-[#c98f00]" />
                </div>
                <textarea value={user.address}
                  onChange={(e) => onChange("address", e.target.value)}
                  rows={3}
                  placeholder="Enter full address"
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border ${
                    fieldErrors.address ? "border-red-400" : "border-gray-200"
                  } rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none transition resize-none`}
                />
              </div>
            </div>
            {fieldErrors.address && <p className="text-red-500 text-xs font-medium pl-1">{fieldErrors.address}</p>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onUpdate} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[#ffbe2a] hover:bg-[#f0b020] text-black font-bold text-sm transition-colors disabled:opacity-50 shadow-sm">
            {loading ? "Updating..." : "Update User"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </div>
  );
};

export default EditUserModal;
