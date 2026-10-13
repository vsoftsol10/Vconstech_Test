import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Search, Filter, X, Loader2, ClipboardCheck } from 'lucide-react'
import labourApi from '../../api/labourAPI'
import EmployeeNavbar from '../../components/Employee/EmployeeNavbar'
import { showToast } from '../../components/common/Toast'

const EMPTY_FILTERS = { from: '', to: '' }

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const getDayTypeLabel = (entry) => (entry.headDayType === 'HALF_DAY' ? 'Half Day' : 'Full Day')

// admin = true  -> rendered inside AdminLayout (admin navbar + sidebar already present)
// admin = false -> employee page, renders its own EmployeeNavbar
const LabourView = ({ admin = false }) => {
  const { labourId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [labour, setLabour] = useState(location.state?.labour || null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const filterRef = useRef(null)

  useEffect(() => {
    document.title = 'Vconstech - Labour View'
  }, [])

  // Load entries (and the labour name if the page was opened directly by URL)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await labourApi.getLabourAttendance(labourId)
        setEntries(data.data || [])

        if (!location.state?.labour) {
          const all = await labourApi.getAllLabourers()
          const found = (all.data || []).find((l) => String(l.id) === String(labourId))
          if (found) setLabour(found)
        }
      } catch (error) {
        setEntries([])
        showToast('Failed to load labour entries: ' + error.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [labourId])

  // Close filter popover when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const activeFilterCount = (filters.from ? 1 : 0) + (filters.to ? 1 : 0)

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return entries.filter((entry) => {
      const day = String(entry.attendanceDate).slice(0, 10)

      // Filter: date range (From / To)
      if (filters.from && day < filters.from) return false
      if (filters.to && day > filters.to) return false

      // Search: Day Type only ("full", "half", "full day", "half day")
      if (q && !getDayTypeLabel(entry).toLowerCase().includes(q)) return false

      return true
    })
  }, [entries, searchQuery, filters])

  const totalAmount = visibleEntries.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0)

  return (
    <div className={`min-h-screen bg-gray-50 ${admin ? 'ml-16 pt-28 md:ml-64' : ''}`}>
      {!admin && <EmployeeNavbar />}

      {/* Header */}
      <div className={`${admin ? 'py-0' : 'mt-20 sm:mt-24 py-4'} bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Back to labour management"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Labour View</h1>
            <p className="text-gray-600 mt-1 text-sm truncate">
              View submitted labour entries
              {labour ? ` — #${labour.id} ${labour.name}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search (Day Type) + Filter (From / To date) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by day type (Full Day / Half Day)..."
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative self-end sm:self-auto flex-shrink-0" ref={filterRef}>
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="flex items-center gap-2 bg-[#ffbe2a] text-black px-5 py-3 rounded-xl hover:bg-[#e5ab26] transition font-medium text-sm"
            >
              <Filter size={18} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilter && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-30 space-y-3">
                <label className="block text-xs font-medium text-gray-700">
                  From date
                  <input
                    type="date"
                    value={filters.from}
                    max={filters.to || undefined}
                    onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
                  />
                </label>

                <label className="block text-xs font-medium text-gray-700">
                  To date
                  <input
                    type="date"
                    value={filters.to}
                    min={filters.from || undefined}
                    onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
                  />
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowFilter(false)}
                    className="flex-1 px-3 py-2 bg-[#ffbe2a] text-black rounded-lg text-sm font-medium hover:bg-[#e5ab26] transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin text-yellow-600" size={36} />
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ClipboardCheck className="mx-auto text-gray-300 mb-3" size={44} />
            <p className="text-gray-500">
              {entries.length === 0 ? 'No labour entries recorded yet' : 'No entries match your search or filter'}
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={() => { setSearchQuery(''); setFilters(EMPTY_FILTERS) }}
                className="mt-3 text-yellow-600 font-medium hover:underline text-sm"
              >
                Clear search and filter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm min-w-[1000px]">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead className="bg-yellow-50 text-gray-800">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Day Type</th>
                    <th className="px-3 sm:px-4 py-3 text-center font-semibold whitespace-nowrap">Full Helpers</th>
                    <th className="px-3 sm:px-4 py-3 text-center font-semibold whitespace-nowrap">Half Helpers</th>
                    <th className="px-3 sm:px-4 py-3 text-right font-semibold whitespace-nowrap">Head Salary</th>
                    <th className="px-3 sm:px-4 py-3 text-center font-semibold whitespace-nowrap">1 Helper Salary</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                    <th className="px-3 sm:px-4 py-3 text-right font-semibold whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleEntries.map((entry) => {
                    const headSalary =
                      entry.headDayType === 'HALF_DAY'
                        ? Number(entry.headWage || 0) * 0.5
                        : Number(entry.headWage || 0)

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-gray-900">{formatDate(entry.attendanceDate)}</p>
                          {entry.notes && (
                            <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={entry.notes}>
                              {entry.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{getDayTypeLabel(entry)}</td>
                        <td className="px-3 sm:px-4 py-3 text-center">{entry.fullHelpers || 0}</td>
                        <td className="px-3 sm:px-4 py-3 text-center">{entry.halfHelpers || 0}</td>
                        <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">{money(headSalary)}</td>
                        <td className="px-3 sm:px-4 py-3 text-center whitespace-nowrap">{money(entry.helperRate)}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.entryStatus === 'SUBMITTED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {entry.entryStatus === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right font-semibold whitespace-nowrap">
                          {money(entry.totalAmount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={7} className="px-4 py-3 text-right text-sm text-gray-600">
                      {visibleEntries.length} entr{visibleEntries.length === 1 ? 'y' : 'ies'} · Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{money(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LabourView
