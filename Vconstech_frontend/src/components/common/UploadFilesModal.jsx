// import { useState, useEffect, useRef } from "react";
// import {
//   Upload,
//   X,
//   FolderOpen,
//   Trash2,
//   Loader,
//   CheckCircle2,
//   XCircle,
// } from "lucide-react";
// import { getAuthToken } from "../../utils/auth";
// import { getFileExtension, getFileTypeMeta, DOCUMENT_TYPES } from "../../pages/billing-refactored/utils/fileManagementHelpers";

// // ─── Upload Files Modal ─────────────────────────────────────────────────────
// // Self-contained: owns its own form state, progress state, and upload logic.
// // Talks to the parent only via props (selectedProject, apiBaseUrl, callbacks).

// // How many files upload at the same time. 4-6 is a good balance: fast, but
// // doesn't flood the browser/server with dozens of simultaneous connections.
// const MAX_CONCURRENT_UPLOADS = 5;

// const UploadFilesModal = ({
//   selectedProject,
//   apiBaseUrl,
//   selectedFolderId,
//   selectedFolderName,
//   onClose,
//   onUploadSuccess,
//   showSuccessMessage,
//   showErrorMessage,
// }) => {
//   const [fileFormData, setFileFormData] = useState({ documentType: "", files: [] });
//   const [uploadProgress, setUploadProgress] = useState({}); // { [index]: { percent, status: 'uploading'|'done'|'failed' } }
//   const [isUploading, setIsUploading] = useState(false);

//   const folderInputRef = useRef(null);

//   useEffect(() => {
//     if (folderInputRef.current) {
//       folderInputRef.current.setAttribute("webkitdirectory", "");
//       folderInputRef.current.setAttribute("directory", "");
//     }
//   }, []);

//   // Appends newly selected files (from either Browse Files or Browse Folder) to the list
//   const handleFileChange = (e) => {
//     const newFiles = Array.from(e.target.files || []);
//     if (newFiles.length === 0) return;
//     setFileFormData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
//     e.target.value = ""; // allow re-selecting the same file/folder again if removed
//   };

//   const handleFileInputChange = (e) => {
//     const { name, value } = e.target;
//     setFileFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleRemoveSelectedFile = (index) => {
//     setFileFormData((prev) => ({
//       ...prev,
//       files: prev.files.filter((_, i) => i !== index),
//     }));
//     setUploadProgress((prev) => {
//       const next = { ...prev };
//       delete next[index];
//       return next;
//     });
//   };

//   // Uploads a single file via XHR (instead of fetch) so we can report real progress,
//   // while hitting the exact same endpoint/body/auth as before.
//   // If a folder is currently open/selected on the Files page, its id is attached
//   // as a `folderId` field so the backend files it into that folder.
//   const uploadSingleFileWithProgress = (singleFile, index) =>
//     new Promise((resolve, reject) => {
//       const token = getAuthToken();
//       if (!token) { reject(new Error("No authentication token found.")); return; }

//       const formData = new FormData();
//       formData.append("file", singleFile);
//       if (fileFormData.documentType) formData.append("documentType", fileFormData.documentType);
//       if (selectedFolderId) formData.append("folderId", selectedFolderId);

//       const xhr = new XMLHttpRequest();
//       xhr.open("POST", `${apiBaseUrl}/projects/${selectedProject.id}/files`);
//       xhr.setRequestHeader("Authorization", `Bearer ${token}`);

//       xhr.upload.onprogress = (event) => {
//         if (!event.lengthComputable) return;
//         const percent = Math.round((event.loaded / event.total) * 100);
//         setUploadProgress((prev) => ({
//           ...prev,
//           [index]: { percent, status: "uploading" },
//         }));
//       };

//       xhr.onload = () => {
//         let data = {};
//         try { data = JSON.parse(xhr.responseText || "{}"); } catch { /* ignore parse errors */ }
//         if (xhr.status >= 200 && xhr.status < 300) {
//           setUploadProgress((prev) => ({ ...prev, [index]: { percent: 100, status: "done" } }));
//           resolve(data);
//         } else {
//           setUploadProgress((prev) => ({ ...prev, [index]: { percent: prev[index]?.percent || 0, status: "failed" } }));
//           reject(new Error(data.error || `Failed to upload ${singleFile.name}`));
//         }
//       };

