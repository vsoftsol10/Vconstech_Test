import React from 'react';
import { FileText, Eye, Pencil, Trash2, Search, Filter, X } from 'lucide-react';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
  if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

const BillsListSection = ({
  activeSection,
  setActiveSection,
  bills,
  loading,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  customDateRange,
  setCustomDateRange,
  showFilterDropdown,
  setShowFilterDropdown,
  handlePrintBill,
  handleEditBill,
  handleDeleteBill,
  handleUpdateStatus,
}) => {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const statusDropdownRef = React.useRef(null);
  const dateDropdownRef = React.useRef(null);

  React.useEffect(() => {
    if (!showStatusDropdown && !showFilterDropdown) return undefined;

    const handleClickOutside = (event) => {
      if (!statusDropdownRef.current?.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (!dateDropdownRef.current?.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown, showFilterDropdown, setShowFilterDropdown]);
  
  // Helper function for status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'open':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };


// Filter bills based on active section and search
const filteredBills = bills.filter(bill => {
  const type = (bill.billType || '').trim().toLowerCase();
  const status = (bill.status || '').trim().toLowerCase();

  let sectionMatch = true;

  if (activeSection === 'invoice') {
    sectionMatch = type === 'invoice' && status !== 'draft';
  } 
  else if (activeSection === 'quotation') {
    sectionMatch = type === 'quotation' && status !== 'draft';
  } 
  else if (activeSection === 'draft') {
    sectionMatch = status === 'draft';
  }
  // activeSection === 'all' keeps sectionMatch = true

  const searchMatch =
    searchTerm === '' ||
    (bill.billNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.projectName || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by date
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const billDate = new Date(bill.billDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        dateMatch = billDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateMatch = billDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateMatch = billDate >= monthAgo;
      } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        dateMatch = billDate >= startDate && billDate <= endDate;
      }
    }

    // Filter by status
    let statusMatch = true;
    if (statusFilter !== 'all') {
      statusMatch = status === statusFilter.toLowerCase();
    }

    return sectionMatch && searchMatch && dateMatch && statusMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / rowsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredBills.length);
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchTerm, statusFilter, dateFilter, customDateRange.start, customDateRange.end, rowsPerPage]);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);


  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
{/* Section Tabs */}
<div className="border-b border-gray-200 px-6">
<div className="flex overflow-x-auto scrollbar-hide">    {['all', 'invoice', 'quotation', 'draft'].map(section => (
      <button
        key={section}
        onClick={() => setActiveSection(section)}
        className={`py-4 px-2 border-b-2 font-extrabold text-sm transition-colors ${
          activeSection === section
            ? 'border-[#ffbe2a] text-[#ffbe2a]'
            : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {section.charAt(0).toUpperCase() + section.slice(1)}

        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
  {section === 'all'
    ? bills.length

    : section === 'invoice'
    ? bills.filter(b =>
        (b.billType || '').toLowerCase() === 'invoice' && 
        (b.status || '').toLowerCase() !== 'draft'
      ).length

    : section === 'quotation'
    ? bills.filter(b =>
        (b.billType || '').toLowerCase() === 'quotation' && 
        (b.status || '').toLowerCase() !== 'draft'
      ).length

    : bills.filter(b =>
        (b.status || '').toLowerCase() === 'draft'
      ).length}
</span>
      </button>
    ))}
  </div>
</div>

      {/* Search and Filter Bar */}
      <div className="p-6 border-b border-gray-200">
<div className="flex flex-row gap-2 flex-wrap">          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by bill number, client name, or project..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowFilterDropdown(false);
              }}
              className="flex items-center gap-1 px-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {statusFilter === 'all' ? 'All Status' :
                 statusFilter === 'open' ? 'Open' :
                 statusFilter === 'sent' ? 'Sent' :
                 statusFilter === 'paid' ? 'Paid' :
                 'Draft'}
              </span>
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('open');
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Open
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('sent');
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Sent
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('paid');
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Paid
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('draft');
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    Draft
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowStatusDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {dateFilter === 'all' ? 'All Time' :
                 dateFilter === 'today' ? 'Today' :
                 dateFilter === 'week' ? 'This Week' :
                 dateFilter === 'month' ? 'This Month' :
                 'Custom Range'}
              </span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => {
                      setDateFilter('today');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setDateFilter('week');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => {
                      setDateFilter('month');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      setDateFilter('custom');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-t"
                  >
                    Custom Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === 'custom' && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(statusFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-4">
            {statusFilter !== 'all' && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <span>Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {dateFilter !== 'all' && (
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                <span>
                  Date: {dateFilter === 'today' ? 'Today' :
                         dateFilter === 'week' ? 'This Week' :
                         dateFilter === 'month' ? 'This Month' :
                         'Custom'}
                </span>
                <button
                  onClick={() => setDateFilter('all')}
                  className="hover:bg-purple-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Bills Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No {activeSection === 'all' ? 'bills' : activeSection === 'draft' ? 'drafts' : activeSection + 's'} found
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters or search term' 
                : `Create your first ${activeSection === 'all' ? 'bill' : activeSection} using the form above`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-6 py-3 text-left text-s font-extrabold text-black uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-s font-extrabold text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-s font-extrabold text-black uppercase tracking-wider">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left text-s font-extrabold text-black uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-s font-extrabold text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-s font-extrabold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBills.map((bill) => {
                  const items = Array.isArray(bill?.BillItem) ? bill.BillItem : 
                                Array.isArray(bill?.items) ? bill.items : [];

                  const subtotal = items.reduce(
                    (sum, item) => sum + Number(item?.amount || 0),
                    0
                  );

                  const grossAmount =
                    subtotal +
                    Number(bill?.labourCharges || 0) +
                    Number(bill?.transportCharges || 0) +
                    Number(bill?.otherCharges || 0);

                  const cgstPercent = Number(bill?.cgstPercent || bill?.cgst || 0);
                  const sgstPercent = Number(bill?.sgstPercent || bill?.sgst || 0);
                  const igstPercent = Number(bill?.igstPercent || bill?.igst || 0);
                  const tdsPercent = Number(bill?.tdsPercent || bill?.tds || 0);
                  const retentionPercent = Number(bill?.retentionPercent || bill?.retention || 0);

                  const cgst = (grossAmount * cgstPercent) / 100;
                  const sgst = (grossAmount * sgstPercent) / 100;
                  const igst = (grossAmount * igstPercent) / 100;

                  const totalWithTax = grossAmount + cgst + sgst + igst;

                  const tds = (totalWithTax * tdsPercent) / 100;
                  const retention = (totalWithTax * retentionPercent) / 100;

                  const netPayable =
                    totalWithTax -
                    tds -
                    retention -
                    Number(bill?.advancePaid || 0) +
                    Number(bill?.previousBills || 0);

                  const billId = bill._id || bill.id;
                  const billNumber = bill.billId || bill.billNumber || 'N/A';
                  const billType = bill.billType || 'invoice';

                  return (
                    <tr key={billId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹ {netPayable.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={bill.status || 'open'}
                          onChange={(e) => handleUpdateStatus(billId, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${getStatusColor(bill.status || 'open')}`}
                        >
                          <option value="open">Open</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="draft">Draft</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{billNumber}</div>
                        <div className="text-xs text-gray-500">
                          {billType === 'quotation' ? 'Quotation' : 'Invoice'} • by {bill.companyName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bill.clientName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(bill.billDate).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(bill.createdAt || bill.billDate).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePrintBill(bill)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(billId)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <p className="text-sm font-medium text-gray-700">
                    Showing <span className="font-semibold text-gray-900">{filteredBills.length === 0 ? 0 : startIndex + 1}</span>
                    &ndash;<span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
                    <span className="font-semibold text-gray-900">{filteredBills.length}</span> Bills
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    Current Page: <span className="font-semibold text-gray-900">{safeCurrentPage}</span> / Total Pages:{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </p>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Rows Per Page:
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-9 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-sm font-semibold text-gray-800 shadow-sm focus:border-[#ffbe2a] focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {getPaginationItems(safeCurrentPage, totalPages).map((item, index) =>
                    item === '...' ? (
                      <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-lg transition-colors ${
                          safeCurrentPage === item
                            ? 'bg-[#ffbe2a] text-black shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsListSection;
