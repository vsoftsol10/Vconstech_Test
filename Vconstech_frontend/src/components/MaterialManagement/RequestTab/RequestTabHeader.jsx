import React, { useRef, useState, useEffect } from "react";
import PortalDropdown from "./PortalDropdown";

const RequestTabHeader = ({
  materialTypeFilter,
  onTabSwitch,
  requestStatusFilter,
  onStatusFilterChange,
  selectedProjectFilter,
  onProjectFilterChange,
  projectNames,
}) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const sortBtnRef = useRef(null);
  const sortContentRef = useRef(null);
  const filterBtnRef = useRef(null);
  const filterContentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideSort =
        sortBtnRef.current?.contains(e.target) ||
        sortContentRef.current?.contains(e.target);
      if (!clickedInsideSort) setShowSortDropdown(false);

      const clickedInsideFilter =
        filterBtnRef.current?.contains(e.target) ||
        filterContentRef.current?.contains(e.target);
      if (!clickedInsideFilter) setShowFilterDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortLabel =
    requestStatusFilter === "All"
      ? "Sort by"
      : requestStatusFilter === "PENDING"
        ? "Pending"
        : requestStatusFilter === "APPROVED"
          ? "Accepted"
          : "Rejected";

  return (
    <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-200">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3">
        Material Requests
      </h2>

      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Tab Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit shadow-sm">
          <button
            onClick={() => onTabSwitch("global")}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              materialTypeFilter === "global"
                ? "bg-yellow-400 text-black"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Global Material
          </button>
          <button
            onClick={() => onTabSwitch("project")}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              materialTypeFilter === "project"
                ? "bg-yellow-400 text-black"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Project-Specific Material
          </button>
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-2">
          {/* ── Filter by Project ── */}
          {materialTypeFilter === "project" && (
            <div style={{ position: "relative" }}>
              <button
                ref={filterBtnRef}
                onClick={() => {
                  setShowFilterDropdown((p) => !p);
                  setShowSortDropdown(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  selectedProjectFilter !== "All"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                  />
                </svg>
                {selectedProjectFilter === "All"
                  ? "Filters"
                  : selectedProjectFilter}
                {selectedProjectFilter !== "All" && (
                  <span
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onProjectFilterChange("All");
                      setShowFilterDropdown(false);
                    }}
                    className="ml-1 text-yellow-600 hover:text-yellow-800 font-bold leading-none cursor-pointer"
                  >
                    ×
                  </span>
                )}
              </button>

              <PortalDropdown
                anchorRef={filterBtnRef}
                contentRef={filterContentRef}
                open={showFilterDropdown}
              >
                <div
                  ref={filterContentRef}
                  className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden w-56"
                >
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Filter by Project
                  </div>
                  {projectNames.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 italic">
                      No projects found
                    </div>
                  ) : (
                    ["All", ...projectNames].map((name) => (
                      <button
                        key={name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onProjectFilterChange(name);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                          selectedProjectFilter === name
                            ? "bg-yellow-50 text-yellow-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {name === "All" ? "All Projects" : name}
                        {selectedProjectFilter === name && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-yellow-500 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </PortalDropdown>
            </div>
          )}

          {/* ── Sort by Status ── */}
          <div style={{ position: "relative" }}>
            <button
              ref={sortBtnRef}
              onClick={() => {
                setShowSortDropdown((p) => !p);
                setShowFilterDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                requestStatusFilter !== "All"
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7h18M6 12h12M9 17h6"
                />
              </svg>
              {sortLabel}
              {requestStatusFilter !== "All" && (
                <span
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStatusFilterChange("All");
                    setShowSortDropdown(false);
                  }}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 font-bold leading-none cursor-pointer"
                >
                  ×
                </span>
              )}
            </button>

            <PortalDropdown
              anchorRef={sortBtnRef}
              contentRef={sortContentRef}
              open={showSortDropdown}
            >
              <div
                ref={sortContentRef}
                className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden w-44"
              >
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Sort by Status
                </div>
                {[
                  { label: "All", value: "All", color: "bg-gray-400" },
                  {
                    label: "Pending",
                    value: "PENDING",
                    color: "bg-yellow-400",
                  },
                  {
                    label: "Accepted",
                    value: "APPROVED",
                    color: "bg-green-500",
                  },
                  {
                    label: "Rejected",
                    value: "REJECTED",
                    color: "bg-red-500",
                  },
                ].map(({ label, value, color }) => (
                  <button
                    key={value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onStatusFilterChange(value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      requestStatusFilter === value
                        ? "bg-yellow-50 text-yellow-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${color} inline-block flex-shrink-0`}
                      />
                      {label}
                    </span>
                    {requestStatusFilter === value && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-yellow-500 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </PortalDropdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTabHeader;
