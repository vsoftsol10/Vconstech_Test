import React from "react";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  window.location.origin;

const resolveFileUrl = (file) => {
  const rawUrl = typeof file === "string" ? file : file?.url || file?.fileUrl || "";
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `${BACKEND_BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
};

const ViewModal = ({
  isOpen,
  viewRequest,
  onClose,
  onAccept,
  onReject,
  onCommand,
  getRequestDescription,
}) => {
  if (!isOpen || !viewRequest) return null;

  const files = viewRequest.files || [];
  const hasFiles = files.length > 0;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-sm shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Request Review</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pb-2">

          {/* Section 1: Request By + Status */}
          <div className="bg-white mx-3 rounded-2xl px-4 py-3 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Request by :</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {viewRequest.employee?.name || viewRequest.assignedTo || "—"}
                </p>
              </div>
              <span
                className={`text-sm font-bold px-5 py-1.5 rounded-lg ${
                  viewRequest.status === "APPROVED"
                    ? "bg-green-400 text-white"
                    : viewRequest.status === "REJECTED"
                    ? "bg-red-400 text-white"
                    : "bg-yellow-400 text-white"
                }`}
              >
                {viewRequest.status === "PENDING"
                  ? "Pending"
                  : viewRequest.status === "APPROVED"
                  ? "Approved"
                  : "Rejected"}
              </span>
            </div>
            <hr className="border-gray-200 mb-3" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="10" cy="7" r="4" />
                  <path d="M3 19c0-3.866 3.134-7 7-7s7 3.134 7 7" />
                </svg>
                <span className="text-gray-600">Vendor :</span>
                <span className="text-gray-900">{viewRequest.vendor || viewRequest.vendorName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
                  <path d="M10 6v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-gray-600">Status :</span>
                <span className="text-gray-900">
                  {viewRequest.status === "PENDING"
                    ? "Pending"
                    : viewRequest.status === "APPROVED"
                    ? "Approved"
                    : "Rejected"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="14" height="13" rx="2" />
                  <path d="M3 9h14M7 3v3M13 3v3" strokeLinecap="round" />
                </svg>
                <span className="text-gray-600">Due Date :</span>
                <span className="text-gray-900">
                  {viewRequest.dueDate
                    ? new Date(viewRequest.dueDate).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Material Details */}
          <div className="bg-white mx-3 rounded-2xl px-4 py-3 mb-3">
            <p className="text-sm font-bold text-gray-900 mb-2">Material Details</p>
            <hr className="border-gray-200 mb-3" />
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-600 w-24 flex-shrink-0">Material :</span>
                <span className="text-gray-900">{viewRequest.name || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600 w-24 flex-shrink-0">Quantity :</span>
                <span className="text-gray-900">
                  {viewRequest.quantity || "—"} {viewRequest.unit || ""}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600 w-24 flex-shrink-0">Price :</span>
                <span className="text-gray-900">
                  {viewRequest.defaultRate
                    ? `₹ ${Number(viewRequest.defaultRate).toLocaleString("en-IN")}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="bg-white mx-3 rounded-2xl px-4 py-3 mb-3">
            <p className="text-sm font-bold text-gray-900 mb-1.5">Description</p>
            <p className="text-sm text-gray-500">
              {getRequestDescription(viewRequest) || "No description provided"}
            </p>
          </div>

          {/* Section: Admin Comment (shown when a comment exists) */}
{viewRequest.adminComment && (
  <div className="bg-amber-50 border border-amber-200 mx-3 rounded-2xl px-4 py-3 mb-3">
    <div className="flex items-center gap-2 mb-1.5">
      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
      <p className="text-sm font-bold text-amber-700">Admin Comment</p>
    </div>
    <p className="text-sm text-amber-800">{viewRequest.adminComment}</p>
  </div>
)}

          {/* Section 4: Documents */}
          <div className="bg-white mx-3 rounded-2xl px-4 py-3 mb-3">
            <p className="text-sm font-bold text-gray-900 mb-2">Documents</p>
            <hr className="border-gray-200 mb-3" />

              {hasFiles ? (
              <div className="flex flex-col gap-2">
                {files.map((file, idx) => {
                  const fileName = file.name || file.fileName || `Document ${idx + 1}`;
                  const fileUrl = resolveFileUrl(file);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{fileName}</span>
                      </div>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 ml-3 px-4 py-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-lg transition-colors"
                      >
                        View
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                No documents were uploaded
              </div>
            )}
          </div>

          {/* Section 5: Add a comment (always visible) */}
          <div className="bg-white mx-3 rounded-2xl px-4 py-3 mb-3">
            <button
              onClick={onCommand}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Add a comment
            </button>
          </div>

        </div>

        {/* Footer Buttons */}
        {viewRequest.status === "PENDING" && (
          <div className="flex gap-2 px-3 py-4 shrink-0 border-t border-gray-200 bg-gray-100">
            <button
              onClick={() => onAccept(viewRequest.id)}
              className="flex-1 py-2.5 bg-green-200 text-green-800 text-sm font-bold rounded-lg hover:bg-green-300 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onReject(viewRequest.id)}
              className="flex-1 py-2.5 bg-red-200 text-red-800 text-sm font-bold rounded-lg hover:bg-red-300 transition-colors"
            >
              Reject
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewModal;