//       xhr.onerror = () => {
//         setUploadProgress((prev) => ({ ...prev, [index]: { percent: prev[index]?.percent || 0, status: "failed" } }));
//         reject(new Error(`Network error while uploading ${singleFile.name}`));
//       };

//       xhr.send(formData);
//     });

//   // Runs uploads with a bounded concurrency instead of one strictly after another.
//   // Keeps up to MAX_CONCURRENT_UPLOADS requests in flight at once; as soon as one
//   // finishes (success or failure), the next queued file starts immediately.
//   const uploadAllWithConcurrency = async (files) => {
//     let nextIndex = 0;
//     let failedCount = 0;

//     const worker = async () => {
//       while (nextIndex < files.length) {
//         const currentIndex = nextIndex;
//         nextIndex += 1;
//         try {
//           await uploadSingleFileWithProgress(files[currentIndex], currentIndex);
//         } catch {
//           failedCount += 1;
//         }
//       }
//     };

//     const workerCount = Math.min(MAX_CONCURRENT_UPLOADS, files.length);
//     await Promise.all(Array.from({ length: workerCount }, () => worker()));

//     return failedCount;
//   };

//   const handleAddFile = async () => {
//     if (!fileFormData.files || fileFormData.files.length === 0) {
//       showErrorMessage("Please select a file to upload!");
//       return;
//     }
//     setIsUploading(true);
//     setUploadProgress({});

//     const failedCount = await uploadAllWithConcurrency(fileFormData.files);

//     setIsUploading(false);

//     if (failedCount === 0) {
//       showSuccessMessage("File(s) uploaded successfully!");
//       setFileFormData({ documentType: "", files: [] });
//       setUploadProgress({});
//       onClose();
//     } else {
//       showErrorMessage(`${failedCount} file(s) failed to upload. You can remove them and try again.`);
//     }

//     await onUploadSuccess();
//   };

//   const handleCancelFile = () => {
//     if (isUploading) return; // avoid closing mid-upload
//     setFileFormData({ documentType: "", files: [] });
//     setUploadProgress({});
//     onClose();
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4"
//       onClick={(e) => { if (e.target === e.currentTarget) handleCancelFile(); }}
//     >
//       <div className="relative bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

//         {/* Header */}
//         <div className="flex items-start justify-between p-5 md:p-6 border-b border-[#E5E7EB] flex-shrink-0">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-2xl bg-[#FFF6E0] flex items-center justify-center flex-shrink-0">
//               <Upload size={22} className="text-[#FFBE2A]" />
//             </div>
//             <div>
//               <h3 className="text-lg font-bold text-[#1F2937]">Upload Files</h3>
//               <p className="text-sm text-gray-500 mt-0.5">
//                 Upload files for the selected project.
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={handleCancelFile}
//             disabled={isUploading}
//             className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#1F2937] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         {/* Body (scrolls internally; header/footer stay pinned) */}
//         <div className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1">

//           {/* Existing project info (+ target folder, if one is open) */}
//           {selectedProject?.name && (
//             <div className="flex items-center gap-2 text-sm text-gray-500">
//               <FolderOpen size={15} className="text-[#FFBE2A]" />
//               <span>
//                 Uploading to <span className="font-semibold text-[#1F2937]">{selectedProject.name}</span>
//                 {selectedFolderName && (
//                   <>
//                     {" "}/ <span className="font-semibold text-[#1F2937]">{selectedFolderName}</span>
//                   </>
//                 )}
//               </span>
//             </div>
//           )}

