// import React, { useState } from "react";
// import { Lock } from "lucide-react";
// import { getToken } from '../../utils/tabToken';

// const PasswordChangeForm = ({ onError, onSuccess }) => {
//   const [showPasswordChange, setShowPasswordChange] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [passwordData, setPasswordData] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });

//   const handlePasswordChange = async () => {
//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       onError("Passwords do not match");
//       return;
//     }
//     if (passwordData.newPassword.length < 6) {
//       onError("Password must be at least 6 characters");
//       return;
//     }

//     setSaving(true);

//     try {
//       const API_URL =
//         import.meta.env.VITE_API_URL;
//       const userId = localStorage.getItem("userId");
// const token = getToken();
//       const response = await fetch(
//         `${API_URL}/users/change-password/${userId}`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             currentPassword: passwordData.currentPassword,
//             newPassword: passwordData.newPassword,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         onSuccess("Password changed successfully!");
//         setShowPasswordChange(false);
//         setPasswordData({
//           currentPassword: "",
//           newPassword: "",
//           confirmPassword: "",
//         });
//       } else {
//         onError(data.error || "Failed to change password");
//       }
//     } catch (err) {
//       console.error("Password change error:", err);
//       onError("An error occurred while changing password");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     setShowPasswordChange(false);
//     setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
//     onError("");
//   };

//   return (
//     <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h3 className="text-xl font-bold text-gray-900">Security</h3>
//           <p className="text-gray-600 text-sm mt-1">Manage your password</p>
//         </div>
//         {!showPasswordChange && (
//           <button
//             onClick={() => setShowPasswordChange(true)}
//             className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
//           >
//             <Lock className="w-4 h-4" />
//             Change Password
//           </button>
//         )}
//       </div>

//       {showPasswordChange && (
//         <div className="bg-gray-50 rounded-xl p-6 space-y-4">
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Current Password
//             </label>
//             <input
//               type="password"
//               value={passwordData.currentPassword}
//               onChange={(e) =>
//                 setPasswordData({ ...passwordData, currentPassword: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] outline-none"
//               placeholder="Enter current password"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               New Password
//             </label>
//             <input
//               type="password"
//               value={passwordData.newPassword}
//               onChange={(e) =>
//                 setPasswordData({ ...passwordData, newPassword: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] outline-none"
//               placeholder="Enter new password"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Confirm New Password
//             </label>
//             <input
//               type="password"
//               value={passwordData.confirmPassword}
//               onChange={(e) =>
//                 setPasswordData({ ...passwordData, confirmPassword: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] outline-none"
//               placeholder="Confirm new password"
//             />
//           </div>
//           <div className="flex gap-3 mt-4">
//             <button
//               onClick={handleCancel}
//               disabled={saving}
//               className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handlePasswordChange}
//               disabled={saving}
//               className="flex-1 px-4 py-3 bg-[#ffbe2a] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
//             >
//               {saving ? "Changing..." : "Change Password"}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PasswordChangeForm;

import React, { useState } from "react";
import { Lock, ShieldCheck, Eye, EyeOff, Edit2, X } from "lucide-react";
import { getToken } from '../../utils/tabToken';

const PasswordChangeForm = ({ userInfo, onError, onSuccess }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const resetForm = () => {
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleOpen = () => {
    setShowPasswordForm(true);
    onError("");
  };

  const handleCancel = () => {
    setShowPasswordForm(false);
    resetForm();
    onError("");
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      onError("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      onError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const userId = localStorage.getItem("userId");
      const token = getToken();
      const response = await fetch(
        `${API_URL}/users/change-password/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSuccess("Password changed successfully!");
        setShowPasswordForm(false);
        resetForm();
      } else {
        onError(data.error || "Failed to change password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      onError("An error occurred while changing password");
    } finally {
      setSaving(false);
    }
  };

  const PasswordInput = ({ label, value, onChange, show, toggleShow, placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffbe2a]" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] outline-none text-sm"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#fff3d6] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#ffbe2a]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Security</h3>
        </div>

        {!showPasswordForm ? (
          <button
            onClick={handleOpen}
            className="flex items-center gap-1 text-[#ffbe2a] font-semibold text-sm hover:underline"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-1 text-gray-500 font-semibold text-sm hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {!showPasswordForm ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Password</p>
            <p className="text-gray-900 font-medium tracking-widest">••••••••••••</p>
          </div>
          {userInfo?.passwordUpdatedAt && (
            <p className="text-sm text-gray-400">
              Last updated on{" "}
              {new Date(userInfo.passwordUpdatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <PasswordInput
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            show={showCurrent}
            toggleShow={() => setShowCurrent(!showCurrent)}
            placeholder="Enter current password"
          />
          <PasswordInput
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            show={showNew}
            toggleShow={() => setShowNew(!showNew)}
            placeholder="Enter new password"
          />
          <PasswordInput
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            show={showConfirm}
            toggleShow={() => setShowConfirm(!showConfirm)}
            placeholder="Confirm new password"
          />
          <div className="flex justify-end pt-2">
            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#ffbe2a] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              <Lock className="w-4 h-4" />
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordChangeForm;
