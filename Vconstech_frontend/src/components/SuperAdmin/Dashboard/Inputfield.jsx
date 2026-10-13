import React from "react";

const InputField = ({
  field,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  error,
  disabled,
  children, // for password toggle button
  isTextarea = false,
  rows = 4,
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-800 tracking-wide">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className={`relative rounded-2xl transition-all duration-300 ${
          error
            ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
            : isFocused
            ? "ring-2 ring-[#ffbe2a] shadow-lg shadow-[#ffbe2a]/20"
            : "ring-1 ring-gray-200 hover:ring-gray-300"
        }`}
      >
        <div className={`flex ${isTextarea ? "items-start" : "items-center"} px-5 py-4 bg-gray-50 rounded-2xl`}>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              error ? "bg-red-500 shadow-md" : isFocused ? "bg-[#ffbe2a] shadow-md" : "bg-white"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                error ? "text-white" : isFocused ? "text-black" : "text-gray-400"
              }`}
            />
          </div>
          {isTextarea ? (
            <textarea
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
              onFocus={() => onFocus(field, true)}
              onBlur={() => onBlur(field, false)}
              rows={rows}
              className="flex-1 ml-4 w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none font-medium resize-y"
              placeholder={placeholder}
              disabled={disabled}
            />
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
              onFocus={() => onFocus(field, true)}
              onBlur={() => onBlur(field, false)}
              className="flex-1 ml-4 bg-transparent text-gray-900 placeholder-gray-400 outline-none font-medium"
              placeholder={placeholder}
              disabled={disabled}
            />
          )}
          {children}
        </div>
      </div>
      {error && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{error}</p>}
    </div>
  );
};

export default InputField;