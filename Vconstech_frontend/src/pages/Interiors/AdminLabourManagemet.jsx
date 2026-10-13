import { showToast } from '../../components/common/Toast';
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, X, IndianRupee, User, Phone, MapPin, Calendar, ClipboardCheck,
  Edit2, Eye, Trash2, Briefcase, FolderOpen, Search,
  ChevronLeft, ChevronRight, MoreVertical, Upload, Home, ChevronRight as ChevronRightIcon,
  Filter
} from 'lucide-react'
import labourApi from '../../api/labourAPI'
import { projectAPI } from '../../api/projectAPI'
import Navbar from '../../components/common/Navbar'
import SidePannel from '../../components/common/SidePannel'
import LoadingScreen from '../../components/common/Loadingscreen'
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/common/Pagination'
import { focusFirstInvalidField, validateFields } from '../../utils/formValidation'


/* ── Avatar colours by initial ── */
const avatarColors = [
  'bg-blue-200 text-blue-700', 'bg-purple-200 text-purple-700',
  'bg-green-200 text-green-700', 'bg-red-200 text-red-700',
  'bg-orange-200 text-orange-700', 'bg-teal-200 text-teal-700',
  'bg-pink-200 text-pink-700', 'bg-indigo-200 text-indigo-700',
]
const getAvatarColor = (name = '') =>
  avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length]

const LABOUR_UPLOAD_ERROR_MESSAGE = 'Only Excel (.xlsx) files are allowed. Please use the official template.'
const LABOUR_TEMPLATE_FILENAME = 'labour-list-template.xlsx'
const LABOUR_TEMPLATE_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/* ── Row action dropdown (rendered via portal so table overflow/scroll never clips it) ── */
const RowMenu = ({ labour, onView, onAddPayment, onHistory, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      // Keep the last rows' menus inside the viewport.  The menu is rendered
      // in a portal, so using fixed viewport coordinates also avoids table
      // overflow from clipping it.
      const menuWidth = 176
      const menuHeight = 248
      const gap = 4
      const opensUpward = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight
      setCoords({
        top: opensUpward ? rect.top - menuHeight - gap : rect.bottom + gap,
        left: Math.max(gap, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - gap)),
      })
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnScroll)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnScroll)
    }
  }, [])

  const action = (fn) => { fn(); setOpen(false) }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
      >
        <MoreVertical size={18} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          className="bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] w-44 py-1 text-sm"
        >
          <button onClick={() => action(() => onView(labour))}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700">
            <Eye size={15} className="text-gray-400" /> View Payments
          </button>
          <button onClick={() => action(() => onAddPayment(labour))}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700">
            <IndianRupee size={15} className="text-green-500" /> Add Payment
          </button>
          <button onClick={() => action(() => onHistory(labour))}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700">
            <ClipboardCheck size={15} className="text-blue-500" /> Labour Entry History
          </button>
          <button onClick={() => action(() => onEdit(labour))}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700">
            <Edit2 size={15} className="text-yellow-500" /> Edit
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button onClick={() => action(() => onDelete(labour.id))}
            className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-2.5 text-red-600">
            <Trash2 size={15} /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

