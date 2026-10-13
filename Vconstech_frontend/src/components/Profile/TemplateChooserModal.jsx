import React, { useEffect, useState } from 'react';
import { Eye, LockKeyhole, X } from 'lucide-react';
import ModalShell, { MODAL_PRIMARY_BUTTON_CLASS, MODAL_SECONDARY_BUTTON_CLASS } from '../common/ModalShell';
import { getPlanTemplateLimit } from '../../config/planTemplateLimits';
import { templates } from '../templates';

const TemplateCard = ({ template, selected, locked, onPreview, onSelect }) => (
  <article className={`rounded-xl border-2 bg-white p-3 transition ${selected ? 'border-[#ffb800] ring-2 ring-[#ffb800]/15' : 'border-[#e1e5eb]'} ${locked ? 'bg-[#fafbfc] opacity-65' : ''}`}>
    <div className="h-48 overflow-hidden rounded-sm border border-[#1e293b] bg-[#f4f5f7]">
      <img src={template.thumbnail} alt={`${template.name} portrait preview`} className="h-full w-full object-contain object-center" />
    </div>
    <div className="mt-3 flex items-center justify-between gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-[#16181d] cursor-pointer">
        <input type="radio" checked={selected} disabled={locked} onChange={onSelect} className="h-3.5 w-3.5 accent-[#087cf0]" />
        {template.name}
      </label>
      {locked && <LockKeyhole size={16} className="text-slate-400" aria-label="Locked; upgrade plan" />}
    </div>
    <div className="mt-3 flex gap-2">
      <button type="button" onClick={onPreview} className="rounded-lg bg-[#f1f3f6] px-3 py-1.5 text-xs font-semibold text-[#16181d] hover:bg-[#e5e8ec]"><Eye size={13} className="mr-1 inline" />Preview</button>
      <button type="button" disabled={locked} onClick={onSelect} className="rounded-lg bg-[#ffb800] px-3 py-1.5 text-xs font-semibold text-[#16181d] hover:bg-[#f0aa00] disabled:bg-[#e7e9ed] disabled:text-[#707782]">{locked ? 'Upgrade plan' : 'Select'}</button>
    </div>
  </article>
);

export default function TemplateChooserModal({ open, onClose, selectedTemplateId, plan, customTemplateLimit, onApply }) {
  const [pendingId, setPendingId] = useState(selectedTemplateId || 1);
  const [preview, setPreview] = useState(null);
  useEffect(() => { if (open) setPendingId(selectedTemplateId || 1); }, [open, selectedTemplateId]);
  if (!open) return null;
  const templateLimit = getPlanTemplateLimit(plan, customTemplateLimit);
  const changed = pendingId !== selectedTemplateId && pendingId <= templateLimit;
  return <>
    <ModalShell onBackdropClick={onClose} panelClassName="max-w-[1024px] overflow-hidden">
      <div className="flex items-start justify-between border-b border-[#1d1d1d] px-6 py-5">
        <div><h2 className="text-xl font-bold text-[#101114]">Choose Template</h2><p className="mt-1 text-sm font-medium text-[#758094]">Choose a design for all future invoices and quotations.</p></div>
        <button type="button" onClick={onClose} className="rounded p-1 text-black hover:bg-slate-100" aria-label="Close"><X size={24} /></button>
      </div>
      <div className="max-h-[64vh] overflow-y-auto bg-white px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => <TemplateCard key={template.id} template={template} selected={pendingId === template.id} locked={template.id > templateLimit} onPreview={() => setPreview(template)} onSelect={() => template.id <= templateLimit && setPendingId(template.id)} />)}
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-[#1d1d1d] bg-white px-6 py-5"><button className={MODAL_SECONDARY_BUTTON_CLASS} onClick={onClose}>Cancel</button><button className={MODAL_PRIMARY_BUTTON_CLASS} disabled={!changed} onClick={() => onApply(pendingId)}>Apply Template</button></div>
    </ModalShell>
    {preview && <ModalShell zIndexClass="z-[60]" onBackdropClick={() => setPreview(null)} panelClassName="max-w-5xl overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4"><div><h3 className="font-bold">{preview.name} Preview</h3><p className="text-sm text-slate-500">Portrait A4 design preview</p></div><button onClick={() => setPreview(null)} className="rounded p-1 hover:bg-slate-100" aria-label="Close preview"><X /></button></div>
      <div className="max-h-[78vh] overflow-auto bg-[#e5e7eb] p-5"><img src={preview.thumbnail} alt={`${preview.name} full portrait preview`} className="mx-auto block h-auto max-h-[70vh] w-auto max-w-full bg-white shadow-xl" /></div>
    </ModalShell>}
  </>;
}
