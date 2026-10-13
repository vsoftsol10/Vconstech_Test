import React, { useEffect, useState } from "react";
import { CalendarDays, IndianRupee, Plus, WalletCards, X } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(amount || 0));

const AdjustmentList = ({ title, items, onChange, addLabel }) => {
  const update = (index, field, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  return <div className="rounded-xl border border-gray-200 p-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-800">{title}</p><button type="button" onClick={() => onChange([...items, { name: '', amount: '' }])} className="shrink-0 rounded-lg bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200">+ {addLabel}</button></div>{items.length === 0 ? <p className="text-xs text-gray-400">No {title.toLowerCase()} added.</p> : <div className="space-y-2">{items.map((item, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_84px_auto] gap-2"><input required value={item.name} onChange={(e) => update(index, 'name', e.target.value)} placeholder={`${title.slice(0, -1)} name`} className="min-w-0 rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-yellow-400" /><input required min="0" step="0.01" type="number" value={item.amount} onChange={(e) => update(index, 'amount', e.target.value)} placeholder="Amount" className="min-w-0 rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-yellow-400" /><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg px-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${title.slice(0, -1)}`}><X size={16} /></button></div>)}</div>}</div>;
};

export const AddSalaryModal = ({ engineer, isOpen, isSubmitting, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");
  const [allowanceItems, setAllowanceItems] = useState([]);
  const [deductionItems, setDeductionItems] = useState([]);
  const [expenses, setExpenses] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setAllowances("");
      setDeductions("");
      setAllowanceItems([]);
      setDeductionItems([]);
      setExpenses("");
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [isOpen]);

  if (!isOpen || !engineer) return null;
  const submit = async (event) => {
    event.preventDefault();
    const success = await onSubmit({ amount, allowances, deductions, allowanceItems, deductionItems, expenses, effectiveFrom, notes });
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-3 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-salary-title">
      <form onSubmit={submit} className="mx-auto my-3 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl sm:my-0 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"><WalletCards className="h-5 w-5" /></span>
            <div><h3 id="add-salary-title" className="text-lg font-bold text-gray-900">Add salary</h3><p className="text-sm text-gray-500">{engineer.name} · {engineer.empId}</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <label className="block text-sm font-medium text-gray-700">Monthly salary
            <div className="relative mt-1.5"><IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input required min="1" step="0.01" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 35000" className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200" /></div>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><AdjustmentList title="Allowances" items={allowanceItems} onChange={setAllowanceItems} addLabel="Add allowance" /><AdjustmentList title="Deductions" items={deductionItems} onChange={setDeductionItems} addLabel="Add deduction" /></div>
          <label className="block text-sm font-medium text-gray-700">Other expenses <span className="font-normal text-gray-400">(optional)</span><div className="relative mt-1.5"><IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input min="0" step="0.01" type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="e.g. 500" className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200" /></div></label>
          <div className="hidden grid-cols-1 gap-3 sm:grid-cols-3">
            {[['Allowances', allowances, setAllowances, 'e.g. 2000'], ['Deductions', deductions, setDeductions, 'e.g. 1500'], ['Expenses', expenses, setExpenses, 'e.g. 500']].map(([label, value, setValue, placeholder]) => <label key={label} className="block text-sm font-medium text-gray-700">{label}<div className="relative mt-1.5"><IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input min="0" step="0.01" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200" /></div></label>)}
          </div>
          <label className="block text-sm font-medium text-gray-700">Effective from
            <div className="relative mt-1.5"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input required type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200" /></div>
          </label>
          <label className="block text-sm font-medium text-gray-700">Notes <span className="font-normal text-gray-400">(optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Salary revision, allowance details..." className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200" /></label>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3"><button type="button" onClick={onClose} className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 sm:flex-1">Cancel</button><button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"><Plus className="h-4 w-4" />{isSubmitting ? "Saving..." : "Add salary"}</button></div>
      </form>
    </div>
  );
};

export const SalaryHistoryModal = ({ engineer, isOpen, isLoading, salaries, onClose }) => {
  if (!isOpen || !engineer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="salary-history-title">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6"><div><h3 id="salary-history-title" className="text-lg font-bold text-gray-900">Salary history</h3><p className="mt-0.5 text-sm text-gray-500">{engineer.name} · {engineer.empId}</p></div><button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <div className="max-h-[55vh] overflow-auto">
          {isLoading ? <p className="p-10 text-center text-sm text-gray-500">Loading salary history...</p> : salaries.length === 0 ? <div className="p-10 text-center"><WalletCards className="mx-auto h-10 w-10 text-yellow-400" /><p className="mt-3 text-sm font-medium text-gray-700">No salary records yet</p><p className="mt-1 text-xs text-gray-400">Use “Add salary” from the actions menu to add the first record.</p></div> : <table className="min-w-full text-sm"><thead className="sticky top-0 bg-yellow-400 text-left text-xs font-bold uppercase tracking-wide text-black"><tr><th className="px-5 py-3">Effective from</th><th className="px-5 py-3 text-right">Monthly salary</th><th className="px-5 py-3">Notes</th></tr></thead><tbody className="divide-y divide-gray-100">{salaries.map((salary) => <tr key={salary.id} className="hover:bg-yellow-50/40"><td className="px-5 py-3.5 text-gray-700">{new Date(salary.effectiveFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(salary.amount)}</td><td className="max-w-xs px-5 py-3.5 text-gray-500">{salary.notes || "—"}</td></tr>)}</tbody></table>}
        </div>
        <div className="border-t border-gray-100 p-4 text-right"><button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Close</button></div>
      </div>
    </div>
  );
};