//           {/* Document type */}
//           <div>
//             <label className="block text-sm font-medium text-[#1F2937] mb-2">
//               Document Type
//             </label>
//             <select
//               name="documentType"
//               value={fileFormData.documentType}
//               onChange={handleFileInputChange}
//               disabled={isUploading}
//               className="w-full px-4 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBE2A] bg-white text-[#1F2937] shadow-sm transition-colors disabled:opacity-60"
//             >
//               <option value="">Select document type</option>
//               {DOCUMENT_TYPES.map((type) => (
//                 <option key={type} value={type}>{type}</option>
//               ))}
//             </select>
//           </div>

//           {/* Upload area */}
//           <div>
//             <label className="block text-sm font-medium text-[#1F2937] mb-2">
//               Attach Files
//             </label>
//             <div className="border-2 border-dashed border-[#FFBE2A]/50 rounded-2xl p-8 md:p-10 text-center bg-[#FFF6E0]/50 hover:bg-[#FFF6E0] transition-colors">
//               <input
//                 type="file"
//                 id="file-upload"
//                 multiple
//                 onChange={handleFileChange}
//                 className="hidden"
//                 accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
//                 disabled={isUploading}
//               />
//               <input
//                 type="file"
//                 id="folder-upload"
//                 multiple
//                 ref={folderInputRef}
//                 onChange={handleFileChange}
//                 className="hidden"
//                 disabled={isUploading}
//               />
//               <div className="w-14 h-14 rounded-2xl bg-[#FFF1C6] flex items-center justify-center mx-auto mb-3">
//                 <Upload size={26} className="text-[#B8860B]" />
//               </div>
//               <p className="text-sm font-semibold text-[#1F2937] mb-1">
//                 Drag &amp; drop your files here
//               </p>
//               <p className="text-xs text-gray-500 mb-4">or</p>
//               <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
//                 <label
//                   htmlFor="file-upload"
//                   className={`inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#1F2937] font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors ${
//                     isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
//                   }`}
//                 >
//                   <FolderOpen size={16} /> Browse Files
//                 </label>
//                 <label
//                   htmlFor="folder-upload"
//                   className={`inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#1F2937] font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors ${
//                     isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
//                   }`}
//                 >
//                   <FolderOpen size={16} /> Browse Folder
//                 </label>
//               </div>
//               <p className="text-xs text-gray-400 mt-4">
//                 PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF supported
//               </p>
//               {fileFormData.files.length > 0 && (
//                 <p className="text-xs text-gray-400 mt-1">
//                   Uploads run {MAX_CONCURRENT_UPLOADS} at a time for speed
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Selected files list */}
//           {fileFormData.files.length > 0 && (
//             <div>
//               <p className="text-sm font-medium text-[#1F2937] mb-2">
//                 Selected Files ({fileFormData.files.length})
//               </p>
//               <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
//                 {fileFormData.files.map((f, index) => {
//                   const progress = uploadProgress[index];
//                   return (
//                     <div
//                       key={`${f.name}-${f.lastModified}-${index}`}
//                       className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-shadow"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase ${
//                             getFileTypeMeta({ fileName: f.name }).badge
//                           }`}
//                         >
//                           {getFileExtension({ fileName: f.name }) || "file"}
//                         </div>
//                         <div className="min-w-0 flex-1">
//                           <p className="text-sm font-medium text-[#1F2937] truncate">{f.name}</p>
//                           <p className="text-xs text-gray-500">
//                             {getFileTypeMeta({ fileName: f.name }).label}
//                             {f.size ? ` • ${(f.size / (1024 * 1024)).toFixed(2)} MB` : ""}
//                           </p>
//                         </div>

//                         {!progress && (
//                           <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
//                             <CheckCircle2 size={12} /> Ready
//                           </span>
//                         )}
//                         {progress?.status === "done" && (
//                           <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
//                             <CheckCircle2 size={12} /> Uploaded
//                           </span>
//                         )}
//                         {progress?.status === "failed" && (
//                           <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0">
//                             <XCircle size={12} /> Failed
//                           </span>
//                         )}
//                         {progress?.status === "uploading" && (
//                           <span className="text-xs font-medium text-gray-500 flex-shrink-0">
//                             {progress.percent}%
//                           </span>
//                         )}

