import React from "react";
import { User, Mail, Crown, Building2 } from "lucide-react";

const ProfileHeader = ({ userInfo, apiBaseUrl }) => {
  const logo = userInfo.company?.logo;
  const logoUrl = logo
    ? logo.startsWith("http")
      ? logo
      : `${apiBaseUrl}${logo}`
    : null;

  return (
    <div className="flex items-center gap-6">
      <div className="w-24 h-24 rounded-full bg-[#fff3d6] flex items-center justify-center overflow-hidden flex-shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Company logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-10 h-10 text-[#ffbe2a]" />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">{userInfo.name}</h2>
        <div className="flex items-center gap-2 text-gray-500 mt-1 text-sm">
          <Mail className="w-4 h-4" />
          <span>{userInfo.email}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-[#fff3d6] text-[#b8860b] rounded-full text-xs font-bold tracking-wide">
          <Crown className="w-3.5 h-3.5" />
          {(userInfo.package || "Basic").toUpperCase()} PLAN
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;