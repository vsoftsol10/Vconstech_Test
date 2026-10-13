import {  X } from 'lucide-react';
import ModalShell from "../../common/ModalShell";


// Modal Component
const EmployeeModalMaterial = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  
  return (
    <ModalShell panelClassName="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
    </ModalShell>
  );
};


export default EmployeeModalMaterial
