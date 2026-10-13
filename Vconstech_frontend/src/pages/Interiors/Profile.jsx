import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Home,
  Package,
  Users,
  BriefcaseBusiness,
  IndianRupee,
  Edit2,
  Save,
  FileText,
  Calendar,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import SidePannel from "../../components/common/SidePannel";
import InfoField from "../../components/Profile/Infofield";
import ProfileHeader from "../../components/Profile/Profileheader";
import CompanyLogoUpload from "../../components/Profile/Companylogoupload";
import PasswordChangeForm from "../../components/Profile/Passwordchangeform";
import LoadingScreen from "../../components/common/Loadingscreen";
import { getToken } from '../../utils/tabToken';
import TemplateChooserModal from '../../components/Profile/TemplateChooserModal';
import { showToast } from '../../components/common/Toast';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAuthenticatedUserId = (token) => {
  if (!token) return localStorage.getItem("userId");

  try {
    const payloadPart = token.split(".")[1];
    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalizedPayload));
    return payload.userId || payload.id || localStorage.getItem("userId");
  } catch (error) {
    console.error("Error reading auth token:", error);
    return localStorage.getItem("userId");
  }
};

const formatPlanExpiryDate = (dateValue) => {
  if (!dateValue) return 'No Expiry';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'No Expiry';

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const getDisplayedPlanExpiryDate = (user) => {
  if (user?.trialEndDate) return formatPlanExpiryDate(user.trialEndDate);

  // Temporary UI fallback for paid accounts created before an end date was
  // saved. The API persists this date on the next profile request.
  if (user?.package && user?.subscriptionStatus !== 'TRIAL_ACTIVE') {
    const startedAt = user.subscriptionStartedAt || user.createdAt;
    if (startedAt) {
      const expiryDate = new Date(startedAt);
      expiryDate.setMonth(expiryDate.getMonth() + 12);
      return formatPlanExpiryDate(expiryDate);
    }
  }

  return 'No Expiry';
};

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showTemplateChooser, setShowTemplateChooser] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

  useEffect(() => {
    document.title = "Vconstech - Admin";
  }, []);
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async (allowRetry = true) => {
    setLoading(true);
    setError("");

    const loadProfile = async () => {
      const API_URL = import.meta.env.VITE_API_URL;
      const token = getToken();
      const userId = getAuthenticatedUserId(token);

      if (!userId || !token) {
        return {
          success: false,
          retryable: true,
          error: "Authentication is still loading. Please wait a moment.",
        };
      }

      try {
        const response = await fetch(`${API_URL}/users/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return { success: true, user: data.user };
        }

        return {
          success: false,
          retryable: response.status >= 500 || response.status === 401 || response.status === 403,
          error: data.error || "Failed to load profile",
        };
      } catch (err) {
        console.error("Error fetching profile:", err);
        return {
          success: false,
          retryable: true,
          error: "An error occurred while loading your profile",
        };
      }
    };

    try {
      let result = await loadProfile();

      if (!result.success && allowRetry && result.retryable) {
        await sleep(300);
        result = await loadProfile();
      }

      if (result.success) {
        setUserInfo(result.user);
        setEditedUser(result.user);
        localStorage.setItem('selectedTemplateId', String(result.user.selectedTemplateId || 1));
        localStorage.setItem('userPlan', result.user.package || result.user.subscriptionPlan || 'TRIAL');
        localStorage.setItem("userId", result.user.id);
        localStorage.setItem("userName", result.user.name);
        localStorage.setItem("userEmail", result.user.email);
        if (result.user.phoneNumber)
          localStorage.setItem("userPhone", result.user.phoneNumber);
        if (result.user.city)
          localStorage.setItem("userCity", result.user.city);
        if (result.user.company?.name)
          localStorage.setItem("companyName", result.user.company.name);
      } else {
        setError(result.error || "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (selectedTemplateId) => {
    try {
      setSavingTemplate(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/document-template`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ selectedTemplateId }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save template');
      setUserInfo((current) => ({ ...current, selectedTemplateId: data.selectedTemplateId }));
      localStorage.setItem('selectedTemplateId', String(data.selectedTemplateId));
      setShowTemplateChooser(false); showToast('Template applied successfully!', 'success');
    } catch (error) { showToast(error.message, 'error'); } finally { setSavingTemplate(false); }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({ ...userInfo, companyName: userInfo.company?.name || "" });
    setError("");
    setSuccess("");
  };

  // Kept per your instructions — not wired to a visible button since
  // the target screenshots only show a single "Save Changes" action.
  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({ ...userInfo });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const token = getToken();
      const userId = getAuthenticatedUserId(token);
      const response = await fetch(`${API_URL}/users/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedUser.name,
          email: editedUser.email,
          phoneNumber: editedUser.phoneNumber,
          city: editedUser.city,
          address: editedUser.address,
          gstNumber: editedUser.gstNumber,
          companyName: editedUser.companyName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.user);
        setEditedUser(data.user);
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        if (data.user.company?.name) {
          localStorage.setItem("companyName", data.user.company.name);
          window.dispatchEvent(new Event("companyNameUpdated"));
        }
        window.dispatchEvent(new Event("profileUpdated"));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("An error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUploadSuccess = async () => {
    setSuccess("Logo uploaded successfully!");
    await fetchUserProfile();
    window.dispatchEvent(new Event("profileUpdated"));
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) return <LoadingScreen message="Loading profile data..." />;

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-16 pl-0 md:pl-64 pb-20 md:pb-0 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 text-lg">Failed to load profile</p>
            <button
              onClick={fetchUserProfile}
              className="mt-4 px-6 py-2 bg-[#ffbe2a] text-black font-semibold rounded-lg hover:shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pl-0 md:pl-64 md:pt-25 pb-20 md:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Profile</h1>
                <p className="text-gray-500 mt-1">Manage your account information here</p>
              </div>
              <div className="flex gap-3">{!isEditing && <button onClick={() => setShowTemplateChooser(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#ffbe2a] text-black font-semibold rounded-xl hover:shadow-lg transition-all text-sm"><FileText className="w-4 h-4" />Choose Template</button>}{!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#ffbe2a] text-[#ffbe2a] font-semibold rounded-xl hover:bg-[#fff8e8] transition-all text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}</div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl">
                <p className="text-sm font-medium text-green-900">{success}</p>
              </div>
            )}

            <div className="space-y-6">

              {/* Avatar Card */}
              <div className="bg-white shadow-sm rounded-2xl p-6 sm:p-8">
                <ProfileHeader userInfo={userInfo} apiBaseUrl={API_BASE_URL} />
              </div>

              {/* Personal Information Card */}
              <div className="bg-white shadow-sm rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#fff3d6] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#ffbe2a]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                  </div>
                  {/* {isEditing && (
                    <span className="flex items-center gap-1 text-[#ffbe2a] font-semibold text-sm">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </span>
                  )} */}
                </div>

                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 pb-4">
                    <InfoField icon={User} label="Full Name" value={userInfo.name} editable field="name" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} hideIconInView />
                    <div className="md:border-l md:border-gray-100 md:pl-8 mt-4 md:mt-0">
                      <InfoField icon={Mail} label="Email Address" value={userInfo.email} editable field="email" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 py-4">
                    <InfoField icon={Phone} label="Phone Number" value={userInfo.phoneNumber} editable field="phoneNumber" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <div className="md:border-l md:border-gray-100 md:pl-8 mt-4 md:mt-0">
                      <InfoField icon={MapPin} label="City" value={userInfo.city} editable field="city" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 py-4">
                    <InfoField icon={FileText} label="GST Number" value={userInfo.gstNumber} editable field="gstNumber" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <div className="md:border-l md:border-gray-100 md:pl-8 mt-4 md:mt-0">
                      <InfoField icon={Building} label="Company Name" value={userInfo.company?.name} editable field="companyName" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 py-4">
                    <InfoField icon={Package} label="Package" value={userInfo.package} editable={false} isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    {userInfo.package === "Advanced" && userInfo.customMembers && (
                      <div className="md:border-l md:border-gray-100 md:pl-8 mt-4 md:mt-0">
                        <InfoField icon={Users} label="Site Engineers Limit" value={userInfo.customMembers} editable={false} isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                      </div>
                    )}
                  </div>

                  {userInfo.package === "Advanced" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 py-4">
                      <InfoField icon={BriefcaseBusiness} label="Projects Limit" value={userInfo.customProjectLimit ?? "Not configured"} editable={false} isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                      <div className="md:border-l md:border-gray-100 md:pl-8 mt-4 md:mt-0">
                        <InfoField icon={IndianRupee} label="Custom Annual Price" value={userInfo.customPrice != null ? `Rs.${Number(userInfo.customPrice).toLocaleString("en-IN")}` : "Not configured"} editable={false} isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 py-4">
                    <InfoField
                      icon={Calendar}
                      label="Plan Expiry Date"
                      value={getDisplayedPlanExpiryDate(userInfo)}
                      editable={false}
                      isEditing={isEditing}
                      editedUser={editedUser}
                      setEditedUser={setEditedUser}
                    />
                    <div className="md:border-l md:border-gray-100 md:pl-8 mt-4 md:mt-0" />
                  </div>

                  <div className="pt-4">
                    <InfoField icon={Home} label="Address" value={userInfo.address} editable field="address" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} multiline />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-[#ffbe2a] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              {/* Company Logo (Admin Only) */}
              {userInfo.role === "Admin" && (
                <div className="bg-white shadow-sm rounded-2xl p-6 sm:p-8">
                  <CompanyLogoUpload
                    userInfo={userInfo}
                    apiBaseUrl={API_BASE_URL}
                    onUploadSuccess={handleLogoUploadSuccess}
                    onError={setError}
                  />
                </div>
              )}

              {/* Security */}
              <div className="bg-white shadow-sm rounded-2xl p-6 sm:p-8">
                <PasswordChangeForm
                  isEditing={isEditing}
                  userInfo={userInfo}
                  onError={setError}
                  onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }}
                />
              </div>

            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              🔒 Your information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
      <TemplateChooserModal open={showTemplateChooser} onClose={() => !savingTemplate && setShowTemplateChooser(false)} selectedTemplateId={userInfo.selectedTemplateId || 1} plan={userInfo.package || userInfo.subscriptionPlan} customTemplateLimit={userInfo.customTemplateLimit} onApply={handleApplyTemplate} />
    </div>
  );
};

export default Profile;