//                         <button
//                           onClick={() => handleRemoveSelectedFile(index)}
//                           disabled={isUploading}
//                           className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
//                           title="Remove file"
//                         >
//                           <Trash2 size={15} />
//                         </button>
//                       </div>

//                       {/* Per-file progress bar (shown only while uploading/after attempt) */}
//                       {progress && (
//                         <div className="mt-2.5 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                           <div
//                             className={`h-full rounded-full transition-all duration-200 ${
//                               progress.status === "failed" ? "bg-red-400" : "bg-[#FFBE2A]"
//                             }`}
//                             style={{ width: `${progress.percent}%` }}
//                           />
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-end gap-3 px-5 md:px-6 py-4 border-t border-[#E5E7EB] bg-gray-50/60 flex-shrink-0">
//           <button
//             onClick={handleCancelFile}
//             disabled={isUploading}
//             className="font-semibold text-sm py-2.5 px-5 rounded-xl border border-[#E5E7EB] text-[#1F2937] bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleAddFile}
//             disabled={isUploading || fileFormData.files.length === 0}
//             className="flex items-center gap-2 bg-[#FFBE2A] hover:bg-[#F0AE1A] text-black font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
//             {isUploading
//               ? "Uploading..."
//               : fileFormData.files.length > 1
//                 ? `Upload ${fileFormData.files.length} Files`
//                 : "Upload File"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UploadFilesModal;

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  X,
  FolderOpen,
  Trash2,
  Loader,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getAuthToken } from "../../utils/auth";
import { getFileExtension, getFileTypeMeta, DOCUMENT_TYPES } from "../../pages/billing-refactored/utils/fileManagementHelpers";
import { focusFirstInvalidField, validateFields } from "../../utils/formValidation";

// ─── Upload Files Modal ─────────────────────────────────────────────────────
// Self-contained: owns its own form state, progress state, and upload logic.
// Talks to the parent only via props (selectedProject, apiBaseUrl, callbacks).

// How many files upload at the same time. 4-6 is a good balance: fast, but
// doesn't flood the browser/server with dozens of simultaneous connections.
const MAX_CONCURRENT_UPLOADS = 1;

