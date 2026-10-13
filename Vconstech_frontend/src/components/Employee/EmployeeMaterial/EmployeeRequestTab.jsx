import { CheckCircle, XCircle, Clock, Eye, Pencil, Filter, Search, X, FileText, Image, File, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getTodayDateInputValue } from '../../../utils/formValidation';

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  window.location.origin;

const resolveFileUrl = (file) => {
  const rawUrl = typeof file === 'string' ? file : file?.url || file?.fileUrl || '';
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `${BACKEND_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
};

const EmployeeRequestTab = ({ requests, onUpdateRequest }) => {
  const [activeTab, setActiveTab] = useState('GLOBAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFiles, setEditFiles] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' }
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredRequests = requests.filter(r => {
    const matchesTab =
      activeTab === 'GLOBAL'
        ? r.type === 'GLOBAL'
        : r.type === 'PROJECT' || r.type === 'PROJECT_MATERIAL';

    const matchesSearch =
      !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.projectName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

    return matchesTab && matchesSearch && matchesStatus;
  });

  const openView = (request) => setViewModal(request);
  const closeView = () => setViewModal(null);

  const openEdit = (request) => {
    setEditForm({
      name: request.name || '',
      vendor: request.vendor || '',
      defaultRate: request.defaultRate || '',
      quantity: request.quantity || '',
      unit: request.unit || '',
      dueDate: request.dueDate ? request.dueDate.split('T')[0] : '',
      description: request.description || '',
      projectName: request.projectName || '',
    });
    setEditFiles([]);
    setEditModal(request);
  };
  const closeEdit = () => {
    setEditModal(null);
    setEditFiles([]);
  };

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setEditFiles(prev => [...prev, ...newFiles]);
    // Reset input so same file can be re-selected if removed
    e.target.value = '';
  };

  const handleEditSubmit = async () => {
  if (onUpdateRequest) {
    const formData = new FormData();

    //  Always include the id
    formData.append('id', editModal.id);

    Object.entries(editForm).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        formData.append(key, val);
      }
    });

    editFiles.forEach(file => formData.append('files', file));
    await onUpdateRequest(editModal, formData);
  }
  closeEdit();
};

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText;
    return File;
  };

  const isImage = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value || '-'}</span>
    </div>
  );

  const InputField = ({ label, name, type = 'text', value, onChange, disabled, min }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        min={min}
        className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'bg-white border-gray-200 text-gray-800'
        }`}
      />
    </div>
  );

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Material Requests</h3>

        {/* Toggle + Search + Filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold border transition-all ${
              activeTab === 'GLOBAL'
                ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300 hover:text-gray-900'
            }`}
          >
            Global Material
          </button>
          <button
            onClick={() => setActiveTab('PROJECT')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold border transition-all ${
              activeTab === 'PROJECT'
                ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300 hover:text-gray-900'
            }`}
          >
            Project-Specific Material
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 w-48"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm transition-colors ${
                  filterStatus !== 'ALL'
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                {filterStatus === 'ALL' ? 'Filters' : statusOptions.find(o => o.value === filterStatus)?.label}
                {filterStatus !== 'ALL' && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setFilterStatus('ALL'); setFilterOpen(false); }}
                    className="ml-1 text-yellow-500 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <p className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</p>
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilterStatus(opt.value); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        filterStatus === opt.value
                          ? 'bg-yellow-50 text-yellow-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Material Name</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Vendor</th>
                  {activeTab === 'PROJECT' && (
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Project</th>
                  )}
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Due Date</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-50 hover:bg-yellow-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-900">{request.name || '-'}</td>
                    <td className="py-3 px-3 text-gray-800">{request.vendor || '-'}</td>
                    {activeTab === 'PROJECT' && (
                      <td className="py-3 px-3 text-gray-800">{request.projectName || '-'}</td>
                    )}
                    <td className="py-3 px-3 text-gray-800">Rs.{request.defaultRate}</td>
                    <td className="py-3 px-3 text-gray-800">{request.quantity} {request.unit}</td>
                    <td className="py-3 px-3 text-gray-800">
                      {request.dueDate ? new Date(request.dueDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="py-3 px-3 text-gray-800">{request.description || '-'}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(request.status)}
                        {request.adminComment && request.status === 'PENDING' && (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            Comment Has comment
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openView(request)} className="text-gray-400 hover:text-blue-500 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(request)}
                          disabled={request.status !== 'PENDING'}
                          className={`transition-colors ${request.status === 'PENDING' ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-200 cursor-not-allowed'}`}
                          title={request.status === 'PENDING' ? 'Edit Request' : 'Cannot edit - already reviewed'}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* -----------------------------------------
          VIEW MODAL
      ----------------------------------------- */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Request Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">{viewModal.name}</p>
              </div>
              <button onClick={closeView} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(viewModal.status)}
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                  {viewModal.type === 'GLOBAL' ? 'Global Material' : 'Project-Specific'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Material Name" value={viewModal.name} />
                <DetailRow label="Vendor" value={viewModal.vendor} />
                <DetailRow label="Price" value={viewModal.defaultRate ? `Rs.${viewModal.defaultRate} / ${viewModal.unit}` : null} />
                <DetailRow label="Quantity" value={viewModal.quantity ? `${viewModal.quantity} ${viewModal.unit}` : null} />
                <DetailRow
                  label="Due Date"
                  value={viewModal.dueDate ? new Date(viewModal.dueDate).toLocaleDateString('en-IN') : null}
                />
                <DetailRow
                  label="Requested On"
                  value={viewModal.requestDate ? new Date(viewModal.requestDate).toLocaleDateString('en-IN') : null}
                />
                {viewModal.projectName && (
                  <DetailRow label="Project" value={viewModal.projectName} />
                )}
                {viewModal.reviewDate && (
                  <DetailRow
                    label="Reviewed On"
                    value={new Date(viewModal.reviewDate).toLocaleDateString('en-IN')}
                  />
                )}
              </div>

              {viewModal.description && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Description / Reason</p>
                  <p className="text-sm text-gray-700">{viewModal.description}</p>
                </div>
              )}

              {viewModal.rejectionReason && (
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{viewModal.rejectionReason}</p>
                </div>
              )}

              {viewModal.approvalNotes && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-green-500 uppercase tracking-wide font-semibold mb-1">Approval Notes</p>
                  <p className="text-sm text-green-700">{viewModal.approvalNotes}</p>
                </div>
              )}

              {/* Admin Comment */}
              {viewModal.adminComment && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold mb-1">
                    Comment Admin Comment
                  </p>
                  <p className="text-sm text-amber-800">{viewModal.adminComment}</p>
                  {viewModal.status === 'PENDING' && (
                    <p className="text-xs text-amber-500 mt-2 italic">
                      Please edit your request and re-upload the quotation if needed.
                    </p>
                  )}
                </div>
              )}

              {viewModal.files && viewModal.files.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
                    Uploaded Files ({viewModal.files.length})
                  </p>

                  {viewModal.files.some(f => isImage(f.name || f.fileName)) && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {viewModal.files
                        .filter(f => isImage(f.name || f.fileName))
                        .map((file, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                            <img
                              src={resolveFileUrl(file)}
                              alt={file.name || file.fileName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <a href={resolveFileUrl(file)} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 bg-white rounded-full text-gray-700 hover:text-blue-500 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                              <a href={resolveFileUrl(file)} download={file.name || file.fileName}
                                className="p-1.5 bg-white rounded-full text-gray-700 hover:text-yellow-500 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {viewModal.files
                    .filter(f => !isImage(f.name || f.fileName))
                    .map((file, idx) => {
                      const FileIcon = getFileIcon(file.name || file.fileName);
                      const fileName = file.name || file.fileName || `File ${idx + 1}`;
                      const fileSize = file.size
                        ? file.size > 1024 * 1024
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(file.size / 1024).toFixed(1)} KB`
                        : null;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all group mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-yellow-100 transition-colors">
                              <FileIcon className="w-4 h-4 text-gray-500 group-hover:text-yellow-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
                              {fileSize && <p className="text-xs text-gray-400">{fileSize}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <a href={resolveFileUrl(file)} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Eye className="w-4 h-4" />
                            </a>
                            <a href={resolveFileUrl(file)} download={fileName}
                              className="p-1.5 rounded-md text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {(!viewModal.files || viewModal.files.length === 0) && (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <File className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">No files uploaded for this request</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
              <button onClick={closeView} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------
          EDIT MODAL
           FIX: file upload is now INSIDE the
          scrollable flex-1 body, not outside it
      ----------------------------------------- */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4">
          {/*  The modal is a flex column: header (shrink-0) | body (flex-1 scroll) | footer (shrink-0) */}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

            {/* Header - fixed, never scrolls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Edit Request</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editModal.name}</p>
                {/* Show admin comment banner inside header if present */}
                {editModal.adminComment && (
                  <div className="mt-2 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                    <span className="text-amber-500 text-xs mt-0.5">Comment</span>
                    <p className="text-xs text-amber-700 leading-snug">{editModal.adminComment}</p>
                  </div>
                )}
              </div>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-700 transition-colors ml-3 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/*  Body - scrollable, contains EVERYTHING including file upload */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Material Name" name="name" value={editForm.name} onChange={handleEditChange} />
                <InputField label="Vendor" name="vendor" value={editForm.vendor} onChange={handleEditChange} />
                <InputField label="Price (Rs.)" name="defaultRate" type="number" value={editForm.defaultRate} onChange={handleEditChange} />
                <InputField label="Quantity" name="quantity" type="number" value={editForm.quantity} onChange={handleEditChange} />
                <InputField label="Unit" name="unit" value={editForm.unit} onChange={handleEditChange} />
                <InputField label="Due Date" name="dueDate" type="date" value={editForm.dueDate} onChange={handleEditChange} min={getTodayDateInputValue()} />
                {editModal.type !== 'GLOBAL' && (
                  <div className="col-span-2">
                    <InputField label="Project" name="projectName" value={editForm.projectName} onChange={handleEditChange} disabled />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Description / Reason</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={3}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none"
                />
              </div>

              {/*  File upload - now INSIDE the scrollable body so it renders and works correctly */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Upload Revised Quotation
                </label>

                {/* Drop zone */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <File className="w-6 h-6 text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400">Click to upload PDF, JPG, PNG</span>
                  <span className="text-xs text-gray-300 mt-0.5">Max 10MB per file</span>
                </label>

                {/* Selected files list */}
                {editFiles.length > 0 && (
                  <div className="space-y-1">
                    {editFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-yellow-600 shrink-0" />
                          <span className="text-xs text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {file.size > 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(file.size / 1024).toFixed(1)} KB`}
                          </span>
                        </div>
                        <button
                          onClick={() => setEditFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>{/* end scrollable body */}

            {/* Footer - fixed at bottom, never scrolls */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={closeEdit}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRequestTab;
