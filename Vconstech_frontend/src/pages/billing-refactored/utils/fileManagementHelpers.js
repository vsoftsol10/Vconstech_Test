// ─── Shared helpers used by FileManagement.jsx and UploadFilesModal.jsx ───

export const getFileExtension = (file) =>
  (file?.fileName || file?.filename || file?.name || "").split(".").pop()?.toLowerCase() || "";

export const getFileIcon = (file) => {
  const ext = getFileExtension(file);
  const iconMap = {
    pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
    ppt: "📙", pptx: "📙",
    jpg: "🖼️", jpeg: "🖼️", png: "🖼️", dwg: "📐", dxf: "📐",
  };
  return iconMap[ext] || "📎";
};

export const getMimeType = (file) => {
  const ext = getFileExtension(file);
  const mimeMap = {
    pdf: "application/pdf",
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png", gif: "image/gif", webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimeMap[ext] || "application/octet-stream";
};

export const isImageFile  = (file) => ["jpg", "jpeg", "png", "gif", "webp"].includes(getFileExtension(file));
export const isPdfFile    = (file) => getFileExtension(file) === "pdf";
export const isOfficeFile = (file) => ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(getFileExtension(file));

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Maps a file extension to a visual "type" badge, matching the reference design
export const FILE_TYPE_META = {
  pdf:  { label: "PDF",        badge: "bg-red-100 text-red-600" },
  doc:  { label: "Word",       badge: "bg-blue-100 text-blue-600" },
  docx: { label: "Word",       badge: "bg-blue-100 text-blue-600" },
  xls:  { label: "Excel",      badge: "bg-green-100 text-green-600" },
  xlsx: { label: "Excel",      badge: "bg-green-100 text-green-600" },
  ppt:  { label: "PowerPoint", badge: "bg-orange-100 text-orange-600" },
  pptx: { label: "PowerPoint", badge: "bg-orange-100 text-orange-600" },
  jpg:  { label: "Image",      badge: "bg-purple-100 text-purple-600" },
  jpeg: { label: "Image",      badge: "bg-purple-100 text-purple-600" },
  png:  { label: "Image",      badge: "bg-purple-100 text-purple-600" },
  dwg:  { label: "CAD",        badge: "bg-slate-100 text-slate-600" },
  dxf:  { label: "CAD",        badge: "bg-slate-100 text-slate-600" },
};
export const getFileTypeMeta = (file) =>
  FILE_TYPE_META[getFileExtension(file)] || { label: "File", badge: "bg-gray-100 text-gray-600" };

// Buckets a file into one of the tab categories shown in the reference design
export const getFileTabCategory = (file) => {
  const ext = getFileExtension(file);
  if (ext === "pdf") return "pdfs";
  if (["doc", "docx"].includes(ext)) return "documents";
  if (["xls", "xlsx"].includes(ext)) return "spreadsheets";
  if (["ppt", "pptx"].includes(ext)) return "presentations";
  return "other";
};

// Maps a file to the filter categories required by the Filter dropdown
export const getFileCategory = (file) => {
  const ext = getFileExtension(file);
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["dwg", "dxf"].includes(ext)) return "cad";
  if (["zip", "rar", "7z"].includes(ext)) return "zip";
  return "other";
};

export const FILTER_OPTIONS = [
  { key: "",      label: "All Files" },
  { key: "pdf",   label: "PDF" },
  { key: "word",  label: "Word" },
  { key: "excel", label: "Excel" },
  { key: "image", label: "Image" },
  { key: "cad",   label: "CAD" },
  { key: "zip",   label: "ZIP" },
  { key: "other", label: "Other" },
];

// Card accent colors cycled across project cards on the landing grid
export const CARD_ACCENTS = [
  "bg-emerald-100 text-emerald-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-slate-100 text-slate-600",
  "bg-amber-100 text-amber-600",
];

export const TABS = [
  { key: "all", label: "All" },
  { key: "folders", label: "Folders" },
  { key: "documents", label: "Documents" },
  { key: "spreadsheets", label: "Spreadsheets" },
  { key: "presentations", label: "Presentations" },
  { key: "pdfs", label: "PDFs" },
];

export const DOCUMENT_TYPES = ["Contract", "Invoice", "Blueprint", "Report", "Certificate", "Permit", "Drawing", "Specification", "Other"];