const UploadFilesModal = ({
  selectedProject,
  apiBaseUrl,
  selectedFolderId,
  selectedFolderName,
  folders,
  onClose,
  onUploadSuccess,
  showSuccessMessage,
  showErrorMessage,
}) => {
  const [fileFormData, setFileFormData] = useState({ documentType: "", files: [] });
  const [uploadProgress, setUploadProgress] = useState({}); // { [index]: { percent, status: 'uploading'|'done'|'failed' } }
  const [isUploading, setIsUploading] = useState(false);
  const [preparingFolders, setPreparingFolders] = useState(false);
  const [folderSkipNote, setFolderSkipNote] = useState("");
  const [currentUploadIndex, setCurrentUploadIndex] = useState(null);
  const [completedUploadSummary, setCompletedUploadSummary] = useState(null);
  const isUploadComplete = completedUploadSummary?.failed === 0;
  const uploadedCount = Object.values(uploadProgress).filter((progress) => progress.status === "done").length;
  const currentUploadingFile = currentUploadIndex !== null ? fileFormData.files[currentUploadIndex] : null;
  const failedFiles = fileFormData.files
    .map((file, index) => ({ file, progress: uploadProgress[index] }))
    .filter(({ progress }) => progress?.status === "failed");
  const activeUploadCount = Math.min(
    fileFormData.files.length,
    uploadedCount + failedFiles.length + (currentUploadIndex !== null ? 1 : 0)
  );
  const uploadPercent = fileFormData.files.length > 0
    ? Math.round(
        fileFormData.files.reduce((sum, _file, index) => sum + (uploadProgress[index]?.percent || 0), 0) /
        fileFormData.files.length
      )
    : 0;

  const folderInputRef = useRef(null);

  // Common junk/dependency directories we never want to upload if they happen
  // to be nested inside a picked folder (e.g. a code project folder).
  const IGNORED_FOLDER_SEGMENTS = new Set([
    "node_modules", ".git", ".next", "dist", "build", "coverage", ".cache", "vendor",
  ]);

  const getFileSignature = (file) => `${file.webkitRelativePath || ""}::${file.name}::${file.size}::${file.lastModified}`;

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
  }, []);

  // Appends newly selected files (from either Browse Files or Browse Folder) to the list.
  // When files come from "Browse Folder", the browser gives each file a
  // `webkitRelativePath` like "Invoices/2026/jan.pdf". We grab the top-level
  // segment ("Invoices") and stamp it onto the File object as __uploadFolderName
  // so that, at upload time, we can create/reuse a matching project folder and
  // file every item from that picked folder into it — instead of dumping them
  // as loose files.
  const handleFileChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const isFolderPick = rawFiles.some((f) => f.webkitRelativePath);
    let newFiles = rawFiles;

    if (isFolderPick) {
      // Skip anything nested inside a junk/dependency directory (node_modules, .git, etc.)
      // so picking a whole code-project folder doesn't try to upload thousands of files.
      newFiles = rawFiles.filter((f) => {
        const segments = f.webkitRelativePath.split("/");
        return !segments.some((seg) => IGNORED_FOLDER_SEGMENTS.has(seg));
      });

      newFiles.forEach((f) => {
        const topFolder = f.webkitRelativePath.split("/")[0];
        if (topFolder) {
          try { f.__uploadFolderName = topFolder; } catch { /* File objects are extensible; ignore if not */ }
        }
      });

      const skipped = rawFiles.length - newFiles.length;
      setFolderSkipNote(
        skipped > 0
          ? `Skipped ${skipped} file(s) inside node_modules, .git, dist, build, etc.`
          : ""
      );
    }

    setFileFormData((prev) => {
      const existingFiles = new Set(prev.files.map(getFileSignature));
      const uniqueNewFiles = newFiles.filter((file) => {
        const signature = getFileSignature(file);
        if (existingFiles.has(signature)) return false;
        existingFiles.add(signature);
        return true;
      });

      if (uniqueNewFiles.length === 0) {
        return prev;
      }

      return {
        ...prev,
        files: [...prev.files, ...uniqueNewFiles],
      };
    });
    setCompletedUploadSummary(null);
    e.target.value = ""; // allow re-selecting the same file/folder again if removed
  };

  const handleFileInputChange = (e) => {
    const { name, value } = e.target;
    setFileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveSelectedFile = (index) => {
    setFileFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  // Looks at every selected file, and for any that were picked via "Browse Folder"
  // (i.e. carry __uploadFolderName), resolves a real backend folder id for that
  // folder name — reusing an existing folder with the same name if one exists in
  // this project, otherwise creating a new one. Returns an array (parallel to
  // `files`) of the folderId each file should be uploaded into. Files that were
  // picked individually (no __uploadFolderName) fall back to whatever folder is
  // currently open on the page (selectedFolderId), same as before.
  const resolveFolderIdsForFiles = async (files) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found.");

    const nameToId = {};
    (folders || []).forEach((f) => {
      if (f?.name) nameToId[f.name.trim().toLowerCase()] = f.id;
    });

    const folderIdForIndex = new Array(files.length).fill(selectedFolderId || null);

    for (let i = 0; i < files.length; i++) {
      const folderName = files[i].__uploadFolderName;
      if (!folderName) continue;
      const key = folderName.trim().toLowerCase();

      if (!nameToId[key]) {
        const response = await fetch(`${apiBaseUrl}/projects/${selectedProject.id}/folders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: folderName }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Failed to create folder "${folderName}"`);
        }
        nameToId[key] = data.folder?.id || data.id;
      }

      folderIdForIndex[i] = nameToId[key];
    }

    return folderIdForIndex;
  };

  // Uploads a single file via XHR (instead of fetch) so we can report real progress,
  // while hitting the exact same endpoint/body/auth as before.
  // `folderId` is resolved per-file beforehand: either the folder the file's
  // parent directory was matched/created to (when uploaded via "Browse Folder"),
  // or the folder currently open on the page.
  const uploadSingleFileWithProgress = (singleFile, index, folderId) =>
    new Promise((resolve, reject) => {
      const token = getAuthToken();
      if (!token) { reject(new Error("No authentication token found.")); return; }

      const formData = new FormData();
      formData.append("file", singleFile);
      if (fileFormData.documentType) formData.append("documentType", fileFormData.documentType);
      if (folderId) formData.append("folderId", folderId);

      setCurrentUploadIndex(index);
      setUploadProgress((prev) => ({
        ...prev,
        [index]: { percent: prev[index]?.percent || 0, status: "uploading" },
      }));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBaseUrl}/projects/${selectedProject.id}/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress((prev) => ({
          ...prev,
          [index]: { percent, status: "uploading" },
        }));
      };

      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText || "{}"); } catch { /* ignore parse errors */ }
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress((prev) => ({ ...prev, [index]: { percent: 100, status: "done" } }));
          resolve(data);
        } else {
          const message = data.error || `Failed to upload ${singleFile.name}`;
          setUploadProgress((prev) => ({ ...prev, [index]: { percent: prev[index]?.percent || 0, status: "failed", error: message } }));
          reject(new Error(message));
        }
      };

      xhr.onerror = () => {
        const message = `Network error while uploading ${singleFile.name}`;
        setUploadProgress((prev) => ({ ...prev, [index]: { percent: prev[index]?.percent || 0, status: "failed", error: message } }));
        reject(new Error(message));
      };

      xhr.send(formData);
    });

  // Runs uploads with a bounded concurrency instead of one strictly after another.
  // Keeps up to MAX_CONCURRENT_UPLOADS requests in flight at once; as soon as one
  // finishes (success or failure), the next queued file starts immediately.
  const uploadAllWithConcurrency = async (files, folderIdForIndex) => {
    let nextIndex = 0;
    const failedUploads = [];

    const worker = async () => {
      while (nextIndex < files.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        try {
          await uploadSingleFileWithProgress(files[currentIndex], currentIndex, folderIdForIndex[currentIndex]);
        } catch (error) {
          failedUploads.push({
            index: currentIndex,
            name: files[currentIndex].name,
            message: error.message || "Upload failed",
          });
        }
      }
    };

    const workerCount = Math.min(MAX_CONCURRENT_UPLOADS, files.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return failedUploads;
  };

  const handleAddFile = async () => {
    const errors = validateFields([
      { name: 'uploadFiles', value: fileFormData.files, label: 'File', rules: ['file'] },
    ]);
    if (Object.keys(errors).length) {
      showErrorMessage(errors.uploadFiles);
      focusFirstInvalidField(errors);
      return;
    }
    setIsUploading(true);
    setCurrentUploadIndex(null);
    setUploadProgress({});
    setCompletedUploadSummary(null);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    let folderIdForIndex;
    try {
      setPreparingFolders(true);
      folderIdForIndex = await resolveFolderIdsForFiles(fileFormData.files);
    } catch (e) {
      setPreparingFolders(false);
      setIsUploading(false);
      showErrorMessage("Failed to prepare folder(s): " + e.message);
      return;
    }
    setPreparingFolders(false);

    const failedUploads = await uploadAllWithConcurrency(fileFormData.files, folderIdForIndex);
    const failedCount = failedUploads.length;

    setIsUploading(false);
    setCurrentUploadIndex(null);

    if (failedCount === 0) {
      setFileFormData({ documentType: "", files: [] });
      setUploadProgress({});
      setFolderSkipNote("");
      setCompletedUploadSummary({
        uploaded: fileFormData.files.length,
        failed: 0,
        failedUploads: [],
      });
      showSuccessMessage("File uploaded successfully.");
    } else {
      const failedIndexSet = new Set(failedUploads.map((file) => file.index));
      const remainingFilesInOrder = fileFormData.files
        .map((file, index) => ({ file, index }))
        .filter(({ index }) => failedIndexSet.has(index));
      const nextProgress = {};

      remainingFilesInOrder.forEach(({ index: originalIndex }, newIndex) => {
        const failedUpload = failedUploads.find((entry) => entry.index === originalIndex);
        nextProgress[newIndex] = {
          percent: 100,
          status: "failed",
          error: failedUpload?.message || "Upload failed",
        };
      });

      setFileFormData({
        documentType: fileFormData.documentType,
        files: remainingFilesInOrder.map(({ file }) => file),
      });
      setUploadProgress(nextProgress);
      setCompletedUploadSummary({
        uploaded: fileFormData.files.length - failedCount,
        failed: failedCount,
        failedUploads,
      });
      showErrorMessage(
        `${failedCount} file(s) failed to upload: ${failedUploads
          .map((file) => `${file.name} (${file.message})`)
          .join("; ")}`
      );
    }

    await onUploadSuccess();
  };

  const handleCancelFile = () => {
    if (isUploading) return; // avoid closing mid-upload
    setFileFormData({ documentType: "", files: [] });
    setUploadProgress({});
    setCurrentUploadIndex(null);
    setCompletedUploadSummary(null);
    setFolderSkipNote("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancelFile(); }}
    >
      <div className="relative bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-[#E5E7EB] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF6E0] flex items-center justify-center flex-shrink-0">
              <Upload size={22} className="text-[#FFBE2A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2937]">Upload Files</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Upload files for the selected project.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelFile}
            disabled={isUploading}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#1F2937] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body (scrolls internally; header/footer stay pinned) */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1">

          {/* Existing project info (+ target folder, if one is open) */}
          {selectedProject?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FolderOpen size={15} className="text-[#FFBE2A]" />
              <span>
                Uploading to <span className="font-semibold text-[#1F2937]">{selectedProject.name}</span>
                {selectedFolderName && (
                  <>
                    {" "}/ <span className="font-semibold text-[#1F2937]">{selectedFolderName}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Document type */}
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Document Type
            </label>
            <select
              name="documentType"
              value={fileFormData.documentType}
              onChange={handleFileInputChange}
              disabled={isUploading || isUploadComplete}
              className="w-full px-4 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBE2A] bg-white text-[#1F2937] shadow-sm transition-colors disabled:opacity-60"
            >
              <option value="">Select document type</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Upload area */}
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Attach Files
            </label>
            <div className="border-2 border-dashed border-[#FFBE2A]/50 rounded-2xl p-8 md:p-10 text-center bg-[#FFF6E0]/50 hover:bg-[#FFF6E0] transition-colors">
              <input
                name="uploadFiles"
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
                disabled={isUploading || isUploadComplete}
              />
              <input
                type="file"
                id="folder-upload"
                multiple
                ref={folderInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading || isUploadComplete}
              />
              <div className="w-14 h-14 rounded-2xl bg-[#FFF1C6] flex items-center justify-center mx-auto mb-3">
                <Upload size={26} className="text-[#B8860B]" />
              </div>
              <p className="text-sm font-semibold text-[#1F2937] mb-1">
                Drag &amp; drop your files here
              </p>
              <p className="text-xs text-gray-500 mb-4">or</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#1F2937] font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors ${
                    isUploading || isUploadComplete ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                  }`}
                >
                  <FolderOpen size={16} /> Browse Files
                </label>
                <label
                  htmlFor="folder-upload"
                  className={`inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#1F2937] font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors ${
                    isUploading || isUploadComplete ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                  }`}
                >
                  <FolderOpen size={16} /> Browse Folder
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF supported
              </p>
              {fileFormData.files.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Uploads run {MAX_CONCURRENT_UPLOADS} at a time
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                "Browse Folder" recreates the picked folder as a project folder and files everything into it.
              </p>
              {(isUploading || completedUploadSummary) && (
                <div className="mt-4 rounded-xl border border-[#FFBE2A]/40 bg-white px-4 py-3 text-left shadow-sm">
                  {isUploading ? (
                    <>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
                        <Loader size={15} className="animate-spin text-[#B8860B]" />
                        <span>{preparingFolders ? "Preparing folder(s)..." : "Uploading files..."}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Uploading {activeUploadCount} of {fileFormData.files.length} files
                      </p>
                      {currentUploadingFile && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500">Current file</p>
                          <p className="text-sm font-semibold text-[#1F2937] truncate">{currentUploadingFile.name}</p>
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{uploadPercent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#FFBE2A] transition-all duration-200"
                            style={{ width: `${uploadPercent}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">Please don't close this window.</p>
                    </>
                  ) : (
                    isUploadComplete ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <CheckCircle2 size={15} />
                        <span>File uploaded successfully.</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                          <XCircle size={15} />
                          <span>Upload completed with some errors.</span>
                        </div>
                        <>
                          <p className="text-xs font-semibold text-gray-700 mt-2">Uploaded : {completedUploadSummary.uploaded} files</p>
                          <p className="text-xs font-semibold text-gray-700 mt-1">Failed : {completedUploadSummary.failed} files</p>
                          {completedUploadSummary.failedUploads.length > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              {completedUploadSummary.failedUploads.map((file) => file.name).join(", ")}
                            </p>
                          )}
                        </>
                      </>
                    )
                  )}
                </div>
              )}
              {folderSkipNote && (
                <p className="text-xs text-amber-600 mt-2 font-medium">{folderSkipNote}</p>
              )}
            </div>
          </div>

          {/* Selected files list */}
          {fileFormData.files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#1F2937] mb-2">
                Selected Files ({fileFormData.files.length})
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {fileFormData.files.map((f, index) => {
                  const progress = uploadProgress[index];
                  return (
                    <div
                      key={`${f.name}-${f.lastModified}-${index}`}
                      className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase ${
                            getFileTypeMeta({ fileName: f.name }).badge
                          }`}
                        >
                          {getFileExtension({ fileName: f.name }) || "file"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1F2937] truncate">{f.name}</p>
                          <p className="text-xs text-gray-500">
                            {getFileTypeMeta({ fileName: f.name }).label}
                            {f.size ? ` • ${(f.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                            {f.__uploadFolderName ? ` • → ${f.__uploadFolderName}` : ""}
                          </p>
                        </div>

                        {!progress && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
                            <CheckCircle2 size={12} /> Ready
                          </span>
                        )}
                        {progress?.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
                            <CheckCircle2 size={12} /> Uploaded
                          </span>
                        )}
                        {progress?.status === "failed" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0">
                            <XCircle size={12} /> Failed
                          </span>
                        )}
                        {progress?.status === "uploading" && (
                          <span className="text-xs font-medium text-gray-500 flex-shrink-0">
                            {progress.percent}%
                          </span>
                        )}

                        <button
                          onClick={() => handleRemoveSelectedFile(index)}
                          disabled={isUploading || isUploadComplete}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Remove file"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Per-file progress bar (shown only while uploading/after attempt) */}
                      {progress && (
                        <div className="mt-2.5 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              progress.status === "failed" ? "bg-red-400" : "bg-[#FFBE2A]"
                            }`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      )}
                      {progress?.status === "failed" && progress.error && (
                        <p className="mt-1.5 text-xs text-red-600">{progress.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 md:px-6 py-4 border-t border-[#E5E7EB] bg-gray-50/60 flex-shrink-0">
          {isUploadComplete ? (
            <button
              onClick={handleCancelFile}
              className="font-semibold text-sm py-2.5 px-5 rounded-xl border border-[#E5E7EB] text-[#1F2937] bg-white hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelFile}
                disabled={isUploading}
                className="font-semibold text-sm py-2.5 px-5 rounded-xl border border-[#E5E7EB] text-[#1F2937] bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFile}
                disabled={isUploading || fileFormData.files.length === 0}
                className="flex items-center gap-2 bg-[#FFBE2A] hover:bg-[#F0AE1A] text-black font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                {preparingFolders
                  ? "Preparing folder(s)..."
                  : isUploading
                    ? "Uploading..."
                    : fileFormData.files.length > 1
                      ? `Upload ${fileFormData.files.length} Files`
                      : "Upload File"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadFilesModal;

