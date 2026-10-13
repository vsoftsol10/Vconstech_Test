// import React, { useState } from "react";
// import { Upload, Image } from "lucide-react";
// import { getToken } from '../../utils/tabToken';

// const CompanyLogoUpload = ({ userInfo, apiBaseUrl, onUploadSuccess, onError }) => {
//   const [logoFile, setLogoFile] = useState(null);
//   const [logoPreview, setLogoPreview] = useState(null);
//   const [uploadingLogo, setUploadingLogo] = useState(false);

//   const handleLogoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (!file.type.startsWith("image/")) {
//         onError("Please select an image file");
//         return;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         onError("File size must be less than 5MB");
//         return;
//       }
//       setLogoFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => setLogoPreview(reader.result);
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleLogoUpload = async () => {
//     if (!logoFile) {
//       onError("Please select a logo file");
//       return;
//     }

//     setUploadingLogo(true);

//     try {
//       const API_URL =
//         import.meta.env.VITE_API_URL;
//       const userId = localStorage.getItem("userId");
//       const token = getToken();

//       const formData = new FormData();
//       formData.append("logo", logoFile);

//       const response = await fetch(`${API_URL}/users/upload-logo/${userId}`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       const data = await response.json();

//       if (data.success) {
//         setLogoFile(null);
//         setLogoPreview(null);
//         onUploadSuccess();
//       } else {
//         onError(data.error || "Failed to upload logo");
//       }
//     } catch (err) {
//       console.error("Logo upload error:", err);
//       onError("An error occurred while uploading logo");
//     } finally {
//       setUploadingLogo(false);
//     }
//   };

//   return (
//     <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8">
//       <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
//         Company Logo
//       </h3>

//       <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
//         {/* Logo Preview */}
//         <div className="flex-shrink-0 w-full md:w-auto">
//           <div className="w-full max-w-[200px] h-48 sm:w-48 sm:h-48 mx-auto md:mx-0 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
//             {logoPreview ? (
//               <img
//                 src={logoPreview}
//                 alt="Logo preview"
//                 className="w-full h-full object-contain"
//               />
//             ) : userInfo.company?.logo ? (
//               <img
//                 src={`${apiBaseUrl}${userInfo.company.logo}`}
//                 alt="Company logo"
//                 className="w-full h-full object-contain"
//               />
//             ) : (
//               <div className="text-center text-gray-400">
//                 <Image className="w-16 h-16 mx-auto mb-2" />
//                 <p className="text-sm">No logo uploaded</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Upload Controls */}
//         <div className="flex-1 w-full">
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Upload New Logo
//               </label>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handleLogoChange}
//                 className="block w-full text-xs sm:text-sm text-gray-500
//                   file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4
//                   file:rounded-lg file:border-0
//                   file:text-xs sm:file:text-sm file:font-semibold
//                   file:bg-[#ffbe2a] file:text-black
//                   hover:file:bg-[#ffa500]
//                   cursor-pointer"
//               />
//               <p className="mt-2 text-xs sm:text-sm text-gray-500">
//                 Accepted formats: JPG, PNG, GIF, WebP (Max 5MB)
//               </p>
//             </div>

//             {logoFile && (
//               <div className="flex flex-col sm:flex-row gap-3">
//                 <button
//                   onClick={handleLogoUpload}
//                   disabled={uploadingLogo}
//                   className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#ffbe2a] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
//                 >
//                   <Upload className="w-4 h-4" />
//                   {uploadingLogo ? "Uploading..." : "Upload Logo"}
//                 </button>
//                 <button
//                   onClick={() => {
//                     setLogoFile(null);
//                     setLogoPreview(null);
//                   }}
//                   disabled={uploadingLogo}
//                   className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50 text-sm"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CompanyLogoUpload;

import React, { useState } from "react";
import { Upload, Image, Building } from "lucide-react";
import { getToken } from '../../utils/tabToken';

const CompanyLogoUpload = ({ userInfo, apiBaseUrl, onUploadSuccess, onError }) => {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        onError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onError("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      onError("Please select a logo file");
      return;
    }

    setUploadingLogo(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const userId = localStorage.getItem("userId");
      const token = getToken();

      const formData = new FormData();
      formData.append("logo", logoFile);

      const response = await fetch(`${API_URL}/users/upload-logo/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setLogoFile(null);
        setLogoPreview(null);
        onUploadSuccess();
      } else {
        onError(data.error || "Failed to upload logo");
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      onError("An error occurred while uploading logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#fff3d6] flex items-center justify-center">
          <Building className="w-5 h-5 text-[#ffbe2a]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Company Logo</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
        <div className="flex-shrink-0 w-full md:w-auto">
          <div className="w-full max-w-[200px] h-48 sm:w-48 sm:h-48 mx-auto md:mx-0 border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
            ) : userInfo.company?.logo ? (
              <img src={`${apiBaseUrl}${userInfo.company.logo}`} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-gray-400">
                <Image className="w-16 h-16 mx-auto mb-2" />
                <p className="text-sm">No logo uploaded</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload New Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-xs sm:text-sm text-gray-500
                  file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4
                  file:rounded-lg file:border-0
                  file:text-xs sm:file:text-sm file:font-semibold
                  file:bg-[#ffbe2a] file:text-black
                  hover:file:bg-[#ffa500]
                  cursor-pointer"
              />
              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                Accepted formats: JPG, PNG, GIF, WebP (Max 5MB)
              </p>
            </div>

            {logoFile && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#ffbe2a] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </button>
                <button
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  disabled={uploadingLogo}
                  className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogoUpload;
