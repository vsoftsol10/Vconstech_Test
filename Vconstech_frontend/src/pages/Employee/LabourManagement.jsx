import { showToast } from '../../components/common/Toast';
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, IndianRupee, User, Phone, MapPin, Calendar, Loader2, Edit2, Eye, Trash2, Briefcase, FolderOpen, Search, ClipboardCheck } from 'lucide-react'
import labourApi from '../../api/labourAPI'
import { projectAPI } from '../../api/projectAPI'
import EmployeeNavbar from '../../components/Employee/EmployeeNavbar'
import { focusFirstInvalidField, validateFields } from '../../utils/formValidation'

const LabourManagement = () => {
  const [labourers, setLabourers] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [engineerProjectIds, setEngineerProjectIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showViewPaymentsModal, setShowViewPaymentsModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showEntryHistoryModal, setShowEntryHistoryModal] = useState(false)
  const [entryHistory, setEntryHistory] = useState([])
  const [entryHistoryLoading, setEntryHistoryLoading] = useState(false)
  const [paymentMenu, setPaymentMenu] = useState(null)
  const [selectedLabour, setSelectedLabour] = useState(null)

    useEffect(() => {
        document.title = "Vconstech - Engineer";
      }, []);

  // -- Get logged-in engineer from localStorage --
  const engineer = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('engineer')) || null
    } catch {
      return null
    }
  }, [])

  const getProjectAssigneeId = (project) => {
    return (
      project.assignedUserId ||
      project.assignedEngineer?.id ||
      project.assignedEngineer?.empId ||
      project.assignedEmployee ||
      project.assignedEngineerEmpId ||
      project.assignedEngineerId
    )
  }

  const getProjectId = (project) => {
    return project.id || project.dbId || project.projectId || project.project_id
  }

  const getLabourProjectId = (labour) => {
    return (
      labour.projectId ||
      labour.project?.id ||
      labour.project?.projectId ||
      labour.project?.dbId ||
      labour.project?.project_id
    )
  }

  const getLabourProjectName = (labour) => {
    return (
      labour.projectName ||
      (typeof labour.project === 'string' ? labour.project : undefined) ||
      labour.project?.name ||
      labour.project?.projectName
    )
  }

  const isProjectAssignedToEngineer = (project) => {
    if (!engineer) return false

    const assignedProjectId = getProjectAssigneeId(project)
    const engineerIds = [engineer.id, engineer.empId]

    return engineerIds.some((id) => id !== undefined && String(id) === String(assignedProjectId))
  }

  const [newLabour, setNewLabour] = useState({
    name: '', phone: '', address: '', designation: '', project: '', projectId: null
  })

  const [editLabour, setEditLabour] = useState({
    id: null, name: '', phone: '', address: '', designation: '', project: '', projectId: null
  })

  const [payment, setPayment] = useState({
    amount: '', date: new Date().toISOString().split('T')[0]
  })
  const [labourErrors, setLabourErrors] = useState({})
  const [editLabourErrors, setEditLabourErrors] = useState({})
  const [paymentErrors, setPaymentErrors] = useState({})
  const [attendance, setAttendance] = useState({
    labourId: '', projectId: '', attendanceDate: new Date().toISOString().split('T')[0], headWage: '', headDayType: 'FULL_DAY', fullHelpers: 0, halfHelpers: 0, helperRate: '', notes: ''
  })

  const fetchLabourers = async () => {
    try {
      setLoading(true)
      const data = await labourApi.getAllLabourers()
      if (data.success) {
        setLabourers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch labourers:', error)
      showToast('Failed to load labourers: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const data = await projectAPI.getProjects()
      if (data.projects) {
        setProjects(data.projects)

        const myProjects = data.projects.filter(isProjectAssignedToEngineer)
        setEngineerProjectIds(myProjects.map((p) => String(getProjectId(p))))
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  useEffect(() => {
    // Load the project assignments before showing labourers. This prevents a
    // brief, incorrect display of every company labourer before filtering.
    const loadLabourManagementData = async () => {
      setLoading(true)
      await fetchProjects()
      await fetchLabourers()
    }

    loadLabourManagementData()
  }, [])

  // -- Projects this engineer is assigned to (for dropdowns) --
  const assignedProjects = useMemo(() => {
    if (!engineer) return projects
    return projects.filter(isProjectAssignedToEngineer)
  }, [projects, engineer])

  // -- Labourers belonging to engineer's projects, filtered by search --
  const filteredLabourers = useMemo(() => {
    let list = labourers

    const assignedProjectNames = assignedProjects
      .map((project) => project.name || project.projectName || project.project?.name)
      .filter(Boolean)
      .map((name) => String(name).toLowerCase())

    // Filter by engineer's assigned projects
    if (engineerProjectIds.length > 0 || assignedProjectNames.length > 0) {
      list = list.filter((l) => {
        const labourProjectId = getLabourProjectId(l)
        const labourProjectName = getLabourProjectName(l)

        const matchesById = labourProjectId ? engineerProjectIds.includes(String(labourProjectId)) : false
        const matchesByName = labourProjectName
          ? assignedProjectNames.includes(String(labourProjectName).toLowerCase())
          : false

        return matchesById || matchesByName
      })
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.designation?.toLowerCase().includes(q) ||
          l.project?.toLowerCase().includes(q) ||
          l.address?.toLowerCase().includes(q) ||
          l.projectName?.toLowerCase().includes(q) ||
          l.project?.name?.toLowerCase().includes(q)
      )
    }

    return list
  }, [labourers, engineerProjectIds, assignedProjects, searchQuery])

  // Labour heads must belong to the chosen project. Some existing labour records
  // contain only the project name, so support both the stored ID and name.
  const entryProjectLabourers = useMemo(() => {
    const selectedProject = projects.find(
      (project) => String(getProjectId(project)) === String(attendance.projectId)
    )
    const selectedProjectName = String(
      selectedProject?.name || selectedProject?.projectName || ''
    ).toLowerCase()

    if (!attendance.projectId) return []

    return filteredLabourers.filter((labour) => {
      const matchesProjectId = String(getLabourProjectId(labour) || '') === String(attendance.projectId)
      const matchesProjectName = selectedProjectName && String(getLabourProjectName(labour) || '').toLowerCase() === selectedProjectName
      return matchesProjectId || matchesProjectName
    })
  }, [attendance.projectId, projects, filteredLabourers])

  const handleAddLabour = async () => {
    const errors = validateFields([
      { name: 'labourName', value: newLabour.name, label: 'Name', rules: ['name'] },
      { name: 'labourPhone', value: newLabour.phone, label: 'Mobile number', rules: ['mobile'] },
      { name: 'labourDesignation', value: newLabour.designation, label: 'Designation', rules: newLabour.designation ? ['name'] : [] },
      { name: 'labourAddress', value: newLabour.address, label: 'Address', rules: newLabour.address ? ['textarea'] : [] },
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
        setShowAddForm(false)
        showToast('Labourer added successfully!', 'success')
      }
    } catch (error) {
      showToast('Failed to add labourer: ' + error.message, 'error')
    }
  }

  const openEditForm = (labour) => {
    setEditLabour({
      id: labour.id,
      name: labour.name,
      phone: labour.phone,
      address: labour.address || '',
      designation: labour.designation || '',
      project: labour.project || '',
      projectId: labour.projectId || null
    })
    setEditLabourErrors({})
    setShowEditForm(true)
  }

  const handleUpdateLabour = async () => {
    const errors = validateFields([
      { name: 'editLabourName', value: editLabour.name, label: 'Name', rules: ['name'] },
      { name: 'editLabourPhone', value: editLabour.phone, label: 'Mobile number', rules: ['mobile'] },
      { name: 'editLabourDesignation', value: editLabour.designation, label: 'Designation', rules: editLabour.designation ? ['name'] : [] },
      { name: 'editLabourAddress', value: editLabour.address, label: 'Address', rules: editLabour.address ? ['textarea'] : [] },
    ])
    setEditLabourErrors(errors)
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors)
      return
    }
    try {
      const data = await labourApi.updateLabourer(editLabour.id, {
        name: editLabour.name,
        phone: editLabour.phone,
        address: editLabour.address,
        designation: editLabour.designation,
        project: editLabour.project
      })
      if (data.success) {
        await fetchLabourers()
        setEditLabour({ id: null, name: '', phone: '', address: '', designation: '', project: '', projectId: null })
        setShowEditForm(false)
        showToast('Labourer updated successfully!', 'success')
      }
    } catch (error) {
      showToast('Failed to update labourer: ' + error.message, 'error')
    }
  }

  const handleAddPayment = async () => {
    const errors = validateFields([
      { name: 'paymentAmount', value: payment.amount, label: 'Amount', rules: ['amount'] },
      { name: 'paymentDate', value: payment.date, label: 'Date', rules: ['date'] },
    ])
    setPaymentErrors(errors)
    if (Object.keys(errors).length || !selectedLabour) {
      focusFirstInvalidField(errors)
      return
    }
    try {
      const data = await labourApi.addPayment(selectedLabour.id, payment)
      if (data.success) {
        await fetchLabourers()
        setPayment({ amount: '', date: new Date().toISOString().split('T')[0] })
        setShowPaymentModal(false)
        setSelectedLabour(null)
        showToast('Payment added successfully!', 'success')
      }
    } catch (error) {
      showToast('Failed to add payment: ' + error.message, 'error')
    }
  }

  const openPaymentModal = (labour) => { setSelectedLabour(labour); setPaymentErrors({}); setShowPaymentModal(true) }
  const openViewPaymentsModal = (labour) => { setSelectedLabour(labour); setShowViewPaymentsModal(true) }

  const openEntryHistory = async (labour) => {
    setSelectedLabour(labour)
    setShowEntryHistoryModal(true)
    setEntryHistoryLoading(true)
    try {
      const data = await labourApi.getLabourAttendance(labour.id)
      setEntryHistory(data.data || [])
    } catch (error) {
      setEntryHistory([])
      showToast('Failed to load labour entry history: ' + error.message, 'error')
    } finally {
      setEntryHistoryLoading(false)
    }
  }

  const handleSaveAttendance = async (entryStatus) => {
    if (!attendance.labourId || !attendance.projectId || !attendance.attendanceDate || !attendance.headWage || !attendance.helperRate) {
      showToast('Please complete the required labour entry details', 'error')
      return
    }
    try {
      const data = await labourApi.saveAttendance({ ...attendance, entryStatus })
      if (data.success) {
        setShowAttendanceModal(false)
        setAttendance({ labourId: '', projectId: '', attendanceDate: new Date().toISOString().split('T')[0], headWage: '', headDayType: 'FULL_DAY', fullHelpers: 0, halfHelpers: 0, helperRate: '', notes: '' })
        showToast(entryStatus === 'DRAFT' ? 'Labour entry saved as draft' : 'Labour entry submitted to admin', 'success')
      }
    } catch (error) {
      showToast('Failed to save attendance: ' + error.message, 'error')
    }
  }

  const deleteLabour = async (id) => {
    if (window.confirm('Are you sure you want to delete this labourer? This will also delete all their payment records.')) {
      try {
        const data = await labourApi.deleteLabourer(id)
        if (data.success) {
          await fetchLabourers()
          showToast('Labourer deleted successfully!', 'success')
        }
      } catch (error) {
        showToast('Failed to delete labourer: ' + error.message, 'error')
      }
    }
  }

  const getPaymentCount = (labour) => labour.payments ? labour.payments.length : 0

  // -- Reusable form fields (only shows engineer's assigned projects) --
  const renderLabourFields = (formState, setFormState, errors = {}, fieldPrefix = 'labour') => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            name={`${fieldPrefix}Name`}
            type="text"
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border font-medium rounded-lg focus:border-transparent ${errors[`${fieldPrefix}Name`] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter name"
          />
        </div>
        {errors[`${fieldPrefix}Name`] && <p className="text-red-500 text-sm mt-1">{errors[`${fieldPrefix}Name`]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            name={`${fieldPrefix}Phone`}
            type="tel"
            value={formState.phone}
            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border font-medium rounded-lg focus:border-transparent ${errors[`${fieldPrefix}Phone`] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter phone number"
          />
        </div>
        {errors[`${fieldPrefix}Phone`] && <p className="text-red-500 text-sm mt-1">{errors[`${fieldPrefix}Phone`]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            name={`${fieldPrefix}Designation`}
            type="text"
            value={formState.designation}
            onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border font-medium border-gray-300 rounded-lg focus:border-transparent"
            placeholder="e.g. Mason, Electrician, Helper"
          />
        </div>
        {errors[`${fieldPrefix}Designation`] && <p className="text-red-500 text-sm mt-1">{errors[`${fieldPrefix}Designation`]}</p>}
      </div>

      {/* Only engineer's assigned projects shown in dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Project</label>
        <div className="relative">
          <FolderOpen className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={20} />
          <select
            value={formState.project}
            onChange={(e) => {
              const selectedProject = assignedProjects.find(p => p.name === e.target.value)
              setFormState({
                ...formState,
                project: e.target.value,
                projectId: selectedProject ? selectedProject.id : null
              })
            }}
            className="w-full pl-10 pr-4 py-2 border font-medium border-gray-300 rounded-lg focus:border-transparent bg-white appearance-none"
          >
            <option value="">Select a project</option>
            {assignedProjects.map((proj) => (
              <option key={proj.id} value={proj.name}>
                {proj.name} {proj.projectId ? `(${proj.projectId})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
          <textarea
            name={`${fieldPrefix}Address`}
            value={formState.address}
            onChange={(e) => setFormState({ ...formState, address: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border font-medium border-gray-300 rounded-lg focus:border-transparent"
            placeholder="Enter address"
            rows="3"
          />
        </div>
        {errors[`${fieldPrefix}Address`] && <p className="text-red-500 text-sm mt-1">{errors[`${fieldPrefix}Address`]}</p>}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-600" size={48} />
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      {/* -- Header -- */}
      <div className="mt-25 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Labour Management</h1>
            <p className="text-gray-600 mt-1 text-sm">
              {engineer?.name
                ? `Showing labourers for ${engineer.name}'s assigned projects`
                : 'Manage labourers and track daily payments'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-[#ffbe2a] text-black px-4 py-2 rounded-lg cursor-pointer hover:bg-[#e5ab26] transition font-medium"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Labour</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-2 bg-[#ffbe2a] text-black px-4 py-2 rounded-lg cursor-pointer hover:bg-[#e5ab26] transition font-medium"
            >
              <ClipboardCheck size={20} />
              <span>Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* -- Main content -- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Add Labour Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add New Labour</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              {renderLabourFields(newLabour, setNewLabour, labourErrors, 'labour')}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAddForm(false); setLabourErrors({}); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleAddLabour} className="flex-1 px-4 py-2 bg-[#ffbe2a] text-black rounded-lg hover:bg-[#e5ab26] transition font-medium">
                  Add Labour
                </button>
              </div>
            </div>
          </div>
        )}

        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Labour Entry</h2>
                  <p className="text-xs text-gray-500 mt-1">Add labour work details for the selected site and date</p>
                </div>
                <button onClick={() => setShowAttendanceModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close attendance form"><X size={24} /></button>
              </div>
              <div className="space-y-2 mt-4">
                <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Work Details</h3><div className="grid grid-cols-2 gap-2"><label className="text-xs">Date *<input type="date" value={attendance.attendanceDate} onChange={(e) => setAttendance((c) => ({ ...c, attendanceDate: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><label className="text-xs">Project *<select value={attendance.projectId} onChange={(e) => setAttendance((c) => ({ ...c, projectId: e.target.value, labourId: '' }))} className="mt-1 w-full border rounded px-2 py-1.5 bg-white"><option value="">Select project</option>{assignedProjects.map((p) => <option key={getProjectId(p)} value={getProjectId(p)}>{p.name || p.projectName}</option>)}</select></label><label className="text-xs">Labour head *<select value={attendance.labourId} disabled={!attendance.projectId} onChange={(e) => setAttendance((c) => ({ ...c, labourId: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5 bg-white disabled:bg-gray-100"><option value="">{attendance.projectId && entryProjectLabourers.length === 0 ? 'No labour heads assigned' : 'Select labour head'}</option>{entryProjectLabourers.map((l) => <option key={l.id} value={l.id}>#{l.id} — {l.name} — {l.designation || 'No designation'}</option>)}</select></label><label className="text-xs">Designation<input readOnly value={entryProjectLabourers.find((l) => String(l.id) === String(attendance.labourId))?.designation || ''} placeholder="Auto-filled" className="mt-1 w-full border rounded px-2 py-1.5 bg-gray-100" /></label></div></section>
                <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Head</h3><div className="grid grid-cols-2 gap-2"><label className="text-xs">Head wage (₹) *<input type="number" min="0" value={attendance.headWage} onChange={(e) => setAttendance((c) => ({ ...c, headWage: e.target.value }))} placeholder="900" className="mt-1 w-full border rounded px-2 py-1.5" /></label><div className="text-xs">Head day type *<div className="mt-2 flex gap-3"><label><input type="radio" checked={attendance.headDayType === 'FULL_DAY'} onChange={() => setAttendance((c) => ({ ...c, headDayType: 'FULL_DAY' }))} /> Full day</label><label><input type="radio" checked={attendance.headDayType === 'HALF_DAY'} onChange={() => setAttendance((c) => ({ ...c, headDayType: 'HALF_DAY' }))} /> Half day</label></div></div></div></section>
                <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Helpers</h3><div className="grid grid-cols-3 gap-2"><label className="text-xs">Full day<input type="number" min="0" value={attendance.fullHelpers} onChange={(e) => setAttendance((c) => ({ ...c, fullHelpers: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><label className="text-xs">Half day<input type="number" min="0" value={attendance.halfHelpers} onChange={(e) => setAttendance((c) => ({ ...c, halfHelpers: e.target.value }))} className="mt-1 w-full border rounded px-2 py-1.5" /></label><label className="text-xs">Helper rate (₹) *<input type="number" min="0" value={attendance.helperRate} onChange={(e) => setAttendance((c) => ({ ...c, helperRate: e.target.value }))} placeholder="500" className="mt-1 w-full border rounded px-2 py-1.5" /></label></div></section>
                <section className="border border-gray-200 rounded-lg p-3 bg-gray-50"><h3 className="font-semibold text-sm mb-2">Cost Summary</h3>{(() => { const wage=Number(attendance.headWage)||0, rate=Number(attendance.helperRate)||0, full=Number(attendance.fullHelpers)||0, half=Number(attendance.halfHelpers)||0, head=attendance.headDayType==='HALF_DAY'?wage*.5:wage, total=head+full*rate+half*rate*.5; return <div className="text-xs space-y-1"><p className="flex justify-between"><span>Head</span><span>₹{head.toLocaleString()}</span></p><p className="flex justify-between"><span>Full helpers</span><span>₹{(full*rate).toLocaleString()}</span></p><p className="flex justify-between"><span>Half helpers</span><span>₹{(half*rate*.5).toLocaleString()}</span></p><p className="flex justify-between border-t pt-2 font-bold text-sm"><span>Total</span><span>₹{total.toLocaleString()}</span></p></div> })()}</section>
                <section className="border border-gray-200 rounded-lg p-3"><h3 className="font-semibold text-sm mb-2">Notes</h3><textarea value={attendance.notes} onChange={(e) => setAttendance((c) => ({ ...c, notes: e.target.value }))} rows="2" placeholder="e.g. 1 helper left at noon, emergency" className="w-full border rounded px-2 py-1.5 text-sm resize-none" /></section>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => handleSaveAttendance('DRAFT')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">Save draft</button>
                <button onClick={() => handleSaveAttendance('SUBMITTED')} className="flex-1 px-4 py-2 bg-[#ffbe2a] text-black rounded-lg hover:bg-[#e5ab26] transition font-medium text-sm">Submit to Admin</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Labour Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Labour Details</h2>
                <button onClick={() => setShowEditForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              {renderLabourFields(editLabour, setEditLabour, editLabourErrors, 'editLabour')}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowEditForm(false); setEditLabourErrors({}); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleUpdateLabour} className="flex-1 px-4 py-2 bg-[#ffbe2a] text-black rounded-lg hover:bg-[#e5ab26] transition font-medium">
                  Update Labour
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Modal */}
        {showPaymentModal && selectedLabour && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full sm:max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add Payment</h2>
                <button onClick={() => { setShowPaymentModal(false); setSelectedLabour(null) }} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Labour Name</p>
                <p className="font-semibold text-gray-900">{selectedLabour.name}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      name="paymentAmount"
                      type="number" min="0" step="0.01"
                      value={payment.amount}
                      onChange={(e) => { setPayment({ ...payment, amount: e.target.value }); setPaymentErrors((prev) => ({ ...prev, paymentAmount: '' })); }}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${paymentErrors.paymentAmount ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter amount"
                    />
                  </div>
                  {paymentErrors.paymentAmount && <p className="text-red-500 text-sm mt-1">{paymentErrors.paymentAmount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      name="paymentDate"
                      type="date"
                      value={payment.date}
                      onChange={(e) => { setPayment({ ...payment, date: e.target.value }); setPaymentErrors((prev) => ({ ...prev, paymentDate: '' })); }}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${paymentErrors.paymentDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {paymentErrors.paymentDate && <p className="text-red-500 text-sm mt-1">{paymentErrors.paymentDate}</p>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setShowPaymentModal(false); setSelectedLabour(null) }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={handleAddPayment} className="flex-1 px-4 py-2 bg-[#ffbe2a] text-black rounded-lg hover:bg-[#e5ab26] transition font-medium">
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Payments Modal */}
        {showViewPaymentsModal && selectedLabour && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedLabour.name}</p>
                </div>
                <button onClick={() => { setShowViewPaymentsModal(false); setSelectedLabour(null) }} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Total Amount Paid</p>
                <p className="text-3xl font-bold text-green-600 flex items-center gap-1">
                  <IndianRupee size={24} />
                  {selectedLabour.totalPaid?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getPaymentCount(selectedLabour)} payment{getPaymentCount(selectedLabour) !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!selectedLabour.payments || selectedLabour.payments.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLabour.payments
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((p) => (
                        <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-2 rounded">
                              <Calendar size={18} className="text-yellow-600" />
                            </div>
                            <p className="font-medium text-gray-900">
                              {new Date(p.date).toLocaleDateString('en-IN', {
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
                            <IndianRupee size={18} />
                            {p.amount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => { setShowViewPaymentsModal(false); setSelectedLabour(null) }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Labour entry history, opened from the eye action */}
        {showEntryHistoryModal && selectedLabour && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Labour Entry History</h2>
                  <p className="text-sm text-gray-600 mt-1">#{selectedLabour.id} — {selectedLabour.name}</p>
                </div>
                <button onClick={() => { setShowEntryHistoryModal(false); setSelectedLabour(null); setEntryHistory([]) }} className="text-gray-500 hover:text-gray-700" aria-label="Close history"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {entryHistoryLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>
                ) : entryHistory.length === 0 ? (
                  <div className="text-center py-12"><ClipboardCheck className="mx-auto text-gray-300 mb-3" size={44} /><p className="text-gray-500">No labour entries recorded yet</p></div>
                ) : (
                  <div className="border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-yellow-50 text-gray-700"><tr><th className="px-3 py-3 text-left whitespace-nowrap">Date</th><th className="px-3 py-3 text-left whitespace-nowrap">Day Type</th><th className="px-3 py-3 text-center whitespace-nowrap">Full Helpers</th><th className="px-3 py-3 text-center whitespace-nowrap">Half Helpers</th><th className="px-3 py-3 text-right whitespace-nowrap">Head Salary</th><th className="px-3 py-3 text-right whitespace-nowrap">1 Helper Salary</th><th className="px-3 py-3 text-left whitespace-nowrap">Status</th><th className="px-3 py-3 text-right whitespace-nowrap">Total</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {entryHistory.map((entry) => {
                          const headSalary = entry.headDayType === 'HALF_DAY' ? Number(entry.headWage || 0) * 0.5 : Number(entry.headWage || 0)
                          const helperSalary = Number(entry.helperRate || 0)
                          return (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 whitespace-nowrap"><p className="font-medium text-gray-900">{new Date(entry.attendanceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>{entry.notes && <p className="text-xs text-gray-500 mt-1 max-w-[180px] truncate" title={entry.notes}>{entry.notes}</p>}</td>
                            <td className="px-3 py-3">{entry.headDayType === 'HALF_DAY' ? 'Half Day' : 'Full Day'}</td>
                            <td className="px-3 py-3 text-center">{entry.fullHelpers || 0}</td><td className="px-3 py-3 text-center">{entry.halfHelpers || 0}</td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">₹{headSalary.toLocaleString('en-IN')}</td><td className="px-3 py-3 text-right whitespace-nowrap">₹{helperSalary.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.entryStatus === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{entry.entryStatus === 'SUBMITTED' ? 'Submitted' : 'Draft'}</span></td>
                            <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">₹{Number(entry.totalAmount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -- Search Bar -- */}
        {labourers.length > 0 && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, designation..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 mt-1 ml-1">
                {filteredLabourers.length} result{filteredLabourers.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        )}

        {/* -- Table -- */}
        {filteredLabourers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <User className="mx-auto text-gray-300 mb-4" size={64} />
            {searchQuery ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-4">No labourers match "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="text-yellow-600 font-medium hover:underline text-sm">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Labourers Yet</h3>
                <p className="text-gray-600 mb-6">
                  {engineerProjectIds.length === 0
                    ? 'You have no assigned projects. Contact your admin.'
                    : 'Get started by adding your first labourer'}
                </p>
                {engineerProjectIds.length > 0 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 bg-[#ffbe2a] text-black px-6 py-3 rounded-lg hover:bg-[#e5ab26] transition font-medium"
                  >
                    <Plus size={20} />
                    Add First Labour
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-500 border-b border-black-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-x font-bold text-black uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-4 text-left text-x font-bold text-black uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-x font-bold text-black uppercase tracking-wider">Phone Number</th>
                    <th className="px-6 py-4 text-left text-x font-bold text-black uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-4 text-left text-x font-bold text-black uppercase tracking-wider">Project</th>
                    <th className="px-6 py-4 text-left text-x font-bold text-black uppercase tracking-wider">Address</th>
                    <th className="px-6 py-4 text-center text-x font-bold text-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLabourers.map((labour, index) => (
                    <tr key={labour.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{labour.name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{labour.phone}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{labour.designation || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FolderOpen size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{labour.project || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{labour.address || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEntryHistory(labour)} className="p-2 text-black hover:bg-yellow-50 rounded-lg transition" title="Labour Entry History">
                            <Eye size={18} />
                          </button>
                          <div className="relative">
                            <button onClick={(event) => {
                              const rect = event.currentTarget.getBoundingClientRect()
                              setPaymentMenu((current) => current?.labour.id === labour.id ? null : { labour, rect })
                            }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Payments">
                              <IndianRupee size={18} />
                            </button>
                          </div>
                          <button onClick={() => openEditForm(labour)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition" title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteLabour(labour.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    {paymentMenu && createPortal(
      <>
        <div className="fixed inset-0 z-40" onClick={() => setPaymentMenu(null)} />
        <div
          className="fixed z-50 w-40 rounded-lg bg-white border border-gray-200 shadow-xl py-1"
          style={{ top: paymentMenu.rect.bottom + 8, left: Math.max(8, paymentMenu.rect.right - 160) }}
        >
          <button onClick={() => { const labour = paymentMenu.labour; setPaymentMenu(null); openPaymentModal(labour) }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50">Add Payment</button>
          <button onClick={() => { const labour = paymentMenu.labour; setPaymentMenu(null); openViewPaymentsModal(labour) }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50">View Payments</button>
        </div>
      </>,
      document.body
    )}
    </>
  )
}

export default LabourManagement
