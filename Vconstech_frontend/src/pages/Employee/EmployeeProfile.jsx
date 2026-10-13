import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, IndianRupee, LoaderCircle, Mail, MapPin, Phone, ReceiptText, UserRound } from 'lucide-react';
import { jsPDF } from 'jspdf';
import EmployeeNavbar from '../../components/Employee/EmployeeNavbar';
import { getToken } from '../../utils/tabToken';

const API_URL = import.meta.env.VITE_API_URL;

const money = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(Number(amount || 0));

// jsPDF's built-in fonts do not support the Unicode rupee glyph reliably.
const pdfMoney = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const dateText = (value, options = {}) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', ...options,
});

const payPeriod = (value) => new Date(value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const salaryBreakdown = (salary) => {
  const basic = Number(salary?.amount || 0);
  const allowances = Number(salary?.allowances || 0);
  const deductions = Number(salary?.deductions || 0);
  const expenses = Number(salary?.expenses || 0);
  return { basic, allowances, deductions, expenses, net: basic + allowances - deductions - expenses };
};

const safeFileName = (value) => String(value || 'Engineer').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');

const EmployeeProfile = () => {
  const [engineer, setEngineer] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [selectedSalaryId, setSelectedSalaryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        const [profileResponse, salaryResponse] = await Promise.all([
          fetch(`${API_URL}/engineers/my-profile`, { headers }),
          fetch(`${API_URL}/engineers/my-salaries`, { headers }),
        ]);
        const profileData = await profileResponse.json();
        const salaryData = await salaryResponse.json();
        if (!profileResponse.ok) throw new Error(profileData.error || 'Unable to load your profile');
        if (!salaryResponse.ok) throw new Error(salaryData.error || 'Unable to load your salary history');
        const records = salaryData.salaries || [];
        setEngineer(profileData.engineer);
        setSalaries(records);
        setSelectedSalaryId(records[0] ? String(records[0].id) : '');
      } catch (requestError) {
        setError(requestError.message || 'Unable to load profile details');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const selectedSalary = useMemo(
    () => salaries.find((salary) => String(salary.id) === selectedSalaryId),
    [salaries, selectedSalaryId]
  );

  const downloadPayslip = (salaryToDownload = selectedSalary) => {
    if (!engineer || !salaryToDownload) return;
    setDownloading(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const { basic: amount, allowances, deductions, expenses, net } = salaryBreakdown(salaryToDownload);
      const left = 18;
      const right = pageWidth - 18;

      // Yellow two-column payslip layout: all figures come from the salary record.
      const margin = 10;
      const columnGap = 4;
      const columnWidth = (pageWidth - (margin * 2) - columnGap) / 2;
      const deductionTotal = deductions + expenses;
      const namedRows = (items, fallbackLabel, fallbackAmount) => Array.isArray(items) && items.length
        ? items.map((item) => [String(item.name || fallbackLabel), Number(item.amount || 0)])
        : [[fallbackLabel, fallbackAmount]];
      const allowanceRows = namedRows(salaryToDownload.allowanceItems, 'Allowances', allowances);
      const deductionRows = [...namedRows(salaryToDownload.deductionItems, 'Deductions', deductions), ['Expenses', expenses]];
      const paymentDate = dateText(new Date());
      const drawBox = (x, y, width, title, rows, totalLabel, total) => {
        const rowHeight = 10;
        const height = 14 + (rows.length * rowHeight) + 12;
        doc.setDrawColor(255, 196, 0);
        doc.setLineWidth(0.45);
        doc.roundedRect(x, y, width, height, 2, 2, 'S');
        doc.setFillColor(255, 216, 31);
        doc.roundedRect(x, y, width, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 32, 52);
        doc.setFontSize(9);
        doc.text(title, x + 4, y + 9);
        doc.setFillColor(250, 251, 252);
        doc.rect(x + 0.4, y + 14, width - 0.8, 8, 'F');
        doc.setFontSize(7.5);
        doc.text('Description', x + 4, y + 19);
        doc.text('Amount (Rs.)', x + width - 4, y + 19, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        rows.forEach(([label, value], index) => {
          const rowY = y + 22 + (index * rowHeight);
          doc.setDrawColor(225, 229, 235);
          doc.line(x + 0.5, rowY, x + width - 0.5, rowY);
          doc.setTextColor(75, 85, 99);
          doc.setFontSize(8);
          doc.text(label, x + 4, rowY + 6.5);
          doc.text(pdfMoney(value), x + width - 4, rowY + 6.5, { align: 'right' });
        });
        const totalY = y + 22 + (rows.length * rowHeight);
        doc.setFillColor(255, 251, 235);
        doc.rect(x + 0.5, totalY, width - 1, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 32, 52);
        doc.setFontSize(8.5);
        doc.text(totalLabel, x + 4, totalY + 8);
        doc.text(pdfMoney(total), x + width - 4, totalY + 8, { align: 'right' });
        return y + height;
      };

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 297, 'F');
      doc.setFillColor(255, 216, 31);
      doc.triangle(pageWidth - 72, 10, pageWidth - 10, 10, pageWidth - 10, 38, 'F');
      doc.setDrawColor(255, 196, 0);
      doc.setLineWidth(0.7);
      doc.line(margin, 42, pageWidth - margin, 42);
      doc.setTextColor(28, 40, 64);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(21);
      doc.text(engineer.company?.name || 'Vconstech', margin, 23);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('CONSTRUCTION COMPANY', margin, 31);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('PAYSLIP', pageWidth - 14, 24, { align: 'right' });
      doc.setFontSize(7.5);
      doc.text(`FOR THE MONTH OF ${payPeriod(salaryToDownload.effectiveFrom).toUpperCase()}`, pageWidth - 14, 32, { align: 'right' });

      doc.setDrawColor(255, 196, 0);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, 48, pageWidth - (margin * 2), 40, 2, 2, 'S');
      doc.setDrawColor(226, 232, 240);
      doc.line(pageWidth / 2, 52, pageWidth / 2, 83);
      const detail = (label, value, x, y) => { doc.setFont('helvetica', 'normal'); doc.setTextColor(75, 85, 99); doc.setFontSize(8); doc.text(label, x, y); doc.text(':', x + 28, y); doc.setFont('helvetica', 'bold'); doc.setTextColor(24, 34, 52); doc.text(String(value || '-'), x + 34, y); };
      detail('Company Name', engineer.company?.name || 'Vconstech', margin + 4, 58);
      detail('Employee ID', engineer.empId, margin + 4, 67);
      detail('Employee Name', engineer.name, margin + 4, 76);
      detail('Designation', engineer.designation || 'Site Engineer', pageWidth / 2 + 6, 58);
      detail('Payment Date', paymentDate, pageWidth / 2 + 6, 67);

      const earningsBottom = drawBox(margin, 94, columnWidth, 'EARNINGS / ALLOWANCES', [['Basic Salary', amount], ...allowanceRows], 'Total Earnings', amount + allowances);
      const deductionsBottom = drawBox(margin + columnWidth + columnGap, 94, columnWidth, 'DEDUCTIONS', deductionRows, 'Total Deductions', deductionTotal);
      const netY = Math.max(earningsBottom, deductionsBottom) + 8;
      doc.setDrawColor(255, 196, 0);
      doc.setLineWidth(0.45);
      doc.roundedRect(margin, netY, pageWidth - (margin * 2), 18, 2, 2, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 32, 52);
      doc.setFontSize(12);
      doc.text('NET PAY (INR)', margin + 4, netY + 12);
      doc.setFontSize(14);
      doc.text(pdfMoney(net), pageWidth - margin - 4, netY + 12, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      if (salaryToDownload.notes) doc.text(`Notes: ${salaryToDownload.notes}`, margin, netY + 30, { maxWidth: pageWidth - (margin * 2) });
      doc.text('This is a computer generated payslip and does not require a signature.', margin, 278);
      doc.line(pageWidth - 58, 275, pageWidth - 16, 275);
      doc.text('Authorised Signatory', pageWidth - 37, 282, { align: 'center' });
      doc.save(`Payslip-${safeFileName(engineer.name)}-${new Date(salaryToDownload.effectiveFrom).toISOString().slice(0, 7)}.pdf`);
      return;

      doc.setFillColor(255, 190, 42);
      doc.rect(0, 0, pageWidth, 42, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(21);
      doc.text(engineer.company?.name || 'Vconstech', left, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('ENGINEER PAYSLIP', left, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('Payslip', right, 18, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(payPeriod(salaryToDownload.effectiveFrom), right, 27, { align: 'right' });

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.text('EMPLOYEE DETAILS', left, 57);
      doc.setDrawColor(226, 232, 240);
      doc.line(left, 61, right, 61);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(engineer.name || '—', left, 70);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text(`Employee ID: ${engineer.empId || '—'}`, left, 77);
      doc.text(`Designation: ${engineer.designation || 'Site Engineer'}`, left, 83);
      doc.text(`Email: ${engineer.email || '—'}`, left, 89);
      doc.text(`Phone: ${engineer.phone || '—'}`, left, 95);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(left, 108, right - left, 48, 3, 3, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('EARNINGS', left + 6, 119);
      doc.text('AMOUNT', right - 6, 119, { align: 'right' });
      doc.setDrawColor(203, 213, 225);
      doc.line(left + 6, 123, right - 6, 123);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('Basic salary', left + 6, 133);
      doc.text(pdfMoney(amount), right - 6, 133, { align: 'right' });
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Effective from: ${dateText(salaryToDownload.effectiveFrom)}`, left + 6, 141);
      doc.text(`Allowances: ${pdfMoney(allowances)} | Deductions: ${pdfMoney(deductions)} | Expenses: ${pdfMoney(expenses)}`, right - 6, 141, { align: 'right' });
      doc.setDrawColor(203, 213, 225);
      doc.line(left + 6, 146, right - 6, 146);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text('NET PAY', left + 6, 152);
      doc.setTextColor(202, 138, 4);
      doc.text(pdfMoney(net), right - 6, 152, { align: 'right' });

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (salaryToDownload.notes) doc.text(`Notes: ${salaryToDownload.notes}`, left, 169, { maxWidth: right - left });
      doc.text('This is a system-generated payslip and does not require a signature.', pageWidth / 2, 278, { align: 'center' });
      doc.save(`Payslip-${safeFileName(engineer.name)}-${new Date(salaryToDownload.effectiveFrom).toISOString().slice(0, 7)}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      <EmployeeNavbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {loading ? <div className="flex min-h-64 items-center justify-center text-amber-700"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading profile...</div> : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div> : <>
          <div className="hidden mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">Engineer portal</p><h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">My profile & payslips</h1><p className="mt-1 text-sm text-gray-600">View your salary records and download a payslip.</p></div>
            <div className="inline-flex items-center gap-2 self-start rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800 sm:self-auto"><ReceiptText size={17} /> Private salary records</div>
          </div>

          <div className="-mt-2 mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Profile</h1>
            <p className="mt-0.5 text-sm text-[#53627b]">View your details and check your salary history.</p>
          </div>

          <section className="rounded-xl border border-[#edf1f7] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(36,63,104,0.06)] sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><p className="text-xs font-medium text-[#64748b]">Name</p><h2 className="mt-0.5 text-xl font-bold text-[#111827]">{engineer.name || 'Engineer'}</h2><p className="mt-1 text-xs text-[#53627b]">Emp ID: #{engineer.empId || '—'}</p></div>
              <button type="button" onClick={() => downloadPayslip()} disabled={!selectedSalary || downloading} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#ffc400] px-4 text-xs font-semibold text-[#111827] shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"><Download size={16} />{downloading ? 'Preparing...' : 'Download Payslip'}</button>
            </div>
            <div className="mt-4 grid border-t border-[#e8edf4] pt-3 sm:grid-cols-3">
              {[{ label: 'Email ID', value: engineer.email || 'Email not available', icon: Mail }, { label: 'Phone', value: engineer.phone || 'Phone not available', icon: Phone }, { label: 'Location', value: engineer.address || 'Location not available', icon: MapPin }].map(({ label, value, icon: Icon }, index) => <div key={label} className={`flex items-center gap-3 py-2 sm:px-4 ${index > 0 ? 'sm:border-l sm:border-[#e8edf4]' : ''}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff4cc] text-[#374151]"><Icon size={16} /></span><div className="min-w-0"><p className="text-[11px] text-[#64748b]">{label}</p><p className="truncate text-xs font-semibold text-[#26334e]">{value}</p></div></div>)}
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-[#edf1f7] bg-white shadow-[0_4px_18px_rgba(36,63,104,0.06)]"><div className="px-4 py-3 sm:px-5"><h2 className="text-base font-bold text-[#202b45]">Salary History</h2></div>{salaries.length === 0 ? <p className="border-t border-[#edf1f7] px-5 py-8 text-sm text-gray-600">No salary history yet.</p> : <div className="overflow-x-auto px-4 pb-4 sm:px-5"><table className="min-w-[860px] w-full text-left text-xs"><thead className="bg-[#fff8dd] text-[10px] font-bold uppercase text-[#1f2937]"><tr><th className="rounded-l-lg px-3 py-3">Month</th><th className="px-3 py-3">Basic Salary (Rs.)</th><th className="px-3 py-3">Allowances (Rs.)</th><th className="px-3 py-3">Deductions (Rs.)</th><th className="px-3 py-3">Expenses (Rs.)</th><th className="px-3 py-3">Net Salary (Rs.)</th><th className="rounded-r-lg px-3 py-3 text-center">Action</th></tr></thead><tbody className="divide-y divide-[#edf1f7]">{salaries.map((salary) => { const { basic, allowances, deductions, expenses, net } = salaryBreakdown(salary); return <tr key={salary.id} className="text-[#425170] hover:bg-[#fafcff]"><td className="px-3 py-2.5 font-medium text-[#293752]">{payPeriod(salary.effectiveFrom)}</td><td className="px-3 py-2.5">{money(basic)}</td><td className="px-3 py-2.5">{money(allowances)}</td><td className="px-3 py-2.5 text-red-600">{money(deductions)}</td><td className="px-3 py-2.5 text-red-600">{money(expenses)}</td><td className="px-3 py-2.5 font-semibold">{money(net)}</td><td className="px-3 py-2.5 text-center"><button type="button" onClick={() => downloadPayslip(salary)} disabled={downloading} className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#293752] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><Download size={13} /> Download</button></td></tr>})}</tbody></table></div>}</section>

          <div className="hidden"><div className="grid gap-5 lg:grid-cols-5">
            <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><UserRound size={24} /></div>
              <h2 className="text-xl font-bold text-gray-900">{engineer.name}</h2><p className="mt-1 text-sm font-medium text-gray-600">{engineer.designation || 'Site Engineer'} · {engineer.empId}</p>
              <div className="mt-6 space-y-3 border-t border-amber-100 pt-5 text-sm text-gray-700"><p className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-amber-600" />{engineer.email || 'Email not available'}</p><p className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-amber-600" />{engineer.phone || 'Phone not available'}</p><p className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-amber-600" />{engineer.address || 'Address not available'}</p></div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm lg:col-span-3">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffbe2a] text-gray-900"><FileText size={20} /></span><div><h2 className="font-bold text-gray-900">Download payslip</h2><p className="text-sm text-gray-600">Choose a salary record to create your PDF.</p></div></div>
              {salaries.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-amber-200 p-6 text-center text-sm text-gray-600">No salary record is available yet. Please contact your administrator.</div> : <><div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]"><label className="text-sm font-semibold text-gray-800">Salary record<select value={selectedSalaryId} onChange={(event) => setSelectedSalaryId(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100">{salaries.map((salary) => <option key={salary.id} value={salary.id}>{payPeriod(salary.effectiveFrom)} — {money(salary.amount)}</option>)}</select></label><button type="button" onClick={downloadPayslip} disabled={!selectedSalary || downloading} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffbe2a] px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"><Download size={17} />{downloading ? 'Preparing...' : 'Download PDF'}</button></div>
                {selectedSalary && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Net pay for {payPeriod(selectedSalary.effectiveFrom)}</p><p className="mt-1 flex items-center gap-1 text-2xl font-black text-gray-900"><IndianRupee size={21} />{Number(selectedSalary.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-gray-700">No deductions are recorded for this salary entry.</p></div>}</>}
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-amber-200 bg-white shadow-sm"><div className="border-b border-amber-100 px-5 py-4"><h2 className="font-bold text-gray-900">Salary history</h2><p className="mt-0.5 text-sm text-gray-600">All recorded salary entries are retained here.</p></div>{salaries.length === 0 ? <p className="p-5 text-sm text-gray-600">No salary history yet.</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-amber-100 text-left text-xs font-bold uppercase tracking-wide text-gray-700"><tr><th className="px-5 py-3">Effective from</th><th className="px-5 py-3">Pay period</th><th className="px-5 py-3 text-right">Monthly salary</th><th className="px-5 py-3">Notes</th></tr></thead><tbody className="divide-y divide-amber-100">{salaries.map((salary) => <tr key={salary.id} className="hover:bg-amber-50"><td className="px-5 py-3.5 text-gray-700">{dateText(salary.effectiveFrom)}</td><td className="px-5 py-3.5 font-medium text-gray-700">{payPeriod(salary.effectiveFrom)}</td><td className="px-5 py-3.5 text-right font-bold text-gray-900">{money(salary.amount)}</td><td className="max-w-sm px-5 py-3.5 text-gray-600">{salary.notes || '—'}</td></tr>)}</tbody></table></div>}</section>
          </div>
        </>}
      </main>
    </div>
  );
};

export default EmployeeProfile;
