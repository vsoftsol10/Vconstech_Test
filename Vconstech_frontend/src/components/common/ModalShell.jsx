const MODAL_OVERLAY_CLASS =
  "fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4";

const MODAL_PANEL_CLASS =
  "bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto";

const MODAL_PRIMARY_BUTTON_CLASS =
  "px-4 py-2.5 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed";

const MODAL_SECONDARY_BUTTON_CLASS =
  "px-4 py-2.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60";

const ModalShell = ({
  children,
  className = "",
  panelClassName = "",
  onBackdropClick,
  zIndexClass = "z-50",
}) => (
  <div
    className={`${MODAL_OVERLAY_CLASS} ${zIndexClass} ${className}`.trim()}
    onClick={onBackdropClick}
  >
    <div
      className={`${MODAL_PANEL_CLASS} ${panelClassName}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export {
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
  MODAL_PRIMARY_BUTTON_CLASS,
  MODAL_SECONDARY_BUTTON_CLASS,
};

export default ModalShell;