/* ── PROJECT column header filter dropdown (rendered via portal, same clipping fix as RowMenu) ── */
const ProjectHeaderFilter = ({ projects, selectedProjectFilter, onSelect }) => {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnScroll)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnScroll)
    }
  }, [])

  const selectedProjectName = projects.find(p => String(p.id) === String(selectedProjectFilter))?.name

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className="flex items-center gap-1.5 text-xs font-bold text-black tracking-wider hover:opacity-70 transition-opacity"
      >
        PROJECT
        <Filter size={12} className={selectedProjectFilter ? 'fill-black' : ''} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'absolute', top: coords.top, left: coords.left }}
          className="bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] w-52 py-1 text-sm max-h-72 overflow-y-auto"
        >
          <button
            onClick={() => { onSelect(''); setOpen(false) }}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 ${
              !selectedProjectFilter ? 'bg-yellow-50 text-black font-semibold' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <FolderOpen size={15} className="text-gray-400" /> All Projects
          </button>
          <div className="my-1 border-t border-gray-100" />
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => { onSelect(String(proj.id)); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 truncate ${
                String(selectedProjectFilter) === String(proj.id) ? 'bg-yellow-50 text-black font-semibold' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FolderOpen size={15} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{proj.name}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

const AdminLabourManagement = () => {
  const [labourers, setLabourers] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showViewPaymentsModal, setShowViewPaymentsModal] = useState(false)
  const [showLabourEntryForm, setShowLabourEntryForm] = useState(false)
  const [showEntryHistoryModal, setShowEntryHistoryModal] = useState(false)
  const [entryHistory, setEntryHistory] = useState([])
  const [entryHistoryLoading, setEntryHistoryLoading] = useState(false)
  const [labourEntry, setLabourEntry] = useState({ labourId: '', projectId: '', attendanceDate: new Date().toISOString().split('T')[0], headWage: '', headDayType: 'FULL_DAY', fullHelpers: 0, halfHelpers: 0, helperRate: '', notes: '' })
  const [selectedLabour, setSelectedLabour] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE)
  const [isUploadingLabourList, setIsUploadingLabourList] = useState(false)
  const [showLabourUploadModal, setShowLabourUploadModal] = useState(false)
  const [selectedLabourFile, setSelectedLabourFile] = useState(null)
  const labourListInputRef = useRef(null)

  const [newLabour, setNewLabour] = useState({ name: '', phone: '', address: '', designation: '', project: '', projectId: null })
  const [editLabour, setEditLabour] = useState({ id: null, name: '', phone: '', address: '', designation: '', project: '', projectId: null })
  const [labourErrors, setLabourErrors] = useState({})
  const [editLabourErrors, setEditLabourErrors] = useState({})
  const [payment, setPayment] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  /* ── Data fetchers (unchanged) ── */
  const fetchLabourers = async () => {
    try {
      setLoading(true)
      const data = await labourApi.getAllLabourers()
      if (data.success) setLabourers(data.data)
    } catch (error) {
      console.error('Failed to fetch labourers:', error)
      showToast('Failed to load labourers: ' + error.message, 'error')
    } finally { setLoading(false) }
  }

  const fetchProjects = async () => {
    try {
      const data = await projectAPI.getProjects()
      if (data.projects) setProjects(data.projects)
    } catch (error) { console.error('Failed to fetch projects:', error) }
  }

  useEffect(() => { document.title = "Vconstech - Admin" }, [])
  useEffect(() => { fetchLabourers(); fetchProjects() }, [])

  /* ── Handlers (unchanged) ── */
  const handleAddLabour = async () => {
    const errors = validateFields([
      { name: 'labourName', value: newLabour.name, label: 'Name', rules: ['lettersSpacesName'] },
      { name: 'labourPhone', value: newLabour.phone, label: 'Phone number', rules: ['mobile'] },
      { name: 'labourDesignation', value: newLabour.designation, label: 'Designation', rules: ['designation'] },
      { name: 'labourProject', value: newLabour.projectId || newLabour.project, label: 'Assigned project', rules: ['dropdown'] },
      { name: 'labourAddress', value: newLabour.address, label: 'Address', rules: ['textareaMin5'] },
    ])
    setLabourErrors(errors)
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors)
      return
    }

    try {
      const data = await labourApi.createLabourer(newLabour)
      if (data.success) {
        await fetchLabourers()
        setNewLabour({ name: '', phone: '', address: '', designation: '', project: '', projectId: null })
        setLabourErrors({})
        setShowAddForm(false)
        showToast('Labourer added successfully!', 'success')
      }
    } catch (error) { showToast('Failed to add labourer: ' + error.message, 'error') }
  }

  const handleLabourFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileName = file.name?.toLowerCase() || ''
    const isValidExcelFile =
      fileName.endsWith('.xlsx') || file.type === LABOUR_TEMPLATE_MIME_TYPE

    if (!isValidExcelFile) {
      showToast(LABOUR_UPLOAD_ERROR_MESSAGE, 'error')
      event.target.value = ''
      return
    }

    setSelectedLabourFile(file)
  }

  const handleUploadLabourList = async () => {
    if (!selectedLabourFile) {
      showToast('Please choose an Excel file before importing.', 'warning')
      return
    }

    try {
      setIsUploadingLabourList(true)
      const data = await labourApi.uploadLabourList(selectedLabourFile)
      await fetchLabourers()
      showToast(data.message || 'Labour list uploaded successfully!', 'success')
    } catch (error) {
      showToast('Failed to upload labour list: ' + error.message, 'error')
    } finally {
      setIsUploadingLabourList(false)
      setShowLabourUploadModal(false)
      setSelectedLabourFile(null)
      if (labourListInputRef.current) {
        labourListInputRef.current.value = ''
      }
    }
  }

  const handleDownloadLabourTemplate = async () => {
    try {
      const blob = await labourApi.downloadLabourTemplate()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = LABOUR_TEMPLATE_FILENAME
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000)
    } catch (error) {
      showToast('Failed to download template: ' + error.message, 'error')
    }
  }

  const openEditForm = (labour) => {
    setEditLabour({ id: labour.id, name: labour.name, phone: labour.phone, address: labour.address || '', designation: labour.designation || '', project: labour.projectName || labour.project || '', projectId: labour.projectId || null })
    setEditLabourErrors({})
    setShowEditForm(true)
  }

  const handleUpdateLabour = async () => {
    const errors = validateFields([
      { name: 'editLabourName', value: editLabour.name, label: 'Name', rules: ['lettersSpacesName'] },
      { name: 'editLabourPhone', value: editLabour.phone, label: 'Phone number', rules: ['mobile'] },
      { name: 'editLabourDesignation', value: editLabour.designation, label: 'Designation', rules: ['designation'] },
      { name: 'editLabourProject', value: editLabour.projectId || editLabour.project, label: 'Assigned project', rules: ['dropdown'] },
      { name: 'editLabourAddress', value: editLabour.address, label: 'Address', rules: ['textareaMin5'] },
    ])
    setEditLabourErrors(errors)
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors)
      return
    }

    try {
      const data = await labourApi.updateLabourer(editLabour.id, { name: editLabour.name, phone: editLabour.phone, address: editLabour.address, designation: editLabour.designation, project: editLabour.project, projectId: editLabour.projectId })
      if (data.success) {
        await fetchLabourers()
        setEditLabour({ id: null, name: '', phone: '', address: '', designation: '', project: '', projectId: null })
        setEditLabourErrors({})
        setShowEditForm(false)
        showToast('Labourer updated successfully!', 'success')
      }
    } catch (error) { showToast('Failed to update labourer: ' + error.message, 'error') }
  }

  const handleAddPayment = async () => {
    if (!payment.amount || !selectedLabour) { showToast('Please enter a valid amount', 'warning'); return }
    try {
      const data = await labourApi.addPayment(selectedLabour.id, payment)
      if (data.success) {
        await fetchLabourers()
        setPayment({ amount: '', date: new Date().toISOString().split('T')[0] })
        setShowPaymentModal(false)
        setSelectedLabour(null)
        showToast('Payment added successfully!', 'success')
      }
    } catch (error) { showToast('Failed to add payment: ' + error.message, 'error') }
  }

  const openPaymentModal = (labour) => { setSelectedLabour(labour); setShowPaymentModal(true) }
  const openViewPaymentsModal = (labour) => { setSelectedLabour(labour); setShowViewPaymentsModal(true) }
  const openEntryHistory = async (labour) => {
    setSelectedLabour(labour); setShowEntryHistoryModal(true); setEntryHistoryLoading(true)
    try { const data = await labourApi.getLabourAttendance(labour.id); setEntryHistory(data.data || []) }
    catch (error) { setEntryHistory([]); showToast('Failed to load labour entry history: ' + error.message, 'error') }
    finally { setEntryHistoryLoading(false) }
  }
  const entryLabourers = labourEntry.projectId ? labourers.filter((labour) => String(labour.projectId || '') === String(labourEntry.projectId)) : []
  const saveLabourEntry = async (entryStatus) => {
    if (!labourEntry.labourId || !labourEntry.projectId || !labourEntry.headWage || !labourEntry.helperRate) {
      showToast('Please complete all required labour entry fields', 'error'); return
    }
    try {
      const data = await labourApi.saveAttendance({ ...labourEntry, entryStatus })
      if (data.success) {
        setShowLabourEntryForm(false)
        setLabourEntry({ labourId: '', projectId: '', attendanceDate: new Date().toISOString().split('T')[0], headWage: '', headDayType: 'FULL_DAY', fullHelpers: 0, halfHelpers: 0, helperRate: '', notes: '' })
        showToast(entryStatus === 'DRAFT' ? 'Labour entry saved as draft' : 'Labour entry submitted to admin', 'success')
      }
    } catch (error) { showToast('Failed to save labour entry: ' + error.message, 'error') }
  }

  const deleteLabour = async (id) => {
    if (window.confirm('Are you sure you want to delete this labourer? This will also delete all their payment records.')) {
      try {
        const data = await labourApi.deleteLabourer(id)
        if (data.success) { await fetchLabourers(); showToast('Labourer deleted successfully!', 'success') }
      } catch (error) { showToast('Failed to delete labourer: ' + error.message, 'error') }
    }
  }

  const getPaymentCount = (labour) => labour.payments ? labour.payments.length : 0

  /* ── Filter ── */
  const filteredLabourers = labourers.filter(labour => {
    const matchesSearch = !searchTerm ||
      labour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labour.phone.includes(searchTerm) ||
      (labour.designation && labour.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (labour.projectName && labour.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (labour.address && labour.address.toLowerCase().includes(searchTerm.toLowerCase()))
    const selectedProject = projects.find(p => p.id == selectedProjectFilter)
    const matchesProject = !selectedProjectFilter ||
      String(labour.projectId) === String(selectedProjectFilter) ||
      (selectedProject && (selectedProject.name === labour.projectName || selectedProject.name === labour.project))
    return matchesSearch && matchesProject
  })

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filteredLabourers.length / rowsPerPage))
  const paginatedLabourers = filteredLabourers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const startEntry = filteredLabourers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const endEntry = Math.min(currentPage * rowsPerPage, filteredLabourers.length)

  /* ── Form fields (unchanged logic, refreshed UI) ── */
  const renderLabourFields = (formState, setFormState, errors = {}, fieldPrefix = 'labour') => {
    const clearError = (fieldName) => {
      if (fieldPrefix === 'editLabour') {
        setEditLabourErrors((prev) => ({ ...prev, [fieldName]: '' }))
      } else {
        setLabourErrors((prev) => ({ ...prev, [fieldName]: '' }))
      }
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              name={`${fieldPrefix}Name`}
              type="text"
              value={formState.name}
              onChange={(e) => { setFormState({ ...formState, name: e.target.value }); clearError(`${fieldPrefix}Name`) }}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors[`${fieldPrefix}Name`] ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Enter name"
            />
          </div>
          {errors[`${fieldPrefix}Name`] && <p className="text-red-500 text-xs mt-1">{errors[`${fieldPrefix}Name`]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              name={`${fieldPrefix}Phone`}
              type="tel"
              value={formState.phone}
              onChange={(e) => { setFormState({ ...formState, phone: e.target.value }); clearError(`${fieldPrefix}Phone`) }}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors[`${fieldPrefix}Phone`] ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Enter phone number"
            />
          </div>
          {errors[`${fieldPrefix}Phone`] && <p className="text-red-500 text-xs mt-1">{errors[`${fieldPrefix}Phone`]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              name={`${fieldPrefix}Designation`}
              type="text"
              value={formState.designation}
              onChange={(e) => { setFormState({ ...formState, designation: e.target.value }); clearError(`${fieldPrefix}Designation`) }}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors[`${fieldPrefix}Designation`] ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="e.g. Mason, Electrician, Helper"
            />
          </div>
          {errors[`${fieldPrefix}Designation`] && <p className="text-red-500 text-xs mt-1">{errors[`${fieldPrefix}Designation`]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Project *</label>
          <div className="relative">
            <FolderOpen className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
            <select
              name={`${fieldPrefix}Project`}
              value={formState.project}
              onChange={(e) => {
                const p = projects.find(p => p.name === e.target.value)
                setFormState({ ...formState, project: e.target.value, projectId: p ? p.id : null })
                clearError(`${fieldPrefix}Project`)
              }}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none ${errors[`${fieldPrefix}Project`] ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value="">Select a project</option>
              {projects.map(proj => <option key={proj.id} value={proj.name}>{proj.name}</option>)}
            </select>
          </div>
          {errors[`${fieldPrefix}Project`] && <p className="text-red-500 text-xs mt-1">{errors[`${fieldPrefix}Project`]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <textarea
              name={`${fieldPrefix}Address`}
              value={formState.address}
              onChange={(e) => { setFormState({ ...formState, address: e.target.value }); clearError(`${fieldPrefix}Address`) }}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors[`${fieldPrefix}Address`] ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Enter address"
              rows="3"
            />
          </div>
          {errors[`${fieldPrefix}Address`] && <p className="text-red-500 text-xs mt-1">{errors[`${fieldPrefix}Address`]}</p>}
        </div>
      </div>
    )
  }

  if (loading) return <LoadingScreen message="Loading labour data..." />

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="pt-20 md:pl-64 md:pt-25">
        <div className="px-4 md:px-8 pt-4 pb-24 md:pb-10 max-w-7xl mx-auto">

          {/* ── Breadcrumb ── */}
          {/* <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Home size={14} />
            <span>Home</span>
            <ChevronRightIcon size={14} />
            <span className="text-gray-800 font-medium">Labour Management</span>
          </div> */}

          {/* ── Page header ── */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Labour Management</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLabourEntryForm(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-semibold transition-colors">
                <ClipboardCheck size={16} /> Labour Entry
              </button>
              <button onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-800 text-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                <Plus size={16} /> Add Labour
              </button>
              <button
                onClick={() => setShowLabourUploadModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-semibold transition-colors"
              >
                <Upload size={16} /> Upload Labour List
              </button>
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone number, designation, project..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* ── Table card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {filteredLabourers.length === 0 ? (
              <div className="py-20 text-center">
                <User className="mx-auto text-gray-300 mb-4" size={56} />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {labourers.length === 0 ? 'No Labourers Yet' : 'No results found'}
                </h3>
                <p className="text-sm text-gray-400 mb-5">
                  {labourers.length === 0 ? 'Add your first labourer to get started' : 'Try adjusting your search or filter'}
                </p>
                {labourers.length === 0 && (
                  <button onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 bg-yellow-400 text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-500 transition-colors">
                    <Plus size={16} /> Add First Labour
                  </button>
                )}
                {labourers.length > 0 && selectedProjectFilter && (
                  <button onClick={() => setSelectedProjectFilter('')}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    Clear Project Filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-yellow-400">
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">S.NO</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">NAME</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">PHONE NUMBER</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">DESIGNATION</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">
                          <ProjectHeaderFilter
                            projects={projects}
                            selectedProjectFilter={selectedProjectFilter}
                            onSelect={(val) => { setSelectedProjectFilter(val); setCurrentPage(1) }}
                          />
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">ADDRESS</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-black tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedLabourers.map((labour, index) => (
                        <tr key={labour.id} className="hover:bg-gray-50 transition-colors">
                          {/* S.No */}
                          <td className="px-5 py-4 text-sm text-gray-500 font-medium">
                            {(currentPage - 1) * rowsPerPage + index + 1}
                          </td>
                          {/* Name + avatar */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold overflow-hidden ${getAvatarColor(labour.name)}`}>
                                {labour.profileImage
                                  ? <img src={labour.profileImage} alt={labour.name} className="w-full h-full object-cover rounded-full" />
                                  : labour.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                }
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{labour.name}</span>
                            </div>
                          </td>
                          {/* Phone */}
                          <td className="px-5 py-4 text-sm text-gray-700">{labour.phone}</td>
                          {/* Designation */}
                          <td className="px-5 py-4 text-sm text-gray-700">{labour.designation || 'N/A'}</td>
                          {/* Project */}
                          <td className="px-5 py-4 text-sm text-gray-700">{labour.project || labour.projectName || 'N/A'}</td>
                          {/* Address */}
                          <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px] truncate">{labour.address || 'N/A'}</td>
                          {/* Actions */}
                          <td className="px-5 py-4">
                            <RowMenu
                              labour={labour}
                              onView={openViewPaymentsModal}
                              onAddPayment={openPaymentModal}
                              onHistory={openEntryHistory}
                              onEdit={openEditForm}
                              onDelete={deleteLabour}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {paginatedLabourers.map((labour, index) => (
                    <div key={labour.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${getAvatarColor(labour.name)}`}>
                            {labour.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{labour.name}</p>
                            <p className="text-xs text-gray-500">{labour.designation || 'N/A'}</p>
                          </div>
                        </div>
                        <RowMenu labour={labour} onView={openViewPaymentsModal} onAddPayment={openPaymentModal} onHistory={openEntryHistory} onEdit={openEditForm} onDelete={deleteLabour} />
                      </div>
                      <div className="space-y-1 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400" />{labour.phone}</div>
                        <div className="flex items-center gap-2"><FolderOpen size={12} className="text-gray-400" />{labour.project || labour.projectName || 'N/A'}</div>
                        {labour.address && <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-400" />{labour.address}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Pagination footer ── */}
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredLabourers.length}
                  pageSize={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setRowsPerPage}
                />
                {false && <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {filteredLabourers.length === 0
                      ? 'No entries'
                      : `Showing ${startEntry} to ${endEntry} of ${filteredLabourers.length} entries`}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    {getPaginationItems(currentPage, totalPages).map((item, i) =>
                      item === '...'
                        ? <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">…</span>
                        : <button key={item} onClick={() => setCurrentPage(item)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === item ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:bg-gray-100'}`}>
                            {item}
                          </button>
                    )}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Labour Modal ── */}
      {/* Labour Upload Modal */}
      {showLabourUploadModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Import Labour</h2>
                <p className="text-sm text-gray-500 mt-1">Import multiple labour records using the official Excel template.</p>
              </div>
              <button
                onClick={() => {
                  setShowLabourUploadModal(false)
                  setSelectedLabourFile(null)
                  if (labourListInputRef.current) labourListInputRef.current.value = ''
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-700">Supported File</p>
                <p className="text-sm text-gray-600">Excel (.xlsx)</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-700">Maximum File Size</p>
                <p className="text-sm text-gray-600">5 MB</p>
              </div>

              <input
                ref={labourListInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleLabourFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadLabourTemplate}
                  className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Download Template
                </button>
                <button
                  onClick={() => labourListInputRef.current?.click()}
                  className="px-4 py-2.5 border-2 border-gray-800 text-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Choose Excel File
                </button>
                {selectedLabourFile && <span className="text-sm text-gray-600 break-all">{selectedLabourFile.name}</span>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowLabourUploadModal(false)
                  setSelectedLabourFile(null)
                  if (labourListInputRef.current) labourListInputRef.current.value = ''
                }}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadLabourList}
                disabled={!selectedLabourFile || isUploadingLabourList}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUploadingLabourList ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Labour</h2>
              <button onClick={() => { setShowAddForm(false); setLabourErrors({}) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button>
            </div>
            <div className="p-6">
              {renderLabourFields(newLabour, setNewLabour, labourErrors, 'labour')}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAddForm(false); setLabourErrors({}) }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleAddLabour}
                  className="flex-1 px-4 py-2.5 bg-yellow-400 text-black rounded-xl text-sm font-semibold hover:bg-yellow-500 transition">Add Labour</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Labour Modal ── */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Labour Details</h2>
              <button onClick={() => { setShowEditForm(false); setEditLabourErrors({}) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button>
            </div>
            <div className="p-6">
              {renderLabourFields(editLabour, setEditLabour, editLabourErrors, 'editLabour')}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowEditForm(false); setEditLabourErrors({}) }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleUpdateLabour}
                  className="flex-1 px-4 py-2.5 bg-yellow-400 text-black rounded-xl text-sm font-semibold hover:bg-yellow-500 transition">Update Labour</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Payment Modal ── */}
      {showPaymentModal && selectedLabour && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
              <button onClick={() => { setShowPaymentModal(false); setSelectedLabour(null) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Labour Name</p>
                <p className="font-semibold text-gray-900">{selectedLabour.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="number" min="0" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Enter amount" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="date" value={payment.date} onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowPaymentModal(false); setSelectedLabour(null) }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleAddPayment}
                  className="flex-1 px-4 py-2.5 bg-yellow-400 text-black rounded-xl text-sm font-semibold hover:bg-yellow-500 transition">Add Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Payments Modal ── */}
      {showViewPaymentsModal && selectedLabour && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                <p className="text-sm text-gray-500 mt-0.5">{selectedLabour.name}</p>
              </div>
              <button onClick={() => { setShowViewPaymentsModal(false); setSelectedLabour(null) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col flex-1 overflow-hidden">
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Total Amount Paid</p>
                <p className="text-3xl font-bold text-green-600 flex items-center gap-1">
                  <IndianRupee size={22} />{selectedLabour.totalPaid?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPaymentCount(selectedLabour)} payment{getPaymentCount(selectedLabour) !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {!selectedLabour.payments || selectedLabour.payments.length === 0 ? (
                  <div className="text-center py-10">
                    <IndianRupee className="mx-auto text-gray-300 mb-2" size={40} />
                    <p className="text-gray-500 text-sm">No payments recorded yet</p>
                  </div>
                ) : selectedLabour.payments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 p-2 rounded-lg"><Calendar size={16} className="text-yellow-600" /></div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(p.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 flex items-center gap-0.5 text-sm">
                      <IndianRupee size={14} />{p.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowViewPaymentsModal(false); setSelectedLabour(null) }}
                className="mt-4 w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {showEntryHistoryModal && selectedLabour && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-900">Labour Entry History</h2><p className="text-sm text-gray-500 mt-0.5">#{selectedLabour.id} — {selectedLabour.name}</p></div><button onClick={() => { setShowEntryHistoryModal(false); setSelectedLabour(null); setEntryHistory([]) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button></div>
            <div className="p-6 overflow-y-auto">
              {entryHistoryLoading ? <p className="text-center text-gray-500 py-10">Loading labour entries…</p> : entryHistory.length === 0 ? <p className="text-center text-gray-500 py-10">No labour entries recorded yet</p> : (
                <div className="border border-gray-200 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-yellow-50"><tr><th className="px-4 py-3 text-left whitespace-nowrap">Date</th><th className="px-4 py-3 text-left whitespace-nowrap">Day Type</th><th className="px-4 py-3 text-center whitespace-nowrap">Full Helpers</th><th className="px-4 py-3 text-center whitespace-nowrap">Half Helpers</th><th className="px-4 py-3 text-right whitespace-nowrap">Head Salary</th><th className="px-4 py-3 text-right whitespace-nowrap">1 Helper Salary</th><th className="px-4 py-3 text-left whitespace-nowrap">Status</th><th className="px-4 py-3 text-right whitespace-nowrap">Total</th></tr></thead><tbody className="divide-y divide-gray-100">{entryHistory.map((entry) => { const head = entry.headDayType === 'HALF_DAY' ? Number(entry.headWage || 0) * .5 : Number(entry.headWage || 0); return <tr key={entry.id}><td className="px-4 py-3">{new Date(entry.attendanceDate).toLocaleDateString('en-IN')}</td><td className="px-4 py-3">{entry.headDayType === 'HALF_DAY' ? 'Half Day' : 'Full Day'}</td><td className="px-4 py-3 text-center">{entry.fullHelpers || 0}</td><td className="px-4 py-3 text-center">{entry.halfHelpers || 0}</td><td className="px-4 py-3 text-right">₹{head.toLocaleString('en-IN')}</td><td className="px-4 py-3 text-right">₹{Number(entry.helperRate || 0).toLocaleString('en-IN')}</td><td className="px-4 py-3">{entry.entryStatus === 'SUBMITTED' ? 'Submitted' : 'Draft'}</td><td className="px-4 py-3 text-right font-semibold">₹{Number(entry.totalAmount || 0).toLocaleString('en-IN')}</td></tr> })}</tbody></table></div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLabourEntryForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3"><div><h2 className="text-lg font-bold text-gray-900">New Labour Entry</h2><p className="text-xs text-gray-500 mt-0.5">Add labour work details for the selected project and date</p></div><button onClick={() => setShowLabourEntryForm(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button></div>
            <div className="space-y-2">
              <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Work Details</h3><div className="grid grid-cols-2 gap-2"><label className="text-xs">Date *<input type="date" value={labourEntry.attendanceDate} onChange={(e) => setLabourEntry((v) => ({ ...v, attendanceDate: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><label className="text-xs">Project *<select value={labourEntry.projectId} onChange={(e) => setLabourEntry((v) => ({ ...v, projectId: e.target.value, labourId: '' }))} className="mt-1 w-full border rounded px-2 py-1.5 bg-white"><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-xs">Labour head *<select disabled={!labourEntry.projectId} value={labourEntry.labourId} onChange={(e) => setLabourEntry((v) => ({ ...v, labourId: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5 bg-white disabled:bg-gray-100"><option value="">Select labour head</option>{entryLabourers.map((l) => <option key={l.id} value={l.id}>#{l.id} — {l.name} — {l.designation || 'No designation'}</option>)}</select></label><label className="text-xs">Designation<input readOnly value={entryLabourers.find((l) => String(l.id) === String(labourEntry.labourId))?.designation || ''} className="mt-1 w-full border rounded px-2 py-1.5 bg-gray-100" /></label></div></section>
              <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Head</h3><div className="grid grid-cols-2 gap-2"><label className="text-xs">Head wage (₹) *<input type="number" min="0" value={labourEntry.headWage} onChange={(e) => setLabourEntry((v) => ({ ...v, headWage: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><div className="text-xs">Head day type *<div className="mt-2 flex gap-3"><label><input type="radio" checked={labourEntry.headDayType === 'FULL_DAY'} onChange={() => setLabourEntry((v) => ({ ...v, headDayType: 'FULL_DAY' }))} /> Full day</label><label><input type="radio" checked={labourEntry.headDayType === 'HALF_DAY'} onChange={() => setLabourEntry((v) => ({ ...v, headDayType: 'HALF_DAY' }))} /> Half day</label></div></div></div></section>
              <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Helpers</h3><div className="grid grid-cols-3 gap-2"><label className="text-xs">Full day<input type="number" min="0" value={labourEntry.fullHelpers} onChange={(e) => setLabourEntry((v) => ({ ...v, fullHelpers: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><label className="text-xs">Half day<input type="number" min="0" value={labourEntry.halfHelpers} onChange={(e) => setLabourEntry((v) => ({ ...v, halfHelpers: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><label className="text-xs">Helper rate (₹) *<input type="number" min="0" value={labourEntry.helperRate} onChange={(e) => setLabourEntry((v) => ({ ...v, helperRate: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label></div></section>
              <section className="border border-gray-200 rounded-lg p-3 bg-gray-50"><h3 className="font-semibold text-sm mb-2">Cost Summary</h3>{(() => { const wage=Number(labourEntry.headWage)||0, rate=Number(labourEntry.helperRate)||0, full=Number(labourEntry.fullHelpers)||0, half=Number(labourEntry.halfHelpers)||0, head=labourEntry.headDayType==='HALF_DAY'?wage*.5:wage, total=head+full*rate+half*rate*.5; return <div className="text-xs space-y-1"><p className="flex justify-between"><span>Head</span><span>₹{head.toLocaleString()}</span></p><p className="flex justify-between"><span>Full helpers</span><span>₹{(full*rate).toLocaleString()}</span></p><p className="flex justify-between"><span>Half helpers</span><span>₹{(half*rate*.5).toLocaleString()}</span></p><p className="flex justify-between border-t pt-2 font-bold text-sm"><span>Total</span><span>₹{total.toLocaleString()}</span></p></div> })()}</section>
              <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Notes</h3><textarea value={labourEntry.notes} onChange={(e) => setLabourEntry((v) => ({ ...v, notes: e.target.value }))} rows="2" placeholder="Optional notes" className="w-full border rounded px-2 py-1.5 text-sm resize-none" /></section>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={() => saveLabourEntry('DRAFT')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Save draft</button><button onClick={() => saveLabourEntry('SUBMITTED')} className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm font-semibold">Submit to Admin</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLabourManagement
